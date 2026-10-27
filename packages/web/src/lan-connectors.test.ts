import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * lan-connectors.js tarayici IIFE'sidir; testlerde sahte fetch + sahte window ile
 * yuklenir, boylece protokol sezme ve alt ag taramasi gerçek cihaz olmadan dogrulanir.
 */

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "lan-connectors.js"), "utf8");

type Fetch = (url: string) => Promise<{ status: number; text: () => Promise<string> }>;

function load(fetchImpl: Fetch, capacitor?: unknown) {
  const win: Record<string, unknown> = {};
  if (capacitor) win.Capacitor = capacitor;
  new Function("window", "fetch", SOURCE)(win, fetchImpl);
  return (win as { nexusLan: any }).nexusLan;
}

function ok(body: unknown) {
  return { status: 200, text: () => Promise.resolve(JSON.stringify(body)) };
}

afterEach(() => {
  // sabit kuyruk durumu testler arasi sizmasin
});

describe("protokol sezme", () => {
  it("Shelly ayarlarindan modeli ve turu cikarir", async () => {
    const lan = load((url) => {
      if (url.endsWith("/settings"))
        return Promise.resolve(ok({ device: { type: "SHPLG-S", hostname: "salon-priz" } }));
      return Promise.resolve({ status: 404, text: () => Promise.resolve("") });
    });
    const found = await lan.identify("192.168.1.20");
    expect(found.protocol).toBe("shelly");
    expect(found.name).toBe("salon-priz");
    expect(found.kind).toBe("plug");
  });

  it("WLED ve ESPHome uclarini ayirt eder", async () => {
    const lan = load((url) => {
      if (url.includes("/json/info"))
        return Promise.resolve(ok({ ver: "0.14.2", name: "serit", leds: { count: 60 } }));
      if (url.includes("/settings"))
        return Promise.resolve({ status: 500, text: () => Promise.resolve("err") });
      return Promise.resolve({ status: 404, text: () => Promise.resolve("") });
    });
    const found = await lan.identify("192.168.1.21");
    expect(found.protocol).toBe("wled");
    expect(found.model).toBe("WLED 0.14.2");
  });

  it("Tuya Local uclarini tanir", async () => {
    const lan = load((url) => {
      if (url.includes(":6668/status"))
        return Promise.resolve(ok({ devId: "tuya123", dps: { "1": true, "2": 800 } }));
      return Promise.resolve({ status: 404, text: () => Promise.resolve("") });
    });
    const found = await lan.identify("192.168.1.55");
    expect(found.protocol).toBe("tuya-local");
  });

  it("hicbir protokol cevap vermezse hata verir", async () => {
    const lan = load(() => Promise.resolve({ status: 404, text: () => Promise.resolve("") }));
    await expect(lan.identify("192.168.1.99")).rejects.toBeTruthy();
  });
});

describe("alt ağ taraması", () => {
  it("geçersiz önek reddedilir, dordüncü oktet otomatik düşürülür", () => {
    const lan = load(() => Promise.resolve({ status: 404, text: () => Promise.resolve("") }));
    expect(lan.normalizeSubnetBase("10.0.0")).toBe("10.0.0");
    expect(lan.normalizeSubnetBase("10.0.0.5")).toBe("10.0.0");
    expect(lan.normalizeSubnetBase("192.168.1.")).toBe("192.168.1");
    expect(lan.normalizeSubnetBase("sekiz.yuz")).toBe(null);
    expect(lan.normalizeSubnetBase("999.1.1")).toBe(null);
  });

  it("254 adresi sınırlı eşzamanlılıkla yoklar ve bulunanları döndürür", async () => {
    const seen: string[] = [];
    // Tarama bir adresin protokollerini aynı anda yoklar; sınırlanan şey aynı anda yoklanan ADRES sayısıdır.
    const inFlightByHost = new Map<string, number>();
    let peak = 0;
    const lan = load((url) => {
      seen.push(url);
      const host = url.match(/http:\/\/(10\.0\.0\.\d+)/);
      const key = host ? host[1] : url;
      inFlightByHost.set(key, (inFlightByHost.get(key) || 0) + 1);
      peak = Math.max(peak, inFlightByHost.size);
      const isDevice = host && ["10.0.0.7", "10.0.0.99"].includes(host[1]);
      return Promise.resolve(
        isDevice
          ? ok({ device: { type: "SHSW-1", hostname: "cihaz-" + host[1].split(".").pop() } })
          : { status: 404, text: () => Promise.resolve("") },
      ).finally(() => {
        const left = (inFlightByHost.get(key) || 1) - 1;
        if (left <= 0) inFlightByHost.delete(key);
        else inFlightByHost.set(key, left);
      });
    });

    const onFound: string[] = [];
    const found = await lan.scanSubnet("10.0.0", {
      concurrency: 8,
      onFound: (info: { name: string }) => onFound.push(info.name),
    });
    // Her protokol ayri istek atar; onemli olcuk: yoklanan benzersiz adres sayisi
    // ve ayni anda beklemedeki istek sayisi.
    const hosts = new Set(
      seen.map((url) => (url.match(/http:\/\/(10\.0\.0\.\d+)/) || [])[1]).filter(Boolean),
    );
    expect(hosts.size).toBe(254);
    expect(peak).toBeLessThanOrEqual(8);
    expect(found.map((f: { host: string }) => f.host).sort()).toEqual(["10.0.0.7", "10.0.0.99"]);
    expect(onFound.sort()).toEqual(["cihaz-7", "cihaz-99"]);
  });

  it("geçersiz önekle tarama başlatılmaz", async () => {
    const lan = load(() => Promise.resolve({ status: 404, text: () => Promise.resolve("") }));
    await expect(lan.scanSubnet("172.20")).rejects.toBeTruthy();
  });
});

