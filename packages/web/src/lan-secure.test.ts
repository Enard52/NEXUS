import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import nodeCrypto from "node:crypto";

/**
 * Tuya yerel protokolu (3.3 / 3.4) ve TP-Link Tapo (KLAP / securePassthrough) baglayicilari.
 * Cihaz tarafi bu dosyada Node crypto ile BAGIMSIZ olarak yazilmis sahte bir cihazdir (yayimlanmis protokol
 * belgelerindeki -tinytuya, python-kasa- bicime gore); bu testler paket/sifreleme biciminin kendi icinde
 * tutarli oldugunu kanitlar. GERCEK CIHAZLA DOGRULAMA DEGILDIR.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/lan-connectors.js"), "utf8");

function load(desktop: Record<string, unknown> | null) {
  const store = new Map<string, string>();
  const win: Record<string, unknown> = {
    nexusGetItem: (k: string) => store.get(k) ?? null,
    nexusSetItem: (k: string, v: string) => void store.set(k, v),
  };
  if (desktop) win.nexusDesktop = { http: () => Promise.reject(new Error("http yok")), ...desktop };
  new Function("window", "fetch", SOURCE)(win, () => Promise.reject(new Error("fetch yok")));
  return { lan: (win as { nexusLan: any }).nexusLan, store };
}
const hex = (b: ArrayLike<number>) => Buffer.from(Array.from(b)).toString("hex");
const sha256 = (...p: Buffer[]) => nodeCrypto.createHash("sha256").update(Buffer.concat(p)).digest();
const sha1 = (...p: Buffer[]) => nodeCrypto.createHash("sha1").update(Buffer.concat(p)).digest();
const u32 = (n: number) => { const b = Buffer.alloc(4); b.writeUInt32BE(n >>> 0); return b; };

describe("AES-128 ECB ve CRC32", () => {
  const { lan } = load(null);
  const { aesEcbEncrypt, aesEcbDecrypt, crc32 } = lan.internals;

  it("FIPS-197 ve NIST SP 800-38A yayimlanmis vektorleri", () => {
    const k1 = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");
    const p1 = Buffer.from("00112233445566778899aabbccddeeff", "hex");
    expect(hex(aesEcbEncrypt(k1, p1, true))).toBe("69c4e0d86a7b0430d8cdb78070b4c55a");
    // son bayt (0xff) gecerli PKCS7 payi degil: veri oldugu gibi doner
    expect(hex(aesEcbDecrypt(k1, Buffer.from("69c4e0d86a7b0430d8cdb78070b4c55a", "hex")))).toBe(hex(p1));
    const k2 = Buffer.from("2b7e151628aed2a6abf7158809cf4f3c", "hex");
    expect(hex(aesEcbEncrypt(k2, Buffer.from("6bc1bee22e409f96e93d7e117393172a", "hex"), true))).toBe("3ad77bb40d7a3660a89ecaf32466ef97");
    expect(hex(aesEcbEncrypt(k2, Buffer.from("ae2d8a571e03ac9c9eb76fac45af8e51", "hex"), true))).toBe("f5d3d58503b9699de785895a96fdbaaf");
  });

  it("Node crypto ile rastgele verilerde ayni sonucu verir (PKCS7 dahil)", () => {
    for (let i = 0; i < 25; i++) {
      const key = nodeCrypto.randomBytes(16);
      const data = nodeCrypto.randomBytes(i * 3 + 1);
      const c = nodeCrypto.createCipheriv("aes-128-ecb", key, null);
      const expected = Buffer.concat([c.update(data), c.final()]);
      const mine = aesEcbEncrypt(key, data);
      expect(hex(mine)).toBe(hex(expected));
      expect(hex(aesEcbDecrypt(key, mine))).toBe(hex(data));
    }
  });

  it("CRC-32 standart sinama degeri", () => {
    expect(crc32(Buffer.from("123456789"))).toBe(0xcbf43926);
  });
});

// ---------------------------------------------------------------- Tuya
/** tinytuya bicimli sahte Tuya cihazi (TCP oturum koprusu uzerinden). */
function fakeTuya(version: "3.3" | "3.4", localKey: string, onCmd: (cmd: number, json: any) => { cmd?: number; json?: any; retcode?: number; raw?: Buffer } | null) {
  const key = Buffer.from(localKey);
  let sessKey = key;
  const seen: { cmd: number; json: any; plainHeader: boolean }[] = [];
  const ecb = (k: Buffer, d: Buffer, pad = true) => { const c = nodeCrypto.createCipheriv("aes-128-ecb", k, null); c.setAutoPadding(pad); return Buffer.concat([c.update(d), c.final()]); };
  const dec = (k: Buffer, d: Buffer) => { const c = nodeCrypto.createDecipheriv("aes-128-ecb", k, null); return Buffer.concat([c.update(d), c.final()]); };
  const frame = (seq: number, cmd: number, payload: Buffer, k: Buffer) => {
    if (version === "3.3") {
      const pre = Buffer.concat([u32(0x55aa), u32(seq), u32(cmd), u32(payload.length + 8), payload]);
      return Buffer.concat([pre, u32(crc(pre)), u32(0xaa55)]);
    }
    const pre = Buffer.concat([u32(0x55aa), u32(seq), u32(cmd), u32(payload.length + 36), payload]);
    return Buffer.concat([pre, nodeCrypto.createHmac("sha256", k).update(pre).digest(), u32(0xaa55)]);
  };
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

  const bridge = {
    open: async () => { sessKey = key; return 1; }, // her TCP baglantisi yeni oturum
    close: async () => true,
    exchange: async (o: { bytes: number[]; untilCmd?: number[]; noReply?: boolean }) => {
      const buf = Buffer.from(o.bytes);
      expect(buf.readUInt32BE(0)).toBe(0x55aa);
      const seq = buf.readUInt32BE(4), cmd = buf.readUInt32BE(8), len = buf.readUInt32BE(12);
      expect(16 + len).toBe(buf.length);
      expect(buf.readUInt32BE(buf.length - 4)).toBe(0xaa55);
      let body: Buffer;
      if (version === "3.3") {
        expect(crc(buf.subarray(0, buf.length - 8))).toBe(buf.readUInt32BE(buf.length - 8));
        body = buf.subarray(16, buf.length - 8);
      } else {
        const mac = nodeCrypto.createHmac("sha256", sessKey).update(buf.subarray(0, buf.length - 36)).digest();
        expect(hex(mac)).toBe(hex(buf.subarray(buf.length - 36, buf.length - 4)));
        body = buf.subarray(16, buf.length - 36);
      }
      let plainHeader = false;
      if (version === "3.3" && body.subarray(0, 3).toString() === "3.3") { plainHeader = true; body = body.subarray(15); }
      let plain = dec(sessKey, body);
      if (version === "3.4" && plain.subarray(0, 3).toString() === "3.4") { plainHeader = true; plain = plain.subarray(15); }
      // 3.4 oturum anahtari el sikismasi
      if (cmd === 3) {
        const remoteNonce = nodeCrypto.randomBytes(16);
        const resp = ecb(key, Buffer.concat([remoteNonce, nodeCrypto.createHmac("sha256", key).update(plain).digest()]));
        const x = Buffer.alloc(16);
        for (let i = 0; i < 16; i++) x[i] = plain[i] ^ remoteNonce[i];
        (bridge as any)._pending = ecb(key, x, false);
        (bridge as any)._remote = remoteNonce;
        return Array.from(frame(seq, 4, Buffer.concat([u32(0), resp]), key));
      }
      if (cmd === 5) {
        expect(hex(plain.subarray(0, 32))).toBe(hex(nodeCrypto.createHmac("sha256", key).update((bridge as any)._remote).digest()));
        sessKey = (bridge as any)._pending;
        return [];
      }
      const json = JSON.parse(plain.toString("utf8"));
      seen.push({ cmd, json, plainHeader });
      const reply = onCmd(cmd, json);
      if (!reply) throw new Error("zaman asimi");
      const out = reply.raw ?? ecb(sessKey, Buffer.from(JSON.stringify(reply.json ?? {})));
      const payload = Buffer.concat([u32(reply.retcode ?? 0), reply.json || reply.raw ? out : Buffer.alloc(0)]);
      return Array.from(frame(seq, reply.cmd ?? cmd, payload, sessKey));
    },
  };
  return { bridge, seen };
}

