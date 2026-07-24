const fs = require("fs");
const txt = fs.readFileSync("C:/Users/ensar/.gemini/antigravity/brain/f2a0d4be-b441-47c4-a125-7b52d8ad09f8/scratch/fix_render_exact.js", "utf8");

let startIdx = txt.indexOf('const cleanFeatures = `') + 23;
let endIdx = txt.lastIndexOf('`;\n\nfs.writeFileSync');
let extracted = txt.substring(startIdx, endIdx);
extracted = extracted.replace(/\\`/g, "`");

const oldHistory = fs.readFileSync(".history/packages/web/src/render_20260723203733.ts", "utf8");

const renderFeaturesIdx = oldHistory.indexOf('export function renderFeatures');
let topPortion = oldHistory.substring(0, renderFeaturesIdx);

let fullFile = topPortion + extracted;

// Apply the user's specific fixes
fullFile = fullFile.replace(/>NEXUS</g, ">Nexus<");
fullFile = fullFile.replace(/NEXUS AI/g, "Nexus AI");
fullFile = fullFile.replace(/\.form-input \{/g, ".form-input { text-overflow: ellipsis; white-space: nowrap; overflow: hidden;");
fullFile = fullFile.replace(/escapeHtml\(c\.labelKey\)/g, "escapeHtml(label(c.labelKey))");

// The dollar sign or emoji
const playSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right:4px;vertical-align:-2px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
fullFile = fullFile.replace(/💰/g, playSvg);

fs.writeFileSync("packages/web/src/render.ts", fullFile, "utf8");
console.log("Recovered render.ts completely!");
