// Geçici doğrulama scripti: emoji, onclick tutarlılığı, id referansları
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "c:/Users/ensar/Desktop/NEXUS-main";
const pages = readdirSync(ROOT).filter((f) => f.startsWith("stitch-") && f.endsWith(".html"));
let problems = 0;

const emojiRe = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2700}-\u{27BF}\u{FE0F}\u{2713}\u{2714}\u{2B50}]/u;

for (const page of pages) {
  const html = readFileSync(join(ROOT, page), "utf8");

  // 1. Unicode emoji / dingbat
  const em = html.match(emojiRe);
  if (em) { console.log(`[EMOJI] ${page}: "${em[0]}" bulundu`); problems++; }

  // 2. onclick içinde çağrılan fonksiyonlar sayfada tanımlı mı?
  const calls = [...html.matchAll(/on(?:click|change|keydown|input)="\s*([a-zA-Z_$][\w$]*)\s*\(/g)].map((m) => m[1]);
  for (const fn of new Set(calls)) {
    if (!new RegExp(`function\\s+${fn}\\s*\\(`).test(html)) {
      console.log(`[FONKSIYON] ${page}: ${fn}() tanımsız`); problems++;
    }
  }

  // 3. getElementById ile aranan id'ler sayfada var mı?
  const ids = [...html.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]);
  for (const id of new Set(ids)) {
    if (!html.includes(`id="${id}"`)) {
      console.log(`[ID] ${page}: #${id} DOM'da yok`); problems++;
    }
  }

  // 4. href hedefleri mevcut mu? (stitch-* ve public/*)
  const hrefs = [...html.matchAll(/href="((?:stitch-|public\/)[^"#?]+)/g)].map((m) => m[1]);
  for (const h of new Set(hrefs)) {
    try { readFileSync(join(ROOT, h)); } catch { console.log(`[LINK] ${page}: ${h} bulunamadı`); problems++; }
  }
}

console.log(problems === 0 ? `\nSORUN YOK — ${pages.length} sayfa temiz.` : `\n${problems} sorun bulundu.`);
