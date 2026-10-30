// Vurgu rengi (Ayarlar → Görünüm → Vurgu Rengi) için Tailwind üretimi üzerine bir örtü katmanı üretir.
//
// Tailwind CSS'i statik derlenir ve marka mavisi (#4C7DFF) yüzlerce `text-[#4C7DFF]`, `bg-[#4C7DFF]/10`,
// `nexus-primary` vb. sınıfta sabittir. Bu betik css/tailwind.css içinde marka mavisini taşıyan her kuralı bulur
// ve aynı kuralı renk yerine `--nx-accent-rgb` değişkeniyle css/nexus-ui.css içindeki işaretli bölüme yazar.
// Tailwind'i yeniden derledikten sonra bir kez çalıştırın:  node scripts/build-accent-css.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "css", "tailwind.css");
const OUT = join(ROOT, "css", "nexus-ui.css");
const BEGIN = "/* >>> accent-overrides (scripts/build-accent-css.mjs ile üretilir; elle düzenlemeyin) */";
const END = "/* <<< accent-overrides */";

const HEX = /#4c7dff/gi;
const RGB = /rgb\(\s*76\s+125\s+255\s*(\/\s*[^)]+)?\)/gi;
const RGBC = /rgba?\(\s*76\s*,\s*125\s*,\s*255\s*(?:,\s*([^)]+))?\)/gi;
const has = (v) => /#4c7dff|rgba?\(\s*76[\s,]+125[\s,]+255/i.test(v);
const swap = (v) =>
  v
    .replace(RGB, (_, a) => "rgb(var(--nx-accent-rgb)" + (a ? " " + a.trim() : "") + ")")
    .replace(RGBC, (_, a) => "rgb(var(--nx-accent-rgb)" + (a ? " / " + a.trim() : "") + ")")
    .replace(HEX, "rgb(var(--nx-accent-rgb))");

const root = postcss.parse(readFileSync(SRC, "utf8"));
const out = [];
root.walkRules((rule) => {
  if (rule.parent && rule.parent.type === "atrule" && /keyframes/i.test(rule.parent.name)) return;
  const decls = [];
  rule.walkDecls((d) => {
    if (has(d.value)) decls.push(d.prop + ":" + swap(d.value));
  });
  if (!decls.length) return;
  const sel = rule.selectors.map((s) => "html " + s).join(",");
  let css = sel + "{" + decls.join(";") + "}";
  const p = rule.parent;
  if (p && p.type === "atrule") css = "@" + p.name + " " + p.params + "{" + css + "}";
  out.push(css);
});

let ui = readFileSync(OUT, "utf8");
const block = BEGIN + "\n" + out.join("\n") + "\n" + END;
const i = ui.indexOf(BEGIN);
const j = ui.indexOf(END);
if (i !== -1 && j !== -1) ui = ui.slice(0, i) + block + ui.slice(j + END.length);
else ui = ui.replace(/\s*$/, "\n\n") + block + "\n";
writeFileSync(OUT, ui, "utf8");
console.log("Vurgu örtüsü: " + out.length + " kural yazıldı.");
