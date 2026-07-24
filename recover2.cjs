const fs = require("fs");
let oldHistory = fs.readFileSync(".history/packages/web/src/render_20260723203733.ts", "utf8");
if (!oldHistory.endsWith("}")) {
  oldHistory += "\n    </svg>`;\n}\n\n";
}

const fixScript = fs.readFileSync(
  "C:/Users/ensar/.gemini/antigravity/brain/f2a0d4be-b441-47c4-a125-7b52d8ad09f8/scratch/fix_render_exact.js",
  "utf8",
);
const startIdx = fixScript.indexOf("const cleanFeatures = `") + 23;
const endIdx = fixScript.lastIndexOf("`;\n\nfs.writeFileSync");
let extracted = fixScript.substring(startIdx, endIdx).replace(/\\`/g, "`");

let full = oldHistory + extracted;

full = full.replace(/>NEXUS</g, ">Nexus<");
full = full.replace(/NEXUS AI/g, "Nexus AI");
full = full.replace(
  /\.form-input \{/g,
  ".form-input { text-overflow: ellipsis; white-space: nowrap; overflow: hidden;",
);
full = full.replace(/escapeHtml\(c\.labelKey\)/g, "escapeHtml(label(c.labelKey))");
full = full.replace(
  /💰/g,
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right:4px;vertical-align:-2px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
);

// Fix escape string literals properly using simple substring replacement
full = full.replace('.replace(/"/g, """)', '.replace(/"/g, "&quot;")');
full = full.replace('.replace(/</g, "<")', '.replace(/</g, "&lt;")');
full = full.replace('.replace(/>/g, ">")', '.replace(/>/g, "&gt;")');

fs.writeFileSync("packages/web/src/render.ts", full, "utf8");
console.log("Success!");
