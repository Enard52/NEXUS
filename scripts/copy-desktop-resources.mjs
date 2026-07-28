// NEXUS AI - copy built server bundle + desktop HTML into desktop-app/ so
// electron-builder packages them (via the `server/**` and `desktop-html/**`
// entries in desktop-app/package.json `files` + `extraResources`).
//
// Run after `pnpm build:static` (produces packages/desktop/dist) and
// `pnpm --filter @nexus/server build` (produces packages/server/dist).
import { cpSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const serverDist = join(root, "packages", "server", "dist");
const desktopDist = join(root, "packages", "desktop", "dist");
const desktopApp = join(root, "desktop-app");
const serverTarget = join(desktopApp, "server");
const htmlTarget = join(desktopApp, "desktop-html");

if (!existsSync(serverDist)) {
  throw new Error(
    "packages/server/dist not found — run `pnpm --filter @nexus/server build` first.",
  );
}
if (!existsSync(desktopDist)) {
  throw new Error("packages/desktop/dist not found — run `pnpm build:static` first.");
}

rmSync(serverTarget, { recursive: true, force: true });
rmSync(htmlTarget, { recursive: true, force: true });
mkdirSync(serverTarget, { recursive: true });
mkdirSync(htmlTarget, { recursive: true });

cpSync(join(serverDist, "main.cjs"), join(serverTarget, "main.cjs"));
cpSync(desktopDist, htmlTarget, { recursive: true });

console.log("✓ Copied server bundle → desktop-app/server/main.cjs");
console.log("✓ Copied desktop HTML → desktop-app/desktop-html/");
