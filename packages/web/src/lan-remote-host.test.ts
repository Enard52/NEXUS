import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Uzak erişim adresi (lan-connectors.js remoteHosts): yerel adres başarısız olunca ikinci adres denenir.
 * Burada aygıt yanıtı bir HTTP taklidiyle verilir; gerçek VPN/uzak ağ ile doğrulama DEĞİLDİR.
 */
const CONNECTORS = readFileSync(resolve(__dirname, "../../../src/app/lan-connectors.js"), "utf8");

function setup(reachable: string[]) {
  const store = new Map<string, string>();
  const hits: string[] = [];
  const win: any = {
    nexusGetItem: (k: string) => store.get(k) ?? null,
    nexusSetItem: (k: string, v: string) => void store.set(k, v),
    nexusDesktop: {
      http: (o: { url: string }) => {
        hits.push(o.url);
        const host = reachable.find((h) => o.url.startsWith(h));
        if (!host) return Promise.reject(new Error("ulaşılamadı"));
        return Promise.resolve({
          status: 200,
          text: JSON.stringify({ relays: [{ ison: true }] }),
        });
      },
    },
  };
  new Function("window", "fetch", CONNECTORS)(win, () => Promise.reject(new Error("fetch yok")));
  return { lan: win.nexusLan, hits, store };
}

const DEVICE = {
  id: "d1",
  host: "http://192.168.1.50",
  protocol: "shelly",
  caps: ["switch"],
};

describe("uzak erişim adresi", () => {
  it("adres biçimi doğrulanır ve normalleştirilir", () => {
    const { lan } = setup([]);
    const n = lan.remoteHosts.normalize;
    expect(n("100.64.0.5:8123")).toBe("http://100.64.0.5:8123");
    expect(n("https://nas.example.com")).toBe("https://nas.example.com");
    expect(n("")).toBeNull();
    expect(n("not a host")).toBeNull();
    expect(n("1.2.3.4:99999")).toBeNull();
    expect(n("javascript:alert(1)")).toBeNull();
  });

  it("geçersiz adres kaydedilmez, boş değer eşlemeyi siler", () => {
    const { lan, store } = setup([]);
    expect(lan.remoteHosts.set("http://192.168.1.50", "???")).toBe(false);
    expect(lan.remoteHosts.set("http://192.168.1.50", "100.64.0.5")).toBe(true);
    expect(JSON.parse(store.get("nexusRemoteHosts")!)).toEqual({
      "http://192.168.1.50": "http://100.64.0.5",
    });
    expect(lan.remoteHosts.set("http://192.168.1.50", "")).toBe(true);
    expect(JSON.parse(store.get("nexusRemoteHosts")!)).toEqual({});
  });

  it("yerel adres yanıt vermezse uzak adres denenir", async () => {
    const t = setup(["http://100.64.0.5"]);
    t.lan.remoteHosts.set(DEVICE.host, "100.64.0.5");
    const st = await t.lan.read(DEVICE);
    expect(st.switch).toBe(true);
    expect(t.hits[0].startsWith("http://192.168.1.50")).toBe(true);
    expect(t.hits[t.hits.length - 1].startsWith("http://100.64.0.5")).toBe(true);
  });

  it("uzak adres tanımlı değilse yerel hata aynen döner", async () => {
    const t = setup([]);
    await expect(t.lan.read(DEVICE)).rejects.toThrow();
    expect(t.hits.every((u) => u.startsWith("http://192.168.1.50"))).toBe(true);
  });

  it("ikisi de ulaşılamazsa başarılı gösterilmez", async () => {
    const t = setup([]);
    t.lan.remoteHosts.set(DEVICE.host, "100.64.0.5");
    await expect(t.lan.read(DEVICE)).rejects.toThrow();
  });
});
