// Extract titlebar markup + translatable attributes from the premium desktop page.
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("public/desktop-home.html", "utf8");
const out = [];

// Body-region only (before the big script)
const bodyStart = src.indexOf("<body");
const scriptIdx = src.indexOf("<script>", 500000);
const body = src.slice(bodyStart, scriptIdx);

// 1) Titlebar markup
const tb = body.indexOf("titlebar");
out.push("=== titlebar markup ===");
out.push(body.slice(tb - 60, tb + 2200));

// 2) Translatable attributes
out.push("\n=== attributes ===");
for (const attr of ["aria-label", "placeholder", "title", "alt", "aria-live"]) {
  const vals = new Set([...body.matchAll(new RegExp(attr + '="([^"]+)"', "g"))].map((m) => m[1]));
  out.push(`${attr} (${vals.size}):`);
  for (const v of vals) out.push("  " + v);
}

// 3) data-* hooks the script relies on (for renderer awareness)
const dataAttrs = new Set([...body.matchAll(/\sdata-([a-z-]+)=/g)].map((m) => m[1]));
out.push("\n=== data-* attrs ===\n" + [...dataAttrs].join(", "));

// 4) ids
const ids = [...body.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
out.push("\n=== ids (" + ids.length + ") ===\n" + ids.join(", "));

// 5) Script-embedded user-visible strings? sample the non-base64 part of script
const script = src.slice(scriptIdx, src.indexOf("</script>", scriptIdx));
const scriptNoB64 = script.replace(/"data:image\/webp;base64,[^"]+"/g, '"IMG"');
writeFileSync("scripts/tmp-an4-script.js", scriptNoB64, "utf8");
out.push("\nscript without b64: " + scriptNoB64.length + " chars (saved tmp-an4-script.js)");

writeFileSync("scripts/tmp-an4-out.txt", out.join("\n"), "utf8");
console.log("done");
