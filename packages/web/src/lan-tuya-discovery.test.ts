import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import nodeCrypto from "node:crypto";

/**
 * Tuya yerel yayini (UDP 6666 duz / 6667 sifreli) ayristirma ve kesif. Paketler bu dosyada Node crypto ile
 * BAGIMSIZ kurulmustur (yayimlanmis tinytuya bicimi: 00 00 55 aa | seq | cmd | len | veri | crc | 00 00 aa 55,
 * 6667 verisi AES-128-ECB, anahtar MD5("yGAdlopoPVldABfn")). Bicim testidir; ayristirici ayrica bir gercek
 * Tuya cihazinin yayiniyla elle denendi (surum 3.4), ancak o paket depoya konmaz (cihaz kimligi icerir).
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/lan-connectors.js"), "utf8");

function load(desktop: Record<string, unknown> | null) {
  const win: Record<string, unknown> = {
    nexusGetItem: () => null,
    nexusSetItem: () => undefined,
  };
  if (desktop) win.nexusDesktop = { http: () => Promise.reject(new Error("http yok")), ...desktop };
  new Function("window", "fetch", SOURCE)(win, () => Promise.reject(new Error("fetch yok")));
  return (win as { nexusLan: any }).nexusLan;
}

const u32 = (n: number) => {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
};
function crc32(buf: Buffer) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function frame(data: Buffer) {
  const head = Buffer.concat([
    Buffer.from("000055aa", "hex"),
    u32(0),
    u32(0x13),
    u32(data.length + 12),
    u32(0), // donus kodu
    data,
  ]);
  return Buffer.concat([head, u32(crc32(head)), Buffer.from("0000aa55", "hex")]);
}
const udpKey = nodeCrypto.createHash("md5").update("yGAdlopoPVldABfn").digest();
function encrypted(json: object) {
  const c = nodeCrypto.createCipheriv("aes-128-ecb", udpKey, null);
  return frame(Buffer.concat([c.update(Buffer.from(JSON.stringify(json))), c.final()]));
}
const plain = (json: object) => frame(Buffer.from(JSON.stringify(json)));

const DEVICE = {
  ip: "192.168.1.50",
  gwId: "bf1234567890abcdef1234",
  version: "3.4",
  productKey: "keyabc123",
};

describe("Tuya yayin ayristirma", () => {
  const { internals } = load(null);
  const parse = (b: Buffer | string) =>
    internals.tuyaParseBroadcast(typeof b === "string" ? b : b.toString("hex"));

  it("sifreli (6667) yayindan kimlik, surum ve urun anahtarini okur", () => {
    expect(parse(encrypted(DEVICE))).toEqual({
      id: DEVICE.gwId,
      version: "3.4",
      productKey: "keyabc123",
      ip: DEVICE.ip,
    });
  });

  it("duz (6666) yayini da okur", () => {
    expect(parse(plain({ ...DEVICE, version: "3.3" }))?.version).toBe("3.3");
  });

  it("yerel anahtar yayinda yoktur: sonuc yalnizca kimlik/surum/adres alanlarini tasir", () => {
    const keys = Object.keys(parse(encrypted({ ...DEVICE, localKey: "gizli1234567890a" })));
    expect(keys.sort()).toEqual(["id", "ip", "productKey", "version"]);
  });

  it("bozuk ya da yabanci paketleri reddeder", () => {
    expect(parse("")).toBeNull();
    expect(parse("abc")).toBeNull(); // tek sayida hane
    expect(parse("zz".repeat(30))).toBeNull();
    const ok = encrypted(DEVICE);
    expect(parse(Buffer.concat([Buffer.from("01", "hex"), ok.subarray(1)]))).toBeNull(); // onek bozuk
    expect(parse(ok.subarray(0, ok.length - 1))).toBeNull(); // sonek eksik
    expect(parse(plain({ ...DEVICE, gwId: "kisa" }))).toBeNull();
    expect(parse(plain({ ...DEVICE, version: "4.0" }))).toBeNull();
    expect(parse(plain({ ip: "1.2.3.4" }))).toBeNull();
    expect(parse(frame(Buffer.from("not json at all")))).toBeNull();
    expect(parse(frame(nodeCrypto.randomBytes(48)))).toBeNull(); // yanlis anahtarla sifre
  });
});

describe("Tuya kesfi (kopru)", () => {
  it("kopru yoksa bos doner, hicbir cihaz uydurmaz", async () => {
    expect(await load(null).tuya.discover()).toEqual([]);
  });

  it("host olarak paketin GERCEK kaynagini kullanir; icerideki ip alanina guvenmez", async () => {
    const lan = load({
      tuyaBroadcast: () =>
        Promise.resolve([
          { address: "192.168.1.9", port: 6667, hex: encrypted(DEVICE).toString("hex") },
        ]),
    });
    const [d] = await lan.tuya.discover();
    expect(d).toEqual({
      host: "192.168.1.9",
      id: DEVICE.gwId,
      version: "3.4",
      productKey: "keyabc123",
    });
  });

  it("cozulemeyen paketleri atar, ayni adresi bir kez dondurur", async () => {
    const good = encrypted(DEVICE).toString("hex");
    const lan = load({
      tuyaBroadcast: () =>
        Promise.resolve([
          { address: "192.168.1.9", hex: good },
          {
            address: "192.168.1.9",
            hex: encrypted({ ...DEVICE, gwId: "bf9999999999999999aaaa" }).toString("hex"),
          },
          { address: "192.168.1.10", hex: "deadbeef" },
          { address: "192.168.1.11", hex: plain({ ...DEVICE, version: "3.3" }).toString("hex") },
        ]),
    });
    const list = await lan.tuya.discover();
    expect(list.map((x: { host: string }) => x.host)).toEqual(["192.168.1.9", "192.168.1.11"]);
    expect(list[0].id).toBe(DEVICE.gwId);
  });

  it("kopru hata verirse bos doner", async () => {
    const lan = load({ tuyaBroadcast: () => Promise.reject(new Error("kopru hatasi")) });
    expect(await lan.tuya.discover()).toEqual([]);
  });
});

describe("masaustu koprusu Tuya yayini", () => {
  const main = readFileSync(resolve(REPO_ROOT, "desktop/main.cjs"), "utf8");
  const preload = readFileSync(resolve(REPO_ROOT, "desktop/preload.cjs"), "utf8");

  it("yalnizca 6666/6667 portlarini dinler ve yalnizca ozel adreslerden gelenleri alir", () => {
    const start = main.indexOf('ipcMain.handle("lan:tuya-broadcast"');
    expect(start).toBeGreaterThan(0);
    const block = main.slice(start, start + 2200);
    expect(block).toContain("[6666, 6667]");
    expect(block).toContain("isPrivateHost(rinfo.address)");
    expect(block).not.toMatch(/\.send\(/); // yalnizca dinler, hicbir sey gondermez
  });

  it("preload kopruyu aciga cikarir", () => {
    expect(preload).toContain(
      'tuyaBroadcast: (opts) => ipcRenderer.invoke("lan:tuya-broadcast", opts)',
    );
  });
});
