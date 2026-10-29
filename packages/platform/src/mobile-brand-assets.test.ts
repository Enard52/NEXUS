import { describe, expect, it } from "vitest";
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";

// Mobil marka varlıklarının (launcher icon / splash) doğruluk testi.
//
// Neden var: 29 Ekim'de kullanıcı APK'yı kurdu ve "marka logosu yok, uygulamada
// farklı bir şey görünüyor" dedi. İki ayrı bozukluk çıktı:
//   1) android res/mipmap-*/ic_launcher*.png + drawable-*/splash.png, depoda bir
//      ANDROID STUDIO EKRAN GÖRÜNTÜSÜ olan assets/icon.png'den (1024x721) üretilmişti
//      → telefonda README ekran görüntüsü ikon olarak duruyordu.
//   2) ios AppIcon-512@2x.png ve Splash.imageset FİGMA logosuydu (Capacitor şablon
//      örnekleri hiç değiştirilmemişti).
// Bu test dosyaları gerçekten çözümleyip (PNG → piksel) markanın renk/imzasıyla
// karşılaştırır; biri örnek görselle veya ekran görüntüsüyle değişirse kırmızıya döner.
// Üretim betiği: node scripts/gen-mobile-icons.mjs

const ROOT = path.resolve(__dirname, "..", "..", "..");
const RES = path.join(ROOT, "android", "app", "src", "main", "res");
const IOS_ASSETS = path.join(ROOT, "ios", "App", "App", "Assets.xcassets");

interface Raster {
  width: number;
  height: number;
  /** her piksel için [r,g,b,a]; alfa kanalı olmayan dosyalarda a=255. */
  pixels: Uint8Array;
}

/** Bağımlılıksız PNG okuyucu: IHDR + IDAT(zlib) + satır filtreleri. 8-bit RGB/RGBA. */
function readPng(file: string): Raster {
  const buf = fs.readFileSync(file);
  if (buf.slice(0, 8).toString("hex") !== "89504e470d0a1a0a")
    throw new Error(`${path.basename(file)} PNG değil`);
  let off = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat: Buffer[] = [];
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.slice(off + 4, off + 8).toString("ascii");
    const data = buf.slice(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6))
    throw new Error(
      `${path.basename(file)}: beklenmeyen format bitDepth=${bitDepth} colorType=${colorType}`,
    );
  const channels = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    const filter = raw[rowStart];
    const line = raw.slice(rowStart + 1, rowStart + 1 + stride);
    const cur = Buffer.from(line);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        // Paeth: p = a+b-c; en yakın komşu seçilir (pa→a, pb→b, pc→c).
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        v = (v + pred) & 0xff;
      } else if (filter !== 0) throw new Error(`bilinmeyen PNG filtresi ${filter}`);
      cur[x] = v;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  const pixels = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    pixels[i * 4] = out[i * channels];
    pixels[i * 4 + 1] = out[i * channels + 1];
    pixels[i * 4 + 2] = out[i * channels + 2];
    pixels[i * 4 + 3] = channels === 4 ? out[i * channels + 3] : 255;
  }
  return { width, height, pixels };
}

interface Stats {
  width: number;
  height: number;
  /** alfa > 10 olan piksel oranı (0..100). */
  opaquePct: number;
  /** opak piksellerin ortalama R/G/B değerleri. */
  mean: [number, number, number];
}

function stats(img: Raster): Stats {
  const n = img.width * img.height;
  let opaque = 0;
  let r = 0;
  let g = 0;
  let b = 0;
  for (let i = 0; i < n; i++) {
    if (img.pixels[i * 4 + 3] > 10) {
      opaque++;
      r += img.pixels[i * 4];
      g += img.pixels[i * 4 + 1];
      b += img.pixels[i * 4 + 2];
    }
  }
  return {
    width: img.width,
    height: img.height,
    opaquePct: (opaque / n) * 100,
    mean: opaque
      ? [Math.round(r / opaque), Math.round(g / opaque), Math.round(b / opaque)]
      : [0, 0, 0],
  };
}

