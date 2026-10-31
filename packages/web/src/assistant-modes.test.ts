import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Asistan modları süs değildir: her biri mesajın işlenişini gerçekten değiştirir. */
const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "src", "app");
function assistant() {
  const win: Record<string, any> = { nexusLang: "tr", NX: { readDevices: () => [] } };
  new Function("window", readFileSync(resolve(APP, "nexus-assistant.js"), "utf8"))(win);
  return { a: win.nexusAssistant, win };
}

describe("asistan modları", () => {
  it("dört mod listelenir ve varsayılan sohbettir", () => {
    const { a } = assistant();
    expect(a.modes.list().map((m: any) => m.id)).toEqual(["chat", "device", "scenario", "automation"]);
    expect(a.modes.get()).toBe("chat");
    expect(a.modes.query("film modu")).toBe("film modu");
    expect(a.modes.local()).toBe(false);
  });

  it("oluşturma modları isteği oluştur niyetiyle işaretler ve hedef türü belirler", () => {
    const { a, win } = assistant();
    a.modes.set("automation");
    expect(win.__nexusAiCreateType).toBe("automation");
    expect(a.reply(a.modes.query("her gece ışıkları kapat")).action).toBe("create");
    a.modes.set("scenario");
    expect(win.__nexusAiCreateType).toBe("clickrun");
    expect(a.reply(a.modes.query("film modu")).action).toBe("create");
  });

  it("cihaz modu yalnızca yerel çalışır ve anlaşılmayanı yapay zekâya göndermez", () => {
    const { a } = assistant();
    a.modes.set("device");
    expect(a.modes.local()).toBe(true);
    expect(a.modes.notUnderstood()).toMatch(/cihaz komutu/);
    expect(a.modes.hint()).toMatch(/salon/);
  });

  it("bilinmeyen mod sohbete düşer", () => {
    const { a } = assistant();
    expect(a.modes.set("yok")).toBe("chat");
  });
});
