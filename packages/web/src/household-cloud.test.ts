import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * household-cloud.js bir tarayıcı IIFE'sidir. Sahte window + sahte nexusCloud (oturum,
 * rest) ile yüklenir; sunucu davranışı (RLS, RPC) burada değil migrasyon metninde ve
 * gerçek bir Supabase'de doğrulanır — bu testler istemci akışını ve dürüst durumları kapsar.
 */

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SRC = readFileSync(join(REPO_ROOT, "src", "app", "household-cloud.js"), "utf8");
const MIGRATION = readFileSync(
  join(REPO_ROOT, "supabase", "migrations", "20261029_households.sql"),
  "utf8",
);
const MIGRATION2 = readFileSync(
  join(REPO_ROOT, "supabase", "migrations", "20261030_households_activity.sql"),
  "utf8",
);
const INVITE_FN = readFileSync(
  join(REPO_ROOT, "supabase", "functions", "household-invite", "index.ts"),
  "utf8",
);
import {
  buildFcmMessage,
  isDeadToken,
  jwtSigningInput,
  parseServiceAccount,
  parseWebhook,
  recipientsOf,
  safeEqual,
  shouldDeliver,
} from "../../../supabase/functions/push-notify/logic";
const PUSH_FN = readFileSync(
  join(REPO_ROOT, "supabase", "functions", "push-notify", "index.ts"),
  "utf8",
);
const PUSH_MIG = readFileSync(
  join(REPO_ROOT, "supabase", "migrations", "20261031_push_tokens.sql"),
  "utf8",
);
const NOTIFY = readFileSync(join(REPO_ROOT, "src", "app", "notify.js"), "utf8");

type Call = { path: string; method: string; headers: Record<string, string>; body: any };

function makeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    get length() {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
  };
}

function load(
  opts: {
    enabled?: boolean;
    session?: { userId: string; email: string } | null;
    respond?: (call: Call) => unknown;
    invite?: (i: any) => Promise<any>;
    hidden?: boolean;
    capacitor?: unknown;
    fetch?: (url: string, init: any) => Promise<unknown>;
  } = {},
) {
  const storage = makeStorage();
  const calls: Call[] = [];
  const listeners: Record<string, Array<(e: any) => void>> = {};
  const dispatched: Array<{ type: string; detail: any }> = [];
  const enabled = opts.enabled !== false;
  const session =
    opts.session === undefined ? { userId: "u-me", email: "ben@ornek.com" } : opts.session;
  const win: Record<string, any> = {
    Capacitor: opts.capacitor,
    NEXUS_CLOUD: { url: "https://ornek.supabase.co", anonKey: "k".repeat(30) },
    nexusGetItem: (k: string) => storage.getItem(k),
    nexusSetItem: (k: string, v: string) => storage.setItem(k, v),
    addEventListener: (type: string, fn: (e: any) => void) => (listeners[type] ||= []).push(fn),
    dispatchEvent: (e: any) => {
      dispatched.push({ type: e.type, detail: e.detail });
      (listeners[e.type] || []).forEach((fn) => fn(e));
      return true;
    },
    CustomEvent: class {
      type: string;
      detail: any;
      constructor(t: string, i: any) {
        this.type = t;
        this.detail = i && i.detail;
      }
    },
    nexusCloud: {
      enabled: () => enabled,
      session: () => Promise.resolve(session),
      realtimeActive: () => false,
      rest: (path: string, o: any = {}) => {
        const call: Call = {
          path,
          method: o.method || "GET",
          headers: o.headers || {},
          body: o.body ? JSON.parse(o.body) : undefined,
        };
        calls.push(call);
        const out = opts.respond ? opts.respond(call) : [];
        if (out instanceof Error) return Promise.reject(out);
        return Promise.resolve(out);
      },
      sendHouseholdInvite: opts.invite || (() => Promise.resolve({ ok: true, sent: true })),
    },
  };
  const doc = {
    readyState: "complete",
    hidden: !!opts.hidden,
    addEventListener: () => {},
  };
  new Function(
    "window",
    "document",
    "CustomEvent",
    "setTimeout",
    "setInterval",
    "localStorage",
    "fetch",
    SRC,
  )(
    win,
    doc,
    win.CustomEvent,
    () => 0,
    () => 0,
    storage,
    opts.fetch || (() => Promise.resolve({ ok: true })),
  );
  return { hc: win.nexusHouseholdCloud, win, storage, calls, dispatched, listeners };
}

const serverErr = (message: string, status = 400) => Object.assign(new Error(message), { status });

const ROW = {
  id: "h-1",
  name: "Yazlık",
  location: "Bodrum",
  rooms: ["Salon"],
  created_at: "2026-10-29T10:00:00Z",
  household_members: [
    {
      user_id: "u-misafir",
      role: "guest",
      perms: { control: false, invite: false, settings: false },
      display_name: "Can",
      email: "can@ornek.com",
    },
    {
      user_id: "u-me",
      role: "owner",
      perms: { control: true, invite: true, settings: true },
      display_name: "Ben",
      email: "ben@ornek.com",
    },
  ],
};

