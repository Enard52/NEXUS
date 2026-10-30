// Sayfa başlığı geometrisi (#88): dikey boşluk ve yan boşluk ortak CSS'ten gelir; ekran başına sapma olmamalı.
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "..", "..", "..");
const APP = join(ROOT, "src", "app");

describe("sayfa başlığı geometrisi", () => {
  it("ortak CSS pt-12/pt-14 başlıklarına aynı yan boşluğu ve en az yüksekliği verir", () => {
    const css = readFileSync(join(ROOT, "css", "nexus-ui.css"), "utf8");
    expect(css).toMatch(/header\.pt-12, header\.pt-14 \{ padding-left: 1\.25rem; padding-right: 1\.25rem; \}/);
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
          if (c.some((x) => /^(py-\d+|pt-(?!12$|14$)\d+)$/.test(x) && x !== "py-4")) bad.push(n + ": " + m[1]);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
