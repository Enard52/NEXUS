import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * smart-card-detail-state.js is a browser IIFE. It is loaded here with a minimal fake
 * document/window/localStorage so the empty-state decisions and the pages rendered from
 * real device state are verified without a browser. Nothing is invented: when a value
 * is not read, the rendered HTML must not contain it.
 */

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/smart-card-detail-state.js"), "utf8");

type Dev = Record<string, any>;

interface Opts {
  file: string;
  storage?: Record<string, string>;
  hasMain?: boolean;
  nx?: Record<string, any> | null;
  localDevices?: () => unknown;
  nexusGetItem?: (k: string) => string | null;
}

function load(o: Opts) {
  const store = o.storage ?? {};
  const footers = [
    {
      removed: false,
      remove() {
        this.removed = true;
      },
    },
  ];
  const footerP = {
    removed: false,
    remove() {
      this.removed = true;
    },
  };
  const listeners: { attr: string; idx: string; fire: () => void }[] = [];
  const main = {
    innerHTML: "",
    querySelectorAll(sel: string) {
      const attr = sel.slice(1, -1); // "[data-off]" -> "data-off"
      const out: unknown[] = [];
      const re = new RegExp(`${attr}="(\\d+)"([^>]*)>`, "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(main.innerHTML))) {
        const idx = m[1];
        const el = {
          checked: / checked/.test(m[2]),
          getAttribute: () => idx,
          addEventListener: (_: string, fn: () => void) => listeners.push({ attr, idx, fire: fn }),
        };
        out.push(el);
      }
      return out;
    },
  };
  const createIcons = vi.fn();
  const win: Record<string, any> = { lucide: { createIcons } };
  if (o.nx) win.NX = o.nx;
  const doc = {
    readyState: "complete",
    querySelector: (s: string) =>
      s === "main" ? (o.hasMain === false ? null : main) : s === "footer p" ? footerP : null,
    querySelectorAll: (s: string) => (s === "footer" ? footers : []),
    addEventListener: () => {},
    head: { appendChild: () => {} },
    createElement: () => ({}),
  };
  const localStorage = { getItem: (k: string) => (k in store ? store[k] : null) };
  new Function(
    "window",
    "document",
    "location",
    "localStorage",
    "nexusGetItem",
    "getLocalDevices",
    SOURCE,
  )(win, doc, { pathname: `/app/${o.file}` }, localStorage, o.nexusGetItem, o.localDevices);
  return { main, footers, footerP, createIcons, listeners };
}

const isEmptyState = (html: string) =>
  html.includes('href="nexus-pair.html"') && html.includes("Cihaz ekle");

function makeNx(devices: Dev[], extra: Record<string, any> = {}) {
  return {
    readDevices: () => devices,
    kindOf: (d: Dev) => d.kind,
    stateOf: (d: Dev) => d.state ?? {},
    statusOf: (d: Dev) => ({ text: d.status ?? "Durum okunmadı" }),
    imageUrl: () => "img.png",
    fmtTemp: (t: number) => `${t}°C`,
    sceneAffected: () => 0,
    sceneActsOf: () => [],
    hasFeature: (d: Dev, f: string) => !!d.features?.includes(f),
    setField: vi.fn(),
    ...extra,
  };
}

describe("smart-card-detail-state: unknown pages", () => {
  it("does nothing on a page it has no config for", () => {
    const r = load({ file: "nexus-other.html" });
    expect(r.main.innerHTML).toBe("");
  });
});

