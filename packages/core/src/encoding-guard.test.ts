import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/* Kodlama korumaları.
   Gerçek olay: Windows PowerShell 5.1 `Set-Content -Encoding UTF8` kullanınca dosyanın
   başına BOM (U+FEFF) yazıyor; bu BOM .github/workflows/*.yml dosyalarına sıçradığında
   GitHub işi hiç başlatamıyor (her push "startup_failure", 0 iş, 0 log) ve aynı anda
   Türkçe metinler bir kez daha kodlanıp okunamaz hale geliyor (tek harf üç karakterlik
   bozuk dizilime dönüşüyor). Bu dosya o bozuk dizilimi örnek olarak bile BARINDIRMAZ:
   aşağıdaki dedektör düz metin aradığı için, örnek yazsaydık dedektör kendi kaynak
   dosyasını yakalardı. Kalıplar bu yüzden \u kaçışlarıyla kuruluyor.

   Sürüm 2 farkı: eskiden yalnızca 15 Türkçe sembolün çift-kodlanmış hali aranyordu;
   telif işareti (C2 A9), kıvrımlı tek tırnak (E2 80 99) ve Latin-1 varyantı (C4 + denetim
   karakteri) bu yüzden yakalanmıyordu. Artık kurallı bir dedektör çalışıyor: UTF-8 ilk baytı gibi
   görünen (0xC2-0xEF) bir karakterden sonra devam baytı gibi görünen 1-2 karakter geliyorsa
   ve bu baytlar geçerli bir UTF-8 karakteri çözüyorsa, metin bir kez daha kodlanmıştır.
   Ayrıca yalnızca `git ls-files` çıktı değil, üretilen platform kopyaları da taranıyor:
   android/ios/desktop/_web-publish klasörleri .gitignore'da olduğu için eskiden hiç
   denetlenmiyordu ve bozuk bir sayfa tam bu yolla APK'ya girmişti. */

// cp1252: 0x80–0x9F aralığının Latin-1'den farklı olan karakterleri (kaynakta kaçış olarak durur).
const CP1252_TO_BYTE: Record<string, number> = {
  "\u20ac": 0x80, // €
  "\u201a": 0x82, // ‚
  "\u0192": 0x83, // ƒ
  "\u201e": 0x84, // „
  "\u2026": 0x85, // …
  "\u2020": 0x86, // †
  "\u2021": 0x87, // ‡
  "\u02c6": 0x88, // ˆ
  "\u2030": 0x89, // ‰
  "\u0160": 0x8a, // Š
  "\u2039": 0x8b, // ‹
  "\u0152": 0x8c, // Œ
  "\u017d": 0x8e, // Ž
  "\u2018": 0x91, // ‘
  "\u2019": 0x92, // ’
  "\u201c": 0x93, // “
  "\u201d": 0x94, // ”
  "\u2022": 0x95, // •
  "\u2013": 0x96, // –
  "\u2014": 0x97, // —
  "\u02dc": 0x98, // ˜
  "\u2122": 0x99, // ™
  "\u0161": 0x9a, // š
  "\u203a": 0x9b, // ›
  "\u0153": 0x9c, // œ
  "\u017e": 0x9e, // ž
  "\u0178": 0x9f, // Ÿ
};

function charToByte(ch: string): number {
  return Object.prototype.hasOwnProperty.call(CP1252_TO_BYTE, ch)
    ? CP1252_TO_BYTE[ch]
    : ch.charCodeAt(0);
}

