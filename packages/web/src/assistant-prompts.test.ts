import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Asistanın uygulama içinden gönderilen hazır istemlere (SSS/destek, akıllı uygulama şablonları, aydınlatma sahneleri,
 * "hazır komutlar") verdiği yanıt konuyla uyumlu olmalı: genel komut listesine ya da "anlayamadım"a düşmemeli.
 */
const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "src", "app");
function assistant() {
  const win: Record<string, any> = { nexusLang: "tr", NX: { readDevices: () => [] } };
  new Function("window", readFileSync(resolve(APP, "nexus-assistant.js"), "utf8"))(win);
  return win.nexusAssistant;
}
const HELP = /^Evini benimle yönetebilirsin/;

describe("hazır istemler konuyla uyumlu yanıtlanır", () => {
  const a = assistant();

  it("SSS ve destek istemi destek ekranına yönlendirir", () => {
    const r = a.reply("SSS ve destek konusunda yardım istiyorum.");
    expect(r.reply).toMatch(/SSS ve Geri Bildirim/);
    expect(r.unknown).toBeFalsy();
  });

  it("data.js'teki tüm akıllı uygulama şablonları oluşturma isteği olarak anlaşılır", () => {
    const data = readFileSync(resolve(APP, "data.js"), "utf8");
    const prompts = [...data.matchAll(/prompt:\s*'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]);
    expect(prompts.length).toBeGreaterThan(10);
    for (const p of prompts) expect(a.reply(p).action, p).toBe("create");
  });

  it("aydınlatma sahnesi ve akıllı uygulama sayfası istemleri oluşturma sayılır", () => {
    for (const p of [
      "Sabah için yumuşak ve sıcak bir aydınlatma sahnesi oluştur. Hedef oda: Salon. Parlaklık: %60.",
      "Salon için yapay zeka ile oluştur: Işık paneli",
      "Yapay zeka ile yeni bir akilli uygulama olusturmak istiyorum.",
    ])
      expect(a.reply(p).action, p).toBe("create");
  });

  it("çıplak yardım istekleri komut listesini verir, konulu yardım istekleri vermez", () => {
    for (const p of ["yardım", "ne yapabilirsin?", "Evdeki cihazlara göre hazır komutlar ver."])
      expect(a.reply(p).reply, p).toMatch(HELP);
    expect(a.reply("Wi-Fi bağlantı konusunda yardım istiyorum").reply).not.toMatch(HELP);
  });

  it("gerçek cihaz komutları etkilenmez", () => {
    expect(a.reply("film modunu aç").action).not.toBe("create");
    expect(a.reply("rahatsız etme modunu aç").action).toBe("dnd-on");
  });
});
