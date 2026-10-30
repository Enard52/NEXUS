// daily-stats için SAF mantık (Deno/ağ yok): limit eşikleri, tekrar-yazma pencereleri, biçimlendirme
// ve "sağlıklıyken sessiz" kuralı. Ayrı dosyada durur ki vitest ile (packages/web/src/daily-stats.test.ts)
// sınanabilsin. Gizli bilgi yok: Discord adresi yalnızca index.ts içinde ortam değişkeninden okunur.

export const DB_LIMIT_MB = 500;
export const ACTIVE_LIMIT = 50000;
export const ACTIVE_WARN_AT = 35000;
export const DB_WARN_RATIO = 0.7;
export const DB_WARN_PCT = 70;
/** Servis hatası varken saatlik uyarı en fazla ~50 dk'da bir yazılır. */
export const FAILURE_DEDUPE_MS = 50 * 60 * 1000;
/** Yalnız limit/CI uyarısı varken 12 saatte bir. */
export const WARNING_DEDUPE_MS = 12 * 3600 * 1000;
/** Günlük pano en fazla ~20 saatte bir. */
export const DAILY_DEDUPE_MS = 20 * 3600 * 1000;

export const n = (v: unknown): string =>
  typeof v === "number" && isFinite(v) ? v.toLocaleString("tr-TR") : "–";

export function bar(pct: number): string {
  const p = Math.max(0, Math.min(100, pct));
  const filled = Math.round(p / 10);
  return "▰".repeat(filled) + "▱".repeat(10 - filled) + " " + Math.round(p) + "%";
}

export function ago(iso: string, now: number = Date.now()): string {
  const h = Math.round((now - new Date(iso).getTime()) / 3600000);
  return h < 1 ? "az önce" : h < 48 ? h + " sa önce" : Math.round(h / 24) + " gün önce";
}

/** nexus_db_size RPC yanıtı ("123.4" ya da 123.4) -> MB; okunamazsa null. */
export function parseDbMb(raw: string): number | null {
  const v = parseFloat(String(raw).replace(/"/g, ""));
  return isFinite(v) ? v : null;
}

/** Saatlik denetim: DB uyarısı (oran karşılaştırması). */
export function hourlyDbWarning(mb: number): string | null {
  if (isFinite(mb) && mb / DB_LIMIT_MB > DB_WARN_RATIO) {
    return (
      "DB boyutu " +
      mb +
      " MB (%" +
      Math.round((mb / DB_LIMIT_MB) * 100) +
      ", ücretsiz limit 500 MB)"
    );
  }
  return null;
}

/** Saatlik denetim: aktif kullanıcı uyarısı. */
export function hourlyActiveWarning(active7d: unknown): string | null {
  if (typeof active7d === "number" && active7d > ACTIVE_WARN_AT) {
    return "Aktif kullanıcı " + active7d + " (limit 50.000)";
  }
  return null;
}

export interface WorkflowRun {
  name: string;
  status: string;
  conclusion?: string | null;
  updated_at: string;
  head_branch?: string | null;
}

/** Saatlik denetim: son 24 saatte başarısız biten (adı başına en yeni) iş akışları. */
export function failedWorkflowWarnings(runs: WorkflowRun[], now: number = Date.now()): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const w of runs) {
    if (seen.has(w.name) || w.status !== "completed") continue;
    seen.add(w.name);
    if (w.conclusion === "failure" && now - new Date(w.updated_at).getTime() < 24 * 3600000) {
      out.push(
        "İş akışı başarısız: " +
          w.name +
          " (" +
          (w.head_branch || "") +
          ", " +
          ago(w.updated_at, now) +
          ")",
      );
    }
  }
  return out;
}

/** Saatlik denetim: hiçbir sorun/uyarı yoksa Discord'a hiçbir şey yazılmaz. */
export function isQuiet(failed: string[], warns: string[]): boolean {
  return !failed.length && !warns.length;
}

/** Tekrar-yazma penceresi: servis hatasında 50 dk, yalnız uyarıda 12 saat. */
export function healthDedupeWindowMs(failed: string[]): number {
  return failed.length ? FAILURE_DEDUPE_MS : WARNING_DEDUPE_MS;
}

export function healthEmbed(
  failed: string[],
  total: number,
  warns: string[],
  now: Date = new Date(),
) {
  const lines = failed.map((f) => "❌ " + f).concat(warns.map((w) => "⚠️ " + w));
  return {
    title: failed.length
      ? "🚨 NEXUS sağlık denetimi: " + failed.length + "/" + total + " sorun"
      : "⚠️ NEXUS uyarısı",
    description: lines.join("\n"),
    color: failed.length ? 0xef4444 : 0xfbbf24,
    timestamp: now.toISOString(),
    footer: { text: "Sorun sürerse hatırlatılır" },
  };
}

/** Günlük pano: DB yüzdesi ve aktif kullanıcı eşikleri + CI durumu. */
export function dailyWarnings(dbPct: number | null, active7d: unknown, ciBad: boolean): string[] {
  const warnings: string[] = [];
  if (dbPct !== null && dbPct > DB_WARN_PCT)
    warnings.push("DB boyutu %" + Math.round(dbPct) + " (ücretsiz limit 500 MB)");
  if (typeof active7d === "number" && active7d > ACTIVE_WARN_AT)
    warnings.push("Aktif kullanıcı limite yaklaşıyor (50.000)");
  if (ciBad) warnings.push("Son CI koşusunda hata var");
  return warnings;
}

export function dailySummary(failedCount: number, total: number): string {
  return failedCount === 0
    ? "✅ **Tüm servisler çalışıyor** (" + total + "/" + total + ")"
    : "🚨 **" + failedCount + "/" + total + " serviste sorun var**";
}

export function dailyColor(healthy: boolean, warningCount: number): number {
  return !healthy ? 0xef4444 : warningCount ? 0xfbbf24 : 0x34d399;
}
