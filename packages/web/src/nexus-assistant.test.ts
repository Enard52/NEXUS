import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/nexus-assistant.js"), "utf8");

type Dev = {
  name: string;
  room?: string;
  kind: string;
  caps?: string[];
  lan?: boolean;
  power?: boolean;
  on?: boolean;
};
type Call = { index: number; field: string; value: unknown };
type Reply = { reply: string; action?: string; widget?: string; unknown?: boolean };
type Assistant = {
  reply: (t: string) => Reply;
  help: () => string;
  fold: (t: string) => string;
  ask: (t: string) => Promise<string | null>;
  transcribe: (b: unknown, l: string) => Promise<string>;
  lanPending: () => { index: number; name: string }[];
  lanSettled: (items: { index: number }[]) => boolean;
  lanFailureNote: (items: { index: number; name: string }[]) => string;
};

// Minimal stand-in for the real NX device layer (device-controls.js): it only records
// what the assistant asks for, so the tests check what the assistant really requests.
function setup(
  devs: Dev[] | null,
  opts: { lang?: "tr" | "en"; nx?: Record<string, unknown>; fetch?: unknown } = {},
) {
  const calls: Call[] = [];
  const scenes: string[] = [];
  const win: Record<string, unknown> = { nexusLang: opts.lang ?? "tr" };
  if (devs) {
    win.NX = {
      readDevices: () => devs,
      kindOf: (d: Dev) => d.kind,
      hasPower: (d: Dev) => d.power !== false,
      isLan: (d: Dev) => !!d.lan,
      hasCap: (d: Dev, c: string) => (d.caps ?? []).includes(c),
      hasFeature: (d: Dev, f: string) => (d.caps ?? []).includes(f),
      stateOf: (d: Dev) => ({ switch: !!d.on }),
      statusOf: (d: Dev) => ({ badge: d.on ? "on" : "off", text: "" }),
      escapeHtml: (s: string) => s,
      setField: (index: number, field: string, value: unknown) =>
        calls.push({ index, field, value }),
      runScene: (id: string) => {
        scenes.push(id);
        return { changed: devs.length, lanDevices: [] };
      },
      ...opts.nx,
    };
  }
  const nav = { language: "tr-TR" };
  const fn = new Function("window", "navigator", "fetch", "AbortController", SOURCE);
  fn(win, nav, opts.fetch, undefined);
  return { a: win.nexusAssistant as Assistant, calls, scenes, win };
}

const home: Dev[] = [
  { name: "Salon Lambası", room: "Salon", kind: "light", caps: ["brightness"] },
  { name: "Mutfak Lambası", room: "Mutfak", kind: "light" },
  { name: "Buzdolabı Prizi", room: "Mutfak", kind: "energy" },
  { name: "Klima", room: "Salon", kind: "ac", caps: ["target", "switch"] },
  { name: "Salon Perdesi", room: "Salon", kind: "cover" },
  { name: "Ön Kapı", room: "Giriş", kind: "lock", power: false },
  { name: "Robot", room: "Salon", kind: "vacuum", power: false },
];
const indices = (c: Call[]) => c.map((x) => x.index);

describe("fold", () => {
  it("normalises Turkish characters and whitespace", () => {
    const { a } = setup([]);
    expect(a.fold("  IŞIKLARI   Çalıştır ")).toBe("isiklari calistir");
    expect(a.fold(null as unknown as string)).toBe("");
  });
});

describe("no devices / no device layer (honest replies)", () => {
  it("does not pretend to switch anything when nothing is paired", () => {
    const { a, calls } = setup([]);
    const r = a.reply("ışıkları aç");
    expect(r.reply).toContain("cihazın yok");
    expect(r.widget).toBeUndefined();
    expect(calls).toEqual([]);
  });

  it("runs no scene and says so when there are no devices", () => {
    const { a, scenes } = setup([]);
    expect(a.reply("film modu").reply).toContain("cihazın yok");
    expect(scenes).toEqual([]);
  });

  it("lets chat without a device intent fall through to the AI path", () => {
    const { a } = setup([]);
    expect(a.reply("merhaba nasılsın").unknown).toBe(true);
    expect(a.reply("status").reply).toContain("cihazın yok");
  });

  it("answers English no-device requests in English", () => {
    const { a } = setup([], { lang: "en" });
    expect(a.reply("turn on the lights").reply).toContain("do not have any devices");
  });

  it("only shows help (no success claim, no widget) when the NX layer is missing", () => {
    const { a } = setup(null);
    const r = a.reply("ışıkları aç");
    expect(r.reply).toBe(a.help());
    expect(r.widget).toBeUndefined();
  });

  it("returns help for an empty message and for 'yardım'", () => {
    const { a } = setup(home);
    expect(a.reply("").reply).toBe(a.help());
    expect(a.reply("neler yapabilirsin").reply).toBe(a.help());
  });
});

