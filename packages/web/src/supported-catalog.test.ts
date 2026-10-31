import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Cihaz Ekle kataloğu: yalnızca desteklenen bir modelle aynı işlevi gören ürünler gösterilir.
 * Destek tek kaynaktan (NEXUS_SUPPORTED_DEVICES) türetilir; matrise model eklenince ürünler kendiliğinden görünür.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/supported-devices.js"), "utf8");

function load(desktop = true) {
  const win: Record<string, any> = desktop ? { nexusDesktop: {} } : {};
  new Function("window", SOURCE)(win);
  return win;
}

describe("katalog destek filtresi", () => {
  it("yalnızca masaüstü markaları telefonda/tarayıcıda gizlenir, masaüstünde görünür", () => {
    const desktopOnly = (g: any) => g.availability === "desktop";
    const phone = load(false).nexusVisibleSupportedDevices();
    const desk = load(true).nexusVisibleSupportedDevices();
    expect(phone.some(desktopOnly)).toBe(false);
    expect(desk.some(desktopOnly)).toBe(true);
    expect(phone.length).toBeLessThan(desk.length);
  });

  it("manuel katalogdaki her destek modeli kendi protokolüne çözülür", () => {
    const w = load();
    for (const g of w.nexusVisibleSupportedDevices()) {
      for (const m of g.models) {
        const r = w.nexusResolveDevice(m.name, g.brand);
        expect(r.protocol, `${g.brand} / ${m.name}`).toBe(g.protocol);
      }
    }
  });

  it("desteklenen işlevleri gösterir", () => {
    const w = load();
    for (const [name, group] of [
      ["Akıllı Priz", "Soket"],
      ["Çoklu Priz", "Soket"],
      ["Anahtar", "Anahtar"],
      ["Akıllı Lamba", "Işık Kaynağı"],
      ["Şerit Lamba", "Ambiyans Aydınlatması"],
      ["Tavan Lambası", "Oda Işıkları"],
      ["İnsan Vücudu Sensörü", "Sensör"],
      ["Kapı ve Pencere Sensörü", "Sensör"],
      ["Hava Kalitesi Sensörü", "Çevresel Sensörler"],
      ["Duman Dedektörü", "Sensör"],
      ["Su Sızıntısı Sensörü", "Sensör"],
    ]) {
      expect(w.nexusIsSupported(name, group), name).toBe(true);
    }
  });

  it("desteklenmeyen işlevleri gizler (katalog verisi silinmez)", () => {
    const w = load();
    for (const [name, group] of [
      ["Kablosuz Anahtar", "Anahtar"],
      ["Akıllı Buton", "Anahtar"],
      ["Thermostat Switch", "Anahtar"],
      ["Garaj Kapısı Kumandası (Wi-Fi)", "Diğer"],
      ["Titreşim Sensörü", "Sensör"],
      ["Akıllı Siren", "Alarm"],
      ["Kablosuz Ağ Geçidi", "Ağ Geçidi"],
      ["Devre kesici", "Breaker"],
      ["Akıllı Elektrik Sayacı", "Elektrik Sayaçları"],
    ]) {
      expect(w.nexusIsSupported(name, group), name).toBe(false);
    }
  });

  it("matrise yeni model eklenince ilgili ürünler kendiliğinden görünür", () => {
    const w = load();
    expect(w.nexusIsSupported("Akıllı Siren", "Alarm")).toBe(false);
    w.NEXUS_SUPPORTED_DEVICES.push({
      brand: "Test",
      protocol: "x",
      availability: "all",
      note: "",
      models: [{ name: "Test Siren", img: "security-siren.png", caps: ["alarm"] }],
    });
    expect(w.nexusIsSupported("Akıllı Siren", "Alarm")).toBe(true);
  });

  it("Wake-on-LAN bir ağ geçidi değildir (ağ geçitleri desteklenmiş sayılmaz)", () => {
    const w = load();
    expect(w.nexusIsSupported("Çok Modlu Ağ Geçidi (BLE+ZigBee)", "Ağ Geçidi")).toBe(false);
  });
});
