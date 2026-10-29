import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * WLED efekt/hazır ayar, WiZ ve Hue sahneleri, Shelly Gen2 RGB, Sonoff çok kanal, Home Assistant nem hedefi ve
 * panjur eğimi: istek biçimleri yayımlanmış yerel API belgelerine göre. Gerçek cihazla doğrulanmadı.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/lan-connectors.js"), "utf8");

function load(reply: (o: any) => { status: number; text: string }) {
  const calls: any[] = [];
  const udpCalls: any[] = [];
  const desktop = {
    http: (o: any) => {
      calls.push(o);
      return Promise.resolve(reply(o));
    },
    udp: (o: any) => {
      udpCalls.push(o);
      return Promise.resolve({ text: JSON.stringify({ result: {} }) });
    },
  };
  const win: Record<string, unknown> = { nexusDesktop: desktop };
  new Function("window", "fetch", SOURCE)(win, () => Promise.reject(new Error("fetch yok")));
  return { lan: (win as { nexusLan: any }).nexusLan, calls, udpCalls };
}
const json = (v: unknown) => ({ status: 200, text: JSON.stringify(v) });

describe("WLED efekt ve hazır ayar", () => {
  const reply = (o: any) => {
    if (o.url.includes("/json/info"))
      return json({ ver: "0.14.2", leds: { count: 30 }, name: "serit" });
    if (o.url.includes("/json/effects")) return json(["Solid", "Blink", "Rainbow"]);
    if (o.url.includes("/presets.json"))
      return json({ "0": {}, "1": { n: "Akşam" }, "2": { n: "Parti" } });
    return json({});
  };
  it("probe liste çıkarır, yazma dizin ve ps gönderir", async () => {
    const { lan, calls } = load(reply);
    const p = lan.protocolFor("wled");
    const found = await p.probe({ host: "192.168.1.40" });
    expect(found.options.effects).toEqual(["Solid", "Blink", "Rainbow"]);
    expect(found.options.scenes).toEqual([
      ["1", "Akşam"],
      ["2", "Parti"],
    ]);
    const dev = { host: "192.168.1.40", protocol: "wled", options: found.options };
    await p.write(dev, "effect", "Rainbow");
    expect(JSON.parse(calls.at(-1).body)).toMatchObject({ seg: [{ fx: 2 }] });
    await p.write(dev, "lightScene", "2");
    expect(JSON.parse(calls.at(-1).body)).toMatchObject({ ps: 2 });
    await expect(p.write(dev, "effect", "Yok")).rejects.toBeTruthy();
  });
});

describe("WiZ ve Hue sahneleri", () => {
  it("WiZ setPilot sceneId, bilinmeyen sahne reddedilir", async () => {
    const { lan, udpCalls } = load(() => json({}));
    const p = lan.protocolFor("wiz");
    await p.write({ host: "192.168.1.41", protocol: "wiz" }, "lightScene", 5);
    expect(JSON.parse(udpCalls.at(-1).text)).toMatchObject({
      method: "setPilot",
      params: { state: true, sceneId: 5 },
    });
    await expect(
      p.write({ host: "192.168.1.41", protocol: "wiz" }, "lightScene", 99),
    ).rejects.toBeTruthy();
  });
  it("Hue ışığa yalnızca onu içeren sahneleri sunar ve groups/0/action ile çağırır", async () => {
    const { lan, calls } = load((o) => {
      if (o.url.endsWith("/lights"))
        return json({ "3": { name: "Salon", type: "Extended color light", modelid: "LCT015" } });
      if (o.url.endsWith("/scenes"))
        return json({
          s1: { name: "Rahat", lights: ["3"] },
          s2: { name: "Mutfak", lights: ["7"] },
        });
      return json([{ success: {} }]);
    });
    const lights = await lan.hue.lights("192.168.1.42", "kullanici");
    expect(lights[0].options.scenes).toEqual([["s1", "Rahat"]]);
    expect(lights[0].caps).toContain("lightScene");
    const dev = {
      host: "192.168.1.42",
      protocol: "hue",
      hueUser: "kullanici",
      endpointId: "3",
      options: lights[0].options,
    };
    await lan.protocolFor("hue").write(dev, "lightScene", "s1");
    expect(calls.at(-1).url).toContain("/api/kullanici/groups/0/action");
    expect(JSON.parse(calls.at(-1).body)).toEqual({ scene: "s1" });
    await expect(lan.protocolFor("hue").write(dev, "lightScene", "s2")).rejects.toBeTruthy();
  });
});

