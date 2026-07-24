import { mkdirSync, cpSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const publicDir = join(root, "public");

// Clear existing public directory
rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });

// Copy web demo to public
cpSync(join(root, "packages", "web", "dist"), publicDir, { recursive: true });

// Copy desktop demo to public/desktop
cpSync(join(root, "packages", "desktop", "dist"), join(publicDir, "desktop"), { recursive: true });

console.log("Copied static assets to public/");
