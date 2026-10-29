import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Sensör izleme: yalnızca cihazdan OKUNAN durum değişimi olay üretir. Burada cihaz okuması
 * NX.refreshFromDevice taklidiyle verilir (paket/protokol sınaması lan-*.test.ts'te);
 * bu testler gerçek sensörle doğrulama değildir.
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(ROOT, "src/app/automation-engine.js"), "utf8");

type Dev = { id: string; name: string; host: string; protocol: string; kind: string };

function setup(
  devices: Dev[],
  reads: Record<string, Array<Record<string, unknown> | null>>,
  automations: unknown[] = [],
) {
  const store = new Map<string, string>();
  store.set("nexusPairedDevices", JSON.stringify(devices));
  if (automations.length) store.set("nexusCustomAutomations", JSON.stringify(automations));
  const ranScenes: string[] = [];
  const calls: Record<string, number> = {};
  const win: Record<string, any> = {
    NX: {
      SCENES: { evde: { title: "Evde" } },
      runScene: (id: string) => (ranScenes.push(id), { changed: 1, title: "Evde" }),
      sceneSummary: () => "Evde: 1 cihaz ayarlandı.",
      readDevices: () => devices,
      isLan: (d: Dev) => !!(d && d.host && d.protocol),
      kindOf: (d: Dev) => d.kind,
      refreshFromDevice: (i: number) => {
        const id = devices[i].id;
        calls[id] = (calls[id] || 0) + 1;
        const list = reads[id] || [];
        return Promise.resolve(list[Math.min(calls[id] - 1, list.length - 1)] ?? null);
      },
    },
  };
  const doc = {
    readyState: "loading",
    addEventListener: () => {},
    documentElement: { classList: { contains: () => false } },
    querySelector: () => null,
  };
  // Tarayıcıda window.NX bare "NX" olarak da görünür; burada ayrıca verilir.
  new Function("window", "document", "NX", "nexusGetItem", "nexusSetItem", SOURCE)(
    win,
    doc,
    win.NX,
    (k: string) => store.get(k) ?? null,
    (k: string, v: string) => store.set(k, v),
  );
  const events = () =>
    JSON.parse(store.get("nexusEvents") || "[]") as Array<Record<string, string>>;
  return { engine: win.NexusAutomationEngine, events, ranScenes };
}

const motion: Dev = {
  id: "m1",
  name: "Koridor hareket",
  host: "192.168.1.5",
  protocol: "shelly",
  kind: "motion",
};
const door: Dev = {
  id: "d1",
  name: "Ön kapı",
  host: "192.168.1.6",
  protocol: "shelly",
  kind: "contact",
};
const smoke: Dev = {
  id: "s1",
  name: "Mutfak duman",
  host: "192.168.1.7",
  protocol: "shelly",
  kind: "alarm",
};
const lamp: Dev = {
  id: "l1",
  name: "Lamba",
  host: "192.168.1.8",
  protocol: "shelly",
  kind: "light",
};

