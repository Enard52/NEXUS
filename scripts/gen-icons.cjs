/**
 * NEXUS AI — Brand icon generator (dependency-free)
 *
 * Produces the on-brand "N" mark as raster assets for both the desktop app and
 * the setup wizard, using only Node's built-in zlib — no image libraries.
 *
 * The mark is a custom, "engineered" N: two verticals + a bold diagonal bridge,
 * with 45° chamfers on the two outer corners (top-left & bottom-right) for a
 * directional, premium character. Still unmistakably "N" — no extra symbol.
 *
 *   • icon.png  — 512×512 RGBA (window / taskbar icon)
 *   • icon.ico  — multi-resolution Windows icon (256,128,64,48,32,16)
 *   • tray.png  — 32×32 RGBA (system tray)
 *
 * Output dirs:  node gen-icons.cjs <dirA> <dirB> ...   (default: ./assets)
 */

const { deflateSync, crc32 } = require("node:zlib");
const { writeFileSync, mkdirSync } = require("node:fs");
const { join, resolve } = require("node:path");

// Brand palette (matches the design-system primary / bg tokens).
const BRAND = [91, 141, 255, 255]; // #5b8dff
const WHITE = [255, 255, 255, 255];
const CLEAR = [0, 0, 0, 0];

// Corner radius of the tile (rx = 18.75% → matches icon.svg's rx=96/512).
const RADIUS_RATIO = 96 / 512;

// ── Geometry of the custom "N" (all relative to the canvas) ──────────────────
const PAD = 0.22; // glyph padding from the tile edge
const STROKE = 0.11; // stroke thickness (verticals & diagonal share this)
const CHAM = 0.085; // 45° chamfer on the two outer corners

/** Ray-casting point-in-polygon. */
function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0],
      yi = poly[i][1];
    const xj = poly[j][0],
      yj = poly[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Build the glyph test for a supersampled canvas of size S. Returns inGlyph(x,y).
 * The N = union of: chamfered left vertical, chamfered right vertical, and a
 * bold diagonal band (y=x) clipped to the glyph box.
 */
function makeGlyph(S) {
  const pad = S * PAD;
  const w = S * STROKE;
  const cham = S * CHAM;
  const top = pad;
  const bottom = S - 1 - pad;
  const lw = pad + w; // left bar right edge
  const r1 = S - 1 - pad; // right bar right edge
  const r0 = r1 - w; // right bar left edge

  // Left vertical — bottom-LEFT corner chamfered (away from the diagonal, which
  // meets the bar at its top-LEFT). Outer/ground corner cut for directionality.
  const leftPoly = [
    [pad, top],
    [lw, top],
    [lw, bottom],
    [pad + cham, bottom],
    [pad, bottom - cham],
  ];
  // Right vertical — top-RIGHT corner chamfered (away from the diagonal, which
  // meets the bar at its bottom-RIGHT). Outer/apex corner cut.
  const rightPoly = [
    [r0, top],
    [r1 - cham, top],
    [r1, top + cham],
    [r1, bottom],
    [r0, bottom],
  ];

  // Diagonal band: the thick y=x stroke, perpendicular width = w, clipped to box.
  // Perpendicular distance from y=x is |x-y|/√2; half-width w/2 ⇒ |x-y| ≤ w/√2.
  const halfBand = w / Math.SQRT2;
  const inBox = (x, y) => x >= pad && x <= S - 1 - pad && y >= pad && y <= S - 1 - pad;
  const inDiag = (x, y) => inBox(x, y) && Math.abs(x - y) <= halfBand;

  return (x, y) =>
    inDiag(x, y) || pointInPolygon(x, y, leftPoly) || pointInPolygon(x, y, rightPoly);
}

/** Rounded-tile test: inside the inner rect, or within `r` of a corner center. */
function makeTile(S) {
  const r = S * RADIUS_RATIO;
  return (x, y) => {
    if (x < r || x > S - 1 - r || y < r || y > S - 1 - r) {
      const cx = x < r ? r : S - 1 - r;
      const cy = y < r ? r : S - 1 - r;
      const dx = x - cx;
      const dy = y - cy;
      return dx * dx + dy * dy <= r * r;
    }
    return true;
  };
}

/** Render the brand mark at `size`×`size` with `ss`× supersampling (RGBA). */
function renderMark(size, ss = 4) {
  const S = size * ss;
  const inTile = makeTile(S);
  const inGlyph = makeGlyph(S);
  const px = Buffer.alloc(S * S * 4);

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let c = CLEAR;
      if (inTile(x, y)) c = inGlyph(x, y) ? WHITE : BRAND;
      const o = (y * S + x) * 4;
      px[o] = c[0];
      px[o + 1] = c[1];
      px[o + 2] = c[2];
      px[o + 3] = c[3];
    }
  }

  if (ss === 1) return px;

  // Box-downsample SS×SS → size×size (premultiplied alpha for clean edges).
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r0 = 0,
        g0 = 0,
        b0 = 0,
        a0 = 0,
        n = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const o = ((y * ss + sy) * S + (x * ss + sx)) * 4;
          const a = px[o + 3];
          r0 += px[o] * a;
          g0 += px[o + 1] * a;
          b0 += px[o + 2] * a;
          a0 += a;
          n++;
        }
      }
      const o = (y * size + x) * 4;
      if (a0 === 0) {
        out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
      } else {
        out[o] = Math.round(r0 / a0);
        out[o + 1] = Math.round(g0 / a0);
        out[o + 2] = Math.round(b0 / a0);
        out[o + 3] = Math.round(a0 / n);
      }
    }
  }
  return out;
}

// ── PNG / ICO encoding ──────────────────────────────────────────────────────

function encodePng(rgba, size) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filter: none
    rgba.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return png;
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

/** Multi-resolution .ico from {size: rgbaBuf}, using PNG-compressed entries. */
function encodeIco(images) {
  const sizes = Object.keys(images).map(Number).sort((a, b) => b - a);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // icon
  header.writeUInt16LE(sizes.length, 4);

  const entries = [];
  const blobs = [];
  let offset = 6 + sizes.length * 16;
  for (const size of sizes) {
    const png = encodePng(images[size], size);
    blobs.push(png);
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...blobs]);
}

// ── Generate ────────────────────────────────────────────────────────────────

const ICO_SIZES = [256, 128, 64, 48, 32, 16];
const dirs = process.argv.slice(2).map((d) => resolve(d));
const targets = dirs.length ? dirs : [resolve("assets")];

const png512 = encodePng(renderMark(512, 4), 512);
const trayPng = encodePng(renderMark(32, 8), 32); // extra SS for tiny tray crispness
const icoImages = {};
for (const s of ICO_SIZES) icoImages[s] = renderMark(s, 8);
const ico = encodeIco(icoImages);

for (const dir of targets) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "icon.png"), png512);
  writeFileSync(join(dir, "icon.ico"), ico);
  writeFileSync(join(dir, "tray.png"), trayPng);
  console.log(
    `wrote ${dir}{icon.png(${png512.length}), icon.ico(${ico.length}), tray.png(${trayPng.length})}`
  );
}
