// Quick consistency check for regenerated static pages in public/.
import { readFileSync, readdirSync, existsSync } from "node:fs";

const pages = ["public/index.html", "public/light.html", "public/tr/index.html"];
let ok = true;

console.log(
  "downloads dir:",
  existsSync("public/downloads") ? readdirSync("public/downloads") : "MISSING",
);

for (const p of pages) {
  const html = readFileSync(p, "utf8");
  const cdn = (html.match(/cdn\.nexus-ai\.com/g) || []).length;
  const dl = [...new Set(html.match(/\/downloads\/NEXUS[^"']+/g) || [])];
  const qr = html.includes("openQrModal") && html.includes("qr-modal");
  console.log(`\n${p}`);
  console.log("  cdn.nexus-ai.com refs:", cdn);
  console.log("  local download links:", dl);
  console.log("  QR modal present:", qr);
  if (cdn > 0 || !qr || dl.length === 0) ok = false;
}

console.log(ok ? "\nAll static pages consistent." : "\nINCONSISTENCIES FOUND");
process.exit(ok ? 0 : 1);