describe("on/off commands", () => {
  it("turns on every light by category and leaves other devices alone", () => {
    const { a, calls } = setup(home);
    const r = a.reply("ışıkları aç");
    expect(calls).toEqual([
      { index: 0, field: "switch", value: true },
      { index: 1, field: "switch", value: true },
    ]);
    expect(r.reply).toContain("Salon Lambası");
    expect(r.widget).toContain("2 cihaz");
  });

  it("limits a category to the room that is named", () => {
    const { a, calls } = setup(home);
    a.reply("salon ışıklarını kapat");
    expect(calls).toEqual([{ index: 0, field: "switch", value: false }]);
  });

  it("understands English room names", () => {
    const { a, calls } = setup(home, { lang: "en" });
    const r = a.reply("Turn off the living room lights");
    expect(calls).toEqual([{ index: 0, field: "switch", value: false }]);
    expect(r.reply).toContain("Salon Lambası");
  });

  it("matches a device by its name", () => {
    const { a, calls } = setup(home);
    a.reply("klima aç");
    expect(calls).toEqual([{ index: 3, field: "switch", value: true }]);
  });

  it("asks which device when no target is recognised and changes nothing", () => {
    const { a, calls } = setup(home);
    const r = a.reply("aç");
    expect(calls).toEqual([]);
    expect(r.reply).toContain("Hangi cihazı açayım");
    expect(r.reply).toContain("Salon Lambası");
  });

  it("says honestly when the requested type is not paired", () => {
    const { a, calls } = setup([{ name: "Salon Lambası", kind: "light" }]);
    const r = a.reply("televizyonu aç");
    expect(calls).toEqual([]);
    expect(r.reply).toContain("bulunamadı");
  });

  it("'everything off' never switches plugs, covers, locks or vacuums", () => {
    const { a, calls } = setup(home);
    a.reply("her şeyi kapat");
    expect(indices(calls).sort()).toEqual([0, 1, 3]);
    expect(calls.every((c) => c.field === "switch" && c.value === false)).toBe(true);
  });

  it("'turn on everything' does include plugs", () => {
    const { a, calls } = setup(home, { lang: "en" });
    a.reply("turn on everything");
    expect(indices(calls)).toContain(2);
  });

  it("admits when the device was already in the requested state", () => {
    const { a, calls } = setup([{ name: "Lamba", kind: "light", on: true }]);
    const r = a.reply("lambayı aç");
    expect(calls).toHaveLength(1);
    expect(r.reply).toContain("zaten");
  });

  it("mentions local-network commands only for LAN devices", () => {
    const lan = setup([{ name: "Lamba", kind: "light", lan: true }]);
    expect(lan.a.reply("lambayı aç").reply).toContain("yerel ağdan komut gitti");
    expect(lan.a.lanPending()).toEqual([{ index: 0, name: "Lamba" }]);
    const cloud = setup([{ name: "Lamba", kind: "light" }]);
    expect(cloud.a.reply("lambayı aç").reply).not.toContain("yerel ağ");
    expect(cloud.a.lanPending()).toEqual([]);
  });
});