describe("Aile — dürüst durumlar (3 durum)", () => {
  it("bulut kapalıyken sunucuya hiç gitmez ve nedeni söyler", async () => {
    const { hc, calls } = load({ enabled: false });
    expect(await hc.status()).toEqual({ ok: false, reason: "cloud-off" });
    const res = await hc.refresh();
    expect(res.ok).toBe(false);
    expect(res.homes).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("oturum yokken 'no-session' döner, ev uydurulmaz", async () => {
    const { hc, calls, storage } = load({ session: null });
    expect(await hc.status()).toEqual({ ok: false, reason: "no-session" });
    expect((await hc.refresh()).ok).toBe(false);
    expect(calls).toEqual([]);
    expect(storage.getItem("nexusHousehold")).toBeNull();
  });

  it("çevrimdışıyken refresh hata bildirir ve önbelleği bozmaz", async () => {
    let online = true;
    const { hc } = load({
      respond: () =>
        online ? [ROW] : new Error("Sunucuya ulaşılamadı. İnternet bağlantını kontrol et."),
    });
    expect((await hc.refresh()).ok).toBe(true);
    online = false;
    const res = await hc.refresh();
    expect(res.ok).toBe(false);
    expect(res.homes).toHaveLength(1); // son bilinen veri
    expect(hc.lastRefresh().ok).toBe(false);
  });

  it("yeni kullanıcı: sunucuda ev yoksa liste boş kalır (uydurma ev yok)", async () => {
    const { hc } = load({ respond: () => [] });
    const res = await hc.refresh();
    expect(res).toEqual({ ok: true, homes: [] });
  });
});

describe("Aile — modelin istemci tarafı", () => {
  it("evleri üyeleri ve izinleriyle kurar; sahip öne gelir; yerel evler korunur", async () => {
    const { hc, storage } = load({ respond: () => [ROW] });
    storage.setItem(
      "nexusHousehold",
      JSON.stringify([{ id: "home-local", name: "Eski", rooms: [], members: [] }]),
    );
    const res = await hc.refresh();
    const home = res.homes[0];
    expect(home.cloud).toBe(true);
    expect(home.members[0].role).toBe("Ev Sahibi");
    expect(home.members[1]).toMatchObject({
      role: "Misafir",
      perms: { control: false, invite: false, settings: false },
    });
    expect(home.myRole).toBe("owner");
    const stored = JSON.parse(storage.getItem("nexusHousehold") as string);
    expect(stored.map((h: any) => h.id)).toEqual(["h-1", "home-local"]);
    expect(stored[1].cloud).toBeUndefined();
  });

  it("izin kontrolü: sahip her şeyi yapar, misafir hiçbir şeyi", async () => {
    const asOwner = load({ respond: () => [ROW] });
    const home = (await asOwner.hc.refresh()).homes[0];
    expect(["control", "invite", "settings"].every((p) => asOwner.hc.can(home, p))).toBe(true);

    const asGuest = load({
      session: { userId: "u-misafir", email: "can@ornek.com" },
      respond: () => [ROW],
    });
    const gHome = (await asGuest.hc.refresh()).homes[0];
    expect(["control", "invite", "settings"].some((p) => asGuest.hc.can(gHome, p))).toBe(false);
    expect(asGuest.hc.canControl()).toBe(false); // tek evi var ve kontrol izni yok
    expect(asOwner.hc.canControl()).toBe(true);
  });

  it("hiç bulut evi yoksa cihaz kontrolü kısıtlanmaz", () => {
    const { hc } = load();
    expect(hc.canControl()).toBe(true);
  });

  it("RLS'in 0 satır döndürdüğü güncelleme sessizce başarılı sayılmaz", async () => {
    const { hc } = load({ respond: (c) => (c.method === "PATCH" ? [] : [ROW]) });
    await hc.refresh();
    await expect(hc.updateHome("h-1", { name: "Yeni" })).rejects.toThrow(
      "Bu işlem için iznin yok.",
    );
  });

  it("sunucu hata kodları anlaşılır Türkçe iletiye çevrilir", async () => {
    const { hc } = load({ respond: () => serverErr("last_owner") });
    await expect(hc.removeMember("h-1", "u-me")).rejects.toThrow(/tek sahibi/);
    const res = load({ respond: () => ({ ok: false, error: "email_mismatch" }) });
    await expect(res.hc.accept({ code: "NX-AAAA" })).rejects.toThrow(/başka bir e-posta/);
  });
});

describe("Aile — davet", () => {
  it("davet sunucuda açılır, e-posta yalnızca inviteId + kodla istenir", async () => {
    let sent: any = null;
    const { hc, calls } = load({
      respond: (c) =>
        c.path.endsWith("create_household_invite")
          ? [{ invite_id: "i-1", code: "NX-1A2B-3C4D-5E6F", expires_at: "x" }]
          : [ROW],
      invite: (i) => {
        sent = i;
        return Promise.resolve({ ok: true, sent: true });
      },
    });
    const res = await hc.invite("h-1", " Ayse@Ornek.com ", "Ayşe", "guest");
    const rpc = calls.find((c) => c.path.endsWith("create_household_invite"))!;
    expect(rpc.body).toEqual({
      p_household: "h-1",
      p_email: "Ayse@Ornek.com",
      p_name: "Ayşe",
      p_role: "guest",
    });
    expect(sent).toEqual({ inviteId: "i-1", email: "ayse@ornek.com", code: "NX-1A2B-3C4D-5E6F" });
    expect(res.mail).toBe("sent");
  });

  it("mail ulaşmazsa 'failed', hesap varsa 'existing-account' döner", async () => {
    const mk = (r: any) =>
      load({ respond: () => [{ invite_id: "i", code: "NX-X" }], invite: () => Promise.resolve(r) });
    expect((await mk({ ok: false }).hc.invite("h", "a@b.co", "A", "member")).mail).toBe("failed");
    expect(
      (await mk({ ok: true, alreadyAccount: true }).hc.invite("h", "a@b.co", "A", "member")).mail,
    ).toBe("existing-account");
  });

  it("kabul: kod sunucuya gider (yerelde aranmaz), başarı evleri yeniler", async () => {
    const { hc, calls } = load({
      respond: (c) =>
        c.path.includes("accept_household_invite") ? { ok: true, household_id: "h-1" } : [ROW],
    });
    const id = await hc.accept({ code: "NX-1A2B-3C4D-5E6F" });
    expect(id).toBe("h-1");
    const rpc = calls.find((c) => c.path.includes("accept_household_invite"))!;
    expect(rpc.body.p_code).toBe("NX-1A2B-3C4D-5E6F");
    expect(calls.some((c) => c.path.startsWith("/rest/v1/households"))).toBe(true);
  });
});

describe("Aile sohbeti", () => {
  it("gövde metne indirgenir: kontrol karakterleri atılır, HTML olduğu gibi kalır (basılırken esc)", () => {
    const { hc } = load();
    expect(hc._internal.cleanBody("  merhaba\u0000​ dünya \r\n\r\n\r\n\r\nson  ")).toBe(
      "merhaba dünya \n\nson",
    );
    expect(hc._internal.cleanBody("<img src=x onerror=alert(1)>")).toBe(
      "<img src=x onerror=alert(1)>",
    );
  });

  it("boş ve 1000 karakteri aşan mesaj sunucuya gitmez", async () => {
    const { hc, calls } = load();
    await expect(hc.sendMessage("h-1", "   \n ")).rejects.toThrow("Boş mesaj");
    await expect(hc.sendMessage("h-1", "x".repeat(1001))).rejects.toThrow("1000");
    expect(calls).toEqual([]);
  });

  it("hız sınırı: art arda gönderim istemcide durdurulur", async () => {
    const { hc, calls } = load({ respond: () => [{ id: "m" + calls.length, body: "a" }] });
    await hc.sendMessage("h-1", "bir");
    await expect(hc.sendMessage("h-1", "iki")).rejects.toThrow("Çok hızlı");
    expect(calls).toHaveLength(1);
    expect(calls[0].body).toEqual({ household_id: "h-1", body: "bir" }); // gönderen sunucuda atanır
  });

  it("sunucu hız sınırını (rate_limited) Türkçe bildirir; çevrimdışı hata dürüst", async () => {
    const a = load({ respond: () => serverErr("rate_limited") });
    await expect(a.hc.sendMessage("h-1", "x")).rejects.toThrow("Çok hızlı");
    const b = load({ respond: () => new TypeError("Failed to fetch") });
    await expect(b.hc.sendMessage("h-1", "x")).rejects.toThrow("Sunucuya ulaşılamadı");
  });

  it("gelen mesaj nexusEvents'e düşer — gönderen + kısa önizleme, özel (dış kanala gitmez), tekrarsız", async () => {
    const { hc, win, storage } = load({ respond: () => [ROW] });
    await hc.refresh();
    const row = {
      id: "m-9",
      household_id: "h-1",
      sender_id: "u-misafir",
      sender_name: "Can",
      body: "gizli içerik",
      created_at: "2026-10-29T11:00:00Z",
    };
    win.dispatchEvent({
      type: "nexusHouseholdRealtime",
      detail: { table: "household_messages", type: "INSERT", record: row },
    });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const events = JSON.parse(storage.getItem("nexusEvents") as string);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ id: "hmsg-m-9", type: "family" });
    expect(events[0].private).toBe(true);
    expect(events[0].title).toContain("Can");
    expect(events[0].detail).toBe("gizli içerik");
    hc._internal.pushEvent(row, "h-1", 1);
    expect(JSON.parse(storage.getItem("nexusEvents") as string)).toHaveLength(1);
  });
});

