// Masaüstü paketine girecek uygulama dosyalarını desktop/app/ altına toplar.
// Kaynak: proje kökündeki güncel ekranlar + www/ altındaki derlenmiş varlıklar
// (tailwind.css, fontlar, lucide, leaflet). Telefonla aynı ekranlar, aynı sürüm.
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");
const APP = path.join(ROOT, "src", "app");
const WWW = path.join(ROOT, "www");
const OUT = path.resolve(__dirname, "..", "app");

function copy(src, dst) {
  if (!fs.existsSync(src)) return false;
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const name of fs.readdirSync(src)) copy(path.join(src, name), path.join(dst, name));
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
  return true;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 1) Derlenmiş ortak varlıklar (yalnızca www'de bulunur)
for (const dir of ["css", "fonts", "js", "leaflet", "icons"]) copy(path.join(WWW, dir), path.join(OUT, dir));

// 2) Güncel uygulama dosyaları (src/app tek kaynaktır)
const APP_JS = new Set(["ai-fab.js", "auth.js", "automation-engine.js", "cloud-sync.js", "data.js", "desktop.js", "device-controls.js", "lan-connectors.js", "setup-codes.js", "i18n.js", "lang-en.js", "nexus-assistant.js", "nexus-feedback.js",
  "sheet-gestures.js", "smart-card-detail-state.js", "smart-scene-page.js", "supported-devices.js", "theme.js", "command-palette.js", "event-bridge.js", "nexus-dialog.js", "notify.js"]);
for (const f of fs.readdirSync(APP)) {
  const isPage = /^stitch-.*\.html$/.test(f) || f === "index.html";
  const isAsset = ["logos.json", "logo.png", "siri-logo.png", "favicon.ico", "sw.js", "manifest.webmanifest", "automation-worker.html"].includes(f);
  if (isPage || isAsset || APP_JS.has(f)) copy(path.join(APP, f), path.join(OUT, f));
}
copy(path.join(ROOT, "css"), path.join(OUT, "css"));
copy(path.join(ROOT, "fonts"), path.join(OUT, "fonts"));
copy(path.join(ROOT, "js"), path.join(OUT, "js"));
copy(path.join(ROOT, "assets"), path.join(OUT, "assets"));
// Kullanım koşulları / gizlilik sayfaları (site derlemesi) uygulama içinden açılır
copy(path.join(ROOT, "public"), path.join(OUT, "public")) || copy(path.join(WWW, "public"), path.join(OUT, "public"));

// 3) Bulut anahtarları repoda yoksa uygulama yerel modda çalışır
const cloud = path.join(ROOT, "cloud-config.js");
copy(fs.existsSync(cloud) ? cloud : path.join(ROOT, "cloud-config.example.js"), path.join(OUT, "cloud-config.js"));

// 4) Zorunlu dosyalar gerçekten var mı?
const required = ["index.html", "stitch-home.html", "theme.js", "desktop.js", "lan-connectors.js", "automation-engine.js", "sw.js", "manifest.webmanifest", "automation-worker.html", "css/tailwind.css", "css/nexus-ui.css", "js/lucide.js", "fonts/inter/inter.css"];
const missing = required.filter((f) => !fs.existsSync(path.join(OUT, f)));
if (missing.length) {
  console.error("Eksik dosyalar:", missing.join(", "));
  process.exit(1);
}
const count = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(dir, e.name)) : 1), 0);
console.log(`NEXUS uygulama dosyaları hazır: ${count(OUT)} dosya → ${OUT}`);
