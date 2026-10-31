import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Performans bütçesi: service worker'ın ilk kurulumda önbelleğe aldığı kabuk dosyalarının toplam boyutu
 * (kablosuz ağda ilk açılışı belirler). Bütçeyi aşan değişiklik bilinçli olarak bütçeyi artırmalı.
 */
const ROOT = resolve(__dirname, "../../..");
const SHELL_BUDGET_KB = 2600; // ölçülen ~2050 KB (1.0.39), ~%25 pay

function shellFiles(): string[] {
  const sw = readFileSync(resolve(ROOT, "src/app/sw.js"), "utf8");
  const block = /var SHELL = \[([\s\S]*?)\];/.exec(sw)?.[1] ?? "";
  return [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe("performans bütçesi", () => {
  it("kabuk listesi okunabilir ve dosyaların hepsi mevcut", () => {
    const files = shellFiles();
    expect(files.length).toBeGreaterThan(20);
    const missing = files.filter((f) => !existsSync(resolve(ROOT, "www", f)));
    expect(missing).toEqual([]);
  });

  it(`önbellek kabuğu ${SHELL_BUDGET_KB} KB'ı aşmaz`, () => {
    const bytes = shellFiles().reduce((n, f) => n + statSync(resolve(ROOT, "www", f)).size, 0);
    expect(Math.round(bytes / 1024)).toBeLessThanOrEqual(SHELL_BUDGET_KB);
  });
});
