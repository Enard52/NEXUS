import { describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";

const APP = new URL("../../../src/app/", import.meta.url);
const SCRIPTS = new URL("../../../scripts/", import.meta.url);
// @ts-expect-error -- .mjs tool file without type declarations
const checkUi = await import("../../../scripts/check-site-ui.mjs");
// @ts-expect-error -- .mjs tool file without type declarations
const checkContent = await import("../../../scripts/check-site-content.mjs");

// Her topluluk dilinin pazarlama sitesi metni (site-content) ve koda gömülü arayüz sözlüğü (site-ui) olmalı;
// aksi halde seçilen dilde site İngilizce görünür.
describe("marketing site is translated for every shipped UI language", () => {
  const codes = readdirSync(APP)
    .map((n) => /^lang-([a-z]{2,3}(?:-[A-Za-z]{2,4})?)\.js$/.exec(n)?.[1])
    .filter((c): c is string => !!c && c !== "en" && c !== "tr");

  it("has site-content and site-ui files for each community language", () => {
    const noContent = codes.filter((c) => !existsSync(new URL(`site-content.${c}.mjs`, SCRIPTS)));
    const noUi = codes.filter((c) => !existsSync(new URL(`site-ui/${c}.json`, SCRIPTS)));
    expect(noContent, "scripts/site-content.<kod>.mjs eksik").toEqual([]);
    expect(noUi, "scripts/site-ui/<kod>.json eksik").toEqual([]);
  });

  it("keeps site-content structure identical to the English source", () => {
    for (const c of codes)
      expect(checkContent.checkSiteContent(c).problems, `${c} site içeriği`).toEqual([]);
  });

  it("translates every hard-coded site UI string without breaking placeholders", () => {
    expect(checkUi.allKeys().length).toBeGreaterThan(100);
    for (const c of codes)
      expect(checkUi.checkSiteUi(c).problems, `${c} site arayüz metinleri`).toEqual([]);
  });
});
