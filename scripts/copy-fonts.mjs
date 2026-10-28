import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const destination = join(root, "packages", "web", "dist", "fonts");
mkdirSync(destination, { recursive: true });

/**
 * NEXUS brand fonts (self-hosted, offline-capable):
 *   - Space Grotesk  : primary display / UI font  (weights 300-700)
 *   - Inter          : secondary / body font       (weights 400-800)
 *   - JetBrains Mono : monospace / code font       (weights 400-700)
 *
 * pnpm may hoist packages to different node_modules directories depending on
 * which workspace package declared them. We try the most specific location
 * first (packages/web/node_modules) then fall back to the root.
 */

/** Find the installed @fontsource/<family> files directory. */
function fontsourceFiles(family) {
  const candidates = [
    join(root, "packages", "web", "node_modules", "@fontsource", family, "files"),
    join(root, "node_modules", "@fontsource", family, "files"),
    join(
      root,
      "node_modules",
      ".pnpm",
      `@fontsource+${family}@*`,
      "node_modules",
      "@fontsource",
      family,
      "files",
    ),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(
    `@fontsource/${family} not found. Run: pnpm add --filter @nexus/web @fontsource/${family}`,
  );
}

const FONTS = [
  // Space Grotesk: 300–700, subsets latin + latin-ext
  { family: "space-grotesk", weights: [300, 400, 500, 600, 700], subsets: ["latin", "latin-ext"] },
  // Inter: 400–800, subsets latin + latin-ext
  { family: "inter", weights: [400, 500, 600, 700, 800], subsets: ["latin", "latin-ext"] },
  // JetBrains Mono: 400–700, subsets latin + latin-ext
  { family: "jetbrains-mono", weights: [400, 500, 600, 700], subsets: ["latin", "latin-ext"] },
];

let copied = 0;
for (const { family, weights, subsets } of FONTS) {
  const filesDir = fontsourceFiles(family);
  for (const weight of weights) {
    for (const subset of subsets) {
      const filename = `${family}-${subset}-${weight}-normal.woff2`;
      const source = join(filesDir, filename);
      const target = join(destination, filename);
      if (existsSync(source)) {
        copyFileSync(source, target);
        copied++;
      } else {
        console.warn(`  ⚠ missing: ${filename}`);
      }
    }
  }
}

console.log(`✓ Copied ${copied} NEXUS brand font files to packages/web/dist/fonts/`);
