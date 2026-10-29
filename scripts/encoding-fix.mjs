#!/usr/bin/env node
/* Kodlama otomatik-onarıcısı.
   Windows araçları (PowerShell 5.1, bazı editörler, kopyala-yapıştır betikleri) dosyayı
   BOM'la, UTF-16 ile ya da ANSI kod sayfasıyla kaydettiğinde Türkçe metin bozuluyor ve
   bozuk haliyle depoya/yayına giriyordu. Bu betik aynı bozulmayı BULUP DüzELTIR:

     1. UTF-16LE/BE (BOM'lu) dosya          -> BOM'suz UTF-8
     2. Gereksiz UTF-8 BOM                  -> kaldırılır (.ps1 hariç)
     3. Türkçe içeren .ps1 BOM'suz ise      -> BOM eklenir (PS 5.1 aksi halde ANSI okur)
     4. Bir kez daha kodlanmış UTF-8         -> gerçek karaktere çözülür
        (ornek: C3 BC dizisi -> ü, C2 A9 dizisi -> telif işareti)
     5. ANSI/CP1252 olarak kaydedilmiş      -> CP1252 baytları okunup UTF-8'e çevrilir

   Yapamadığı tek şey: daha önce U+FFFD ("kaybolmuş karakter") işaretine dönüşmüş metin.
   Oradaki bilgi silinmiştir, uydurulmaz; onarılabilen hiçbir bayt dizisi U+FFFD üretmez.
   Böyle bir dosya yalnızca rapor edilir.

   Kullanım:
     node scripts/encoding-fix.mjs            # tüm depo: tara + onar
     node scripts/encoding-fix.mjs --check    # dokunma, sadece sayı ver (CI / hook ön kontrolü)
     node scripts/encoding-fix.mjs --staged   # yalnız commit'e hazırlanmış dosyalar (+ yeniden add)
     node scripts/encoding-fix.mjs --watch    # dosya değiştikçe onar (kod yazılırken)

   Bu dosyanın kendi kaynak metni ASCII + \u kaçışlarıyla kuruludur: packages/core/src/
   encoding-guard.test.ts bu betiği de taradığı için, bozuk örnekleri literal yazsaydık
   dedektör kendi onarıcısını yakalardı. */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, renameSync, readdirSync, watch, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const TEXT_EXT = /\.(html|js|mjs|cjs|ts|tsx|mts|css|scss|json|md|ya?ml|sql|toml|txt|svg|ps1|gradle|xml|properties|bat|cmd|ini|env|d\.mts)$/i;
// Arşivde kasıtlı bozuk örnekler var (dedektör testleri) ve ikili/üretilmiş klasörler gereksiz.
const SKIP = /(node_modules|(^|\/)\.git(\/|$)|\/dist\/|build\/intermediates|scripts\/archive|\.shot-ui|\.zcode|\.mimosa|\.private|tw-missing|legal-pdf|(^|\/)fonts\/|(^|\/)assets\/(img|icons|branding)\/)/;
// .gitignore'da duran üretilmiş kopyalar da onarılıyor (yayına/APK'ya bunlar gidiyor).
// Normalde liste git'ten alınıyor; git yoksa ya da hata verirse en azından şu klasörler dolaşılır.
const EXTRA_DIRS = ["www", "ios/App/App/public", "desktop/app", "_web-publish", "android/app/src/main/assets/public"];
const MAX_BYTES = 8 * 1024 * 1024;

/* ---------------------------------- charset --------------------------------- */

