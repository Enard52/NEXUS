import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Yerel yedek (cloud-sync.js exportBackup / importBackup): sırlar yedeğe girmez, başka hesabın kimliği
 * geri yüklenmez, bozuk dosya reddedilir. Gerçek dosya indirme/paylaşma tarayıcı/telefonda ayrıca denenmelidir.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const CLOUD_SYNC = readFileSync(join(REPO_ROOT, "src", "app", "cloud-sync.js"), "utf8");

function makeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    get length() {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    _map: map,
  };
}

function load(user: string) {
  const storage = makeStorage();
  storage.setItem("nexusCurrentUser", user);
  const win: Record<string, unknown> = { localStorage: storage };
  win.nexusGetItem = (key: string) => storage.getItem(`${user}_${key}`);
  win.nexusSetItem = (key: string, value: string) => storage.setItem(`${user}_${key}`, value);
  (globalThis as Record<string, unknown>).localStorage = storage;
  new Function("window", "fetch", CLOUD_SYNC)(win, () => Promise.reject(new Error("ağ yok")));
  return { cloud: (win as { nexusCloud: any }).nexusCloud, storage, user };
}

afterEach(() => {
  delete (globalThis as Record<string, unknown>).localStorage;
});

const DEVICE = {
  name: "Salon Prizi",
  host: "http://192.168.1.50",
  protocol: "tapo",
  caps: ["switch"],
  options: {
    scenes: ["a"],
    localKey: "SECRET-LOCAL-KEY",
    account: { username: "x@y.z", password: "hunter2" },
  },
  apiToken: "TOKEN-123",
};

describe("yedeği dışa aktarma", () => {
  it("oturum yoksa null döner", () => {
    const { cloud, storage } = load("guest");
    storage.removeItem("nexusCurrentUser");
    expect(cloud.exportBackup()).toBeNull();
  });

  it("ayarları ve cihazı içerir; sır gibi alanlar ve hariç anahtarlar yedekte olmaz", () => {
    const { cloud, storage, user } = load("ayse@ornek.com");
    storage.setItem(`${user}_nexusDarkMode`, "true");
    storage.setItem(`${user}_nexusCustomAutomations`, JSON.stringify([{ id: "a1" }]));
    storage.setItem(`${user}_nexusPairedDevices`, JSON.stringify([DEVICE]));
    storage.setItem(`${user}_nexusLanSecrets`, JSON.stringify({ x: "gizli" }));
    storage.setItem(
      `${user}_nexusNotifyChannels`,
      JSON.stringify({ telegram: { token: "BOT-TOKEN" } }),
    );
    storage.setItem(`${user}_nexusUserPassword`, "parola");
    storage.setItem(`${user}_nexusErrorLog`, JSON.stringify([{ message: "x" }]));
    storage.setItem(
      `${user}_nexusRemoteHosts`,
      JSON.stringify({ "http://192.168.1.5": "http://100.64.0.5" }),
    );
    const data = cloud.exportBackup();
    expect(data.app).toBe("nexus-backup");
    expect(data.keys.nexusDarkMode).toBe("true");
    expect(data.keys.nexusCustomAutomations).toContain("a1");
    expect(data.keys).not.toHaveProperty("nexusLanSecrets");
    expect(data.keys).not.toHaveProperty("nexusNotifyChannels");
    expect(data.keys).not.toHaveProperty("nexusUserPassword");
    expect(data.keys).not.toHaveProperty("nexusErrorLog");
    expect(data.keys).not.toHaveProperty("nexusRemoteHosts");
    const text = JSON.stringify(data);
    for (const secret of [
      "SECRET-LOCAL-KEY",
      "hunter2",
      "TOKEN-123",
      "BOT-TOKEN",
      "x@y.z",
      "gizli",
    ])
      expect(text).not.toContain(secret);
    expect(data.devices[0]).toMatchObject({ name: "Salon Prizi", host: "http://192.168.1.50" });
    expect(data.devices[0].options.scenes).toEqual(["a"]);
  });
});

describe("yedekten geri yükleme", () => {
  const backup = (over: Record<string, unknown> = {}) => ({
    app: "nexus-backup",
    version: 1,
    exportedAt: "2026-10-29T00:00:00.000Z",
    keys: {
      nexusDarkMode: "true",
      nexusUserEmail: "baska@hesap.com",
      nexusLanSecrets: "{}",
      nexusNotifyChannels: "{}",
    },
    devices: [
      { name: "Salon Prizi", host: "http://192.168.1.50", protocol: "shelly", caps: ["switch"] },
    ],
    ...over,
  });

  it("geçersiz ya da yabancı dosyayı reddeder, hiçbir şey yazmaz", () => {
    const { cloud, storage, user } = load("ayse@ornek.com");
    const before = storage.length;
    for (const bad of [null, {}, { app: "x" }, backup({ version: 2 }), backup({ keys: "yok" })]) {
      expect(cloud.importBackup(bad).ok).toBe(false);
    }
    expect(storage.length).toBe(before);
    expect(storage.getItem(`${user}_nexusDarkMode`)).toBeNull();
  });

  it("ayarları yazar; kimlik e-postası, sırlar ve bildirim kanalları geri yüklenmez", () => {
    const { cloud, storage, user } = load("ayse@ornek.com");
    storage.setItem(`${user}_nexusUserEmail`, "ayse@ornek.com");
    const res = cloud.importBackup(backup());
    expect(res.ok).toBe(true);
    expect(storage.getItem(`${user}_nexusDarkMode`)).toBe("true");
    expect(storage.getItem(`${user}_nexusUserEmail`)).toBe("ayse@ornek.com");
    expect(storage.getItem(`${user}_nexusLanSecrets`)).toBeNull();
    expect(storage.getItem(`${user}_nexusNotifyChannels`)).toBeNull();
  });

  it("cihazları ekler, var olanı çoğaltmaz, yedekteki sır alanlarını yazmaz", () => {
    const { cloud, storage, user } = load("ayse@ornek.com");
    storage.setItem(
      `${user}_nexusPairedDevices`,
      JSON.stringify([{ name: "Mutfak", host: "http://192.168.1.9" }]),
    );
    const withSecret = backup({
      devices: [
        { name: "Salon Prizi", host: "http://192.168.1.50", password: "hunter2" },
        { name: "Mutfak", host: "http://192.168.1.9" },
      ],
    });
    const res = cloud.importBackup(withSecret);
    expect(res.devices).toBe(1);
    const list = JSON.parse(storage.getItem(`${user}_nexusPairedDevices`) as string);
    expect(list.map((d: any) => d.name).sort()).toEqual(["Mutfak", "Salon Prizi"]);
    expect(JSON.stringify(list)).not.toContain("hunter2");
  });

  it("oturum yokken geri yükleme reddedilir", () => {
    const { cloud, storage } = load("guest");
    storage.removeItem("nexusCurrentUser");
    expect(cloud.importBackup(backup()).ok).toBe(false);
  });
});
