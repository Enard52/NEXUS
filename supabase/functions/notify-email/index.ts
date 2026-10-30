// NEXUS — Bildirim E-postası Edge Function
// -----------------------------------------
// Dışa dönük "E-posta" bildirim kanalının göndericisi. Karar: alıcı HER ZAMAN
// çağıran oturumun KENDİ e-postasıdır; gövdede adres kabul edilmez. Böylece
// işlev spam aracına dönüşemez ve istemcide saklanacak hiçbir gönderim
// anahtarı gerekmez (Telegram/ntfy'deki "sırrım cihazda kalır" ilkesinin
// e-postadaki karşılığı: sır hiç olmaz).
// Mail sağlayıcısı Resend'dir. Dağıtım (MANUEL):
//   supabase secrets set RESEND_API_KEY=re_...
//   supabase functions deploy notify-email
// RESEND_FROM verilmezse Resend'in test göndericisi (kendi adresine mail
// atmak için yeterli) kullanılır; kendi alan adın onaylıysa onu gir.

import { buildMessage, buildResendRequest, parseInput, providerError, recipientOf, withinLimit } from "./logic.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

// Hacim güvenliği: oturumlu kullanıcı kendine mail atıyor olsa da yumuşak bir saatlik tavan
// (kota patlamasın). Sayaç izole restart'ları arasında korunmaz.
const stamps = new Map<string, number[]>(); // userId -> gönderim zamanları

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("method", { status: 405, headers: CORS });

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return new Response("auth", { status: 401, headers: CORS });

  let body;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400, headers: CORS }); }

  const { title, detail, lang } = parseInput(body);

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const token = authHeader.slice("Bearer ".length);
  const { data: caller, error: callerErr } = await db.auth.getUser(token);
  const to = callerErr ? null : recipientOf(caller?.user);
  if (!to) return new Response("auth", { status: 401, headers: CORS });
  if (!withinLimit(stamps, caller.user.id, Date.now())) {
    return new Response(JSON.stringify({ ok: false, error: "rate" }), { status: 429, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY") || "";
  if (!apiKey) {
    return new Response(JSON.stringify({ ok: false, error: "RESEND_API_KEY yok" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const msg = buildMessage(title, detail, lang);
  const mail = buildResendRequest(apiKey, Deno.env.get("RESEND_FROM") || undefined, to, msg);
  const res = await fetch(mail.url, mail.init);
  if (!res.ok) {
    const errText = providerError(await res.text());
    return new Response(JSON.stringify({ ok: false, error: errText }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify({ ok: true, sent: true, to }), { headers: { ...CORS, "Content-Type": "application/json" } });
});
