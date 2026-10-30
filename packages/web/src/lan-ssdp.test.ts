import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * SSDP keşfi: paket biçimi UPnP Device Architecture 1.1'e göre, yanıt ayrıştırma ve masaüstü köprüsü
 * olmayan ortamda "bulundu" uydurulmaması doğrulanır. Gerçek ağda denenmedi.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/lan-connectors.js"), "utf8");
const ssdp = createRequire(import.meta.url)(resolve(REPO_ROOT, "desktop/ssdp.cjs"));

function load(desktop: Record<string, unknown> | null) {
  const win: Record<string, unknown> = desktop ? { nexusDesktop: desktop } : {};
  new Function("window", "fetch", SOURCE)(win, () => Promise.reject(new Error("fetch yok")));
  return (win as { nexusLan: any }).nexusLan;
}

describe("SSDP paketi ve yanıtı", () => {
  it("M-SEARCH gerekli başlıkları taşır", () => {
    const text = ssdp.buildMSearch("ssdp:all", 2).toString("utf8");
    expect(text.startsWith("M-SEARCH * HTTP/1.1\r\n")).toBe(true);
    expect(text).toContain("HOST: 239.255.255.250:1900\r\n");
    expect(text).toContain('MAN: "ssdp:discover"\r\n');
    expect(text).toContain("MX: 2\r\n");
    expect(text).toContain("ST: ssdp:all\r\n");
    expect(text.endsWith("\r\n\r\n")).toBe(true);
  });

  it("200 OK yanıtını ayrıştırır, başlık adlarında büyük/küçük harf fark etmez", () => {
    const reply =
      "HTTP/1.1 200 OK\r\nCache-Control: max-age=1800\r\nST: upnp:rootdevice\r\nUSN: uuid:abc::upnp:rootdevice\r\nServer: Linux UPnP/1.0\r\nlocation: http://192.168.1.20:80/desc.xml\r\n\r\n";
    expect(ssdp.parseResponse(reply, "192.168.1.20")).toEqual({
      address: "192.168.1.20",
      st: "upnp:rootdevice",
      usn: "uuid:abc::upnp:rootdevice",
      server: "Linux UPnP/1.0",
      location: "http://192.168.1.20:80/desc.xml",
    });
  });

  it("özel olmayan adres ve HTTP olmayan yanıt reddedilir", () => {
    const ok = "HTTP/1.1 200 OK\r\nST: x\r\n\r\n";
    expect(ssdp.parseResponse(ok, "8.8.8.8")).toBeNull();
    expect(ssdp.parseResponse("garbage", "192.168.1.5")).toBeNull();
    expect(ssdp.parseResponse("HTTP/1.1 404 Not Found\r\n\r\n", "192.168.1.5")).toBeNull();
  });
});

describe("ssdpHosts (renderer)", () => {
  it("masaüstü köprüsü yoksa boş liste döner", async () => {
    expect(await load(null).ssdpHosts()).toEqual([]);
  });

  it("köprü adreslerini tekilleştirir; hata olursa boş liste", async () => {
    const lan = load({
      http: () => Promise.reject(new Error("x")),
      ssdp: () =>
        Promise.resolve([{ address: "192.168.1.7" }, { address: "192.168.1.7" }, { address: "192.168.1.8" }]),
    });
    expect(await lan.ssdpHosts()).toEqual(["192.168.1.7", "192.168.1.8"]);
    const bad = load({ http: () => Promise.reject(new Error("x")), ssdp: () => Promise.reject(new Error("y")) });
    expect(await bad.ssdpHosts()).toEqual([]);
  });
});
