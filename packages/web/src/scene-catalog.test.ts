import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Hazır senaryolar (device-controls.js SCENES) ve görünüm bilgisi (quick-scenes.js META/ORDER) birlikte durur:
 * her senaryonun kartı vardır, tek amaçlı senaryolar yalnız ilgili cihaz türüne dokunur ve
 * hiçbir senaryo kilidi açmaz ya da prizleri kapatmaz.
 */
const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "src", "app");
const controls = readFileSync(join(APP, "device-controls.js"), "utf8");
const block = controls.slice(
  controls.indexOf("var SCENES = {"),
  controls.indexOf("// Senaryoyu uygular"),
);
type Act = [string, unknown];
const SCENES = new Function("hasFeature", block + "; return SCENES;")(() => true) as Record<
  string,
  { title: string; act: (k: string, d: unknown) => Act[] | undefined }
>;
const quick = readFileSync(join(APP, "quick-scenes.js"), "utf8");
const ORDER = JSON.parse(
  (quick.match(/var ORDER = (\[[\s\S]*?\]);/) as RegExpMatchArray)[1].replace(/\s+/g, " "),
) as string[];

const KINDS = [
  "light",
  "cover",
  "ac",
  "thermostat",
  "media",
  "lock",
  "vacuum",
  "purifier",
  "energy",
  "camera",
  "motion",
];
const acts = (id: string, k: string) => SCENES[id].act(k, {}) || [];

describe("hazır senaryo kataloğu", () => {
  it("kart sırasındaki her senaryo gerçekten tanımlı", () => {
    for (const id of ORDER) expect(SCENES[id], id).toBeTruthy();
    expect(ORDER.length).toBeGreaterThanOrEqual(21);
  });

  it("hiçbir senaryo kilidi açmaz, prizi (energy) kapatmaz", () => {
    for (const id of Object.keys(SCENES)) {
      expect(
        acts(id, "lock").some((a) => a[0] === "locked" && a[1] === false),
        id,
      ).toBe(false);
      expect(
        acts(id, "energy").some((a) => a[0] === "switch" && a[1] === false),
        id,
      ).toBe(false);
    }
  });

  it("tek amaçlı senaryolar yalnız kendi cihaz türüne dokunur", () => {
    const only: Record<string, string[]> = {
      "all-lights-on": ["light"],
      "all-lights-off": ["light"],
      reading: ["light"],
      dinner: ["light"],
      "curtains-open": ["cover"],
      "curtains-close": ["cover"],
      "lock-doors": ["lock"],
      "energy-save": ["light", "media"],
    };
    for (const [id, kinds] of Object.entries(only))
      for (const k of KINDS) expect(acts(id, k).length > 0, id + "/" + k).toBe(kinds.includes(k));
    // Enerji tasarrufu klimaya dokunmaz
    expect(acts("energy-save", "ac")).toEqual([]);
  });
});
