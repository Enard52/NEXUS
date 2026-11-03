import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Matter baglayicisi: deger donusumleri, kod bicimi, kopru cagrilari ve kayit bicimi. Masaustu koprusu
 * (desktop/matter-bridge.cjs) matter.js'in sanal kademeli isigiyla elle denendi (eslestirme, ac/kapa, parlaklik, durum, kaldirma);
 * renk ve renk sicakligi komutlari yalnizca bicim olarak sinanir, hicbir cihazla denenmedi.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/lan-connectors.js"), "utf8");
const require = createRequire(import.meta.url);
const bridgeModule = require(resolve(REPO_ROOT, "desktop/matter-bridge.cjs"));

function load(matter: Record<string, unknown> | null) {
  const win: Record<string, unknown> = { nexusGetItem: () => null, nexusSetItem: () => undefined };
  if (matter) win.nexusDesktop = { http: () => Promise.reject(new Error("http yok")), matter };
  new Function("window", "fetch", SOURCE)(win, () => Promise.reject(new Error("fetch yok")));
  return (win as { nexusLan: any }).nexusLan;
}

describe("Matter kodu ve donusumler", () => {
  const { internals, matterCode } = load(null);

  it("elle kod: 11/21 hane, tire ve bosluk serbest; MT: QR icerigi buyuk harfe cevrilir; digerleri reddedilir", () => {
    expect(matterCode("3497-011-2332")).toBe("34970112332");
    expect(matterCode(" 3497 0112 332 ")).toBe("34970112332");
    expect(matterCode("mt:y.k90afn00ka0648g00")).toBe("MT:Y.K90AFN00KA0648G00");
    expect(matterCode("1234")).toBeNull();
    expect(matterCode("12345678901234567890")).toBeNull(); // 20 hane
    expect(matterCode("abcdefghijk")).toBeNull();
    expect(matterCode("")).toBeNull();
  });

  it("parlaklik: yuzde 1-254 seviyeye, seviye yuzdeye", () => {
    expect(internals.matterPercentToLevel(0)).toBe(1); // 0 seviyesi Matter'da gecersiz: en az 1
    expect(internals.matterPercentToLevel(50)).toBe(127);
    expect(internals.matterPercentToLevel(100)).toBe(254);
    expect(internals.matterPercentToLevel(150)).toBe(254);
    expect(internals.matterLevelToPercent(127)).toBe(50);
    expect(internals.matterLevelToPercent(254)).toBe(100);
  });

  it("renk: hex'ten ton/doygunluk (0-254); renk sicakligi: Kelvin'den mired (153-500 araliginda)", () => {
    expect(internals.matterHueSat("#ff0000")).toEqual({ hue: 0, saturation: 254 });
    expect(internals.matterHueSat("#ffffff").saturation).toBe(0);
    const green = internals.matterHueSat("#00ff00");
    expect(green.hue).toBe(Math.round(254 / 3));
    expect(internals.matterMireds(4000)).toBe(250);
    expect(internals.matterMireds(1000)).toBe(500);
    expect(internals.matterMireds(10000)).toBe(153);
  });
});

