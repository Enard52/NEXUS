import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Shelly / Tasmota / ESPHome / WLED / Govee / Home Assistant: perde konumu, ışık tonu ve medya komutlarının
 * istek biçimleri (yayımlanmış yerel API belgelerine göre). Gerçek cihazla doğrulanmadı.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/lan-connectors.js"), "utf8");

function load(
  reply: (o: any) => { status: number; text: string } = () => ({ status: 200, text: "{}" }),
) {
  const calls: any[] = [];
  const udpCalls: any[] = [];
  const desktop = {
    http: (o: any) => {
      calls.push(o);
      return Promise.resolve(reply(o));
    },
    udp: (o: any) => {
      udpCalls.push(o);
      return Promise.resolve({ text: "{}" });
    },
  };
  const win: Record<string, unknown> = { nexusDesktop: desktop };
  new Function("window", "fetch", SOURCE)(win, () => Promise.reject(new Error("fetch yok")));
  return { lan: (win as { nexusLan: any }).nexusLan, calls, udpCalls };
}

describe("Shelly", () => {
  it("Gen1 roller konumu ve RGBW ışık tonu", async () => {
    const { lan, calls } = load();
    const p = lan.protocolFor("shelly");
    const cover = { host: "192.168.1.20", protocol: "shelly", kind: "cover", endpointId: 0 };
    await p.write(cover, "position", 40);
    expect(calls.at(-1).url).toContain("/roller/0?go=to_pos&roller_pos=40");
    await p.write(cover, "position", 100);
    expect(calls.at(-1).url).toContain("/roller/0?go=open");
    const bulb = { host: "192.168.1.21", protocol: "shelly", kind: "light", endpointId: 0 };
    await p.write(bulb, "colorTemp", "warm");
    expect(calls.at(-1).url).toContain("/light/0?turn=on&mode=white&temp=2700");
    await p.write(bulb, "color", "#ff8000");
    expect(calls.at(-1).url).toContain("red=255&green=128&blue=0");
  });
  it("Gen2 Cover.GoToPosition", async () => {
    const { lan, calls } = load();
    await lan
      .protocolFor("shelly-rpc")
      .write(
        { host: "192.168.1.22", protocol: "shelly-rpc", kind: "cover", endpointId: 0 },
        "position",
        55,
      );
    expect(calls.at(-1).url).toContain("/rpc/Cover.GoToPosition?id=0&pos=55");
  });
});

describe("Tasmota / WLED / ESPHome", () => {
  it("Tasmota ShutterPosition1 ve CT (mired)", async () => {
    const { lan, calls } = load();
    const p = lan.protocolFor("tasmota");
    await p.write({ host: "192.168.1.23", protocol: "tasmota", kind: "cover" }, "position", 70);
    expect(decodeURIComponent(calls.at(-1).url)).toContain("cmnd=ShutterPosition1 70");
    await p.write(
      { host: "192.168.1.23", protocol: "tasmota", kind: "light" },
      "colorTemp",
      "cool",
    );
    expect(decodeURIComponent(calls.at(-1).url)).toContain("cmnd=CT 154");
  });
  it("WLED cct (Kelvin)", async () => {
    const { lan, calls } = load();
    await lan
      .protocolFor("wled")
      .write({ host: "192.168.1.24", protocol: "wled" }, "colorTemp", "warm");
    expect(JSON.parse(calls.at(-1).body)).toEqual({ seg: [{ cct: 2700 }] });
  });
  it("ESPHome cover/light uç noktaları", async () => {
    const { lan, calls } = load();
    const p = lan.protocolFor("esphome");
    const cover = { host: "192.168.1.25", protocol: "esphome", kind: "cover", entity: "perde" };
    await p.write(cover, "position", 25);
    expect(calls.at(-1).url).toContain("/cover/perde/set?position=0.25");
    await p.write(cover, "switch", false);
    expect(calls.at(-1).url).toContain("/cover/perde/close");
    const light = { host: "192.168.1.26", protocol: "esphome", kind: "light", entity: "lamba" };
    await p.write(light, "color", "#0000ff");
    expect(calls.at(-1).url).toContain("/light/lamba/turn_on?r=0&g=0&b=255");
  });
});

describe("Govee ve Home Assistant", () => {
  it("Govee colorwc ile Kelvin", async () => {
    const { lan, udpCalls } = load();
    await lan
      .protocolFor("govee")
      .write({ host: "192.168.1.27", protocol: "govee" }, "colorTemp", "neutral");
    expect(JSON.parse(udpCalls.at(-1).text).msg).toEqual({
      cmd: "colorwc",
      data: { color: { r: 0, g: 0, b: 0 }, colorTemInKelvin: 4000 },
    });
  });
  it("HA süpürge duraklat ve medya oynatma yalnızca desteklenenle", async () => {
    const { lan, calls } = load();
    const p = lan.protocolFor("homeassistant");
    await p.write(
      { host: "192.168.1.5", protocol: "homeassistant", entity: "vacuum.r", haToken: "t" },
      "vacuum",
      "paused",
    );
    expect(calls.at(-1).url).toContain("/api/services/vacuum/pause");
    const tv = {
      host: "192.168.1.5",
      protocol: "homeassistant",
      entity: "media_player.tv",
      haToken: "t",
      options: { transport: ["play", "pause"] },
    };
    await p.write(tv, "transport", "pause");
    expect(calls.at(-1).url).toContain("/api/services/media_player/media_pause");
    await expect(p.write(tv, "transport", "next")).rejects.toBeTruthy();
  });
});
