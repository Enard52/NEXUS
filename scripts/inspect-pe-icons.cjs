/**
 * PE resource inspector — lists the embedded RT_ICON entries of an .exe/.dll
 * and reports the resolution + format (PNG or DIB) of each. Proves that
 * electron-builder embedded our brand icon.ico into the built executable.
 *
 * The PE resource tree is exactly 3 levels: Type → Name/ID → Language.
 * Directory-entry offsets are RELATIVE to the resource section base.
 * IMAGE_RESOURCE_DATA_ENTRY.OffsetToData is an ABSOLUTE RVA.
 *
 * Usage:  node inspect-pe-icons.cjs <exe>
 */
const fs = require("node:fs");

const file = process.argv[2];
if (!file) {
  console.error("usage: node inspect-pe-icons.cjs <exe>");
  process.exit(1);
}
const buf = fs.readFileSync(file);

const peOff = buf.readUInt32LE(0x3c);
if (buf.toString("ascii", peOff, peOff + 4) !== "PE\0\0") {
  console.error("not a PE file");
  process.exit(1);
}
const numSections = buf.readUInt16LE(peOff + 6);
const optHdrSize = buf.readUInt16LE(peOff + 20);
const optHdrOff = peOff + 24;
const magic = buf.readUInt16LE(optHdrOff); // 0x10b PE32, 0x20b PE32+
const dataDirOff = optHdrOff + (magic >= 0x20b ? 112 : 96);
const rsrcRVA = buf.readUInt32LE(dataDirOff + 8 * 2);
const rsrcSize = buf.readUInt32LE(dataDirOff + 8 * 2 + 4);

// Find the section that backs rsrcRVA → its file offset.
const sectOff = optHdrOff + optHdrSize;
let rsrcFileOff = -1;
for (let i = 0; i < numSections; i++) {
  const s = sectOff + i * 40;
  const vSize = buf.readUInt32LE(s + 8);
  const vAddr = buf.readUInt32LE(s + 12);
  const rawSize = buf.readUInt32LE(s + 16);
  const rawPtr = buf.readUInt32LE(s + 20);
  if (vAddr <= rsrcRVA && rsrcRVA < vAddr + Math.max(vSize, rawSize)) {
    // delta = rsrcRVA - vAddr  →  add to rawPtr to get file offset of rsrc base.
    rsrcFileOff = rawPtr + (rsrcRVA - vAddr);
    break;
  }
}
if (rsrcFileOff < 0) {
  console.error("no .rsrc section found");
  process.exit(1);
}

// Resource RVA (absolute) → file offset.
const rvaToFile = (rva) => rsrcFileOff + (rva - rsrcRVA);
// Relative dir offset (from rsrc base) → file offset.
const relToFile = (rel) => rsrcFileOff + rel;

// Walk exactly 3 levels. Collect leaf data entries grouped by Name (icon group id).
function readDir(rel) {
  const base = relToFile(rel);
  const nameN = buf.readUInt16LE(base + 12);
  const idN = buf.readUInt16LE(base + 14);
  const out = [];
  for (let i = 0; i < nameN + idN; i++) {
    const e = base + 16 + i * 8;
    const idOrNameOff = buf.readUInt32LE(e);
    const offToData = buf.readUInt32LE(e + 4);
    const isData = (offToData & 0x80000000) === 0;
    const id = idOrNameOff & 0xffff;
    const isNamed = (idOrNameOff & 0x80000000) !== 0;
    let name;
    if (isNamed) {
      const so = relToFile(idOrNameOff & 0x7fffffff);
      const len = buf.readUInt16LE(so);
      name = buf.toString("utf16le", so + 2, so + 2 + len * 2);
    } else {
      name = String(id);
    }
    out.push({ name, isData, offToData });
  }
  return out;
}

// Level 0: types — we want RT_GROUP_ICON (14) and RT_ICON (3)
const typeEntries = readDir(0);

let groupIconTypes = [];
let iconType = null;
for (const t of typeEntries) {
  if (t.name === "14") groupIconTypes.push(t); // RT_GROUP_ICON
  if (t.name === "3") iconType = t; // RT_ICON
}

console.log(`${file}`);
console.log(`  .rsrc: rva=0x${rsrcRVA.toString(16)} size=${rsrcSize}`);
console.log(`  RT_GROUP_ICON groups: ${groupIconTypes.length}`);
console.log(`  RT_ICON present: ${iconType ? "yes" : "no"}`);

if (!iconType) {
  console.log("  (no icon resources embedded)");
  process.exit(0);
}

// Level 1 under RT_ICON: the icon IDs.
const iconIds = readDir(iconType.offToData & 0x7fffffff);
console.log(`  embedded icon images: ${iconIds.length}`);

for (const idEntry of iconIds) {
  // Level 2: language → leaf data entry.
  const langs = readDir(idEntry.offToData & 0x7fffffff);
  const leaf = langs[0];
  const dataEntryOff = relToFile(leaf.offToData & 0x7fffffff);
  const dataRVA = buf.readUInt32LE(dataEntryOff);
  const dataSize = buf.readUInt32LE(dataEntryOff + 4);
  const off = rvaToFile(dataRVA);
  const head = buf.slice(off, Math.min(off + 8, buf.length));
  const isPng = head.length >= 4 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  let desc;
  if (isPng) {
    const w = buf.readUInt32BE(off + 16);
    const h = buf.readUInt32BE(off + 20);
    desc = `PNG ${w}×${h}`;
  } else if (head.length >= 8) {
    const w = head.readUInt32LE(4);
    const h = Math.abs(buf.readInt32LE(off + 8)) / 2;
    desc = `DIB ${w}×${h}`;
  } else {
    desc = `? (${dataSize} bytes)`;
  }
  console.log(`    icon#${idEntry.name.padStart(2)}  ${desc}  (${dataSize} bytes)`);
}
