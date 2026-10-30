import { describe, expect, it } from "vitest";
import {
  b64url,
  buildFcmSendBody,
  checkRate,
  classifyFcmStatus,
  collectUserIds,
  jwtUnsigned,
  parseSendFields,
  pemBody,
  RATE_CALLER,
  selectTargets,
} from "../../../supabase/functions/push-send/logic";

/** push-send Edge Function'ının saf mantığı (ağ/Deno yok). */

describe("push-send — parseSendFields", () => {
  it("varsayılanlar: boş gövde → event / NEXUS / info", () => {
    expect(parseSendFields({})).toEqual({
      action: "event",
      title: "NEXUS",
      msgBody: "",
      level: "info",
      eventId: "",
    });
  });

  it("yalnızca tam 'test' eylemi test sayılır; bilinmeyen eylem event olur", () => {
    expect(parseSendFields({ action: "test" })!.action).toBe("test");
    expect(parseSendFields({ action: "TEST" })!.action).toBe("event");
    expect(parseSendFields({ action: "wipe" })!.action).toBe("event");
  });

  it("aşırı uzun alanlar kırpılır (120/400/20/64)", () => {
    const f = parseSendFields({
      title: "t".repeat(500),
      body: "b".repeat(5000),
      level: "l".repeat(100),
      eventId: "e".repeat(300),
    })!;
    expect(f.title).toHaveLength(120);
    expect(f.msgBody).toHaveLength(400);
    expect(f.level).toHaveLength(20);
    expect(f.eventId).toHaveLength(64);
  });

  it("nesne olmayan JSON gövdesi (null, sayı, dizi, string) null döner — çağıran 400 verir", () => {
    for (const b of [null, 5, "x", true, [1, 2]]) expect(parseSendFields(b)).toBeNull();
  });

  it("string olmayan değerler string'e çevrilir, çökmez", () => {
    const f = parseSendFields({ title: 42, body: { a: 1 }, level: ["x"], eventId: true })!;
    expect(f.title).toBe("42");
    expect(f.msgBody).toBe("[object Object]");
    expect(f.level).toBe("x");
    expect(f.eventId).toBe("true");
  });
});

describe("push-send — selectTargets", () => {
  it("test eylemi yalnızca çağıranı hedefler, emails yok sayılır", () => {
    expect(selectTargets("test", ["a@x.com"], "me@x.com")).toEqual(["me@x.com"]);
  });

  it("normalleştirir: kırp + küçük harf", () => {
    expect(selectTargets("event", ["  Ali@X.com ", "BEKIR@x.com"], "me@x.com")).toEqual([
      "ali@x.com",
      "bekir@x.com",
    ]);
  });

  it("tekrarları (büyük/küçük harf farkı dahil) ve boşları atar", () => {
    expect(
      selectTargets(
        "event",
        ["a@x.com", "A@X.COM", "", null, undefined, "  ", "b@x.com"],
        "me@x.com",
      ),
    ).toEqual(["a@x.com", "b@x.com"]);
  });

  it("çağıranı hedeflerden çıkarır (kendine yerel bildirim düşer)", () => {
    expect(selectTargets("event", ["me@x.com", "a@x.com"], "me@x.com")).toEqual(["a@x.com"]);
  });

  it("en çok 12 hedef", () => {
    const many = Array.from({ length: 50 }, (_, i) => `u${i}@x.com`);
    const out = selectTargets("event", many, "me@x.com");
    expect(out).toHaveLength(12);
    expect(out[0]).toBe("u0@x.com");
    expect(out[11]).toBe("u11@x.com");
  });

  it("her e-posta 120 karaktere kırpılır", () => {
    const out = selectTargets("event", ["a".repeat(300) + "@x.com"], "me@x.com");
    expect(out[0]).toHaveLength(120);
  });

  it("dizi olmayan emails → boş liste", () => {
    expect(selectTargets("event", "a@x.com", "me@x.com")).toEqual([]);
    expect(selectTargets("event", undefined, "me@x.com")).toEqual([]);
    expect(selectTargets("event", { length: 1, 0: "a@x.com" }, "me@x.com")).toEqual([]);
    expect(selectTargets("event", [], "me@x.com")).toEqual([]);
  });
});

describe("push-send — collectUserIds", () => {
  const users = [
    { id: "1", email: "A@x.com" },
    { id: "2", email: "b@x.com" },
    { id: "3", email: null },
    { id: "4" },
    { id: "5", email: "other@x.com" },
  ];

  it("e-postayı büyük/küçük harf duyarsız eşler, eşleşmeyeni ve e-postasızı atlar", () => {
    expect(collectUserIds(users, ["a@x.com", "b@x.com"], [])).toEqual(["1", "2"]);
  });

  it("sayfalar arası tekrarsız birikir", () => {
    const acc: string[] = [];
    collectUserIds([{ id: "1", email: "a@x.com" }], ["a@x.com"], acc);
    collectUserIds(
      [
        { id: "1", email: "a@x.com" },
        { id: "2", email: "a@x.com" },
      ],
      ["a@x.com"],
      acc,
    );
    expect(acc).toEqual(["1", "2"]);
  });

  it("hedef yoksa hiçbir şey eklenmez", () => {
    expect(collectUserIds(users, [], [])).toEqual([]);
  });
});

