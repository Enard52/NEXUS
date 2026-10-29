// Site: yeni bağlayıcıları (WiZ, LIFX, Govee, Sonoff DIY) entegrasyon şeridine ekler. Idempotent. Usage: node site-integrations.cjs <siteDir>
const fs = require("fs");
const path = require("path");
const root = process.argv[2];
const NEW = [
  {
    key: "WIZ",
    name: "WiZ",
    color: "#00A6D6",
    ab: "Wi",
    en: "Wi‑Fi bulbs · desktop app",
    tr: "Wi‑Fi ampuller · masaüstü",
  },
  {
    key: "LIFX",
    name: "LIFX",
    color: "#E5007D",
    ab: "Lx",
    en: "Wi‑Fi bulbs · desktop app",
    tr: "Wi‑Fi ampuller · masaüstü",
  },
  {
    key: "GOVEE",
    name: "Govee",
    color: "#1B6EF3",
    ab: "Gv",
    en: "LAN control · desktop app",
    tr: "LAN kontrolü · masaüstü",
  },
  { key: "SONOFF", name: "Sonoff", color: "#00B0A0", ab: "So", en: "DIY mode", tr: "DIY modu" },
];
const svg = (ab, color) =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="${ab}"><rect width="24" height="24" rx="7" fill="${color}"/><text x="12" y="15.4" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="8.6" font-weight="700" fill="#fff">${ab}</text></svg>`,
  );
let n = 0;
for (const [file, lang] of [
  ["index.html", "en"],
  ["tr/index.html", "tr"],
  ["light.html", "en"],
  ["tr/light.html", "tr"],
]) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) continue;
  let h = fs.readFileSync(p, "utf8");
  const start = h.indexOf('<div class="integrations-track"');
  if (start < 0) continue;
  const m =
    /<div class="integration-pill"[^>]*>(?:(?!<div class="integration-pill")[\s\S])*?data-brand="YEELIGHT"[\s\S]*?<span class="integration-status" aria-hidden="true"><\/span>\s*<\/div>/.exec(
      h.slice(start),
    );
  if (!m) continue;
  const tpl = m[0];
  let add = "";
  for (const b of NEW) {
    if (h.includes(`data-brand="${b.key}"`)) continue;
    let pill = tpl
      .replace(/--brand:#[0-9A-Fa-f]{3,8}/, "--brand:" + b.color)
      .replace(/src="data:image\/svg\+xml[^"]*"/, 'src="' + svg(b.ab, b.color) + '"')
      .replace(/data-brand="YEELIGHT"/, `data-brand="${b.key}"`)
      .replace(/(<span class="brand-fallback" hidden>)[^<]*(<\/span>)/, `$1${b.key}$2`)
      .replace(
        /<span class="integration-name"><strong>[^<]*<\/strong><small>[^<]*<\/small><\/span>/,
        `<span class="integration-name"><strong>${b.name}</strong><small>${b[lang]}</small></span>`,
      );
    add += "\n          " + pill;
  }
  if (!add) continue;
  const at = start + m.index + m[0].length;
  h = h.slice(0, at) + add + h.slice(at);
  fs.writeFileSync(p, h);
  n++;
}
console.log("site-integrations updated", n, "files");