const tuyaDev = { id: "lan-tuya-1", host: "http://192.168.1.60", protocol: "tuya-local" };
const KEY = "0123456789abcdef";

describe("Tuya 3.3", () => {
  it("DP sorgusu ve komut: paket bicimi, sifreleme ve yanit cozumu", async () => {
    let state = { "20": false, "22": 500, "24": "000003e803e8", "21": "white" } as Record<string, unknown>;
    const fake = fakeTuya("3.3", KEY, (cmd, json) => {
      if (cmd === 10) return { json: { dps: state } };
      if (cmd === 7) { state = { ...state, ...json.dps }; return { cmd: 7 }; }
      return null;
    });
    const { lan } = load({ binaryHttp: true, tcpSession: fake.bridge });
    const found = await lan.tuya.verify("192.168.1.60", { id: "bf1234567890", key: KEY, version: "3.3" });
    expect(found.kind).toBe("light");
    expect(found.caps).toEqual(["switch", "brightness", "color"]);
    expect(found.secret.tuyaKey).toBe(KEY);
    expect(fake.seen[0]).toMatchObject({ cmd: 10, json: { gwId: "bf1234567890", devId: "bf1234567890" }, plainHeader: false });

    lan.secrets.set(tuyaDev.id, found.secret);
    expect(lan.supports(tuyaDev, "switch")).toBe(true);
    expect(await lan.protocolFor("tuya-local").read(tuyaDev)).toEqual({ switch: false, brightness: 50 });
    await lan.write(tuyaDev, "switch", true);
    expect(fake.seen.at(-1)).toMatchObject({ cmd: 7, plainHeader: true });
    expect(fake.seen.at(-1)!.json.dps).toEqual({ "20": true });
    await lan.write(tuyaDev, "brightness", 80);
    expect(fake.seen.at(-1)!.json.dps).toEqual({ "22": 800 });
    await lan.write(tuyaDev, "color", "#ff0000");
    expect(fake.seen.at(-1)!.json.dps).toEqual({ "21": "colour", "24": "000003e803e8" });
    expect(state["20"]).toBe(true);
  });

  it("eski tip A ampul (DP 1-5): parlaklik 25-255, renk rrggbbhhhhssvv", async () => {
    let state = { "1": true, "2": "white", "3": 255, "5": "ff0000000000ff" } as Record<string, unknown>;
    const fake = fakeTuya("3.3", KEY, (cmd, json) => {
      if (cmd === 10) return { json: { dps: state } };
      if (cmd === 7) { state = { ...state, ...json.dps }; return { cmd: 7 }; }
      return null;
    });
    const { lan } = load({ binaryHttp: true, tcpSession: fake.bridge });
    const found = await lan.tuya.verify("192.168.1.65", { id: "bulbA", key: KEY, version: "3.3" });
    expect(found.kind).toBe("light");
    expect(found.caps).toEqual(["switch", "brightness", "color"]);
    lan.secrets.set(tuyaDev.id, found.secret);
    expect((await lan.protocolFor("tuya-local").read(tuyaDev)).brightness).toBe(100);
    await lan.write(tuyaDev, "brightness", 50);
    expect(fake.seen.at(-1)!.json.dps).toEqual({ "3": 128 });
    await lan.write(tuyaDev, "brightness", 1);
    expect(fake.seen.at(-1)!.json.dps).toEqual({ "3": 25 });
    await lan.write(tuyaDev, "color", "#ff0000");
    expect(fake.seen.at(-1)!.json.dps).toEqual({ "2": "colour", "5": "ff00000000ffff" });
  });

  it("sayfadan gelen http:// onekli adres cozulur", async () => {
    const fake = fakeTuya("3.3", KEY, () => ({ json: { dps: { "1": true } } }));
    const { lan } = load({ binaryHttp: true, tcpSession: fake.bridge });
    const found = await lan.tuya.verify("http://192.168.1.60", { id: "x", key: KEY, version: "3.3" });
    expect(found.host).toBe("192.168.1.60");
  });

  it("priz: yalniz anahtar noktasi bulunursa yetenek eklenir", async () => {
    const fake = fakeTuya("3.3", KEY, () => ({ json: { dps: { "1": true, "9": 0 } } }));
    const { lan } = load({ binaryHttp: true, tcpSession: fake.bridge });
    const found = await lan.tuya.verify("192.168.1.61", { id: "x", key: KEY, version: "3.3" });
    expect(found.kind).toBe("plug");
    expect(found.caps).toEqual(["switch"]);
  });

  it("yanlis yerel anahtar sahte basari vermez", async () => {
    const fake = fakeTuya("3.3", KEY, () => ({ json: { dps: { "1": true } } }));
    const { lan } = load({ binaryHttp: true, tcpSession: fake.bridge });
    await expect(lan.tuya.verify("192.168.1.61", { id: "x", key: "fedcba9876543210", version: "3.3" })).rejects.toBeTruthy();
  });

  it("cihaz yanit vermezse hata doner", async () => {
    const fake = fakeTuya("3.3", KEY, () => null);
    const { lan } = load({ binaryHttp: true, tcpSession: fake.bridge });
    await expect(lan.tuya.verify("192.168.1.62", { id: "x", key: KEY, version: "3.3" })).rejects.toThrow("zaman asimi");
  });
});

