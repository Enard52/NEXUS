import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * NX.runItem: kaydedilmiş Tıkla ve Çalıştır kaydını çalıştırır (ana ekran kartı, Siri/derin bağlantı aynı yol).
 * Hazır senaryo (sceneId) ya da cihaz adımları (actions) çalışır; eylemi olmayan kayıt "çalıştı" sayılmaz.
 */
const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "src", "app");
const controls = readFileSync(join(APP, "device-controls.js"), "utf8");
const a = controls.indexOf("var SECURITY_MODES");
const b = controls.indexOf("function deviceUrl");
const BLOCK = controls.slice(a, b);

type Dev = { name: string; host?: string };
function load(devices: Dev[]) {
  const store: Record<string, string> = {};
  const setField = vi.fn();
  const runScene = vi.fn(() => ({ changed: 2, lanDevices: [], title: "Film modu" }));
  const fn = new Function(
    "SCENES",
    "runScene",
    "sceneSummary",
    "readDevices",
    "setField",
    "isLan",
    "nexusSetItem",
    BLOCK + "; return { runItem, itemRunnable };",
  );
  const api = fn(
    { "movie-mode": { title: "Film modu" } },
    runScene,
    (r: { title: string; changed: number }) => r.title + ": " + r.changed + " cihaz ayarlandı.",
    () => devices,
    setField,
    (d: Dev) => !!d.host,
    (k: string, v: string) => (store[k] = v),
  );
  return { ...api, setField, runScene, store };
}

const devs: Dev[] = [{ name: "Salon Lambası", host: "192.168.1.20" }, { name: "Klima" }];

describe("NX.runItem", () => {
  it("hazır senaryolu kaydı runScene ile çalıştırır", () => {
    const { runItem, runScene } = load(devs);
    const r = runItem({ title: "Film", sceneId: "movie-mode", actions: [] });
    expect(runScene).toHaveBeenCalledWith("movie-mode");
    expect(r.changed).toBe(2);
    expect(r.runnable).toBe(true);
  });

  it("cihaz adımlarını ada göre uygular ve yerel ağ cihazını bildirir", () => {
    const { runItem, setField } = load(devs);
    const r = runItem({
      title: "Gece",
      actions: [{ name: "Salon Lambası", field: "switch", value: false }],
    });
    expect(setField).toHaveBeenCalledWith(0, "switch", false);
    expect(r.changed).toBe(1);
    expect(r.lanDevices).toEqual([{ index: 0, name: "Salon Lambası" }]);
    expect(r.summary).toMatch(/1 cihaz ayarlandı/);
  });

  it("güvenlik modu adımını yazar", () => {
    const { runItem, store } = load(devs);
    const r = runItem({ title: "Çıkış", actions: [{ kind: "security-mode", value: "away" }] });
    expect(store.nexusSecurityMode).toBe("away");
    expect(r.summary).toMatch(/Dışarıda/);
  });

  it("eylemsiz ya da cihazı silinmiş kayıt 'çalıştı' saymaz", () => {
    const { runItem, itemRunnable, setField } = load(devs);
    expect(itemRunnable({ title: "Boş", actions: [] })).toBe(false);
    expect(runItem({ title: "Boş", actions: [] }).changed).toBe(0);
    const gone = runItem({
      title: "Eski",
      actions: [{ name: "Yok", field: "switch", value: true }],
    });
    expect(gone.changed).toBe(0);
    expect(gone.summary).toMatch(/eşleşmiş değil/);
    expect(setField).not.toHaveBeenCalled();
  });
});
