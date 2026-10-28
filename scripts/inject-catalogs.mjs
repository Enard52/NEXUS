import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const i18nPath = path.join(__dirname, "..", "packages", "i18n", "src", "index.ts");
const catalogCode = fs.readFileSync(path.join(__dirname, "catalog-code.txt"), "utf-8");

const content = fs.readFileSync(i18nPath, "utf-8");
const lines = content.split("\n");

// Find start: line after TR catalog closing "  }," (line 729 in 0-indexed = line 730 in 1-indexed)
// Find end: the closing "};" of CATALOGS (line 1160 = "};" after vi catalog)

// Search for the "  // ── Spanish ──" line (start of partial catalogs)
let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (
    lines[i].includes("// ── Spanish") ||
    lines[i].includes("// ─── Spanish") ||
    (lines[i].includes("// ──") && lines[i].includes("Spanish"))
  ) {
    startIdx = i;
    break;
  }
}

// Search for the "};" that closes the CATALOGS object (after all catalogs)
let endIdx = -1;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].trim() === "};" && i > startIdx) {
    // Check if this is the CATALOGS closing
    endIdx = i;
    break;
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find catalog boundaries!", { startIdx, endIdx });
  process.exit(1);
}

console.log(`Replacing lines ${startIdx + 1} to ${endIdx + 1} (0-idx: ${startIdx}-${endIdx})`);
console.log(`Before line: ${lines[startIdx - 1]}`);
console.log(`Start line: ${lines[startIdx]}`);
console.log(`End line: ${lines[endIdx]}`);

// Build new content
const before = lines.slice(0, startIdx);
const after = lines.slice(endIdx); // Keep the "};" line

const newContent = [...before, catalogCode.trimEnd(), ...after].join("\n");
fs.writeFileSync(i18nPath, newContent, "utf-8");

const newLines = newContent.split("\n").length;
console.log(`Done! File now has ${newLines} lines (was ${lines.length})`);
