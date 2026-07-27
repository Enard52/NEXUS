// Inspect key regions of the premium desktop page for the source port.
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("public/desktop-home.html", "utf8");
const out = [];

// 1) Light theme support in CSS?
out.push("light-theme rules: " + (src.match(/\[data-theme="light"\]/g) || []).length);

// 2) Titlebar / window controls markup
const tbIdx = src.search(/class="[^"]*titlebar|class="[^"]*wctl|window-controls|caption/i);
out.push("titlebar idx: " + tbIdx);
if (tbIdx > 0) out.push(src.slice(tbIdx - 200, tbIdx + 1400));

// 3) The full behavior script (bounded)
const sIdx = src.indexOf("<script>", 500000);
const sEnd = src.indexOf("</script>", sIdx);
out.push("--- script length: " + (sEnd - sIdx));

// 4) Distinct short text nodes (for the TR dictionary) — skip the script/style
const bodyOnly = src.slice(src.indexOf("<body"), sIdx);
const texts = new Set();
for (const m of bodyOnly.matchAll(/>([^<>{}]{2,60})</g)) {
  const t = m[1].trim();
  if (!t || /^[\d\s.,·%°:+\-–—|/]+$/.test(t) || t.length < 2) continue;
  texts.add(t);
}
out.push("--- distinct text nodes: " + texts.size);
out.push([...texts].join("\n"));

writeFileSync("scripts/tmp-an3-out.txt", out.join("\n"), "utf8");
console.log("written, texts:", texts.size, "script len:", sEnd - sIdx);
