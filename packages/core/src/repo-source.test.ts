/**
 * Tek kaynak koruması — v1.0.29 sonrasında bekleyen stitch→nexus isim
 * değişikliğinin (nesil bir "fresh-clone 404'u" üretebilirdi) birim seviyesinde
 * tekrarını engeller. Üç sözleşmeyi denetler:
 *
 *   1. src/app → www aynası isim kümesi olarak bire bir (sync-www.mjs sözleşmesi)
 *   2. Aynı adlı dosyalar bayt özdeş (kaynaktaki değişiklik senkronlanmadan
 *      commit edilemez — aksi halde sürümler birbirinden kopar)
 *   3. Eski "stitch-" ekran adı ne dosya adında ne içerikte kalmamalı
 *   4. scripts/ klasörü geçici/ikili çöp biriktirmemeli (tmp-*.mjs, *.log, *.exe…)
 */
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** Monorepo kökünü bul: pnpm-workspace.yaml görülecek kadar üste tırman. */
function repoRoot(): string {
  let dir = resolve(process.cwd());
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    dir = resolve(dir, "..");
  }
  return resolve(process.cwd());
}

const ROOT = repoRoot();
const APP = join(ROOT, "src", "app");
const WWW = join(ROOT, "www");
const SCRIPTS = join(ROOT, "scripts");
/** www'de yerel üretim olduğu için repoya girmez; bayt karşılaştırmasından dışla. */
const LOCAL_ONLY = new Set(["cloud-config.js"]);
/** www üst-düzeyinde meşru site-dağıtım dosyaları (Cloudflare Pages sözleşmesi):
 *  _headers → sayfa başlıkları/CSP, robots.txt → arama motoru kuralları. */
const SITE_ONLY = new Set(["_headers", "robots.txt"]);

const topLevelFiles = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);
};

const sha256 = (file: string): string =>
  createHash("sha256").update(readFileSync(file)).digest("hex");

const APP_FILES = topLevelFiles(APP);
const WWW_FILES = topLevelFiles(WWW);
const SCREENS = APP_FILES.filter((n) => /^nexus-.*\.html$/.test(n));

describe("tek kaynak aynası (src/app → www) ve depo hijyeni", () => {
  it("stitch ekran adı ne dosya adında ne sayfa içeriğinde kalmamalı", () => {
    for (const [label, dir, names] of [
      ["src/app", APP, APP_FILES],
      ["www", WWW, WWW_FILES],
    ] as const) {
      const named = names.filter((n) => /^stitch-/i.test(n));
      expect(named, `${label} içinde stitch-*.html dosya adı`).toEqual([]);

      const withRef = names
        .filter((n) => /\.(html|js)$/.test(n) && !LOCAL_ONLY.has(n))
        .filter((n) => /stitch/i.test(readFileSync(join(dir, n), "utf8")));
      expect(withRef, `${label} dosya içeriğinde eski 'stitch' adına referans`).toEqual([]);
    }
  });

  it("ekran sayısı bilinen tabloyla tutarlı ve iki ayna aynı adları taşıyor", () => {
    expect(SCREENS.length, "src/app nexus-*.html ekran sayısı").toBe(63);

    const srcNames = new Set(APP_FILES.filter((n) => !LOCAL_ONLY.has(n)));
    const wwwNames = new Set(WWW_FILES.filter((n) => !LOCAL_ONLY.has(n)));
    expect(
      [...srcNames].filter((n) => !wwwNames.has(n)),
      "www aynasında eksik dosyalar",
    ).toEqual([]);
    expect(
      [...wwwNames].filter((n) => !srcNames.has(n) && !SITE_ONLY.has(n)),
      "www'de tek kaynağı olmayan bayat ayna dosyaları (SITE_ONLY dışı)",
    ).toEqual([]);
  });

  it("src/app ile www aynı adlı dosyalarda bayt özdeş", () => {
    const stale: string[] = [];
    for (const name of APP_FILES) {
      if (LOCAL_ONLY.has(name)) continue;
      if (sha256(join(APP, name)) !== sha256(join(WWW, name))) stale.push(name);
    }
    expect(stale, "bayt farkı olan aynalar — önce `node scripts/sync-www.mjs` çalıştırın").toEqual(
      [],
    );
  });

  it("scripts/ klasörü geçici analiz ve ikili çöp biriktirmiyor", () => {
    if (!existsSync(SCRIPTS)) return;
    const junk = topLevelFiles(SCRIPTS).filter(
      (n) => /\.(exe|dll|log)$/.test(n) || /^tmp-/.test(n) || /^preview-/.test(n),
    );
    expect(junk, "scripts/ içinde silinmesi gereken çöp dosyalar").toEqual([]);
  });

  it("eski stitch HTML aynası www'den temizlenmiş (radar regresyon testi)", () => {
    // www/stitch-*.html git'te dururken, kaynağı olmayan www/nexus-radar.html
    // aynayı bozmuştu. İki yönde de tam eşleşme zorunlu (üstteki test kapsar;
    // bu, tek kümeye odaklanan hızlı regresyon sinyalidir).
    expect(WWW_FILES.filter((n) => /^nexus-.*\.html$/.test(n))).toEqual(SCREENS);
  });
});
