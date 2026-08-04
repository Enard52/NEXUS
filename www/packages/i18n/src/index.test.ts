import { describe, expect, it } from "vitest";
import {
  brandRelevance,
  createTranslator,
  formatCurrency,
  formatDistance,
  formatTemperature,
  formatTime,
  formatWeight,
  getRegionalBrands,
  getUnitSystem,
  implemented,
  moduleName,
  resolveFromAcceptLanguage,
  resolveLocale,
  LocaleManager,
  MemoryLocaleStorage,
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
    expect(resolveLocale("fr")).toBe("fr");
    expect(resolveLocale("xx")).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });

  it("picks the highest-quality supported language from Accept-Language", () => {
    expect(resolveFromAcceptLanguage("fr-FR,tr;q=0.9,en;q=0.5")).toBe("fr");
    expect(resolveFromAcceptLanguage("de-DE,de;q=0.8")).toBe("de");
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

  it("formats time with appropriate clock convention", () => {
    const date = new Date(2026, 6, 25, 14, 30);
    const enTime = formatTime("en", date);
    const trTime = formatTime("tr", date);
    expect(enTime).toContain("2:30"); // 12-hour
    expect(trTime).toContain("14:30"); // 24-hour
  });
});

describe("unit formatting (FAZ 13)", () => {
  it("uses metric for Turkish, imperial for English", () => {
    expect(getUnitSystem("tr")).toBe("metric");
    expect(getUnitSystem("en")).toBe("imperial");
  });

  it("formats temperature per locale", () => {
    expect(formatTemperature("tr", 22)).toBe("22°C");
    expect(formatTemperature("en", 22)).toBe("72°F");
  });

  it("formats distance per locale", () => {
    expect(formatDistance("tr", 5000)).toBe("5.0 km");
    expect(formatDistance("tr", 500)).toBe("500 m");
    expect(formatDistance("en", 5000)).toBe("3.1 mi");
    expect(formatDistance("en", 100)).toBe("328 ft");
  });

  it("formats weight per locale", () => {
    expect(formatWeight("tr", 70)).toBe("70.0 kg");
    expect(formatWeight("en", 70)).toContain("lb");
  });
});

describe("regional device ecosystem prioritization (FAZ 13)", () => {
  it("returns region-specific brand lists", () => {
    const trBrands = getRegionalBrands("tr");
    expect(trBrands[0]).toBe("Xiaomi");
    expect(trBrands).toContain("Sonoff");

    const enBrands = getRegionalBrands("en");
    expect(enBrands[0]).toBe("Philips Hue");
    expect(enBrands).toContain("Ring");
  });

  it("scores brand relevance for a locale", () => {
    // Top brand for TR = Xiaomi
    expect(brandRelevance("tr", "Xiaomi")).toBeGreaterThan(0.8);
    // Not-in-list brand gets baseline score
    expect(brandRelevance("tr", "UnknownBrand")).toBe(0.3);
    // Case-insensitive
    expect(brandRelevance("en", "philips hue")).toBeGreaterThan(0.8);
  });
});

describe("LocaleManager (cross-platform auto-detect + manual override)", () => {
  it("detects system locale automatically", () => {
    const mgr = new LocaleManager({ systemLocale: "tr-TR" });
    expect(mgr.locale).toBe("tr");
  });

  it("defaults to en for unsupported system locales", () => {
    const mgr = new LocaleManager({ systemLocale: "xx-XX" });
    expect(mgr.locale).toBe("en");
  });

  it("URL parameter overrides system locale", () => {
    const mgr = new LocaleManager({ systemLocale: "en-US", urlLocale: "tr" });
    expect(mgr.locale).toBe("tr");
  });

  it("persisted user choice wins over everything", () => {
    const storage = new MemoryLocaleStorage();
    storage.set("nexus_user_locale", "tr");
    const mgr = new LocaleManager({ storage, systemLocale: "en-US", urlLocale: "en" });
    expect(mgr.locale).toBe("tr");
  });

  it("setLocale persists and immediately changes the active locale", () => {
    const storage = new MemoryLocaleStorage();
    const mgr = new LocaleManager({ storage, systemLocale: "en-US" });
    expect(mgr.locale).toBe("en");

    mgr.setLocale("tr");
    expect(mgr.locale).toBe("tr");

    // New manager reads from same storage → still tr
    const mgr2 = new LocaleManager({ storage, systemLocale: "en-US" });
    expect(mgr2.locale).toBe("tr");
  });

  it("t() method translates with the current locale", () => {
    const mgr = new LocaleManager({ systemLocale: "tr-TR" });
    const greeting = mgr.t("app.greeting", { name: "Ali" });
    expect(greeting).toContain("Ali");
  });

  it("Accept-Language header is used when no other signal exists", () => {
    const mgr = new LocaleManager({ acceptLanguage: "tr-TR,tr;q=0.9" });
    expect(mgr.locale).toBe("tr");
  });

  it("refresh() re-detects after context changes", () => {
    const storage = new MemoryLocaleStorage();
    const mgr = new LocaleManager({ storage, systemLocale: "en-US" });
    expect(mgr.locale).toBe("en");

    // Simulate user logging in and their preference is now in storage
    storage.set("nexus_user_locale", "tr");
    mgr.refresh();
    expect(mgr.locale).toBe("tr");
  });
});
