import { describe, expect, it } from "vitest";
import { Buffer } from "node:buffer";

/* encoding-fix.mjs'in onarim kurallarinin geri-duzeltme (regression) testleri.
   Guard testi (encoding-guard.test.ts) bozulmayi BULUR; bu dosya bozulmayi DUZELTEN
   kurallari sabitler. Ikisi ayrilmamali: bozucu bir surec (PowerShell 5.1 / editorden
   ANSI kaydetme) yeniden ayni hatayi uretiyorsa, onarici da ayni hatayi uretmemeli.

   Spec degiskeni bilerek literal değil: boylece tsconfig (allowJs yok) dosyayi cozumlemeye
   calismiyor, vitest ise calisma zamaninda import edebiliyor. Betik `isMain` korumasiyla
   import edildiginde kendi CLI taramasini yapmiyor. */

const spec = "../../../scripts/encoding-fix.mjs";
type RepairResult = {
  bytes: Buffer;
  changed: boolean;
  unfixable?: boolean;
  actions: string[];
  text: string | null;
};
const mod = (await import(spec)) as {
  repairBytes: (path: string, buf: Buffer) => RepairResult;
  unmojibake: (s: string) => { text: string; fixed: number };
};
const { repairBytes, unmojibake } = mod;

const BOM = [0xef, 0xbb, 0xbf];
const UTF16LE_BOM = [0xff, 0xfe];
const UTF16BE_BOM = [0xfe, 0xff];
const utf = (s: string) => Buffer.from(s, "utf8");
const utf16le = (s: string) => Buffer.from(s, "utf16le");
const hasBom = (b: Buffer) => b[0] === BOM[0] && b[1] === BOM[1] && b[2] === BOM[2];

/* "bir kez daha kodlanmis" hal: UTF-8 baytlarinin Latin-1/CP1252 karakteri gibi okunup
   tekrar UTF-8 yazilmis hali. Kaynakta bu karakterleri LITERAL yazamayiz (guard testi
   kendi dosyasini yakalar), o yuzden her Kalip \u kacisiyla kuruluyor. */
const DOUBLE_U = "\u00c3\u00bc"; // u harfinin bozuk hali
const DOUBLE_Telif = "\u00c2\u00a9"; // telif isaretinin bozuk hali
const DOUBLE_ENDASH = "\u00e2\u20ac\u201c"; // en dash (cp1252 karsiliklariyla)
const DOUBLE_G_LATIN1 = "\u00c4\u009e"; // buyuk G, latin-1 varyanti