describe("Shelly RGB, Sonoff kanal, Home Assistant", () => {
  it("Shelly Gen2 RGBW.Set rgb dizisi", async () => {
    const { lan, calls } = load(() => json({}));
    const dev = {
      host: "192.168.1.43",
      protocol: "shelly-rpc",
      kind: "light",
      endpointId: 0,
      options: { rgbComp: "RGBW" },
    };
    await lan.protocolFor("shelly-rpc").write(dev, "color", "#ff0000");
    expect(decodeURIComponent(calls.at(-1).url)).toContain(
      "/rpc/RGBW.Set?id=0&on=true&rgb=[255,0,0]",
    );
  });
  it("Sonoff çok kanallı /zeroconf/switches", async () => {
    const { lan, calls } = load(() => json({ error: 0, data: {} }));
    await lan
      .protocolFor("sonoff")
      .write(
        { host: "192.168.1.44", protocol: "sonoff", channels: 4, endpointId: 2 },
        "switch",
        true,
      );
    expect(calls.at(-1).url).toContain(":8081/zeroconf/switches");
    expect(JSON.parse(calls.at(-1).body).data).toEqual({ switches: [{ switch: "on", outlet: 2 }] });
  });
  it("HA hedef nem ve panjur eğimi; yetenek öznitelikten çıkar", async () => {
    const { lan, calls } = load((o) => {
      if (o.url.includes("/api/states")) {
        return json([
          {
            entity_id: "humidifier.oda",
            state: "on",
            attributes: { min_humidity: 30, max_humidity: 80 },
          },
          {
            entity_id: "cover.panjur",
            state: "open",
            attributes: { supported_features: 15 | 128 },
          },
          { entity_id: "cover.tente", state: "open", attributes: { supported_features: 15 } },
        ]);
      }
      return json([]);
    });
    const list = await lan.homeassistant.entities("192.168.1.5", "t");
    expect(list.find((e: any) => e.entity === "humidifier.oda").caps).toContain("targetHumidity");
    expect(list.find((e: any) => e.entity === "cover.panjur").caps).toContain("tilt");
    expect(list.find((e: any) => e.entity === "cover.tente").caps).not.toContain("tilt");
    const p = lan.protocolFor("homeassistant");
    const hum = {
      host: "192.168.1.5",
      protocol: "homeassistant",
      entity: "humidifier.oda",
      haToken: "t",
      options: { humidity: { min: 30, max: 80 } },
    };
    await p.write(hum, "targetHumidity", 95);
    expect(JSON.parse(calls.at(-1).body)).toMatchObject({ humidity: 80 });
    await p.write(
      { host: "192.168.1.5", protocol: "homeassistant", entity: "cover.panjur", haToken: "t" },
      "tilt",
      40,
    );
    expect(calls.at(-1).url).toContain("/api/services/cover/set_cover_tilt_position");
    expect(JSON.parse(calls.at(-1).body)).toMatchObject({ tilt_position: 40 });
  });
  it("perde Durdur komutu her protokolde kendi uç noktasına gider", async () => {
    const { lan, calls } = load(() => json({}));
    await lan
      .protocolFor("shelly")
      .write(
        { host: "192.168.1.50", protocol: "shelly", kind: "cover", endpointId: 0 },
        "coverStop",
        true,
      );
    expect(calls.at(-1).url).toContain("/roller/0?go=stop");
    await lan
      .protocolFor("shelly-rpc")
      .write(
        { host: "192.168.1.51", protocol: "shelly-rpc", kind: "cover", endpointId: 0 },
        "coverStop",
        true,
      );
    expect(calls.at(-1).url).toContain("/rpc/Cover.Stop?id=0");
    await lan
      .protocolFor("tasmota")
      .write({ host: "192.168.1.52", protocol: "tasmota", kind: "cover" }, "coverStop", true);
    expect(decodeURIComponent(calls.at(-1).url)).toContain("cmnd=ShutterStop1");
    await lan
      .protocolFor("esphome")
      .write(
        { host: "192.168.1.53", protocol: "esphome", kind: "cover", entity: "perde" },
        "coverStop",
        true,
      );
    expect(calls.at(-1).url).toContain("/cover/perde/stop");
    await lan
      .protocolFor("homeassistant")
      .write(
        { host: "192.168.1.5", protocol: "homeassistant", entity: "cover.perde", haToken: "t" },
        "coverStop",
        true,
      );
    expect(calls.at(-1).url).toContain("/api/services/cover/stop_cover");
  });
  it("Yeelight sahneleri set_scene / start_cf olarak gider", async () => {
    const sent: any[] = [];
    const calls: any[] = [];
    const desktop = {
      http: (o: any) => (calls.push(o), Promise.resolve(json({}))),
      tcp: (o: any) => {
        sent.push(JSON.parse(o.text));
        return Promise.resolve('{"id":1,"result":["ok"]}\r\n');
      },
    };
    const win: Record<string, unknown> = { nexusDesktop: desktop };
    new Function("window", "fetch", SOURCE)(win, () => Promise.reject(new Error("fetch yok")));
    const p = (win as any).nexusLan.protocolFor("yeelight");
    const dev = { host: "192.168.1.54", protocol: "yeelight" };
    await p.write(dev, "lightScene", "read");
    expect(sent.at(-1)).toMatchObject({ method: "set_scene", params: ["ct", 2700, 80] });
    await p.write(dev, "lightScene", "pulse");
    expect(sent.at(-1).method).toBe("start_cf");
    await expect(p.write(dev, "lightScene", "yok")).rejects.toBeTruthy();
  });
  it("Tuya yerel hiçbir komut göndermez", async () => {
    const { lan } = load(() => json({}));
    expect(lan.supports({ host: "192.168.1.9", protocol: "tuya-local" }, "switch")).toBe(false);
    await expect(
      lan.protocolFor("tuya-local").write({ host: "192.168.1.9" }, "switch", true),
    ).rejects.toBeTruthy();
  });
});