describe("Aile — bildirim hattı kuralları", () => {
  function notifyFor(page: Record<string, string>) {
    const storage = makeStorage();
    Object.entries(page).forEach(([k, v]) => storage.setItem(`nexusInstantNotif:${k}`, v));
    const win: Record<string, any> = {
      nexusGetItem: (k: string) => storage.getItem(k),
      nexusSetItem: (k: string, v: string) => storage.setItem(k, v),
      addEventListener: () => {},
    };
    new Function("window", "fetch", "document", NOTIFY)(
      win,
      () => Promise.reject(new Error("net")),
      { readyState: "loading", addEventListener: () => {} },
    );
    return win.nexusNotify;
  }

  it("Aile Mesajları kategorisi kapatılabilir; sessiz saat dışarı bildirimi keser", () => {
    const ev = { id: "hmsg-1", type: "family", title: "t", detail: "d", ts: Date.now() };
    expect(notifyFor({}).mutedBy(ev)).toBe("");
    expect(notifyFor({ "notif-family": "false" }).mutedBy(ev)).toBe("category");
    // diğer kategoriler etkilenmez
    expect(notifyFor({ "notif-family": "false" }).mutedBy({ id: "x", type: "scene" })).toBe("");
  });
});

describe("Aile — sunucu şeması ve Edge Function (statik)", () => {
  const tables = [
    "households",
    "household_members",
    "household_invites",
    "household_invite_secrets",
    "household_join_attempts",
    "household_messages",
  ];

  it("her tabloda RLS açık", () => {
    tables.forEach((t) =>
      expect(MIGRATION).toContain(`alter table public.${t} enable row level security`),
    );
  });

  it("davet kodu özeti ve deneme kaydı için istemci politikası YOK, Realtime'a davetler girmez", () => {
    expect(MIGRATION).not.toMatch(/create policy \w+ on public\.household_invite_secrets/);
    expect(MIGRATION).not.toMatch(/create policy \w+ on public\.household_join_attempts/);
    expect(MIGRATION).toMatch(/array\['households', 'household_members', 'household_messages'\]/);
    expect(MIGRATION).not.toMatch(/array\[[^\]]*household_invite/);
  });

  it("mesaj politikaları: yalnız üye okur/yazar, kendi mesajını siler; ev silinince cascade", () => {
    expect(MIGRATION).toMatch(
      /household_messages_insert[\s\S]*sender_id = \(select auth\.uid\(\)\) and public\.is_household_member/,
    );
    expect(MIGRATION).toMatch(
      /household_messages_delete[\s\S]*sender_id = \(select auth\.uid\(\)\)/,
    );
    expect(MIGRATION).toMatch(
      /household_id uuid not null references public\.households \(id\) on delete cascade,\s*sender_id/,
    );
    expect(MIGRATION).toContain("char_length(body) between 1 and 1000");
    expect(MIGRATION).toContain("rate_limited");
  });

  it("izinler sunucuda: rol/izin yalnız RPC, doğrudan üye yazması kapalı", () => {
    expect(MIGRATION).toContain("grant update (display_name) on public.household_members");
    expect(MIGRATION).toMatch(/set_household_member_access[\s\S]*is_household_owner/);
    expect(MIGRATION).toMatch(/households_update[\s\S]*household_perm\(id, 'settings'\)/);
    expect(MIGRATION).toMatch(
      /household_invites_select[\s\S]*household_perm\(household_id, 'invite'\)/,
    );
  });

  it("migrasyonda sır/anahtar yok", () => {
    expect(MIGRATION).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}|service_role_key|sk_live|password\s*=/i);
  });

  it("Edge Function: tüm kullanıcı sayfalarına bakar, davet sahibini ve kodu doğrular", () => {
    expect(INVITE_FN).not.toMatch(/perPage:\s*1\s*\}/);
    expect(INVITE_FN).toMatch(/for \(let page = 1;/);
    expect(INVITE_FN).toContain("invited_by !== caller.user.id");
    expect(INVITE_FN).toContain("household_invite_code_matches");
  });
});

