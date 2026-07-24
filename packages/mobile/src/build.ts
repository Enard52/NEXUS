import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderMobileDocument } from "./index.js";

const { setLocale } = await import("@nexus/web");

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "dist");
mkdirSync(outDir, { recursive: true });

const pages: ReadonlyArray<{ file: string; theme: "dark" | "light" }> = [
  { file: "index.html", theme: "dark" },
  { file: "light.html", theme: "light" },
];

for (const loc of ["en", "tr"] as const) {
  setLocale(loc);
  const locDir = join(outDir, loc === "en" ? "" : loc);
  mkdirSync(locDir, { recursive: true });
  for (const page of pages) {
    const html = renderMobileDocument({ theme: page.theme });
    writeFileSync(join(locDir, page.file), html, "utf8");
    // eslint-disable-next-line no-console
    console.log(`wrote ${join(loc === "en" ? "dist" : "dist/" + loc, page.file)} (${html.length} bytes, ${page.theme} theme)`);
  }
}
