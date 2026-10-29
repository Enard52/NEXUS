// NEXUS izleme -> Discord. pg_cron çağırır: her gün 06:00 UTC günlük pano, her saat başı sağlık denetimi
// (yalnızca sorun varsa yazar). Gizli bilgi yok: Discord adresi yalnızca DISCORD_WEBHOOK_URL ortam değişkeninden okunur.
// Gösterilen her sayı gerçek bir kaynaktan gelir (veritabanı sayımı, GitHub API, canlı uç nokta denetimi);
// bir kaynak okunamazsa "–" yazılır, sayı uydurulmaz.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPA = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AUTH = { apikey: KEY, Authorization: "Bearer " + KEY };

async function rest(path: string, init: RequestInit = {}): Promise<Response> {
  return await fetch(SUPA + "/rest/v1/" + path, { ...init, headers: { ...AUTH, "Content-Type": "application/json", ...(init.headers ?? {}) } });
}

// Satır sayısı (PostgREST HEAD + Prefer: count=exact). Okunamazsa null.
async function count(table: string, filter = ""): Promise<number | null> {
  try {
    const r = await fetch(SUPA + "/rest/v1/" + table + "?select=*" + filter, { method: "HEAD", headers: { ...AUTH, Prefer: "count=exact" }, signal: AbortSignal.timeout(8000) });
    const total = (r.headers.get("content-range") || "").split("/")[1];
    return r.ok && total && total !== "*" ? Number(total) : null;
  } catch (_e) { return null; }
}

