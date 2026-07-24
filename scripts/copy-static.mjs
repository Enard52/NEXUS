import { mkdirSync, cpSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const publicDir = join(root, "public");

// Clear existing public directory
rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });

// Copy web demo to public
cpSync(join(root, "packages", "web", "dist"), publicDir, { recursive: true });

// Copy desktop and mobile demo shells to public so they can be previewed or
// distributed as static artifacts without rebuilding each time.
cpSync(join(root, "packages", "desktop", "dist"), join(publicDir, "desktop"), { recursive: true });
cpSync(join(root, "packages", "mobile", "dist"), join(publicDir, "mobile"), { recursive: true });

// Keep the generated pages fully offline and available to server-rendered routes.
await import("./copy-fonts.mjs");
cpSync(join(root, "packages", "web", "dist", "fonts"), join(publicDir, "fonts"), { recursive: true });

console.log("Copied static assets to public/");
