// Generator: splits the approved premium desktop shell (public/desktop-home.html)
// into verbatim TS modules under packages/desktop/src:
//   premium-css.ts    — the full <style> payload
//   premium-body.ts   — everything from <body …> up to the behavior <script>
//   premium-script.ts — the behavior script (includes embedded device images)
//
// NOTE: after the premium port the dist pages are generated from these modules
// via renderDesktopPremiumDocument(); they are the source of truth. Only re-run
// this after an intentional hand-edit of public/desktop-home.html that should
// be adopted back into the source.
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("public/desktop-home.html", "utf8");
if (!src.includes("Learning Thermostat 3rd")) throw new Error("unexpected input: not the premium desktop page");

const styleOpen = src.indexOf("<style>");
const styleClose = src.indexOf("</style>");
const bodyOpen = src.indexOf("<body");
const scriptOpen = src.indexOf("<script>", styleClose);
const scriptClose = src.indexOf("</script>", scriptOpen);
if ([styleOpen, styleClose, bodyOpen, scriptOpen, scriptClose].some((i) => i < 0)) {
  throw new Error("structure markers not found");
}

const css = src.slice(styleOpen + "<style>".length, styleClose);
const body = src.slice(bodyOpen, scriptOpen); // "<body …>" up to (not incl.) "<script>"
const script = src.slice(scriptOpen + "<script>".length, scriptClose);

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

const banner = (what) => `/**
 * NEXUS AI — Premium desktop shell (${what}).
 *
 * Extracted verbatim from the approved "Windows · Home Studio" premium design
 * so renderDesktopPremiumDocument() reproduces the exact visual identity.
 * Do not hand-edit generated blocks casually; keep changes small and
 * screenshot-verified.
 *
 * Regenerate with: node scripts/gen-desktop-premium.mjs
 */
`;

writeFileSync(
  "packages/desktop/src/premium-css.ts",
  banner("stylesheet") + `\nexport function desktopPremiumCss(): string {\n  return PREMIUM_CSS;\n}\n\nconst PREMIUM_CSS = \`${esc(css)}\`;\n`,
  "utf8",
);
writeFileSync(
  "packages/desktop/src/premium-body.ts",
  banner("body markup: sprite, titlebar, sidebar, views") + `\nexport function desktopPremiumBody(): string {\n  return PREMIUM_BODY;\n}\n\nconst PREMIUM_BODY = \`${esc(body)}\`;\n`,
  "utf8",
);
writeFileSync(
  "packages/desktop/src/premium-script.ts",
  banner("behavior script: navigation, assistant, devices, embedded images") + `\nexport function desktopPremiumScript(): string {\n  return PREMIUM_SCRIPT;\n}\n\nconst PREMIUM_SCRIPT = \`${esc(script)}\`;\n`,
  "utf8",
);

console.log("css:", css.length, "body:", body.length, "script:", script.length);