describe("Tuya 3.4", () => {
  it("oturum anahtari el sikismasi ve HMAC'li komut", async () => {
    let on = false;
    const fake = fakeTuya("3.4", KEY, (cmd, json) => {
      if (cmd === 16) return { json: { dps: { "1": on } } };
      if (cmd === 13) { on = json.data.dps["1"]; return { cmd: 13 }; }
      return null;
    });
    const { lan } = load({ binaryHttp: true, tcpSession: fake.bridge });
    const found = await lan.tuya.verify("192.168.1.63", { id: "dev34", key: KEY, version: "3.4" });
    expect(found.kind).toBe("plug");
    expect(fake.seen.find((s) => s.cmd === 16)!.json).toEqual({});
    lan.secrets.set(tuyaDev.id, found.secret);
    await lan.write(tuyaDev, "switch", true);
    expect(on).toBe(true);
    expect(fake.seen.at(-1)).toMatchObject({ cmd: 13, plainHeader: true });
    expect(fake.seen.at(-1)!.json).toMatchObject({ protocol: 5, data: { devId: "dev34", dps: { "1": true } } });
    expect((await lan.protocolFor("tuya-local").read(tuyaDev)).switch).toBe(true);
  });

  it("3.5 gibi desteklenmeyen surum acik hata verir", async () => {
    const fake = fakeTuya("3.3", KEY, () => null);
    const { lan } = load({ binaryHttp: true, tcpSession: fake.bridge });
    await expect(lan.tuya.verify("192.168.1.64", { id: "x", key: KEY, version: "3.5" })).rejects.toThrow("3.5");
  });
});

