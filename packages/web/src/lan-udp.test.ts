import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * WiZ / LIFX / Govee / Sonoff baglayicilari: masaustu UDP koprusu (window.nexusDesktop.udp) sahte bir
 * cihazla degistirilir; paket bicimleri ve yanit cozumleme gercek protokol belgelerine gore dogrulanir.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "lan-connectors.js"), "utf8");

type Udp = (o: any) => Promise<any>;
function load(udp: Udp | null, http?: (o: any) => Promise<any>) {
  const desktop: Record<string, unknown> = {
    http: http ?? (() => Promise.reject(new Error("http yok"))),
  };
  if (udp) desktop.udp = udp;
  const win: Record<string, unknown> = { nexusDesktop: desktop };
  new Function("window", "fetch", SOURCE)(win, () => Promise.reject(new Error("fetch yok")));
  return (win as { nexusLan: any }).nexusLan;
}
const hex = (b: number[]) => b.map((x) => (x < 16 ? "0" : "") + x.toString(16)).join("");
const bytes = (h: string) => Array.from(Buffer.from(h, "hex"));

describe("UDP koprusu olmayan ortamda", () => {
  it("WiZ/LIFX/Govee protokolleri etkinlesmez (sahte basari yok)", async () => {
    const lan = load(null);
    expect(lan.hasUdp()).toBe(false);
    expect(lan.supports({ host: "192.168.1.9", protocol: "wiz" }, "switch")).toBe(false);
    await expect(lan.identify("192.168.1.9")).rejects.toBeTruthy();
  });
});

describe("WiZ", () => {
  it("getSystemConfig ile taninir, setPilot ile yazilir", async () => {
    const sent: any[] = [];
    const lan = load((o) => {
      if (o.port !== 38899) return Promise.reject(new Error("zaman asimi"));
      const req = JSON.parse(o.text);
      sent.push(req);
      if (req.method === "getSystemConfig")
        return Promise.resolve({
          text: JSON.stringify({
            method: "getSystemConfig",
            result: { mac: "a8bb50112233", moduleName: "ESP01_SHRGB_03" },
          }),
        });
      if (req.method === "getPilot")
        return Promise.resolve({ text: JSON.stringify({ result: { state: true, dimming: 40 } }) });
      return Promise.resolve({ text: JSON.stringify({ result: { success: true } }) });
    });
    const found = await lan.identify("192.168.1.30");
    expect(found.protocol).toBe("wiz");
    expect(found.kind).toBe("light");
    const dev = { host: "192.168.1.30", protocol: "wiz" };
    expect(lan.supports(dev, "color")).toBe(true);
    expect(await lan.protocolFor("wiz").read(dev)).toEqual({ switch: true, brightness: 40 });
    await lan.protocolFor("wiz").write(dev, "brightness", 5);
    expect(sent.at(-1)).toMatchObject({ method: "setPilot", params: { state: true, dimming: 10 } });
    await lan.protocolFor("wiz").write(dev, "color", "#ff8000");
    expect(sent.at(-1).params).toMatchObject({ r: 255, g: 128, b: 0 });
  });
});

