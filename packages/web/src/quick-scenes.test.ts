import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const REPO_ROOT = resolve(__dirname, "../../..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/quick-scenes.js"), "utf8");

type Dev = { name: string; kind: string };

// Gerçek NX yerine yalnızca bu testin ihtiyacı olan en küçük yüzey: senaryo adımlarını cihaz türüne göre döndürür.
function load(devices: Dev[], stored: any[] = []) {
  const written: Record<string, any[]> = {};
  const g = globalThis as any;
  g.readAndNormalizeItems = () => stored.slice();
  g.writeNormalizedItems = (key: string, items: any[]) => {
    written[key] = items;
  };
  const win: any = {
    NX: {
      SCENES: { "leave-home": { title: "Evden çıkış" }, "clean-start": { title: "Temizlik" } },
      readDevices: () => devices,
      sceneActsOf: (id: string, d: Dev) => {
        if (id === "leave-home" && d.kind === "light") return [["switch", false]];
        if (id === "leave-home" && d.kind === "lock") return [["locked", true]];
        if (id === "clean-start" && d.kind === "vacuum") return [["mode", "clean"]];
        return [];
      },
    },
  };
  g.window = win;
  g.NX = win.NX;
  new Function("window", SOURCE)(win);
  return { QS: win.nexusQuickScenes, written };
}

afterEach(() => {
  const g = globalThis as any;
  delete g.readAndNormalizeItems;
  delete g.writeNormalizedItems;
  delete g.window;
  delete g.NX;
});

describe("nexusQuickScenes", () => {
  it("cihaz yokken hiçbir senaryo uygulanabilir sayılmaz", () => {
    const { QS } = load([]);
    expect(QS.hasDevices()).toBe(false);
    expect(QS.available()).toEqual([]);
  });

  it("yalnızca gerçekten etkilenen cihazları listeler ve uygulanabilir olanı öne alır", () => {
    const { QS } = load([
      { name: "Salon Lamba", kind: "light" },
      { name: "Giriş Kilidi", kind: "lock" },
    ]);
    const all = QS.list();
    expect(all[0].id).toBe("leave-home");
    expect(all[0].affected).toBe(2);
    expect(all.find((e: any) => e.id === "clean-start").affected).toBe(0);
    expect(QS.available().map((e: any) => e.id)).toEqual(["leave-home"]);
  });

  it("önizleme cihaz adı ve Türkçe sonuç metni verir", () => {
    const { QS } = load([{ name: "Giriş Kilidi", kind: "lock" }]);
    expect(QS.preview("leave-home")).toEqual([
      { name: "Giriş Kilidi", index: 0, text: "kilitlenir", thumb: "" },
    ]);
  });

  it("clickrun kaydı sceneId ile yazılır, otomasyon kaydı verilen tetikleyiciyi taşır", () => {
    const { QS, written } = load([]);
    QS.save("clickrun", "leave-home", {});
    expect(written.nexusCustomClickRun[0]).toMatchObject({
      sceneId: "leave-home",
      title: "Evden çıkış",
      trigger: { type: "manual" },
    });
    const trigger = { type: "time", value: "23:00", repeat: "daily" };
    QS.save("automation", "leave-home", { trigger, title: "Gece" });
    expect(written.nexusCustomAutomations[0]).toMatchObject({ title: "Gece", trigger });
  });
});
