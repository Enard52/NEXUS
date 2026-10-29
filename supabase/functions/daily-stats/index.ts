// NEXUS izleme -> Discord. pg_cron çağırır: her gün 06:00 UTC günlük özet, her saat başı sağlık denetimi (yalnızca sorun varsa yazar).
// Gizli bilgi yok: Discord adresi yalnızca DISCORD_WEBHOOK_URL ortam değişkeninden okunur.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

async function rest(path: string, init: RequestInit = {}): Promise<Response> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return await fetch(`${url}/rest/v1/${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
}

type Check = { name: string; url: string; method?: string; ok: (s: number) => boolean };
const REL = "https://github.com/Enard52/nexus-releases/releases/latest/download";
const CHECKS: Check[] = [
  { name: "Site", url: "https://nexus-smarthome.pages.dev/", ok: (s) => s === 200 },
  { name: "Yapay zekâ (Worker)", url: "https://nexus-ai.ensarharmanci52.workers.dev", method: "OPTIONS", ok: (s) => s === 200 || s === 204 },
  { name: "Ödeme webhook'u", url: "https://flbctyolowzcizwwzbke.supabase.co/functions/v1/whop-webhook", method: "POST", ok: (s) => s === 401 },
  { name: "Windows indirme", url: `${REL}/NEXUS-Setup.exe`, method: "HEAD", ok: (s) => s === 200 },
  { name: "Linux AppImage", url: `${REL}/NEXUS-linux.AppImage`, method: "HEAD", ok: (s) => s === 200 },
  { name: "Linux deb", url: `${REL}/NEXUS-linux.deb`, method: "HEAD", ok: (s) => s === 200 },
  { name: "Android APK", url: `${REL}/NEXUS-Android.apk`, method: "HEAD", ok: (s) => s === 200 },
];

async function health(): Promise<{ failed: string[]; total: number }> {
  const failed: string[] = [];
  await Promise.all(CHECKS.map(async (c) => {
    try {
      const r = await fetch(c.url, { method: c.method ?? "GET", signal: AbortSignal.timeout(12000), body: c.method === "POST" ? "{}" : undefined, headers: c.method === "POST" ? { "Content-Type": "application/json" } : undefined, redirect: "follow" });
      await r.body?.cancel();
      if (!c.ok(r.status)) failed.push(`${c.name} (HTTP ${r.status})`);
    } catch (_e) {
      failed.push(`${c.name} (yanıt yok)`);
    }
  }));
  return { failed, total: CHECKS.length };
}

async function post(hook: string, body: unknown): Promise<boolean> {
  const d = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return d.ok;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  const hook = Deno.env.get("DISCORD_WEBHOOK_URL");
  if (!hook) return new Response("discord webhook not configured", { status: 503 });
  let mode = "daily";
  try { const b = await req.json(); if (b && b.mode === "health") mode = "health"; } catch { /* varsayılan: günlük */ }

  if (mode === "health") {
    const h = await health();
    if (!h.failed.length) return Response.json({ ok: true, healthy: true });
    // Uç nokta herkese açık olduğundan 50 dk altında tekrar yazmaz.
    const since = new Date(Date.now() - 50 * 60 * 1000).toISOString();
    const recent = await rest(`nexus_stats_log?kind=eq.health&sent_at=gte.${encodeURIComponent(since)}&select=id&limit=1`);
    if (recent.ok && (await recent.json()).length) return Response.json({ ok: true, skipped: "recently sent" });
    await post(hook, { username: "NEXUS", content: `🚨 NEXUS sağlık denetimi: ${h.failed.length}/${h.total} sorun\n- ${h.failed.join("\n- ")}` });
    await rest("nexus_stats_log", { method: "POST", body: JSON.stringify({ kind: "health" }) });
    return Response.json({ ok: true, failed: h.failed });
  }

  // Günlük özet: herkese açık uç nokta olduğu için en fazla ~20 saatte bir (spam koruması).
  const since = new Date(Date.now() - 20 * 3600 * 1000).toISOString();
  const recent = await rest(`nexus_stats_log?kind=eq.daily&sent_at=gte.${encodeURIComponent(since)}&select=id&limit=1`);
  if (recent.ok && (await recent.json()).length) return Response.json({ ok: true, skipped: "recently sent" });
  const r = await rest("rpc/nexus_stats", { method: "POST", body: "{}" });
  if (!r.ok) return new Response("stats error", { status: 500 });
  const s = await r.json();
  const h = await health();
  // Ücretsiz plan sınırları (issue #12): DB boyutu 500 MB, MAU 50.000; %70'te uyarı.
  let dbSize = "bilinmiyor";
  try {
    const sz = await fetch(`${Deno.env.get("SUPABASE_URL")!}/rest/v1/rpc/nexus_db_size`, { method: "POST", headers: { apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`, "Content-Type": "application/json" }, body: "{}" });
    if (sz.ok) dbSize = String(await sz.text()).replace(/"/g, "");
  } catch { /* RPC yoksa sessiz geç */ }
  const limitWarn = dbSize !== "bilinmiyor" && parseFloat(dbSize) > 350 ? " ⚠️ %70+" : "";
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
      { name: "Ücretsiz plan", value: `DB boyutu: ${dbSize} MB / 500${limitWarn}  ·  Aktif kullanıcı (7g): ${s.active_7d ?? 0} / 50.000`, inline: false },
      { name: "Sistem sağlığı", value: h.failed.length ? `⚠️ ${h.failed.join(", ")}` : `✅ ${h.total}/${h.total} servis çalışıyor`, inline: false },
    ],
  };
  if (!(await post(hook, { username: "NEXUS", embeds: [embed] }))) return new Response("discord error", { status: 502 });
  await rest("nexus_stats_log", { method: "POST", body: JSON.stringify({ kind: "daily" }) });
  return Response.json({ ok: true });
});
