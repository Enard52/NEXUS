import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * MQTT / Zigbee2MQTT bağlayıcısı (lan-connectors.js `mqtt`). Broker tarafı bu dosyada MQTT 3.1.1 bayt
 * biçimine göre yazılmış SAHTE bir broker'dır; akışın (CONNECT → SUBSCRIBE → PUBLISH → DISCONNECT) ve
 * Zigbee2MQTT konu/yük biçiminin kendi içinde tutarlı olduğunu sınar. GERÇEK BROKER İLE DOĞRULAMA DEĞİLDİR.
 */
const REPO_ROOT = resolve(__dirname, "../../..");
const CONNECTORS = readFileSync(resolve(REPO_ROOT, "src/app/lan-connectors.js"), "utf8");
const MQTT = readFileSync(resolve(REPO_ROOT, "src/app/lan-mqtt.js"), "utf8");

type Pkt = {
  type: number;
  topic?: string;
  payload?: string;
  packetId?: number;
  username?: string;
  password?: string;
};

// İstemci paketlerini çözer (CONNECT, SUBSCRIBE, PUBLISH, DISCONNECT): yalnızca testin ihtiyacı kadar.
function decodeClient(bytes: number[]): Pkt[] {
  const out: Pkt[] = [];
  let i = 0;
  while (i < bytes.length) {
    const type = bytes[i] >> 4;
    let mul = 1,
      len = 0,
      j = i + 1,
      b: number;
    do {
      b = bytes[j++];
      len += (b & 127) * mul;
      mul *= 128;
    } while (b & 128);
    const body = bytes.slice(j, j + len);
    i = j + len;
    const str = (o: number) => {
      const n = (body[o] << 8) | body[o + 1];
      return { s: Buffer.from(body.slice(o + 2, o + 2 + n)).toString("utf8"), next: o + 2 + n };
    };
    if (type === 1) {
      const flags = body[7];
      let o = 10;
      const cid = str(o);
      o = cid.next;
      const p: Pkt = { type };
      if (flags & 128) {
        const u = str(o);
        p.username = u.s;
        o = u.next;
      }
      if (flags & 64) p.password = str(o).s;
      out.push(p);
    } else if (type === 8) {
      out.push({ type, packetId: (body[0] << 8) | body[1], topic: str(2).s });
    } else if (type === 3) {
      const t = str(0);
      out.push({ type, topic: t.s, payload: Buffer.from(body.slice(t.next)).toString("utf8") });
    } else out.push({ type });
  }
  return out;
}

function fakeBroker(opts: { rc?: number; devices?: unknown; state?: unknown } = {}) {
  const seen: Pkt[] = [];
  let pending: number[] = [];
  let open = 0;
  let closed = 0;
  let encodePublish: (o: { topic: string; payload: string; retain?: boolean }) => Uint8Array;
  const bridge = {
    open: () => {
      open++;
      return Promise.resolve(open);
    },
    send: ({ bytes }: { id: number; bytes: number[] }) => {
      for (const p of decodeClient(bytes)) {
        seen.push(p);
        if (p.type === 1) pending.push(0x20, 2, 0, opts.rc ?? 0);
        if (p.type === 8) {
          pending.push(0x90, 3, p.packetId! >> 8, p.packetId! & 255, 0);
          if (p.topic!.endsWith("/bridge/devices") && opts.devices !== undefined)
            pending.push(
              ...encodePublish({
                topic: p.topic!,
                payload: JSON.stringify(opts.devices),
                retain: true,
              }),
            );
        }
        if (p.type === 3 && p.topic!.endsWith("/get") && opts.state !== undefined)
          pending.push(
            ...encodePublish({ topic: p.topic!.slice(0, -4), payload: JSON.stringify(opts.state) }),
          );
      }
      return Promise.resolve(true);
    },
    recv: () => {
      const out = pending;
      pending = [];
      return Promise.resolve(out);
    },
    close: () => {
      closed++;
      return Promise.resolve(true);
    },
  };
  return {
    bridge,
    seen,
    stats: () => ({ open, closed }),
    setEncoder: (fn: typeof encodePublish) => (encodePublish = fn),
  };
}

function load(mqttSession: unknown) {
  const store = new Map<string, string>();
  const win: any = {
    nexusGetItem: (k: string) => store.get(k) ?? null,
    nexusSetItem: (k: string, v: string) => void store.set(k, v),
    nexusDesktop: { http: () => Promise.reject(new Error("http yok")), mqttSession },
  };
  new Function("window", MQTT)(win);
  new Function("window", "fetch", CONNECTORS)(win, () => Promise.reject(new Error("fetch yok")));
  return win;
}