// Devam baytı gibi görünen karakterler: 0x80-0xBF (Latin-1) + cp1252'nin 0x80-0x9F karşılıkları.
const CONTINUATION_CLASS =
  "\\u0080-\\u00bf" +
  Object.keys(CP1252_TO_BYTE)
    .map((c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"))
    .join("");

const SUSPECT_RE = new RegExp("[\\u00c2-\\u00ef][" + CONTINUATION_CLASS + "]{1,2}", "g");

/** Bir karakter dizisi çift-kodlanmış tek bir UTF-8 karakteri mi? Degilse null. */
function decodeDoubleEncodedRun(run: string): string | null {
  const first = charToByte(run.charAt(0));
  const bytes: number[] = [];
  for (const ch of run) bytes.push(charToByte(ch));
  for (const b of bytes.slice(1)) if (b < 0x80 || b > 0xbf) return null;
  const expected = first >= 0xc2 && first <= 0xdf ? 2 : first >= 0xe0 && first <= 0xef ? 3 : 0;
  if (!expected || bytes.length !== expected) return null;
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
    return decoded === run ? null : decoded;
  } catch {
    return null;
  }
}

/** Metindeki tüm çift-kodlanmış dizileri döndürür (boşsa metin temiz). */
function findDoubleEncoded(content: string): string[] {
  const hits = new Set<string>();
  SUSPECT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SUSPECT_RE.exec(content))) {
    const run = m[0];
    // Eşleşme iki karakteri birleştirmiş olabilir; önce 3, sonra 2 bayt denenir.
    for (let len = run.length; len >= 2; len--) {
      if (decodeDoubleEncodedRun(run.slice(0, len))) {
        hits.add(run.slice(0, len));
        break;
      }
    }
  }
  return [...hits];
}

const TEXT_EXT =
  /\.(html|js|mjs|cjs|ts|tsx|mts|css|json|md|ya?ml|sql|toml|txt|svg|ps1|gradle|xml|properties|bat|d\.mts)$/i;
// Arşiv klasörlerinde kasıtlı olarak bozuk örnek metinler var (mojibake onaran betikler).
const SKIP = /(^|\/)(scripts\/archive|node_modules|\.git)\//;

// .gitignore'da duran ama yayına giden üretilmiş kopyalar: bunlar da denetlenmeli.
const GENERATED_COPY_DIRS = [
  "www/public/assets",
  "ios/App/App/public",
  "desktop/app",
  "_web-publish",
  "android/app/src/main/assets/public",
];

