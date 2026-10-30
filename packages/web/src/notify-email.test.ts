import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildMessage,
  buildResendRequest,
  DEFAULT_FROM,
  escapeHtml,
  MAX_PER_HOUR,
  parseInput,
  providerError,
  recipientOf,
  RESEND_URL,
  withinLimit,
} from "../../../supabase/functions/notify-email/logic";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const FN = readFileSync(
  join(REPO_ROOT, "supabase", "functions", "notify-email", "index.ts"),
  "utf8",
);

describe("notify-email — alıcı yalnızca oturum sahibi", () => {
  it("alıcı oturumun e-postasıdır (küçük harfe çevrilir)", () => {
    expect(recipientOf({ email: "Ayse@Example.COM" })).toBe("ayse@example.com");
  });

  it("e-postası olmayan / oturumsuz çağrı alıcı üretmez", () => {
    expect(recipientOf(null)).toBeNull();
    expect(recipientOf(undefined)).toBeNull();
    expect(recipientOf({ email: "" })).toBeNull();
    expect(recipientOf({})).toBeNull();
  });

  it("gövdedeki to/cc/bcc/from alanları ne ayrıştırmada ne istekte yer alır", () => {
    const input = parseInput({
      title: "t",
      detail: "d",
      to: "victim@x.com",
      cc: "a@x.com",
      bcc: "b@x.com",
      from: "boss@x.com",
    });
    expect(Object.keys(input).sort()).toEqual(["detail", "lang", "title"]);
    const req = buildResendRequest(
      "KEY",
      undefined,
      "me@example.com",
      buildMessage(input.title, input.detail, input.lang),
    );
    const sent = JSON.parse(req.init.body);
    expect(sent.to).toEqual(["me@example.com"]);
    expect(sent.cc).toBeUndefined();
    expect(sent.bcc).toBeUndefined();
    expect(sent.from).toBe(DEFAULT_FROM);
    expect(req.init.body).not.toContain("victim@x.com");
  });

  it("index.ts alıcıyı yalnızca doğrulanan oturumdan alır, gövdeden değil", () => {
    expect(FN).toMatch(/recipientOf\(caller\?\.user\)/);
    expect(FN).not.toMatch(/body\.(to|email|recipient|cc|bcc)/);
    expect(FN).toMatch(/Bearer /);
  });
});

describe("notify-email — girdi sınırları", () => {
  it("başlık 120, ayrıntı 800 karakterle kesilir", () => {
    const r = parseInput({ title: "t".repeat(5000), detail: "d".repeat(100000) });
    expect(r.title).toHaveLength(120);
    expect(r.detail).toHaveLength(800);
  });

  it("boş başlık varsayılana, bilinmeyen dil Türkçeye düşer; yalnızca 'en' İngilizce", () => {
    expect(parseInput({})).toEqual({ title: "Uyarı", detail: "", lang: "tr" });
    expect(parseInput({ lang: "EN" }).lang).toBe("tr");
    expect(parseInput({ lang: "en" }).lang).toBe("en");
  });

  it("dize olmayan değerler dizeye çevrilir (nesne kabul edilmez)", () => {
    const r = parseInput({ title: 42, detail: { a: 1 } });
    expect(r.title).toBe("42");
    expect(r.detail).toBe("[object Object]");
  });

  it("aşırı büyük girdiyle üretilen e-posta sınırlıdır", () => {
    const { title, detail, lang } = parseInput({
      title: "<".repeat(9999),
      detail: "&".repeat(9999),
    });
    const m = buildMessage(title, detail, lang);
    // en kötü durum: her karakter 4-5 karaktere genişler (&lt; / &amp;)
    expect(m.html.length).toBeLessThan(120 * 4 + 800 * 5 + 1000);
    expect(m.text.length).toBe(120 + 1 + 800);
  });
});