describe("Tuya kosullari", () => {
  it("TCP oturum koprusu yoksa baglayici etkinlesmez", async () => {
    const { lan } = load({});
    expect(lan.supports(tuyaDev, "switch")).toBe(false);
    await expect(lan.tuya.verify("192.168.1.60", { id: "x", key: KEY, version: "3.3" })).rejects.toBeTruthy();
    await expect(lan.identify("192.168.1.60")).rejects.toBeTruthy();
  });

  it("yerel anahtar kayitli degilse okuma/yazma reddedilir", async () => {
    const fake = fakeTuya("3.3", KEY, () => ({ json: { dps: { "1": true } } }));
    const { lan } = load({ binaryHttp: true, tcpSession: fake.bridge });
    await expect(lan.write({ ...tuyaDev, id: "yok" }, "switch", true)).rejects.toThrow("yerel anahtar");
    expect(fake.seen).toHaveLength(0);
  });

  it("yerel olmayan adrese gitmez", async () => {
    const fake = fakeTuya("3.3", KEY, () => ({ json: { dps: { "1": true } } }));
    const { lan } = load({ binaryHttp: true, tcpSession: fake.bridge });
    await expect(lan.tuya.verify("8.8.8.8", { id: "x", key: KEY, version: "3.3" })).rejects.toBeTruthy();
    expect(fake.seen).toHaveLength(0);
  });

  it("gizli bilgi yalnizca nexusLanSecrets deposunda tutulur", async () => {
    const fake = fakeTuya("3.3", KEY, () => ({ json: { dps: { "1": true } } }));
    const { lan, store } = load({ binaryHttp: true, tcpSession: fake.bridge });
    const found = await lan.tuya.verify("192.168.1.60", { id: "x", key: KEY, version: "3.3" });
    lan.secrets.set("a", found.secret);
    expect([...store.keys()]).toEqual(["nexusLanSecrets"]);
  });
});