const CP1252_TO_BYTE = {
  "\u20ac": 0x80, "\u201a": 0x82, "\u0192": 0x83, "\u201e": 0x84, "\u2026": 0x85,
  "\u2020": 0x86, "\u2021": 0x87, "\u02c6": 0x88, "\u2030": 0x89, "\u0160": 0x8a,
  "\u2039": 0x8b, "\u0152": 0x8c, "\u017d": 0x8e, "\u2018": 0x91, "\u2019": 0x92,
  "\u201c": 0x93, "\u201d": 0x94, "\u2022": 0x95, "\u2013": 0x96, "\u2014": 0x97,
  "\u02dc": 0x98, "\u2122": 0x99, "\u0161": 0x9a, "\u203a": 0x9b, "\u0153": 0x9c,
  "\u017e": 0x9e, "\u0178": 0x9f,
};
const BYTE_TO_CP1252 = new Map(Object.entries(CP1252_TO_BYTE).map(([c, b]) => [b, c]));

const charToByte = (ch) =>
  Object.prototype.hasOwnProperty.call(CP1252_TO_BYTE, ch) ? CP1252_TO_BYTE[ch] : ch.charCodeAt(0) & 0xff;

// Devam baytı gibi görünen karakterler: 0x80-0xBF + cp1252'nin 0x80-0x9F karşılıkları.
const SUSPECT_RE = new RegExp(
  "[\\u00c2-\\u00ef][\\u0080-\\u00bf" +
    Object.keys(CP1252_TO_BYTE).map((c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join("") +
  "]{1,2}",
  "g"
);

const fffdCount = (s) => (s.match(/\uFFFD/g) || []).length;

/** UTF-16 okunduktan sonra başta kalan BOM karakterini (U+FEFF) atar. */
function dropBomChar(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function decodeDoubleEncodedRun(run) {
  const bytes = [...run].map(charToByte);
  const lead = bytes[0];
  const need = lead >= 0xc2 && lead <= 0xdf ? 2 : lead >= 0xe0 && lead <= 0xef ? 3 : 0;
  if (!need || bytes.length !== need) return null;
  if (bytes.slice(1).some((b) => b < 0x80 || b > 0xbf)) return null;
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
    return decoded === run ? null : decoded;
  } catch {
    return null;
  }
}

/** Bir kez daha kodlanmış dizileri çözer; bozuk hiçbir şey yoksa metni aynen döndürür. */
export function unmojibake(text) {
  SUSPECT_RE.lastIndex = 0;
  if (!SUSPECT_RE.test(text)) return { text, fixed: 0 };
  let fixed = 0;
  const out = text.replace(SUSPECT_RE, (run) => {
    for (let len = run.length; len >= 2; len--) {
      const d = decodeDoubleEncodedRun(run.slice(0, len));
      if (d) {
        fixed++;
        return len === run.length ? d : d + run.slice(len);
      }
    }
    return run;
  });
  return { text: out, fixed };
}

function isValidUtf8(buf) {
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buf);
    return true;
  } catch {
    return false;
  }
}

function cp1252Decode(buf) {
  let s = "";
  for (const b of buf) s += BYTE_TO_CP1252.get(b) ?? String.fromCharCode(b);
  return s;
}

/* ------------------------------- onarım çekirdeği ------------------------------ */

