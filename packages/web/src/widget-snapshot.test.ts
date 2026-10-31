import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Android widget anlık görüntüsü: yalnızca mobil uygulamada, yalnızca durumu bilinen cihazlar, değişmedikçe
 * yeniden yazılmaz. Eklenti taklittir (gerçek widget/Android ile doğrulama DEĞİLDİR).
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const ENGINE = readFileSync(resolve(ROOT, "src/app/automation-engine.js"), "utf8");

function setup(opts: { native?: boolean; devices: unknown[] }) {
  const store = new Map<string, string>();
  store.set("nexusPairedDevices", JSON.stringify(opts.devices));
  const calls: Array<{ devices: Array<{ name: string; on: boolean }> }> = [];
  const win: Record<string, any> = {};
  if (opts.native !== false)
    win.Capacitor = {
      isNativePlatform: () => true,
      Plugins: { NexusWidget: { update: (p: any) => (calls.push(p), Promise.resolve()) } },
    };
  const doc = {
    readyState: "loading",
    addEventListener: () => {},
    documentElement: { classList: { contains: () => false } },
    querySelector: () => null,
  };
  new Function("window", "document", "nexusGetItem", "nexusSetItem", ENGINE)(
    win,
    doc,
    (k: string) => store.get(k) ?? null,
    (k: string, v: string) => void store.set(k, v),
  );
  return { engine: win.NexusAutomationEngine, calls, store };
}

describe("widget anlık görüntüsü", () => {
  it("yalnızca açık/kapalı durumu bilinen cihazlar yazılır", () => {
    const t = setup({
      devices: [
        { name: "Salon", state: { switch: true } },
        { name: "Mutfak", state: { switch: false } },
        { name: "Bilinmeyen", state: {} },
        { name: "Durumsuz" },
      ],
    });
    expect(t.engine.pushWidget()).toBe(true);
    expect(t.calls[0].devices).toEqual([
      { name: "Salon", on: true },
      { name: "Mutfak", on: false },
    ]);
  });

  it("değişmedikçe yeniden yazılmaz, değişince yazılır", () => {
    const t = setup({ devices: [{ name: "Salon", state: { switch: true } }] });
    expect(t.engine.pushWidget()).toBe(true);
    expect(t.engine.pushWidget()).toBe(false);
    t.store.set(
      "nexusPairedDevices",
      JSON.stringify([{ name: "Salon", state: { switch: false } }]),
    );
    expect(t.engine.pushWidget()).toBe(true);
    expect(t.calls.length).toBe(2);
  });

  it("mobil uygulama değilse hiçbir şey yazmaz", () => {
    const t = setup({ native: false, devices: [{ name: "Salon", state: { switch: true } }] });
    expect(t.engine.pushWidget()).toBe(false);
    expect(t.calls).toEqual([]);
  });
});
