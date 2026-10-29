import { describe, expect, it } from "vitest";
import Module from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// Masaüstü PAKETLEME güvenliği testi (desktop/package.json → build.files).
//
// Neden var: 1.0.32 kurulumları açılışta şu hatayla ölüyordu —
//   Uncaught Exception: Error: Cannot find module './kit/bridge.cjs'
//   Require stack: - ...\resources\app.asar\main.cjs
// HomeKit köprüsü main.cjs'e eklendi ama electron-builder `files` listesi açık bir
// İZİN LİSTESİDİR: listelenmeyen klasör pakete hiç girmez. Kaynak ağaçta dosya durduğu
// için (ve boot testi kaynaktan yüklediği için) hiçbir test fark etmedi; kullanıcı
// kurulumu çöktü. Bu test iki şeyi kilitler:
//   1) main sürecinin zincirleme olarak gerektirdiği HER yerel dosya build.files'ta
//      kapsamlı olmalı,
//   2) köprü modülü bir gün yine pakette yoksa uygulama yine de açılsın (yalnızca
//      özellik devre dışı kalır).

const requireFromHere = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(HERE, "..", "..", "..", "desktop");
const PKG = JSON.parse(fs.readFileSync(path.join(DESKTOP, "package.json"), "utf8")) as {
  build?: { files?: string[] };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const FILES = PKG.build?.files ?? [];
const BUILTINS = new Set([
  "fs",
  "path",
  "os",
  "http",
  "https",
  "crypto",
  "url",
  "net",
  "zlib",
  "util",
  "events",
]);

/** build.files deseni → paket içine göreli yol kapsamlı mı? (electron-builder anlamı) */
function covered(rel: string): boolean {
  const norm = rel.split(path.sep).join("/");
  const negated = FILES.filter((p) => p.startsWith("!")).map((p) => p.slice(1));
  if (negated.some((p) => matchGlob(norm, p))) return false;
  return FILES.some((p) => !p.startsWith("!") && matchGlob(norm, p));
}

function matchGlob(rel: string, pattern: string): boolean {
  if (pattern.endsWith("/**/*") || pattern.endsWith("/**")) {
    const base = pattern.replace(/\/\*\*(?:\/\*)?$/, "");
    return rel === base || rel.startsWith(base + "/");
  }
  if (!pattern.includes("*")) return rel === pattern;
  // basit tek-yıldız deseni (şu an listede yok ama kuralın geleceği için)
  const re = new RegExp(
    "^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*") + "$",
  );
  return re.test(rel);
}

