import { describe, expect, it } from "vitest";
import {
  createTranslator,
  formatCurrency,
  implemented,
  moduleName,
  resolveFromAcceptLanguage,
  resolveLocale,
  translate,
} from "./index.js";

describe("@nexus/i18n module identity", () => {
  it("reports itself as implemented", () => {
    expect(moduleName).toBe("i18n");
    expect(implemented).toBe(true);
  });
});

describe("locale resolution (FAZ 13)", () => {
  it("narrows BCP-47 tags to a supported locale with a safe fallback", () => {
    expect(resolveLocale("tr-TR")).toBe("tr");
    expect(resolveLocale("en-US")).toBe("en");
    expect(resolveLocale("fr")).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });

  it("picks the highest-quality supported language from Accept-Language", () => {
    expect(resolveFromAcceptLanguage("fr-FR,tr;q=0.9,en;q=0.5")).toBe("tr");
    expect(resolveFromAcceptLanguage("de-DE,de;q=0.8")).toBe("en");
    expect(resolveFromAcceptLanguage(null)).toBe("en");
  });
});

describe("translation (FAZ 13)", () => {
  it("returns consistent, interpolated text per locale", () => {
    expect(translate("en", "app.greeting", { name: "Nova" })).toBe("Hi Nova, how can I help?");
    expect(translate("tr", "app.greeting", { name: "Nova" })).toBe(
      "Merhaba Nova, nasıl yardımcı olabilirim?",
    );
  });

  it("switching locale changes every key consistently", () => {
    const en = createTranslator("en");
    const tr = createTranslator("tr");
    expect(en("download.title")).not.toBe(tr("download.title"));
    expect(tr("download.title")).toBe("NEXUS'u İndir");
  });
});

describe("locale-aware formatting (FAZ 13)", () => {
  it("formats currency using the locale's conventions", () => {
    const usd = formatCurrency("en", 1234.5, "USD");
    const tryy = formatCurrency("tr", 1234.5, "TRY");
    expect(usd).toContain("1,234.5");
    // Turkish uses a comma decimal separator.
    expect(tryy).toContain("1.234,5");
  });
});
