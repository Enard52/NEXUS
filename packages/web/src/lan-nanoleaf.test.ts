import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Nanoleaf Open API (port 16021) paket/yanıt biçimi testleri. Gerçek donanımla doğrulanmadı;
 * sahte fetch ile yalnızca belgelenmiş istek ve yanıt biçimleri sınanır.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/lan-connectors.js"), "utf8");

type Res = { status: number; text: () => Promise<string> };
type Fetch = (url: string, init?: any) => Promise<Res>;

function load(fetchImpl: Fetch) {
  const win: Record<string, unknown> = {};
  new Function("window", "fetch", SOURCE)(win, fetchImpl);
  return (win as { nexusLan: any }).nexusLan;
}
const ok = (body: unknown) => ({ status: 200, text: () => Promise.resolve(JSON.stringify(body)) });
const status = (s: number) => ({ status: s, text: () => Promise.resolve("") });

const INFO = {
  name: "Shapes A1B2",
  model: "NL42",
  manufacturer: "Nanoleaf",
  state: {
    on: { value: true },
    brightness: { value: 40, max: 100, min: 0 },
    hue: { value: 120, max: 360, min: 0 },
    sat: { value: 50, max: 100, min: 0 },
    ct: { value: 4000, max: 6500, min: 1200 },
    colorMode: "ct",
  },
};
const BARE = { id: "nl1", host: "192.168.1.60", protocol: "nanoleaf" };
// lanSecret: eşleştirme doğrulamasında kullanılan bellek içi yol (secretsFor); gerçek akışta token nexusLan.secrets içindedir.
const DEV = { ...BARE, lanSecret: { nanoleafToken: "TOKEN123" } };

function paired(fetchImpl: Fetch) {
  return load(fetchImpl);
}

describe("Nanoleaf bağlayıcısı", () => {
  it("eşleştirme: POST /api/v1/new ve auth_token döner", async () => {
    const calls: any[] = [];
    const lan = load((url, init) => {
      calls.push({ url, method: init?.method });
      return Promise.resolve(ok({ auth_token: "abc" }));
    });
    const nl = lan.protocols.find((p: any) => p.id === "nanoleaf");
    expect(await nl.pair("192.168.1.60")).toBe("abc");
    expect(calls[0]).toEqual({ url: "http://192.168.1.60:16021/api/v1/new", method: "POST" });
  });

  it("eşleştirme modunda değilse (403) dürüst hata verir", async () => {
    const lan = load(() => Promise.resolve(status(403)));
    const nl = lan.protocols.find((p: any) => p.id === "nanoleaf");
    await expect(nl.pair("192.168.1.60")).rejects.toThrow(/5–7 sn/);
  });

  it("token yokken okuma/yazma eşleştirme gerektiğini söyler, istek atmaz", async () => {
    let n = 0;
    const lan = load(() => {
      n++;
      return Promise.resolve(ok({}));
    });
    await expect(lan.read(BARE)).rejects.toThrow(/eşleştirme/);
    await expect(lan.write(BARE, "switch", true)).rejects.toThrow(/eşleştirme/);
    expect(n).toBe(0);
  });

  it("keşifte denenmez (token olmadan tanınamaz)", async () => {
    const lan = load(() => Promise.resolve(ok(INFO)));
    await expect(lan.identify("192.168.1.60")).rejects.toThrow();
  });

  it("token ile okur: açık/kapalı, parlaklık ve ct modunda Kelvin", async () => {
    const urls: string[] = [];
    const lan = paired((url) => {
      urls.push(url);
      return Promise.resolve(ok(INFO));
    });
    const s = await lan.read(DEV);
    expect(urls[0]).toBe("http://192.168.1.60:16021/api/v1/TOKEN123/");
    expect(s).toEqual({ switch: true, brightness: 40, colorTemp: 4000 });
  });

  it("geçersiz token (401) yeniden eşleştirme ister", async () => {
    const lan = paired(() => Promise.resolve(status(401)));
    await expect(lan.read(DEV)).rejects.toThrow(/geçersiz/);
  });

  it("yazma gövdeleri belgelenmiş biçimde: PUT /state", async () => {
    const sent: any[] = [];
    const lan = paired((url, init) => {
      sent.push({ url, method: init?.method, body: JSON.parse(init?.body) });
      return Promise.resolve(status(204));
    });
    await lan.write(DEV, "switch", false);
    await lan.write(DEV, "brightness", 140);
    await lan.write(DEV, "colorTemp", 4000);
    await lan.write(DEV, "color", "#00ff00");
    expect(sent.every((c) => c.url === "http://192.168.1.60:16021/api/v1/TOKEN123/state")).toBe(
      true,
    );
    expect(sent.every((c) => c.method === "PUT")).toBe(true);
    expect(sent[0].body).toEqual({ on: { value: false } });
    expect(sent[1].body).toEqual({ brightness: { value: 100 } });
    expect(sent[2].body).toEqual({ ct: { value: 4000 } });
    expect(sent[3].body).toEqual({ on: { value: true }, hue: { value: 120 }, sat: { value: 100 } });
    // community client (aionanoleaf) notes that "on" must be the last key of the state body
    expect(Object.keys(sent[3].body).pop()).toBe("on");
  });

  it("colorTemp is clamped to the 1200–6500 K range reported by the device, not 2000", async () => {
    const sent: any[] = [];
    const lan = paired((_url, init) => {
      sent.push(JSON.parse(init?.body));
      return Promise.resolve(status(204));
    });
    await lan.write(DEV, "colorTemp", 1200);
    await lan.write(DEV, "colorTemp", 100);
    await lan.write(DEV, "colorTemp", 9000);
    expect(sent).toEqual([
      { ct: { value: 1200 } },
      { ct: { value: 1200 } },
      { ct: { value: 6500 } },
    ]);
  });

  it("desteklenmeyen işlevi dürüstçe reddeder", async () => {
    const lan = paired(() => Promise.resolve(status(204)));
    await expect(lan.write(DEV, "position", 50)).rejects.toThrow(/desteklenmeyen/);
  });
});