/** Dosya baytlarını alır, onarılmış baytları döndürür. changed=false ise dosyaya dokunulmaz. */
export function repairBytes(path, buf) {
  const actions = [];
  const ps1 = /\.ps1$/i.test(path);
  const hadBom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  let bytes = buf;
  let data = null; // UTF-8 metin olarak okunabildiği anda burada durur
  let wantBom = false; // .ps1 için yazılırken korunması/yeniden eklenmesi gereken BOM

  // 1) UTF-16 BOM'lu dosya -> UTF-8
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    data = dropBomChar(bytes.toString("utf16le"));
    actions.push("utf16le->utf8");
  } else if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    const swapped = Buffer.from(bytes);
    swapped.swap16();
    data = dropBomChar(swapped.toString("utf16le"));
    actions.push("utf16be->utf8");
  }

  // 2) UTF-8 BOM: .ps1'de kasıtlı, diğerlerinde gereksiz
  if (data === null && hadBom) {
    if (ps1) {
      data = bytes.subarray(3).toString("utf8");
      wantBom = true;
    } else {
      bytes = bytes.subarray(3);
      actions.push("bom-kaldirildi");
    }
  }

  // 3) .ps1: BOM'suz ama Türkçe içeriyor -> PS 5.1'in doğru okuyabilmesi için BOM ekle
  if (ps1 && isValidUtf8(bytes)) {
    const text = data ?? bytes.toString("utf8");
    if (!wantBom && /[\u0080-\uffff]/.test(text)) {
      data = text;
      wantBom = true;
      actions.push("ps1-bom-eklendi");
    }
  }

  // 4) Geçersiz UTF-8 (ANSI/CP1252 olarak kaydedilmiş) -> çevirmeyi dene
  if (data === null && bytes.length > 0 && !isValidUtf8(bytes)) {
    const asCp1252 = cp1252Decode(bytes);
    // cp1252'nin tanımsız baytları (81 8D 8F 90 9D) varsa dosya o kod sayfasıyla yazılmamıştır;
    // hangi sayfadan (cp857/cp437…) geldiği bilinemez, uydurmak yerine rapor edilir.
    const undefinedCp1252Byte = /[\u0081\u008d\u008f\u0090\u009d]/.test(asCp1252);
    const trial = unmojibake(asCp1252);
    const salvageable =
      !undefinedCp1252Byte &&
      fffdCount(trial.text) === 0 &&
      isValidUtf8(Buffer.from(trial.text, "utf8")) &&
      (trial.fixed > 0 || /[\u00c0-\u00ff\u0100-\u017f]/.test(trial.text));
    if (!salvageable) return { bytes: buf, changed: false, unfixable: true, actions: ["gecersiz-utf8-onarilamaz"], text: null };
    data = trial.text;
    actions.push(trial.fixed ? "cp1252->utf8+" + trial.fixed : "cp1252->utf8");
  }

  // 5) Bir kez daha kodlanmış dizileri çöz
  let text = data ?? bytes.toString("utf8");
  const { text: cleaned, fixed } = unmojibake(text);
  if (fixed > 0) {
    text = cleaned;
    actions.push("mojibake-cozuldu:" + fixed);
  }

  // U+FFFD: bilgi zaten silinmiş. Bu betik o karakterleri ASLA uydurmaz — oldikleri gibi
  // bırakır ve rapor eder. Yalnızca bu sorunu olan dosyaya dokunulmaz (gereksiz yazma yok).
  const lost = fffdCount(text);
  const realRepairs = actions.length;
  if (lost > 0) actions.push("ufgd-kayip-bilgi:" + lost);
  if (!realRepairs) return { bytes: buf, changed: false, unfixable: lost > 0, actions, text };

  let out = Buffer.from(text, "utf8");
  if (wantBom) out = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), out]);
  return { bytes: out, changed: true, unfixable: lost > 0, actions, text };
}

/* ----------------------------------- tarama ---------------------------------- */

function writeAtomic(path, bytes) {
  const tmp = path + ".encoding-fix.tmp";
  writeFileSync(tmp, bytes);
  renameSync(tmp, path);
}

