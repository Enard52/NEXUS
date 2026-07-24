/**
 * NEXUS AI — Tray icon generator (dependency-free)
 *
 * Produces a real 32x32 RGBA PNG tray icon (a brand-blue rounded tile with a
 * white "N") using only Node's built-in zlib — no image libraries. Run once to
 * (re)generate `assets/tray.png`. Deterministic output.
 */

const { deflateSync, crc32 } = require("node:zlib");
const { writeFileSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");

const SIZE = 32;
// Brand palette (matches the design-system primary / bg tokens).
const BRAND = [91, 141, 255, 255]; // #5b8dff
const WHITE = [255, 255, 255, 255];
const CLEAR = [0, 0, 0, 0];

function roundedTile(x, y) {
  const r = 7; // corner radius
  const inCorner =
    (x < r && y < r && (x - r) ** 2 + (y - r) ** 2 > r * r) ||
    (x >= SIZE - r && y < r && (x - (SIZE - 1 - r)) ** 2 + (y - r) ** 2 > r * r) ||
    (x < r && y >= SIZE - r && (x - r) ** 2 + (y - (SIZE - 1 - r)) ** 2 > r * r) ||
    (x >= SIZE - r &&
      y >= SIZE - r &&
      (x - (SIZE - 1 - r)) ** 2 + (y - (SIZE - 1 - r)) ** 2 > r * r);
  return !inCorner;
}

// A blocky "N": two verticals + a diagonal, drawn inside the tile.
function isGlyph(x, y) {
  const pad = 9;
  const t = 3; // stroke thickness
  if (x < pad || x > SIZE - 1 - pad || y < pad || y > SIZE - 1 - pad) return false;
  const left = x >= pad && x < pad + t;
  const right = x <= SIZE - 1 - pad && x > SIZE - 1 - pad - t;
  // Diagonal from top-left to bottom-right of the glyph box.
  const gx = x - pad;
  const gy = y - pad;
  const span = SIZE - 1 - pad - pad;
  const diag = Math.abs(gy - (gx * span) / span) < t;
  return left || right || diag;
}

const raw = Buffer.alloc(SIZE * (1 + SIZE * 4));
for (let y = 0; y < SIZE; y++) {
  const rowStart = y * (1 + SIZE * 4);
  raw[rowStart] = 0; // filter: none
  for (let x = 0; x < SIZE; x++) {
    let px = CLEAR;
    if (roundedTile(x, y)) px = isGlyph(x, y) ? WHITE : BRAND;
    const o = rowStart + 1 + x * 4;
    raw[o] = px[0];
    raw[o + 1] = px[1];
    raw[o + 2] = px[2];
    raw[o + 3] = px[3];
  }
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0, 0);
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type: RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
]);

const outDir = join(__dirname, "assets");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "tray.png"), png);
console.log(`wrote assets/tray.png (${png.length} bytes)`);