describe("Aile — üye/davet yönetimi, etkinlik akışı, uyarı paylaşımı", () => {
  const SHARED = { ...ROW, share_alerts: true };

  it("süresi dolan davet expired:true gelir (yeniden gönderilebilir)", async () => {
    const { hc } = load({
      respond: () => [
        {
          id: "a",
          email: "a@b.co",
          role: "member",
          status: "pending",
          expires_at: "2020-01-01T00:00:00Z",
        },
        {
          id: "b",
          email: "b@b.co",
          role: "guest",
          status: "pending",
          expires_at: "2999-01-01T00:00:00Z",
        },
      ],
    });
    const rows = await hc.listInvites("h-1");
    expect(rows.map((r: any) => r.expired)).toEqual([true, false]);
  });

  it("sahiplik devri ve uyarı paylaşımı sunucu işlemlerini çağırır; hata Türkçe", async () => {
    const { hc, calls } = load({
      respond: (c) =>
        c.path.endsWith(
          "households?select=*,household_members(user_id,role,perms,display_name,email)&order=created_at.asc",
        )
          ? [ROW]
          : {},
    });
    await hc.transferOwnership("h-1", "u-misafir");
    await hc.setShareAlerts("h-1", true);
    expect(calls.find((c) => c.path.endsWith("transfer_household_ownership"))!.body).toEqual({
      p_household: "h-1",
      p_to: "u-misafir",
    });
    expect(calls.find((c) => c.path.endsWith("set_household_share_alerts"))!.body).toEqual({
      p_household: "h-1",
      p_on: true,
    });
    const bad = load({ respond: () => serverErr("forbidden") });
    await expect(bad.hc.transferOwnership("h-1", "x")).rejects.toThrow("iznin yok");
  });

  it("kritik olay: ilk çalıştırmada yalnız sahiplenilir; sonra yeni olay yalnız başlık+metinle paylaşılır", async () => {
    const { hc, storage, calls } = load({ respond: () => [SHARED] });
    await hc.refresh();
    storage.setItem(
      "nexusEvents",
      JSON.stringify([{ id: "old", type: "security", title: "Eski", detail: "x" }]),
    );
    expect(await hc.forwardAlerts()).toBe(0); // ilk tur: işaretle
    storage.setItem(
      "nexusEvents",
      JSON.stringify([
        { id: "old", type: "security", title: "Eski", detail: "x" },
        {
          id: "n1",
          type: "emergency",
          title: "Su baskını",
          detail: "Mutfak sensörü",
          token: "SIR",
        },
        { id: "halert-9", type: "security", title: "Aileden", detail: "" },
        { id: "s1", type: "scene", title: "Sahne", detail: "" },
      ]),
    );
    expect(await hc.forwardAlerts()).toBe(1);
    const rpcCalls = calls.filter((c) => c.path.endsWith("log_household_activity"));
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0].body).toEqual({
      p_household: "h-1",
      p_kind: "alert",
      p_title: "Su baskını",
      p_detail: "Mutfak sensörü",
    });
    expect(await hc.forwardAlerts()).toBe(0); // tekrar yok
  });

  it("paylaşım kapalıyken hiçbir uyarı sunucuya gitmez", async () => {
    const { hc, storage, calls } = load({ respond: () => [ROW] });
    await hc.refresh();
    await hc.forwardAlerts();
    storage.setItem(
      "nexusEvents",
      JSON.stringify([{ id: "n1", type: "security", title: "Kapı", detail: "" }]),
    );
    await hc.forwardAlerts();
    expect(calls.some((c) => c.path.endsWith("log_household_activity"))).toBe(false);
  });

  it("başkasının paylaştığı uyarı security olayı olur; kendi uyarısı ve diğer türler olay üretmez", async () => {
    const { hc, storage } = load({ respond: () => [SHARED] });
    await hc.refresh();
    const base = {
      household_id: "h-1",
      actor_name: "Can",
      title: "Kapı açıldı",
      detail: "Giriş",
      created_at: "x",
    };
    hc._internal.onActivity({ ...base, id: "a1", actor_id: "u-misafir", kind: "alert" });
    hc._internal.onActivity({ ...base, id: "a2", actor_id: "u-me", kind: "alert" });
    hc._internal.onActivity({ ...base, id: "a3", actor_id: "u-misafir", kind: "scene_run" });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const events = JSON.parse(storage.getItem("nexusEvents") as string);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ id: "halert-a1", type: "security", private: true });
  });

  it("senaryo çalıştırma yalnızca ad ile bildirilir; bulut evi yoksa sunucuya gitmez", async () => {
    const none = load();
    expect(await none.hc.reportScene("Film")).toBe(0);
    const { hc, calls } = load({ respond: () => [ROW] });
    await hc.refresh();
    await hc.reportScene("Film Modu");
    expect(calls.find((c) => c.path.endsWith("log_household_activity"))!.body).toEqual({
      p_household: "h-1",
      p_kind: "scene_run",
      p_title: "Film Modu",
      p_detail: "",
    });
  });

  it("private olay dış kanallara (ntfy/webhook/Telegram) gitmez, yalnız sistem bildirimine", async () => {
    const calls: string[] = [];
    const storage = makeStorage();
    storage.setItem(
      "nexusNotifyChannels",
      JSON.stringify({
        ntfy: { enabled: true, topic: "t" },
        webhook: { enabled: true, url: "https://x.y" },
        telegram: { enabled: true, token: "a", chat: "b" },
        system: { enabled: false },
      }),
    );
    const win: Record<string, any> = {
      nexusGetItem: (k: string) => storage.getItem(k),
      nexusSetItem: (k: string, v: string) => storage.setItem(k, v),
      addEventListener: () => {},
    };
    new Function("window", "fetch", "document", NOTIFY)(
      win,
      (u: string) => {
        calls.push(String(u));
        return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve("") });
      },
      { readyState: "loading", addEventListener: () => {} },
    );
    await win.nexusNotify.deliver({
      id: "hmsg-1",
      type: "family",
      private: true,
      title: "Aile · Can",
      detail: "selam",
      ts: Date.now(),
    });
    expect(calls).toEqual([]);
    await win.nexusNotify.deliver({
      id: "x-2",
      type: "scene",
      title: "Sahne",
      detail: "",
      ts: Date.now(),
    });
    expect(calls.length).toBeGreaterThan(0); // özel olmayan olay kanallara gider
  });

  it("v2 şema: etkinlik tablosu RLS'li, yalnız üye okur, istemci yazma politikası yok, devir tek-sahip korur", () => {
    expect(MIGRATION2).toContain("alter table public.household_activity enable row level security");
    expect(MIGRATION2).toMatch(
      /household_activity_select[\s\S]*is_household_member\(household_id\)/,
    );
    expect(MIGRATION2).not.toMatch(
      /create policy \w+ on public\.household_activity for (insert|update|delete)/,
    );
    expect(MIGRATION2).toMatch(/alerts_not_shared/);
    expect(MIGRATION2).toMatch(/set_household_share_alerts[\s\S]*is_household_owner/);
    expect(MIGRATION2).toMatch(
      /transfer_household_ownership[\s\S]*role = 'owner'[\s\S]*role = 'member'/,
    );
    expect(MIGRATION2).toContain("household_activity");
    expect(MIGRATION2).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}|service_role_key/);
  });
});
const U1 = "11111111-1111-4111-8111-111111111111";
const U2 = "22222222-2222-4222-8222-222222222222";
const U3 = "33333333-3333-4333-8333-333333333333";

