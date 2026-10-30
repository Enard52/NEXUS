import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Issue #102: dev ekranlar (src/app/nexus-*.html) içine gömülen satır içi <script> blokları
// büyümesin. Bir blok MAX_LINES'ı aşıyorsa kod ayrı bir src/app/<ad>.js dosyasına taşınmalı.
// Mevcut borç BUYUK_EKRANLAR'da tutulur: değerler yalnızca AZALABİLİR; blok sınırın altına
// inince girdi listeden silinmelidir (borç ancak küçülür).
const MAX_LINES = 350;
const BUYUK_EKRANLAR: Record<string, number> = {
  "nexus-account-security.html": 608,
  "nexus-chat.html": 667,
  "nexus-device.html": 1442,
  "nexus-household.html": 785,
  "nexus-pair.html": 592,
  "nexus-settings.html": 424,
};

const APP = join(process.cwd(), "src", "app");

function largestInlineScript(file: string): number {
  const html = readFileSync(join(APP, file), "utf8");
  let max = 0;
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    max = Math.max(max, (m[1] ?? "").split("\n").length);
  }
  return max;
}

describe("satır içi script boyutu (issue #102)", () => {
  const files = readdirSync(APP).filter((f) => /^nexus-.*\.html$/.test(f));

  it("ekranlar bulunuyor (vitest depo kökünden çalışmalı)", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  for (const f of files) {
    it(`${f} sınırı aşmıyor`, () => {
      const lines = largestInlineScript(f);
      const allowed = BUYUK_EKRANLAR[f];
      if (allowed === undefined) {
        expect(
          lines,
          `${f}: ${lines} satırlık satır içi script — ayrı bir .js dosyasına taşıyın`,
        ).toBeLessThanOrEqual(MAX_LINES);
      } else {
        expect(lines, `${f} büyüdü (izin ${allowed})`).toBeLessThanOrEqual(allowed);
        expect(lines, `${f} artık sınırın altında — BUYUK_EKRANLAR'dan silin`).toBeGreaterThan(
          MAX_LINES,
        );
      }
    });
  }

  it("izin listesinde olmayan dosya adı yok", () => {
    for (const f of Object.keys(BUYUK_EKRANLAR)) expect(files).toContain(f);
  });
});
