import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * NEXUS mobil yüzeyleri (kök stitch-*.html) Capacitor WebView içinde `https://localhost`
 * originsiyle açılır ve ev ağı dışında da çalışmalıdır. Bu test, yayını engelleyen
 * Offline/CDN gerilemelerini kalıcı olarak yakalar:
 *  - harici script/stylesheet/font yüklenmesi (ağ kesilirse ekran bozulur),
 *  - repoda olmayan yerel varlığa referans (stilsiz/iconsu ekran),
 *  - bundle'ın css/js/fonts kopyalamayı bırakması,
 *  - hiç yüklenmeyen bir ikon kütüphanesine geri dönüş.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..", "..");

const SCREENS = readdirSync(join(REPO_ROOT, "src", "app")).filter(
  (f) => f.startsWith("stitch-") && f.endsWith(".html"),
);

/** src= ve stylesheet href= hedefleri; normal <a href> linkleri kasıtlı harici olabilir. */
const RESOURCE_REF = /<(script|link)\b[^>]*?>/gi;
const SRC_ATTR = /\bsrc\s*=\s*["']([^"']+)["']/i;
const HREF_ATTR = /\bhref\s*=\s*["']([^"']+)["']/i;
const IS_STYLESHEET = /rel\s*=\s*["']stylesheet["']/i;

const EXTERNAL_OK = /^(https?:)?\/\//;

function resourceRefsOf(html: string): { file: string; ref: string }[] {
  const out: { file: string; ref: string }[] = [];
  // Yorum satirlari taranmaz: aciklama metnindeki "<script src="…CDN…>" örnegi
  // gercek bir yukleme degil.
  const code = html.replace(/<!--[\s\S]*?-->/g, "");
  for (const tag of code.match(RESOURCE_REF) ?? []) {
    const isStyle = IS_STYLESHEET.test(tag);
    const match = (isStyle ? tag.match(HREF_ATTR) : tag.match(SRC_ATTR)) ?? null;
    if (!match) continue;
    out.push({ file: tag, ref: match[1] });
  }
  return out;
}

function resolvesLocally(ref: string): boolean {
  const clean = decodeURIComponent(ref.split(/[?#]/)[0]).replace(/^\.?\//, "");
  // Bundle'daki sayfa, kökteki kaynak sayfayla aynı relative dili kullanır:
  // dosya ya kökte ya da üretilmiş ayna klasörde (www/) bulunmalı.
  if (existsSync(join(REPO_ROOT, "src", "app", clean)) || existsSync(join(REPO_ROOT, "www", clean)))
    return true;
  // Bilerek repoda tutulmayan, paketleme adiminda uretilen dosyalar: gizli
  // yapilandirma gibi. Bunlar icin kural, paketleyicinin gercekten uretiyor olmasi.
  const generatedAtBundleTime = new Set(["cloud-config.js"]);
  if (generatedAtBundleTime.has(clean)) {
    const builder = readFileSync(join(REPO_ROOT, "mobile-app", "scripts", "build-web.mjs"), "utf8");
    return builder.includes(clean);
  }
  return false;
}

describe("mobil ekranlar — offline yüklenme Sözleşmesi", () => {
  it("kök stitch ekranlarını tarayacak kadar çok sayfayı bulur", () => {
    expect(SCREENS.length).toBeGreaterThan(40);
  });

  it("hiçbir ekran harici script, stylesheet veya font yüklemiyor", () => {
    const offenders: string[] = [];
    for (const screen of SCREENS) {
      const html = readFileSync(join(REPO_ROOT, "src", "app", screen), "utf8");
      for (const { ref } of resourceRefsOf(html)) {
        if (EXTERNAL_OK.test(ref)) offenders.push(`${screen} -> ${ref}`);
      }
      // @import ve CDN'lik ikon kütüphanesi de aynı şekilde yasak.
      const code = html.replace(/<!--[\s\S]*?-->/g, "");
      if (/@import\s+url\(\s*["']?https?:/i.test(code)) offenders.push(`${screen} -> @import`);
      if (code.includes("cdn.tailwindcss.com")) offenders.push(`${screen} -> tailwind play CDN`);
    }
    expect(offenders, `harici kaynak yükleyen ekranlar:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("referans verilen her yerel varlık repoda var", () => {
    const missing: string[] = [];
    for (const screen of SCREENS) {
      const html = readFileSync(join(REPO_ROOT, "src", "app", screen), "utf8");
      for (const { ref } of resourceRefsOf(html)) {
        if (EXTERNAL_OK.test(ref) || ref.startsWith("data:") || ref.startsWith("#")) continue;
        // cloud-config.js gizli yapılandırmadır: git'e girmez, derleme/CI sırasında yazılır.
        if (ref === "cloud-config.js") continue;
        if (!resolvesLocally(ref)) missing.push(`${screen} -> ${ref}`);
      }
    }
    expect(missing, `eksik yerel varlıklar:\n${missing.join("\n")}`).toEqual([]);
  });

  it("ekranlar yüklenmeyen iconify öğesine geri dönmedi", () => {
    const users = SCREENS.filter((s) =>
      readFileSync(join(REPO_ROOT, "src", "app", s), "utf8").includes("<iconify-icon"),
    );
    expect(users, `iconify kullanan ekranlar (lucide'a çevrilmeli): ${users.join(", ")}`).toEqual(
      [],
    );
  });
});

describe("mobil paketleme — varlık hattı", () => {
  const builder = readFileSync(join(REPO_ROOT, "scripts", "sync-www.mjs"), "utf8");

  it("bundle'a css, js ve fonts klasörlerini kopyalar", () => {
    for (const dir of ["css", "js", "fonts"]) {
      expect(builder, `sync-www.mjs ${dir}/ kopyalamıyor`).toContain(`"${dir}"`);
    }
  });

  it("bundle harita kütüphanesini de taşır", () => {
    expect(builder).toContain(`"leaflet"`);
    expect(existsSync(join(REPO_ROOT, "www", "leaflet", "leaflet.js"))).toBe(true);
    expect(existsSync(join(REPO_ROOT, "www", "leaflet", "leaflet.css"))).toBe(true);
  });

  it("desteklenen cihaz matrisi ortak script olarak bundle'a girer", () => {
    expect(builder).toContain('"supported-devices.js"');
    expect(builder).toContain('"lan-connectors.js"');
  });
});

describe("desteklenen cihaz matrisi — veri tutarlılığı", () => {
  const matrix = readFileSync(join(REPO_ROOT, "src", "app", "supported-devices.js"), "utf8");

  it("her model gerçek bir ürün görseline işaret eder", () => {
    const images = [...matrix.matchAll(/img: "([^"]+)"/g)].map((m) => m[1]);
    expect(images.length).toBeGreaterThan(10);
    const missing = [...new Set(images)].filter(
      (img) => !existsSync(join(REPO_ROOT, "assets", "products", img)),
    );
    expect(missing, `olmayan görseller: ${missing.join(", ")}`).toEqual([]);
  });

  it("her marka bloku bir connector protokolü taşır", () => {
    // Resolver'in döndürdüğü `protocol: "unknown"` sayılmamalı: yalnız marka blokları.
    const groups = [...matrix.matchAll(/brand: "([^"]+)",\s*protocol: "([^"]+)"/g)];
    expect(groups.length).toBeGreaterThanOrEqual(8);
    const protocols = groups.map((g) => g[2]);
    expect(protocols).toContain("shelly");
    expect(protocols).toContain("wled");
    expect(protocols).toContain("esphome");
    expect(protocols).not.toContain("unknown");
  });
});
