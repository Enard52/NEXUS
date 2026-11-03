import { describe, expect, it } from "vitest";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const requireFromHere = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP_DIR = path.resolve(HERE, "..", "..", "..", "desktop");
const MAIN_CJS = path.join(DESKTOP_DIR, "main.cjs");
const I18N_CJS = path.join(DESKTOP_DIR, "i18n.cjs");
const THEME_JS = path.resolve(HERE, "..", "..", "..", "src", "app", "theme.js");

const { MENU_STRINGS, localize, formatDevicesStatus, isSupportedLanguage } =
  requireFromHere(I18N_CJS);

type Loader = (request: string, ...rest: unknown[]) => unknown;

interface FakeElectron {
  app: Record<string, unknown>;
  ipcHandlers: Map<string, unknown>;
  ipcEvents: Map<string, unknown>;
  [key: string]: unknown;
}

function makeFakeElectron(): FakeElectron {
  const ipcHandlers = new Map<string, unknown>();
  const ipcEvents = new Map<string, unknown>();
  const noopClass = class {};
  const fakeApp = {
    name: "NEXUS",
    isPackaged: false,
    isReady: () => false,
    setName: () => {},
    setAppUserModelId: () => {},
    requestSingleInstanceLock: () => true,
    getPath: () => path.join(os.tmpdir(), "nexus-i18n-test"),
    getVersion: () => "1.0.0",
    getLoginItemSettings: () => ({ openAtLogin: false, wasOpenedAsHidden: false }),
    setLoginItemSettings: () => {},
    setUserTasks: () => {},
    on: () => {},
    once: () => {},
    quit: () => {},
    relaunch: () => {},
    whenReady: () => new Promise<never>(() => {}),
  };
  return {
    app: fakeApp,
    ipcHandlers,
    ipcEvents,
    BrowserWindow: noopClass,
    Menu: { setApplicationMenu: () => {}, buildFromTemplate: (t: unknown) => t },
    shell: { openExternal: () => {}, showItemInFolder: () => {} },
    ipcMain: {
      handle: (channel: string, fn: unknown) => ipcHandlers.set(channel, fn),
      on: (channel: string, fn: unknown) => ipcEvents.set(channel, fn),
    },
    protocol: {
      registerSchemesAsPrivileged: () => {},
      handle: () => {},
      registerFileProtocol: () => {},
    },
    net: { request: () => ({ on: () => {}, end: () => {}, write: () => {} }) },
    nativeTheme: { shouldUseDarkColors: false, on: () => {} },
    dialog: { showMessageBox: () => ({}), showErrorBox: () => {} },
    Tray: noopClass,
    Notification: noopClass,
    screen: {
      on: () => {},
      getAllDisplays: () => [],
      getDisplays: () => [],
      getPrimaryDisplay: () => ({ bounds: { width: 1920, height: 1080 } }),
    },
    globalShortcut: { register: () => true, unregisterAll: () => {} },
    session: {
      defaultSession: {
        setPermissionRequestHandler: () => {},
        setPermissionCheckHandler: () => {},
        on: () => {},
      },
    },
    nativeImage: { createFromPath: () => ({}) },
  };
}

function loadMain(): Record<string, unknown> {
  const fake = makeFakeElectron();
  const mod = Module as unknown as { _load: Loader };
  const originalLoad = mod._load;
  mod._load = function patched(request: string, ...rest: unknown[]): unknown {
    if (request === "electron") return fake;
    return (originalLoad as Loader).call(Module, request, ...rest);
  };
  delete requireFromHere.cache[MAIN_CJS];
  try {
    return requireFromHere(MAIN_CJS);
  } finally {
    mod._load = originalLoad;
    delete requireFromHere.cache[MAIN_CJS];
  }
}

