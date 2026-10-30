import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Fixtures are derived BY HAND from the MQTT 3.1.1 specification (OASIS), not produced by the code under test.
// Nothing here was verified against a real broker.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/lan-mqtt.js"), "utf8");

function load() {
  const win: Record<string, unknown> = {};
  new Function("window", SOURCE)(win);
  return (win as { nexusMqtt: any }).nexusMqtt;
}
const { packets: P, z2m, tasmota } = load();
const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join(" ");
const bytes = (s: string) => Uint8Array.from(s.split(" ").map((h) => parseInt(h, 16)));
const dec = (s: string) => P.decodeOne(bytes(s)).packet;

describe("MQTT 3.1.1 encoder (client -> broker)", () => {
  it("CONNECT without credentials (§3.1: protocol name MQTT, level 4, clean session, keep-alive 60)", () => {
    expect(hex(P.encodeConnect({ clientId: "nx" }))).toBe(
      "10 0e 00 04 4d 51 54 54 04 02 00 3c 00 02 6e 78",
    );
  });
  it("CONNECT with user name and password sets flag bits 7,6 and 1 (§3.1.2.8-9)", () => {
    expect(hex(P.encodeConnect({ clientId: "nx", username: "u", password: "p" }))).toBe(
      "10 14 00 04 4d 51 54 54 04 c2 00 3c 00 02 6e 78 00 01 75 00 01 70",
    );
  });
  it("CONNECT with clean session off clears bit 1 and keeps the given keep-alive", () => {
    expect(hex(P.encodeConnect({ clientId: "nx", cleanSession: false, keepAlive: 300 }))).toBe(
      "10 0e 00 04 4d 51 54 54 04 00 01 2c 00 02 6e 78",
    );
  });
  it("CONNECT accepts an empty client id only with clean session (§3.1.3.1) and a password only with a user name (§3.1.2.9)", () => {
    expect(hex(P.encodeConnect({ clientId: "" }))).toBe(
      "10 0c 00 04 4d 51 54 54 04 02 00 3c 00 00",
    );
    expect(() => P.encodeConnect({ clientId: "", cleanSession: false })).toThrow();
    expect(() => P.encodeConnect({ clientId: "a", password: "p" })).toThrow();
    expect(() => P.encodeConnect({ clientId: "a", keepAlive: 70000 })).toThrow();
  });
  it("CONNECT encodes multibyte UTF-8 and rejects U+0000 (§1.5.3)", () => {
    expect(hex(P.encodeConnect({ clientId: "é" }))).toBe(
      "10 0e 00 04 4d 51 54 54 04 02 00 3c 00 02 c3 a9",
    );
    expect(() => P.encodeConnect({ clientId: "a\u0000b" })).toThrow();
  });
  it("PUBLISH QoS 0 has no packet id (§3.3.2.2)", () => {
    expect(hex(P.encodePublish({ topic: "a/b", payload: "hi" }))).toBe(
      "30 07 00 03 61 2f 62 68 69",
    );
  });
  it("PUBLISH QoS 1 + retain carries the packet id after the topic (flags 0b0011)", () => {
    expect(
      hex(P.encodePublish({ topic: "a/b", payload: "1", qos: 1, retain: true, packetId: 10 })),
    ).toBe("33 08 00 03 61 2f 62 00 0a 31");
  });
  it("PUBLISH QoS 1 with DUP sets bit 3 (flags 0b1010)", () => {
    expect(
      hex(P.encodePublish({ topic: "a/b", payload: "1", qos: 1, dup: true, packetId: 10 })),
    ).toBe("3a 08 00 03 61 2f 62 00 0a 31");
  });
  it("PUBLISH with an empty payload is allowed (§3.3.3)", () => {
    expect(hex(P.encodePublish({ topic: "cmnd/x/POWER", payload: "" }))).toBe(
      "30 0e 00 0c 63 6d 6e 64 2f 78 2f 50 4f 57 45 52",
    );
  });
  it("PUBLISH rejects wildcards, empty topics, QoS 2, DUP on QoS 0 and a missing/zero packet id", () => {
    expect(() => P.encodePublish({ topic: "a/#" })).toThrow();
    expect(() => P.encodePublish({ topic: "a/+/b" })).toThrow();
    expect(() => P.encodePublish({ topic: "" })).toThrow();
    expect(() => P.encodePublish({ topic: "a", qos: 2, packetId: 1 })).toThrow();
    expect(() => P.encodePublish({ topic: "a", dup: true })).toThrow();
    expect(() => P.encodePublish({ topic: "a", qos: 1 })).toThrow();
    expect(() => P.encodePublish({ topic: "a", qos: 1, packetId: 0 })).toThrow();
  });
  it("PUBACK is 0x40 0x02 + packet id (§3.4)", () => {
    expect(hex(P.encodePuback(0x1234))).toBe("40 02 12 34");
  });
  it("SUBSCRIBE uses fixed flags 0b0010 and (filter, QoS) pairs (§3.8)", () => {
    expect(hex(P.encodeSubscribe({ packetId: 1, topics: ["a/#"] }))).toBe(
      "82 08 00 01 00 03 61 2f 23 00",
    );
    expect(
      hex(
        P.encodeSubscribe({ packetId: 1, topics: [{ filter: "a/b" }, { filter: "a/+", qos: 1 }] }),
      ),
    ).toBe("82 0e 00 01 00 03 61 2f 62 00 00 03 61 2f 2b 01");
  });
  it("SUBSCRIBE validates filters (§4.7.1), QoS and packet id", () => {
    expect(() => P.encodeSubscribe({ packetId: 1, topics: [] })).toThrow();
    expect(() => P.encodeSubscribe({ packetId: 0, topics: ["a"] })).toThrow();
    expect(() => P.encodeSubscribe({ packetId: 1, topics: ["a/#/b"] })).toThrow();
    expect(() => P.encodeSubscribe({ packetId: 1, topics: ["a/b+"] })).toThrow();
    expect(() => P.encodeSubscribe({ packetId: 1, topics: [""] })).toThrow();
    expect(() => P.encodeSubscribe({ packetId: 1, topics: [{ filter: "a", qos: 2 }] })).toThrow();
    expect(() =>
      P.encodeSubscribe({ packetId: 1, topics: ["#", "+/x", "a/+/b", "+"] }),
    ).not.toThrow();
  });
  it("UNSUBSCRIBE uses fixed flags 0b0010 (§3.10)", () => {
    expect(hex(P.encodeUnsubscribe({ packetId: 2, topics: ["a/b"] }))).toBe(
      "a2 07 00 02 00 03 61 2f 62",
    );
  });
  it("PINGREQ and DISCONNECT are two-byte packets (§3.12, §3.14)", () => {
    expect(hex(P.encodePingreq())).toBe("c0 00");
    expect(hex(P.encodeDisconnect())).toBe("e0 00");
  });
  it("remaining length uses the variable encoding of §2.2.3 at every boundary", () => {
    // PUBLISH body = 2 (topic length) + 1 (topic "a") + payload; so payload = remaining - 3.
    const cases: Array<[number, string]> = [
      [127, "30 7f"],
      [128, "30 80 01"],
      [16383, "30 ff 7f"],
      [16384, "30 80 80 01"],
      [2097151, "30 ff ff 7f"],
    ];
    for (const [rem, head] of cases) {
      const f = P.encodePublish({ topic: "a", payload: new Uint8Array(rem - 3) });
      expect(hex(f.subarray(0, head.split(" ").length))).toBe(head);
      expect(f.length).toBe(head.split(" ").length + rem);
      expect(P.decodeOne(f).packet.payload.length).toBe(rem - 3); // and back again
    }
  });
});

