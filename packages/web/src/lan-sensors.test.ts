import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Home Assistant salt okunur sensörler: GET /api/states yanıtından yalnızca ev ölçümleri/olay sensörleri
 * listelenir, durum okunurken değer uydurulmaz. Gerçek Home Assistant ile doğrulanmadı.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/lan-connectors.js"), "utf8");

function load(reply: (o: any) => unknown) {
  const desktop = { http: (o: any) => Promise.resolve({ status: 200, text: JSON.stringify(reply(o)) }) };
  const win: Record<string, unknown> = { nexusDesktop: desktop };
  new Function("window", "fetch", SOURCE)(win, () => Promise.reject(new Error("fetch yok")));
  return (win as { nexusLan: any }).nexusLan;
}

const states = [
  { entity_id: "sensor.salon_sicaklik", state: "21.5", attributes: { device_class: "temperature", friendly_name: "Salon Sıcaklık", unit_of_measurement: "°C" } },
  { entity_id: "sensor.salon_nem", state: "48", attributes: { device_class: "humidity", friendly_name: "Salon Nem", unit_of_measurement: "%" } },
  { entity_id: "sensor.cpu_isi", state: "55", attributes: { friendly_name: "CPU" } },
  { entity_id: "binary_sensor.hareket", state: "on", attributes: { device_class: "motion", friendly_name: "Koridor Hareket" } },
  { entity_id: "binary_sensor.kapi", state: "off", attributes: { device_class: "door", friendly_name: "Giriş Kapısı" } },
  { entity_id: "binary_sensor.sizinti", state: "unavailable", attributes: { device_class: "moisture", friendly_name: "Su Sızıntısı" } },
  { entity_id: "binary_sensor.guncelleme", state: "on", attributes: { device_class: "update", friendly_name: "Güncelleme" } },
];

describe("Shelly Gen1 pil sensörleri", () => {
  const settings = (type: string) => ({ device: { type, hostname: "shelly-x" }, name: "Sensör" });
  it("model koduna göre tür ve yetenekler çıkarılır", async () => {
    for (const [type, kind, caps] of [
      ["SHHT-1", "climatesensor", ["temperature", "humidity"]],
      ["SHMOS-01", "motion", ["motion"]],
      ["SHDW-2", "contact", ["contact"]],
      ["SHWT-1", "alarm", ["alarm"]],
    ] as const) {
      const lan = load(() => settings(type));
      const found = await lan.protocolFor("shelly").probe({ host: "192.168.1.60" });
      expect(found.kind).toBe(kind);
      expect(found.caps).toEqual(caps);
    }
  });
  it("durum okuma: sıcaklık/nem/pil, hareket, kapı; geçersiz ölçüm uydurulmaz", async () => {
    const status: any = {
      tmp: { value: 71.6, units: "F", is_valid: true },
      hum: { value: 44, is_valid: true },
      bat: { value: 87 },
      sensor: { motion: true, state: "open", is_valid: true },
      flood: false,
    };
    const lan = load(() => status);
    const p = lan.protocolFor("shelly");
    const dev = (kind: string) => ({ host: "192.168.1.60", protocol: "shelly", kind });
    expect(await p.read(dev("climatesensor"))).toEqual({ temperature: 22, humidity: 44, battery: 87 });
    expect(await p.read(dev("motion"))).toMatchObject({ active: true, battery: 87 });
    expect(await p.read(dev("contact"))).toMatchObject({ active: true });
    expect(await p.read(dev("alarm"))).toMatchObject({ active: false });
    status.hum = { value: 0, is_valid: false };
    expect((await p.read(dev("climatesensor"))).humidity).toBeNull();
  });
});

describe("Home Assistant sensörleri", () => {
  it("yalnızca tanınan device_class'lar listelenir ve doğru türe eşlenir", async () => {
    const lan = load(() => states);
    const list = await lan.homeassistant.entities("192.168.1.5", "t");
    const by = (id: string) => list.find((e: any) => e.entity === id);
    expect(by("sensor.salon_sicaklik")).toMatchObject({ kind: "climatesensor", caps: ["temperature"] });
    expect(by("sensor.salon_nem")).toMatchObject({ kind: "envsensor", caps: ["sensor"], options: { label: "Nem" } });
    expect(by("binary_sensor.hareket")).toMatchObject({ kind: "motion", caps: ["motion"] });
    expect(by("binary_sensor.kapi")).toMatchObject({ kind: "contact", caps: ["contact"] });
    expect(by("binary_sensor.sizinti")).toMatchObject({ kind: "alarm", caps: ["alarm"] });
    expect(by("sensor.cpu_isi")).toBeUndefined();
    expect(by("binary_sensor.guncelleme")).toBeUndefined();
  });

  it("durum okuma: sıcaklık, ölçüm+birim, olay; unavailable değer uydurmaz", async () => {
    const lan = load((o: any) => states.find((s) => o.url.endsWith("/api/states/" + s.entity_id)));
    const p = lan.protocolFor("homeassistant");
    const dev = (entity: string) => ({ host: "192.168.1.5", protocol: "homeassistant", entity, haToken: "t" });
    expect(await p.read(dev("sensor.salon_sicaklik"))).toMatchObject({ temperature: 21.5, reachable: true });
    expect(await p.read(dev("sensor.salon_nem"))).toMatchObject({ value: 48, unit: "%" });
    expect(await p.read(dev("binary_sensor.hareket"))).toMatchObject({ active: true });
    expect(await p.read(dev("binary_sensor.kapi"))).toMatchObject({ active: false });
    expect(await p.read(dev("binary_sensor.sizinti"))).toMatchObject({ active: null, reachable: false });
  });
});
