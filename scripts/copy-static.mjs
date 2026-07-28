import { mkdirSync, cpSync, rmSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const publicDir = join(root, "public");

// Keep installer artifacts (public/downloads) stable across builds. Everything
// else in public/ is a build mirror of packages/web/dist (the marketing site)
// and is regenerated from scratch on every run. The desktop and mobile
// applications are NOT static HTML anymore: desktop Electron loads the React
// SPA at /app (setup wizard pages ship inside the app bundle, see
// scripts/copy-desktop-resources.mjs) and mobile Capacitor bundles the same
// SPA via mobile-app/scripts/build-web.mjs — so no desktop/mobile HTML is
// mirrored into public/ at all.
const PRESERVE = new Set(["downloads"]);

if (existsSync(publicDir)) {
  for (const entry of readdirSync(publicDir)) {
    if (PRESERVE.has(entry)) continue;
    rmSync(join(publicDir, entry), { recursive: true, force: true });
  }
}

mkdirSync(publicDir, { recursive: true });

// Copy the marketing website to public/.
cpSync(join(root, "packages", "web", "dist"), publicDir, { recursive: true });

// Keep the generated pages fully offline and available to server-rendered routes.
await import("./copy-fonts.mjs");
cpSync(join(root, "packages", "web", "dist", "fonts"), join(publicDir, "fonts"), {
  recursive: true,
});

console.log("Copied static assets to public/");
