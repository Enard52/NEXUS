import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSetupDocument } from "./index.js";

const { setLocale } = await import("@nexus/web");

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "dist");
// Clear stale build output (e.g. removed static preview shells) so only the
// real, functional setup wizard pages ship with the Electron app.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Only the first-run setup wizard is a static page: Electron loads it before
// the local core is provisioned (see desktop-app/main.cjs SETUP_BASE lookup).
// The application UI itself is the React SPA served at /app — no static
// preview shells are generated anymore.
const pages: ReadonlyArray<{ file: string; theme: "dark" | "light" }> = [
  { file: "setup.html", theme: "dark" },
  { file: "setup-light.html", theme: "light" },
];

for (const loc of ["en", "tr"] as const) {
  setLocale(loc);
  for (const os of ["windows", "mac", "linux"] as const) {
    const locDir = join(outDir, loc === "en" ? os : `${loc}/${os}`);
    mkdirSync(locDir, { recursive: true });
    for (const page of pages) {
      const html = renderSetupDocument({ theme: page.theme, os });
      writeFileSync(join(locDir, page.file), html, "utf8");
      // eslint-disable-next-line no-console
      console.log(
        `wrote ${join(loc === "en" ? `dist/${os}` : `dist/${loc}/${os}`, page.file)} (${html.length} bytes, ${page.theme} theme, ${os})`,
      );
    }
  }
}
