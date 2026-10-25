import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* Kodlama korumaları.
   Gerçek olay: Windows PowerShell 5.1 `Set-Content -Encoding UTF8` kullanınca dosyanın
   başına BOM (U+FEFF) yazıyor; bu BOM .github/workflows/*.yml dosyalarına sıçradığında
   GitHub işi hiç başlatamıyor (her push "startup_failure", 0 iş, 0 log) ve aynı anda
   Türkçe metinler bir kez daha kodlanıp okunamaz hale geliyor (tek harf üç karakterlik
   bozuk dizilime dönüşüyor). Bu dosya o bozuk dizilimi örnek olarak bile BARINDIRMAZ:
   aşağıdaki dedektör düz metin aradığı için, örnek yazsaydık dedektör kendi kaynak
   dosyasını yakalardı. Betiklerin yazım tarafı BOM'suz UTF-8'e çevrildi; bu test aynı
   bozulmanın depoya geri girmesini engelliyor. */

// cp1252: 0x80–0xFF aralığının Latin-1'den farklı olan karakterleri.
const CP1252_HIGH: Record<string, number> = {
  "€": 0x80,
  "‚": 0x82,
  ƒ: 0x83,
  "„": 0x84,
  "…": 0x85,
  "†": 0x86,
  "‡": 0x87,
  ˆ: 0x88,
  "‰": 0x89,
  Š: 0x8a,
  "‹": 0x8b,
  Œ: 0x8c,
  Ž: 0x8e,
  "‘": 0x91,
  "’": 0x92,
  "“": 0x93,
  "”": 0x94,
  "•": 0x95,
  "–": 0x96,
  "—": 0x97,
  "˜": 0x98,
  "™": 0x99,
  š: 0x9a,
  "›": 0x9b,
  œ: 0x9c,
  ž: 0x9e,
  Ÿ: 0x9f,
};
const BYTE_TO_CP1252 = new Map<number, string>(Object.entries(CP1252_HIGH).map(([c, b]) => [b, c]));
function byteToCp1252(b: number): string {
  const mapped = BYTE_TO_CP1252.get(b);
  if (mapped) return mapped;
  return String.fromCharCode(b);
}
// Türkçe arayüzde kullanılan harfler/semboller; bunların çift-kodlanmış halleri aranır.
const TURKISH = ["ç", "ğ", "ı", "ö", "ş", "ü", "Ç", "Ğ", "İ", "Ö", "Ş", "Ü", "→", "·", "—"];
const MOJIBAKE = TURKISH.map((ch) => {
  const bytes = Buffer.from(ch, "utf8");
  let out = "";
  for (const b of bytes) out += byteToCp1252(b);
  return out === ch ? "" : out;
}).filter((t) => t.length > 1);

const TEXT_EXT =
  /\.(html|js|mjs|cjs|ts|tsx|mts|css|json|md|ya?ml|sql|toml|txt|svg|ps1|gradle|xml|properties|bat)$/i;
// Arşiv klasörlerinde kasıtlı olarak bozuk örnek metinler var (mojibake onaran betikler).
const SKIP = /(^|\/)(scripts\/archive|node_modules|\.git)\//;

function trackedTextFiles(): string[] {
  const out = execFileSync("git", ["ls-files"], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split("\n").filter((f) => f && TEXT_EXT.test(f) && !SKIP.test(f));
}

function readBuf(root: string, f: string): Buffer | null {
  try {
    return readFileSync(join(root, f));
  } catch {
    return null;
  }
}

describe("kodlama korumaları (BOM / mojibake)", () => {
  const root = process.cwd();
  const files = trackedTextFiles();
  const entries = files
    .map((f) => ({ f, buf: readBuf(root, f) }))
    .filter((e): e is { f: string; buf: Buffer } => e.buf !== null);

  it("taranacak dosya listesi boş değil", () => {
    expect(entries.length).toBeGreaterThan(200);
  });

  it("workflow YAML dosyaları BOM taşımıyor (aksi halde GitHub işi başlatamıyor)", () => {
    const bad = entries
      .filter((e) => /\.ya?ml$/i.test(e.f))
      .filter((e) => e.buf[0] === 0xef && e.buf[1] === 0xbb && e.buf[2] === 0xbf)
      .map((e) => e.f);
    expect(bad).toEqual([]);
  });

  it("hiçbir izlenen metin dosyası çift-kodlanmış Türkçe (mojibake) içermiyor", () => {
    const bad = entries
      .map((e) => {
        const s = e.buf.toString("utf8");
        const found = MOJIBAKE.filter((m) => s.includes(m));
        return found.length ? `${e.f} → ${found.slice(0, 3).join(" ")}` : "";
      })
      .filter(Boolean);
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
});