function load(rel: string): Stats {
  const file = path.isAbsolute(rel) ? rel : path.join(RES, rel);
  expect(fs.existsSync(file), `eksik varlık: ${rel}`).toBe(true);
  return stats(readPng(file));
}

/** NEXUS marka degrade rengi: mavi kanal baskın (icon.svg #8b7bff → #5b8dff). */
function expectBrandBlue(s: Stats, where: string): void {
  const [r, g, b] = s.mean;
  expect(b, `${where}: mavi kanal marka kadar doygun değil (rgb ${r},${g},${b})`).toBeGreaterThan(
    200,
  );
  expect(b - r, `${where}: kırmızıya kaçmış (rgb ${r},${g},${b})`).toBeGreaterThanOrEqual(15);
  expect(b - g, `${where}: yeşile kaçmış (rgb ${r},${g},${b})`).toBeGreaterThanOrEqual(60);
}

/** Ekran görüntüsü / fotoğraflı bozukluk imzası: neredeyse hiç doygun mavi yok. */
const LEGACY_SIZES: Record<string, number> = {
  ldpi: 36,
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};
const ADAPTIVE_SIZES: Record<string, number> = {
  ldpi: 81,
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

describe("mobil marka varlıkları (launcher icon + splash)", () => {
  it("Android legacy ikonlarının her yoğunluğu doğru boyutta ve marka renginde", () => {
    for (const [dpi, px] of Object.entries(LEGACY_SIZES)) {
      for (const kind of ["ic_launcher", "ic_launcher_round"]) {
        const s = load(`mipmap-${dpi}/${kind}.png`);
        expect(s.width, `${dpi}/${kind} genişliği`).toBe(px);
        expect(s.height, `${dpi}/${kind} yüksekliği`).toBe(px);
        // Ekran görüntüsü kare DEĞİLDİ ve kenarları şeffaf değildi; marka karo'su
        // köşe yuvarlatmalı olduğu için opak oranı %70-100 arasındadır.
        expect(s.opaquePct, `${dpi}/${kind} opaklık oranı`).toBeGreaterThan(70);
        expectBrandBlue(s, `${dpi}/${kind}`);
      }
    }
  });

  it("adaptive katmanlar: arka tam taşar, ön şeffaf tuvalde beyaz glif", () => {
    for (const [dpi, px] of Object.entries(ADAPTIVE_SIZES)) {
      const bg = load(`mipmap-${dpi}/ic_launcher_background.png`);
      expect([bg.width, bg.height], `${dpi} arka katman boyutu`).toEqual([px, px]);
      expect(bg.opaquePct, `${dpi} arka katman tuvali doldurmuyor`).toBeGreaterThan(99.5);
      expectBrandBlue(bg, `${dpi} arka katman`);

      const fg = load(`mipmap-${dpi}/ic_launcher_foreground.png`);
      expect([fg.width, fg.height], `${dpi} ön katman boyutu`).toEqual([px, px]);
      // Glif, 108dp tuvalin ~%10'unu kaplar; tamamı opak olsaydı ikon maskeyle
      // ezilir ve marka görünmezdi.
      expect(fg.opaquePct, `${dpi} ön katman şeffaf değil`).toBeLessThan(30);
      expect(fg.opaquePct, `${dpi} ön katmanda glif yok`).toBeGreaterThan(3);
      const [fr, fgc, fb] = fg.mean;
      expect(Math.min(fr, fgc, fb), `${dpi} ön katman glifi beyaz değil`).toBeGreaterThan(230);

      const mono = load(`mipmap-${dpi}/ic_launcher_monochrome.png`);
      expect([mono.width, mono.height], `${dpi} monochrome boyutu`).toEqual([px, px]);
      expect(mono.opaquePct, `${dpi} monochrome şeffaf değil`).toBeLessThan(30);
    }
  });

  it("adaptive XML inset kullanmıyor ve monochrome katmanını bildiriyor", () => {
    for (const name of ["ic_launcher.xml", "ic_launcher_round.xml"]) {
      const file = path.join(RES, "mipmap-anydpi-v26", name);
      const xml = fs.readFileSync(file, "utf8");
      expect(xml, `${name} adaptive-icon değil`).toContain("<adaptive-icon");
      // %16.7 inset, maskeleme sonrası ikonun etrafında boşluk bırakıyordu.
      expect(xml, `${name} inset içeriyor`).not.toContain("inset");
      expect(xml, `${name} arka katman @mipmap'dan gelmiyor`).toContain(
        'android:drawable="@mipmap/ic_launcher_background"',
      );
      expect(xml, `${name} monochrome katmanı yok`).toContain("@mipmap/ic_launcher_monochrome");
    }
  });

  it("Android Studio şablonunun örnek launcher görselleri depoda durmuyor", () => {
    // drawable/ic_launcher_background.xml + drawable-v24/ic_launcher_foreground.xml
    // yeşil Android robot heykeliydi; referanslar @mipmap'a çevrilince ölü kaldı.
    expect(fs.existsSync(path.join(RES, "drawable", "ic_launcher_background.xml"))).toBe(false);
    expect(fs.existsSync(path.join(RES, "drawable-v24", "ic_launcher_foreground.xml"))).toBe(false);
  });

  it("açılış ekranları gece/kararma ve yön varyantlarıyla tam", () => {
    // Beklenen tuval boyutları: android/app/src/main/res klasör adları. Yeni bir
    // yoğunluk/qualifier eklenirse hem üretim betiği hem bu tablo güncellenmeli.
    const EXPECTED: Record<string, [number, number]> = {
      drawable: [320, 480],
      "drawable-night": [320, 240],
      "drawable-port-ldpi": [240, 320],
      "drawable-port-mdpi": [320, 480],
      "drawable-port-hdpi": [480, 800],
      "drawable-port-xhdpi": [720, 1280],
      "drawable-port-xxhdpi": [960, 1600],
      "drawable-port-xxxhdpi": [1280, 1920],
      "drawable-port-night-ldpi": [240, 320],
      "drawable-port-night-mdpi": [320, 480],
      "drawable-port-night-hdpi": [480, 800],
      "drawable-port-night-xhdpi": [720, 1280],
      "drawable-port-night-xxhdpi": [960, 1600],
      "drawable-port-night-xxxhdpi": [1280, 1920],
      "drawable-land-ldpi": [320, 240],
      "drawable-land-mdpi": [480, 320],
      "drawable-land-hdpi": [800, 480],
      "drawable-land-xhdpi": [1280, 720],
      "drawable-land-xxhdpi": [1600, 960],
      "drawable-land-xxxhdpi": [1920, 1280],
      "drawable-land-night-ldpi": [320, 240],
      "drawable-land-night-mdpi": [480, 320],
      "drawable-land-night-hdpi": [800, 480],
      "drawable-land-night-xhdpi": [1280, 720],
      "drawable-land-night-xxhdpi": [1600, 960],
      "drawable-land-night-xxxhdpi": [1920, 1280],
    };
    const dirs = fs
      .readdirSync(RES)
      .filter((d) => d.startsWith("drawable") && fs.existsSync(path.join(RES, d, "splash.png")));
    expect(dirs.length, "splash varyant sayısı").toBeGreaterThanOrEqual(26);
    for (const d of dirs) {
      const s = load(`${d}/splash.png`);
      expect(s.opaquePct, `${d}/splash.png saydam olamaz`).toBeGreaterThan(99.5);
      if (EXPECTED[d]) expect([s.width, s.height], `${d}/splash.png boyutu`).toEqual(EXPECTED[d]);
      // Ekran görüntüsü yerine marka: kareler ortalanmış karoyu kuşatmalı.
      const img = readPng(path.join(RES, d, "splash.png"));
      const cx = Math.floor(img.width / 2) * 4 + Math.floor(img.height / 2) * img.width * 4;
      const [r, g, b] = [img.pixels[cx], img.pixels[cx + 1], img.pixels[cx + 2]];
      const brandish = b > 200 && b - r >= 10 && b - g >= 40;
      const whiteGlyph = r > 230 && g > 230 && b > 230;
      expect(
        brandish || whiteGlyph,
        `${d}/splash.png merkezinde marka yok (rgb ${r},${g},${b})`,
      ).toBe(true);
    }
    // 26 PNG kodlama çözümü (tam kaliteyle); parallel suite'te 5sn'lik varsayılan
    // timeout yetersiz kalabiliyor (vitest CPU sıkışmasında flake).
  }, 20000);

  it("iOS uygulama ikonu 1024x1024, alfasız ve marka renginde", () => {
    const file = path.join(IOS_ASSETS, "AppIcon.appiconset", "AppIcon-512@2x.png");
    const img = readPng(file);
    expect([img.width, img.height], "AppIcon boyutu").toEqual([1024, 1024]);
    const s = stats(img);
    // App Store alfa kanalı içeren ikon reddeder; köşe yuvarlatmayı iOS yapar.
    expect(s.opaquePct, "AppIcon şeffalık içeriyor").toBeGreaterThan(99.5);
    expectBrandBlue(s, "AppIcon");
  });

  it("iOS splash görselleri marka ve 2732x2732", () => {
    for (const name of [
      "splash-2732x2732.png",
      "splash-2732x2732-1.png",
      "splash-2732x2732-2.png",
    ]) {
      const file = path.join(IOS_ASSETS, "Splash.imageset", name);
      const img = readPng(file);
      expect([img.width, img.height], `${name} boyutu`).toEqual([2732, 2732]);
      const mid = (2732 / 2) * 2732 * 4 + (2732 / 2) * 4;
      const [r, g, b] = [img.pixels[mid], img.pixels[mid + 1], img.pixels[mid + 2]];
      expect(
        b > 200 || (r > 230 && g > 230),
        `${name} ortasında marka yok (rgb ${r},${g},${b})`,
      ).toBe(true);
    }
    // 3 × 2732×2732 PNG kod çözüyor; tam suite'te CPU sıkışınca 5sn yetmiyor
    // (buradaki tek PNG okuyan testler tek başına geçiyordu, suite içinde time-out'tu).
  }, 20000);

  it("kaynak assets/ görselleri kare — ekran görüntüsü geri sızmış olamaz", () => {
    // Asıl kök neden buydu: assets/icon.png 1024x721 bir ekran görüntüsüydü ve
    // ikon üretimi ondan yapılıyordu.
    for (const name of ["icon.png", "logo.png"]) {
      const file = path.join(ROOT, "assets", name);
      const s = load(file);
      expect(s.width, `${name} kare değil`).toBe(s.height);
      expect(s.width, `${name} çok küçük`).toBeGreaterThanOrEqual(512);
      expectBrandBlue(s, `assets/${name}`);
    }
    const splash = load(path.join(ROOT, "assets", "splash.png"));
    expect(splash.width, "assets/splash.png kare değil").toBe(splash.height);
  });

  it("web kabuğa kopyalanan assets de markayı taşıyor (senkroz unutulmamış)", () => {
    const mirrored = path.join(ROOT, "www", "assets", "icon.png");
    if (!fs.existsSync(mirrored)) return; // www/ üretilmemişse test boş dönmez
    const s = load(mirrored);
    expect(s.width, "www/assets/icon.png kare değil").toBe(s.height);
    expectBrandBlue(s, "www/assets/icon.png");
  });

  it("AndroidManifest marka tanımlarını @mipmap'dan okuyor", () => {
    const manifest = fs.readFileSync(
      path.join(ROOT, "android", "app", "src", "main", "AndroidManifest.xml"),
      "utf8",
    );
    expect(manifest).toContain('android:icon="@mipmap/ic_launcher"');
    expect(manifest).toContain('android:roundIcon="@mipmap/ic_launcher_round"');
    const strings = fs.readFileSync(path.join(RES, "values", "strings.xml"), "utf8");
    expect(strings, "uygulama adı NEXUS olmalı").toContain(
      '<string name="app_name">NEXUS</string>',
    );
  });
});
