// Cihaz raporlarından (label: device-report) docs/COMPATIBILITY.md içindeki "reports" bölümünü üretir.
// Kullanım: node scripts/compat-matrix.mjs   (gh CLI oturumu açık olmalı)
// Yalnızca issue formundaki alanları okur; gizli bilgi toplamaz. Rapor yoksa "No device reports yet." yazar.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOC = join(ROOT, "docs", "COMPATIBILITY.md");
const START = "<!-- compat-reports:start -->";
const END = "<!-- compat-reports:end -->";

function field(body, heading) {
  const m = new RegExp(`### ${heading.replace(/[()]/g, "\\$&")}\\s*\\n+([^\\n]+)`).exec(body || "");
  return m ? m[1].trim() : "";
}

const raw = execFileSync(
  "gh",
  ["issue", "list", "--repo", "Enard52/NEXUS", "--label", "device-report", "--state", "all", "--limit", "200", "--json", "number,body,state"],
  { encoding: "utf8" },
);
const rows = JSON.parse(raw)
  .map((i) => ({
    n: i.number,
    device: field(i.body, "Device (brand, model)"),
    connector: field(i.body, "Connector used in NEXUS"),
    result: field(i.body, "Overall result"),
    version: field(i.body, "NEXUS version"),
  }))
  .filter((r) => r.device && r.connector && r.result)
  .sort((a, b) => a.connector.localeCompare(b.connector) || a.device.localeCompare(b.device));

const esc = (s) => s.replace(/\|/g, "\\|");
const table = rows.length
  ? [
      "| Connector | Device | Result | NEXUS | Report |",
      "| --- | --- | --- | --- | --- |",
      ...rows.map((r) => `| ${esc(r.connector)} | ${esc(r.device)} | ${esc(r.result)} | ${esc(r.version)} | [#${r.n}](https://github.com/Enard52/NEXUS/issues/${r.n}) |`),
    ].join("\n")
  : "_No device reports yet._";

const doc = readFileSync(DOC, "utf8");
const a = doc.indexOf(START);
const b = doc.indexOf(END);
if (a < 0 || b < 0) throw new Error("COMPATIBILITY.md içinde compat-reports işaretleri yok");
writeFileSync(DOC, `${doc.slice(0, a + START.length)}\n\n${table}\n\n${doc.slice(b)}`);
console.log(`${rows.length} rapor yazıldı → docs/COMPATIBILITY.md`);