describe("encoding-fix: onarim kurallari", () => {
  it("gereksiz UTF-8 BOM'u kaldirir", () => {
    const r = repairBytes("a/x.html", Buffer.concat([Buffer.from(BOM), utf("G\u00fcvenlik")]));
    expect(r.changed).toBe(true);
    expect(hasBom(r.bytes)).toBe(false);
    expect(r.bytes.toString("utf8")).toBe("G\u00fcvenlik");
  });

  it("UTF-16LE dosyayi BOM'suz UTF-8'e cevirir (satir sonlarini korur)", () => {
    const r = repairBytes("a/y.js", Buffer.concat([Buffer.from(UTF16LE_BOM), utf16le("\u015eifre de\u011fi\u015ftir\r\nT\u00fcrk\u00e7e\r\n")]));
    expect(r.changed).toBe(true);
    expect(hasBom(r.bytes)).toBe(false);
    expect(r.bytes.toString("utf8")).toBe("\u015eifre de\u011fi\u015ftir\r\nT\u00fcrk\u00e7e\r\n");
  });

  it("UTF-16BE dosyayi da okur", () => {
    const be = utf16le("A\u015f\u00fc");
    be.swap16();
    const r = repairBytes("a/y2.js", Buffer.concat([Buffer.from(UTF16BE_BOM), be]));
    expect(r.bytes.toString("utf8")).toBe("A\u015f\u00fc");
  });

  it("BOM'suz ama Turkce iceren .ps1'e BOM ekler (PowerShell 5.1 aksi halde ANSI okur)", () => {
    const r = repairBytes("a/z.ps1", utf('Write-Host "T\u00fcrk\u00e7e \u00e7al\u0131\u015f\u0131r"'));
    expect(r.changed).toBe(true);
    expect(hasBom(r.bytes)).toBe(true);
    expect(r.actions).toContain("ps1-bom-eklendi");
  });

  it(".ps1'de BOM'u korur, icerigi duzeltir", () => {
    const r = repairBytes("a/w.ps1", Buffer.concat([Buffer.from(BOM), utf("A" + DOUBLE_U)]));
    expect(r.changed).toBe(true);
    expect(hasBom(r.bytes)).toBe(true);
    expect(r.bytes.subarray(3).toString("utf8")).toBe("A\u00fc");
  });

  it("bir kez daha kodlanmis dizileri cozer ve idempotent calisir", () => {
    const r = repairBytes("a/m.html", utf("G" + DOUBLE_U + "venli " + DOUBLE_Telif + " " + DOUBLE_ENDASH + " 2026"));
    expect(r.bytes.toString("utf8")).toBe("G\u00fcvenli \u00a9 \u2013 2026");
    expect(repairBytes("a/m.html", r.bytes).changed).toBe(false);
  });

  it("bitisik iki bozuk diziyi ayri ayri cozer", () => {
    const r = repairBytes("a/x2.html", utf(DOUBLE_U + DOUBLE_Telif));
    expect(r.bytes.toString("utf8")).toBe("\u00fc\u00a9");
  });

  it("latin-1 varyantli buyuk G'yi tanir (eskiden kacirdigi kalip)", () => {
    const r = repairBytes("a/s.html", utf("/" + DOUBLE_G_LATIN1 + "/g"));
    expect(r.bytes.toString("utf8")).toBe("/\u011e/g");
  });

  it("CP1252/ANSI olarak kaydedilmis dosyayi kurtarir", () => {
    const r = repairBytes("a/cp.txt", Buffer.from([0x54, 0xfc, 0x72, 0x6b]));
    expect(r.changed).toBe(true);
    expect(r.bytes.toString("utf8")).toBe("T\u00fcrk");
  });

  it("cp1252'de tanimsiz bayt varsa kod sayfasini uydurmaz, raporlar", () => {
    const r = repairBytes("a/cp2.txt", Buffer.from([0x54, 0x8f, 0x72, 0x6b]));
    expect(r.changed).toBe(false);
    expect(r.actions).toEqual(["gecersiz-utf8-onarilamaz"]);
  });

  it("U+FFFD'li metinde karakter uydurmaz; tek basina o soruna dokunmaz", () => {
    const r = repairBytes("a/l.md", utf("Kayboldu: \uFFFD\uFFFD bitti"));
    expect(r.changed).toBe(false);
    expect(r.unfixable).toBe(true);
    expect(r.actions[0]).toBe("ufgd-kayip-bilgi:2");
  });

  it("U+FFFD'li dosyada BOM gibi gerçek bir onarimi yine yapar, kaybi oldugu birakir", () => {
    const r = repairBytes("a/l2.md", Buffer.concat([Buffer.from(BOM), utf("x \uFFFD y")]));
    expect(r.changed).toBe(true);
    expect(hasBom(r.bytes)).toBe(false);
    expect(r.bytes.toString("utf8")).toBe("x \uFFFD y");
    expect(r.actions).toEqual(["bom-kaldirildi", "ufgd-kayip-bilgi:1"]);
  });

  it("temiz dosyaya hicbir sekilde dokunmaz", () => {
    const clean = utf("G\u00fcvenlik \u015eifre \u00a9 2026 \u2014 caf\u00e9 \u2014 100\u20ac");
    const r = repairBytes("a/c.html", clean);
    expect(r.changed).toBe(false);
    expect(r.actions).toEqual([]);
    expect(r.bytes.equals(clean)).toBe(true);
  });

  it("normal Turkce/Latin metini bozuk sanmaz (yanlis pozitif korumasi)", () => {
    expect(unmojibake("\u0130\u015flem tamam, \u01e0\u00fcl\u00fc\u00f6m \u00d6. \u00c7. \u2014 100\u20ac \u00fc\u2013").fixed).toBe(0);
  });
});
