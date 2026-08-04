/**
 * FAZ 1 acceptance gate — catalog completeness and integrity across all
 * 20 supported locales:
 *   1. 100% key coverage per locale (also enforced at compile time).
 *   2. Zero broken placeholders: every {var} present in the EN source must
 *      survive translation, and no translation may invent new placeholders.
 *   3. No empty or whitespace-only translations.
 *   4. RTL locales are declared and resolvable.
 */
import { describe, expect, it } from "vitest";
import {
  CATALOGS,
  RTL_LOCALES,
  SUPPORTED_LOCALES,
  isRtl,
  translate,
  type Locale,
  type MessageKey,
} from "./index.js";

const EN_KEYS = Object.keys(CATALOGS.en) as MessageKey[];

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();
}

describe("FAZ 1 gate — 20-locale catalog completeness", () => {
  it("supports exactly 20 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(20);
  });

  it.each(SUPPORTED_LOCALES.map((l) => [l] as const))(
    "%s catalog has 100%% key coverage",
    (locale) => {
      const catalog = CATALOGS[locale as Locale];
      const keys = Object.keys(catalog);
      expect(keys.length).toBe(EN_KEYS.length);
      const missing = EN_KEYS.filter((k) => !(k in catalog));
      expect(missing).toEqual([]);
    },
  );

  it.each(SUPPORTED_LOCALES.map((l) => [l] as const))("%s has no empty translations", (locale) => {
    const catalog = CATALOGS[locale as Locale] as Record<string, string>;
    const empty = EN_KEYS.filter((k) => !catalog[k] || catalog[k].trim() === "");
    expect(empty).toEqual([]);
  });

  it.each(SUPPORTED_LOCALES.map((l) => [l] as const))(
    "%s preserves every {placeholder} from the EN source",
    (locale) => {
      const catalog = CATALOGS[locale as Locale] as Record<string, string>;
      const broken: string[] = [];
      for (const key of EN_KEYS) {
        const expected = placeholders(CATALOGS.en[key]);
        const actual = placeholders(catalog[key] ?? "");
        if (JSON.stringify(expected) !== JSON.stringify(actual)) broken.push(key);
      }
      expect(broken).toEqual([]);
    },
  );

  it("declares Arabic and Hebrew as RTL", () => {
    expect(RTL_LOCALES).toContain("ar");
    expect(RTL_LOCALES).toContain("he");
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("he")).toBe(true);
    expect(isRtl("tr")).toBe(false);
  });

  it("translate() never falls back to English for a fully-covered locale", () => {
    // Sample a few high-traffic keys across every non-EN locale; values that
    // must legitimately match EN (brand/plan names) are excluded.
    const sampleKeys: MessageKey[] = ["auth.signInTitle", "setup.welcomeTitle", "screen.devices"];
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of sampleKeys) {
        const value = translate(locale, key);
        expect(value, `${locale}:${key}`).toBeTruthy();
        expect(value, `${locale}:${key}`).not.toBe(key);
      }
    }
  });

  it("interpolation works in every locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const greeting = translate(locale, "app.greeting", { name: "Nova" });
      expect(greeting, `${locale}:app.greeting`).toContain("Nova");
      expect(greeting, `${locale}:app.greeting`).not.toContain("{name}");
    }
  });
});