describe("MQTT 3.1.1 decoder (broker -> client)", () => {
  it("CONNACK accepted, with and without session present (§3.2)", () => {
    expect(dec("20 02 00 00")).toMatchObject({
      type: "connack",
      ok: true,
      sessionPresent: false,
      returnCode: 0,
    });
    expect(dec("20 02 01 00")).toMatchObject({ ok: true, sessionPresent: true });
  });
  it("CONNACK refusal codes 1-5 carry an explanation (§3.2.2.3)", () => {
    for (const rc of [1, 2, 3, 4, 5]) {
      const p = dec(`20 02 00 0${rc}`);
      expect(p.ok).toBe(false);
      expect(p.returnCode).toBe(rc);
      expect(p.message.length).toBeGreaterThan(5);
    }
  });
  it("rejects malformed CONNACK (reserved bits, unknown code, wrong length, flags)", () => {
    expect(() => dec("20 02 02 00")).toThrow(/malformed|Bozuk/i);
    expect(() => dec("20 02 00 06")).toThrow();
    expect(() => dec("20 03 00 00 00")).toThrow();
    expect(() => dec("21 02 00 00")).toThrow();
  });
  it("PUBLISH QoS 0 / QoS 1 round-trip with the encoder (§3.3)", () => {
    const a = dec("30 07 00 03 61 2f 62 68 69");
    expect(a).toMatchObject({
      type: "publish",
      qos: 0,
      retain: false,
      dup: false,
      topic: "a/b",
      packetId: null,
    });
    expect(P.text(a.payload)).toBe("hi");
    const b = dec("3b 08 00 03 61 2f 62 00 0a 31");
    expect(b).toMatchObject({ qos: 1, retain: true, dup: true, packetId: 10, topic: "a/b" });
    expect(P.text(b.payload)).toBe("1");
  });
  it("rejects PUBLISH with QoS 3, packet id 0, truncated topic or wildcard topic", () => {
    expect(() => dec("36 05 00 01 61 00 01")).toThrow();
    expect(() => dec("32 05 00 01 61 00 00")).toThrow();
    expect(() => dec("30 02 00 05")).toThrow();
    expect(() => dec("30 04 00 02 61 23")).toThrow();
  });
  it("PUBACK / UNSUBACK / PINGRESP", () => {
    expect(dec("40 02 12 34")).toEqual({ type: "puback", packetId: 0x1234 });
    expect(dec("b0 02 00 02")).toEqual({ type: "unsuback", packetId: 2 });
    expect(dec("d0 00")).toEqual({ type: "pingresp" });
    expect(() => dec("d0 01 00")).toThrow();
  });
  it("SUBACK reports granted QoS and the 0x80 failure code (§3.9.3)", () => {
    expect(dec("90 03 00 01 00")).toMatchObject({
      type: "suback",
      packetId: 1,
      returnCodes: [0],
      granted: [true],
    });
    expect(dec("90 04 00 01 01 80")).toMatchObject({
      returnCodes: [1, 0x80],
      granted: [true, false],
    });
    expect(() => dec("90 03 00 01 03")).toThrow();
    expect(() => dec("90 02 00 01")).toThrow();
  });
  it("unknown / unexpected packet types are refused instead of ignored", () => {
    expect(() => dec("10 00")).toThrow(/Beklenmeyen/);
  });
  it("returns null while a packet is incomplete", () => {
    expect(P.decodeOne(bytes("30"))).toBeNull();
    expect(P.decodeOne(bytes("30 07 00 03 61"))).toBeNull();
    expect(P.decodeOne(bytes("30 80"))).toBeNull();
  });
  it("rejects a remaining-length field longer than 4 bytes (§2.2.3)", () => {
    expect(() => P.decodeOne(bytes("30 80 80 80 80 01"))).toThrow();
  });
  it("stream parser reassembles byte-by-byte input and splits glued packets", () => {
    const stream = bytes("20 02 00 00 90 03 00 01 00 30 07 00 03 61 2f 62 68 69 d0 00");
    const byByte = P.createParser(),
      got1: any[] = [];
    for (const b of stream) got1.push(...byByte.feed([b]));
    expect(got1.map((p) => p.type)).toEqual(["connack", "suback", "publish", "pingresp"]);
    expect(byByte.pending()).toBe(0);
    const glued = P.createParser();
    expect(glued.feed(stream).length).toBe(4);
    const half = P.createParser();
    expect(half.feed(stream.subarray(0, 6)).map((p: any) => p.type)).toEqual(["connack"]);
    expect(half.pending()).toBe(2);
    expect(half.feed(stream.subarray(6)).map((p: any) => p.type)).toEqual([
      "suback",
      "publish",
      "pingresp",
    ]);
  });
});