async function gh(path: string): Promise<any | null> {
  try {
    const r = await fetch("https://api.github.com/" + path, { headers: { "User-Agent": "nexus-monitor", Accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(10000) });
    return r.ok ? await r.json() : null;
  } catch (_e) { return null; }
}

const n = (v: unknown): string => (typeof v === "number" && isFinite(v) ? v.toLocaleString("tr-TR") : "–");

type Check = { name: string; url: string; method?: string; ok: (s: number) => boolean; hint?: (s: number) => string };
const REL = "https://github.com/Enard52/nexus-releases/releases/latest/download";
const FN = SUPA + "/functions/v1/";
const CHECKS: Check[] = [
  { name: "Site", url: "https://nexus-smarthome.pages.dev/", ok: (s) => s === 200 },
  { name: "Yapay zekâ (Worker)", url: "https://nexus-ai.nexus-smarthome.workers.dev", method: "OPTIONS", ok: (s) => s === 200 || s === 204 },
  { name: "Ödeme webhook'u", url: FN + "whop-webhook", method: "POST", ok: (s) => s === 401 },
  { name: "Aile daveti", url: FN + "household-invite", method: "POST", ok: (s) => s === 401 },
  { name: "Web push", url: FN + "push-send", method: "POST", ok: (s) => s === 401 },
  { name: "Sunucu bildirimi", url: FN + "push-notify", method: "POST", ok: (s) => s === 401, hint: (s) => (s === 503 ? "FCM secret'ları eksik" : "") },
  { name: "Windows indirme", url: REL + "/NEXUS-Setup.exe", method: "HEAD", ok: (s) => s === 200 },
  { name: "Linux AppImage", url: REL + "/NEXUS-linux.AppImage", method: "HEAD", ok: (s) => s === 200 },
  { name: "Linux deb", url: REL + "/NEXUS-linux.deb", method: "HEAD", ok: (s) => s === 200 },
  { name: "Android APK", url: REL + "/NEXUS-Android.apk", method: "HEAD", ok: (s) => s === 200 },
];

async function health(): Promise<{ failed: string[]; total: number }> {
  const failed: string[] = [];
  await Promise.all(CHECKS.map(async (c) => {
    try {
      const isPost = c.method === "POST";
      const r = await fetch(c.url, { method: c.method ?? "GET", signal: AbortSignal.timeout(12000), body: isPost ? "{}" : undefined, headers: isPost ? { "Content-Type": "application/json" } : undefined, redirect: "follow" });
      await r.body?.cancel();
      if (!c.ok(r.status)) {
        const extra = c.hint ? c.hint(r.status) : "";
        failed.push(c.name + " (HTTP " + r.status + (extra ? ", " + extra : "") + ")");
      }
    } catch (_e) {
      failed.push(c.name + " (yanıt yok)");
    }
  }));
  return { failed, total: CHECKS.length };
}

async function post(hook: string, body: unknown): Promise<boolean> {
  const d = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return d.ok;
}

function bar(pct: number): string {
  const p = Math.max(0, Math.min(100, pct));
  const filled = Math.round(p / 10);
  return "▰".repeat(filled) + "▱".repeat(10 - filled) + " " + Math.round(p) + "%";
}

function ago(iso: string): string {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
  return h < 1 ? "az önce" : h < 48 ? h + " sa önce" : Math.round(h / 24) + " gün önce";
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
    const recent = await rest("nexus_stats_log?kind=eq.health&sent_at=gte." + encodeURIComponent(since) + "&select=id&limit=1");
    if (recent.ok && (await recent.json()).length) return Response.json({ ok: true, skipped: "recently sent" });
    const embed = {
      title: "🚨 NEXUS sağlık denetimi: " + h.failed.length + "/" + h.total + " sorun",
      description: h.failed.map((f) => "❌ " + f).join("\n"),
      color: 0xef4444,
      timestamp: new Date().toISOString(),
      footer: { text: "Sorun sürerse saatte bir hatırlatılır" },
    };
    await post(hook, { username: "NEXUS", embeds: [embed] });
    await rest("nexus_stats_log", { method: "POST", body: JSON.stringify({ kind: "health" }) });
    return Response.json({ ok: true, failed: h.failed });
  }

  // Günlük pano: herkese açık uç nokta olduğu için en fazla ~20 saatte bir (spam koruması).
  const since = new Date(Date.now() - 20 * 3600 * 1000).toISOString();
  const recent = await rest("nexus_stats_log?kind=eq.daily&sent_at=gte." + encodeURIComponent(since) + "&select=id&limit=1");
  if (recent.ok && (await recent.json()).length) return Response.json({ ok: true, skipped: "recently sent" });
  const r = await rest("rpc/nexus_stats", { method: "POST", body: "{}" });
  if (!r.ok) return new Response("stats error", { status: 500 });
  const s = await r.json();

  const day = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [h, homes, members, pendingInv, msgs24, tokAndroid, tokWeb, repo, rels, runs] = await Promise.all([
    health(),
    count("households"),
    count("household_members"),
    count("household_invites", "&status=eq.pending&expires_at=gt." + encodeURIComponent(new Date().toISOString())),
    count("household_messages", "&created_at=gte." + encodeURIComponent(day)),
    count("push_tokens"),
    count("nexus_push_tokens"),
    gh("repos/Enard52/NEXUS"),
    gh("repos/Enard52/nexus-releases/releases?per_page=30"),
    gh("repos/Enard52/NEXUS/actions/runs?branch=main&per_page=12"),
  ]);

  let dbMb: number | null = null;
  try {
    const sz = await fetch(SUPA + "/rest/v1/rpc/nexus_db_size", { method: "POST", headers: { ...AUTH, "Content-Type": "application/json" }, body: "{}" });
    if (sz.ok) { const v = parseFloat(String(await sz.text()).replace(/"/g, "")); if (isFinite(v)) dbMb = v; }
  } catch { /* RPC yoksa sessiz geç */ }

  const plusTry = (s.plus_try_monthly ?? 0) + (s.plus_try_yearly ?? 0);
  const plusUsd = (s.plus_usd_monthly ?? 0) + (s.plus_usd_yearly ?? 0);

  // GitHub: yıldız, izleyen, çatal, açık issue/PR + sürüm indirmeleri + son CI durumu
  const relList: any[] = Array.isArray(rels) ? rels.filter((x) => !x.draft) : [];
  const latest = relList[0];
  const sumBy = (assets: any[], re: RegExp) => assets.filter((a) => re.test(a.name)).reduce((t, a) => t + (a.download_count || 0), 0);
  const latestAssets: any[] = latest?.assets ?? [];
  const allAssets: any[] = relList.flatMap((x) => x.assets ?? []);
  const dl = (re: RegExp) => n(sumBy(latestAssets, re));
  const dlAll = allAssets.filter((a) => /\.(exe|AppImage|deb|dmg|apk)$/i.test(a.name)).reduce((t, a) => t + (a.download_count || 0), 0);

  const ciLines: string[] = [];
  if (runs && Array.isArray(runs.workflow_runs)) {
    const seen = new Set<string>();
    for (const w of runs.workflow_runs) {
      if (seen.has(w.name) || w.status !== "completed") continue;
      seen.add(w.name);
      ciLines.push((w.conclusion === "success" ? "✅ " : "❌ ") + w.name);
    }
  }
  const ciBad = ciLines.some((l) => l.startsWith("❌"));

  const dbPct = dbMb !== null ? (dbMb / 500) * 100 : null;
  const warnings: string[] = [];
  if (dbPct !== null && dbPct > 70) warnings.push("DB boyutu %" + Math.round(dbPct) + " (ücretsiz limit 500 MB)");
  if (typeof s.active_7d === "number" && s.active_7d > 35000) warnings.push("Aktif kullanıcı limite yaklaşıyor (50.000)");
  if (ciBad) warnings.push("Son CI koşusunda hata var");

  const healthy = !h.failed.length;
  const summary = healthy
    ? "✅ **Tüm servisler çalışıyor** (" + h.total + "/" + h.total + ")"
    : "🚨 **" + h.failed.length + "/" + h.total + " serviste sorun var**";
  const embed = {
    title: "📊 NEXUS günlük pano",
    description: summary + (warnings.length ? "\n⚠️ " + warnings.join("\n⚠️ ") : "") + (latest ? "\n🏷️ Son sürüm: **" + latest.tag_name + "** (" + ago(latest.published_at) + ")" : ""),
    color: !healthy ? 0xef4444 : warnings.length ? 0xfbbf24 : 0x34d399,
    timestamp: new Date().toISOString(),
    fields: [
      { name: "👥 Kullanıcılar", value: "Toplam **" + n(s.users_total) + "** (doğrulanmış " + n(s.confirmed_total) + ")\nYeni: 24 sa **" + n(s.users_24h) + "** · 7 gün **" + n(s.users_7d) + "**\nAktif: 24 sa **" + n(s.active_24h) + "** · 7 gün **" + n(s.active_7d) + "**", inline: true },
      { name: "💎 NEXUS+", value: "TRY **" + n(plusTry) + "** (ay " + n(s.plus_try_monthly) + " / yıl " + n(s.plus_try_yearly) + ")\nUSD **" + n(plusUsd) + "** (ay " + n(s.plus_usd_monthly) + " / yıl " + n(s.plus_usd_yearly) + ")\nİptal edecek: " + n(s.plus_cancelling), inline: true },
      { name: "🏠 Aile (sunucu)", value: "Ev **" + n(homes) + "** · üye **" + n(members) + "**\nBekleyen davet: " + n(pendingInv) + "\nMesaj (24 sa): " + n(msgs24) + "\nPush cihazı: Android " + n(tokAndroid) + " · web " + n(tokWeb), inline: true },
      { name: "⭐ GitHub", value: "Yıldız **" + n(repo?.stargazers_count) + "** · izleyen " + n(repo?.subscribers_count) + " · çatal " + n(repo?.forks_count) + "\nAçık issue/PR: " + n(repo?.open_issues_count), inline: true },
      { name: "⬇️ İndirme" + (latest ? " (" + latest.tag_name + ")" : ""), value: "Windows **" + dl(/Setup\.exe$/) + "** · Linux **" + dl(/AppImage$|\.deb$/) + "**\nmacOS **" + dl(/\.dmg$|mac\.zip$/) + "** · Android **" + dl(/\.apk$/) + "**\nTüm sürümler: " + n(allAssets.length ? dlAll : null), inline: true },
      { name: "🔧 CI (main)", value: ciLines.length ? ciLines.join("\n") : "–", inline: true },
      { name: "💾 Ücretsiz plan", value: "DB: " + (dbMb !== null ? dbMb + " / 500 MB\n" + bar(dbPct!) : "–") + "\nAktif (7 g): " + n(s.active_7d) + " / 50.000\nEşitlenen: " + n(s.synced_accounts) + " hesap · " + n(s.devices_synced) + " cihaz kaydı", inline: false },
      { name: "🩺 Servis sağlığı", value: healthy ? "Site, yapay zekâ, ödeme, aile daveti, push ve indirmeler yanıt veriyor" : h.failed.map((f) => "❌ " + f).join("\n"), inline: false },
    ],
    footer: { text: "Saatlik denetim açık · sorun olursa ayrı uyarı gelir" },
  };
  if (!(await post(hook, { username: "NEXUS", embeds: [embed] }))) return new Response("discord error", { status: 502 });
  await rest("nexus_stats_log", { method: "POST", body: JSON.stringify({ kind: "daily" }) });
  return Response.json({ ok: true });
});
