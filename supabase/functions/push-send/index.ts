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

import {
  b64url, buildFcmSendBody, checkRate, classifyFcmStatus, collectUserIds, jwtUnsigned, MAX_USER_PAGES,
  parseSendFields, pemBody, selectTargets, USERS_PER_PAGE,
} from "./logic.ts";
import type { FcmOutcome } from "./logic.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const stamps = new Map<string, number[]>(); // userId -> gönderim zamanları

function withinLimit(userId: string, extraWeight = 0): boolean {
  return checkRate(stamps, userId, Date.now(), extraWeight);
}

// --- FCM HTTP v1: servis hesabı JWT'si ile OAuth2 erişim token'ı -------------
let cachedToken: { token: string; exp: number } | null = null;

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id: string;
};

async function importKey(pem: string): Promise<CryptoKey> {
  const body = pemBody(pem);
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
  const unsigned = jwtUnsigned(sa.client_email, now);
  const key = await importKey(sa.private_key);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const assertion = `${unsigned}.${b64url(new Uint8Array(sig))}`;
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

async function fcmSend(sa: ServiceAccount, token: string, title: string, body: string, data: Record<string, string>): Promise<FcmOutcome> {
  const { token: access, project } = await fcmAccessToken(sa);
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${project}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify(buildFcmSendBody(token, title, body, data)),
  });
  return classifyFcmStatus(res.ok, res.status); // 404/410 → token ölmüş (budanır)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("method", { status: 405, headers: CORS });

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return new Response("auth", { status: 401, headers: CORS });

  let body;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400, headers: CORS }); }

  const { action, title, msgBody, level, eventId } = parseSendFields(body);

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
  const targets = selectTargets(action, body.emails, callerEmail);
  if (!targets.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0, note: "alıcı yok" }), { headers: { ...CORS, "Content-Type": "application/json" } });
  }

  // Hedef kullanıcıları topla (admin listUsers sayfalı; küçük evler için yeterli)
  const userIds: string[] = [];
  let page = 1;
  for (; page <= MAX_USER_PAGES; page++) {
    const { data: listed } = await db.auth.admin.listUsers({ page, perPage: USERS_PER_PAGE });
    const users = listed?.users || [];
    collectUserIds(users, targets, userIds);
    if (users.length < USERS_PER_PAGE) break;
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
