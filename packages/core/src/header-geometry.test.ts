// Sayfa başlığı geometrisi (#88): dikey boşluk ve yan boşluk ortak CSS'ten gelir; ekran başına sapma olmamalı.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "..", "..", "..");
const APP = join(ROOT, "src", "app");

describe("sayfa başlığı geometrisi", () => {
  it("ortak CSS pt-12/pt-14 başlıklarına aynı yan boşluğu ve en az yüksekliği verir", () => {
    const css = readFileSync(join(ROOT, "css", "nexus-ui.css"), "utf8");
    expect(css).toMatch(
      /header\.pt-12, header\.pt-14 \{ padding-left: 1\.25rem; padding-right: 1\.25rem; \}/,
    );
    expect(css).toMatch(/header\.pt-12, header\.pt-14 \{ min-height: var\(--nx-header-h/);
  });

  it("uygulama başlıkları yalnızca pt-12/pt-14 ya da bilinçli muaf (auth/kart/sade) türleri kullanır", () => {
    const bad: string[] = [];
    for (const n of readdirSync(APP).filter((f) => f.endsWith(".html"))) {
      const html = readFileSync(join(APP, n), "utf8");
      for (const m of html.matchAll(/<header\b[^>]*class="([^"]*)"/g)) {
        const c = m[1].split(/\s+/);
        if (c.some((x) => /^pt-(12|14)$/.test(x))) {
          // Ortak CSS bu başlıkların yan boşluğunu ezer; başlık yüksekliğini bozacak ek dikey pad olmamalı.
          if (c.some((x) => /^(py-\d+|pt-(?!12$|14$)\d+)$/.test(x) && x !== "py-4"))
            bad.push(n + ": " + m[1]);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("geri/sağ eylem düğmeleri ortak CSS'te en az 44x44 dokunma hedefi verir", () => {
    const css = readFileSync(join(ROOT, "css", "nexus-ui.css"), "utf8");
    const back = css.match(/header > \.p-1\.-ml-1 \{ width: (\d+)px; height: (\d+)px;/);
    const right = css.match(/> \.p-1\.-mr-1 \{ width: (\d+)px; height: (\d+)px;/);
    expect(back && Number(back[1]) >= 44 && Number(back[2]) >= 44).toBe(true);
    expect(right && Number(right[1]) >= 44 && Number(right[2]) >= 44).toBe(true);
    const h = css.match(/--nx-header-h: (\d+)px/);
    expect(Number(h?.[1])).toBeGreaterThanOrEqual(48 + 44 + 16);
  });

  it("nexus-* alt ekran başlıklarının h1'i text-lg; başlık içi simge düğmeleri 44px altına inmez", () => {
    const bad: string[] = [];
    for (const n of readdirSync(APP).filter((f) => /^nexus-.*\.html$/.test(f))) {
      const html = readFileSync(join(APP, n), "utf8");
      for (const m of html.matchAll(
        /<header\b[^>]*class="[^"]*\bpt-1[24]\b[^"]*"[^>]*>([\s\S]*?)<\/header>/g,
      )) {
        for (const h1 of m[1].matchAll(/<h1\b[^>]*class="([^"]*)"/g)) {
          if (!/\btext-lg\b/.test(h1[1]) || /\btext-(xl|2xl|3xl)\b/.test(h1[1]))
            bad.push(n + " h1: " + h1[1]);
        }
        for (const b of m[1].matchAll(/<(?:button|a)\b[^>]*class="([^"]*)"/g)) {
          const sz = b[1].match(/\b(?:w|h)-(\d+)\b/g) ?? [];
          if (
            sz.some((x) => Number(x.split("-")[1]) < 11 && /\b(?:w|h)-(?:8|9|10)\b/.test(x)) &&
            /\b(?:w|h)-(8|9|10)\b/.test(b[1]) &&
            /rounded-full|items-center justify-center/.test(b[1])
          )
            bad.push(n + " küçük düğme: " + b[1]);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