describe("LIFX", () => {
  function lightState(power: number, bright: number, label: string): string {
    const b = new Array(36 + 52).fill(0);
    b[32] = 107;
    const p = 36;
    const put = (o: number, n: number) => {
      b[p + o] = n & 255;
      b[p + o + 1] = (n >> 8) & 255;
    };
    put(0, 1000);
    put(2, 40000);
    put(4, bright);
    put(6, 3500);
    put(10, power);
    for (let i = 0; i < label.length; i++) b[p + 12 + i] = label.charCodeAt(i);
    return hex(b);
  }

  it("dogru basliklu paket gonderir ve LightState'i cozer", async () => {
    const sent: number[][] = [];
    const lan = load((o) => {
      if (o.port !== 56700) return Promise.reject(new Error("zaman asimi"));
      const b = bytes(o.hex);
      sent.push(b);
      expect(b[0] | (b[1] << 8)).toBe(b.length); // boyut alani
      expect(b[2]).toBe(0x00);
      expect(b[3]).toBe(0x14); // protokol 1024 + addressable
      expect(b[22] & 1).toBe(1); // res_required
      const type = b[32] | (b[33] << 8);
      if (type === 101) return Promise.resolve({ hex: lightState(65535, 32768, "Salon") });
      return Promise.resolve({ hex: hex(new Array(38).fill(0)) });
    });
    const found = await lan.identify("192.168.1.40");
    expect(found.protocol).toBe("lifx");
    expect(found.name).toBe("Salon");
    const dev = { host: "192.168.1.40", protocol: "lifx" };
    expect(await lan.protocolFor("lifx").read(dev)).toEqual({ switch: true, brightness: 50 });

    await lan.protocolFor("lifx").write(dev, "switch", false);
    const power = sent.at(-1)!;
    expect(power[32] | (power[33] << 8)).toBe(117);
    expect(power[36] | (power[37] << 8)).toBe(0);

    await lan.protocolFor("lifx").write(dev, "brightness", 100);
    const color = sent.at(-1)!;
    expect(color[32] | (color[33] << 8)).toBe(102);
    expect(color[36 + 5] | (color[36 + 6] << 8)).toBe(65535); // brightness alani
  });
});

describe("Govee", () => {
  it("scan ile taninir; komutlar yanitsiz (noReply) gider, durum 4002'den okunur", async () => {
    const calls: any[] = [];
    const lan = load((o) => {
      if (o.port !== 4001 && o.port !== 4003) return Promise.reject(new Error("zaman asimi"));
      calls.push(o);
      if (o.noReply) return Promise.resolve({ sent: true });
      const msg = JSON.parse(o.text).msg;
      if (msg.cmd === "scan")
        return Promise.resolve({
          text: JSON.stringify({
            msg: {
              cmd: "scan",
              data: { ip: "192.168.1.50", device: "AA:BB:CC:DD:EE:FF:11:22", sku: "H6008" },
            },
          }),
        });
      return Promise.resolve({
        text: JSON.stringify({ msg: { cmd: "devStatus", data: { onOff: 1, brightness: 70 } } }),
      });
    });
    const found = await lan.identify("192.168.1.50");
    expect(found.protocol).toBe("govee");
    expect(found.model).toBe("Govee H6008");
    expect(calls[0]).toMatchObject({ port: 4001, replyPort: 4002 });
    const dev = { host: "192.168.1.50", protocol: "govee" };
    expect(await lan.protocolFor("govee").read(dev)).toEqual({ switch: true, brightness: 70 });
    await lan.protocolFor("govee").write(dev, "switch", true);
    expect(calls.at(-1)).toMatchObject({ port: 4003, noReply: true });
    expect(JSON.parse(calls.at(-1).text).msg).toEqual({ cmd: "turn", data: { value: 1 } });
  });
});

describe("Sonoff DIY", () => {
  it("zeroconf/info ile taninir ve switch yazar", async () => {
    const reqs: any[] = [];
    const lan = load(
      () => Promise.reject(new Error("udp yok")),
      (o) => {
        reqs.push(o);
        if (o.url.endsWith("/zeroconf/info"))
          return Promise.resolve({
            status: 200,
            text: JSON.stringify({ error: 0, data: { switch: "off", deviceid: "10001abcd" } }),
          });
        return Promise.resolve({ status: 200, text: JSON.stringify({ error: 0, data: {} }) });
      },
    );
    const dev = { host: "192.168.1.60", protocol: "sonoff" };
    const found = await lan.identify("192.168.1.60");
    expect(found.protocol).toBe("sonoff");
    expect(await lan.protocolFor("sonoff").read(dev)).toEqual({ switch: false });
    await lan.protocolFor("sonoff").write(dev, "switch", true);
    expect(reqs.at(-1).url).toContain(":8081/zeroconf/switch");
    expect(JSON.parse(reqs.at(-1).body).data).toEqual({ switch: "on" });
  });
});