describe("Sunucu bildirimi — push-notify mantığı", () => {
  const msg = (over: any = {}) => ({
    type: "INSERT",
    table: "household_messages",
    record: {
      id: U1,
      household_id: U2,
      sender_id: U3,
      sender_name: "Can",
      body: "  merhaba   dünya ",
      ...over,
    },
  });

  it("girdi doğrulama: yalnız geçerli INSERT mesajı / alert etkinliği iş olur", () => {
    expect(parseWebhook(msg())).toMatchObject({
      kind: "family-message",
      senderId: U3,
      body: "merhaba dünya",
      senderName: "Can",
    });
    expect(parseWebhook({ ...msg(), type: "DELETE" })).toBeNull();
    expect(parseWebhook(msg({ household_id: "x" }))).toBeNull();
    expect(parseWebhook(msg({ sender_id: "x" }))).toBeNull();
    expect(parseWebhook(msg({ body: "   " }))).toBeNull();
    expect(parseWebhook({ type: "INSERT", table: "baska", record: msg().record })).toBeNull();
    expect(parseWebhook(null)).toBeNull();
    const act = (kind: string) => ({
      type: "INSERT",
      table: "household_activity",
      record: {
        id: U1,
        household_id: U2,
        actor_id: U3,
        actor_name: "Can",
        kind,
        title: "Kapı",
        detail: "x",
      },
    });
    expect(parseWebhook(act("alert"))).toMatchObject({ kind: "family-alert", title: "Kapı" });
    expect(parseWebhook(act("scene_run"))).toBeNull(); // yalnız uyarılar push olur
  });

  it("önizleme 80 karaktere kısalır; gönderen kendi cihazına almaz, alıcılar tekil", () => {
    expect(parseWebhook(msg({ body: "a".repeat(200) }))!.body.length).toBe(80);
    expect(recipientsOf([U1, U2, U3, U2, ""], U3)).toEqual([U1, U2]);
  });

  it("üye tercihi: ana anahtar, kategori, DND ve gece yarısını aşan sessiz saat", () => {
    const at = (h: number, m = 0) => Date.UTC(2026, 9, 29, h, m); // UTC; tzOffset +180 → yerel = UTC+3
    expect(shouldDeliver(null, "family-message", at(12)).ok).toBe(true); // varsayılan: açık
    expect(shouldDeliver({ master: false }, "family-message", at(12))).toEqual({
      ok: false,
      reason: "master",
    });
    expect(shouldDeliver({ family: false }, "family-message", at(12)).reason).toBe("category");
    expect(shouldDeliver({ family: false }, "family-alert", at(12)).ok).toBe(true);
    expect(shouldDeliver({ security: false }, "family-alert", at(12)).reason).toBe("category");
    expect(shouldDeliver({ dndUntil: at(13) }, "family-message", at(12)).reason).toBe("dnd");
    expect(shouldDeliver({ dndUntil: at(11) }, "family-message", at(12)).ok).toBe(true);
    const quiet = { quietEnabled: true, quietStart: "23:00", quietEnd: "07:30", tzOffsetMin: 180 };
    expect(shouldDeliver(quiet, "family-message", at(21)).reason).toBe("quiet-hours"); // yerel 00:00
    expect(shouldDeliver(quiet, "family-message", at(10)).ok).toBe(true); // yerel 13:00
    expect(shouldDeliver(quiet, "family-message", at(4, 29)).reason).toBe("quiet-hours"); // yerel 07:29
    expect(shouldDeliver(quiet, "family-message", at(4, 30)).ok).toBe(true); // yerel 07:30
  });

  it("FCM gövdesi: ev adı + gönderen + önizleme, cihaz sırrı yok", () => {
    const job = parseWebhook(msg())!;
    const m = buildFcmMessage("tok", job, "Yazlık").message;
    expect(m.notification).toEqual({ title: "Yazlık · Can", body: "merhaba dünya" });
    expect(m.data.page).toBe("nexus-family-chat.html?home=" + U2);
    expect(JSON.stringify(m)).not.toMatch(/private_key|access_token|password/i);
  });

  it("servis hesabı: eksik/bozuk → null (yapılandırılmadı); geçerli → alanlar", () => {
    expect(parseServiceAccount(undefined)).toBeNull();
    expect(parseServiceAccount("{bozuk")).toBeNull();
    expect(
      parseServiceAccount(
        JSON.stringify({ project_id: "p", client_email: "a@b", private_key: "x" }),
      ),
    ).toBeNull();
    expect(
      parseServiceAccount(
        JSON.stringify({
          project_id: "p",
          client_email: "a@b",
          private_key: "-----BEGIN PRIVATE KEY-----\nabc",
        }),
      ),
    ).toMatchObject({ project_id: "p" });
    expect(jwtSigningInput("a@b", 1000).split(".")).toHaveLength(2);
  });

  it("gizli başlık karşılaştırma ve ölü token tespiti", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("", "")).toBe(false);
    expect(isDeadToken(404, {})).toBe(true);
    expect(isDeadToken(400, { error: { status: "UNREGISTERED" } })).toBe(true);
    expect(isDeadToken(500, {})).toBe(false);
  });

  it("Edge Function: secret'lar yalnız ortamdan; yapılandırma yoksa dürüst 503; repoda anahtar yok", () => {
    expect(PUSH_FN).toContain('Deno.env.get("FCM_SERVICE_ACCOUNT")');
    expect(PUSH_FN).toContain("push_not_configured");
    expect(PUSH_FN).toMatch(/x-webhook-secret/);
    expect(PUSH_FN).not.toMatch(/BEGIN PRIVATE KEY-----\n|"private_key":\s*"-----/);
    expect(PUSH_FN).toContain("recipientsOf");
  });

  it("push_tokens: RLS, yalnız kendi satırı; jeton taşıma yalnız RPC ile", () => {
    expect(PUSH_MIG).toContain("alter table public.push_tokens enable row level security");
    ["select", "insert", "update", "delete"].forEach((op) =>
      expect(PUSH_MIG).toMatch(new RegExp(`push_tokens_${op}_own on public.push_tokens for ${op}`)),
    );
    expect(PUSH_MIG).toContain("register_push_token");
    expect(PUSH_MIG).not.toMatch(/to anon/);
  });
});

