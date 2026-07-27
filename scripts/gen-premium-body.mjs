// Generator: extracts the premium homepage <body> from public/index.html and
// writes packages/server/src/marketing-premium-body.ts as a parametrized
// renderer. Dynamic parts (language menu, current language code, download
// versions/links) become template parameters; unsafe inline onerror handlers
// are stripped and replaced by a scripted listener appended at the end.
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("public/index.html", "utf8");
const bodyStart = src.indexOf("<body>") + "<body>".length;
const bodyEnd = src.lastIndexOf("</body>");
if (bodyStart < 6 || bodyEnd < 0) throw new Error("body not found");
let body = src.slice(bodyStart, bodyEnd);

const problems = [];
function count(haystack, needle) {
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    n += 1;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return n;
}
function replaceExpect(needle, replacement, expected) {
  const n = count(body, needle);
  if (n !== expected) {
    problems.push(`expected ${expected}x but found ${n}x: ${needle.slice(0, 80)}`);
    return;
  }
  body = body.split(needle).join(replacement);
}

// 1) Remove unsafe inline handlers (20 integration logos).
const ONERROR = ' onerror="this.hidden=true;this.nextElementSibling.hidden=false"';
const onerrorCount = count(body, ONERROR);
if (onerrorCount !== 20) problems.push(`onerror count ${onerrorCount} != 20`);
body = body.split(ONERROR).join("");
if (body.includes("onerror")) problems.push("stray onerror remains");

// 2) Escape for a TS template literal BEFORE inserting ${...} placeholders.
body = body.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

// 3) Dynamic parts.
// 3a) Language menu block -> dyn.langMenu (renderer marks the active locale).
const menuOpen = '<div class="language-menu" role="menu">';
const menuStart = body.indexOf(menuOpen);
if (menuStart === -1) {
  problems.push("language-menu block not found");
} else {
  const menuClose = body.indexOf("</div>", menuStart);
  const block = body.slice(menuStart, menuClose + "</div>".length);
  if (!block.includes('?lang=vi')) problems.push("language-menu block looks truncated");
  body = body.slice(0, menuStart) + "${dyn.langMenu}" + body.slice(menuClose + "</div>".length);
}

// 3b) Current language code chip.
replaceExpect("<span>EN</span>", "<span>${dyn.langCode}</span>", 1);

// 3c) Download versions + links come from demoReleases() at render time.
replaceExpect(
  '<span class="version">Version 3.14.2 · x64</span>',
  '<span class="version">${dyn.winVersion}</span>',
  1,
);
replaceExpect(
  '<span class="version">Version 3.14.1 · Universal</span>',
  '<span class="version">${dyn.macVersion}</span>',
  1,
);
replaceExpect(
  '<span class="version">Version 3.13.8 · AppImage</span>',
  '<span class="version">${dyn.linuxVersion}</span>',
  1,
);
replaceExpect('href="/downloads/NEXUS-Setup-3.14.2.exe"', 'href="${dyn.winHref}"', 1);
replaceExpect('href="/downloads/NEXUS-3.14.1.dmg"', 'href="${dyn.macHref}"', 1);
replaceExpect('href="/downloads/NEXUS-3.13.8.AppImage"', 'href="${dyn.linuxHref}"', 1);

// 4) Scripted replacement for the removed inline onerror handlers.
const fallbackScript = `
  <script>
    (function () {
      document.querySelectorAll(".integration-logo").forEach(function (img) {
        function fail() {
          img.hidden = true;
          var fb = img.nextElementSibling;
          if (fb) fb.hidden = false;
        }
        img.addEventListener("error", fail);
        if (img.complete && img.naturalWidth === 0) fail();
      });
    })();
  </script>
`;
body = body.trimEnd() + "\n" + fallbackScript;

if (problems.length > 0) {
  console.error("GENERATION PROBLEMS:\n" + problems.join("\n"));
  process.exit(1);
}

const out = `/**
 * NEXUS AI — Premium marketing homepage body (generated).
 *
 * Extracted verbatim from the approved premium landing design. Inline
 * onerror handlers were removed in favor of the scripted listener appended
 * at the end of the body. Dynamic parts (language menu, active language
 * code, download versions and links) are injected by the caller.
 *
 * Regenerate with: node scripts/gen-premium-body.mjs
 */

export interface PremiumDynamicParts {
  /** Uppercase short code shown in the language button, e.g. "EN". */
  langCode: string;
  /** Full \`<div class="language-menu" ...>\` block with the active entry marked. */
  langMenu: string;
  winVersion: string;
  macVersion: string;
  linuxVersion: string;
  winHref: string;
  macHref: string;
  linuxHref: string;
}

export function renderPremiumBody(dyn: PremiumDynamicParts): string {
  return \`${body}\`;
}
`;

writeFileSync("packages/server/src/marketing-premium-body.ts", out, "utf8");
console.log("wrote packages/server/src/marketing-premium-body.ts", out.length, "bytes");
