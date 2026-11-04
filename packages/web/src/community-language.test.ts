import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import vm from "node:vm";

const REPO_ROOT = resolve(__dirname, "../../..");

// Topluluk dili altyapısı: dil dosyası İngilizce sözlüğün üstüne biner, boş değer İngilizce kalır,
// iskelet/denetim aracı yer tutucu bozulmasını yakalar. Hiçbir sahte dil gönderilmez (COMMUNITY_LANGS boş kalır
// ta ki gerçek bir lang-<kod>.js birleşene kadar).
const APP = resolve(REPO_ROOT, "src", "app");

function runI18n(uiLang: string, overlay: unknown, dictSource?: string) {
  const noop = () => {};
  const root: Record<string, unknown> = {
    nodeType: 1,
    nodeName: "HTML",
    firstChild: null,
    childNodes: [],
    hasAttribute: () => false,
    closest: () => null,
  };
  const win: Record<string, unknown> = { nexusUiLang: uiLang, NEXUS_LANG: overlay };
  const ctx = vm.createContext({
    window: win,
    document: { documentElement: root, querySelector: () => null },
    MutationObserver: class {
      observe = noop;
    },
    Promise,
    console,
  });
  vm.runInContext(dictSource ?? readFileSync(join(APP, "lang-en.js"), "utf8"), ctx);
  vm.runInContext(readFileSync(join(APP, "i18n.js"), "utf8"), ctx);
  return (s: string) => (win.nexusTr as (x: string) => string)(s);
}

describe("community language layer", () => {
  it("overlays only filled values; empty ones fall back to English", async () => {
    const tr = runI18n("de", {
      text: { "Doğrulama Bağlantısı Gönder": "Bestätigungslink senden", "Yeni e-posta adresi": "" },
    });
    expect(tr("Doğrulama Bağlantısı Gönder")).toBe("Bestätigungslink senden");
    expect(tr("Yeni e-posta adresi")).toBe("New email address");
  });

  it("translatable sources include strings built in code (nexusT) and regex patterns", async () => {
    // @ts-expect-error saf JS aracı, tip bildirimi yok
    const tool = await import("../../../scripts/lang-tool.mjs");
    const src = tool.sources();
    expect(src.text["No active subscription"]).toBe("No active subscription");
    expect(Object.keys(src.patterns).length).toBeGreaterThan(0);
  });

  it("overlays regex patterns by their source", () => {
    const dict = 'window.NEXUS_EN = { text: {}, patterns: [["^Merhaba (.+)$", "Hello $1"]] };';
    const key = new RegExp("^Merhaba (.+)$").source;
    expect(runI18n("en", {}, dict)("Merhaba Ayşe")).toBe("Hello Ayşe");
    expect(runI18n("de", { patterns: { [key]: "Hallo $1" } }, dict)("Merhaba Ayşe")).toBe(
      "Hallo Ayşe",
    );
    expect(runI18n("de", { patterns: { [key]: "" } }, dict)("Merhaba Ayşe")).toBe("Hello Ayşe");
  });

  it("detects a shipped community language from the device language list", () => {
    const theme = readFileSync(join(APP, "theme.js"), "utf8");
    const start = theme.indexOf("function detectCommunity()");
    const end = theme.indexOf("var TURKIC_LANGS");
    expect(start).toBeGreaterThan(0);
    const detect = (langs: string[], registry: Record<string, unknown>) =>
      vm.runInNewContext(
        `var COMMUNITY_LANGS = ${JSON.stringify(registry)}; ${theme.slice(start, end)}; detectCommunity()`,
        { navigator: { languages: langs, language: langs[0] } },
      );
    const reg = { de: {}, "pt-BR": {}, "zh-Hans": {}, "zh-Hant": {} };
    expect(detect(["de-AT"], reg)).toBe("de");
    expect(detect(["pt-PT"], reg)).toBe("pt-BR");
    expect(detect(["zh-TW"], reg)).toBe("zh-Hant");
    expect(detect(["zh-CN"], reg)).toBe("zh-Hans");
    expect(detect(["xx", "de"], reg)).toBe("de");
    expect(detect(["fr"], reg)).toBe(null);
    expect(detect(["de"], {})).toBe(null);
  });

  it("is inert for tr/en (overlay ignored)", () => {
    const tr = runI18n("en", { text: { "Yeni e-posta adresi": "X" } });
    expect(tr("Yeni e-posta adresi")).toBe("New email address");
  });

  it("language tool skeleton is valid and the checker catches broken placeholders", async () => {
    // @ts-expect-error saf JS aracı, tip bildirimi yok
    const tool = await import("../../../scripts/lang-tool.mjs");
    const dir = mkdtempSync(join(tmpdir(), "nexus-lang-"));
    try {
      writeFileSync(join(dir, "lang-zz.js"), tool.skeleton("zz"), "utf8");
      const empty = tool.checkLanguage("zz", dir);
      expect(empty.ok).toBe(true);
      expect(empty.done).toBe(0);
      expect(empty.total).toBeGreaterThan(3000);
      // Yer tutuculu bir İngilizce karşılığı bul, çeviride kaldırıp denetimin yakaladığını göster
      const win: { NEXUS_EN?: { text: Record<string, string> } } = {};
      new Function("window", readFileSync(join(APP, "lang-en.js"), "utf8"))(win);
      const [k] = Object.entries(win.NEXUS_EN!.text).find(([, v]) => v.includes("{0}"))!;
      writeFileSync(
        join(dir, "lang-zz.js"),
        `window.NEXUS_LANG = { text: { ${JSON.stringify(k)}: "no placeholder" } };`,
        "utf8",
      );
      const bad = tool.checkLanguage("zz", dir);
      expect(bad.ok).toBe(false);
      expect(bad.problems.join()).toContain("yer tutucu");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("every shipped lang-<code>.js is registered, complete in form, and valid", async () => {
    const theme = readFileSync(join(APP, "theme.js"), "utf8");
    // @ts-expect-error saf JS aracı
    const tool = await import("../../../scripts/lang-tool.mjs");
    for (const f of readdirSync(APP).filter((n) =>
      /^lang-[a-z]{2,3}(-[A-Za-z]{2,4})?\.js$/.test(n),
    )) {
      const code = f.slice(5, -3);
      if (code === "en") continue;
      expect(theme, `${f} theme.js COMMUNITY_LANGS içinde kayıtlı olmalı`).toMatch(
        new RegExp(`^\\s*'?${code}'?:\\s*\\{ name:`, "m"),
      );
      const r = tool.checkLanguage(code);
      expect(r.problems, `${f} sorunları`).toEqual([]);
    }
    // 66 dil tek tek denetlenir (yalnız çalışınca ~20 sn); tam suite yükü altında 30 sn'lik varsayılanı aşıyordu.
  }, 180000);
});
