import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Issue #59: cihaz fotoğrafı. Sayfalar tarayıcıda çalışır; yardımcıları kaynak metinden çıkarıp sınarız.
const APP = join(resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", ".."), "src", "app");
const controls = readFileSync(join(APP, "device-controls.js"), "utf8");

function block(from: string, to: string): string {
  const a = controls.indexOf(from);
  const b = controls.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error("block not found: " + from);
  return controls.slice(a, b);
}

function load(store: Record<string, string>, quotaFull = false) {
  const src =
    block("var PHOTO_KEY", "// Seçilen dosyayı") +
    `; return { photoFitSize, photoOf, setPhoto, readPhotos };`;
  return new Function("nexusGetItem", "nexusSetItem", src)(
    (k: string) => (k in store ? store[k] : null),
    (k: string, v: string) => {
      if (quotaFull) throw new Error("QuotaExceededError");
      store[k] = v;
    },
  ) as {
    photoFitSize: (w: number, h: number, m: number) => { width: number; height: number } | null;
    photoOf: (d: unknown) => string | null;
    setPhoto: (d: unknown, url: string | null) => boolean;
  };
}

const JPEG = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

describe("photoFitSize", () => {
  const { photoFitSize } = load({});
  it("downscales the long edge and keeps the aspect ratio", () => {
    expect(photoFitSize(4000, 3000, 384)).toEqual({ width: 384, height: 288 });
    expect(photoFitSize(3000, 4000, 384)).toEqual({ width: 288, height: 384 });
  });
  it("never upscales small images", () => {
    expect(photoFitSize(100, 50, 384)).toEqual({ width: 100, height: 50 });
  });
  it("keeps at least 1px and rejects unusable sizes", () => {
    expect(photoFitSize(10000, 1, 384)).toEqual({ width: 384, height: 1 });
    expect(photoFitSize(0, 10, 384)).toBeNull();
    expect(photoFitSize(NaN, 10, 384)).toBeNull();
  });
});

describe("device photo storage", () => {
  it("shows no photo until one is set (falls back to the product image)", () => {
    expect(load({}).photoOf({ id: "a" })).toBeNull();
  });

  it("stores per device id, replaces and removes", () => {
    const store: Record<string, string> = {};
    const p = load(store);
    expect(p.setPhoto({ id: "a" }, JPEG)).toBe(true);
    expect(p.photoOf({ id: "a" })).toBe(JPEG);
    expect(p.photoOf({ id: "b" })).toBeNull();
    expect(p.setPhoto({ id: "a" }, null)).toBe(true);
    expect(p.photoOf({ id: "a" })).toBeNull();
  });

  it("refuses non-image / non-data values and devices without an id", () => {
    const p = load({});
    expect(p.setPhoto({ id: "a" }, "javascript:alert(1)")).toBe(false);
    expect(p.setPhoto({ id: "a" }, 'data:image/jpeg;base64,AA"onerror="x')).toBe(false);
    expect(p.setPhoto({}, JPEG)).toBe(false);
  });

  it("ignores tampered stored values", () => {
    const store = { nexusDevicePhotos: JSON.stringify({ a: 'x" onerror="y' }) };
    expect(load(store).photoOf({ id: "a" })).toBeNull();
  });

  it("reports a full storage honestly", () => {
    expect(load({}, true).setPhoto({ id: "a" }, JPEG)).toBe(false);
  });

  it("is excluded from cloud sync and not part of the device record", () => {
    const sync = readFileSync(join(APP, "cloud-sync.js"), "utf8");
    expect(sync).toMatch(/nexusDevicePhotos: 1/);
  });
});
