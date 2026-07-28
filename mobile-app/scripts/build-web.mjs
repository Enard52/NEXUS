/**
 * NEXUS Mobile App — web bundle builder.
 *
 * Capacitor serves the contents of `www/` from a `https://localhost` origin
 * inside the native WebView. The real application is the shared React SPA in
 * `packages/client`; its mobile build (`vite build --mode mobile`, relative
 * base, bearer-token transport) is fully self-contained and talks to the
 * user's NEXUS core over HTTP.
 *
 * This script builds that bundle and copies it into `www/` so `cap sync`
 * ships the exact same code that the desktop shell and web /app run.
 *
 * Source (single source of truth for the app):
 *   <repo>/packages/client/dist-mobile/   (built by @nexus/client build:mobile)
 *
 * Output:
 *   <mobile-app>/www/*
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "..");
const REPO_ROOT = join(APP_ROOT, "..");
const CLIENT_DIR = join(REPO_ROOT, "packages", "client");
const SRC_BUNDLE = join(CLIENT_DIR, "dist-mobile");
const OUT_DIR = join(APP_ROOT, "www");

// 1. Build the shared React client in mobile mode (relative base, bearer auth).
console.log("building @nexus/client (mobile mode)…");
execSync("pnpm --filter @nexus/client build:mobile", { cwd: REPO_ROOT, stdio: "inherit" });

if (!existsSync(join(SRC_BUNDLE, "index.html"))) {
  throw new Error(`Client build did not produce ${SRC_BUNDLE}/index.html`);
}

// 2. Start from a clean www/ so stale files never leak into the bundle.
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });
cpSync(SRC_BUNDLE, OUT_DIR, { recursive: true });

const entries = readdirSync(OUT_DIR);
console.log(`copied ${entries.length} entries -> www/ (${entries.join(", ")})`);
console.log("\nBundle ready in mobile-app/www/. Run `npx cap sync` next.");