describe("helpers", () => {
  it("topic filter matching follows §4.7", () => {
    const m = P.topicMatches;
    expect(m("sport/tennis/player1/#", "sport/tennis/player1")).toBe(true); // §4.7.1.2 example
    expect(m("sport/tennis/player1/#", "sport/tennis/player1/ranking")).toBe(true);
    expect(m("sport/+", "sport/")).toBe(true);
    expect(m("sport/+", "sport")).toBe(false);
    expect(m("+/+", "/finance")).toBe(true);
    expect(m("/+", "/finance")).toBe(true);
    expect(m("+", "/finance")).toBe(false);
    expect(m("#", "a/b/c")).toBe(true);
    expect(m("#", "$SYS/x")).toBe(false); // §4.7.2
    expect(m("+/monitor", "$SYS/monitor")).toBe(false);
    expect(m("$SYS/#", "$SYS/monitor/Clients")).toBe(true);
    expect(m("a/b", "a/b/c")).toBe(false);
  });
  it("packet ids run 1..65535 and wrap without ever yielding 0", () => {
    const next = P.packetIds();
    expect(next()).toBe(1);
    for (let i = 0; i < 65533; i++) next();
    expect(next()).toBe(65535);
    expect(next()).toBe(1);
  });
});

// Reads a PUBLISH produced by a mapping command back through the wire format
const wire = (cmd: { topic: string; payload: string }) => {
  const p = P.decodeOne(P.encodePublish(cmd)).packet;
  return { topic: p.topic, payload: P.text(p.payload) };
};