describe("smart-card-detail-state: stored-data / device-keyword pages", () => {
  it("shows the honest empty state for a new user (no data, no devices)", () => {
    const r = load({ file: "nexus-room-scenes.html" });
    expect(isEmptyState(r.main.innerHTML)).toBe(true);
    expect(r.main.innerHTML).toContain("Oda sahnesi seçilmedi");
    expect(r.main.innerHTML).toContain('data-lucide="layout-dashboard"');
    expect(r.footers[0].removed).toBe(true); // no action button without data
    expect(r.createIcons).toHaveBeenCalled();
  });

  it("leaves the page alone when the required stored data exists", () => {
    const r = load({
      file: "nexus-room-scenes.html",
      storage: { nexusRoomScenesActive: "living" },
    });
    expect(r.main.innerHTML).toBe("");
    expect(r.footers[0].removed).toBe(false);
  });

  it("treats an empty-string stored value as no data", () => {
    const r = load({ file: "nexus-guest-mode.html", storage: { nexusGuestModeStatus: "" } });
    expect(isEmptyState(r.main.innerHTML)).toBe(true);
  });

  it("requires a matching device kind for the cleaning page", () => {
    const light = load({
      file: "nexus-cleaning-start.html",
      storage: { nexusPairedDevices: JSON.stringify([{ name: "Lamba", type: "light" }]) },
    });
    expect(isEmptyState(light.main.innerHTML)).toBe(true);
    const robot = load({
      file: "nexus-cleaning-start.html",
      storage: { nexusPairedDevices: JSON.stringify([{ name: "Hall", type: "Robot Vacuum" }]) },
    });
    expect(robot.main.innerHTML).toBe("");
  });

  it("matches keywords case-insensitively across type/name/room/category/icon", () => {
    const mk = (d: Dev) =>
      load({
        file: "nexus-cleaning-start.html",
        storage: { nexusLocalDevices: JSON.stringify([d]) },
      }).main.innerHTML;
    expect(mk({ room: "MOP odası" })).toBe("");
    expect(mk({ category: "Vacuum" })).toBe("");
    expect(mk({ icon: "mdi:robot" })).toBe("");
    expect(isEmptyState(mk({ name: "Plug" }))).toBe(true);
  });

  it("recognises a Turkish-named vacuum written with diacritics", () => {
    const r = load({
      file: "nexus-cleaning-start.html",
      storage: { nexusLocalDevices: JSON.stringify([{ name: "Süpürge" }]) },
    });
    expect(r.main.innerHTML).toBe("");
  });
  it("merges devices from every storage key and from getLocalDevices()", () => {
    const cam = JSON.stringify([{ name: "Cam", type: "camera" }]);
    for (const key of ["nexusPairedDevices", "nexusLocalDevices", "nexusDevices"]) {
      expect(
        load({ file: "nexus-account-security.html", storage: { [key]: cam } }).main.innerHTML,
      ).toBe("");
    }
    const viaFn = load({
      file: "nexus-account-security.html",
      localDevices: () => [{ name: "Ön kapı", type: "kilit" }],
    });
    expect(viaFn.main.innerHTML).toBe("");
  });

  it("survives corrupt JSON, non-array values and a throwing getLocalDevices", () => {
    const r = load({
      file: "nexus-account-security.html",
      storage: { nexusPairedDevices: "{not json", nexusLocalDevices: '{"a":1}' },
      localDevices: () => {
        throw new Error("boom");
      },
    });
    expect(isEmptyState(r.main.innerHTML)).toBe(true);
  });

  it("prefers nexusGetItem over localStorage and tolerates it throwing", () => {
    const viaHelper = load({
      file: "nexus-room-scenes.html",
      nexusGetItem: (k) => (k === "nexusRoomScenesActive" ? "x" : null),
    });
    expect(viaHelper.main.innerHTML).toBe("");
    const throwing = load({
      file: "nexus-room-scenes.html",
      storage: { nexusRoomScenesActive: "x" },
      nexusGetItem: () => {
        throw new Error("locked");
      },
    });
    expect(isEmptyState(throwing.main.innerHTML)).toBe(true);
  });

  it("does not throw when the page has no <main>", () => {
    expect(() => load({ file: "nexus-room-scenes.html", hasMain: false })).not.toThrow();
  });
});

