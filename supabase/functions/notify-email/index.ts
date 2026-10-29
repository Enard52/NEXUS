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

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

// Hacim güvenliği: oturumlu kullanıcı kendine mail atıyor olsa da izole
// restart'ları arasında tutulabilen yumuşak bir saatlik tavan (kota patlamasın).
const MAX_PER_HOUR = 6;
const stamps = new Map<string, number[]>(); // userId -> gönderim zamanları

function withinLimit(userId: string): boolean {
  const now = Date.now();
  const list = (stamps.get(userId) || []).filter((t) => now - t < 3600_000);
  if (list.length >= MAX_PER_HOUR) return false;
  list.push(now);
  stamps.set(userId, list);
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("method", { status: 405, headers: CORS });

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return new Response("auth", { status: 401, headers: CORS });

  let body;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400, headers: CORS }); }

  const title = String(body.title || "Uyarı").slice(0, 120);
  const detail = String(body.detail || "").slice(0, 800);
  const lang = body.lang === "en" ? "en" : "tr";

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const token = authHeader.slice("Bearer ".length);
  const { data: caller, error: callerErr } = await db.auth.getUser(token);
  if (callerErr || !caller?.user?.email) return new Response("auth", { status: 401, headers: CORS });

  const to = String(caller.user.email).toLowerCase();
  if (!withinLimit(caller.user.id)) {
    return new Response(JSON.stringify({ ok: false, error: "rate" }), { status: 429, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY") || "";
  if (!apiKey) {
    return new Response(JSON.stringify({ ok: false, error: "RESEND_API_KEY yok" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const label = lang === "en" ? "Alert" : "Uyarı";
  const subject = "NEXUS · " + title;
  const text = [title, detail].filter(Boolean).join("\n") || label;
  const html =
    '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">' +
    '<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b">NEXUS · ' + label + "</p>" +
    '<h1 style="margin:0 0 12px;font-size:20px;color:#0f172a">' + escapeHtml(title) + "</h1>" +
    (detail ? '<p style="margin:0;font-size:14px;line-height:1.6;color:#334155">' + escapeHtml(detail) + "</p>" : "") +
    "</div>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM") || "NEXUS <onboarding@resend.dev>",
      to: [to],
      subject,
      text,
      html,
    }),
  });
  if (!res.ok) {
    const msg = (await res.text()).slice(0, 160);
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify({ ok: true, sent: true, to }), { headers: { ...CORS, "Content-Type": "application/json" } });
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
