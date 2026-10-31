import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Sohbetten senaryo / otomasyon oluşturma: kayıt GERÇEK ve çalışır olmalı.
 * Kayıt yalnızca eşleşmiş cihazlarda uygulanabilen bir senaryo (sceneId) ya da cihaz adımları (actions) ve
 * otomasyonda gerçek bir zaman tetikleyicisi varsa yapılır; aksi halde hiçbir şey kaydedilmez.
 */
const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "src", "app");
const SOURCE = readFileSync(resolve(APP, "nexus-assistant.js"), "utf8");

type Dev = { name: string; room?: string; kind: string; caps?: string[]; power?: boolean };
type Saved = { type: string; sceneId: string | null; opts: any };

function setup(devs: Dev[], available: { id: string; title: string; affected: number }[] = []) {
  const saved: Saved[] = [];
  const calls: unknown[] = [];
  const win: Record<string, any> = {
    nexusLang: "tr",
    NX: {
      readDevices: () => devs,
      kindOf: (d: Dev) => d.kind,
      hasPower: (d: Dev) => d.power !== false,
      isLan: () => false,
      hasCap: (d: Dev, c: string) => (d.caps ?? []).includes(c),
      hasFeature: (d: Dev, f: string) => (d.caps ?? []).includes(f),
      stateOf: () => ({ switch: false }),
      statusOf: () => ({ badge: "off", text: "" }),
      escapeHtml: (s: string) => s,
      setField: (...a: unknown[]) => calls.push(a),
      runScene: () => ({ changed: 0, lanDevices: [] }),
    },
    nexusQuickScenes: {
      available: () => available,
      metaFor: (id: string) =>
        ({
          "sleep-mode": { icon: "moon", time: { value: "23:00", repeat: "daily" } },
          "movie-mode": { icon: "clapperboard" },
        })[id] ?? null,
      descFor: (id: string) => id + " açıklaması",
      describeAct: (a: [string, unknown]) =>
        a[0] === "switch" ? (a[1] ? "açılır" : "kapatılır") : "ayarlanır",
      save: (type: string, sceneId: string | null, opts: unknown) => {
        saved.push({ type, sceneId, opts });
        return "custom-1";
      },
    },
  };
  new Function("window", "navigator", "fetch", "AbortController", SOURCE)(
    win,
    { language: "tr-TR" },
    undefined,
    undefined,
  );
  return { a: win.nexusAssistant, saved, calls, win };
}

const home: Dev[] = [
  { name: "Salon Lambası", room: "Salon", kind: "light", caps: ["brightness"] },
  { name: "Buzdolabı Prizi", room: "Mutfak", kind: "energy" },
  { name: "Klima", room: "Salon", kind: "ac", caps: ["target", "switch"] },
  { name: "Salon Perdesi", room: "Salon", kind: "cover" },
];
const MOVIE = { id: "movie-mode", title: "Film modu", affected: 2 };
const SLEEP = { id: "sleep-mode", title: "Uyku modu", affected: 3 };

describe("sohbetten oluşturma: dürüst sınırlar", () => {
  it("cihaz yokken hiçbir şey kaydetmez", () => {
    const { a, saved } = setup([]);
    a.modes.set("scenario");
    const r = a.reply(a.modes.query("film modu"));
    expect(saved).toHaveLength(0);
    expect(r.created).toBeUndefined();
    expect(r.reply).toMatch(/önce bir cihaz/);
  });

  it("senaryo eşleşmiş cihazlarda bir şey değiştirmiyorsa kaydetmez", () => {
    const { a, saved } = setup(home, []);
    a.modes.set("scenario");
    const r = a.reply(a.modes.query("film modu"));
    expect(saved).toHaveLength(0);
    expect(r.reply).toMatch(/hiçbir şeyi değiştirmiyor/);
  });

  it("anlaşılmayan istekte kaydetmez, örnek verir", () => {
    const { a, saved } = setup(home, [MOVIE]);
    a.modes.set("scenario");
    const r = a.reply(a.modes.query("bana güzel bir şey yap"));
    expect(saved).toHaveLength(0);
    expect(r.reply).toMatch(/kaydetmedim/);
  });

  it("otomasyonda saat yoksa sorar, kaydetmez", () => {
    const { a, saved } = setup(home, [MOVIE]);
    a.modes.set("automation");
    const r = a.reply(a.modes.query("salon lambasını kapat"));
    expect(saved).toHaveLength(0);
    expect(r.reply).toMatch(/Ne zaman çalışsın/);
  });

  it("sensör/konum tetikleyicisini sohbetten kurmaz, Akıllı ekranına yönlendirir", () => {
    const { a, saved } = setup(home, [MOVIE]);
    a.modes.set("automation");
    const r = a.reply(a.modes.query("eve gelince ışıkları aç"));
    expect(saved).toHaveLength(0);
    expect(r.reply).toMatch(/Akıllı Senaryolar/);
  });

  it("oluştururken cihaza o an komut göndermez", () => {
    const { a, calls } = setup(home, [MOVIE]);
    a.modes.set("automation");
    a.reply(a.modes.query("her gece 23:00'te salon lambasını kapat"));
    expect(calls).toHaveLength(0);
  });
});

