import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSetupDocument } from "./index.js";
import { renderDesktopPremiumDocument } from "./premium.js";

const { setLocale } = await import("@nexus/web");

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "dist");
// Clear stale build output (e.g. orphan root index.html from older layouts) so only current pages ship.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const pages: ReadonlyArray<{ file: string; theme: "dark" | "light" }> = [
  { file: "index.html", theme: "dark" },
  { file: "setup.html", theme: "dark" },
  { file: "light.html", theme: "light" },
  { file: "setup-light.html", theme: "light" },
];

for (const loc of ["en", "tr"] as const) {
  setLocale(loc);
  for (const os of ["windows", "mac", "linux"] as const) {
    const locDir = join(outDir, loc === "en" ? os : `${loc}/${os}`);
    mkdirSync(locDir, { recursive: true });
    for (const page of pages) {
      // Every OS ships the same approved premium main shell (only the OS
      // mentions differ); setup pages keep the dedicated wizard renderer.
      const html = page.file.startsWith("setup")
        ? renderSetupDocument({ theme: page.theme, os })
        : renderDesktopPremiumDocument({ theme: page.theme, locale: loc, os });
      writeFileSync(join(locDir, page.file), html, "utf8");
      // eslint-disable-next-line no-console
      console.log(
        `wrote ${join(loc === "en" ? `dist/${os}` : `dist/${loc}/${os}`, page.file)} (${html.length} bytes, ${page.theme} theme, ${os})`,
      );
    }
  }
}
