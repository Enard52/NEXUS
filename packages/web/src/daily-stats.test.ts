import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ago,
  bar,
  dailyColor,
  dailySummary,
  dailyWarnings,
  DAILY_DEDUPE_MS,
  FAILURE_DEDUPE_MS,
  failedWorkflowWarnings,
  healthDedupeWindowMs,
  healthEmbed,
  hourlyActiveWarning,
  hourlyDbWarning,
  isQuiet,
  n,
  parseDbMb,
  WARNING_DEDUPE_MS,
} from "../../../supabase/functions/daily-stats/logic";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DIR = join(REPO_ROOT, "supabase", "functions", "daily-stats");
const INDEX = readFileSync(join(DIR, "index.ts"), "utf8");
const LOGIC = readFileSync(join(DIR, "logic.ts"), "utf8");

describe("daily-stats — limit eşikleri", () => {
  it("DB uyarısı (saatlik): 350 MB (=%70) sessiz, üstü uyarır", () => {
    expect(hourlyDbWarning(349)).toBeNull();
    expect(hourlyDbWarning(350)).toBeNull();
    expect(hourlyDbWarning(350.5)).toBe("DB boyutu 350.5 MB (%70, ücretsiz limit 500 MB)");
    expect(hourlyDbWarning(450)).toBe("DB boyutu 450 MB (%90, ücretsiz limit 500 MB)");
  });

  it("DB uyarısı sonlu olmayan değerde yazılmaz", () => {
    expect(hourlyDbWarning(NaN)).toBeNull();
    expect(hourlyDbWarning(Infinity)).toBeNull();
  });

  it("aktif kullanıcı: 35.000 sessiz, 35.001 uyarır, sayı olmayan yok sayılır", () => {
    expect(hourlyActiveWarning(34999)).toBeNull();
    expect(hourlyActiveWarning(35000)).toBeNull();
    expect(hourlyActiveWarning(35001)).toBe("Aktif kullanıcı 35001 (limit 50.000)");
    expect(hourlyActiveWarning("40000")).toBeNull();
    expect(hourlyActiveWarning(undefined)).toBeNull();
    expect(hourlyActiveWarning(null)).toBeNull();
  });

  it("günlük uyarılar: eşikte yok, üstünde var, DB okunamazsa DB uyarısı yok", () => {
    expect(dailyWarnings(70, 35000, false)).toEqual([]);
    expect(dailyWarnings(70.4, 35000, false)).toEqual(["DB boyutu %70 (ücretsiz limit 500 MB)"]);
    expect(dailyWarnings(null, 36000, false)).toEqual([
      "Aktif kullanıcı limite yaklaşıyor (50.000)",
    ]);
    expect(dailyWarnings(null, undefined, true)).toEqual(["Son CI koşusunda hata var"]);
    expect(dailyWarnings(80, 40000, true)).toEqual([
      "DB boyutu %80 (ücretsiz limit 500 MB)",
      "Aktif kullanıcı limite yaklaşıyor (50.000)",
      "Son CI koşusunda hata var",
    ]);
  });

  it("nexus_db_size yanıtı: tırnaklı/tırnaksız sayı okunur, bozuk yanıt null", () => {
    expect(parseDbMb('"12.5"')).toBe(12.5);
    expect(parseDbMb("12.5")).toBe(12.5);
    expect(parseDbMb("")).toBeNull();
    expect(parseDbMb("null")).toBeNull();
  });
});

describe("daily-stats — tekrar yazma pencereleri", () => {
  it("servis hatasında 50 dk, yalnız uyarıda 12 saat, günlükte 20 saat", () => {
    expect(FAILURE_DEDUPE_MS).toBe(50 * 60 * 1000);
    expect(WARNING_DEDUPE_MS).toBe(12 * 3600 * 1000);
    expect(DAILY_DEDUPE_MS).toBe(20 * 3600 * 1000);
    expect(healthDedupeWindowMs(["Site (HTTP 500)"])).toBe(FAILURE_DEDUPE_MS);
    expect(healthDedupeWindowMs([])).toBe(WARNING_DEDUPE_MS);
  });

  it("pencere kenarı: index.ts since = şimdi − pencere (gte) hesabını bu sabitlerle yapar", () => {
    const now = Date.parse("2026-10-30T12:00:00.000Z");
    const since = new Date(now - FAILURE_DEDUPE_MS).toISOString();
    // 49 dk önceki kayıt pencerede (gte), 51 dk önceki dışarıda -> yeniden yazılır
    expect(new Date(now - 49 * 60000).toISOString() >= since).toBe(true);
    expect(new Date(now - 50 * 60000).toISOString() >= since).toBe(true);
    expect(new Date(now - 51 * 60000).toISOString() >= since).toBe(false);
  });

  it("index.ts sabitleri kullanır ve eski sabit sayıları içermez", () => {
    expect(INDEX).toContain("healthDedupeWindowMs(h.failed)");
    expect(INDEX).toContain("DAILY_DEDUPE_MS");
    expect(INDEX).not.toMatch(/50 \* 60 \* 1000|20 \* 3600 \* 1000/);
  });
});