/** Bir .cjs dosyasındaki göreceli require() hedeflerini çözülmüş mutlak yola çevirir. */
function localRequires(file: string): string[] {
  const src = fs.readFileSync(file, "utf8");
  const out: string[] = [];
  for (const m of src.matchAll(/require\(\s*["'`](\.[^"'`]+)["'`]\s*\)/g)) {
    const target = resolveLocal(path.resolve(path.dirname(file), m[1]));
    if (target) out.push(target);
  }
  return out;
}

function resolveLocal(base: string): string | null {
  const tries = [base, base + ".cjs", base + ".js", base + ".json", path.join(base, "index.cjs")];
  for (const t of tries) {
    try {
      if (fs.statSync(t).isFile()) return t;
    } catch {
      /* yoksa sıradaki adayı dene */
    }
  }
  return null;
}

describe("desktop packaging (build.files) safety", () => {
  it("main-process entry files are listed in build.files", () => {
    for (const entry of ["main.cjs", "preload.cjs", "auth-preload.cjs"]) {
      expect(covered(entry), `build.files listesinde ${entry} olmalı`).toBe(true);
    }
  });

  // Asıl kural: main.cjs'ten zincirleme erişilen her yerel dosya pakette olmalı.
  it("every local module required by the main process is packaged", () => {
    const seen = new Set<string>();
    const queue = ["main.cjs", "preload.cjs", "auth-preload.cjs"]
      .map((f) => path.join(DESKTOP, f))
      .filter((f) => fs.existsSync(f));
    const missing: string[] = [];
    while (queue.length) {
      const file = queue.shift() as string;
      if (seen.has(file)) continue;
      seen.add(file);
      const rel = path.relative(DESKTOP, file).split(path.sep).join("/");
      if (rel !== "main.cjs" && rel !== "preload.cjs" && rel !== "auth-preload.cjs") {
        if (!covered(rel)) missing.push(rel);
      }
      for (const dep of localRequires(file)) queue.push(dep);
    }
    expect(missing, "paketlenmeyen yerel modüller: " + missing.join(", ")).toEqual([]);
    expect(seen.size, "zincir en az main.cjs + köprü modülünü içermeli").toBeGreaterThan(1);
  });

  it("HomeKit bridge module exists and is packaged (1.0.32 regression)", () => {
    expect(fs.existsSync(path.join(DESKTOP, "kit", "bridge.cjs"))).toBe(true);
    expect(covered("kit/bridge.cjs")).toBe(true);
  });

  // Köprü modülünün tek ağır bağımlılığı hap-nodejs'tir; electron-builder yalnızca
  // `dependencies`'i pakete koyar. devDependencies'e düşerse kurulumda modül bulunamaz.
  it("bridge runtime dependency is a production dependency", () => {
    const bridge = fs.readFileSync(path.join(DESKTOP, "kit", "bridge.cjs"), "utf8");
    const deps = new Set(
      [...bridge.matchAll(/require\(\s*["']([a-z@][^"']*)["']/g)]
        .map((m) => m[1])
        .filter((d) => !d.startsWith("node:") && !BUILTINS.has(d)),
    );
    expect(deps.size, "köprü en az bir paket bağımlılığı kullanmalı").toBeGreaterThan(0);
    for (const dep of deps) {
      expect(
        PKG.dependencies?.[dep],
        `${dep} dependencies içinde olmalı (devDependencies pakete girmez)`,
      ).toBeTruthy();
    }
  });
});

// ---- 3) Yeniden üretilebilir dosya kuralları: src/app → paket içindeki app/ ----
//
// Aynı hatanın ikinci yüzü: desktop/scripts/prepare-app.cjs de el ile tutulan bir
// APP_JS listesi taşıyordu. theme.js, push.js'i sayfa yüklenirken enjekte ediyor
// (document.write), ama dosya listede yoktu → masaüstü paketi push.js'siz çıkıyordu.
// Crash olmadığı için sessiz kalıcı bir özellik kaybı. Kural artık ters ve tek yerde:
// src/app altındaki her .js varsayılan olarak gemiye girer.
describe("desktop app file rules (src/app → packaged app/)", () => {
  const SRC_APP = path.resolve(DESKTOP, "..", "src", "app");
  const rules = requireFromHere(path.join(DESKTOP, "scripts", "app-file-rules.cjs")) as {
    isAppFile: (f: string) => boolean;
    EXCLUDE_JS: Set<string>;
  };
  const appFiles = fs
    .readdirSync(SRC_APP)
    .filter((f) => fs.statSync(path.join(SRC_APP, f)).isFile());
  const appJs = appFiles.filter((f) => f.endsWith(".js"));

  it("ships every src/app JS unless explicitly excluded", () => {
    const dropped = appJs.filter((f) => !rules.EXCLUDE_JS.has(f) && !rules.isAppFile(f));
    expect(
      dropped,
      "pakete girmeyen src/app modülleri (sessiz özellik kaybı): " + dropped.join(", "),
    ).toEqual([]);
  });

  it("exclusions are few and justified", () => {
    // cloud-config.js tek meşru istisna: anahtarlar hazırlama adımında kontrollü konur.
    expect([...rules.EXCLUDE_JS].sort()).toEqual(["cloud-config.js"]);
  });

  it("the modules loaded at runtime are packaged (push wave regression)", () => {
    for (const f of [
      "theme.js",
      "push.js",
      "firebase-messaging-sw.js",
      "notify.js",
      "nexus-feedback.js",
      "nexus-undo.js",
      "nexus-dialog.js",
      "command-palette.js",
      "lang-en.js",
      "desktop.js",
    ]) {
      // Dosya henüz depoya girmemişse (dev bir dalga) var olduğunu iddia etmeyiz;
      // ama VARSA kural gereği pakete girmek zorunda.
      if (fs.existsSync(path.join(SRC_APP, f))) {
        expect(rules.isAppFile(f), `${f} masaüstü paketine girmeli`).toBe(true);
        expect(covered("app/" + f), `build.files app/${f} kapsamlı`).toBe(true);
      }
    }
    // Çekirdek listesi her zaman var olmalı.
    for (const f of ["theme.js", "notify.js", "desktop.js", "lang-en.js"]) {
      expect(fs.existsSync(path.join(SRC_APP, f)), `${f} src/app içinde olmalı`).toBe(true);
    }
  });

  // İkinci liste (www/Capacitor) ayrı duruyor; unutulursa test söylesin.
  it("the www sync allowlist registers the same modules", () => {
    const sync = fs.readFileSync(path.resolve(DESKTOP, "..", "scripts", "sync-www.mjs"), "utf8");
    const unregistered = appJs.filter(
      (f) => !rules.EXCLUDE_JS.has(f) && !sync.includes('"' + f + '"'),
    );
    expect(
      unregistered,
      "sync-www.mjs APP_JS/APP_FILES listesine eklenmemiş modüller: " + unregistered.join(", "),
    ).toEqual([]);
  });
});

// ---- 2) Zarif bozulma: köprü pakette yoksa uygulama yine de açılmalı ----
describe("desktop main survives a missing bridge module", () => {
  function fakeElectron() {
    const noopClass = class {};
    const ipcHandlers = new Map<string, (...args: unknown[]) => unknown>();
    return {
      handlers: ipcHandlers,
      electron: {
        app: {
          isPackaged: false,
          name: "",
          isReady: () => true,
          setName: () => {},
          setAppUserModelId: () => {},
          requestSingleInstanceLock: () => true,
          getPath: () => path.join(os.tmpdir(), "nexus-pkg-test"),
          getVersion: () => "0.0.0-test",
          getLocale: () => "tr-TR",
          getSystemLocale: () => "tr-TR",
          getPreferredSystemLanguages: () => ["tr-TR"],
          getLoginItemSettings: () => ({ openAtLogin: false }),
          setLoginItemSettings: () => {},
          on: () => {},
          once: () => {},
          quit: () => {},
          relaunch: () => {},
          whenReady: () => new Promise<never>(() => {}),
        },
        ipcMain: {
          handle: (channel: string, fn: (...args: unknown[]) => unknown) =>
            ipcHandlers.set(channel, fn),
          on: () => {},
        },
        BrowserWindow: noopClass,
        Menu: { setApplicationMenu: () => {}, buildFromTemplate: () => ({}) },
        shell: { openExternal: () => {}, showItemInFolder: () => {} },
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
      },
    };
  }

  // main.cjs'i, köprü modülü YÜKLENEMEZYORMUŞ gibi davranan bir yükleyiciyle çalıştır.
  // failRequest: "./kit/bridge.cjs" = paketleme hatası (1.0.32), "hap-nodejs" = Electron'un
  // BoringSSL\'inde chacha20-poly1305 olmadığı için motorun kendisinin düşmesi.
  function loadMainWithFailing(failRequest: string): Map<string, (...args: unknown[]) => unknown> {
    const { electron, handlers } = fakeElectron();
    const mod = Module as unknown as { _load: (request: string, ...rest: unknown[]) => unknown };
    const original = mod._load;
    mod._load = function patched(request: string, ...rest: unknown[]): unknown {
      if (request === "electron") return electron;
      if (request === failRequest) {
        throw Object.assign(new Error(`Cannot find module '${failRequest}'`), {
          code: "MODULE_NOT_FOUND",
        });
      }
      return original.call(Module, request, ...rest);
    };
    const mainPath = path.join(DESKTOP, "main.cjs");
    delete requireFromHere.cache[mainPath];
    const realExit = process.exit;
    process.exit = (() => undefined) as never; // tek örnek kilidi dalı testte süreci öldürmesin
    try {
      requireFromHere(mainPath);
    } finally {
      process.exit = realExit;
      mod._load = original;
      delete requireFromHere.cache[mainPath];
    }
    return handlers;
  }

  const BRIDGE = "./kit/bridge.cjs";
  const HAP = "hap-nodejs";

  it("boots, and the rest of the app keeps working", () => {
    const handlers = loadMainWithFailing(BRIDGE);
    expect(handlers.size, "IPC kayıtları kurulmaya devam etmeli").toBeGreaterThan(5);
    expect(handlers.has("kit:status")).toBe(true);
    expect(handlers.has("app:info")).toBe(true);
  });

  it("reports the bridge as unavailable instead of crashing", () => {
    const handlers = loadMainWithFailing(BRIDGE);
    const status = (handlers.get("kit:status") as () => Record<string, unknown>)();
    expect(status.running).toBe(false);
    expect(String(status.lastError)).toContain("kit/bridge.cjs");
    expect(String(status.lastError)).toContain("Home Assistant");
    expect(status.accessoryCount).toBe(0);
  });

  it("kit:start rejects with a clear message (renderer sees an error, not a dead app)", async () => {
    const handlers = loadMainWithFailing(BRIDGE);
    const start = handlers.get("kit:start") as (e: unknown, p: unknown) => Promise<unknown>;
    await expect(start({ sender: null }, { pincode: "031-45-154", devices: [] })).rejects.toThrow(
      /HomeKit köprüsü bu kurulumda kullanılamıyor/,
    );
  });

  // Üretimdeki ASIL durum: dosya pakette olsa bile Electron'un BoringSSL\'inde
  // chacha20-poly1305 olmadığı için hap-nodejs yüklenirken fırlatıyor. Bu, köprüyı
  // kullanılamaz yapar ama UYGULAMAYI düşürmemeli.
  it("boots even when the HAP engine itself cannot load (Electron BoringSSL)", () => {
    const handlers = loadMainWithFailing(HAP);
    expect(handlers.has("kit:status"), "tüm IPC kayıtları kurulmuş kalmalı").toBe(true);
    const status = (handlers.get("kit:status") as () => Record<string, unknown>)();
    expect(status.running).toBe(false);
    expect(String(status.lastError)).toContain("Home Assistant");
  });
});