// ---------------------------------------------------------------- Tapo KLAP
const USER = "kisi@example.com", PASS = "Sifre-123";
function fakeKlap(user: string, pass: string, state: { on: boolean; brightness: number }) {
  const auth = sha256(sha1(Buffer.from(user)), sha1(Buffer.from(pass)));
  let localSeed = Buffer.alloc(0), remoteSeed = Buffer.alloc(0);
  let key = Buffer.alloc(0), iv = Buffer.alloc(0), sig = Buffer.alloc(0), seq = 0;
  const log: { path: string; cookie?: string }[] = [];
  const http = async (o: any) => {
    const path = new URL(o.url).pathname + new URL(o.url).search;
    log.push({ path, cookie: o.headers?.Cookie });
    expect(o.binary).toBe(true);
    const body = Buffer.from(o.bodyBytes || []);
    if (path === "/app/handshake1") {
      localSeed = body; remoteSeed = nodeCrypto.randomBytes(16);
      return { status: 200, bytes: Array.from(Buffer.concat([remoteSeed, sha256(localSeed, remoteSeed, auth)])), headers: { "set-cookie": ["TP_SESSIONID=ABC123;TIMEOUT=86400"] } };
    }
    if (path === "/app/handshake2") {
      if (o.headers.Cookie !== "TP_SESSIONID=ABC123") return { status: 403, bytes: [], headers: {} };
      if (hex(body) !== hex(sha256(remoteSeed, localSeed, auth))) return { status: 403, bytes: [], headers: {} };
      const base = Buffer.concat([localSeed, remoteSeed, auth]);
      key = sha256(Buffer.from("lsk"), base).subarray(0, 16);
      const ivSeq = sha256(Buffer.from("iv"), base);
      iv = ivSeq.subarray(0, 12); seq = ivSeq.readInt32BE(28);
      sig = sha256(Buffer.from("ldk"), base).subarray(0, 28);
      return { status: 200, bytes: [], headers: {} };
    }
    if (path.startsWith("/app/request?seq=")) {
      if (o.headers.Cookie !== "TP_SESSIONID=ABC123") return { status: 403, bytes: [], headers: {} };
      const reqSeq = Number(path.split("=")[1]);
      expect(reqSeq).toBe(++seq | 0);
      const sb = Buffer.alloc(4); sb.writeInt32BE(reqSeq);
      expect(hex(body.subarray(0, 32))).toBe(hex(sha256(sig, sb, body.subarray(32))));
      const d = nodeCrypto.createDecipheriv("aes-128-cbc", key, Buffer.concat([iv, sb]));
      const req = JSON.parse(Buffer.concat([d.update(body.subarray(32)), d.final()]).toString());
      let result: any = {};
      if (req.method === "get_device_info") result = { device_on: state.on, brightness: state.brightness, model: "L530", type: "SMART.TAPOBULB", hue: 10, saturation: 20, nickname: Buffer.from("Salon").toString("base64") };
      if (req.method === "set_device_info") { if ("device_on" in req.params) state.on = req.params.device_on; if ("brightness" in req.params) state.brightness = req.params.brightness; (http as any).last = req.params; }
      const c = nodeCrypto.createCipheriv("aes-128-cbc", key, Buffer.concat([iv, sb]));
      const enc = Buffer.concat([c.update(JSON.stringify({ error_code: 0, result })), c.final()]);
      return { status: 200, bytes: Array.from(Buffer.concat([sha256(sig, sb, enc), enc])), headers: {} };
    }
    return { status: 404, bytes: [], headers: {} };
  };
  return { http, log };
}
const tapoDev = { id: "lan-tapo-1", host: "http://192.168.1.70", protocol: "tapo" };