describe("Matter baglayicisi (kopru)", () => {
  const device = {
    host: "matter-peer1.local",
    protocol: "matter",
    matterNode: "peer1",
    endpointId: 1,
  };

  it("kopru yoksa protokol kullanilamaz, eslestirme masaustu ister", async () => {
    const lan = load(null);
    expect(lan.supports(device, "switch")).toBe(false);
    await expect(lan.matter.commission("34970112332")).rejects.toThrow(/masaüstü/);
    await expect(lan.write(device, "switch", true)).rejects.toThrow();
  });

  it("eslestirme: her bolum ayri cihaz kaydi, benzersiz host, node ve bolum numarasi tasir", async () => {
    const lan = load({
      commission: (o: any) => {
        expect(o).toEqual({ pairingCode: "34970112332" });
        return Promise.resolve({
          peerId: "peer7",
          name: "Salon",
          model: "Isik",
          endpoints: [
            { endpoint: 1, kind: "light", caps: ["switch", "brightness"] },
            { endpoint: 2, kind: "plug", caps: ["switch"] },
          ],
        });
      },
    });
    const records = await lan.matter.commission("34970112332");
    expect(records).toEqual([
      {
        host: "matter-peer7.local",
        protocol: "matter",
        name: "Salon · 1",
        model: "Isik",
        kind: "light",
        caps: ["switch", "brightness"],
        endpointId: 1,
        matterNode: "peer7",
      },
      {
        host: "matter-peer7.local",
        protocol: "matter",
        name: "Salon · 2",
        model: "Isik",
        kind: "plug",
        caps: ["switch"],
        endpointId: 2,
        matterNode: "peer7",
      },
    ]);
  });

  it("tek bolumlu cihazda ada numara eklenmez", async () => {
    const lan = load({
      commission: () =>
        Promise.resolve({
          peerId: "p",
          name: "Lamba",
          model: "M",
          endpoints: [{ endpoint: 1, kind: "light", caps: ["switch"] }],
        }),
    });
    expect((await lan.matter.commission("34970112332"))[0].name).toBe("Lamba");
  });

  it("yazma: komutlar Matter birimlerine cevrilir ve dogru eş/bolume gider", async () => {
    const sent: any[] = [];
    const lan = load({
      commission: () => Promise.reject(new Error("x")),
      write: (o: any) => (sent.push(o), Promise.resolve({ ok: true })),
    });
    await lan.write(device, "switch", true);
    await lan.write(device, "switch", false);
    await lan.write(device, "brightness", 50);
    await lan.write(device, "color", "#ff0000");
    await lan.write(device, "colorTemp", 4000);
    expect(sent).toEqual([
      { peerId: "peer1", endpoint: 1, action: "on" },
      { peerId: "peer1", endpoint: 1, action: "off" },
      { peerId: "peer1", endpoint: 1, action: "level", level: 127 },
      { peerId: "peer1", endpoint: 1, action: "hueSat", hue: 0, saturation: 254 },
      { peerId: "peer1", endpoint: 1, action: "colorTemp", mireds: 250 },
    ]);
    await expect(lan.write(device, "volume", 3)).rejects.toThrow();
  });

  it("okuma: ham Matter durumu NEXUS alanlarina cevrilir; renk sicakligi yalnizca renk sicakligi kipinde", async () => {
    let state: any = { onOff: true, currentLevel: 127, colorMode: 2, colorTemperatureMireds: 250 };
    const lan = load({
      commission: () => Promise.reject(new Error("x")),
      read: () => Promise.resolve(state),
    });
    expect(await lan.read(device)).toEqual({ switch: true, brightness: 50, colorTemp: 4000 });
    state = { onOff: false, currentLevel: null, colorMode: 0, colorTemperatureMireds: 250 };
    expect(await lan.read(device)).toEqual({ switch: false });
  });

  it("eslesme bilgisi olmayan kayit icin acik hata verir", async () => {
    const lan = load({
      commission: () => Promise.reject(new Error("x")),
      read: () => Promise.resolve({}),
    });
    await expect(
      lan.read({ host: "matter-x.local", protocol: "matter", endpointId: 1 }),
    ).rejects.toThrow(/kayıtlı değil/);
  });

  it("kaldirma: eşin kimligini koprüye iletir; eşi olmayan kayit sessizce gecer", async () => {
    const removed: any[] = [];
    const lan = load({
      commission: () => Promise.reject(new Error("x")),
      remove: (o: any) => (removed.push(o), Promise.resolve({ ok: true })),
    });
    await lan.matter.remove(device);
    await lan.matter.remove({ host: "h", protocol: "matter" });
    expect(removed).toEqual([{ peerId: "peer1" }]);
  });

  it("protokol kayitli, kesfe dahil degil ve eslestirme kodu olmadan tanimaz", async () => {
    const lan = load({ commission: () => Promise.reject(new Error("x")) });
    const p = lan.protocolFor("matter");
    expect(p.discoverable).toBe(false);
    await expect(p.probe({ host: "192.168.1.5" })).rejects.toThrow();
    expect(lan.supports(device, "brightness")).toBe(true);
  });
});

describe("masaustu Matter koprusu", () => {
  it("kod dogrulama: koprü de 11/21 hane ve MT: kabul eder", () => {
    const n = bridgeModule.normalizePairingCode;
    expect(n("3497-011-2332")).toBe("34970112332");
    expect(n("MT:Y.K90AFN00KA0648G00")).toBe("MT:Y.K90AFN00KA0648G00");
    expect(n("123")).toBeNull();
    expect(n("1234567890a")).toBeNull();
  });

  it("tur ve yetenek cikarimi", () => {
    const { kindOf, capsOf } = bridgeModule;
    expect(kindOf([0x010d], false)).toBe("light");
    expect(kindOf([0x010a], false)).toBe("plug");
    expect(kindOf([0x0103], false)).toBe("switch");
    expect(kindOf([0x0103], true)).toBe("light"); // seviye kontrolü olan bilinmeyen tür ışık sayılır
    expect(capsOf({ onOff: true }, null)).toEqual(["switch"]);
    expect(capsOf({ onOff: true, levelControl: true }, null)).toEqual(["switch", "brightness"]);
    expect(
      capsOf(
        { onOff: true, levelControl: true, colorControl: true },
        { hueSaturation: true, colorTemperature: true },
      ),
    ).toEqual(["switch", "brightness", "color", "colorTemp"]);
    expect(
      capsOf({ onOff: true, colorControl: true }, { hueSaturation: false, colorTemperature: true }),
    ).toEqual(["switch", "colorTemp"]);
  });

  it("ana surec ve preload Matter uclarini acar; paket dosyasi listede", () => {
    const main = readFileSync(resolve(REPO_ROOT, "desktop/main.cjs"), "utf8");
    const preload = readFileSync(resolve(REPO_ROOT, "desktop/preload.cjs"), "utf8");
    const pkg = JSON.parse(readFileSync(resolve(REPO_ROOT, "desktop/package.json"), "utf8"));
    for (const name of ["commission", "list", "read", "write", "remove"]) {
      expect(main).toContain(`ipcMain.handle("lan:matter-${name}"`);
      expect(preload).toContain(`ipcRenderer.invoke("lan:matter-${name}"`);
    }
    expect(pkg.build.files).toContain("matter-bridge.cjs");
    expect(Object.keys(pkg.dependencies)).toEqual(
      expect.arrayContaining(["@matter/main", "@project-chip/matter.js"]),
    );
    // surum sabit (^ ya da ~ yok): eski denetleyici API'si 0.19'da kalkacak
    expect(pkg.dependencies["@matter/main"]).toMatch(/^\d/);
  });
});