describe("desktop i18n", () => {
  it("has English table containing every menu, tray and jump list label", () => {
    const mainExports = loadMain();
    const { menuTemplate, trayTemplate, jumpListTasks, setUiLang } = mainExports as {
      menuTemplate: () => Array<{ label?: string; submenu?: Array<{ label?: string }> }>;
      trayTemplate: () => Array<{ label?: string }>;
      jumpListTasks: (
        fn: (k: string, t: string, d: string) => { title: string; description: string },
      ) => Array<{ title: string; description: string }>;
      setUiLang: (lang: string) => void;
    };

    // Set UI language to English so all dynamic menu builders produce English labels
    setUiLang("en");

    const englishLabels = new Set<string>();

    // 1. Application menu labels
    const menu = menuTemplate();
    for (const item of menu) {
      if (item.label) englishLabels.add(item.label.trim());
      if (Array.isArray(item.submenu)) {
        for (const sub of item.submenu) {
          if (sub.label) {
            // Remove version dynamic prefix if present (e.g. "Version 1.0.0")
            const clean = sub.label.startsWith("Version ") ? "Version " : sub.label.trim();
            englishLabels.add(clean);
          }
        }
      }
    }

    // 2. Tray template labels
    const tray = trayTemplate();
    for (const item of tray) {
      if (item.label) englishLabels.add(item.label.trim());
    }

    // 3. Jump list tasks
    const tasks = jumpListTasks((_k, t, d) => ({ title: t, description: d }));
    for (const task of tasks) {
      if (task.title) englishLabels.add(task.title.trim());
      if (task.description) englishLabels.add(task.description.trim());
    }

    // Assert that EVERY extracted label exists in the English table
    expect(englishLabels.size).toBeGreaterThan(15);
    for (const label of englishLabels) {
      expect(
        Object.prototype.hasOwnProperty.call(MENU_STRINGS.en, label),
        `Expected label "${label}" to exist in MENU_STRINGS.en`,
      ).toBe(true);
    }
  });

  it("statically verifies that every L() call in desktop/main.cjs has its English string in MENU_STRINGS.en", () => {
    const mainCode = fs.readFileSync(MAIN_CJS, "utf8");
    // Match L("turkish", "english")
    const lRegex =
      /\bL\(\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*,\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*\)/g;
    const matches = [...mainCode.matchAll(lRegex)];
    expect(matches.length).toBeGreaterThan(15);

    for (const match of matches) {
      const en = JSON.parse(match[2].replace(/'/g, '"'));
      expect(
        Object.prototype.hasOwnProperty.call(MENU_STRINGS.en, en),
        `Expected L() English string "${en}" to exist in MENU_STRINGS.en`,
      ).toBe(true);
    }
  });

  it("localizes properly across Turkish, English, German, and falls back cleanly for unknown languages", () => {
    // Turkish
    expect(localize("tr", "Ev", "Home")).toBe("Ev");
    expect(localize("tr", "Ayarlar", "Settings")).toBe("Ayarlar");

    // English
    expect(localize("en", "Ev", "Home")).toBe("Home");
    expect(localize("en", "Ayarlar", "Settings")).toBe("Settings");

    // German
    expect(localize("de", "Ev", "Home")).toBe("Zuhause");
    expect(localize("de", "Ayarlar", "Settings")).toBe("Einstellungen");

    // Fallback to English for any other language code
    expect(localize("pt-BR", "Ev", "Home")).toBe("Home");
    expect(localize("ar", "Ev", "Home")).toBe("Home");
    expect(localize("xx", "Ev", "Home")).toBe("Home");
  });

  it("formats devices status count properly in various languages", () => {
    expect(formatDevicesStatus(5, 2, "tr")).toBe("Ev: 5 Cihaz (2 Açık)");
    expect(formatDevicesStatus(5, 2, "en")).toBe("Home: 5 Devices (2 On)");
    expect(formatDevicesStatus(5, 2, "de")).toBe("Zuhause: 5 Geräte (2 Ein)");
    expect(formatDevicesStatus(5, 2, "unknown")).toBe("Home: 5 Devices (2 On)");
  });

  it("validates language code format with isSupportedLanguage", () => {
    expect(isSupportedLanguage("tr")).toBe(true);
    expect(isSupportedLanguage("en")).toBe(true);
    expect(isSupportedLanguage("de")).toBe(true);
    expect(isSupportedLanguage("pt-BR")).toBe(true);
    expect(isSupportedLanguage("zh-CN")).toBe(true);
    expect(isSupportedLanguage("")).toBe(false);
    expect(isSupportedLanguage(null as unknown as string)).toBe(false);
    expect(isSupportedLanguage("invalid_code!")).toBe(false);
  });

  it("ensures theme.js sends uiLang instead of clamped base lang to nexusDesktop.setLanguage", () => {
    const themeCode = fs.readFileSync(THEME_JS, "utf8");
    // Line 108 should send uiLang
    expect(themeCode).toContain("nexusDesktop.setLanguage(uiLang)");
    expect(themeCode).not.toMatch(/nexusDesktop\.setLanguage\(lang\)/);
  });
});
