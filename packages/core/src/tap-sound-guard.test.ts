/**
 * Dokunma sesi (nav/tap) kontratı.
 *
 * Testin doğduğu hata: kullanıcı "arayüzde geziyorum, ses efektleri açık,
 * hiçbir ses alamıyorum; sadece ses toggle'ına basınca ses geliyor" dedi.
 * Kök neden: tap sesi bir zamanlar tasarlanmıştı (theme.js'teki eski
 * "Click Sound fallback" yorumu fosildi) ama motor asla bağlanmamıştı —
 * yalnızca SONUÇ sesleri (cihaz aç/kapat, sahne, kopyala...) kancalıydı.
 *
 * Bu test üç sözleşmeyi kilitler:
 *  1. tap paleti + nexusTapSoundsEnabled anahtarı nexus-feedback.js'te yaşar
 *     (varsayılan AÇIK: anahtar hiç yazılmadıysa flag() true döner).
 *  2. theme.js'in global click yakalayıcısı nexusFeedback.nav() çağırır.
 *  3. Çift-ses koruması: play() bekleyen tap'i iptal eder — aynı jestte cihaz
 *     anahtarı çevrilirse kullanıcı "tık + bip" yerine tek anlamlı ses duyar.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** Monorepo kökü: pnpm-workspace.yaml görülecek kadar üste tırman. */
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
const read = (...p: string[]) => readFileSync(join(...p), "utf8");

describe("dokunma sesi kontratı (nav/tap)", () => {
  it("nexus-feedback.js: tap paleti + nexusTapSoundsEnabled anahtarı mevcut", () => {
    const fb = read(APP, "nexus-feedback.js");
    expect(fb, "tap paleti düştü").toMatch(/"tap":\s*\[\{[^}]*f0:\s*520/);
    expect(fb, "nexusTapSoundsEnabled anahtarı düştü").toContain('"nexusTapSoundsEnabled"');
  });

  it("nexus-feedback.js: nav() motoru dışa açık ve çift-ses iptali ayakta", () => {
    const fb = read(APP, "nexus-feedback.js");
    expect(fb, "nav() fonksiyonu düştü").toMatch(/function nav\(\)/);
    expect(fb, "bekleyen tap iptali düştü (çift ses riski)").toMatch(
      /if \(pendingTap\) \{\s*clearTimeout\(pendingTap\)/,
    );
    expect(fb, "nav() public API'den düştü").toMatch(
      /window\.nexusFeedback = \{[\s\S]*?\bnav: nav,/,
    );
    expect(fb, "tap artık hangi kanalla çaları kaybetti").toMatch(/play\("tap"\)/);
    // 70 ms erteleme penceresinde kullanıcı anahtarı kapattıysa sessizlik kazanır
    // (gerçek tarayıcı e2e T6'sı: kapatma tıklaması 0 ton döndürür).
    expect(fb, "ertelenen tap anahtarını yeniden okumalı").toMatch(
      /pendingTap[\s\S]{10,220}setTimeout[\s\S]{10,160}if \(!flag\("taps"\)\) return;/,
    );
  });

  it("theme.js: click yakalayıcısı nav()'u köprülüyor", () => {
    const theme = read(APP, "theme.js");
    expect(theme, "click yakalayıcısındaki nav köprüsü kayboldu").toMatch(
      /window\.nexusFeedback\.nav\(\)/,
    );
    expect(theme, "etkileşim hedefi seçicisi daraldı").toContain(
      'closest(\'button, a, input[type="range"], .cat-btn, .product-tile, input[type="checkbox"]\')',
    );
  });

  it("ayarlar ekranı: Dokunma Sesleri satırı + toggle-tap kablosu mevcut", () => {
    const html = read(APP, "nexus-settings.html");
    expect(html, "ayarlar satırı düştü").toContain("Dokunma Sesleri");
    expect(html, "toggle-tap düştü").toContain('id="toggle-tap"');
    expect(html, "anahtar yazım hattı düştü").toContain("nexusSetItem('nexusTapSoundsEnabled'");
  });

  it("lang-en.js: Dokunma Sesleri çevirisi sözlükte", () => {
    const en = read(APP, "lang-en.js");
    expect(en, "çeviri düştü; i18n kapısı %100 tutamaz").toContain(
      '"Dokunma Sesleri": "Touch Sounds"',
    );
  });
});
