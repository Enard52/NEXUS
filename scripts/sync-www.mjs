// Kökteki güncel uygulama dosyalarını www/ altına kopyalar (Capacitor webDir).
// Yalnızca uygulamanın kendi dosyaları kopyalanır; hiçbir şey silinmez.
// www/ altındaki derlenmiş varlıklar (css/tailwind.css, fonts, js/lucide.js, leaflet) korunur.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.join(ROOT, "src", "app");
const WWW = path.join(ROOT, "www");

export const APP_JS = [
  "ai-fab.js",
  "auth.js",
  "automation-engine.js",
  "cloud-sync.js",
  "cloud-config.js",
  "data.js",
  "desktop.js",
  "device-controls.js",
  "lan-connectors.js",
  "setup-codes.js",
  "i18n.js",
  "lang-en.js",
  "nexus-assistant.js",
  "nexus-feedback.js",
  "sheet-gestures.js",
  "smart-card-detail-state.js",
  "smart-scene-page.js",
  "supported-devices.js",
  "theme.js",
  "command-palette.js",
  "event-bridge.js",
  "nexus-dialog.js",
  "notify.js",
];
export const APP_FILES = ["index.html", "logos.json", "logo.png", "siri-logo.png", "favicon.ico", "sw.js", "manifest.webmanifest", "automation-worker.html"];
export const APP_DIRS = ["css", "fonts", "js", "assets", "icons", "leaflet"];

function copy(src, dst) {
  if (!fs.existsSync(src)) return 0;
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    let n = 0;
    for (const name of fs.readdirSync(src)) n += copy(path.join(src, name), path.join(dst, name));
    return n;
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  return 1;
}

let n = 0;
for (const f of fs.readdirSync(APP)) {
  if (/^nexus-.*\.html$/.test(f) || APP_FILES.includes(f) || APP_JS.includes(f))
    n += copy(path.join(APP, f), path.join(WWW, f));
}
for (const d of APP_DIRS) n += copy(path.join(ROOT, d), path.join(WWW, d));

// iOS kabuğu (tek kaynak ilkesi): www/ içeriğinin tamamı ios/App/App/public'e
// aynalanır — cap sync ios bir macOS/Xcode gerektirdiğinden Windows'ta yapılamaz.
// Aynalanma sil-kopyala: eski varlık kalıntısı bırakmaz (android cap sync ile aynı içerik).
const IOS_PUBLIC = path.join(ROOT, "ios", "App", "App", "public");
if (fs.existsSync(path.join(ROOT, "ios", "App", "App"))) {
  fs.rmSync(IOS_PUBLIC, { recursive: true, force: true });
  fs.mkdirSync(IOS_PUBLIC, { recursive: true });
  let i = 0;
  for (const name of fs.readdirSync(WWW)) {
    if (name === "public") continue; // tanıtım sitesi iOS paketine girmez
    i += copy(path.join(WWW, name), path.join(IOS_PUBLIC, name));
  }
  console.log(`iOS kabuğu güncellendi: ${i} dosya (ios/App/App/public)`);
}
console.log(`www güncellendi: ${n} dosya kopyalandı`);