describe("transport seçimi", () => {
  it("yerel ağa erişemeyen WebView yerine native HTTP eklentisi kullanılır", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const lan = load(() => Promise.reject(new Error("fetch kullanilmamali")), {
      isNativePlatform: () => true,
      Plugins: {
        Http: {
          request: (options: Record<string, unknown>) => {
            calls.push(options);
            return Promise.resolve({
              status: 200,
              data: JSON.stringify({ device: { type: "SHPLG-1", hostname: "priz" } }),
            });
          },
        },
      },
    });
    expect(lan.usingNativeTransport()).toBe(true);
    const found = await lan.identify("192.168.1.30");
    expect(found.protocol).toBe("shelly");
    expect(calls[0].url).toBe("http://192.168.1.30/settings");
    expect(calls[0].method).toBe("GET");
  });

  it("setTransport ile açık bir adaptör her şeyi ezer", async () => {
    let used = "";
    const lan = load(() => Promise.reject(new Error("fetch kullanilmamali")));
    lan.setTransport((opts: { url: string }) => {
      used = opts.url;
      return Promise.resolve({
        status: 200,
        text: JSON.stringify({ ver: "0.14.0", name: "wled", leds: { count: 30 } }),
      });
    });
    const found = await lan.identify("192.168.1.40");
    expect(used).toBe("http://192.168.1.40/json/info");
    expect(found.protocol).toBe("wled");
  });
});

describe("komut gövdesi", () => {
  it("WLED parlaklığı 0-100 aralığından 0-255'e çevirir", async () => {
    const bodies: string[] = [];
    const lan = load((url) => {
      if (url.endsWith("/json/info"))
        return Promise.resolve(ok({ ver: "0.14.2", name: "serit", leds: { count: 60 } }));
      bodies.push("post");
      return Promise.resolve({ status: 200, text: () => Promise.resolve("{}") });
    });
    const device = { protocol: "wled", host: "http://10.0.0.5" };
    await lan.write(device, "brightness", 50);
    expect(bodies.length).toBe(1);
  });

  it("bilinmeyen protokole yazma denemesi patlar", async () => {
    const lan = load(() => Promise.resolve({ status: 404, text: () => Promise.resolve("") }));
    await expect(
      lan.write({ protocol: "yok-boyle-bir-sey", host: "http://1.2.3.4" }, "switch", true),
    ).rejects.toBeTruthy();
  });

  it("Shelly 4xx/5xx yanıtı başarı sayılmaz", async () => {
    const lan = load(() => Promise.resolve({ status: 500, text: () => Promise.resolve("err") }));
    await expect(
      lan.write({ protocol: "shelly", host: "http://192.168.1.24", kind: "plug" }, "switch", true),
    ).rejects.toThrow("http 500");
  });

  it("Wake-on-LAN sihirli paketini 102 baytlık geçerli hex olarak üretir", () => {
    const lan = load(() => Promise.resolve({ status: 404, text: () => Promise.resolve("") }));
    const mac = "AA:BB:CC:DD:EE:FF";
    const packet = lan.buildMagicPacket(mac);
    expect(packet.length).toBe(204); // 102 bytes = 204 hex chars
    expect(packet.startsWith("ffffffffffff")).toBe(true);
    expect(packet.endsWith("aabbccddeeff")).toBe(true);
  });
});
