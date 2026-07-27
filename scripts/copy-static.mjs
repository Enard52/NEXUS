import { mkdirSync, cpSync, rmSync, existsSync, readdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const publicDir = join(root, "public");
const shouldSyncMobile = process.env.NEXUS_SYNC_MOBILE === "1";

function warnSync(target, envVar, destination) {
  console.warn(
    `[copy-static] WARNING: ${envVar}=1, overwriting ${destination} from generated ${target}.`,
  );
}

// Keep installer artifacts (public/downloads) and in-progress mobile design
// work stable across builds. Desktop is intentionally NOT preserved anymore —
// see the duplicate-file rule below: public desktop copies are pure build
// mirrors and are re-generated on every build:static run.
const PRESERVE = new Set(["downloads", "mobile"]);

if (existsSync(publicDir)) {
  for (const entry of readdirSync(publicDir)) {
    if (PRESERVE.has(entry)) continue;
    rmSync(join(publicDir, entry), { recursive: true, force: true });
  }
}

mkdirSync(publicDir, { recursive: true });

// Copy the web demo to public/.
cpSync(join(root, "packages", "web", "dist"), publicDir, { recursive: true });

const desktopPublicDir = join(publicDir, "desktop");
const mobilePublicDir = join(publicDir, "mobile");
const desktopAliasPath = join(publicDir, "desktop-home.html");

if (shouldSyncMobile) {
  console.warn("[copy-static] WARNING: forced sync flags are active during this build.");
}

// ── Desktop duplicate-file rule ─────────────────────────────────────────────
// Single source of truth for the desktop shell: packages/desktop/src
// (premium-body.ts / premium-css.ts / premium-script.ts / premium.ts, plus
// setup.ts for the wizard). `pnpm build:static` renders it into
// packages/desktop/dist, and this script mirrors that build output verbatim to:
//   - public/desktop/**          (EN/TR × windows/mac/linux platform variants)
//   - public/desktop-home.html   (the :4179 preview canonical — same bytes as
//                                 the generated Windows dark shell)
// The public copies are downstream mirrors and must NEVER be hand-edited; any
// visual change goes into packages/desktop/src and flows through the build.
// Desktop sync used to be opt-in behind NEXUS_SYNC_DESKTOP /
// NEXUS_SYNC_DESKTOP_ALIAS to protect hand-edits in public/ — those hand-edits
// no longer exist, so the sync is now unconditional to guarantee a plain
// build:static can never leave the public desktop surfaces stale.
rmSync(desktopPublicDir, { recursive: true, force: true });
cpSync(join(root, "packages", "desktop", "dist"), desktopPublicDir, { recursive: true });
console.log("Synced desktop static assets to public/desktop/");

if (shouldSyncMobile || !existsSync(mobilePublicDir)) {
  if (shouldSyncMobile) {
    warnSync("packages/mobile/dist", "NEXUS_SYNC_MOBILE", "public/mobile/");
  }
  cpSync(join(root, "packages", "mobile", "dist"), mobilePublicDir, { recursive: true });
  console.log("Synced mobile static assets to public/mobile/");
} else {
  console.log("Preserved existing public/mobile/ (set NEXUS_SYNC_MOBILE=1 to overwrite)");
}

// desktop-home.html is the :4179 preview canonical: always the exact bytes of
// the generated Windows dark shell (see the duplicate-file rule above).
copyFileSync(join(root, "packages", "desktop", "dist", "windows", "index.html"), desktopAliasPath);
console.log("Synced desktop alias to public/desktop-home.html");

// Keep the generated pages fully offline and available to server-rendered routes.
await import("./copy-fonts.mjs");
cpSync(join(root, "packages", "web", "dist", "fonts"), join(publicDir, "fonts"), { recursive: true });

console.log("Copied static assets to public/");