describe("brightness and temperature", () => {
  it("sets brightness only on lights that support it", () => {
    const { a, calls } = setup(home);
    const r = a.reply("ışıkları %40 yap");
    expect(calls).toEqual([{ index: 0, field: "brightness", value: 40 }]);
    expect(r.reply).toContain("40");
  });

  it("clamps brightness to 1–100", () => {
    const { a, calls } = setup(home);
    a.reply("ışıkları %150 yap");
    expect(calls[0].value).toBe(100);
  });

  it("reports honestly when no light can be dimmed", () => {
    const { a, calls } = setup([{ name: "Lamba", kind: "light" }]);
    const r = a.reply("ışıkları %40 yap");
    expect(calls).toEqual([]);
    expect(r.reply).toMatch(/bulamadım|göremiyorum/);
  });

  it("sets the target temperature and switches the AC on", () => {
    const { a, calls } = setup(home);
    a.reply("klimayı 22 derece yap");
    expect(calls).toContainEqual({ index: 3, field: "target", value: 22 });
    expect(calls).toContainEqual({ index: 3, field: "switch", value: true });
  });

  it("clamps temperature to 5–30 °C and converts Fahrenheit", () => {
    const hi = setup(home);
    hi.a.reply("klimayı 50 derece yap");
    expect(hi.calls[0].value).toBe(30);
    const f = setup(home, { lang: "en" });
    f.a.reply("set the AC to 72 f");
    expect(f.calls[0]).toEqual({ index: 3, field: "target", value: 22 });
  });

  it("asks for a number instead of guessing a temperature", () => {
    const { a, calls } = setup([{ name: "Oda Cihazı", kind: "ac", caps: ["target"] }]);
    const r = a.reply("klimayı sıcaklık ayarla");
    expect(calls).toEqual([]);
    expect(r.reply).toMatch(/Kaç dereceye|Hangi sıcaklığı/);
  });

  it("reports honestly when no AC/thermostat supports a target", () => {
    const { a, calls } = setup([{ name: "Lamba", kind: "light" }]);
    const r = a.reply("22 derece yap");
    expect(calls).toEqual([]);
    expect(r.reply).toMatch(/bulamadım|göremiyorum/);
  });
});

describe("locks, covers, vacuums", () => {
  it("never unlocks from chat", () => {
    const tr = setup(home);
    expect(tr.a.reply("kapı kilidini aç").reply).toMatch(/açmıyorum|açmam/);
    const en = setup(home, { lang: "en" });
    expect(en.a.reply("unlock the door").reply).toContain("not unlock");
    expect(tr.calls).toEqual([]);
    expect(en.calls).toEqual([]);
  });

  it("locks paired locks", () => {
    const { a, calls } = setup(home);
    a.reply("kapıyı kilitle");
    expect(calls).toEqual([{ index: 5, field: "locked", value: true }]);
  });

  it("says so when no lock is paired", () => {
    const { a, calls } = setup([{ name: "Lamba", kind: "light" }]);
    expect(a.reply("kapıyı kilitle").reply).toMatch(/akıllı kilit/);
    expect(calls).toEqual([]);
  });

  it("opens, closes and positions curtains", () => {
    const open = setup(home);
    open.a.reply("perdeyi aç");
    expect(open.calls).toEqual([{ index: 4, field: "coverAction", value: "open" }]);
    const close = setup(home);
    close.a.reply("perdeyi kapat");
    expect(close.calls[0].value).toBe("close");
    const pos = setup(home);
    pos.a.reply("perdeyi %30 yap");
    expect(pos.calls).toEqual([{ index: 4, field: "position", value: 30 }]);
  });

  it("starts the vacuum or sends it to the dock", () => {
    const go = setup(home);
    go.a.reply("robot süpürgeyi başlat");
    expect(go.calls).toEqual([{ index: 6, field: "mode", value: "cleaning" }]);
    const dock = setup(home);
    dock.a.reply("robot süpürgeyi şarja gönder");
    expect(dock.calls[0].value).toBe("docked");
  });

  it("does not claim a vacuum exists when none is paired", () => {
    const { a, calls } = setup([{ name: "Lamba", kind: "light" }]);
    expect(a.reply("robot süpürgeyi başlat").reply).toMatch(/süpürge/);
    expect(calls).toEqual([]);
  });
});

