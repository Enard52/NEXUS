import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Hava durumu tetikleyicisi: yalnızca Open-Meteo'dan OKUNAN değer eşiği geçince çalışır.
 * Burada ağ yanıtı fetch taklidiyle verilir (gerçek API ile doğrulama değildir).
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(ROOT, "src/app/automation-engine.js"), "utf8");

type Cur = { temperature_2m: number; wind_speed_10m: number; precipitation: number };

function setup(opts: {
  coords?: { lat: number; lon: number } | null;
  trigger: Record<string, unknown>;
  readings: Array<Cur | "fail">;
}) {
  const store = new Map<string, string>();
  if (opts.coords !== null)
    store.set("nexusWeatherCoords", JSON.stringify(opts.coords ?? { lat: 41, lon: 29 }));
  store.set(
    "nexusCustomAutomations",
    JSON.stringify([
      {
        id: "w1",
        title: "Hava",
        enabled: true,
        trigger: opts.trigger,
        sceneId: "evde",
        actions: [],
      },
    ]),
  );
  const ranScenes: string[] = [];
  const urls: string[] = [];
  let n = 0;
  const fetchMock = (url: string) => {
    urls.push(url);
    const r = opts.readings[Math.min(n++, opts.readings.length - 1)];
    if (r === "fail") return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ current: r }) });
  };
  const win: Record<string, any> = {
    NX: {
      SCENES: { evde: { title: "Evde" } },
      runScene: (id: string) => (ranScenes.push(id), { changed: 1, title: "Evde" }),
      sceneSummary: () => "Evde: 1 cihaz ayarlandı.",
    },
  };
  const doc = {
    readyState: "loading",
    addEventListener: () => {},
    documentElement: { classList: { contains: () => false } },
    querySelector: () => null,
  };
  new Function("window", "document", "NX", "nexusGetItem", "nexusSetItem", "fetch", SOURCE)(
    win,
    doc,
    win.NX,
    (k: string) => store.get(k) ?? null,
    (k: string, v: string) => store.set(k, v),
    fetchMock,
  );
  const events = () =>
    JSON.parse(store.get("nexusEvents") || "[]") as Array<Record<string, string>>;
  return { engine: win.NexusAutomationEngine, ranScenes, urls, events };
}

const cur = (t: number, w = 0, p = 0): Cur => ({
  temperature_2m: t,
  wind_speed_10m: w,
  precipitation: p,
});
const above30 = { type: "weather", metric: "temp", op: "above", value: 30 };

describe("hava durumu tetikleyicisi", () => {
  it("ilk okuma yalnız başlangıçtır; eşik aşılınca bir kez çalışır, sürerken tekrar etmez", async () => {
    const t = setup({ trigger: above30, readings: [cur(25), cur(31), cur(33)] });
    expect(await t.engine.watchWeather(true)).toBe(0);
    expect(await t.engine.watchWeather(true)).toBe(1);
    expect(await t.engine.watchWeather(true)).toBe(0);
    expect(t.ranScenes).toEqual(["evde"]);
    expect(t.urls[0]).toContain("latitude=41&longitude=29");
  });

  it("başlangıçta zaten sağlanan koşul tetiklemez", async () => {
    const t = setup({ trigger: above30, readings: [cur(35), cur(36)] });
    await t.engine.watchWeather(true);
    await t.engine.watchWeather(true);
    expect(t.ranScenes).toEqual([]);
  });

  it("koşul düşüp yeniden sağlanınca yeniden çalışır", async () => {
    const t = setup({ trigger: above30, readings: [cur(25), cur(31), cur(20), cur(32)] });
    for (let i = 0; i < 4; i++) await t.engine.watchWeather(true);
    expect(t.ranScenes).toEqual(["evde", "evde"]);
  });

  it("altına inme ve rüzgâr/yağış ölçütleri okunan alanı kullanır", async () => {
    const cold = setup({
      trigger: { type: "weather", metric: "temp", op: "below", value: 5 },
      readings: [cur(8), cur(3)],
    });
    await cold.engine.watchWeather(true);
    expect(await cold.engine.watchWeather(true)).toBe(1);
    const wind = setup({
      trigger: { type: "weather", metric: "wind", op: "above", value: 40 },
      readings: [cur(20, 10), cur(20, 55)],
    });
    await wind.engine.watchWeather(true);
    expect(await wind.engine.watchWeather(true)).toBe(1);
    const rain = setup({
      trigger: { type: "weather", metric: "rain", op: "above", value: 0.5 },
      readings: [cur(20, 0, 0), cur(20, 0, 2)],
    });
    await rain.engine.watchWeather(true);
    expect(await rain.engine.watchWeather(true)).toBe(1);
  });

  it("okuma başarısızsa tetiklemez ve durumu bozmaz", async () => {
    const t = setup({ trigger: above30, readings: [cur(25), "fail", cur(31)] });
    await t.engine.watchWeather(true);
    expect(await t.engine.watchWeather(true)).toBe(0);
    expect(await t.engine.watchWeather(true)).toBe(1);
  });

  it("ev konumu yoksa istek atmaz, tetiklemez, günde bir dürüst olay yazar", async () => {
    const t = setup({ coords: null, trigger: above30, readings: [cur(40)] });
    expect(await t.engine.watchWeather(true)).toBe(0);
    await t.engine.watchWeather(true);
    expect(t.urls).toEqual([]);
    expect(t.ranScenes).toEqual([]);
    expect(t.events().filter((e) => /no home location|ev konumu/.test(e.detail))).toHaveLength(1);
  });

  it("eşiği geçersiz kural değerlendirilmez", async () => {
    const t = setup({
      trigger: { type: "weather", metric: "temp", op: "above", value: "" },
      readings: [cur(25), cur(99)],
    });
    await t.engine.watchWeather(true);
    await t.engine.watchWeather(true);
    expect(t.ranScenes).toEqual([]);
  });
});
