import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Tasarruf stratejileri kullanıcının cihazlarına göre seçilir ve sıralanır. Cihaz türü (NX.kindOf) küçük bir taklitle
 * verilir, okunmuş güç değeri ise cihaz kaydındaki fields.power'dır; gerçek cihaz yetenek eşlemesini sınamaz, yalnızca
 * seçim/sıralama mantığını ve boş durumu sınar.
 */
const SRC = readFileSync(resolve(__dirname, "../../../src/app/energy-strategies.js"), "utf8");

type Dev = { name: string; kind: string; power?: boolean; fields?: { power: number } };

function load() {
  const win: any = {
    NX: {
      kindOf: (d: Dev) => d.kind,
    },
  };
  new Function("window", SRC)(win);
  return win.nexusEnergyStrategies;
}

describe("enerji stratejileri cihaza göre", () => {
  it("cihaz yoksa hiç strateji önerilmez", () => {
    expect(load().rank([])).toEqual([]);
  });

  it("yalnızca uyan cihazı olan stratejiler gelir", () => {
    const S = load();
    const out = S.rank([{ name: "Salon Lambası", kind: "light" }]);
    expect(out.map((r: any) => r.strategy.id)).toEqual(["lights-away"]);
  });

  it("uygun cihaz sayısı ve güç ölçümü sıralamayı belirler", () => {
    const S = load();
    const out = S.rank([
      { name: "L1", kind: "light" },
      { name: "Klima", kind: "ac" },
      { name: "Priz 1", kind: "switch", fields: { power: 12 } },
      { name: "Priz 2", kind: "energy", fields: { power: 12 } },
    ]);
    // priz: 2 cihaz + 2 ölçüm (30) > klima (10 + 0 = 10) = ışık (10)
    expect(out.map((r: any) => r.strategy.id)).toEqual(["standby-night", "lights-away", "ac-away"]);
  });

  it("eşit puanda katalog sırası korunur", () => {
    const S = load();
    const out = S.rank([
      { name: "Klima", kind: "ac" },
      { name: "L1", kind: "light" },
    ]);
    expect(out.map((r: any) => r.strategy.id)).toEqual(["lights-away", "ac-away"]);
  });

  it("cihaz listesi: uygun olanlar önde, ölçülebilenler önce", () => {
    const S = load();
    const title = "Gece bekleme tüketimini kes";
    const sorted = S.sortDevicesFor(title, [
      { name: "Lamba", kind: "light" },
      { name: "Priz A", kind: "switch" },
      { name: "Priz B", kind: "switch", fields: { power: 12 } },
    ]);
    expect(sorted.map((d: Dev) => d.name)).toEqual(["Priz B", "Priz A", "Lamba"]);
    expect(S.isRelevant(title, { name: "Lamba", kind: "light" })).toBe(false);
  });

  it("boş durum dürüst: cihaz yokken örnek strateji çizilmez", () => {
    const S = load();
    const host: any = { innerHTML: "" };
    S.render(host, []);
    expect(host.innerHTML).toContain("nexus-pair.html");
    expect(host.innerHTML).not.toContain("data-strategy");
  });

  it("başlıklar otomasyon motoruyla uyumlu kalır", () => {
    const engine = readFileSync(
      resolve(__dirname, "../../../src/app/automation-engine.js"),
      "utf8",
    );
    const S = load();
    const night = S.CATALOG.find((c: any) => c.id === "standby-night");
    expect(engine).toContain(`"${night.title}"`);
  });
});
