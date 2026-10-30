// NEXUS — İstemci Hata Raporu Edge Function (issue #15, ücretsiz, gizlilik-dostu)
// -----------------------------------------------------------------------------
// İstemciden window.onerror ile gelen ANONİM hata kaydı: sayfa, sürüm, platform,
// mesaj. IP/e-posta/kullanıcı adı YOK. Hız sınırı: IP başına 10 dk'da 5 kayıt.
// Dağıtım (MANUEL): supabase functions deploy client-error
// Migration: 20261025_client_errors.sql

import { buildRow, CORS, createRateLimiter } from "./logic.ts";

// Basit bellek-içi hız sınırı (örnek başına; yoğunlukta kaba ama yeterli)
const allowed = createRateLimiter();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("method", { status: 405, headers: CORS });

  const ip = req.headers.get("cf-connecting-ip") || "local";
  if (!allowed(ip)) return new Response("rate", { status: 429, headers: CORS });

  let body;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400, headers: CORS }); }

  const row = buildRow(body);
  if (!row) return new Response("empty", { status: 400, headers: CORS });

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await db.from("nexus_client_errors").insert(row);
  if (error) return new Response("db", { status: 500, headers: CORS });

  return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, "Content-Type": "application/json" } });
});