describe("scenes", () => {
  it("runs the matching scene through NX and reports the real count", () => {
    const { a, scenes } = setup(home);
    const r = a.reply("iyi geceler");
    expect(scenes).toEqual(["sleep-mode"]);
    expect(r.reply).toContain(String(home.length));
  });

  it("recognises English phrases", () => {
    const { a, scenes } = setup(home, { lang: "en" });
    a.reply("I'm home");
    a.reply("movie mode please");
    expect(scenes).toEqual(["welcome-home", "movie-mode"]);
  });

  it("says nothing was adjusted when the scene affects no device", () => {
    const { a } = setup(home, { nx: { runScene: () => ({ changed: 0, lanDevices: [] }) } });
    const r = a.reply("günaydın");
    expect(r.reply).toMatch(/bulamadım|etkilemiyor/);
    expect(r.widget).toBeUndefined();
  });
});

describe("non-device intents", () => {
  it("returns theme and do-not-disturb actions", () => {
    const { a } = setup(home);
    expect(a.reply("koyu tema").action).toBe("dark");
    expect(a.reply("açık tema").action).toBe("light");
    expect(a.reply("rahatsız etme").action).toBe("dnd-on");
    expect(a.reply("rahatsız etme modunu kapat").action).toBe("dnd-off");
  });

  it('turns do-not-disturb off with the natural phrase "rahatsız etmeyi kapat"', () => {
    const { a } = setup(home);
    expect(a.reply("rahatsız etmeyi kapat").action).toBe("dnd-off");
    expect(a.reply("rahatsız etmeyin").action).toBe("dnd-on");
  });

  it("sends weather questions to the AI instead of faking an answer", () => {
    const { a } = setup(home);
    expect(a.reply("hava durumu nasıl").unknown).toBe(true);
  });

  it("summarises the real device status", () => {
    const { a } = setup([
      { name: "Lamba", kind: "light", on: true },
      { name: "Priz", kind: "energy" },
    ]);
    const r = a.reply("durum");
    expect(r.reply).toContain("2 cihaz");
    expect(r.reply).toContain("Lamba");
  });

  it("falls through to unknown for unrelated text", () => {
    const { a, calls } = setup(home);
    expect(a.reply("bana bir fıkra anlat").unknown).toBe(true);
    expect(calls).toEqual([]);
  });
});

describe("LAN verification helpers", () => {
  const items = [
    { index: 0, name: "A" },
    { index: 1, name: "B" },
  ];

  it("lanSettled waits until every device has a final status", () => {
    const st: Record<number, string> = { 0: "ok", 1: "pending" };
    const { a } = setup(home, { nx: { lanStatus: (i: number) => st[i] } });
    expect(a.lanSettled(items)).toBe(false);
    st[1] = "error";
    expect(a.lanSettled(items)).toBe(true);
    expect(a.lanSettled([])).toBe(true);
  });

  it("lanFailureNote names only devices that reported an error", () => {
    const { a } = setup(home, { nx: { lanError: (i: number) => (i === 1 ? "timeout" : "") } });
    const note = a.lanFailureNote(items);
    expect(note).toContain("B");
    expect(note).not.toContain("A,");
    expect(a.lanFailureNote([items[0]])).toBe("");
  });
});

describe("ask / transcribe", () => {
  it("does not call the network in preview mode", async () => {
    let called = false;
    const { a, win } = setup(home, { fetch: () => ((called = true), Promise.resolve({})) });
    win.nexusPreview = true;
    expect(await a.ask("merhaba")).toBeNull();
    expect(called).toBe(false);
  });

  it("returns the AI reply, and null when the request fails", async () => {
    const ok = setup(home, {
      fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({ reply: " Selam " }) }),
    });
    expect(await ok.a.ask("merhaba")).toBe("Selam");
    const bad = setup(home, { fetch: () => Promise.resolve({ ok: false }) });
    expect(await bad.a.ask("merhaba")).toBeNull();
    const down = setup(home, { fetch: () => Promise.reject(new Error("offline")) });
    expect(await down.a.ask("merhaba")).toBeNull();
  });

  it("rejects empty and oversized recordings without a request", async () => {
    let called = false;
    const { a } = setup(home, { fetch: () => ((called = true), Promise.resolve({})) });
    expect(await a.transcribe({ size: 0 }, "tr")).toBe("");
    await expect(a.transcribe({ size: 9 * 1024 * 1024 }, "tr")).rejects.toThrow("too_large");
    expect(called).toBe(false);
  });
});
