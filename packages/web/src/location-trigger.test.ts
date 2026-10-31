import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Konum tetikleyicisi: yalnızca mobilde, izin verilmişse ve ev konumu seçiliyse, okunan konum yarıçap sınırını
 * geçince çalışır. Konum burada Capacitor taklidiyle verilir (gerçek GPS ile doğrulama DEĞİLDİR).
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const ENGINE = readFileSync(resolve(ROOT, "src/app/automation-engine.js"), "utf8");
const UI = readFileSync(resolve(ROOT, "src/app/location-trigger.js"), "utf8");

const HOME = { lat: 41.0, lon: 29.0 };
// ~1 derece enlem ≈ 111 km; 0.001 derece ≈ 111 m.
const at = (metersNorth: number) => ({
  coords: { latitude: HOME.lat + metersNorth / 111195, longitude: HOME.lon },
});

function setup(opts: {
  native?: boolean;
  perm?: "granted" | "denied";
  home?: boolean;
  event?: string;
  radius?: number;
  positions: Array<{ coords: { latitude: number; longitude: number } } | "fail">;
}) {
  const store = new Map<string, string>();
  if (opts.home !== false) store.set("nexusWeatherCoords", JSON.stringify(HOME));
  store.set(
    "nexusCustomAutomations",
    JSON.stringify([
      {
        id: "l1",
        title: "Eve geldim",
        enabled: true,
        trigger: { type: "location", event: opts.event ?? "arrive", radius: opts.radius ?? 150 },
        sceneId: "evde",
        actions: [],
      },
    ]),
  );
  const ranScenes: string[] = [];
  let n = 0;
  let permAsked = 0;
  const geo = {
    checkPermissions: () =>
      Promise.resolve(opts.perm === "denied" ? { location: "denied" } : { location: "granted" }),
    requestPermissions: () => (permAsked++, Promise.resolve({ location: "granted" })),
    getCurrentPosition: () => {
      const p = opts.positions[Math.min(n++, opts.positions.length - 1)];
      return p === "fail" ? Promise.reject(new Error("gps")) : Promise.resolve(p);
    },
  };
  const win: Record<string, any> = {
    NX: {
      SCENES: { evde: { title: "Evde" } },
      runScene: (id: string) => (ranScenes.push(id), { changed: 1, title: "Evde" }),
      sceneSummary: () => "Evde: 1 cihaz ayarlandı.",
    },
  };
  if (opts.native !== false)
    win.Capacitor = { isNativePlatform: () => true, Plugins: { Geolocation: geo } };
  const doc = {
    readyState: "loading",
    addEventListener: () => {},
    documentElement: { classList: { contains: () => false } },
    querySelector: () => null,
    getElementById: () => null,
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
  new Function("window", "document", "nexusGetItem", UI)(win, doc, get);
  const events = () =>
    JSON.parse(store.get("nexusEvents") || "[]") as Array<Record<string, string>>;
  return {
    engine: win.NexusAutomationEngine,
    ui: win.nexusLocationTrigger,
    ranScenes,
    events,
    permAsked: () => permAsked,
  };
}

describe("konum tetikleyicisi", () => {
  it("ilk okuma başlangıçtır; dışarıdan içeriye geçince 'eve gelince' bir kez çalışır", async () => {
    const t = setup({ positions: [at(2000), at(50), at(40)] });
    expect(await t.engine.watchLocation(true)).toBe(0);
    expect(await t.engine.watchLocation(true)).toBe(1);
    expect(await t.engine.watchLocation(true)).toBe(0);
    expect(t.ranScenes).toEqual(["evde"]);
  });

  it("zaten evdeyken açılış tetiklemez; 'evden çıkınca' içeriden dışarıya geçişte çalışır", async () => {
    const t = setup({ event: "leave", positions: [at(10), at(20), at(1500)] });
    expect(await t.engine.watchLocation(true)).toBe(0);
    expect(await t.engine.watchLocation(true)).toBe(0);
    expect(await t.engine.watchLocation(true)).toBe(1);
  });

  it("yarıçap dışındaki küçük oynamalar tetiklemez", async () => {
    const t = setup({ radius: 300, positions: [at(2000), at(250), at(2000)] });
    await t.engine.watchLocation(true);
    expect(await t.engine.watchLocation(true)).toBe(1); // 250 m < 300 m
    expect(await t.engine.watchLocation(true)).toBe(0); // 'arrive' ayrılışta çalışmaz
  });

  it("mobil değilse, izin yoksa, ev konumu yoksa ya da konum okunamıyorsa tetiklemez ve nedenini yazar", async () => {
    const web = setup({ native: false, positions: [at(2000), at(10)] });
    await web.engine.watchLocation(true);
    expect(web.events()[0].detail).toContain("yalnızca mobil");

    const denied = setup({ perm: "denied", positions: [at(2000), at(10)] });
    await denied.engine.watchLocation(true);
    await denied.engine.watchLocation(true);
    expect(denied.ranScenes).toEqual([]);
    expect(denied.events()[0].detail).toContain("izni verilmedi");
    expect(denied.permAsked()).toBe(0); // motor asla izin penceresi açmaz

    const nohome = setup({ home: false, positions: [at(10)] });
    await nohome.engine.watchLocation(true);
    expect(nohome.events()[0].detail).toContain("ev konumu seçilmedi");

    const fail = setup({ positions: ["fail", "fail"] });
    expect(await fail.engine.watchLocation(true)).toBe(0);
    expect(fail.ranScenes).toEqual([]);
  });

  it("arayüz: mobil değilse kurulamaz, mobilde ev konumu varsa kaydedilebilir", () => {
    expect(setup({ native: false, positions: [] }).ui.problem()).toContain("yalnızca mobil");
    expect(setup({ home: false, positions: [] }).ui.problem()).toContain("ev konumunu");
    const ok = setup({ positions: [] }).ui;
    expect(ok.problem()).toBe("");
    expect(ok.summary({ event: "leave", radius: 300 })).toBe("Evden çıkınca (300 m)");
  });

  it("uzaklık hesabı yaklaşık doğru", () => {
    const t = setup({ positions: [] });
    const d = t.engine.distanceM(HOME, { lat: HOME.lat + 0.01, lon: HOME.lon });
    expect(Math.round(d / 100)).toBe(11); // ~1,11 km
  });
});