describe("hazır akıllı uygulama şablonları (data.js)", () => {
  it("panel isteğini sahte kayıtla karşılamaz; iki yönlü 'aç/kapat' tek adım olmaz", () => {
    const { a, saved } = setup(home, [MOVIE]);
    const r = a.reply(
      "Tüm evi oda bazlı kontrol eden bir akıllı ışık paneli oluştur. Her oda için ac/kapat, parlaklık ve renk sıcaklığı kontrolleri olsun.",
    );
    expect(saved).toHaveLength(0);
    expect(r.action).toBe("create");
    expect(r.reply).toMatch(/panel ya da uygulama ekranı kuramıyorum/);
  });

  it("gerçek bir senaryoya karşılık gelen şablon o senaryoyla kaydedilir", () => {
    const { a, saved } = setup(home, [MOVIE]);
    a.reply("TV ve medya cihazları için bir sinema modu uygulaması oluştur.");
    expect(saved[0]).toEqual(expect.objectContaining({ type: "clickrun", sceneId: "movie-mode" }));
  });
});

describe("sohbetten oluşturma: gerçek kayıt", () => {
  it("Tıkla ve Çalıştır: uygulanabilir hazır senaryo sceneId ile kaydedilir", () => {
    const { a, saved } = setup(home, [MOVIE]);
    a.modes.set("scenario");
    const r = a.reply(a.modes.query("film modu"));
    expect(saved).toEqual([
      expect.objectContaining({
        type: "clickrun",
        sceneId: "movie-mode",
        opts: expect.objectContaining({ trigger: { type: "manual" }, title: "Film modu" }),
      }),
    ]);
    expect(r.created).toBe("clickrun");
    expect(r.widget).toContain("nexus-smart.html?tab=tab-clickrun");
  });

  it("Otomasyon: cihaz adımı + gerçek saat tetikleyicisi", () => {
    const { a, saved } = setup(home, [MOVIE]);
    a.modes.set("automation");
    const r = a.reply(a.modes.query("her gece 23:00'te salon lambasını kapat"));
    expect(saved).toHaveLength(1);
    expect(saved[0].type).toBe("automation");
    expect(saved[0].sceneId).toBeNull();
    expect(saved[0].opts.trigger).toEqual({ type: "time", value: "23:00", repeat: "daily" });
    expect(saved[0].opts.actions).toEqual([
      { name: "Salon Lambası", field: "switch", value: false },
    ]);
    expect(r.created).toBe("automation");
    expect(r.reply).toMatch(/23:00/);
  });

  it("senaryonun önerilen saati, saat yazılmadığında kullanılır", () => {
    const { a, saved } = setup(home, [SLEEP]);
    a.modes.set("automation");
    a.reply(a.modes.query("iyi geceler otomasyonu"));
    expect(saved[0]).toEqual(
      expect.objectContaining({
        sceneId: "sleep-mode",
        opts: expect.objectContaining({
          trigger: { type: "time", value: "23:00", repeat: "daily" },
        }),
      }),
    );
  });

  it("saat ifadeleri doğru çözülür", () => {
    const cases: [string, { value: string; repeat: string }][] = [
      ["hafta içi sabah 7'de perdeleri aç", { value: "07:00", repeat: "weekdays" }],
      ["gün batımında salon lambasını aç", { value: "sunset", repeat: "daily" }],
      ["akşam 8'de klimayı kapat", { value: "20:00", repeat: "daily" }],
      ["gece 1'de salon lambasını kapat", { value: "01:00", repeat: "daily" }],
      ["hafta sonu saat 10 perdeleri aç", { value: "10:00", repeat: "weekends" }],
    ];
    for (const [text, want] of cases) {
      const { a, saved } = setup(home, []);
      a.modes.set("automation");
      a.reply(a.modes.query(text));
      expect(saved[0]?.opts.trigger, text).toEqual({ type: "time", ...want });
    }
  });

  it("perde, parlaklık ve sıcaklık doğru alan/değerle kaydedilir", () => {
    const run = (text: string) => {
      const { a, saved } = setup(home, []);
      a.modes.set("scenario");
      a.reply(a.modes.query(text));
      return saved[0]?.opts.actions;
    };
    expect(run("perdeleri aç")).toEqual([
      { name: "Salon Perdesi", field: "coverAction", value: "open" },
    ]);
    expect(run("salon lambası %40")).toEqual([
      { name: "Salon Lambası", field: "brightness", value: 40 },
    ]);
    expect(run("klimayı 22 derece yap")).toEqual([{ name: "Klima", field: "target", value: 22 }]);
  });

  it("'her şeyi kapat' buzdolabı prizini kapatmaz; çekimli fiil anlaşılır", () => {
    const { a, saved } = setup(home, []);
    a.modes.set("scenario");
    a.reply(a.modes.query("her şeyi kapatan bir senaryo"));
    const names = saved[0].opts.actions.map((x: { name: string }) => x.name);
    expect(names).toContain("Salon Lambası");
    expect(names).not.toContain("Buzdolabı Prizi");
  });

  it("sohbet modunda 'otomasyon' sözcüğü ve saat otomasyon olarak kaydeder", () => {
    const { a, saved } = setup(home, []);
    a.reply("her sabah 7'de perdeleri açan bir otomasyon oluştur");
    expect(saved[0].type).toBe("automation");
    expect(saved[0].opts.trigger).toEqual({ type: "time", value: "07:00", repeat: "daily" });
  });
});
