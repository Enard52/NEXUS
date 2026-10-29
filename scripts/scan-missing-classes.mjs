// Kullanılan Tailwind utility'lerini derli CSS ile karşılaştırır; eksikleri listeler.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const APP = path.join(ROOT, "src", "app");
const CSS_DIR = path.join(ROOT, "css");

// --- 1) Kullanılan token'ları topla ---
const used = new Map(); // token -> [dosya:satır]
function addUsed(tok, where) {
  if (!tok || tok.length > 48) return;
  if (!/^[a-zA-Z0-9:_\[\]\/\.\-\(\)%!,@#]+$/.test(tok)) return;
  if (/^https?$/.test(tok) || tok.includes("//")) return;
  if (!used.has(tok)) used.set(tok, []);
  if (used.get(tok).length < 3) used.get(tok).push(where);
}
function scanHtml(file) {
  const src = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);
  // class="..."
  for (const m of src.matchAll(/class\s*=\s*["']([^"']+)["']/g)) {
    m[1].split(/\s+/).forEach((t) => addUsed(t, rel));
  }
  // <style> bloklarındaki selector sınıfları da "tanımlı" kabul edilecek (aşağıda)
  // style bloklarını tanım havuzuna ekle
  for (const m of src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) cssTexts.push({ text: m[1], rel });
}
function scanJs(file) {
  const src = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);
  // "class=\"...\"" kalıpları ve classList add/remove/toggle argümanları
  for (const m of src.matchAll(/class\s*=\s*(?:["']([^"']+)["']|`([^`]*)`)/g)) {
    const val = (m[1] || m[2] || "").replace(/\$\{[^}]*\}/g, " ");
    val.split(/\s+/).forEach((t) => addUsed(t, rel + " (js)"));
  }
  for (const m of src.matchAll(/classList\.(?:add|remove|toggle|contains)\(\s*["'`]([^"'`]+)["'`]/g)) {
    m[1].split(/\s+/).forEach((t) => addUsed(t, rel + " (js)"));
  }
}

const cssTexts = [];
const htmlFiles = fs.readdirSync(APP).filter((f) => f.endsWith(".html"));
htmlFiles.forEach((f) => scanHtml(path.join(APP, f)));
if (fs.existsSync(path.join(ROOT, "index.html"))) scanHtml(path.join(ROOT, "index.html"));
const jsFiles = fs.readdirSync(APP).filter((f) => f.endsWith(".js"));
jsFiles.forEach((f) => scanJs(path.join(APP, f)));

// --- 2) Tanımlı sınıfları topla ---
const defined = new Set();
function collectCss(text, rel) {
  for (const m of text.matchAll(/\.((?:\\.|[-\w\u00A0-\uFFFF])+)/g)) {
    defined.add(m[1].replace(/\\/g, ""));
  }
}
for (const f of fs.readdirSync(CSS_DIR)) {
  if (f.endsWith(".css")) collectCss(fs.readFileSync(path.join(CSS_DIR, f), "utf8"), f);
}
cssTexts.forEach(({ text, rel }) => collectCss(text, rel));

// --- 3) Karşılaştır ---
const missing = [];
for (const [tok, where] of used) {
  if (!defined.has(tok)) missing.push({ tok, where });
}
// Custom sınıf görünümlüleri ayıkla (raporu okunur tutmak için)
const CUSTOM_RE = /^(?:nx-|nexus-|nexus-|slide-|sheet-|btn-|glass|card-|soft-|bottom-|page-|tab-|home-|device-|scene-|room-|lucide|leaflet|fa-|is-|has-|no-|on-|off-|app-|auth-|login-|user-|assistant|fab|chat|msg|panel|modal|toast|sw|theme|dark-mode|light-mode|lang-|i18n|sw-|tile-|tile)/;
const missingTw = missing.filter(({ tok }) => !CUSTOM_RE.test(tok));

console.log(`Kullanılan benzersiz token: ${used.size}`);
console.log(`Tanımlı sınıf: ${defined.size}`);
console.log(`Eksik (tailwind kalıplı): ${missingTw.length}\n`);
for (const { tok, where } of missingTw.slice(0, 400)) {
  console.log(`${tok}   ← ${where.join(" | ")}`);
}