describe("Zigbee2MQTT mapping", () => {
  it("builds the documented topics", () => {
    expect(z2m.topics("my_bulb")).toEqual({
      state: "zigbee2mqtt/my_bulb",
      set: "zigbee2mqtt/my_bulb/set",
      get: "zigbee2mqtt/my_bulb/get",
      availability: "zigbee2mqtt/my_bulb/availability",
    });
    expect(z2m.topics("living/lamp", "home/z2m").set).toBe("home/z2m/living/lamp/set");
    expect(z2m.bridgeDevicesTopic()).toBe("zigbee2mqtt/bridge/devices");
    expect(() => z2m.topics("a/#")).toThrow();
    expect(() => z2m.topics("")).toThrow();
  });
  it("switch command publishes {state: ON|OFF} to .../set", () => {
    expect(wire(z2m.command("my_bulb", "switch", true))).toEqual({
      topic: "zigbee2mqtt/my_bulb/set",
      payload: '{"state":"ON"}',
    });
    expect(wire(z2m.command("my_bulb", "switch", false)).payload).toBe('{"state":"OFF"}');
  });
  it("brightness maps 0-100 % onto the device range (254 by default, expose value_max otherwise)", () => {
    expect(z2m.command("l", "brightness", 100).payload).toBe('{"brightness":254}');
    expect(z2m.command("l", "brightness", 0).payload).toBe('{"brightness":0}');
    expect(z2m.command("l", "brightness", 50).payload).toBe('{"brightness":127}');
    expect(z2m.command("l", "brightness", 150).payload).toBe('{"brightness":254}');
    expect(z2m.command("l", "brightness", 50, { brightnessMax: 255 }).payload).toBe(
      '{"brightness":128}',
    );
    expect(() => z2m.command("l", "brightness", "x")).toThrow();
  });
  it("refuses capabilities it does not implement", () => {
    expect(() => z2m.command("l", "color", "#fff")).toThrow(/desteklenmiyor/);
    try {
      z2m.command("l", "color", 1);
    } catch (e: any) {
      expect(e.code).toBe("unsupported");
    }
  });
  it("state read is requested with {state: ''} on .../get", () => {
    expect(z2m.query("my_bulb")).toEqual({
      topic: "zigbee2mqtt/my_bulb/get",
      payload: '{"state":""}',
    });
  });
  it("parses the documented state payload; brightness comes back as percent", () => {
    expect(z2m.parseState('{"state":"ON","brightness":215,"color_temp":325}')).toEqual({
      switch: true,
      brightness: 85,
    });
    expect(z2m.parseState('{"state":"OFF"}')).toEqual({ switch: false, brightness: null });
    expect(z2m.parseState('{"state":"TOGGLE"}')).toEqual({ switch: null, brightness: null });
    expect(z2m.parseState('{"brightness":254}').brightness).toBe(100);
    expect(z2m.parseState('{"brightness":255}', { brightnessMax: 255 }).brightness).toBe(100);
    expect(z2m.parseState("not json")).toBeNull();
    expect(z2m.parseState("[1]")).toBeNull();
  });
  it("on/off + brightness round trip through the wire format", () => {
    const set = wire(z2m.command("lamp", "brightness", 40));
    expect(set.topic).toBe("zigbee2mqtt/lamp/set");
    // the device would answer with the raw value on zigbee2mqtt/lamp
    const raw = JSON.parse(set.payload).brightness;
    expect(z2m.parseState(JSON.stringify({ state: "ON", brightness: raw })).brightness).toBe(40);
  });
  it("availability is {state: online|offline}", () => {
    expect(z2m.parseAvailability('{"state":"online"}')).toBe(true);
    expect(z2m.parseAvailability('{"state":"offline"}')).toBe(false);
    expect(z2m.parseAvailability("online")).toBeNull();
    expect(z2m.parseAvailability('{"state":"x"}')).toBeNull();
  });
  it("lists controllable devices from bridge/devices using the documented exposes", () => {
    const list = JSON.stringify([
      { ieee_address: "0x00", type: "Coordinator", friendly_name: "Coordinator", supported: true },
      {
        ieee_address: "0x90fd9ffffe6494fc",
        type: "Router",
        supported: true,
        friendly_name: "my_bulb",
        definition: {
          model: "LED1624G9",
          vendor: "IKEA",
          exposes: [
            {
              type: "light",
              features: [
                { type: "binary", name: "state", value_on: "ON", value_off: "OFF", access: 7 },
                { type: "numeric", name: "brightness", value_min: 0, value_max: 254, access: 7 },
              ],
            },
            { type: "numeric", name: "linkquality", access: 1 },
          ],
        },
      },
      {
        ieee_address: "0x02",
        type: "Router",
        supported: true,
        friendly_name: "plug",
        definition: {
          model: "P",
          vendor: "V",
          exposes: [{ type: "switch", features: [{ type: "binary", name: "state", access: 7 }] }],
        },
      },
      {
        ieee_address: "0x03",
        type: "EndDevice",
        supported: true,
        friendly_name: "motion",
        definition: {
          model: "M",
          vendor: "V",
          exposes: [{ type: "binary", name: "occupancy", access: 1 }],
        },
      },
      { ieee_address: "0x04", type: "EndDevice", supported: false, friendly_name: "mystery" },
    ]);
    const r = z2m.parseDevices(list);
    expect(r.devices).toEqual([
      {
        id: "0x90fd9ffffe6494fc",
        name: "my_bulb",
        model: "LED1624G9",
        vendor: "IKEA",
        kind: "light",
        caps: ["switch", "brightness"],
        brightnessMax: 254,
      },
      {
        id: "0x02",
        name: "plug",
        model: "P",
        vendor: "V",
        kind: "plug",
        caps: ["switch"],
        brightnessMax: 254,
      },
    ]);
    expect(r.skipped).toBe(3); // coordinator, sensor without a light/switch expose, unsupported device
    expect(z2m.parseDevices("garbage")).toEqual({ devices: [], skipped: 0 });
  });
});

