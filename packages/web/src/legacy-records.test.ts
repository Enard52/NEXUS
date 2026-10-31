import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Eski sürümlerin yazdığı kayıtlar (alanları eksik senaryo/otomasyon, yeteneksiz cihaz) bugünkü
// okuma yolundan veri kaybı olmadan geçmeli. Fixture'lar elle yazılmış örnek biçimlerdir, gerçek
// kullanıcı verisi değildir. Mantık kopyalanmaz: data.js'in gerçek blokları yüklenir.
const REPO_ROOT = resolve(__dirname, "../../..");
const DATA = readFileSync(resolve(REPO_ROOT, "src/app/data.js"), "utf8");

function block(from: string, to: string): string {
  const a = DATA.indexOf(from);
  const b = DATA.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error("block not found: " + from);
  return DATA.slice(a, b);
}

type Store = Record<string, string>;

function loadItems(store: Store) {
  const src =
    block("function readStoredJson", "window.getPrimaryHouseholdName") +
    "; return { normalizeItem, readAndNormalizeItems, writeNormalizedItems, updateItemById };";
  return new Function("nexusGetItem", "nexusSetItem", src)(
    (k: string) => (k in store ? store[k] : null),
    (k: string, v: string) => {
      store[k] = v;
    },
  ) as {
    normalizeItem: (item: unknown, type?: string) => any;
    readAndNormalizeItems: (key: string, type?: string) => any[];
    writeNormalizedItems: (key: string, items: unknown[], type?: string) => void;
    updateItemById: (key: string, id: string, updates: object) => any;
  };
}

function loadDevices(store: Store, win: object = {}, nav: object = { onLine: true }) {
  const src =
    block("function getLocalDevices()", "window.getNexusLocalDevices") +
    "; return getLocalDevices;";
  return new Function("nexusGetItem", "nexusSetItem", "window", "navigator", src)(
    (k: string) => (k in store ? store[k] : null),
    (k: string, v: string) => {
      store[k] = v;
    },
    win,
    nav,
  ) as () => any[];
}

describe("eski senaryo/otomasyon kayıtları", () => {
  it("alanları eksik eski otomasyon bugünkü biçime tamamlanır, kullanıcı verisi korunur", () => {
    const store: Store = {
      nexusCustomAutomations: JSON.stringify([
        { id: "auto-old-1", title: "Sabah", actions: [{ device: "Salon Lamba", action: "on" }] },
      ]),
    };
    const [item] = loadItems(store).readAndNormalizeItems("nexusCustomAutomations", "automation");
    expect(item.id).toBe("auto-old-1");
    expect(item.title).toBe("Sabah");
    expect(item.type).toBe("automation");
    expect(item.actions).toEqual([{ device: "Salon Lamba", action: "on" }]);
    expect(item.enabled).toBe(true);
    expect(item.showOnHome).toBe(true);
    expect(item.showInRoom).toBe(false);
    expect(item.trigger).toEqual({ type: "time", value: "", repeat: "always" });
  });

  it("tetikleyicisi olmayan eski clickrun elle çalışan kayıt olur", () => {
    const store: Store = {
      nexusCustomClickRun: JSON.stringify([{ id: "cr-old", title: "Film", sceneId: "movie" }]),
    };
    const [item] = loadItems(store).readAndNormalizeItems("nexusCustomClickRun", "clickrun");
    expect(item.type).toBe("clickrun");
    expect(item.trigger).toEqual({ type: "manual" });
    expect(item.sceneId).toBe("movie");
  });

  it("kullanıcının kapattığı tercihler (false) varsayılanla ezilmez", () => {
    const { normalizeItem } = loadItems({});
    const item = normalizeItem(
      { id: "a", enabled: false, showOnHome: false, showInRoom: true, createdAt: 1700000000000 },
      "automation",
    );
    expect(item.enabled).toBe(false);
    expect(item.showOnHome).toBe(false);
    expect(item.showInRoom).toBe(true);
    expect(item.createdAt).toBe(1700000000000);
  });

  it("kayıtlı tetikleyici olduğu gibi taşınır", () => {
    const trigger = { type: "device", deviceId: "paired-0", value: "on" };
    const item = loadItems({}).normalizeItem({ id: "a", trigger }, "automation");
    expect(item.trigger).toEqual(trigger);
  });

  it("kimliği olmayan eski kayda kimlik verilir; boş girdiler atılır", () => {
    const store: Store = {
      nexusCustomAutomations: JSON.stringify([null, { title: "Kimliksiz" }]),
    };
    const items = loadItems(store).readAndNormalizeItems("nexusCustomAutomations", "automation");
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Kimliksiz");
    expect(items[0].id).toMatch(/^auto-/);
  });

  it("bozuk ya da dizi olmayan kayıt boş liste döner, istisna fırlatmaz", () => {
    const { readAndNormalizeItems } = loadItems({
      nexusCustomAutomations: "{bozuk",
      nexusCustomClickRun: JSON.stringify({ id: "tek-nesne" }),
    });
    expect(readAndNormalizeItems("nexusCustomAutomations", "automation")).toEqual([]);
    expect(readAndNormalizeItems("nexusCustomClickRun", "clickrun")).toEqual([]);
  });

  it("geçiş kararlıdır: okunup yazılan kayıt ikinci turda değişmez", () => {
    const store: Store = {
      nexusCustomAutomations: JSON.stringify([{ id: "a1", title: "Gece", room: "Yatak Odası" }]),
    };
    const api = loadItems(store);
    const first = api.readAndNormalizeItems("nexusCustomAutomations", "automation");
    api.writeNormalizedItems("nexusCustomAutomations", first, "automation");
    const second = api.readAndNormalizeItems("nexusCustomAutomations", "automation");
    expect(second).toEqual(first);
    expect(second[0].room).toBe("Yatak Odası");
  });

  it("eski kayıtta tek alan güncellenince diğer alanlar kaybolmaz", () => {
    const store: Store = {
      nexusCustomAutomations: JSON.stringify([
        { id: "a1", title: "Akşam", sceneId: "evening", actions: [{ device: "Lamba" }] },
      ]),
    };
    const updated = loadItems(store).updateItemById("nexusCustomAutomations", "a1", {
      enabled: false,
    });
    expect(updated.enabled).toBe(false);
    const saved = JSON.parse(store.nexusCustomAutomations)[0];
    expect(saved.title).toBe("Akşam");
    expect(saved.sceneId).toBe("evening");
    expect(saved.actions).toEqual([{ device: "Lamba" }]);
  });
});

