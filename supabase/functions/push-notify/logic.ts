// push-notify için SAF mantık (Deno/ağ yok): girdi doğrulama, alıcı süzgeci, kullanıcı
// tercihi (ana anahtar / kategori / sessiz saat / rahatsız etme), FCM v1 gövdesi ve JWT
// yardımcıları. Ayrı dosyada durur ki vitest ile (packages/web/src/push.test.ts) sınanabilsin.

export type PushKind = "family-message" | "family-alert";

export interface PushJob {
  kind: PushKind;
  householdId: string;
  senderId: string;
  senderName: string;
  recordId: string;
  title: string;
  body: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clip(value: unknown, max: number): string {
  const s = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// Veritabanı webhook'u (INSERT) gövdesi → iş. Tanınmayan / geçersiz girdi null döner (işlem yapılmaz).
// Mesaj: household_messages INSERT. Uyarı: household_activity INSERT ve kind = 'alert'.
export function parseWebhook(payload: any): PushJob | null {
  if (!payload || payload.type !== "INSERT" || typeof payload.table !== "string") return null;
  const r = payload.record;
  if (!r || typeof r !== "object" || !UUID.test(String(r.household_id || "")) || !UUID.test(String(r.id || ""))) return null;
  if (payload.table === "household_messages") {
    if (!UUID.test(String(r.sender_id || ""))) return null;
    const body = clip(r.body, 80);
    if (!body) return null;
    return {
      kind: "family-message", householdId: r.household_id, senderId: r.sender_id,
      senderName: clip(r.sender_name, 60) || "Bir aile üyesi", recordId: r.id, title: "", body,
    };
  }
  if (payload.table === "household_activity" && r.kind === "alert") {
    if (!UUID.test(String(r.actor_id || ""))) return null;
    const title = clip(r.title, 100);
    if (!title) return null;
    return {
      kind: "family-alert", householdId: r.household_id, senderId: r.actor_id,
      senderName: clip(r.actor_name, 60) || "Bir aile üyesi", recordId: r.id, title, body: clip(r.detail, 80),
    };
  }
  return null;
}

// Gönderen kendi cihazına bildirim almaz; yinelenen alıcılar tekilleştirilir.
export function recipientsOf(memberIds: string[], senderId: string): string[] {
  const out: string[] = [];
  for (const id of memberIds) if (id && id !== senderId && out.indexOf(id) === -1) out.push(id);
  return out;
}

export interface PushPrefs {
  master?: boolean;
  family?: boolean;
  security?: boolean;
  quietEnabled?: boolean;
  quietStart?: string; // "23:00"
  quietEnd?: string; // "07:30"
  tzOffsetMin?: number; // UTC'ye göre dakika (doğu +)
  dndUntil?: number; // ms
  dndActive?: boolean;
}

function minutesOf(v: unknown): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(v || "").trim());
  if (!m) return null;
  const h = +m[1], mi = +m[2];
  return h > 23 || mi > 59 ? null : h * 60 + mi;
}

// Üyenin kendi bildirim ayarları (istemci cihazdan senkronlanan kopya). notify.js ile aynı kurallar:
// ana anahtar, kategori, rahatsız etme, sessiz saat (gece yarısını aşan aralık dahil).
// Tercih hiç yoksa varsayılan hepsi AÇIK (notify.js ile aynı).
export function shouldDeliver(prefs: PushPrefs | null | undefined, kind: PushKind, nowMs: number): { ok: boolean; reason: string } {
  const p = prefs || {};
  if (p.master === false) return { ok: false, reason: "master" };
  if (kind === "family-message" && p.family === false) return { ok: false, reason: "category" };
  if (kind === "family-alert" && p.security === false) return { ok: false, reason: "category" };
  if (p.dndActive === true || (typeof p.dndUntil === "number" && p.dndUntil > nowMs)) return { ok: false, reason: "dnd" };
  if (p.quietEnabled === true) {
    const start = minutesOf(p.quietStart || "23:00");
    const end = minutesOf(p.quietEnd || "07:30");
    if (start !== null && end !== null) {
      const off = typeof p.tzOffsetMin === "number" && isFinite(p.tzOffsetMin) ? p.tzOffsetMin : 0;
      const utcMin = Math.floor(nowMs / 60000) % 1440;
      const cur = (((utcMin + off) % 1440) + 1440) % 1440;
      const quiet = start === end ? true : start < end ? cur >= start && cur < end : cur >= start || cur < end;
      if (quiet) return { ok: false, reason: "quiet-hours" };
    }
  }
  return { ok: true, reason: "" };
}

// FCM HTTP v1 mesajı. `notification` bölümü uygulama KAPALIYKEN sistem tarafından gösterilir
// (istemci kodu çalışmaz — bu yüzden tercihler sunucuda uygulanır). data: dokununca açılacak sayfa.
export function buildFcmMessage(token: string, job: PushJob, homeName: string) {
  const title = job.kind === "family-message"
    ? clip(homeName, 40) + " · " + job.senderName
    : clip(homeName, 40) + " · " + job.senderName + ": " + job.title;
  const body = job.kind === "family-message" ? job.body : (job.body || "Aile üyesinin cihazından paylaşılan uyarı");
  return {
    message: {
      token,
      notification: { title, body },
      data: {
        kind: job.kind,
        household_id: job.householdId,
        record_id: job.recordId,
        page: "nexus-family-chat.html?home=" + job.householdId,
      },
      android: { priority: "HIGH", notification: { channel_id: "nexus-family", tag: job.kind + "-" + job.householdId } },
    },
  };
}

// Servis hesabı JSON'unu doğrula (içeriği ASLA loglama). Eksik / bozuksa null.
export function parseServiceAccount(raw: string | undefined | null): { project_id: string; client_email: string; private_key: string } | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw);
    if (j && typeof j.project_id === "string" && typeof j.client_email === "string" && typeof j.private_key === "string" && j.private_key.includes("BEGIN PRIVATE KEY")) {
      return { project_id: j.project_id, client_email: j.client_email, private_key: j.private_key };
    }
  } catch { /* geçersiz JSON */ }
  return null;
}

export function b64url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// OAuth JWT'sinin imzasız gövdesi (header.payload); imza Edge Function'da WebCrypto ile atılır.
export function jwtSigningInput(clientEmail: string, nowSec: number): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: nowSec,
    exp: nowSec + 3300,
  }));
  return header + "." + claims;
}

// Sabit zamanlı karşılaştırma (webhook gizli anahtarı için)
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length || !a.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// FCM'nin "bu token artık geçersiz" cevapları: token tablodan silinir.
export function isDeadToken(status: number, body: any): boolean {
  const code = String(body?.error?.details?.[0]?.errorCode || body?.error?.status || "");
  return status === 404 || code === "UNREGISTERED" || code === "INVALID_ARGUMENT" && /registration token/i.test(String(body?.error?.message || ""));
}