function listFiles(root) {
  const out = new Set();
  const add = (f) => {
    const rel = String(f).replace(/\\/g, "/");
    if (rel && TEXT_EXT.test(rel) && !SKIP.test(rel)) out.add(rel);
  };
  const git = (gitArgs) =>
    execFileSync("git", gitArgs, { cwd: root, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 }).split("\0").filter(Boolean);
  try {
    // İzlenen + izlenmeyen ama ignore EDİLMEMİŞ dosyalar.
    git(["ls-files", "-z", "--cached", "--others", "--exclude-standard"]).forEach(add);
  } catch {
    /* git yoksa yalnız EXTRA_DIRS taranır */
  }
  // .gitignore'da duran üretilmiş kopyalar (APK'ya/instalera giden dosyalar bunlar).
  // Tam liste 12 sn sürüyor; --directory klasörleri katlayıp 0.1 sn'ye düşürüyor,
  // sonra yalnız ilgili klasörlere dalıyoruz.
  const walkStarts = new Set(EXTRA_DIRS.map((d) => d + "/"));
  try {
    for (const e of git(["ls-files", "-z", "--others", "--ignored", "--exclude-standard", "--directory"])) {
      const rel = e.replace(/\\/g, "/");
      if (SKIP.test(rel)) continue;
      if (rel.endsWith("/")) walkStarts.add(rel);
      else add(rel);
    }
  } catch {
    for (const d of EXTRA_DIRS) walkStarts.add(d + "/");
  }
  let walked = 0;
  const walk = (dirRel) => {
    if (walked++ > 40000 || out.size > 20000) return; // güvenli üst sınır
    let items = [];
    try {
      items = readdirSync(join(root, dirRel), { withFileTypes: true });
    } catch {
      return;
    }
    for (const it of items) {
      const rel = `${dirRel}${it.name}`;
      if (it.isDirectory()) {
        if (!SKIP.test(rel + "/")) walk(rel + "/");
      } else if (it.isFile()) {
        add(rel);
      }
    }
  };
  for (const start of walkStarts) walk(start);
  return [...out];
}

/** Tek dosya: onarılması gerekiyorsa yazar, sonucu satır olarak döndürür. */
function processFile(root, rel, checkOnly) {
  const abs = join(root, rel);
  let buf;
  try {
    buf = readFileSync(abs);
  } catch {
    return null;
  }
  if (buf.length === 0 || buf.length > MAX_BYTES) return null;
  const utf16 = (buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff);
  if (!utf16 && buf.includes(0)) return null; // NUL içeren ikili dosyaya dokunma

  const res = repairBytes(rel, buf);
  const lost = fffdCount((res.text ?? res.bytes).toString("utf8"));
  if (!res.changed && !res.unfixable && !lost) return null;

  const row = { file: rel, actions: res.actions, changed: res.changed, unfixable: !!res.unfixable, lost };
  if (res.changed && !checkOnly) {
    writeAtomic(abs, res.bytes);
    const verify = readFileSync(abs);
    const ok =
      verify.equals(res.bytes) &&
      isValidUtf8(verify) &&
      unmojibake(verify.toString("utf8")).fixed === 0 &&
      fffdCount(verify.toString("utf8")) === fffdCount(res.bytes.toString("utf8"));
    row.verified = ok;
    if (!ok) writeAtomic(abs, buf); // onarım beklenendi gibi değilse eski baytlara dön
  }
  return row;
}

function runOnce(label, files, checkOnly) {
  const rows = [];
  for (const f of files) {
    const r = processFile(root, f, checkOnly);
    if (r) rows.push(r);
  }
  const line = {
    mod: label,
    tarih: new Date().toISOString(),
    taranan: files.length,
    onarilan: rows.filter((r) => r.changed).length,
    onarilamayan: rows.filter((r) => r.unfixable || r.verified === false).length,
    kayipKarakter: rows.filter((r) => r.lost).length,
    detay: rows.map(
      (r) =>
        `${r.file} :: ${r.actions.join(",")}${r.lost ? " :: " + r.lost + " kayip karakter" : ""}${
          r.verified === false ? " :: DOGRULANAMADI" : ""
        }`
    ),
  };
  console.log(JSON.stringify(line));
  return { line, rows };
}

/* ------------------------------------ modlar ---------------------------------- */

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");

