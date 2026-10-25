import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PRICES } from "../../../scripts/site-content.mjs";

// CLAUDE.md kural 4: fiyatlar tek kaynaktan gelir. cloud-sync.js (uygulama)
// ve scripts/site-content.mjs (site) aynı fiyatları göstermek zorundadır.
describe("site fiyatları tek kaynakla uyumlu (kural 4)", () => {
  const root = process.cwd();
  const cloudSync = readFileSync(join(root, "cloud-sync.js"), "utf8");

  it("cloud-sync TRY aylık fiyatı site ile aynı", () => {
    expect(cloudSync).toContain(`"Aylık": "${PRICES.TRY.monthly}"`);
  });
  it("cloud-sync TRY yıllık fiyatı site ile aynı", () => {
    expect(cloudSync).toContain(`"Yıllık": "${PRICES.TRY.yearly}"`);
  });
  it("cloud-sync USD aylık fiyatı site ile aynı", () => {
    expect(cloudSync).toContain(`"Aylık": "${PRICES.USD.monthly}"`);
  });
  it("cloud-sync USD yıllık fiyatı site ile aynı", () => {
    expect(cloudSync).toContain(`"Yıllık": "${PRICES.USD.yearly}"`);
  });
});