describe("Tapo KLAP", () => {
  it("el sikisma, imzali istek, cerez ve okuma/yazma", async () => {
    const state = { on: false, brightness: 30 };
    const fake = fakeKlap(USER, PASS, state);
    const { lan, store } = load({ binaryHttp: true, http: fake.http });
    const found = await lan.tapo.verify("192.168.1.70", USER, PASS);
    expect(found).toMatchObject({ protocol: "tapo", model: "Tapo L530", name: "Salon", kind: "light", caps: ["switch", "brightness", "color"] });
    expect(fake.log.map((l) => l.path.split("?")[0])).toEqual(["/app/handshake1", "/app/handshake2", "/app/request"]);
    expect(fake.log[1].cookie).toBe("TP_SESSIONID=ABC123");

    lan.secrets.set(tapoDev.id, found.secret);
    expect(lan.supports(tapoDev, "switch")).toBe(true);
    expect(await lan.protocolFor("tapo").read(tapoDev)).toEqual({ switch: false, brightness: 30 });
    await lan.write(tapoDev, "switch", true);
    expect(state.on).toBe(true);
    await lan.write(tapoDev, "brightness", 70);
    expect(state.brightness).toBe(70);
    await lan.write(tapoDev, "color", "#ff0000");
    expect((fake.http as any).last).toEqual({ hue: 0, saturation: 100, color_temp: 0 });
    // tek el sikisma, art arda istekler ayni oturumu kullanir
    expect(fake.log.filter((l) => l.path === "/app/handshake1")).toHaveLength(1);
    expect(store.get("nexusLanSecrets")).toContain(PASS); // yalniz yerel depoda
  });

  it("yanlis sifre auth hatasi verir, hicbir istek gonderilmez", async () => {
    const fake = fakeKlap(USER, PASS, { on: false, brightness: 1 });
    const { lan } = load({ binaryHttp: true, http: fake.http });
    await expect(lan.tapo.verify("192.168.1.70", USER, "yanlis")).rejects.toMatchObject({ code: "auth" });
    expect(fake.log.map((l) => l.path)).toEqual(["/app/handshake1"]);
  });

  it("hesap bilgisi kayitli degilse yazma reddedilir", async () => {
    const fake = fakeKlap(USER, PASS, { on: false, brightness: 1 });
    const { lan } = load({ binaryHttp: true, http: fake.http });
    await expect(lan.write({ ...tapoDev, id: "yok" }, "switch", true)).rejects.toThrow("hesap bilgisi");
    expect(fake.log).toHaveLength(0);
  });

  it("ikili HTTP koprusu yoksa (telefon/tarayici) etkinlesmez ve tanima sahte basari vermez", async () => {
    const { lan } = load({});
    expect(lan.supports(tapoDev, "switch")).toBe(false);
    await expect(lan.identify("192.168.1.70")).rejects.toBeTruthy();
    await expect(lan.write(tapoDev, "switch", true)).rejects.toBeTruthy();
  });

  it("KLAP el sikismasina yanit veren cihaz Tapo olarak taninir", async () => {
    const fake = fakeKlap(USER, PASS, { on: false, brightness: 1 });
    const { lan } = load({ binaryHttp: true, http: fake.http });
    const found = await lan.identify("192.168.1.70");
    expect(found).toMatchObject({ protocol: "tapo", needsCredentials: true, caps: ["switch"] });
  });

  it("anahtar turetme: python-kasa sirasi (lsk / iv / ldk)", async () => {
    const { lan } = load(null);
    const ls = Buffer.alloc(16, 1), rs = Buffer.alloc(16, 2), auth = Buffer.alloc(32, 3);
    const k = await lan.internals.klapDerive(ls, rs, auth);
    const base = Buffer.concat([ls, rs, auth]);
    expect(hex(k.key)).toBe(hex(sha256(Buffer.from("lsk"), base).subarray(0, 16)));
    expect(hex(k.iv)).toBe(hex(sha256(Buffer.from("iv"), base).subarray(0, 12)));
    expect(k.seq).toBe(sha256(Buffer.from("iv"), base).readInt32BE(28));
    expect(hex(k.sig)).toBe(hex(sha256(Buffer.from("ldk"), base).subarray(0, 28)));
    expect(hex(await lan.internals.klapAuthHash({ user: "a", pass: "b" }))).toBe(hex(sha256(sha1(Buffer.from("a")), sha1(Buffer.from("b")))));
  });
});

