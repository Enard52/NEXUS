import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

/* i18n kapsam denetiminin CI KAPISI.
   scripts/i18n-coverage.mjs bilerek başarısızlık üretmez (elle kullanımda kılavuz):
   eksikleri listeler, çıkar. Bu yüzden "yeni ekran ekledim, sözlüğü unuttum" durumu
   hiçbir yerde durmuyordu — İngilizce arayüzde Türkçe kalan satır ancak kullanıcı
   ekranında fark ediliyordu. Kapı burada: betiğin --json çıktısı çalıştırılıp
   gaps listesinin BOŞ olması beklenir.

   Betik import edilmez, SÜREÇ OLARAK çalıştırılır: .mjs'i TS'in içine çekmek
   typecheck'i (allowJs kapalı) ve tsconfig çözümlemesini gereksiz yere zorluyor.
   Ayrıca böylece denetim, kullanıcının çalıştırdığı komutun kendisiyle birebir
   aynı yolu izliyor — farklı bir kod yolu test edip "geçti" demiyor. */

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SCRIPT = resolve(REPO_ROOT, "scripts", "i18n-coverage.mjs");

type Coverage = {
  total: number;
  covered: number;
  percent: number;
  gaps: string[];
  pages: number;
  filter: string | null;
  dictKeys: number;
  dictBroken: boolean;
  deadSlots: number;
  dupes: number;
  jsStrings: number;
};

function runCoverage(args: string[]): { json: Coverage; raw: string } {
  let stdout = "";
  try {
    stdout = execFileSync(process.execPath, [SCRIPT, ...args], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    // Sözlük okunamazsa betik çıkış 1 verir; hata mesajını görünür taşı ki
    // "test düştü" yerine neden düştüğü okunsun.
    throw new Error(
      `i18n-coverage çalıştırılamadı (${args.join(" ") || "argüman yok"}): ${e.message ?? "?"}\n` +
        `stderr: ${String(e.stderr ?? "").trim()}\nstdout: ${String(e.stdout ?? "").trim()}`,
    );
  }
  const line = stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("{"))
    .pop();
  if (!line) throw new Error(`--json çıktısında JSON satırı yok:\n${stdout}`);
  return { json: JSON.parse(line) as Coverage, raw: stdout };
}

