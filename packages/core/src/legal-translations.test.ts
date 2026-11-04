import { describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { check } = require("../../../scripts/check-legal-translation.cjs");
const APP = new URL("../../../src/app/", import.meta.url);
const LEGAL = new URL("../../../scripts/legal-translations/", import.meta.url);

// Her topluluk dilinin (src/app/lang-<kod>.js) gizlilik / şartlar / iade çevirisi olmalı ve kaynakla aynı yapıda olmalı.
describe("legal translations cover every shipped UI language", () => {
  const codes = readdirSync(APP)
    .map((n) => /^lang-([a-z]{2,3}(?:-[A-Za-z]{2,4})?)\.js$/.exec(n)?.[1])
    .filter((c): c is string => !!c && c !== "en");

  it("has a legal translation file for each community language", () => {
    const missing = codes.filter((c) => !existsSync(new URL(`${c}.json`, LEGAL)));
    expect(missing, `scripts/legal-translations/<kod>.json eksik`).toEqual([]);
  });

  it("keeps structure, numbers, brands and e-mail identical to the source", () => {
    for (const c of codes) expect(check(c), `${c} çeviri sorunları`).toEqual([]);
  });
});
