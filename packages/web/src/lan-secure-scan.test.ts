import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Tuya (6668) ve MQTT (1883) icin ADAY adres taramasi (lan-connectors.js secureScan).
 * Bu protokoller anahtar/kimlik olmadan tanimlanamaz; tarama yalnizca TCP kapisinin acik olmasina bakar,
 * hicbir veri gondermez. Kopru tarafi bu dosyada sahte bir TCP kopru; GERCEK CIHAZLA DOGRULAMA DEGILDIR.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/lan-connectors.js"), "utf8");

type Open = { host: string; port: number };

function fakeBridges(open: Set<string>) {
  const log = {
    tcpOpen: [] as Open[],
    mqttOpen: [] as Open[],
    closed: 0,
    sent: 0,
    live: 0,
    maxLiveMqtt: 0,
  };
  let seq = 0;
  const opener = (list: Open[], track: boolean) => (opts: Open & { timeoutMs?: number }) => {
    list.push({ host: opts.host, port: opts.port });
    if (!open.has(`${opts.host}:${opts.port}`))
      return Promise.reject(new Error("baglanti reddedildi"));
    seq += 1;
    if (track) {
      log.live += 1;
      log.maxLiveMqtt = Math.max(log.maxLiveMqtt, log.live);
    }
    return Promise.resolve(seq);
  };
  const closer = (track: boolean) => () => {
    log.closed += 1;
    if (track) log.live -= 1;
    return Promise.resolve(true);
  };
  const desktop = {
    http: () => Promise.reject(new Error("http yok")),
    subnets: () => Promise.resolve(["192.168.7.0"]),
    tcpSession: {
      open: opener(log.tcpOpen, false),
      exchange: () => {
        log.sent += 1;
        return Promise.resolve([]);
      },
      close: closer(false),
    },
    mqttSession: {
      open: opener(log.mqttOpen, true),
      send: () => {
        log.sent += 1;
        return Promise.resolve(true);
      },
      recv: () => Promise.resolve([]),
      close: closer(true),
    },
  };
  return { desktop, log };
}

function load(desktop: Record<string, unknown> | null) {
  const store = new Map<string, string>();
  const win: Record<string, unknown> = {
    nexusGetItem: (k: string) => store.get(k) ?? null,
    nexusSetItem: (k: string, v: string) => void store.set(k, v),
  };
  if (desktop) win.nexusDesktop = desktop;
  new Function("window", "fetch", SOURCE)(win, () => Promise.reject(new Error("fetch yok")));
  return (win as { nexusLan: any }).nexusLan;
}

describe("sifreli cihaz adaylari (Tuya 6668 / MQTT 1883)", () => {
  it("yalnizca kapisi acik adresleri aday verir ve hicbir veri gondermez", async () => {
    const { desktop, log } = fakeBridges(new Set(["192.168.7.60:6668", "192.168.7.10:1883"]));
    const lan = load(desktop);
    const seen: string[] = [];
    const found = await lan.secureScan({
      onFound: (item: { kind: string; host: string }) => seen.push(`${item.kind}@${item.host}`),
    });
    expect(found).toEqual(
      expect.arrayContaining([
        { kind: "tuya", host: "192.168.7.60", port: 6668 },
        { kind: "mqtt", host: "192.168.7.10", port: 1883 },
      ]),
    );
    expect(found).toHaveLength(2);
    expect(seen.sort()).toEqual(["mqtt@192.168.7.10", "tuya@192.168.7.60"]);
    expect(log.sent).toBe(0);
    // her acilan baglanti hemen kapatilir
    expect(log.closed).toBe(2);
    // 254 adresin tamami her iki kapidan da yoklanir
    expect(log.tcpOpen).toHaveLength(254);
    expect(log.mqttOpen).toHaveLength(254);
  });

  it("kopru oturum sinirini (MQTT 4) asmaz", async () => {
    const all = new Set<string>();
    for (let i = 1; i <= 254; i++) all.add(`192.168.7.${i}:1883`);
    const { desktop, log } = fakeBridges(all);
    const lan = load(desktop);
    await lan.secureScan({});
    expect(log.maxLiveMqtt).toBeLessThanOrEqual(3);
  });

  it("shouldStop tarami durdurur", async () => {
    const { desktop, log } = fakeBridges(new Set());
    const lan = load(desktop);
    await lan.secureScan({ shouldStop: () => true });
    expect(log.tcpOpen).toHaveLength(0);
    expect(log.mqttOpen).toHaveLength(0);
  });

  it("kopru yoksa bos doner; hicbir sey uydurulmaz", async () => {
    const lan = load({ http: () => Promise.reject(new Error("http yok")) });
    await expect(lan.secureScan({})).resolves.toEqual([]);
    await expect(lan.secureProbe("tuya", "192.168.7.60")).resolves.toBe(false);
  });

  it("yerel olmayan adrese baglanti denenmez", async () => {
    const { desktop, log } = fakeBridges(new Set(["8.8.8.8:6668"]));
    const lan = load(desktop);
    await expect(lan.secureProbe("tuya", "8.8.8.8")).resolves.toBe(false);
    expect(log.tcpOpen).toHaveLength(0);
  });
});
