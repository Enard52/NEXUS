import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Güvenlik modu (NEXUS düzeyinde mod anahtarı): tetikleyici yalnızca mod DEĞİŞİNCE çalışır; "modu ayarla"
 * eylemi modu yazar. Gerçek bir alarm paneliyle ilgisi yoktur (security-mode.js başlığı).
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const ENGINE = readFileSync(resolve(ROOT, "src/app/automation-engine.js"), "utf8");
const MODULE = readFileSync(resolve(ROOT, "src/app/security-mode.js"), "utf8");

function setup(autos: unknown[], initialMode?: string) {
  const store = new Map<string, string>();
  store.set("nexusCustomAutomations", JSON.stringify(autos));
  if (initialMode) store.set("nexusSecurityMode", JSON.stringify(initialMode));
  const ranScenes: string[] = [];
  const win: Record<string, any> = {
    NX: {
      SCENES: { evde: { title: "Evde" } },
      runScene: (id: string) => (ranScenes.push(id), { changed: 1, title: "Evde" }),
      sceneSummary: () => "Evde: 1 cihaz ayarlandı.",
      readDevices: () => [],
      setField: () => {},
    },
  };
  const doc = {
    readyState: "loading",
    addEventListener: () => {},
    documentElement: { classList: { contains: () => false } },
    querySelector: () => null,
  };
  const get = (k: string) => store.get(k) ?? null;
  const put = (k: string, v: string) => void store.set(k, v);
  new Function("window", "document", "NX", "nexusGetItem", "nexusSetItem", "fetch", ENGINE)(
    win,
    doc,
    win.NX,
    get,
    put,
    () => Promise.reject(new Error("fetch yok")),
  );
  new Function("window", "nexusGetItem", "nexusSetItem", MODULE)(win, get, put);
  return { win, store, ranScenes, engine: win.NexusAutomationEngine, mode: win.nexusSecurityMode };
}

const rule = (value: string, extra: Record<string, unknown> = {}) => ({
  id: "s1",
  title: "Dışarı",
  enabled: true,
  trigger: { type: "security", value },
  sceneId: "evde",
  actions: [],
  ...extra,
});

describe("güvenlik modu tetikleyicisi", () => {
  it("ilk okuma başlangıçtır; mod ilgili değere değişince bir kez çalışır", () => {
    const t = setup([rule("away")], "home");
    expect(t.engine.watchSecurity()).toBe(0); // başlangıç durumu
    expect(t.mode.set("away")).toBe(true);
    expect(t.engine.watchSecurity()).toBe(1);
    expect(t.engine.watchSecurity()).toBe(0); // değişmedi
    expect(t.ranScenes).toEqual(["evde"]);
  });

  it("başka moda geçiş ya da kapalı kural tetiklemez", () => {
    const t = setup([rule("away"), rule("night", { id: "s2", enabled: false })], "home");
    t.engine.watchSecurity();
    t.mode.set("night");
    expect(t.engine.watchSecurity()).toBe(0);
    expect(t.ranScenes).toEqual([]);
  });

  it("geçersiz mod yazılamaz", () => {
    const t = setup([], "home");
    expect(t.mode.set("alarm")).toBe(false);
    expect(t.mode.get()).toBe("home");
  });

  it("'modu ayarla' eylemi modu yazar ve olay günlüğüne dürüst özet düşer", () => {
    const t = setup(
      [rule("night", { sceneId: undefined, actions: [{ kind: "security-mode", value: "away" }] })],
      "home",
    );
    t.engine.watchSecurity();
    t.mode.set("night");
    expect(t.engine.watchSecurity()).toBe(1);
    expect(t.mode.get()).toBe("away");
    const evs = JSON.parse(t.store.get("nexusEvents") || "[]");
    expect(evs[evs.length - 1].detail).toContain("güvenlik modu Dışarıda yapıldı");
  });
});