function setup(opts: Parameters<typeof fakeBroker>[0]) {
  const broker = fakeBroker(opts);
  const win = load(broker.bridge);
  broker.setEncoder((o) =>
    win.nexusMqtt.packets.encodePublish({
      topic: o.topic,
      payload: o.payload,
      qos: 0,
      retain: !!o.retain,
    }),
  );
  return { broker, lan: win.nexusLan };
}

const Z2M_DEVICES = [
  { type: "Coordinator", friendly_name: "Coordinator", definition: null },
  {
    type: "Router",
    friendly_name: "Salon Lamba",
    ieee_address: "0x01",
    supported: true,
    definition: {
      vendor: "IKEA",
      model: "LED1545G12",
      exposes: [
        { type: "light", features: [{ name: "state" }, { name: "brightness", value_max: 254 }] },
      ],
    },
  },
];

const DEVICE = {
  id: "lan-http-192-168-1-10-1883-salon-lamba",
  host: "http://192.168.1.10:1883",
  protocol: "mqtt",
  entity: "Salon Lamba",
  options: { mqttBase: "zigbee2mqtt", brightnessMax: 254 },
  caps: ["switch", "brightness"],
};

describe("MQTT / Zigbee2MQTT bağlayıcısı", () => {
  it("masaüstü köprüsü yoksa protokol kullanılamaz", () => {
    const win = load(undefined);
    expect(win.nexusLan.hasSecure().mqtt).toBe(false);
    expect(win.nexusLan.supports(DEVICE, "switch")).toBe(false);
  });

  it("cihaz listesi bridge/devices'tan okunur, kimlik bilgisi CONNECT'e yazılır, oturum kapanır", async () => {
    const { broker, lan } = setup({ devices: Z2M_DEVICES });
    const res = await lan.mqtt.listDevices(
      "192.168.1.10",
      1883,
      { mqttUser: "nexus", mqttPass: "gizli" },
      "zigbee2mqtt",
    );
    expect(res.devices.map((d: { name: string }) => d.name)).toEqual(["Salon Lamba"]);
    expect(res.skipped).toBe(1);
    const connect = broker.seen.find((p) => p.type === 1)!;
    expect(connect.username).toBe("nexus");
    expect(connect.password).toBe("gizli");
    expect(broker.seen.find((p) => p.type === 8)!.topic).toBe("zigbee2mqtt/bridge/devices");
    expect(broker.seen[broker.seen.length - 1].type).toBe(14); // DISCONNECT
    expect(broker.stats()).toEqual({ open: 1, closed: 1 });
  });

  it("broker kimlik bilgisini reddederse dürüst hata döner ve oturum kapanır", async () => {
    const { broker, lan } = setup({ rc: 4 });
    await expect(
      lan.mqtt.listDevices("192.168.1.10", 1883, null, "zigbee2mqtt"),
    ).rejects.toMatchObject({ code: "auth" });
    expect(broker.stats().closed).toBe(1);
  });

  it("durum okuma: abone ol, /get iste, gelen durumu yüzdeye çevir", async () => {
    const { broker, lan } = setup({ state: { state: "ON", brightness: 127 } });
    const st = await lan.read(DEVICE);
    expect(st).toEqual({ switch: true, brightness: 50 });
    const pub = broker.seen.find((p) => p.type === 3)!;
    expect(pub.topic).toBe("zigbee2mqtt/Salon Lamba/get");
    expect(JSON.parse(pub.payload!)).toEqual({ state: "" });
  });

  it("yazma: /set konusuna Zigbee2MQTT yükü gider", async () => {
    const { broker, lan } = setup({});
    await lan.write(DEVICE, "switch", false);
    await lan.write(DEVICE, "brightness", 100);
    const pubs = broker.seen.filter((p) => p.type === 3);
    expect(pubs.map((p) => p.topic)).toEqual([
      "zigbee2mqtt/Salon Lamba/set",
      "zigbee2mqtt/Salon Lamba/set",
    ]);
    expect(JSON.parse(pubs[0].payload!)).toEqual({ state: "OFF" });
    expect(JSON.parse(pubs[1].payload!)).toEqual({ brightness: 254 });
  });

  it("desteklenmeyen yetenek reddedilir", async () => {
    const { lan } = setup({});
    await expect(lan.write(DEVICE, "color", "#ff0000")).rejects.toThrow();
  });
});