describe("notify-email — HTML / başlık enjeksiyonu", () => {
  it("escapeHtml beş özel karakteri kaçırır", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("başlık ve ayrıntıdaki etiketler HTML gövdesinde etkisizleşir", () => {
    const m = buildMessage("<script>alert(1)</script>", '<img src=x onerror="alert(2)">', "en");
    expect(m.html).not.toContain("<script>");
    expect(m.html).not.toContain("<img");
    expect(m.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(m.html).toContain("&lt;img src=x onerror=&quot;alert(2)&quot;&gt;");
  });

  it("öznitelik kırma denemesi (tırnak) kaçırılır", () => {
    const m = buildMessage('"><a href="https://evil.test">x</a>', "", "en");
    expect(m.html).not.toContain('<a href="https://evil.test">');
  });

  it("düz metin gövdede etiketler olduğu gibi ama HTML'e sızmadan kalır", () => {
    const m = buildMessage("<b>x</b>", "y", "en");
    expect(m.text).toBe("<b>x</b>\ny");
    expect(m.html).not.toContain("<b>x</b>");
  });

  it("ayrıntı boşsa paragraf eklenmez; ikisi de boşsa metin etiketi olur", () => {
    expect(buildMessage("T", "", "en").html).not.toContain('<p style="margin:0;font-size:14px');
    const m = buildMessage("", "", "en");
    expect(m.text).toBe("Alert");
    expect(buildMessage("", "", "tr").text).toBe("Uyarı");
  });

  it("CRLF içeren başlık konu satırında satır sonu taşımaz (başlık enjeksiyonu)", () => {
    const m = buildMessage("Merhaba\r\nBcc: victim@x.com\nX-Evil: 1", "", "tr");
    expect(m.subject).not.toMatch(/[\r\n]/);
    expect(m.subject.startsWith("NEXUS · Merhaba")).toBe(true);
  });

  it("konu 'NEXUS · ' önekini taşır", () => {
    expect(buildMessage("Kapı açık", "", "tr").subject).toBe("NEXUS · Kapı açık");
  });
});

describe("notify-email — saatlik hız sınırı", () => {
  it(`kullanıcı başına ${MAX_PER_HOUR} gönderim, sonrası reddedilir`, () => {
    const stamps = new Map<string, number[]>();
    const t = 1_000_000;
    for (let i = 0; i < MAX_PER_HOUR; i++) expect(withinLimit(stamps, "u1", t + i)).toBe(true);
    expect(withinLimit(stamps, "u1", t + 100)).toBe(false);
  });

  it("başka kullanıcının sayacı etkilenmez", () => {
    const stamps = new Map<string, number[]>();
    for (let i = 0; i < MAX_PER_HOUR; i++) withinLimit(stamps, "u1", 1000 + i);
    expect(withinLimit(stamps, "u2", 1100)).toBe(true);
  });

  it("bir saat sonra pencere kayar", () => {
    const stamps = new Map<string, number[]>();
    for (let i = 0; i < MAX_PER_HOUR; i++) withinLimit(stamps, "u1", 0);
    expect(withinLimit(stamps, "u1", 3_599_999)).toBe(false);
    expect(withinLimit(stamps, "u1", 3_600_000)).toBe(true);
  });

  it("reddedilen deneme sayaca eklenmez", () => {
    const stamps = new Map<string, number[]>();
    for (let i = 0; i < MAX_PER_HOUR; i++) withinLimit(stamps, "u1", 0);
    withinLimit(stamps, "u1", 10);
    expect(stamps.get("u1")).toHaveLength(MAX_PER_HOUR);
  });
});

describe("notify-email — sağlayıcı isteği ve hata dürüstlüğü", () => {
  const msg = { subject: "s", text: "t", html: "<p>h</p>" };

  it("Resend'e tek alıcıyla POST; anahtar yalnızca Authorization başlığında", () => {
    const req = buildResendRequest("re_dummy", "NEXUS <a@b.c>", "me@example.com", msg);
    expect(req.url).toBe(RESEND_URL);
    expect(req.init.method).toBe("POST");
    expect(req.init.headers.Authorization).toBe("Bearer re_dummy");
    expect(req.init.body).not.toContain("re_dummy");
    expect(JSON.parse(req.init.body)).toEqual({
      from: "NEXUS <a@b.c>",
      to: ["me@example.com"],
      subject: "s",
      text: "t",
      html: "<p>h</p>",
    });
  });

  it("RESEND_FROM yoksa varsayılan gönderici kullanılır", () => {
    expect(JSON.parse(buildResendRequest("k", undefined, "m@e.c", msg).init.body).from).toBe(
      DEFAULT_FROM,
    );
    expect(JSON.parse(buildResendRequest("k", "", "m@e.c", msg).init.body).from).toBe(DEFAULT_FROM);
  });

  it("sağlayıcı hata metni 160 karakterle kesilerek iletilir", () => {
    expect(providerError("x".repeat(1000))).toHaveLength(160);
    expect(providerError('{"message":"domain not verified"}')).toBe(
      '{"message":"domain not verified"}',
    );
  });

  it("index.ts sağlayıcı hatasını 500 + ok:false ile döner, başarıyı yalnızca res.ok sonrası bildirir", () => {
    const failAt = FN.indexOf("if (!res.ok)");
    const okAt = FN.indexOf("ok: true, sent: true");
    expect(failAt).toBeGreaterThan(-1);
    expect(okAt).toBeGreaterThan(failAt);
    expect(FN.slice(failAt, okAt)).toMatch(/ok: false, error: errText[\s\S]*status: 500/);
  });

  it("anahtar yoksa 500 döner ve hiçbir istek atılmaz; kodda anahtar gömülü değildir", () => {
    expect(FN.indexOf("RESEND_API_KEY yok")).toBeLessThan(FN.indexOf("fetch(mail.url"));
    expect(FN).not.toMatch(/re_[A-Za-z0-9]{8,}/);
  });
});