// ---------------------------------------------------------------- Tapo securePassthrough
function fakePassthrough(user: string, pass: string, state: { on: boolean }) {
  let key = Buffer.alloc(0), iv = Buffer.alloc(0);
  const token = "TOKEN42";
  const http = async (o: any) => {
    const u = new URL(o.url);
    if (u.pathname === "/app/handshake1") return { status: 404, bytes: [], headers: {} };
    const body = JSON.parse(Buffer.from(o.bodyBytes).toString());
    const json = (j: any, headers: any = {}) => ({ status: 200, bytes: Array.from(Buffer.from(JSON.stringify(j))), headers });
    if (body.method === "handshake") {
      key = nodeCrypto.randomBytes(16); iv = nodeCrypto.randomBytes(16);
      const enc = nodeCrypto.publicEncrypt({ key: body.params.key, padding: nodeCrypto.constants.RSA_PKCS1_PADDING }, Buffer.concat([key, iv]));
      return json({ error_code: 0, result: { key: enc.toString("base64") } }, { "set-cookie": "TP_SESSIONID=PT1;TIMEOUT=1440" });
    }
    expect(o.headers.Cookie).toBe("TP_SESSIONID=PT1");
    const d = nodeCrypto.createDecipheriv("aes-128-cbc", key, iv);
    const inner = JSON.parse(Buffer.concat([d.update(Buffer.from(body.params.request, "base64")), d.final()]).toString());
    const reply = (j: any) => { const c = nodeCrypto.createCipheriv("aes-128-cbc", key, iv); return json({ error_code: 0, result: { response: Buffer.concat([c.update(JSON.stringify(j)), c.final()]).toString("base64") } }); };
    if (inner.method === "login_device") {
      const okUser = Buffer.from(sha1(Buffer.from(user)).toString("hex")).toString("base64");
      if (inner.params.username !== okUser || inner.params.password !== Buffer.from(pass).toString("base64")) return reply({ error_code: -1501 });
      return reply({ error_code: 0, result: { token } });
    }
    expect(u.searchParams.get("token")).toBe(token);
    if (inner.method === "get_device_info") return reply({ error_code: 0, result: { device_on: state.on, model: "P100", type: "SMART.TAPOPLUG", nickname: Buffer.from("Priz").toString("base64") } });
    if (inner.method === "set_device_info") { state.on = inner.params.device_on; return reply({ error_code: 0, result: {} }); }
    return reply({ error_code: -1 });
  };
  return { http };
}

describe("Tapo securePassthrough (eski yazilim)", () => {
  it("RSA el sikismasi, giris, jetonlu istekler", async () => {
    const state = { on: false };
    const fake = fakePassthrough(USER, PASS, state);
    const { lan } = load({ binaryHttp: true, http: fake.http });
    const found = await lan.tapo.verify("192.168.1.71", USER, PASS);
    expect(found).toMatchObject({ kind: "plug", name: "Priz", caps: ["switch"] });
    const dev = { id: "lan-tapo-2", host: "http://192.168.1.71", protocol: "tapo" };
    lan.secrets.set(dev.id, found.secret);
    await lan.write(dev, "switch", true);
    expect(state.on).toBe(true);
    expect((await lan.protocolFor("tapo").read(dev)).switch).toBe(true);
  });

  it("yanlis sifre auth hatasi", async () => {
    const fake = fakePassthrough(USER, PASS, { on: false });
    const { lan } = load({ binaryHttp: true, http: fake.http });
    await expect(lan.tapo.verify("192.168.1.71", USER, "yanlis")).rejects.toMatchObject({ code: "auth" });
  });
});
