import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Wake-on-LAN: sihirli paket (6x FF + 16x MAC), alt ag yayin adresine gonderim, IP→MAC koprusu. Gercek donanimla DENENMEDI. */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/lan-connectors.js"), "utf8");

function load(desktop: Record<string, unknown> | null) {
  const win: Record<string, unknown> = { nexusGetItem: () => null, nexusSetItem: () => undefined };
  if (desktop) win.nexusDesktop = { http: () => Promise.reject(new Error("http yok")), ...desktop };
  new Function("window", "fetch", SOURCE)(win, () => Promise.reject(new Error("fetch yok")));
  return (win as { nexusLan: any }).nexusLan;
}

describe("Wake-on-LAN gonderimi", () => {
  it("sihirli paket: 6 x FF + 16 x MAC", () => {
    const hex: string = load(null).buildMagicPacket("AA:bb:cc:01:02:03");
    expect(hex.length).toBe(102 * 2);
    expect(hex.startsWith("ffffffffffff")).toBe(true);
    expect(hex.slice(12)).toBe("aabbcc010203".repeat(16));
  });

  it("http:// onekli kayit adresinden alt ag yayin adresi turetir ve koprunun izin verdigi adreslere gonderir", async () => {
    const sent: any[] = [];
    const lan = load({ udp: (o: any) => (sent.push(o), Promise.resolve({})) });
    await lan
      .protocolFor("wol")
      .write({ host: "http://192.168.1.77", mac: "aa:bb:cc:01:02:03" }, "switch", true);
    expect(sent.map((s) => s.host).sort()).toEqual(["192.168.1.255", "255.255.255.255"].sort());
    expect(sent.every((s) => s.port === 9 && s.noReply === true)).toBe(true);
  });

  it("bir adres basarisiz olsa da digeri gittiyse basarili sayar; hepsi basarisizsa hata verir", async () => {
    let n = 0;
    const half = load({
      udp: () => (n++ === 0 ? Promise.reject(new Error("x")) : Promise.resolve({})),
    });
    await expect(half.wakeOnLan("aa:bb:cc:01:02:03", "10.0.0.5")).resolves.toMatchObject({
      success: true,
    });
    const none = load({ udp: () => Promise.reject(new Error("x")) });
    await expect(none.wakeOnLan("aa:bb:cc:01:02:03", "10.0.0.5")).rejects.toThrow();
  });

  it("gecersiz MAC gonderilmez", () => {
    expect(() => load(null).buildMagicPacket("aa:bb")).toThrow();
  });
});

describe("IP → MAC", () => {
  it("kopru yoksa null; gecerli MAC'i kucuk harfle dondurur; bozuk degeri reddeder", async () => {
    expect(await load(null).wol.lookupMac("192.168.1.5")).toBeNull();
    const ok = load({ arpLookup: () => Promise.resolve({ mac: "AA:BB:CC:01:02:03" }) });
    expect(await ok.wol.lookupMac("http://192.168.1.5")).toBe("aa:bb:cc:01:02:03");
    const bad = load({ arpLookup: () => Promise.resolve({ mac: "ff:ff" }) });
    expect(await bad.wol.lookupMac("192.168.1.5")).toBeNull();
    const err = load({ arpLookup: () => Promise.reject(new Error("x")) });
    expect(await err.wol.lookupMac("192.168.1.5")).toBeNull();
  });
});

describe("masaustu ARP koprusu", () => {
  const main = readFileSync(resolve(REPO_ROOT, "desktop/main.cjs"), "utf8");
  const preload = readFileSync(resolve(REPO_ROOT, "desktop/preload.cjs"), "utf8");

  it("ARP cikti ayristirma: Windows/Unix biciminde MAC alir, yayin/bos/coklu yayin adresini almaz", () => {
    const start = main.indexOf("function parseArpMac");
    const end = main.indexOf("function arpLookupOnce");
    const parse = new Function(`${main.slice(start, end)}; return parseArpMac;`)();
    expect(parse("  192.168.1.5           aa-bb-cc-01-02-03     dynamic")).toBe(
      "aa:bb:cc:01:02:03",
    );
    expect(parse("? (192.168.1.5) at a:b:c:1:2:3 on en0 ifscope [ethernet]")).toBe(
      "0a:0b:0c:01:02:03",
    );
    expect(parse("192.168.1.255 ff-ff-ff-ff-ff-ff static")).toBeNull();
    expect(parse("224.0.0.22 01-00-5e-00-00-16 static")).toBeNull();
    expect(parse("192.168.1.9 (incomplete)")).toBeNull();
    expect(parse("")).toBeNull();
  });

  it("yalnizca ozel IPv4 sorulur ve kabuk kullanilmaz", () => {
    const block = main.slice(
      main.indexOf('ipcMain.handle("lan:arp"'),
      main.indexOf("// ---------- Köprü: yerel ağ UDP"),
    );
    expect(block).toContain("isPrivateHost(ip)");
    expect(block).toContain('ip === "255.255.255.255"');
    const run = main.slice(
      main.indexOf("function arpLookupOnce"),
      main.indexOf('ipcMain.handle("lan:arp"'),
    );
    expect(run).toContain('execFile("arp", ["-a", ip]');
    expect(run).not.toMatch(/\bexec\(|shell:\s*true/);
  });

  it("preload kopruyu aciga cikarir", () => {
    expect(preload).toContain('arpLookup: (opts) => ipcRenderer.invoke("lan:arp", opts)');
  });
});