describe("push-send — checkRate (saatlik pencere)", () => {
  it("30'a kadar tek tek kabul, sonra reddeder", () => {
    const stamps = new Map<string, number[]>();
    for (let i = 0; i < RATE_CALLER; i++) expect(checkRate(stamps, "u", 1000 + i, 0)).toBe(true);
    expect(checkRate(stamps, "u", 2000, 0)).toBe(false);
  });

  it("hedef sayısı ağırlık olarak sayılır: 29 kayıt + 1 hedef = reddedilir", () => {
    const stamps = new Map<string, number[]>([["u", Array.from({ length: 29 }, () => 1000)]]);
    expect(checkRate(stamps, "u", 1000, 1)).toBe(false);
    expect(checkRate(stamps, "u", 1000, 0)).toBe(true);
  });

  it("ret damga eklemez", () => {
    const stamps = new Map<string, number[]>();
    expect(checkRate(stamps, "u", 1000, RATE_CALLER)).toBe(false);
    expect(stamps.has("u")).toBe(false);
  });

  it("bir saatten eski damgalar düşer", () => {
    const stamps = new Map<string, number[]>([["u", Array.from({ length: 30 }, () => 0)]]);
    expect(checkRate(stamps, "u", 3600_000 - 1, 0)).toBe(false);
    expect(checkRate(stamps, "u", 3600_000, 0)).toBe(true);
    expect(stamps.get("u")).toEqual([3600_000]);
  });

  it("kullanıcılar birbirinden bağımsız", () => {
    const stamps = new Map<string, number[]>([["a", Array.from({ length: 30 }, () => 1000)]]);
    expect(checkRate(stamps, "a", 1000, 0)).toBe(false);
    expect(checkRate(stamps, "b", 1000, 0)).toBe(true);
  });
});

describe("push-send — classifyFcmStatus", () => {
  it("2xx → ok", () => expect(classifyFcmStatus(true, 200)).toBe("ok"));
  it("404 ve 410 → prune (ölü token silinir)", () => {
    expect(classifyFcmStatus(false, 404)).toBe("prune");
    expect(classifyFcmStatus(false, 410)).toBe("prune");
  });
  it("diğer hatalar → fail, token silinmez", () => {
    for (const s of [400, 401, 403, 429, 500, 503])
      expect(classifyFcmStatus(false, s)).toBe("fail");
  });
});

describe("push-send — buildFcmSendBody", () => {
  it("platform alanları: Android yüksek öncelik, web Urgency high", () => {
    const m = buildFcmSendBody("tok", "Başlık", "Gövde", {
      nexus_event_id: "e1",
      nexus_level: "warn",
    }).message;
    expect(m.token).toBe("tok");
    expect(m.notification).toEqual({ title: "Başlık", body: "Gövde" });
    expect(m.data).toEqual({ nexus_event_id: "e1", nexus_level: "warn" });
    expect(m.android).toEqual({ priority: "high" });
    expect(m.webpush).toEqual({ headers: { Urgency: "high" } });
  });

  it("başlık/gövde/veri değerleri kırpılır", () => {
    const m = buildFcmSendBody("t", "x".repeat(300), "y".repeat(900), {
      k: "z".repeat(900),
    }).message;
    expect(m.notification.title).toHaveLength(120);
    expect(m.notification.body).toHaveLength(400);
    expect(m.data.k).toHaveLength(400);
  });

  it("veri değerleri string'e çevrilir; boş veri boş nesne olur", () => {
    const m = buildFcmSendBody("t", "a", "b", { n: 5 as unknown as string }).message;
    expect(m.data).toEqual({ n: "5" });
    expect(buildFcmSendBody("t", "a", "b", {}).message.data).toEqual({});
  });

  it("JSON'a çevrilebilir ve token/gizli bilgi dışında alan sızdırmaz", () => {
    const parsed = JSON.parse(JSON.stringify(buildFcmSendBody("t", "a", "b", {})));
    expect(Object.keys(parsed.message).sort()).toEqual([
      "android",
      "data",
      "notification",
      "token",
      "webpush",
    ]);
  });
});

describe("push-send — JWT / PEM yardımcıları", () => {
  it("b64url: URL-güvenli, dolgusuz", () => {
    expect(b64url(new Uint8Array([251, 255, 254]))).toBe("-__-");
    expect(b64url("a")).toBe("YQ");
    expect(b64url("")).toBe("");
  });

  it("pemBody başlık/son ve boşlukları siler", () => {
    expect(pemBody("-----BEGIN PRIVATE KEY-----\nAAAA\nBB BB\n-----END PRIVATE KEY-----\n")).toBe(
      "AAAABBBB",
    );
  });

  it("jwtUnsigned: RS256 başlığı + firebase.messaging talepleri, 1 saat geçerli", () => {
    const [h, c, extra] = jwtUnsigned("svc@proj.iam.gserviceaccount.com", 1_700_000_000).split(".");
    expect(extra).toBeUndefined();
    const dec = (s: string) =>
      JSON.parse(Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    expect(dec(h)).toEqual({ alg: "RS256", typ: "JWT" });
    expect(dec(c)).toEqual({
      iss: "svc@proj.iam.gserviceaccount.com",
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    });
  });
});
