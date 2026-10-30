import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// smart-scene-page.js is a DOM-bound browser script (no exports). There is no jsdom in this repo,
// so it runs against a tiny hand-written DOM: elements are looked up through explicit selector
// maps (`qs` / `qsa`) instead of a selector engine. The scene engine (`NX`, from device-controls.js)
// is replaced by a recording stub: these tests cover the PAGE logic (what it asks the engine, what
// it shows/logs/stores), not the engine itself.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/smart-scene-page.js"), "utf8");

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

class El {
  attrs: Record<string, string> = {};
  listeners: Record<string, ((e: Any) => void)[]> = {};
  qs: Record<string, El | null> = {};
  qsa: Record<string, El[]> = {};
  children: El[] = [];
  parentElement: El | null = null;
  textContent = "";
  innerHTML = "";
  id = "";
  disabled = false;
  checked = false;
  value = "";
  src = "";
  onload: (() => void) | null = null;
  removed = false;
  classes = new Set<string>();
  classList = { add: (c: string) => this.classes.add(c) };
  rect = { width: 100, height: 40, top: 100 };
  constructor(public tagName = "DIV") {}
  get innerText() {
    return this.textContent;
  }
  getAttribute(n: string) {
    return n in this.attrs ? this.attrs[n] : null;
  }
  setAttribute(n: string, v: string) {
    this.attrs[n] = String(v);
  }
  hasAttribute(n: string) {
    return n in this.attrs;
  }
  addEventListener(t: string, fn: (e: Any) => void) {
    (this.listeners[t] ||= []).push(fn);
  }
  querySelector(s: string) {
    return this.qs[s] ?? null;
  }
  querySelectorAll(s: string) {
    return this.qsa[s] ?? [];
  }
  contains(el: El): boolean {
    return el === this || this.children.some((c) => c.contains(el));
  }
  remove() {
    this.removed = true;
  }
  getBoundingClientRect() {
    return this.rect;
  }
  fire(type: string) {
    const ev = {
      prevented: false,
      preventDefault() {
        this.prevented = true;
      },
    };
    (this.listeners[type] || []).forEach((fn) => fn(ev));
    return ev;
  }
}

function el(tag: string, text = "", attrs: Record<string, string> = {}) {
  const e = new El(tag);
  e.textContent = text;
  Object.assign(e.attrs, attrs);
  return e;
}

interface Opts {
  page?: string;
  title?: string;
  store?: Record<string, string>;
  engine?: Any | null; // null => engine not loaded yet
  footer?: El | null;
  main?: El | null;
  inPage?: El[];
  inputs?: Record<string, El[]>;
  historyLength?: number;
  buttons?: El[];
  bodyAttrs?: Record<string, string>;
  ids?: Record<string, El>;
  count?: El;
  cards?: El[];
}