describe("smart-card-detail-state: engine-rendered pages", () => {
  it("falls back to the empty state when no devices are known (state a)", () => {
    const r = load({ file: "nexus-home-health.html", nx: makeNx([]) });
    expect(isEmptyState(r.main.innerHTML)).toBe(true);
    expect(r.main.innerHTML).toContain("Ev sağlığı ölçülmedi");
  });

  it("home health shows only measurements that were really read", () => {
    const devices = [
      { name: "Salon", kind: "climatesensor", state: { temperature: 21.5, humidity: 40 } },
      { name: "Hava", kind: "airsensor", state: { pm25: 7, temperature: NaN, humidity: "50" } },
      { name: "Lamba", kind: "light", state: { switch: true } },
    ];
    const html = load({ file: "nexus-home-health.html", nx: makeNx(devices) }).main.innerHTML;
    expect(html).toContain("21.5°C");
    expect(html).toContain("%40");
    expect(html).toContain("7 µg/m³");
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("%50"); // string humidity is not a numeric reading
    expect((html.match(/uppercase tracking-wider/g) ?? []).length).toBe(3);
    expect(html).toContain("Skor üretmiyoruz");
  });

  it("home health with devices but no readings shows the no-measurement empty state, not a score", () => {
    const html = load({
      file: "nexus-home-health.html",
      nx: makeNx([{ name: "Lamba", kind: "light", state: {} }]),
    }).main.innerHTML;
    expect(html).toContain("Ölçüm verisi yok");
    expect(isEmptyState(html)).toBe(true);
  });

  it("escapes device names", () => {
    const html = load({
      file: "nexus-leave-home-summary.html",
      nx: makeNx([{ name: '<img src=x onerror="a">', kind: "lock" }]),
    }).main.innerHTML;
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=&quot;a&quot;&gt;");
  });

  it("leave summary lists only powered-on power kinds and all security kinds", () => {
    const devices = [
      { name: "Açık lamba", kind: "light", state: { switch: true } },
      { name: "Kapalı lamba", kind: "light", state: { switch: false } },
      { name: "Bilinmeyen priz", kind: "switch", state: {} },
      { name: "Perde", kind: "cover", state: { switch: true } },
      { name: "Ön kapı", kind: "lock", state: {} },
      { name: "Kamera", kind: "camera", state: {} },
    ];
    const nx = makeNx(devices);
    const r = load({ file: "nexus-leave-home-summary.html", nx });
    const html = r.main.innerHTML;
    const [open, sec] = html.split("GÜVENLİK CİHAZLARI");
    expect(open).toContain("Açık lamba");
    expect(open).not.toContain("Kapalı lamba");
    expect(open).not.toContain("Bilinmeyen priz");
    expect(open).not.toContain("Perde");
    expect(sec).toContain("Ön kapı");
    expect(sec).toContain("Kamera");
    expect(r.footerP.removed).toBe(true);
    expect(html).toContain("Durum okunmadı");
  });

  it("leave summary shows honest empty sections and the Kapat button turns a device off by its index", () => {
    const devices = [{ name: "Lamba", kind: "light", state: { switch: true } }];
    const nx = makeNx(devices);
    const r = load({ file: "nexus-leave-home-summary.html", nx });
    expect(r.main.innerHTML).toContain("Kilit, kapı sensörü veya kamera eklenmemiş.");
    const btn = r.listeners.find((l) => l.attr === "data-off");
    expect(btn?.idx).toBe("0");
    devices[0].state.switch = false; // device reports off after the command
    btn!.fire();
    expect(nx.setField).toHaveBeenCalledWith(0, "switch", false);
    expect(r.main.innerHTML).toContain("Açık görünen cihaz yok.");
  });

  it("leave summary does not throw when setField fails", () => {
    const nx = makeNx([{ name: "Lamba", kind: "light", state: { switch: true } }], {
      setField: () => {
        throw new Error("unreachable");
      },
    });
    const r = load({ file: "nexus-leave-home-summary.html", nx });
    expect(() => r.listeners.find((l) => l.attr === "data-off")!.fire()).not.toThrow();
  });

  it("privacy page: no camera → empty state; camera without feature → 'Desteklenmiyor', no toggle", () => {
    const none = load({
      file: "nexus-privacy-mode.html",
      nx: makeNx([{ name: "Lamba", kind: "light" }]),
    });
    expect(isEmptyState(none.main.innerHTML)).toBe(true);
    const unsupported = load({
      file: "nexus-privacy-mode.html",
      nx: makeNx([{ name: "Cam", kind: "camera", state: { privacy: true } }]),
    });
    expect(unsupported.main.innerHTML).toContain("Desteklenmiyor");
    expect(unsupported.main.innerHTML).toContain("bu kamera için ayarlanamıyor");
    expect(unsupported.main.innerHTML).not.toContain("data-priv");
  });

  it("privacy page: supported camera shows its real state and toggling writes the field", () => {
    const devices = [
      { name: "On", kind: "camera", features: ["privacy"], state: { privacy: true } },
      { name: "Off", kind: "camera", features: ["privacy"], state: {} },
    ];
    const nx = makeNx(devices);
    const r = load({ file: "nexus-privacy-mode.html", nx });
    expect(r.main.innerHTML).toContain("Gizlilik modu · Açık");
    expect(r.main.innerHTML).toContain("Gizlilik modu · Kapalı"); // unknown/undefined is not "on"
    const toggles = r.listeners.filter((l) => l.attr === "data-priv");
    expect(toggles.map((t) => t.idx)).toEqual(["0", "1"]);
    toggles[0].fire();
    expect(nx.setField).toHaveBeenCalledWith(0, "privacy", true);
  });

  it("sleep prep needs a device the scene will actually act on, and describes only known acts", () => {
    const devices = [
      { name: "Lamba", kind: "light" },
      { name: "Priz", kind: "switch" },
    ];
    const acts: Record<string, unknown[][]> = {
      Lamba: [
        ["switch", false],
        ["brightness", 10],
        ["switch", false],
        ["mystery", 1],
      ],
      Priz: [],
    };
    const nx = makeNx(devices, {
      sceneAffected: (id: string) => (id === "sleep-prep" ? 1 : 0),
      sceneActsOf: (_id: string, d: Dev) => acts[d.name],
    });
    const html = load({ file: "nexus-sleep-prep.html", nx }).main.innerHTML;
    expect(html).toContain("Lamba");
    expect(html).not.toContain("Priz");
    expect(html).toContain("Kapanır · Parlaklık %10"); // dedup, unknown act omitted
    expect(html).not.toContain("mystery");
    const empty = load({ file: "nexus-sleep-prep.html", nx: makeNx(devices) });
    expect(isEmptyState(empty.main.innerHTML)).toBe(true);
  });

  it("room comfort lists only climate kinds with real readings and keeps/removes the action footer honestly", () => {
    const devices = [
      { name: "Klima", kind: "ac", status: "Kapalı", state: { temperature: 24 } },
      { name: "Lamba", kind: "light" },
      { name: "Hava", kind: "airsensor", state: { humidity: 33, pm25: 12 } },
    ];
    const withScene = load({
      file: "nexus-room-comfort.html",
      nx: makeNx(devices, { sceneAffected: () => 2 }),
    });
    const html = withScene.main.innerHTML;
    expect(html).toContain("Kapalı · Isı 24°C");
    expect(html).toContain("Nem %33 · PM2.5 12");
    expect(html).not.toContain("Lamba");
    expect(withScene.footers[0].removed).toBe(false);
    const noScene = load({ file: "nexus-room-comfort.html", nx: makeNx(devices) });
    expect(noScene.footers[0].removed).toBe(true);
    const none = load({
      file: "nexus-room-comfort.html",
      nx: makeNx([{ name: "Lamba", kind: "light" }]),
    });
    expect(isEmptyState(none.main.innerHTML)).toBe(true);
  });
});