function trackedTextFiles(root: string): string[] {
  const out = execFileSync("git", ["ls-files"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split("\n").filter((f) => f && TEXT_EXT.test(f) && !SKIP.test(f));
}

function generatedCopyFiles(root: string): string[] {
  const found: string[] = [];
  for (const dir of GENERATED_COPY_DIRS) {
    const abs = join(root, dir);
    if (!existsSync(abs)) continue; // temiz klonda klasör olmayabilir: atla
    let entries: string[] = [];
    try {
      entries = readdirSync(abs, { recursive: true, withFileTypes: false }).map(String);
    } catch {
      continue;
    }
    for (const rel of entries) {
      const f = `${dir}/${rel}`.replace(/\\/g, "/");
      if (TEXT_EXT.test(f) && !SKIP.test(f) && existsSync(join(root, f))) found.push(f);
    }
  }
  return found;
}

function readBuf(root: string, f: string): Buffer | null {
  try {
    return readFileSync(join(root, f));
  } catch {
    return null;
  }
}

function text(buf: Buffer): string {
  return buf.toString("utf8").replace(/^\uFEFF/, "");
}

/* İstisna listesi yok: taranan her dosya geçerli UTF-8 olmalı, BOM taşımamalı (.ps1 hariç)
   ve çift-kodlanmış karakter içermemeli. Bu kurallar ilk yazıldığında scripts/i18n-backup.ts
   dışındaydı: PowerShell onu UTF-16LE + CRLF ile yazmış, içeriği de bir DOS kod sayfasıyla
   (cp857/cp437) bozulmuştu. Ölü bir yedekti ve asıl sürümü packages/i18n/src/index.ts
   içinde duruyor; dosya depodan kaldırıldı, istisna listesi de boş kaldı.

   Bozukluğun kaynağı tek bir dosya değil, yazma biçimi: Windows araçları (PowerShell 5.1,
   bazı editörler) dosyayı BOM'la ya da UTF-16/ANSI kaydediyor. Bu yüzden aynı korumaları
   bir de düzelterek çalıştıran betik var: `node scripts/encoding-fix.mjs` (pre-commit
   kanca ve --watch modu onu çağırıyor). */

describe("kodlama korumaları (BOM / mojibake / geçerli UTF-8)", () => {
  const root = process.cwd();
  const tracked = trackedTextFiles(root);
  const entries = tracked
    .map((f) => ({ f, buf: readBuf(root, f) }))
    .filter((e): e is { f: string; buf: Buffer } => e.buf !== null);
  const copies = generatedCopyFiles(root);
  const copyEntries = copies
    .map((f) => ({ f, buf: readBuf(root, f) }))
    .filter((e): e is { f: string; buf: Buffer } => e.buf !== null);

  it("taranacak dosya listesi boş değil", () => {
    expect(entries.length).toBeGreaterThan(200);
  });

  it("üretilmiş platform kopyaları da taranıyor (olmazsa APK'ya bozuk sayfa sızmıştı)", () => {
    // Depoda en azından www/public/assets kopyaları bulunur; sayı sıfır olmamalı.
    expect(copyEntries.length).toBeGreaterThan(0);
  });

  it("taranan her dosya geçerli UTF-8 (UTF-16/ANSI gibi kaydedilmiş dosya kabul edilmez)", () => {
    const bad = [...entries, ...copyEntries]
      .filter((e) => {
        try {
          new TextDecoder("utf-8", { fatal: true }).decode(e.buf);
          return false;
        } catch {
          return true;
        }
      })
      .map((e) => e.f);
    expect(bad).toEqual([]);
  });

  it("hiçbir taranan dosya çift-kodlanmış karakter (mojibake) içermiyor", () => {
    const bad = [...entries, ...copyEntries]
      .map((e) => {
        const found = findDoubleEncoded(text(e.buf));
        return found.length ? `${e.f} → ${found.slice(0, 4).join(" ")}` : "";
      })
      .filter(Boolean);
    expect(bad).toEqual([]);
  });

  it("U+FFFD (kaybolmuş karakter) işareti hiçbir taranan dosyada bulunmaz", () => {
    const bad = [...entries, ...copyEntries]
      .filter((e) => text(e.buf).includes("\uFFFD"))
      .map((e) => e.f);
    expect(bad).toEqual([]);
  });

  it("BOM yalnızca PowerShell betiklerinde (.ps1) serbest; diğer tüm izlenen metin BOM'suz", () => {
    const bad = entries
      .filter((e) => !/\.ps1$/i.test(e.f))
      .filter((e) => e.buf[0] === 0xef && e.buf[1] === 0xbb && e.buf[2] === 0xbf)
      .map((e) => e.f);
    expect(bad).toEqual([]);
  });

  it("workflow YAML dosyaları BOM taşımıyor (aksi halde GitHub işi başlatamıyor)", () => {
    const bad = entries
      .filter((e) => /\.ya?ml$/i.test(e.f))
      .filter((e) => e.buf[0] === 0xef && e.buf[1] === 0xbb && e.buf[2] === 0xbf)
      .map((e) => e.f);
    expect(bad).toEqual([]);
  });

  it("Türkçe karakter içeren .ps1 betikleri BOM ile kaydedilmiş (PS 5.1 aksi halde ANSI okur)", () => {
    const ps1 = execFileSync("git", ["ls-files", "*.ps1"], { cwd: root, encoding: "utf8" })
      .split("\n")
      .filter(Boolean);
    const bad = ps1.filter((f) => {
      const buf = readBuf(root, f);
      if (!buf) return false;
      const hasNonAscii = /[\u0080-\uffff]/.test(buf.toString("utf8"));
      const hasBom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
      return hasNonAscii && !hasBom;
    });
    expect(bad).toEqual([]);
  });

  it("dedektörün kendisi bozuk örnekleri tanıyor (kaçışlarla kurulur, kaynakta mojibake olmaz)", () => {
    // Beklenenler (kaynakta ASCII olarak yaziliyor): C3 BC = u, C2 A9 = telif,
    // E2 80 99 = kirli tirnakt, C4 9E = G latin-1 varyanti, C5 9E = S cp1252 varyanti.
    const samples = [
      "\u00c3\u00bc", // ü
      "\u00c2\u00a9", // ©
      "\u00e2\u20ac\u2122", // ’
      "\u00c4\u009e", // Ğ (latin-1 varyanti)
      "\u00c5\u0178", // Ş (cp1252 varyanti)
    ];
    for (const s of samples) expect(findDoubleEncoded(s)).toEqual([s]);
    // Temiz metin örnekleri yakalanmamalı.
    for (const clean of [
      "Güvenlik",
      "Şifreyi Değiştir",
      "Tüm hakları saklıdır © 2026",
      "café Noël — 5€",
    ]) {
      expect(findDoubleEncoded(clean)).toEqual([]);
    }
  });
});