describe("eski cihaz kayıtları (nexusPairedDevices)", () => {
  it("yetenek alanı olmayan eski bağlı cihaz listelenir", () => {
    const store: Store = {
      nexusPairedDevices: JSON.stringify([
        { name: "Salon Lamba", host: "192.168.1.20", icon: "lightbulb" },
      ]),
    };
    const list = loadDevices(store)();
    expect(list).toEqual([
      {
        id: "paired-0",
        name: "Salon Lamba",
        state: "Bağlı",
        type: "light",
        img: "",
        linked: true,
      },
    ]);
  });

  it("adresi olmayan eski kayıt eklenmiş cihaz sayılmaz ama silinmez", () => {
    const raw = JSON.stringify([{ name: "Eşleşmemiş Priz" }]);
    const store: Store = { nexusPairedDevices: raw };
    expect(loadDevices(store)()).toEqual([]);
    expect(store.nexusPairedDevices).toBe(raw);
  });

  it("yalnız bağlanmamış katalog girdileri temizlenir, gerçek cihazlar kalır", () => {
    const store: Store = {
      nexusPairedDevices: JSON.stringify([
        { id: "catalog-shelly-plug", name: "Katalog Priz" },
        { id: "lan-1", name: "Mutfak Priz", host: "192.168.1.30" },
      ]),
    };
    const list = loadDevices(store)();
    expect(list.map((d) => d.name)).toEqual(["Mutfak Priz"]);
    expect(JSON.parse(store.nexusPairedDevices)).toEqual([
      { id: "lan-1", name: "Mutfak Priz", host: "192.168.1.30" },
    ]);
  });

  it("çevrimdışıyken eski kayıt 'Bağlı' görünmez", () => {
    const store: Store = {
      nexusPairedDevices: JSON.stringify([{ name: "Priz", host: "10.0.0.5" }]),
    };
    expect(loadDevices(store, {}, { onLine: false })()[0].state).toBe("Çevrimdışı");
  });

  it("bozuk cihaz kaydı boş liste döner", () => {
    expect(loadDevices({ nexusPairedDevices: "[bozuk" })()).toEqual([]);
  });
});