function load(opts: Opts = {}) {
  const store = new Map<string, string>(Object.entries(opts.store ?? {}));
  const body = el("BODY", "", {
    "data-scene-page": opts.page ?? "good-night",
    ...(opts.title ? { "data-scene-title": opts.title } : {}),
    ...(opts.bodyAttrs ?? {}),
  });
  const timers: (() => void)[] = [];
  const toasts: { m: string; o: Any }[] = [];
  const dialogs: Any[] = [];
  const sounds: string[] = [];
  const scripts: El[] = [];
  const nav = { href: "", backCalls: 0 };
  const calls: Any = {
    runScene: [] as string[],
    summary: [] as Any[],
    sceneAffected: [] as string[],
  };
  const defaultEngine = {
    isLan: (d: Any) => !!d.lan,
    refreshFromDevice: async (i: number) =>
      !!(JSON.parse(store.get("nexusPairedDevices") || "[]")[i] || {}).up,
    runScene: (id: string) => {
      calls.runScene.push(id);
      return { id, changed: 2 };
    },
    sceneSummary: (r: Any) => {
      calls.summary.push(r);
      return `${r.id}: ${r.changed} cihaz`;
    },
    sceneAffected: (id: string) => {
      calls.sceneAffected.push(id);
      return 1;
    },
    readDevices: () => JSON.parse(store.get("nexusPairedDevices") || "[]"),
    sceneActsOf: (_id: string, d: Any) => d.acts || [],
    imageUrl: (d: Any) => `img/${d.name}.png`,
    escapeHtml: (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"),
  };
  const win: Any = {
    NX: opts.engine === null ? undefined : { ...defaultEngine, ...(opts.engine ?? {}) },
    history: { length: opts.historyLength ?? 1, back: () => nav.backCalls++ },
    nexusToast: (m: string, o: Any) => toasts.push({ m, o }),
    nexusDialog: (o: Any) => dialogs.push(o),
    nexusFeedback: { play: (k: string) => sounds.push(k) },
    location: null,
  };
  const location = {
    pathname: "/app/some-scene.html",
    set href(v: string) {
      nav.href = v;
    },
    get href() {
      return nav.href;
    },
  };
  win.location = location;
  const head = el("HEAD");
  (head as Any).appendChild = (s: El) => scripts.push(s);
  const footer = opts.footer ?? null;
  const main = opts.main ?? null;
  const ids: Record<string, El> = opts.ids ?? {};
  const doc: Any = {
    body,
    readyState: "complete",
    title: "NEXUS - Başlık",
    head,
    createElement: (t: string) => el(t.toUpperCase()),
    getElementById: (id: string) => ids[id] ?? null,
    querySelector: (s: string) =>
      s === "footer"
        ? footer
        : s === "main"
          ? main
          : s === "[data-device-count]"
            ? (opts.count ?? null)
            : null,
    querySelectorAll: (s: string) =>
      s === 'a[href*="nexus-pair"], button'
        ? (opts.inPage ?? [])
        : s === ".feature-card"
          ? (opts.cards ?? [])
          : (opts.inputs?.[s] ?? []),
  };
  if (main) main.qsa["button"] ||= opts.buttons ?? [];
  const run = new Function(
    "window",
    "document",
    "location",
    "nexusGetItem",
    "nexusSetItem",
    "setTimeout",
    "getComputedStyle",
    "innerHeight",
    "NX",
    SOURCE,
  );
  run(
    win,
    doc,
    location,
    (k: string) => (store.has(k) ? store.get(k) : null),
    (k: string, v: string) => store.set(k, v),
    (fn: () => void) => timers.push(fn),
    () => ({ display: "block", visibility: "visible", opacity: "1" }),
    1000,
    // bare `NX` in the page is a global that follows window.NX once the engine script has loaded
    new Proxy({}, { get: (_t, k) => win.NX?.[k] }),
  );
  return {
    store,
    ids,
    win,
    nav,
    toasts,
    dialogs,
    sounds,
    scripts,
    timers,
    calls,
    footer,
    main,
    doc,
  };
}

const flush = () => new Promise((r) => setImmediate(r));
const devices = (list: Any[]) => ({ nexusPairedDevices: JSON.stringify(list) });
const events = (t: ReturnType<typeof load>) => JSON.parse(t.store.get("nexusEvents") || "[]");

function footerWith(label = "Başlat") {
  const footer = el("FOOTER");
  const cta = el("BUTTON", label);
  const cancel = el("BUTTON", "İptal");
  footer.qs["#footer-done-btn"] = cta;
  footer.qs["#footer-cancel-btn"] = cancel;
  footer.children = [cta, cancel];
  return { footer, cta, cancel };
}

describe("smart-scene-page: footer CTA with no device (new user)", () => {
  it("relabels the CTA honestly and sends the user to pairing instead of running", () => {
    const { footer, cta } = footerWith();
    const t = load({ footer });
    expect(cta.textContent).toBe("Önce cihaz ekle");
    expect(cta.getAttribute("data-no-device")).toBe("1");
    const ev = cta.fire("click");
    expect(ev.prevented).toBe(true);
    expect(t.nav.href).toBe("nexus-pair.html");
    expect(t.calls.runScene).toEqual([]);
    expect(events(t)).toEqual([]);
  });

  it("hides the footer when the page body already shows a visible 'add device' action", () => {
    const { footer, cta } = footerWith();
    const link = el("A", "+ Cihaz ekle", { href: "nexus-pair.html" });
    load({ footer, inPage: [link] });
    expect(footer.classes.has("hidden")).toBe(true);
    expect(cta.getAttribute("data-no-device")).toBeNull();
  });

  it("ignores an 'add device' action that sits inside the footer or is too small to be seen", () => {
    const { footer, cta } = footerWith();
    const inFooter = el("A", "Cihaz ekle", { href: "nexus-pair.html" });
    footer.children.push(inFooter);
    const tiny = el("BUTTON", "Cihaz ekle");
    tiny.rect = { width: 10, height: 10, top: 10 };
    load({ footer, inPage: [inFooter, tiny] });
    expect(footer.classes.has("hidden")).toBe(false);
    expect(cta.textContent).toBe("Önce cihaz ekle");
  });

  it("does not touch a CTA that already has its own onclick", () => {
    const { footer, cta } = footerWith();
    cta.attrs.onclick = "x()";
    load({ footer });
    expect(cta.textContent).toBe("Başlat");
    expect(cta.listeners.click).toBeUndefined();
  });
});

describe("smart-scene-page: footer CTA with devices", () => {
  it("runs the scene for the page id, logs it, toasts the summary, plays the sound and navigates after 1.6s", () => {
    const { footer, cta } = footerWith();
    const t = load({
      footer,
      page: "good-night",
      title: "İyi Geceler",
      store: devices([{ name: "Lamba" }]),
    });
    cta.fire("click");
    expect(t.calls.runScene).toEqual(["good-night"]);
    expect(t.toasts[0].m).toBe("good-night: 2 cihaz");
    expect(t.sounds).toEqual(["scene"]);
    const ev = events(t);
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({
      type: "scene",
      title: "İyi Geceler",
      detail: "good-night: 2 cihaz",
    });
    expect(cta.disabled).toBe(false);
    expect(t.nav.href).toBe(""); // not before the delay
    expect(t.timers).toHaveLength(1);
    t.timers[0]();
    expect(t.nav.href).toBe("nexus-home.html");
  });

  it("navigates to data-complete-href after a run when the page defines one", () => {
    const { footer, cta } = footerWith();
    const t = load({
      footer,
      store: devices([{ name: "L" }]),
      bodyAttrs: { "data-complete-href": "nexus-scenes.html" },
    });
    cta.fire("click");
    t.timers[0]();
    expect(t.nav.href).toBe("nexus-scenes.html");
  });

  it("labels the CTA 'no compatible device' when the scene would affect nothing, and shows a dialog instead of running", () => {
    const { footer, cta } = footerWith();
    const t = load({
      footer,
      store: devices([{ name: "Priz" }]),
      engine: { sceneAffected: () => 0 },
    });
    expect(cta.textContent).toBe("Uyumlu cihaz yok");
    cta.fire("click");
    expect(t.dialogs).toHaveLength(1);
    expect(t.dialogs[0].title).toBe("Uyumlu cihaz yok");
    expect(t.calls.runScene).toEqual([]);
    expect(events(t)).toEqual([]);
    // dialog action leads to pairing
    t.dialogs[0].primary.onClick();
    expect(t.nav.href).toBe("nexus-pair.html");
  });

  it("keeps the normal label when the scene affects at least one device", () => {
    const { footer, cta } = footerWith();
    load({ footer, store: devices([{ name: "Lamba" }]) });
    expect(cta.textContent).toBe("Başlat");
    expect(cta.getAttribute("data-no-compatible")).toBeNull();
  });

  it("ignores a second click while the engine is still loading (no double run)", () => {
    const { footer, cta } = footerWith();
    const t = load({ footer, store: devices([{ name: "L" }]), engine: null });
    // Compatibility probe also waits for the engine, so only the supporting scripts are queued.
    // helper scripts load one after another
    expect(t.scripts.map((s) => s.src)).toEqual(["supported-devices.js"]);
    cta.fire("click");
    expect(cta.disabled).toBe(true);
    cta.fire("click");
    // load the three scripts one by one, then provide the engine
    t.win.NX = {
      runScene: (id: string) => {
        t.calls.runScene.push(id);
        return { id, changed: 1 };
      },
      sceneSummary: (r: Any) => `ok ${r.changed}`,
      sceneAffected: () => 1,
    };
    while (t.scripts.length) (t.scripts.shift() as Any).onload?.();
    expect(t.calls.runScene).toEqual(["good-night"]);
    expect(events(t)).toHaveLength(1);
    expect(cta.disabled).toBe(false);
  });

  it("cancel button goes back in history", () => {
    const { footer, cancel } = footerWith();
    const t = load({ footer, store: devices([{ name: "L" }]) });
    const ev = cancel.fire("click");
    expect(ev.prevented).toBe(true);
    expect(t.nav.backCalls).toBe(1);
  });
});

describe("smart-scene-page: home-health check", () => {
  it("reports real reachability counts for LAN devices only", async () => {
    const { footer, cta } = footerWith();
    const t = load({
      footer,
      page: "home-health",
      store: devices([
        { name: "A", lan: true, up: true },
        { name: "B", lan: true, up: false },
        { name: "C", lan: false },
        { name: "D", lan: true, up: true },
      ]),
    });
    cta.fire("click");
    await flush();
    expect(t.toasts[0].m).toBe("3 yerel ağ cihazı kontrol edildi · 2 çevrimiçi, 1 ulaşılamıyor.");
    expect(t.calls.runScene).toEqual([]); // health check never executes a scene
    expect(events(t)[0].detail).toBe(t.toasts[0].m);
  });

  it("omits the 'unreachable' part when every device answered", async () => {
    const { footer, cta } = footerWith();
    const t = load({ footer, page: "home-health", store: devices([{ lan: true, up: true }]) });
    cta.fire("click");
    await flush();
    expect(t.toasts[0].m).toBe("1 yerel ağ cihazı kontrol edildi · 1 çevrimiçi.");
  });

  it("says it could not check when there is no LAN device", () => {
    const { footer, cta } = footerWith();
    const t = load({
      footer,
      page: "home-health",
      store: devices([{ name: "cloud" }, { name: "x" }]),
    });
    cta.fire("click");
    expect(t.toasts[0].m).toBe(
      "2 cihaz kayıtlı · yerel ağ cihazı yok, çevrimiçi kontrolü yapılamadı.",
    );
  });

  it("does not probe scene compatibility for the health page", () => {
    const { footer } = footerWith();
    const t = load({ footer, page: "home-health", store: devices([{ name: "x" }]) });
    expect(t.calls.sceneAffected).toEqual([]);
  });
});

describe("smart-scene-page: in-page action buttons", () => {
  function mainWith(buttons: El[]) {
    const main = el("MAIN");
    const parent = el("DIV");
    parent.children = buttons;
    buttons.forEach((b) => (b.parentElement = parent));
    return { main, parent };
  }

  it("with no device, a 'Çalıştır' button is relabelled and clicking it asks for a device (dialog), not a run", () => {
    const run = el("BUTTON", "Çalıştır");
    const { main } = mainWith([run]);
    const t = load({ main, buttons: [run] });
    expect(run.textContent).toBe("Önce cihaz ekle");
    // label no longer matches the run regex, so a click is just logged as an action
    run.fire("click");
    expect(t.calls.runScene).toEqual([]);
  });

  it("with devices, 'Çalıştır' runs the scene without navigating away", () => {
    const run = el("BUTTON", "Çalıştır");
    const { main } = mainWith([run]);
    const t = load({ main, buttons: [run], store: devices([{ name: "L" }]) });
    run.fire("click");
    expect(t.calls.runScene).toEqual(["good-night"]);
    expect(t.timers).toHaveLength(0);
  });

  it("a run attempt with devices removed after load shows the 'device required' dialog", () => {
    const run = el("BUTTON", "Run");
    const { main } = mainWith([run]);
    const t = load({ main, buttons: [run], store: devices([{ name: "L" }]) });
    t.store.set("nexusPairedDevices", "[]");
    run.fire("click");
    expect(t.dialogs[0].title).toBe("Cihaz gerekli");
    expect(t.calls.runScene).toEqual([]);
    t.dialogs[0].primary.onClick();
    expect(t.nav.href).toBe("nexus-pair.html");
  });

  it("a corrupted device list counts as no devices", () => {
    const run = el("BUTTON", "Run");
    const { main } = mainWith([run]);
    const t = load({ main, buttons: [run], store: { nexusPairedDevices: "{not json" } });
    expect(run.textContent).toBe("Önce cihaz ekle");
    expect(t.calls.runScene).toEqual([]);
  });

  it("segmented choices mark exactly one pressed, persist it and toast", () => {
    const a = el("BUTTON", "Sıcak");
    const b = el("BUTTON", "Soğuk");
    const { main, parent } = mainWith([a, b]);
    parent.id = "tone-group";
    const t = load({ main, buttons: [a, b], page: "movie-mode" });
    b.fire("click");
    expect(a.getAttribute("aria-pressed")).toBe("false");
    expect(b.getAttribute("aria-pressed")).toBe("true");
    const saved = JSON.parse(t.store.get("nexusSceneState:movie-mode") as string);
    expect(saved.values["seg-tone-group"]).toBe("Soğuk");
    expect(t.toasts.at(-1)?.m).toBe("Soğuk seçildi.");
    expect(events(t)[0].detail).toBe("Soğuk uygulandı.");
  });

  it("skips buttons that have onclick, are submit buttons, reserved ids or already bound", () => {
    const withOnclick = el("BUTTON", "A", { onclick: "x()" });
    const submit = el("BUTTON", "B", { type: "submit" });
    const back = el("BUTTON", "C");
    back.id = "btn-back";
    const bound = el("BUTTON", "D", { "data-scene-bound": "1" });
    const { main } = mainWith([withOnclick, submit, back, bound]);
    load({ main, buttons: [withOnclick, submit, back, bound] });
    for (const b of [withOnclick, submit, back, bound]) expect(b.listeners.click).toBeUndefined();
  });

  it("keeps only the latest 300 events", () => {
    const old = Array.from({ length: 300 }, (_, i) => ({ id: "e" + i, ts: i }));
    const b = el("BUTTON", "Foo");
    const { main } = mainWith([b]);
    const t = load({ main, buttons: [b], store: { nexusEvents: JSON.stringify(old) } });
    b.fire("click");
    const ev = events(t);
    expect(ev).toHaveLength(300);
    expect(ev[0].id).toBe("e1");
    expect(ev.at(-1).detail).toBe("Foo uygulandı.");
  });

  it("recovers from a non-array event store", () => {
    const b = el("BUTTON", "Foo");
    const { main } = mainWith([b]);
    const t = load({ main, buttons: [b], store: { nexusEvents: '{"oops":1}' } });
    b.fire("click");
    expect(events(t)).toHaveLength(1);
  });
});

describe("smart-scene-page: back / settings / persisted inputs / device count", () => {
  it("back goes through history when there is some, otherwise to the fallback page", () => {
    const back1 = el("BUTTON");
    const t1 = load({ historyLength: 3, ids: { "btn-back": back1 } });
    expect(back1.fire("click").prevented).toBe(true);
    expect(t1.nav.backCalls).toBe(1);
    expect(t1.nav.href).toBe("");
    const back2 = el("A");
    const t2 = load({
      historyLength: 1,
      ids: { "nav-back-link": back2 },
      bodyAttrs: { "data-back-href": "nexus-scenes.html" },
    });
    back2.fire("click");
    expect(t2.nav.backCalls).toBe(0);
    expect(t2.nav.href).toBe("nexus-scenes.html");
  });

  it("settings/options buttons open the settings page", () => {
    const opt = el("BUTTON");
    const t = load({ ids: { "nav-options-btn": opt } });
    expect(opt.fire("click").prevented).toBe(true);
    expect(t.nav.href).toBe("nexus-settings.html");
  });

  it("restores saved checkbox / range state and records defaults for new controls", () => {
    const saved = el("INPUT");
    saved.id = "chk-a";
    saved.checked = false;
    const fresh = el("INPUT");
    fresh.id = "chk-b";
    fresh.checked = true;
    const range = el("INPUT");
    range.id = "r1";
    range.value = "40";
    const t = load({
      page: "p1",
      store: {
        "nexusSceneState:p1": JSON.stringify({ checks: { "chk-a": true }, values: { r1: "75" } }),
      },
      inputs: { 'input[type="checkbox"]': [saved, fresh], 'input[type="range"]': [range] },
    });
    expect(saved.checked).toBe(true);
    expect(range.value).toBe("75");
    expect(JSON.parse(t.store.get("nexusSceneState:p1") as string)).toEqual({
      checks: { "chk-a": true, "chk-b": true },
      values: { r1: "75" },
    });
    fresh.checked = false;
    fresh.fire("change");
    expect(JSON.parse(t.store.get("nexusSceneState:p1") as string).checks["chk-b"]).toBe(false);
    range.value = "10";
    range.fire("input");
    expect(JSON.parse(t.store.get("nexusSceneState:p1") as string).values.r1).toBe("10");
  });

  it("falls back to empty state when the stored state is corrupt", () => {
    const c = el("INPUT");
    c.checked = true; // no id: key becomes check-0
    const t = load({
      page: "p2",
      store: { "nexusSceneState:p2": "}{" },
      inputs: { 'input[type="checkbox"]': [c] },
    });
    expect(JSON.parse(t.store.get("nexusSceneState:p2") as string).checks).toEqual({
      "check-0": true,
    });
  });

  it("writes the real number of step cards into the device-count label, and leaves it alone at 0", () => {
    const count = el("SPAN", "5 Cihaz Etkilenecek");
    load({ count, cards: [el("DIV"), el("DIV")] });
    expect(count.textContent).toBe("2 Cihaz Etkilenecek");
    const count0 = el("SPAN", "5 Cihaz Etkilenecek");
    load({ count: count0, cards: [] });
    expect(count0.textContent).toBe("5 Cihaz Etkilenecek");
  });
});

describe("smart-scene-page: real step preview (movie-mode / welcome-home)", () => {
  function previewMain() {
    const main = el("MAIN");
    const grid = el("DIV");
    const count = el("SPAN", "9 Cihaz");
    const fake = el("SECTION");
    const listSection = el("SECTION");
    listSection.qs["h3"] = el("H3", "Etkilenecek Cihazlar");
    const keep = el("SECTION");
    keep.qs["h3"] = el("H3", "Ayarlar");
    const edit = el("SPAN", "Tümünü Düzenle");
    const badge = el("SPAN", "Hazır bekliyor");
    main.qs["[data-device-count]"] = count;
    main.qs["section.space-y-4 .grid"] = grid;
    main.qs["section.space-y-6 .grid"] = grid;
    main.qs['section[class*="bg-[#4C7DFF]/5"]'] = fake;
    main.qsa["section"] = [listSection, keep];
    main.qsa["span"] = [edit, badge];
    return { main, grid, count, fake, listSection, keep, edit, badge };
  }

  it("lists only devices the scene actually acts on, escapes names and describes the acts", () => {
    const p = previewMain();
    load({
      page: "movie-mode",
      main: p.main,
      store: devices([
        {
          name: 'Lamba <b>"1"',
          acts: [
            ["switch", true],
            ["brightness", 20],
            ["switch", true],
          ],
        },
        { name: "Priz" }, // no acts => not listed
        { name: "Perde", acts: [["coverAction", "close"]] },
      ]),
    });
    expect(p.grid.innerHTML).toContain("Lamba &lt;b&gt;&quot;1&quot;");
    expect(p.grid.innerHTML).toContain("Açılır · Parlaklık %20"); // deduplicated, in order
    expect(p.grid.innerHTML).toContain("Perde");
    expect(p.grid.innerHTML).toContain("Kapanır");
    expect(p.grid.innerHTML).not.toContain("Priz");
    expect(p.grid.innerHTML).toContain("img/Perde.png");
    expect(p.count.textContent).toBe("2 cihaz etkilenecek");
    expect(p.badge.textContent).toBe("Hazır");
    expect(p.fake.removed).toBe(true);
    expect(p.listSection.removed).toBe(true);
    expect(p.keep.removed).toBe(false);
    expect(p.edit.removed).toBe(true);
  });

  it("shows an honest empty state when no paired device is affected", () => {
    const p = previewMain();
    load({ page: "welcome-home", main: p.main, store: devices([{ name: "Priz" }]) });
    expect(p.grid.innerHTML).toContain("Bu senaryoyu uygulayacak uygun cihaz yok");
    expect(p.grid.innerHTML).not.toContain("feature-card");
    expect(p.count.textContent).toBe("0 cihaz etkilenecek");
    expect(p.badge.textContent).toBe("Uygun cihaz yok");
  });

  it("shows the empty state for a brand new user with no devices at all", () => {
    const p = previewMain();
    load({ page: "movie-mode", main: p.main });
    expect(p.grid.innerHTML).toContain("uygun cihaz yok");
    expect(p.count.textContent).toBe("0 cihaz etkilenecek");
  });

  it("describes each kind of act without inventing text for unknown ones", () => {
    const p = previewMain();
    load({
      page: "movie-mode",
      main: p.main,
      store: devices([
        {
          name: "Hepsi",
          acts: [
            ["tone", "warm"],
            ["target", 21],
            ["profile", "eco"],
            ["locked", true],
            ["mode", "docked"],
            ["privacy", false],
            ["mystery", 1],
          ],
        },
      ]),
    });
    expect(p.grid.innerHTML).toContain(
      "Sıcak ışık · Hedef 21° · Eko modu · Kilitlenir · Şarj istasyonuna döner · Gizlilik modu kapanır",
    );
    expect(p.grid.innerHTML).not.toContain("mystery");
  });

  it("does not touch other scene pages", () => {
    const p = previewMain();
    load({
      page: "good-night",
      main: p.main,
      store: devices([{ name: "L", acts: [["switch", true]] }]),
    });
    expect(p.grid.innerHTML).toBe("");
    expect(p.fake.removed).toBe(false);
  });
});