describe("Tasmota mapping", () => {
  it("builds the documented cmnd/stat/tele topics", () => {
    expect(tasmota.topics("tasmota")).toMatchObject({
      cmndPower: "cmnd/tasmota/POWER",
      cmndDimmer: "cmnd/tasmota/Dimmer",
      statResult: "stat/tasmota/RESULT",
      statPower: "stat/tasmota/POWER",
      lwt: "tele/tasmota/LWT",
    });
    expect(tasmota.topics("tasmota", 4).cmndPower).toBe("cmnd/tasmota/POWER4");
    expect(() => tasmota.topics("a/b")).toThrow();
    expect(() => tasmota.topics("a", 9)).toThrow();
  });
  it("switch command goes to cmnd/<topic>/POWER with on/off", () => {
    expect(wire(tasmota.command("tasmota", "switch", true))).toEqual({
      topic: "cmnd/tasmota/POWER",
      payload: "on",
    });
    expect(wire(tasmota.command("tasmota", "switch", false, 4))).toEqual({
      topic: "cmnd/tasmota/POWER4",
      payload: "off",
    });
  });
  it("brightness uses Dimmer 0..100", () => {
    expect(tasmota.command("t", "brightness", 55)).toEqual({
      topic: "cmnd/t/Dimmer",
      payload: "55",
    });
    expect(tasmota.command("t", "brightness", 400).payload).toBe("100");
    expect(tasmota.command("t", "brightness", -3).payload).toBe("0");
    expect(() => tasmota.command("t", "color", 1)).toThrow(/desteklenmiyor/);
  });
  it("state query is an empty payload to cmnd/<topic>/POWER", () => {
    expect(wire(tasmota.query("tasmota"))).toEqual({ topic: "cmnd/tasmota/POWER", payload: "" });
  });
  it("parses stat/<topic>/RESULT and stat/<topic>/POWER", () => {
    expect(
      tasmota.parse("tasmota_switch", null, "stat/tasmota_switch/RESULT", '{"POWER":"ON"}'),
    ).toEqual({ switch: true });
    expect(tasmota.parse("t", null, "stat/t/RESULT", '{"POWER":"OFF","Dimmer":30}')).toEqual({
      switch: false,
      brightness: 30,
    });
    expect(tasmota.parse("tasmota", null, "stat/tasmota/POWER", "ON")).toEqual({ switch: true });
    expect(tasmota.parse("tasmota", null, "stat/tasmota/POWER", "off")).toEqual({ switch: false });
  });
  it("multi-relay: only the selected relay is read", () => {
    expect(tasmota.parse("t", 2, "stat/t/RESULT", '{"POWER2":"ON"}')).toEqual({ switch: true });
    expect(tasmota.parse("t", 2, "stat/t/RESULT", '{"POWER1":"ON"}')).toBeNull();
    expect(tasmota.parse("t", 2, "stat/t/POWER2", "OFF")).toEqual({ switch: false });
    expect(tasmota.parse("t", 2, "stat/t/POWER1", "OFF")).toBeNull();
    expect(tasmota.parse("t", 1, "stat/t/RESULT", '{"POWER":"ON"}')).toEqual({ switch: true });
  });
  it("LWT Online/Offline drives availability", () => {
    expect(tasmota.parse("t", null, "tele/t/LWT", "Online")).toEqual({ available: true });
    expect(tasmota.parse("t", null, "tele/t/LWT", "Offline")).toEqual({ available: false });
    expect(tasmota.parse("t", null, "tele/t/LWT", "???")).toBeNull();
  });
  it("ignores other devices, topics, bad JSON and out-of-range dimmer values", () => {
    expect(tasmota.parse("t", null, "stat/other/RESULT", '{"POWER":"ON"}')).toBeNull();
    expect(tasmota.parse("t", null, "stat/t/RESULT", "{oops")).toBeNull();
    expect(tasmota.parse("t", null, "stat/t/RESULT", '{"POWER":"MAYBE"}')).toBeNull();
    expect(tasmota.parse("t", null, "stat/t/RESULT", '{"Dimmer":250}')).toBeNull();
    expect(tasmota.parse("t", null, "tele/t/SENSOR", '{"POWER":"ON"}')).toBeNull();
  });
});

describe("module scope", () => {
  it("only exposes window.nexusMqtt and touches no network or storage", () => {
    expect(SOURCE).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|localStorage|WebSocket/);
    const win: Record<string, unknown> = {};
    new Function("window", SOURCE)(win);
    expect(Object.keys(win)).toEqual(["nexusMqtt"]);
  });
});