describe("i18n kapsam kapısı (HTML + öznitelik + JS katalog metinleri sözlükte karşılık buluyor)", () => {
  const all = runCoverage(["--json"]);

  it("denetim gerçekten çalışıyor: boş tarama 'temiz' sayılmaz", () => {
    // Bu eşikler olmasa betik hiç dosya bulamasa da (ör. klasör taşındı) gaps=[] ile
    // "başarılı" görünürdü — denetimin sessizce işlevsiz kalması tam olarak bu.
    expect(all.json.dictBroken).toBe(false);
    expect(all.json.dictKeys).toBeGreaterThan(500);
    expect(all.json.pages).toBeGreaterThan(30);
    expect(all.json.total).toBeGreaterThan(500);
    // JS katalog alanları taranıyor mu: ekranların önemli bir kısmı HTML'de değil,
    // supported-devices.js / quick-scenes.js / household-page.js gibi veri dosyalarında.
    expect(all.json.jsStrings).toBeGreaterThan(200);
    expect(all.json.filter).toBeNull();
  });

  it("İngilizce karşılığı olmayan statik Türkçe metin YOK", () => {
    const gaps = all.json.gaps;
    expect(
      gaps,
      `lang-en.js sözlüğünde karşılığı olmayan ${gaps.length} metin var.\n` +
        `İlk 20:\n  ${gaps.slice(0, 20).join("\n  ")}\n` +
        `Düzeltme: src/app/lang-en.js "text" bölümüne anahtar=Türkçe metin, değer=İngilizce karşılık\n` +
        `ekleyin, sonra \`npm run sync:www\`. ("SLOTS-ÖLÜ" satırları: anahtar slots'ta duruyor ve\n` +
        `lookup() oraya hiç bakmıyor — anahtarı text'e taşıyın. "[dizi]" satırları: JS katalog\n` +
        `alanındaki metin; aynı şekilde text'e anahtar olarak eklenir.)`,
    ).toEqual([]);
    // Yanlış gruba yazılmış anahtar = çalışma zamanında ölü (İngilizce arayüzde Türkçe).
    expect(all.json.deadSlots).toBe(0);
    // Yinelenen anahtar = sessiz ölü kopya; iki değeri farklıysa hangisinin görüneceği
    // satır sırasına kalır.
    expect(all.json.dupes).toBe(0);
    expect(all.json.covered).toBe(all.json.total);
    expect(all.json.percent).toBe(100);
  });

  it("--json sayfa filtresi gibi davranmıyor (argv[2] gerileme koruması)", () => {
    // Betik eskiden process.argv[2]'yi sayfa adı sanıyordu: "--json" tek başına
    // verilince hiçbir dosya eşleşmiyor, rapor 0/0 çıkıyor ve kapı boş geçiyordu.
    const filtered = runCoverage(["--json", "nexus-settings"]);
    expect(filtered.json.filter).toBe("nexus-settings");
    expect(filtered.json.pages).toBe(1);
    expect(filtered.json.total).toBeGreaterThan(0);
    expect(filtered.json.gaps).toEqual([]);
  });

  it("insan-okur çıktı bozulmadı (elle kullanım aynı komut)", () => {
    const out = execFileSync(process.execPath, [SCRIPT], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
    expect(out).toMatch(
      /Türkçe metin \(HTML düğüm \+ öznitelik \+ JS katalog alanı\): \d+ · sözlükte karşılığı var: \d+ \(\d+%\)/,
    );
    expect(out).toMatch(/yinelenen sözlük anahtarı: 0/);
    expect(out).not.toMatch(/^\s*\{/m);
  });

  it("yanlış grup / yinelenen anahtar / JS katalog alanı yakalanıyor (modelin kendisi)", () => {
    /* 2026-10-31: 45 anahtar lang-en.js'de slots bölgesinde duruyordu ve lookup() oraya
       hiç bakmadığı için İngilizce arayüzde Türkçe kalıyorlardı — denetim slots'u da
       kapsama saydığı için bunu göremiyordu. Aynı denetim tarihinde yinelenen anahtarlar
       (değerleri farklı!) ve JS veri dosyalarındaki 63 eksik metin de görünmezdi.
       Bu test üç kör noktayı da sentetik bir depoyla kanıtlar (depoyu değiştirmeden,
       geçici klasörde). */
    const dir = mkdtempSync(join(tmpdir(), "nexus-i18n-selftest-"));
    try {
      mkdirSync(join(dir, "scripts"), { recursive: true });
      mkdirSync(join(dir, "src", "app"), { recursive: true });
      copyFileSync(SCRIPT, join(dir, "scripts", "i18n-coverage.mjs"));
      const filler = Array.from(
        { length: 600 },
        (_, i) => `"Doldurma metni ${i}": "Filler text ${i}",`,
      ).join("\n    ");
      writeFileSync(
        join(dir, "src", "app", "lang-en.js"),
        `window.NEXUS_EN = {\n  text: {\n    ${filler}\n` +
          `    "Yinelenen anahtar": "First value",\n` +
          `    "Yinelenen anahtar": "Second value",\n  },\n  html: {},\n  slots: {\n` +
          `    "Kayıt durumu": "Sign-in status",\n` +
          `    "Toplam {0} cihaz bulundu.": "{0} devices found in total."\n  },\n  patterns: []\n};\n`,
        "utf8",
      );
      writeFileSync(
        join(dir, "src", "app", "nexus-kendidenetim.html"),
        "<!doctype html><html><body><p>Kayıt durumu</p><p>Sözlükte olmayan satır</p></body></html>\n",
        "utf8",
      );
      // Veri dosyası kılığı: HTML'de olmayan, yalnız JS katalog alanında duran metin.
      writeFileSync(
        join(dir, "src", "app", "katalog.js"),
        'export const MODELS = [{ name: "Eksik katalog satırı", label: "Bir diğer eksik satır" }];\n',
        "utf8",
      );
      const out = execFileSync(
        process.execPath,
        [join(dir, "scripts", "i18n-coverage.mjs"), "--json"],
        {
          cwd: dir,
          encoding: "utf8",
        },
      );
      const j = JSON.parse(out.trim()) as Coverage;
      // Yer tutucusuz slots anahtarı: ölü sayılmalı ve gaps'e düşmeli.
      expect(j.deadSlots).toBe(1);
      expect(j.gaps.some((g) => g.startsWith("SLOTS-ÖLÜ") && g.includes("Kayıt durumu"))).toBe(
        true,
      );
      // Sözlükte hiç olmayan bir metin de yakalanmalı (denetim boş dönmüyor).
      expect(j.gaps.some((g) => g.includes("Sözlükte olmayan satır"))).toBe(true);
      // Aynı grubun içinde iki kez yazılan anahtar: sessiz ölü kopya.
      expect(j.dupes).toBe(1);
      expect(
        j.gaps.some((g) => g.startsWith("YİNELEYEN ANAHTAR") && g.includes("Yinelenen anahtar")),
      ).toBe(true);
      // JS katalog alanındaki eksikler "[dizi]" etiketiyle düşmeli ve sayaca girme-li.
      expect(j.jsStrings).toBe(2);
      expect(
        j.gaps.some((g) => g.includes("katalog.js [dizi]") && g.includes("Eksik katalog satırı")),
      ).toBe(true);
      expect(j.percent).toBeLessThan(100);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
