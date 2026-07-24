import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const destination = join(root, "packages", "web", "dist", "fonts");
mkdirSync(destination, { recursive: true });

const weights = [400, 500, 600, 700, 800];
for (const family of ["inter", "outfit"]) {
  for (const weight of weights) {
    for (const subset of ["latin", "latin-ext"]) {
      const source = join(
        root,
        "node_modules",
        `@fontsource/${family}`,
        "files",
        `${family}-${subset}-${weight}-normal.woff2`,
      );
      const target = join(destination, `${family}-${subset}-${weight}-normal.woff2`);
      copyFileSync(source, target);
    }
  }
}

console.log(`Copied ${weights.length * 2 * 2} local NEXUS font files to packages/web/dist/fonts/`);