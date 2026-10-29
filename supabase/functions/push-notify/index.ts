// NEXUS — Sunucu bildirimi (FCM) Edge Function
// ------------------------------------------------
// YALNIZCA sunucu tarafından çağrılır: Supabase Database Webhook (INSERT) →
//   • household_messages        → aile mesajı
//   • household_activity (alert) → ev sahibinin açtığı kritik olay aktarımı
// İstemci uygulamalar bu fonksiyonu ÇAĞIRMAZ. Çağrı, webhook'a yazılan gizli başlıkla
// (x-webhook-secret = Supabase Secret PUSH_WEBHOOK_SECRET) doğrulanır.
//
// Secret'lar kodda/repoda YOK (Supabase Secrets):
//   FCM_SERVICE_ACCOUNT  Firebase servis hesabı JSON'u (tamamı)
//   PUSH_WEBHOOK_SECRET  webhook'un gönderdiği paylaşılan gizli anahtar
// İkisinden biri yoksa fonksiyon DÜRÜSTÇE "push yapılandırılmadı" döner; hiçbir şey gönderilmez.
//
// Üyenin bildirim ayarları (ana anahtar / kategori / rahatsız etme / sessiz saat) kapalı
// uygulamada istemci kodu çalışamadığı için SUNUCUDA uygulanır: istemci, ayarlarının kopyasını
// push_tokens.prefs'e yazar (uygulama her açıldığında ve ayar değişince tazelenir).
// Kısıt: ayar değiştirip uygulamayı tekrar açmadan arkaplanda kalan cihazda kopya eski kalabilir.
// Gönderen kendi cihazına bildirim almaz. Cihaz kimlik bilgisi / anahtar hiçbir zaman gönderilmez;
// yalnızca ev adı, gönderen adı ve ≤80 karakterlik önizleme.
// Dağıtım (MANUEL): supabase functions deploy push-notify --no-verify-jwt   (webhook JWT taşımaz;
// kimlik doğrulama gizli başlıkla yapılır)

import {
  b64url, buildFcmMessage, isDeadToken, jwtSigningInput, parseServiceAccount, parseWebhook,
  recipientsOf, safeEqual, shouldDeliver,
} from "./logic.ts";

const JSON_HEADERS = { "Content-Type": "application/json" };
const reply = (obj: unknown, status = 200) => new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });

let cachedToken: { value: string; exp: number } | null = null;

async function accessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.value;
  const pem = sa.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const input = jwtSigningInput(sa.client_email, now);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input)));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: input + "." + b64url(sig) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error("oauth_failed");
  cachedToken = { value: data.access_token, exp: now + Number(data.expires_in || 3300) };
  return cachedToken.value;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply({ ok: false, error: "method" }, 405);

  const secret = Deno.env.get("PUSH_WEBHOOK_SECRET") || "";
  const sa = parseServiceAccount(Deno.env.get("FCM_SERVICE_ACCOUNT"));
  if (!secret || !sa) {
    // Dürüst durum: yapılandırma yok → hiçbir şey gönderilmedi
    return reply({ ok: false, error: "push_not_configured", message: "Push yapılandırılmadı (FCM_SERVICE_ACCOUNT / PUSH_WEBHOOK_SECRET eksik)." }, 503);
  }
  if (!safeEqual(req.headers.get("x-webhook-secret") || "", secret)) return reply({ ok: false, error: "unauthorized" }, 401);

  let payload: unknown;
  try { payload = await req.json(); } catch { return reply({ ok: false, error: "bad_json" }, 400); }
  const job = parseWebhook(payload);
  if (!job) return reply({ ok: true, skipped: "ignored" });

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: home } = await db.from("households").select("name, share_alerts").eq("id", job.householdId).maybeSingle();
  if (!home) return reply({ ok: true, skipped: "no_household" });
  if (job.kind === "family-alert" && home.share_alerts !== true) return reply({ ok: true, skipped: "alerts_not_shared" });

  const { data: members } = await db.from("household_members").select("user_id").eq("household_id", job.householdId);
  const targets = recipientsOf((members || []).map((m: any) => m.user_id), job.senderId);
  if (!targets.length) return reply({ ok: true, sent: 0, skipped: "no_recipients" });

  const { data: tokens } = await db.from("push_tokens").select("token, user_id, prefs").in("user_id", targets);
  const now = Date.now();
  const eligible = (tokens || []).filter((t: any) => shouldDeliver(t.prefs, job.kind, now).ok);
  if (!eligible.length) return reply({ ok: true, sent: 0, skipped: "no_eligible_tokens" });

  let bearer: string;
  try { bearer = await accessToken(sa); } catch { return reply({ ok: false, error: "fcm_auth_failed" }, 502); }

  let sent = 0, failed = 0;
  const dead: string[] = [];
  for (const t of eligible) {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST",
      headers: { Authorization: "Bearer " + bearer, "Content-Type": "application/json" },
      body: JSON.stringify(buildFcmMessage(t.token, job, home.name || "Aile")),
    });
    if (res.ok) { sent++; continue; }
    failed++;
    const body = await res.json().catch(() => ({}));
    if (isDeadToken(res.status, body)) dead.push(t.token);
  }
  if (dead.length) await db.from("push_tokens").delete().in("token", dead);
  return reply({ ok: true, sent, failed, removedTokens: dead.length });
});