describe("sensör durum değişimi olaya dönüşür", () => {
  it("ilk okuma yalnız başlangıçtır; kapalı→açık geçişi güvenlik olayı yazar", async () => {
    const { engine, events } = setup([motion], { m1: [{ active: false }, { active: true }] });
    expect(await engine.watchSensors(true)).toBe(0);
    expect(events()).toEqual([]);
    expect(await engine.watchSensors(true)).toBe(1);
    expect(events()).toHaveLength(1);
    expect(events()[0]).toMatchObject({
      type: "security",
      title: "Hareket algılandı",
      detail: "Koridor hareket",
    });
  });

  it("açık başlayan sensör olay üretmez (uygulama kapalıyken olanlar sayılmaz)", async () => {
    const { engine, events } = setup([motion], { m1: [{ active: true }, { active: true }] });
    await engine.watchSensors(true);
    await engine.watchSensors(true);
    expect(events()).toEqual([]);
  });

  it("kapı güvenlik, duman/su alarmı acil türü olarak yazılır", async () => {
    const { engine, events } = setup([door, smoke], {
      d1: [{ active: false }, { active: true }],
      s1: [{ active: false }, { active: true }],
    });
    await engine.watchSensors(true);
    await engine.watchSensors(true);
    const byTitle = Object.fromEntries(events().map((e) => [e.detail, e.type]));
    expect(byTitle).toEqual({ "Ön kapı": "security", "Mutfak duman": "emergency" });
  });

  it("aynı anda iki sensör iki ayrı kimlikle yazılır (biri diğerini ezmez)", async () => {
    const { engine, events } = setup([door, smoke], {
      d1: [{ active: false }, { active: true }],
      s1: [{ active: false }, { active: true }],
    });
    await engine.watchSensors(true);
    await engine.watchSensors(true);
    const ids = events().map((e) => e.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("okunamayan veya durum bildirmeyen sensör olay üretmez; sensör olmayan cihaz okunmaz", async () => {
    const { engine, events } = setup([motion, lamp], {
      m1: [{ active: false }, null, { active: undefined }],
      l1: [{ active: false }, { active: true }],
    });
    await engine.watchSensors(true);
    await engine.watchSensors(true);
    await engine.watchSensors(true);
    expect(events()).toEqual([]);
  });

  it("60 sn içinde aynı sensörden ikinci olay yazılmaz", async () => {
    const { engine, events } = setup([motion], {
      m1: [{ active: false }, { active: true }, { active: false }, { active: true }],
    });
    for (let i = 0; i < 4; i++) await engine.watchSensors(true);
    expect(events()).toHaveLength(1);
  });

  const rule = (over: Record<string, unknown>) => ({
    id: "auto-1",
    title: "Hareket olunca",
    enabled: true,
    sceneId: "evde",
    trigger: { type: "sensor", value: "m1", event: "active" },
    ...over,
  });

  it("sensör tetikleyicili otomasyon yalnız o sensörün gerçek tetiklenmesinde çalışır", async () => {
    const { engine, ranScenes, events } = setup(
      [motion, door],
      { m1: [{ active: false }, { active: true }], d1: [{ active: false }, { active: false }] },
      [
        rule({}),
        rule({ id: "auto-2", trigger: { type: "sensor", value: "d1", event: "active" } }),
        rule({ id: "auto-3", enabled: false }),
      ],
    );
    await engine.watchSensors(true);
    expect(ranScenes).toEqual([]);
    await engine.watchSensors(true);
    expect(ranScenes).toEqual(["evde"]);
    expect(events().map((e) => e.type)).toContain("automation");
  });

  it("sensör tetiklenmediyse otomasyon çalışmaz", async () => {
    const { engine, ranScenes } = setup([motion], { m1: [{ active: false }, { active: false }] }, [
      rule({}),
    ]);
    await engine.watchSensors(true);
    await engine.watchSensors(true);
    expect(ranScenes).toEqual([]);
  });

  const devRule = (event: string, over: Record<string, unknown> = {}) => ({
    id: "dev-rule",
    title: "Lamba olunca",
    enabled: true,
    sceneId: "evde",
    trigger: { type: "device", value: "l1", event },
    ...over,
  });

  it("cihaz durumu tetikleyicisi: ilk okuma başlangıçtır, kapalı→açık geçişinde 'on' kuralı çalışır", async () => {
    const { engine, ranScenes } = setup([lamp], { l1: [{ switch: false }, { switch: true }] }, [
      devRule("on"),
    ]);
    await engine.watchSensors(true);
    expect(ranScenes).toEqual([]);
    await engine.watchSensors(true);
    expect(ranScenes).toEqual(["evde"]);
  });

  it("'on' kuralı kapanışta, 'off' kuralı açılışta çalışmaz; 'any' ikisinde de çalışır", async () => {
    const turnOn = { l1: [{ switch: false }, { switch: true }] };
    const turnOff = { l1: [{ switch: true }, { switch: false }] };
    const a = setup([lamp], turnOff, [devRule("on")]);
    await a.engine.watchSensors(true);
    await a.engine.watchSensors(true);
    expect(a.ranScenes).toEqual([]);
    const b = setup([lamp], turnOn, [devRule("off")]);
    await b.engine.watchSensors(true);
    await b.engine.watchSensors(true);
    expect(b.ranScenes).toEqual([]);
    const c = setup([lamp], turnOff, [devRule("any")]);
    await c.engine.watchSensors(true);
    await c.engine.watchSensors(true);
    expect(c.ranScenes).toEqual(["evde"]);
  });

  it("cihaz tetikleyicisi yoksa lamba okunmaz; okunamayan cihaz tetiklemez", async () => {
    const none = setup([lamp], { l1: [{ switch: false }, { switch: true }] });
    await none.engine.watchSensors(true);
    await none.engine.watchSensors(true);
    expect(none.ranScenes).toEqual([]);
    const bad = setup([lamp], { l1: [{ switch: false }, null, { switch: undefined }] }, [
      devRule("any"),
    ]);
    await bad.engine.watchSensors(true);
    await bad.engine.watchSensors(true);
    await bad.engine.watchSensors(true);
    expect(bad.ranScenes).toEqual([]);
  });

  it("yerel ağ cihazı yoksa hiçbir okuma yapılmaz", async () => {
    const { engine, events } = setup([], {});
    expect(await engine.watchSensors(true)).toBe(0);
    expect(events()).toEqual([]);
  });
});
