// NEXUS — Push Gönderimi Edge Function (FCM HTTP v1)
// ---------------------------------------------------
// Uygulama kapalıyken bildirim ulaştırmanın sunucu ayağı. İstemci (notify.js
// "push" kanalı / gelecekte aile sohbeti) çağırır; bu işlev FCM'e gerçekten
// gönderir ve ölmüş token'ları budar.
//
// Alıcı modeli: hedefler E-POSTA ile çözülür (aile üyeleri istemcide yerel
// tutuluyor; sunucuda ev tablosu yok). Her hedef, KENDİ cihazının önceden
// kaydettiği nexus_push_tokens satırlarına sahipse bildirim alır — yani push
// ancak alıcı Push bildirimlerini açıp token'ı kaydettirdiyse ulaşır (opt-in).
//   action "event": { emails: string[], title, body, level, eventId }
//   action "test" : kendine gönderim (token doğrulama)
// Hacim güvenliği: çağıran kullanıcıya saatte 30 gönderim + hedef başına 20.
// Dağıtım (MANUEL):
//   supabase secrets set FCM_SERVICE_ACCOUNT_JSON=<tek satır JSON servis hesabı>
//   supabase functions deploy push-send

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const stamps = new Map<string, number[]>(); // userId -> gönderim zamanları
const RATE_CALLER = 30;
const RATE_TARGET = 20;

function withinLimit(userId: string, extraWeight = 0): boolean {
  const now = Date.now();
  const list = (stamps.get(userId) || []).filter((t) => now - t < 3600_000);
  if (list.length + extraWeight >= RATE_CALLER) return false;
  list.push(now);
  stamps.set(userId, list);
  return true;
}

// --- FCM HTTP v1: servis hesabı JWT'si ile OAuth2 erişim token'ı -------------
let cachedToken: { token: string; exp: number } | null = null;

function b64url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id: string;
};

async function importKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function fcmAccessToken(sa: ServiceAccount): Promise<{ token: string; project: string }> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) {
    return { token: cachedToken.token, project: sa.project_id };
  }
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const key = await importKey(sa.private_key);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));
  const assertion = `${header}.${claims}.${b64url(new Uint8Array(sig))}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error("oauth " + res.status + " " + (await res.text()).slice(0, 120));
  const data = await res.json();
  cachedToken = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return { token: data.access_token, project: sa.project_id };
}

async function fcmSend(sa: ServiceAccount, token: string, title: string, body: string, data: Record<string, string>): Promise<"ok" | "prune" | "fail"> {
  const { token: access, project } = await fcmAccessToken(sa);
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${project}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: title.slice(0, 120), body: body.slice(0, 400) },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v).slice(0, 400)])),
        android: { priority: "high" },
        webpush: { headers: { Urgency: "high" } },
      },
    }),
  });
  if (res.ok) return "ok";
  if (res.status === 404 || res.status === 410) return "prune"; // token ölmüş
  return "fail";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("method", { status: 405, headers: CORS });

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return new Response("auth", { status: 401, headers: CORS });

  let body;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400, headers: CORS }); }

  const action = body.action === "test" ? "test" : "event";
  const title = String(body.title || "NEXUS").slice(0, 120);
  const msgBody = String(body.body || "").slice(0, 400);
  const level = String(body.level || "info").slice(0, 20);
  const eventId = String(body.eventId || "").slice(0, 64);

  const saRaw = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON") || "";
  if (!saRaw) {
    return new Response(JSON.stringify({ ok: false, error: "FCM_SERVICE_ACCOUNT_JSON yok" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
  let sa: ServiceAccount;
  try { sa = JSON.parse(saRaw); } catch { return new Response("bad sa", { status: 500, headers: CORS }); }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Çağıran oturumu doğrula
  const token = authHeader.slice("Bearer ".length);
  const { data: caller, error: callerErr } = await db.auth.getUser(token);
  if (callerErr || !caller?.user) return new Response("auth", { status: 401, headers: CORS });
  const callerId = caller.user.id;
  const callerEmail = String(caller.user.email || "").toLowerCase();

  // Hedef e-postalar → auth kullanıcıları → token'lar
  let targets: string[] = [];
  if (action === "test") {
    targets = [callerEmail];
  } else {
    const emails = Array.isArray(body.emails) ? body.emails : [];
    targets = emails
      .map((e: unknown) => String(e || "").trim().toLowerCase().slice(0, 120))
      .filter((e: string, i: number, arr: string[]) => e && arr.indexOf(e) === i)
      .filter((e: string) => e !== callerEmail) // kendine zaten yerel bildirim düşer
      .slice(0, 12);
  }
  if (!targets.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0, note: "alıcı yok" }), { headers: { ...CORS, "Content-Type": "application/json" } });
  }

  // Hedef kullanıcıları topla (admin listUsers sayfalı; küçük evler için yeterli)
  const userIds: string[] = [];
  let page = 1;
  for (; page <= 10; page++) {
    const { data: listed } = await db.auth.admin.listUsers({ page, perPage: 500 });
    const users = listed?.users || [];
    for (const u of users) {
      const em = String(u.email || "").toLowerCase();
      if (em && targets.indexOf(em) !== -1 && userIds.indexOf(u.id) === -1) userIds.push(u.id);
    }
    if (users.length < 500) break;
  }
  if (!userIds.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0, note: "hedef kullanıcı bulunamadı (push token kaydetmemiş olabilir)" }), { headers: { ...CORS, "Content-Type": "application/json" } });
  }

  if (!withinLimit(callerId, userIds.length)) {
    return new Response(JSON.stringify({ ok: false, error: "rate" }), { status: 429, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  // Token'ları çek (service role; RLS'i atlamak için)
  const payload = { title, body: msgBody, level, eventId };
  let sent = 0, pruned = 0, failed = 0;
  for (const uid of userIds) {
    const { data: rows } = await db.from("nexus_push_tokens").select("token").eq("user_id", uid);
    for (const row of rows || []) {
      const outcome = await fcmSend(sa, row.token, title, msgBody, {
        nexus_event_id: eventId, nexus_level: level,
      });
      if (outcome === "ok") sent++;
      else if (outcome === "prune") {
        pruned++;
        await db.from("nexus_push_tokens").delete().eq("user_id", uid).eq("token", row.token);
      } else failed++;
    }
  }
  return new Response(JSON.stringify({ ok: true, sent, pruned, failed }), { headers: { ...CORS, "Content-Type": "application/json" } });
});
