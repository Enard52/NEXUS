// push-send için SAF mantık (Deno/ağ yok): istek alanı doğrulama, hedef e-posta süzgeci,
// kullanıcı eşleme, saatlik hız sınırı, FCM v1 gövdesi ve HTTP durum sınıflandırması.
// Ayrı dosyada durur ki vitest ile (packages/web/src/push-send.test.ts) sınanabilsin.

export const RATE_CALLER = 30;
export const RATE_WINDOW_MS = 3600_000;
export const MAX_TARGETS = 12;
export const USERS_PER_PAGE = 500;
export const MAX_USER_PAGES = 10;

export type PushAction = "test" | "event";

export interface SendFields {
  action: PushAction;
  title: string;
  msgBody: string;
  level: string;
  eventId: string;
}

// İstek gövdesi → kırpılmış alanlar. Eksik başlık "NEXUS", eksik düzey "info" olur.
export function parseSendFields(body: any): SendFields {
  return {
    action: body.action === "test" ? "test" : "event",
    title: String(body.title || "NEXUS").slice(0, 120),
    msgBody: String(body.body || "").slice(0, 400),
    level: String(body.level || "info").slice(0, 20),
    eventId: String(body.eventId || "").slice(0, 64),
  };
}

// Hedef e-postalar: "test" yalnızca çağıranın kendisi; "event" için normalleştir
// (kırp + küçük harf + ≤120), boşları ve tekrarları at, çağıranı çıkar, en çok 12.
export function selectTargets(action: PushAction, emails: unknown, callerEmail: string): string[] {
  if (action === "test") return [callerEmail];
  const list = Array.isArray(emails) ? emails : [];
  return list
    .map((e: unknown) =>
      String(e || "")
        .trim()
        .toLowerCase()
        .slice(0, 120),
    )
    .filter((e: string, i: number, arr: string[]) => e && arr.indexOf(e) === i)
    .filter((e: string) => e !== callerEmail) // kendine zaten yerel bildirim düşer
    .slice(0, MAX_TARGETS);
}

// Bir listUsers sayfasından hedeflerle eşleşen kullanıcı kimliklerini `into`ya ekler (tekrarsız).
export function collectUserIds(
  users: { id: string; email?: string | null }[],
  targets: string[],
  into: string[],
): string[] {
  for (const u of users) {
    const em = String(u.email || "").toLowerCase();
    if (em && targets.indexOf(em) !== -1 && into.indexOf(u.id) === -1) into.push(u.id);
  }
  return into;
}

// Saatlik pencere: çağıran başına kayıtlı gönderimler + yeni hedef sayısı >= 30 ise reddeder.
// Kabulde tek bir damga eklenir (davranış korunur: hedef ağırlığı damgaya yazılmaz).
export function checkRate(
  stamps: Map<string, number[]>,
  userId: string,
  now: number,
  extraWeight = 0,
): boolean {
  const list = (stamps.get(userId) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (list.length + extraWeight >= RATE_CALLER) return false;
  list.push(now);
  stamps.set(userId, list);
  return true;
}

export type FcmOutcome = "ok" | "prune" | "fail";

// FCM HTTP durumu → sonuç. 404/410 token'ın ölü olduğu anlamına gelir (budanır).
export function classifyFcmStatus(ok: boolean, status: number): FcmOutcome {
  if (ok) return "ok";
  if (status === 404 || status === 410) return "prune";
  return "fail";
}

// FCM v1 messages:send gövdesi: Android'de yüksek öncelik, web'de Urgency: high;
// veri değerleri string'e çevrilip 400 karaktere kırpılır.
export function buildFcmSendBody(
  token: string,
  title: string,
  body: string,
  data: Record<string, string>,
) {
  return {
    message: {
      token,
      notification: { title: title.slice(0, 120), body: body.slice(0, 400) },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v).slice(0, 400)])),
      android: { priority: "high" },
      webpush: { headers: { Urgency: "high" } },
    },
  };
}

export function b64url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// PEM (PKCS#8) → çıplak base64 gövde.
export function pemBody(pem: string): string {
  return pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
}

// Servis hesabı OAuth2 JWT'sinin "başlık.talepler" kısmı (imzasız).
export function jwtUnsigned(clientEmail: string, nowSec: number): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: nowSec,
      exp: nowSec + 3600,
    }),
  );
  return `${header}.${claims}`;
}
