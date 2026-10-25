// Günlük NEXUS istatistiği -> Discord. pg_cron her gün 06:00 UTC'de çağırır.
// Gizli bilgi yok: Discord adresi yalnızca DISCORD_WEBHOOK_URL ortam değişkeninden okunur.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

async function rest(path: string, init: RequestInit = {}): Promise<Response> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return await fetch(`${url}/rest/v1/${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  const hook = Deno.env.get("DISCORD_WEBHOOK_URL");
  if (!hook) return new Response("discord webhook not configured", { status: 503 });
  // Herkese açık uç nokta olduğu için en fazla ~20 saatte bir gönderir (kötüye kullanım/spam koruması).
  const since = new Date(Date.now() - 20 * 3600 * 1000).toISOString();
  const recent = await rest(`nexus_stats_log?sent_at=gte.${encodeURIComponent(since)}&select=id&limit=1`);
  if (recent.ok && (await recent.json()).length) return Response.json({ ok: true, skipped: "recently sent" });
  const r = await rest("rpc/nexus_stats", { method: "POST", body: "{}" });
  if (!r.ok) return new Response("stats error", { status: 500 });
  const s = await r.json();
  const plusTry = (s.plus_try_monthly ?? 0) + (s.plus_try_yearly ?? 0);
  const plusUsd = (s.plus_usd_monthly ?? 0) + (s.plus_usd_yearly ?? 0);
  const embed = {
    title: "NEXUS günlük özet", color: 0x818cf8, timestamp: new Date().toISOString(),
    fields: [
      { name: "Kayıtlı hesap", value: `${s.users_total}  (doğrulanmış: ${s.confirmed_total})`, inline: true },
      { name: "Yeni kayıt", value: `24 saat: ${s.users_24h}\n7 gün: ${s.users_7d}`, inline: true },
      { name: "Aktif kullanıcı", value: `24 saat: ${s.active_24h}\n7 gün: ${s.active_7d}`, inline: true },
      { name: "NEXUS+ üye", value: `TRY: ${plusTry} (aylık ${s.plus_try_monthly}, yıllık ${s.plus_try_yearly})\nUSD: ${plusUsd} (aylık ${s.plus_usd_monthly}, yıllık ${s.plus_usd_yearly})\nİptal edecek: ${s.plus_cancelling}`, inline: false },
      { name: "Eşitlenen veri", value: `Hesap: ${s.synced_accounts}  ·  Cihaz kaydı: ${s.devices_synced}`, inline: false },
    ],
  };
  const d = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "NEXUS", embeds: [embed] }) });
  if (!d.ok) return new Response("discord error", { status: 502 });
  await rest("nexus_stats_log", { method: "POST", body: JSON.stringify({}) });
  return Response.json({ ok: true });
});
