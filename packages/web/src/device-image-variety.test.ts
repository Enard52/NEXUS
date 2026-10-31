import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Aynı türdeki cihazlar tek tip görünmesin: ad biçimi söylüyorsa aynı aileden uygun ürün görseli seçilir
 * (device-controls.js refineImg). Özel görseller (dimmer, sensör…) ve aile dışı görseller değişmez.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const controls = readFileSync(join(ROOT, "src", "app", "device-controls.js"), "utf8");
const a = controls.indexOf("var LIGHT_IMGS");
const b = controls.indexOf("function thumbFor");
const refineImg = new Function(controls.slice(a, b) + "; return refineImg;")() as (
  name: string,
  img: string,
) => string;

describe("cihaz görseli çeşitliliği", () => {
  it("ışıkların adından biçimine uygun görsel seçilir", () => {
    expect(refineImg("Salon Tavan Lambası", "generic-led-bulb.png")).toBe(
      "generic-ceiling-light.png",
    );
    expect(refineImg("Yatak Odası Abajur", "generic-led-bulb.png")).toBe("generic-table-lamp.png");
    expect(refineImg("Bahçe Işığı", "generic-led-bulb.png")).toBe("generic-outdoor-light.png");
    expect(refineImg("TV Arkası LED Şerit", "generic-led-bulb.png")).toBe("generic-led-strip.png");
    expect(refineImg("Salon Lambası", "generic-led-bulb.png")).toBe("generic-led-bulb.png");
  });

  it("priz ailesi: uzatma prizi uzatma görselini alır", () => {
    expect(refineImg("Çalışma Masası Uzatma", "generic-smart-plug.png")).toBe(
      "generic-power-strip.png",
    );
    expect(refineImg("Kahve Makinesi Prizi", "generic-smart-plug.png")).toBe(
      "generic-smart-plug.png",
    );
  });

  it("özel görseller ve aile dışı eşleşmeler değişmez", () => {
    expect(refineImg("Tavan Dimmer", "control-dimmer-knob.png")).toBe("control-dimmer-knob.png");
    expect(refineImg("Bahçe Hareket Sensörü", "generic-motion-sensor.png")).toBe(
      "generic-motion-sensor.png",
    );
    // "masa" priz ailesini ışık görseline çevirmez
    expect(refineImg("Masa Prizi", "generic-smart-plug.png")).toBe("generic-smart-plug.png");
  });

  it("seçilebilecek her görsel depoda gerçekten var", () => {
    for (const f of [
      "generic-led-bulb.png",
      "generic-ceiling-light.png",
      "generic-table-lamp.png",
      "generic-outdoor-light.png",
      "generic-led-strip.png",
      "generic-smart-plug.png",
      "generic-power-strip.png",
      "control-single-wall-switch.png",
    ])
      expect(existsSync(join(ROOT, "assets", "products", f)), f).toBe(true);
  });
});
