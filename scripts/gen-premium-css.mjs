// Generator: pulls the premium homepage CSS out of public/index.html and
// writes it verbatim into packages/server/src/marketing-premium-css.ts.
//
// NOTE: since the premium port, public/index.html is itself generated from
// marketing-premium-css.ts + marketing-premium-body.ts. The TS modules are
// the source of truth now; only re-run this after an intentional hand-edit
// of public/index.html that should be adopted back into the source.
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("public/index.html", "utf8");
const start = src.indexOf("<style>") + "<style>".length;
const end = src.indexOf("</style>");
if (start < 7 || end < 0 || end <= start) throw new Error("style block not found");
let css = src.slice(start, end);

// Escape for a TS template literal.
css = css.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

const out = `/**
 * NEXUS AI — Premium marketing homepage stylesheet.
 *
 * Extracted verbatim from the approved premium landing design so the source
 * renderer (renderMarketingPremiumDocument) reproduces the exact visual
 * identity. Includes its own font-faces, dark/light theme variables via
 * [data-theme], and all section styles. Do not hand-edit generated blocks
 * casually; keep changes small and screenshot-verified.
 *
 * Regenerate with: node scripts/gen-premium-css.mjs
 */

export function marketingPremiumCss(): string {
  return PREMIUM_CSS;
}

const PREMIUM_CSS = \`${css}\`;
`;

writeFileSync("packages/server/src/marketing-premium-css.ts", out, "utf8");
console.log("wrote packages/server/src/marketing-premium-css.ts", out.length, "bytes");
