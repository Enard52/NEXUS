import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Erisilebilirlik koruyucusu (#75): src/app/*.html icinde
 *  1) yalnizca ikon iceren <button>/<a> mutlaka aria-label / title / aria-labelledby tasir,
 *  2) onclick tasiyan etkilesimsiz etiketler (div/span/section...) role + tabindex tasir
 *     (tam ekran arka plan/overlay katmanlari ve stopPropagation sarmalayicilari haric).
 */

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "src", "app");
const FILES = readdirSync(APP_DIR).filter((n) => n.endsWith(".html"));

function lineOf(src: string, index: number): number {
  return src.slice(0, index).split("\n").length;
}

export function findUnlabelledIconControls(src: string): number[] {
  const hits: number[] = [];
  const re = /<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const attrs = m[2];
    const inner = m[3];
    if (/\b(aria-label|aria-labelledby|title)\s*=/.test(attrs)) continue;
    if (/\baria-hidden\s*=\s*"true"/.test(attrs)) continue;
    if (/<img\b[^>]*\balt\s*=\s*"[^"]+"/i.test(inner)) continue;
    const text = inner
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&[a-z#0-9]+;/gi, "")
      .trim();
    if (text) continue;
    hits.push(lineOf(src, m.index));
  }
  return hits;
}

export function findInaccessibleClickables(src: string): number[] {
  const hits: number[] = [];
  const re = /<(div|span|li|p|section|article|img|svg|i|label)\b([^<>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const attrs = m[2];
    if (!/\bonclick\s*=/.test(attrs)) continue;
    if (/\brole\s*=/.test(attrs) && /\btabindex\s*=/.test(attrs)) continue;
    if (/\baria-hidden\s*=\s*"true"/.test(attrs)) continue;
    if (/stopPropagation/.test(attrs)) continue;
    if (/\binset-0\b/.test(attrs) || /backdrop|overlay/i.test(attrs)) continue;
    hits.push(lineOf(src, m.index));
  }
  return hits;
}

describe("a11y: src/app/*.html", () => {
  it("scans the html files", () => {
    expect(FILES.length).toBeGreaterThan(20);
  });

  it("detector flags an unlabelled icon button and accepts labelled ones", () => {
    expect(findUnlabelledIconControls('<button><svg></svg></button>')).toEqual([1]);
    expect(findUnlabelledIconControls('<button aria-label="Kapat"><svg></svg></button>')).toEqual([]);
    expect(findUnlabelledIconControls('<a href="#">Geri</a>')).toEqual([]);
    expect(findInaccessibleClickables('<div onclick="x()">a</div>')).toEqual([1]);
    expect(findInaccessibleClickables('<div role="button" tabindex="0" onclick="x()">a</div>')).toEqual([]);
  });

  for (const file of FILES) {
    it(`${file}: icon-only buttons/links have an accessible name`, () => {
      const src = readFileSync(resolve(APP_DIR, file), "utf8");
      expect(findUnlabelledIconControls(src).map((l) => `${file}:${l}`)).toEqual([]);
    });
    it(`${file}: clickable non-button elements have role and tabindex`, () => {
      const src = readFileSync(resolve(APP_DIR, file), "utf8");
      expect(findInaccessibleClickables(src).map((l) => `${file}:${l}`)).toEqual([]);
    });
  }
});
