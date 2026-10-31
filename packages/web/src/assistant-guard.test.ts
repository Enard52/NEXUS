import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Yerel komut motoru yalnızca gerçek komutlarda cihaza dokunur ya da hazır yanıt verir.
 * Bilgi/öneri soruları ve alakasız cümleler yapay zekâya (unknown) bırakılır; cihaz durumu uydurulmaz.
 */
const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "src", "app");
function assistant() {
  const calls: string[] = [];
  const dev = { name: "Salon Lamba", room: "Salon", kind: "light" };
  const NX: Record<string, any> = {
    readDevices: () => [dev],
    kindOf: (d: any) => d.kind,
    runScene: (id: string) => {
      calls.push("scene:" + id);
      return { changed: 1, lanDevices: [] };
    },
    setField: (i: number, f: string, v: any) => {
      calls.push("set:" + f);
      return {};
    },
    statusOf: () => ({ badge: "on", text: "" }),
    escapeHtml: (s: string) => s,
    isLan: () => false,
    hasCap: () => true,
    hasPower: () => true,
    hasFeature: () => false,
    stateOf: () => ({ switch: false }),
  };
  const win: Record<string, any> = { nexusLang: "tr", NX };
  new Function("window", readFileSync(resolve(APP, "nexus-assistant.js"), "utf8"))(win);
  return { a: win.nexusAssistant, calls };
}

describe("yerel asistan yanlış tetiklenmez", () => {
  it.each([
    "bana bir film öner",
    "bu akşam hangi film izleyelim",
    "klimayı nasıl açarım",
    "ışıklar neden yanmıyor",
    "kargo durumu ne",
    "siparişimin durumunu öğrenmek istiyorum",
    "how do I turn on the lights",
  ])("%s → cihaza dokunmaz, yapay zekâya bırakılır", (q) => {
    const { a, calls } = assistant();
    const r = a.reply(q);
    expect(r.unknown, q).toBe(true);
    expect(calls, q).toEqual([]);
  });

  it.each([
    ["film modunu başlat", "scene:movie-mode"],
    ["iyi geceler", "scene:sleep-mode"],
    ["salon ışıklarını kapat", "set:switch"],
  ])("%s → gerçek komut çalışır", (q, call) => {
    const { a, calls } = assistant();
    const r = a.reply(q);
    expect(r.unknown, q).toBeFalsy();
    expect(calls).toContain(call);
  });

  it("çıplak durum isteği cihaz özeti verir", () => {
    const { a } = assistant();
    for (const q of ["durum", "cihaz durumu", "hangi cihazlar açık"]) {
      const r = a.reply(q);
      expect(r.unknown, q).toBeFalsy();
      expect(r.reply, q).toMatch(/cihaz/);
    }
  });

  it("genel 'destek' kelimesi SSS yanıtına düşmez, açık destek isteği düşer", () => {
    const { a } = assistant();
    expect(a.reply("bana destek olur musun").reply).not.toMatch(/SSS ve Geri Bildirim/);
    expect(a.reply("destek ekibine ulaşmak istiyorum").reply).toMatch(/SSS ve Geri Bildirim/);
    expect(a.reply("SSS ve destek konusunda yardım istiyorum.").reply).toMatch(
      /SSS ve Geri Bildirim/,
    );
  });
});
