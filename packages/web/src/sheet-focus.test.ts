import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SRC = readFileSync(resolve(ROOT, "src/app/sheet-focus.js"), "utf8");
const CSS = readFileSync(resolve(ROOT, "css/nexus-ui.css"), "utf8");

function load(): { nextFocusIndex(c: number, n: number, s: boolean): number | null } {
  const win: Record<string, unknown> = {};
  // Tarayici API'leri yok: modul yalnizca saf yardimciyi dis dunyaya acar.
  const doc = { addEventListener() {}, body: null };
  new Function("window", "document", "MutationObserver", SRC)(win, doc, undefined);
  return win.NexusSheetFocus as ReturnType<typeof load>;
}

describe("sheet-focus: Tab dongusu", () => {
  const { nextFocusIndex } = load();
  it("son ogede Tab basa sarar", () => {
    expect(nextFocusIndex(2, 3, false)).toBe(0);
  });
  it("ilk ogede Shift+Tab sona sarar", () => {
    expect(nextFocusIndex(0, 3, true)).toBe(2);
  });
  it("ortadaki ogede dogal Tab birakilir", () => {
    expect(nextFocusIndex(1, 3, false)).toBeNull();
    expect(nextFocusIndex(1, 3, true)).toBeNull();
  });
  it("odak cekmece disindaysa iceri cekilir", () => {
    expect(nextFocusIndex(-1, 3, false)).toBe(0);
    expect(nextFocusIndex(-1, 3, true)).toBe(2);
  });
  it("odaklanabilir oge yoksa null", () => {
    expect(nextFocusIndex(-1, 0, false)).toBeNull();
  });
});

describe("sheet-focus: baglanti ve CSS", () => {
  it("cekmece rol/aria-modal verir ve tema tarafindan yuklenir", () => {
    expect(SRC).toContain("aria-modal");
    expect(readFileSync(resolve(ROOT, "src/app/theme.js"), "utf8")).toContain("sheet-focus.js");
    expect(readFileSync(resolve(ROOT, "src/app/sw.js"), "utf8")).toContain("sheet-focus.js");
  });
  it("odak halkasi vurgu degiskenini kullanir, fareyle tiklamada cikmaz", () => {
    expect(CSS).toMatch(
      /a:focus-visible, button:focus-visible, \[role="button"\]:focus-visible \{[^}]*--nx-accent-rgbc/,
    );
    expect(CSS).toMatch(/\[role="button"\]:focus:not\(:focus-visible\)/);
  });
});
