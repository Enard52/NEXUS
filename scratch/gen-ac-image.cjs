// generic-air-conditioner.png üretici — tam görünen, kesik olmayan split klima görseli.
// Saf node (zlib) ile PNG kodlar; supersampling ile yumuşak kenarlar. Çıktı: 445x213 RGBA.
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const W = 445, H = 213, S = 3; // S: supersampling ölçeği

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

// Yuvarlatılmış dikdörtgene imzalı mesafe (içerde negatif)
function sdRoundRect(px, py, x0, y0, x1, y1, r) {
  const cx = clamp(px, x0 + r, x1 - r);
  const cy = clamp(py, y0 + r, y1 - r);
  const dx = px - cx, dy = py - cy;
  const outer = Math.hypot(dx, dy) - r;
  const qx = Math.max(x0 - px, px - x1) - r;
  const qy = Math.max(y0 - py, py - y1) - r;
  const inner = Math.min(Math.max(qx, qy), 0);
  return Math.max(outer, inner) + Math.min(Math.max(qx, qy, outer), 0) * 0; // yaklaşık: max(outer, inner)
}

function coverAA(d) { // mesafeden [0,1] kaplama (1px geçiş)
  return clamp(0.5 - d, 0, 1);
}

function ellipseCover(px, py, cx, cy, rx, ry, soft) {
  const nx = (px - cx) / rx, ny = (py - cy) / ry;
  const dist = Math.hypot(nx, ny); // 1 = kenar
  return clamp((1 - dist) / soft, 0, 1);
}

// Renkler
const BODY = [248, 250, 252];
const BODY_EDGE = [203, 213, 225];
const TOP_FACE = [255, 255, 255];
const VENT = [226, 232, 240];
const VENT_DARK = [203, 213, 225];
const BRAND = [226, 232, 240];
const LED = [76, 125, 255];

function pixel(px, py) {
  // Gölge (en altta)
  let r = 0, g = 0, b = 0, a = 0;
  const shadow = ellipseCover(px, py, 222, 182, 195, 17, 0.55) * 0.13;
  if (shadow > a) { r = 15; g = 23; b = 42; a = shadow; }

  // Gövde
  const dBody = sdRoundRect(px, py, 8, 30, 437, 152, 20);
  const cBody = coverAA(dBody);
  if (cBody > 0) {
    // üst yüzey hafif açık, alt yüzey gövde rengi
    const topFace = clamp((60 - py) / 40, 0, 1);
    const cr = BODY[0] + (TOP_FACE[0] - BODY[0]) * topFace;
    const cg = BODY[1] + (TOP_FACE[1] - BODY[1]) * topFace;
    const cb = BODY[2] + (TOP_FACE[2] - BODY[2]) * topFace;
    // kenar çizgisi (dBody -3..0 arası koyu kenar)
    const edge = clamp(-(dBody) / 2.2, 0, 1); // 0 iç, 1 kenara yakın
    const er = cr + (BODY_EDGE[0] - cr) * edge, eg = cg + (BODY_EDGE[1] - cg) * edge, eb = cb + (BODY_EDGE[2] - cb) * edge;
    const na = Math.max(a, cBody);
    r = r + (er - r) * (cBody / (a || 1)) * 0 + er * cBody + r * (1 - cBody) * (a ? 1 : 0);
    // düz karışım (alfa üstüste binme, gövde opak):
    r = er; g = eg; b = eb; a = Math.max(a, cBody);
  }

  // Marka çizgisi (ince, üstte)
  const dBrand = sdRoundRect(px, py, 150, 58, 295, 63, 2.5);
  const cBrand = coverAA(dBrand) * (a > 0 ? 1 : 0);
  if (cBrand > 0) {
    r = r + (BRAND[0] - r) * cBrand; g = g + (BRAND[1] - g) * cBrand; b = b + (BRAND[2] - b) * cBrand;
  }

  // Menfez yarığı
  const dVent = sdRoundRect(px, py, 46, 118, 399, 138, 9);
  const cVent = coverAA(dVent) * (a > 0 ? 1 : 0);
  if (cVent > 0) {
    // kanat çizgileri: dikeyde 2 ince koyu çizgi
    const l1 = coverAA(Math.abs(py - 124) - 1.1), l2 = coverAA(Math.abs(py - 131) - 1.1);
    const dark = Math.max(l1, l2) * 0.8;
    const vr = VENT[0] + (VENT_DARK[0] - VENT[0]) * dark;
    const vg = VENT[1] + (VENT_DARK[1] - VENT[1]) * dark;
    const vb = VENT[2] + (VENT_DARK[2] - VENT[2]) * dark;
    r = r + (vr - r) * cVent; g = g + (vg - g) * cVent; b = b + (vb - b) * cVent;
  }

  // LED
  const dLed = Math.hypot(px - 414, py - 74) - 4;
  const cLed = coverAA(dLed) * (a > 0 ? 1 : 0);
  if (cLed > 0) {
    r = r + (LED[0] - r) * cLed; g = g + (LED[1] - g) * cLed; b = b + (LED[2] - b) * cLed;
  }
  return [r, g, b, a];
}

// Supersample → ortalama al
const big = new Float64Array(W * S * H * S * 4);
for (let y = 0; y < H * S; y++) {
  for (let x = 0; x < W * S; x++) {
    const p = pixel((x + 0.5) / S, (y + 0.5) / S);
    const i = (y * W * S + x) * 4;
    big[i] = p[0]; big[i + 1] = p[1]; big[i + 2] = p[2]; big[i + 3] = p[3];
  }
}

const raw = Buffer.alloc(H * (1 + W * 4));
let o = 0;
for (let y = 0; y < H; y++) {
  raw[o++] = 0; // filtre yok
  for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < S; sy++) {
      for (let sx = 0; sx < S; sx++) {
        const i = ((y * S + sy) * W * S + (x * S + sx)) * 4;
        r += big[i]; g += big[i + 1]; b += big[i + 2]; a += big[i + 3];
      }
    }
    const n = S * S;
    raw[o++] = Math.round(r / n);
    raw[o++] = Math.round(g / n);
    raw[o++] = Math.round(b / n);
    raw[o++] = Math.round((a / n) * 255);
  }
}

// PNG yaz
function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);
const out = path.resolve(__dirname, "..", "assets", "products", "generic-air-conditioner.png");
fs.writeFileSync(out, png);
console.log("yazıldı:", out, png.length, "bayt");
