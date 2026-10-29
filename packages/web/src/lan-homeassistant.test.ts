import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Home Assistant REST API (POST /api/services/<domain>/<service>, GET /api/states): iklim, medya, süpürge ve
 * ışık tonu komutlarının istek biçimi ve varlık özniteliklerinden yetenek çıkarımı. Gerçek HA örneğiyle doğrulanmadı.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/lan-connectors.js"), "utf8");

function load(handler: (o: any) => { status: number; text: string }) {
  const calls: any[] = [];
  const http = (o: any) => {
    calls.push({ ...o, json: o.body ? JSON.parse(o.body) : null });
    return Promise.resolve(handler(o));
  };
  const win: Record<string, unknown> = { nexusDesktop: { http } };
  new Function("window", "fetch", SOURCE)(win, () => Promise.reject(new Error("fetch yok")));
  return { lan: (win as { nexusLan: any }).nexusLan, calls };
}

const states = [
  {
    entity_id: "climate.salon",
    state: "cool",
    attributes: {
      friendly_name: "Salon Klima",
      hvac_modes: ["off", "cool", "heat", "fan_only", "heat_cool"],
      fan_modes: ["Low", "Medium", "High"],
      swing_modes: ["off", "both"],
      fan_mode: "Medium",
      swing_mode: "both",
      temperature: 23,
    },
  },
  {
    entity_id: "climate.yalin",
    state: "heat",
    attributes: { friendly_name: "Yalın", hvac_modes: ["off", "heat"] },
  },
  {
    entity_id: "media_player.tv",
    state: "playing",
    attributes: {
      friendly_name: "TV",
      supported_features: 4 | 8 | 2048,
      source_list: ["HDMI 1", "Netflix"],
      volume_level: 0.35,
      is_volume_muted: true,
      source: "Netflix",
    },
  },
  {
    entity_id: "media_player.radyo",
    state: "on",
    attributes: { friendly_name: "Radyo", supported_features: 0 },
  },
  {
    entity_id: "vacuum.robot",
    state: "docked",
    attributes: {
      friendly_name: "Robot",
      supported_features: 32,
      fan_speed_list: ["Quiet", "Turbo"],
      fan_speed: "Turbo",
    },
  },
  {
    entity_id: "light.lamba",
    state: "on",
    attributes: {
      friendly_name: "Lamba",
      supported_color_modes: ["color_temp", "xy"],
      brightness: 200,
    },
  },
];

describe("Home Assistant yetenekleri", () => {
  it("yalnızca varlığın bildirdiği yetenekler çıkarılır", async () => {
    const { lan } = load(() => ({ status: 200, text: JSON.stringify(states) }));
    const list = await lan.homeassistant.entities("192.168.1.5", "tok");
    const by = (id: string) => list.find((e: any) => e.entity === id);
    expect(by("climate.salon").caps).toEqual(
      expect.arrayContaining(["hvacMode", "fanMode", "swing"]),
    );
    expect(by("climate.salon").options.hvacMap).toEqual({
      cool: "cool",
      heat: "heat",
      fan: "fan_only",
      auto: "heat_cool",
    });
    expect(by("climate.salon").options.fanMap).toEqual({ low: "Low", mid: "Medium", high: "High" });
    expect(by("climate.yalin").caps).not.toContain("fanMode");
    expect(by("climate.yalin").caps).not.toContain("swing");
    expect(by("media_player.tv").caps).toEqual(
      expect.arrayContaining(["volume", "mute", "source"]),
    );
    expect(by("media_player.tv").options.source).toEqual(["HDMI 1", "Netflix"]);
    expect(by("media_player.radyo").caps).not.toContain("volume");
    expect(by("vacuum.robot").caps).toContain("suction");
    expect(by("light.lamba").caps).toContain("colorTemp");
  });
});

describe("Home Assistant komutları", () => {
  const ok = () => ({ status: 200, text: "[]" });
  const dev = (entity: string, options: any) => ({
    host: "192.168.1.5",
    protocol: "homeassistant",
    entity,
    haToken: "tok",
    options,
  });
  const ac = dev("climate.salon", {
    hvacMap: { cool: "cool", fan: "fan_only" },
    fanMap: { mid: "Medium" },
    swing: { on: "both", off: "off" },
  });

  it("iklim servisleri doğru gövdeyle çağrılır", async () => {
    const { lan, calls } = load(ok);
    const p = lan.protocolFor("homeassistant");
    await p.write(ac, "hvacMode", "fan");
    expect(calls.at(-1).url).toContain("/api/services/climate/set_hvac_mode");
    expect(calls.at(-1).json).toEqual({ entity_id: "climate.salon", hvac_mode: "fan_only" });
    await p.write(ac, "fanMode", "mid");
    expect(calls.at(-1).url).toContain("/api/services/climate/set_fan_mode");
    expect(calls.at(-1).json).toMatchObject({ fan_mode: "Medium" });
    await p.write(ac, "swing", false);
    expect(calls.at(-1).json).toMatchObject({ swing_mode: "off" });
  });

  it("cihazın sunmadığı mod gönderilmez", async () => {
    const { lan, calls } = load(ok);
    await expect(
      lan.protocolFor("homeassistant").write(ac, "hvacMode", "heat"),
    ).rejects.toBeTruthy();
    expect(calls.length).toBe(0);
  });

  it("medya, süpürge ve ışık tonu", async () => {
    const { lan, calls } = load(ok);
    const p = lan.protocolFor("homeassistant");
    const tv = dev("media_player.tv", { source: ["HDMI 1", "Netflix"] });
    await p.write(tv, "volume", 40);
    expect(calls.at(-1).json).toMatchObject({ volume_level: 0.4 });
    await p.write(tv, "mute", true);
    expect(calls.at(-1).url).toContain("/api/services/media_player/volume_mute");
    expect(calls.at(-1).json).toMatchObject({ is_volume_muted: true });
    await p.write(tv, "source", "Netflix");
    expect(calls.at(-1).json).toMatchObject({ source: "Netflix" });
    await expect(p.write(tv, "source", "HDMI 9")).rejects.toBeTruthy();
    await p.write(dev("vacuum.robot", { suction: ["Quiet", "Turbo"] }), "suction", "Turbo");
    expect(calls.at(-1).url).toContain("/api/services/vacuum/set_fan_speed");
    expect(calls.at(-1).json).toMatchObject({ fan_speed: "Turbo" });
    await p.write(dev("light.lamba", {}), "colorTemp", "warm");
    expect(calls.at(-1).json).toMatchObject({ color_temp_kelvin: 2700 });
  });

  it("durum okunurken öznitelikler uygulama alanlarına çevrilir", async () => {
    const tvState = states[2];
    const { lan } = load(() => ({ status: 200, text: JSON.stringify(tvState) }));
    const live = await lan.protocolFor("homeassistant").read(dev("media_player.tv", {}));
    expect(live).toMatchObject({ volume: 35, muted: true, source: "Netflix", switch: true });
    const acState = states[0];
    const r2 = load(() => ({ status: 200, text: JSON.stringify(acState) }));
    const live2 = await r2.lan.protocolFor("homeassistant").read(ac);
    expect(live2).toMatchObject({ mode: "cool", fan: "mid", swing: true, target: 23 });
  });
});