describe("daily-stats — sağlıklıyken sessiz kural", () => {
  it("sorun ve uyarı yoksa sessiz; biri varsa değil", () => {
    expect(isQuiet([], [])).toBe(true);
    expect(isQuiet(["Site (HTTP 500)"], [])).toBe(false);
    expect(isQuiet([], ["DB boyutu 400 MB"])).toBe(false);
  });
});

describe("daily-stats — biçimlendirme", () => {
  it("sağlık gömmesi: hata kırmızı, yalnız uyarı sarı", () => {
    const now = new Date("2026-10-30T12:00:00.000Z");
    const bad = healthEmbed(["Site (HTTP 500)", "Web push (yanıt yok)"], 10, ["DB x"], now);
    expect(bad.title).toBe("🚨 NEXUS sağlık denetimi: 2/10 sorun");
    expect(bad.description).toBe("❌ Site (HTTP 500)\n❌ Web push (yanıt yok)\n⚠️ DB x");
    expect(bad.color).toBe(0xef4444);
    expect(bad.timestamp).toBe("2026-10-30T12:00:00.000Z");
    const warn = healthEmbed([], 10, ["DB x"], now);
    expect(warn.title).toBe("⚠️ NEXUS uyarısı");
    expect(warn.color).toBe(0xfbbf24);
    expect(warn.footer.text).toBe("Sorun sürerse hatırlatılır");
  });

  it("günlük özet ve renk", () => {
    expect(dailySummary(0, 10)).toBe("✅ **Tüm servisler çalışıyor** (10/10)");
    expect(dailySummary(3, 10)).toBe("🚨 **3/10 serviste sorun var**");
    expect(dailyColor(false, 0)).toBe(0xef4444);
    expect(dailyColor(false, 2)).toBe(0xef4444);
    expect(dailyColor(true, 1)).toBe(0xfbbf24);
    expect(dailyColor(true, 0)).toBe(0x34d399);
  });

  it("sayı biçimi: okunamayan kaynak '–', sayı uydurulmaz", () => {
    expect(n(null)).toBe("–");
    expect(n(undefined)).toBe("–");
    expect(n("5")).toBe("–");
    expect(n(NaN)).toBe("–");
    expect(n(Infinity)).toBe("–");
    expect(n(0)).toBe("0");
    expect(n(1234)).toMatch(/^1[. ]?234$/);
  });

  it("ilerleme çubuğu uçlarda taşmaz", () => {
    expect(bar(0)).toBe("▱▱▱▱▱▱▱▱▱▱ 0%");
    expect(bar(70)).toBe("▰▰▰▰▰▰▰▱▱▱ 70%");
    expect(bar(100)).toBe("▰▰▰▰▰▰▰▰▰▰ 100%");
    expect(bar(250)).toBe("▰▰▰▰▰▰▰▰▰▰ 100%");
    expect(bar(-5)).toBe("▱▱▱▱▱▱▱▱▱▱ 0%");
  });

  it("ago: az önce / saat / gün sınırları", () => {
    const now = Date.parse("2026-10-30T12:00:00.000Z");
    const at = (h: number) => new Date(now - h * 3600000).toISOString();
    expect(ago(at(0.4), now)).toBe("az önce");
    expect(ago(at(1), now)).toBe("1 sa önce");
    expect(ago(at(47), now)).toBe("47 sa önce");
    expect(ago(at(48), now)).toBe("2 gün önce");
    expect(ago(at(72), now)).toBe("3 gün önce");
  });

  it("başarısız iş akışı uyarıları: adı başına en yeni tamamlanan, 24 saat içinde, yalnız failure", () => {
    const now = Date.parse("2026-10-30T12:00:00.000Z");
    const iso = (h: number) => new Date(now - h * 3600000).toISOString();
    const runs = [
      { name: "CI", status: "in_progress", conclusion: null, updated_at: iso(0) },
      {
        name: "CI",
        status: "completed",
        conclusion: "failure",
        updated_at: iso(2),
        head_branch: "main",
      },
      {
        name: "CI",
        status: "completed",
        conclusion: "success",
        updated_at: iso(5),
        head_branch: "main",
      },
      {
        name: "Release",
        status: "completed",
        conclusion: "failure",
        updated_at: iso(25),
        head_branch: "main",
      },
      { name: "Pages", status: "completed", conclusion: "success", updated_at: iso(1) },
      { name: "Lint", status: "completed", conclusion: "failure", updated_at: iso(23.9) },
    ];
    expect(failedWorkflowWarnings(runs, now)).toEqual([
      "İş akışı başarısız: CI (main, 2 sa önce)",
      "İş akışı başarısız: Lint (, 24 sa önce)",
    ]);
  });
});

describe("daily-stats — gizli bilgi yok", () => {
  it("Discord adresi yalnızca ortam değişkeninden okunur; depoda webhook/anahtar yok", () => {
    for (const src of [INDEX, LOGIC]) {
      expect(src).not.toMatch(/discord(app)?\.com\/api\/webhooks/i);
      expect(src).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/);
      expect(src).not.toMatch(/sb_secret_|service_role\s*[:=]\s*["']/);
    }
    expect(INDEX).toContain('Deno.env.get("DISCORD_WEBHOOK_URL")');
    expect(LOGIC).not.toMatch(/Deno\.|jsr:|npm:/);
  });
});