// Import edildiğinde (testler / başka betikler) CLI çalışmasın; yalnız çalıştırılırsa tarama yapsın.
const isMain = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (!isMain) {
  // Import edildiğinde (testler / başka betikler) yalnızca export'lar verilir, tarama yapılmaz.
} else if (args.has("--watch")) {
  // Kod yazılırken: her kayıtta değil, dosya oturduktan sonra onar.
  const pending = new Map();
  const justWritten = new Map();
  const onChange = (rel) => {
    const norm = String(rel || "").replace(/\\/g, "/");
    if (!norm || norm.endsWith(".encoding-fix.tmp") || SKIP.test(norm) || !TEXT_EXT.test(norm)) return;
    const abs = join(root, norm);
    if (justWritten.get(norm) && Date.now() - justWritten.get(norm) < 2000) return; // kendi yazdığımız dosya
    clearTimeout(pending.get(norm));
    pending.set(
      norm,
      setTimeout(() => {
        pending.delete(norm);
        let ilk;
        try {
          ilk = statSync(abs);
        } catch {
          return;
        }
        // Yarım yazma olmasın: boyut bir süre sabit kalmalı.
        setTimeout(() => {
          let ikinci;
          try {
            ikinci = statSync(abs);
          } catch {
            return;
          }
          if (ikinci.size !== ilk.size) return onChange(norm);
          const r = processFile(root, norm, false);
          if (r && r.changed) {
            justWritten.set(norm, Date.now());
            console.log(JSON.stringify({ watch: norm, actions: r.actions, verified: r.verified, tarih: new Date().toISOString() }));
          }
        }, 400);
      }, 250)
    );
  };

  // Dinleyici kendisi düşerse (Windows'ta EPERM/ENOSPC görülür) 2 sn sonra yeniden kurulur.
  let recursiveSupported = true;
  let watcher = null;
  const arm = () => {
    try {
      watcher = recursiveSupported
        ? watch(root, { recursive: true }, (_event, filename) => onChange(filename))
        : watch(root, (_event, filename) => onChange(filename));
      watcher.on("error", (err) => {
        console.log(JSON.stringify({ watch: "hata", mesaj: String((err && err.message) || err), tarih: new Date().toISOString() }));
        try {
          watcher.close();
        } catch {
          /* zaten kapandı */
        }
        setTimeout(arm, 2000);
      });
    } catch (err) {
      const code = err && err.code;
      if (code === "ERR_FEATURE_UNAVAILABLE_ON_PLATFORM") {
        recursiveSupported = false; // desteklenmeyen platform: üst klasörü sığ-olmadan izle
        console.log(JSON.stringify({ watch: "recursive-kapandi", tarih: new Date().toISOString() }));
        setTimeout(arm, 100);
        return;
      }
      console.log(JSON.stringify({ watch: "kurulum-hatasi", mesaj: String((err && err.message) || err), tarih: new Date().toISOString() }));
      setTimeout(arm, 2000);
    }
  };
  arm();

  const once = listFiles(root);
  console.log(JSON.stringify({ watch: "basladi", klasor: root, dosya: once.length, tarih: new Date().toISOString() }));
  runOnce("watch-acilis-firinca-tarama", once, checkOnly);
} else if (args.has("--staged")) {
  // Commit öncesi kancanın çağırdığı mod: yalnız sahnelenmiş dosyalar, onarınca yeniden add edilir.
  const staged = execFileSync("git", ["diff", "--cached", "--name-only", "-z"], { cwd: root, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
  const { rows } = runOnce("staged", staged.filter((f) => TEXT_EXT.test(f) && !SKIP.test(f)), checkOnly);
  const repaired = rows.filter((r) => r.changed && r.verified !== false).map((r) => r.file);
  if (repaired.length && !checkOnly) {
    execFileSync("git", ["add", "--", ...repaired], { cwd: root });
    console.log(JSON.stringify({ yenidenEklendi: repaired.length, dosyalar: repaired }));
  }
  // Onarım yazıldıktan sonra doğrulanamazsa commit durur: eski baytlara dönüldü ama elle bakılmalı.
  if (rows.some((r) => r.verified === false)) process.exitCode = 1;
} else {
  const { line } = runOnce(checkOnly ? "check" : "repo", listFiles(root), checkOnly);
  // --check kapısı: onarılması gereken ya da onarılamayan bir şey varsa çıkış 1 (CI/ön kontrol).
  if (checkOnly && (line.onarilan > 0 || line.onarilamayan > 0)) process.exitCode = 1;
}