describe("Sunucu bildirimi — istemci durumları (dürüst)", () => {
  const plugin = (over: any = {}) => {
    const handlers: Record<string, (e: any) => void> = {};
    return {
      handlers,
      addListener: (n: string, f: (e: any) => void) => {
        handlers[n] = f;
      },
      requestPermissions: () => Promise.resolve({ receive: "granted" }),
      createChannel: () => Promise.resolve(),
      register: () => {
        setTimeout(
          () => handlers.registration && handlers.registration({ value: "T".repeat(40) }),
          0,
        );
      },
      unregister: () => Promise.resolve(),
      ...over,
    };
  };
  const cap = (platform: string, p?: any) => ({
    getPlatform: () => platform,
    Plugins: p ? { PushNotifications: p } : {},
  });

  it("web/masaüstü kapsam dışı, iOS dürüstçe 'henüz yok'", async () => {
    expect((await load().hc.pushStatus()).state).toBe("unsupported");
    const ios = await load({ capacitor: cap("ios") }).hc.pushStatus();
    expect(ios.state).toBe("ios");
    expect(ios.text).toContain("henüz yok");
  });

  it("Android: bulut kapalı / oturum yok / eklenti yok → 'açık' denmez", async () => {
    expect(
      (await load({ enabled: false, capacitor: cap("android", plugin()) }).hc.pushStatus()).state,
    ).toBe("cloud-off");
    expect(
      (await load({ session: null, capacitor: cap("android", plugin()) }).hc.pushStatus()).state,
    ).toBe("no-session");
    const none = await load({ capacitor: cap("android") }).hc.pushStatus();
    expect(none.state).toBe("no-plugin");
    expect(none.text).toBe("Sunucu bildirimi bu sürümde yapılandırılmadı.");
  });

  it("izin + token alındı → sunucuya yazılır ve ANCAK ŞİMDİ 'registered'", async () => {
    const p = plugin();
    const { hc, calls, storage } = load({ capacitor: cap("android", p) });
    expect((await hc.pushStatus()).state).toBe("off");
    const res = await hc.enablePush();
    expect(res.state).toBe("registered");
    const rpc = calls.find((c) => c.path.endsWith("register_push_token"))!;
    expect(rpc.body.p_token).toBe("T".repeat(40));
    expect(rpc.body.p_platform).toBe("android");
    expect(rpc.body.p_prefs).toMatchObject({ master: true, family: true, security: true });
    expect(storage.getItem("nexusPushToken")).toBe("T".repeat(40));
  });

  it("google-services.json yok (kayıt hatası) → 'yapılandırılmadı', sahte açık yok, token yazılmaz", async () => {
    const p = plugin({
      register: () => {
        setTimeout(() => p.handlers.registrationError({ error: "FirebaseApp yok" }), 0);
      },
    });
    const { hc, calls } = load({ capacitor: cap("android", p) });
    const res = await hc.enablePush();
    expect(res.state).toBe("not-configured");
    expect(calls.some((c) => c.path.endsWith("register_push_token"))).toBe(false);
  });

  it("izin reddedilirse 'denied'", async () => {
    const p = plugin({ requestPermissions: () => Promise.resolve({ receive: "denied" }) });
    expect((await load({ capacitor: cap("android", p) }).hc.enablePush()).state).toBe("denied");
  });

  it("kapatma: token sunucudan silinir, durum 'off'", async () => {
    const p = plugin();
    const { hc, calls, storage } = load({ capacitor: cap("android", p) });
    await hc.enablePush();
    const res = await hc.disablePush();
    expect(res.state).toBe("off");
    const del = calls.find(
      (c) => c.method === "DELETE" && c.path.startsWith("/rest/v1/push_tokens?token=eq."),
    )!;
    expect(del).toBeTruthy();
    expect(storage.getItem("nexusPushToken")).toBe("");
  });

  it("çıkış: oturum silinmeden token DELETE'i başlatılır, yerel durum sıfırlanır", async () => {
    const fetched: Array<{ url: string; init: any }> = [];
    const p = plugin();
    const { hc, storage } = load({
      capacitor: cap("android", p),
      fetch: (url, init) => {
        fetched.push({ url, init });
        return Promise.resolve({ ok: true });
      },
    });
    await hc.enablePush();
    hc.onSignOut({ accessToken: "AT" });
    expect(fetched).toHaveLength(1);
    expect(fetched[0].url).toBe(
      "https://ornek.supabase.co/rest/v1/push_tokens?token=eq." + "T".repeat(40),
    );
    expect(fetched[0].init.method).toBe("DELETE");
    expect(fetched[0].init.headers.Authorization).toBe("Bearer AT");
    expect(storage.getItem("nexusPushEnabled")).toBe("false");
    expect(storage.getItem("nexusPushToken")).toBe("");
  });

  it("ayar kopyası: ana anahtar/kategori/sessiz saat sunucuya gider; kayıtlı değilse hiçbir şey gitmez", async () => {
    const p = plugin();
    const { hc, calls, storage } = load({ capacitor: cap("android", p) });
    expect(await hc.syncPushPrefs()).toBe(false);
    await hc.enablePush();
    storage.setItem("nexusInstantNotif:notif-family", "false");
    storage.setItem("nexusInstantNotif:quietEnabled", "true");
    await hc.syncPushPrefs();
    const last = calls.filter((c) => c.path.endsWith("register_push_token")).pop()!;
    expect(last.body.p_prefs).toMatchObject({
      family: false,
      quietEnabled: true,
      quietStart: "23:00",
    });
  });

  it("push'la zaten gösterilen yakalama olayı pushed işaretlenir; canlı olay işaretlenmez", async () => {
    const p = plugin();
    const { hc, storage } = load({ capacitor: cap("android", p), respond: () => [ROW] });
    await hc.refresh();
    await hc.enablePush();
    const row = {
      id: "m1",
      sender_id: "u-misafir",
      sender_name: "Can",
      body: "x",
      created_at: "t",
    };
    hc._internal.pushEvent(row, "h-1", 1, true);
    hc._internal.pushEvent({ ...row, id: "m2" }, "h-1", 1);
    const ev = JSON.parse(storage.getItem("nexusEvents") as string);
    expect(ev.find((e: any) => e.id === "hmsg-m1").pushed).toBe(true);
    expect(ev.find((e: any) => e.id === "hmsg-m2").pushed).toBe(false);
  });
});
