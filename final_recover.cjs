const fs = require("fs");

// 1. Get the top portion from 203733.ts which is mostly intact but truncated at the end of renderAppIconSvg
let topPortion = fs.readFileSync(".history/packages/web/src/render_20260723203733.ts", "utf8");
if (!topPortion.endsWith("}")) {
  topPortion +=
    '\n      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>\n    </svg>`;\n}\n\n';
}

// Write this top portion to render.ts so fix_render_exact.js can read it!
fs.writeFileSync("packages/web/src/render.ts", topPortion, "utf8");

// 2. Run fix_render_exact.js logic manually to be safe
const fixScript = fs.readFileSync(
  "C:/Users/ensar/.gemini/antigravity/brain/f2a0d4be-b441-47c4-a125-7b52d8ad09f8/scratch/fix_render_exact.js",
  "utf8",
);

// The bottom portion is in fixScript as an array joined by \n
const headerCodeStart = fixScript.indexOf("const headerCode = [");
const evalScript = fixScript.substring(headerCodeStart, fixScript.indexOf("fs.writeFileSync") - 1);
// This will define `headerCode` string.
// Let's just eval it to get the string!
const CURRENT_LOCALE = "en"; // needed if there are any variables? No, the array just contains strings.
let headerCode = eval(evalScript + "\nheaderCode;");

let fullFile = topPortion + headerCode;

// 3. Apply the 4 user fixes!
fullFile = fullFile.replace(/>NEXUS</g, ">Nexus<");
fullFile = fullFile.replace(/NEXUS AI/g, "Nexus AI");
fullFile = fullFile.replace(
  /\.form-input \{/g,
  ".form-input { text-overflow: ellipsis; white-space: nowrap; overflow: hidden;",
);
fullFile = fullFile.replace(/escapeHtml\(c\.labelKey\)/g, "escapeHtml(label(c.labelKey))");
const playSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right:4px;vertical-align:-2px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
fullFile = fullFile.replace(/💰/g, playSvg);

// Fix escape string literals
fullFile = fullFile.replace('.replace(/"/g, """)', '.replace(/"/g, "&quot;")');
fullFile = fullFile.replace('.replace(/</g, "<")', '.replace(/</g, "&lt;")');
fullFile = fullFile.replace('.replace(/>/g, ">")', '.replace(/>/g, "&gt;")');

fs.writeFileSync("packages/web/src/render.ts", fullFile, "utf8");
console.log("RECOVERY COMPLETE!");
