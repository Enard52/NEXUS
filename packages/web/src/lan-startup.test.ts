import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Elektrik gelince başlangıç durumu (Sonoff DIY / Shelly / Tasmota), Kasa ampul rengi-tonu ve
 * Home Assistant fan komutları: istek biçimleri yayımlanmış yerel API belgelerine göre. Gerçek cihazla doğrulanmadı.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/lan-connectors.js"), "utf8");

function load(
  reply: (o: any) => { status: number; text: string } = () => ({ status: 200, text: "{}" }),
) {
  const calls: any[] = [];
  const tcpCalls: any[] = [];
  const desktop = {
    http: (o: any) => {
      calls.push(o);
      return Promise.resolve(reply(o));
    },
    tcp: (o: any) => {
      tcpCalls.push(o);
      // Kasa yanıtı: XOR otomatik anahtar şifreleme, 4 baytlık uzunluk öneki
      const text = JSON.stringify({});
      let key = 171;
      const body = Array.from(Buffer.from(text)).map((b) => (key = b ^ key));
      return Promise.resolve([0, 0, 0, body.length, ...body]);
    },
  };
  const win: Record<string, unknown> = { nexusDesktop: desktop };
  new Function("window", "fetch", SOURCE)(win, () => Promise.reject(new Error("fetch yok")));
  return { lan: (win as { nexusLan: any }).nexusLan, calls, tcpCalls };
}

function kasaPayload(framed: number[]) {
  let key = 171;
  const out: number[] = [];
  for (const b of framed.slice(4)) {
    out.push(b ^ key);
    key = b;
  }
  return JSON.parse(Buffer.from(out).toString("utf8"));
}

describe("Elektrik gelince başlangıç durumu", () => {
  it("Sonoff DIY /zeroconf/startup", async () => {
    const { lan, calls } = load(() => ({
      status: 200,
      text: JSON.stringify({ error: 0, data: {} }),
    }));
    const p = lan.protocolFor("sonoff");
    await p.write({ host: "192.168.1.30", protocol: "sonoff" }, "powerOn", "last");
    expect(calls.at(-1).url).toContain(":8081/zeroconf/startup");
    expect(JSON.parse(calls.at(-1).body).data).toEqual({ startup: "stay" });
    await p.write({ host: "192.168.1.30", protocol: "sonoff" }, "powerOn", "on");
    expect(JSON.parse(calls.at(-1).body).data).toEqual({ startup: "on" });
  });
  it("Shelly Gen1 default_state, Gen2 initial_state, Tasmota PowerOnState", async () => {
    const { lan, calls } = load();
    await lan
      .protocolFor("shelly")
      .write({ host: "192.168.1.31", protocol: "shelly", endpointId: 0 }, "powerOn", "off");
    expect(calls.at(-1).url).toContain("/settings/relay/0?default_state=off");
    await lan
      .protocolFor("shelly-rpc")
      .write(
        { host: "192.168.1.32", protocol: "shelly-rpc", kind: "switch", endpointId: 0 },
        "powerOn",
        "last",
      );
    expect(decodeURIComponent(calls.at(-1).url)).toContain(
      'Switch.SetConfig?id=0&config={"initial_state":"restore_last"}',
    );
    await lan
      .protocolFor("tasmota")
      .write({ host: "192.168.1.33", protocol: "tasmota" }, "powerOn", "last");
    expect(decodeURIComponent(calls.at(-1).url)).toContain("cmnd=PowerOnState 3");
  });
});

describe("Kasa ampul ve Home Assistant fan", () => {
  it("Kasa transition_light_state renk ve ton", async () => {
    const { lan, tcpCalls } = load();
    const p = lan.protocolFor("kasa");
    const bulb = { host: "192.168.1.34", protocol: "kasa", kind: "light" };
    await p.write(bulb, "colorTemp", "warm");
    expect(
      kasaPayload(tcpCalls.at(-1).bytes)["smartlife.iot.smartbulb.lightingservice"]
        .transition_light_state,
    ).toMatchObject({ on_off: 1, color_temp: 2700 });
    await p.write(bulb, "color", "#00ff00");
    expect(
      kasaPayload(tcpCalls.at(-1).bytes)["smartlife.iot.smartbulb.lightingservice"]
        .transition_light_state,
    ).toMatchObject({ hue: 120, saturation: 100, color_temp: 0 });
    await p.write({ host: "192.168.1.35", protocol: "kasa", kind: "plug" }, "indicator", false);
    expect(kasaPayload(tcpCalls.at(-1).bytes)).toEqual({ system: { set_led_off: { off: 1 } } });
  });
  it("HA fan yüzdesi ve salınım", async () => {
    const { lan, calls } = load();
    const p = lan.protocolFor("homeassistant");
    const fan = {
      host: "192.168.1.5",
      protocol: "homeassistant",
      entity: "fan.salon",
      haToken: "t",
      options: { fanMap: { low: 33, mid: 66, high: 100 }, swing: { oscillate: true } },
    };
    await p.write(fan, "fanMode", "mid");
    expect(calls.at(-1).url).toContain("/api/services/fan/set_percentage");
    expect(JSON.parse(calls.at(-1).body)).toMatchObject({ entity_id: "fan.salon", percentage: 66 });
    await p.write(fan, "swing", true);
    expect(JSON.parse(calls.at(-1).body)).toMatchObject({ oscillating: true });
    const list = await load(() => ({
      status: 200,
      text: JSON.stringify([
        { entity_id: "fan.salon", state: "on", attributes: { supported_features: 3 } },
        { entity_id: "humidifier.oda", state: "off", attributes: {} },
      ]),
    })).lan.homeassistant.entities("192.168.1.5", "t");
    expect(list.find((e: any) => e.entity === "fan.salon").caps).toEqual(
      expect.arrayContaining(["fanMode", "swing"]),
    );
    expect(list.find((e: any) => e.entity === "humidifier.oda").kind).toBe("purifier");
  });
});
