import { afterEach, describe, expect, it } from "vitest";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// Masaüstü kabuğunun (desktop/main.cjs) açılış güvenliği testi.
//
// Neden var: 1.0.26'da Windows kurulumu şu hatayla hiç açılmıyordu —
//   Uncaught Exception: Error: app.getSystemLocale() can only be called
//   after app is ready   (main.cjs, modül yükleme anında)
// Electron'un yerel dil API'leri yalnızca `app` hazır olduktan sonra çağrılabilir.
// Modül yüklenirken çalışan bir yardımcının içine girerlerse kurulum çöker. Bu test
// main.cjs'i "henüz hazır değil ve çağrılırsa fırlatan" düşmanca bir Electron
// sahtesiyle yükler; aynı sınıf hata geri gelirse test kırmızıya döner.

const requireFromHere = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAIN_CJS = path.resolve(HERE, "..", "..", "..", "desktop", "main.cjs");

type Loader = (request: string, ...rest: unknown[]) => unknown;

interface FakeApp {
  calls: string[];
  [key: string]: unknown;
}

interface FakeElectron {
  app: FakeApp;
  ipcHandlers: Map<string, unknown>;
  ipcEvents: Map<string, unknown>;
  [key: string]: unknown;
}

function makeElectron(opts: { ready: boolean; locale?: string }): FakeElectron {
  const calls: string[] = [];
  const gate = (name: string, value: string): string => {
    calls.push(name);
    // Gerçek Electron davranışı: hazır değilken fırlat.
    if (!opts.ready) throw new Error(`app.${name}() can only be called after app is ready`);
    return value;
  };
  const app: FakeApp = {
    calls,
    name: "",
    isPackaged: false,
    isReady: () => opts.ready,
    setName: (n: unknown) => {
      app.name = String(n);
    },
    setAppUserModelId: () => {},
    requestSingleInstanceLock: () => true,
    getPath: () => path.join(os.tmpdir(), "nexus-boot-test"),
    getVersion: () => "0.0.0-test",
    getLocale: () => gate("getLocale", opts.locale ?? "en-US"),
    getSystemLocale: () => gate("getSystemLocale", opts.locale ?? "en-US"),
    getPreferredSystemLanguages: () => {
      calls.push("getPreferredSystemLanguages");
      if (!opts.ready) throw new Error("app.getPreferredSystemLanguages() can only be called after app is ready");
      return [opts.locale ?? "en-US"];
    },
    getLoginItemSettings: () => {
      calls.push("getLoginItemSettings");
      if (!opts.ready) throw new Error("app.getLoginItemSettings() can only be called after app is ready");
      return { openAtLogin: false, wasOpenedAsHidden: false };
    },
    setLoginItemSettings: () => {},
    on: () => {},
    once: () => {},
    quit: () => {},
    relaunch: () => {},
    whenReady: () => new Promise<never>(() => {}), // hazır anı bu testte hiç gelmez
  };
  const ipcHandlers = new Map<string, unknown>();
  const ipcEvents = new Map<string, unknown>();
  const noopClass = class {};
  return {
    app,
    ipcHandlers,
    ipcEvents,
    // main.cjs'in aldığı geri kalan her şey: yüklenirken dokunulmamalı.
    BrowserWindow: noopClass,
    Menu: { setApplicationMenu: () => {}, buildFromTemplate: () => ({}) },
    shell: { openExternal: () => {}, showItemInFolder: () => {} },
    ipcMain: {
      handle: (channel: string, fn: unknown) => ipcHandlers.set(channel, fn),
      on: (channel: string, fn: unknown) => ipcEvents.set(channel, fn),
    },
    protocol: { registerSchemesAsPrivileged: () => {}, handle: () => {}, registerFileProtocol: () => {} },
    net: { request: () => ({ on: () => {}, end: () => {}, write: () => {} }) },
    nativeTheme: { shouldUseDarkColors: false, on: () => {} },
    dialog: { showMessageBox: () => ({}), showErrorBox: () => {} },
    Tray: noopClass,
    Notification: noopClass,
    screen: { on: () => {}, getDisplays: () => [], getPrimaryDisplay: () => ({ bounds: { width: 1920, height: 1080 } }) },
    globalShortcut: { register: () => true, unregisterAll: () => {} },
    session: { defaultSession: { setPermissionRequestHandler: () => {}, setPermissionCheckHandler: () => {}, on: () => {} } },
    nativeImage: { createFromPath: () => ({}) },
  };
}

function loadMainWith(fake: FakeElectron): void {
  const mod = Module as unknown as { _load: Loader };
  const originalLoad = mod._load;
  mod._load = function patched(request: string, ...rest: unknown[]): unknown {
    if (request === "electron") return fake;
    return (originalLoad as Loader).call(Module, request, ...rest);
  };
  delete requireFromHere.cache[MAIN_CJS];
  try {
    requireFromHere(MAIN_CJS);
  } finally {
    mod._load = originalLoad;
    delete requireFromHere.cache[MAIN_CJS];
  }
}

const originalPlatform = Object.getOwnPropertyDescriptor(process, "platform");

function withPlatform(platform: string, run: () => void): void {
  Object.defineProperty(process, "platform", { value: platform, configurable: true });
  try {
    run();
  } finally {
    if (originalPlatform) Object.defineProperty(process, "platform", originalPlatform);
  }
}

afterEach(() => {
  if (originalPlatform) Object.defineProperty(process, "platform", originalPlatform);
});

describe("desktop main boot safety", () => {
  it("loads on Windows before app is ready without touching ready-gated locale APIs", () => {
    const fake = makeElectron({ ready: false, locale: "tr-TR" });
    expect(() => withPlatform("win32", () => loadMainWith(fake))).not.toThrow();
    // Hazır değilken bu üçüne hiç dokunulmamalı; dokunulsaydı Electron fırlatırdı.
    expect(fake.app.calls).not.toContain("getLocale");
    expect(fake.app.calls).not.toContain("getSystemLocale");
    expect(fake.app.calls).not.toContain("getPreferredSystemLanguages");
  });

  it("loads on macOS before app is ready even if login-item settings throw", () => {
    const fake = makeElectron({ ready: false, locale: "tr-TR" });
    expect(() => withPlatform("darwin", () => loadMainWith(fake))).not.toThrow();
    expect(fake.app.calls).not.toContain("getLoginItemSettings");
  });

  it("still uses the real locale APIs once app is ready", () => {
    const fake = makeElectron({ ready: true, locale: "tr-TR" });
    expect(() => withPlatform("win32", () => loadMainWith(fake))).not.toThrow();
    expect(fake.app.calls).toContain("getSystemLocale");
  });
});
