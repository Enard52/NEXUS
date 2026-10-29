// Masaüstü paketine girecek src/app dosyalarının TEK kaynağı.
//
// Neden ayrı bir dosya: 1.0.32'de köprü modülü (kit/bridge.cjs) pakete hiç girmediği için
// kurulum açılmıyordu; aynı sınıf hata burada da yaşanıyordu — prepare-app.cjs'teki el ile
// tutulan APP_JS listesi, theme.js'in çalışırken yüklediği push.js'i (ve
// firebase-messaging-sw.js) tanımıyor, masaüstü paketine koymuyordu. Liste kapalı olduğu
// sürece yeni bir dosya ekleyen herkes bunu hatırlamak zorunda kalırdı.
//
// Kural artık ters: src/app altındaki her .js varsayılan olarak gemiye girer.
// Girmemesi gerekenler EXCLUDE_JS'ye yazılır (gerekçesiyle). Testler bunu kilitler.
const path = require("node:path");

// Uygulama ekranları: nexus-*.html + index.html
function isPage(file) {
  return /^nexus-.*\.html$/.test(file) || file === "index.html";
}

// Ekran olmayan ama pakete girmesi gereken sabit varlıklar.
const STATIC_ASSETS = [
  "logos.json",
  "logo.png",
  "siri-logo.png",
  "favicon.ico",
  "sw.js",
  "manifest.webmanifest",
  "automation-worker.html",
];

// src/app'de bulunsa bile pakete KONMAYAN dosyalar.
// cloud-config.js: gerçek anahtarlar repoda durmaz; prepare-app.cjs 3. adımda
// cloud-config.example.js'i kontrollü biçimde oraya yerleştirir. Karıştırmak yasak.
const EXCLUDE_JS = new Set(["cloud-config.js"]);

function isAppFile(file) {
  if (EXCLUDE_JS.has(file)) return false;
  if (file.endsWith(".js")) return true;
  return isPage(file) || STATIC_ASSETS.includes(file);
}

// prepare-app.cjs ile aynı yolu tek yerden hesaplamak için.
const RULES_DIR = __dirname;
const DESKTOP_ROOT = path.resolve(RULES_DIR, "..");
const REPO_ROOT = path.resolve(DESKTOP_ROOT, "..");

module.exports = { isPage, isAppFile, EXCLUDE_JS, STATIC_ASSETS, DESKTOP_ROOT, REPO_ROOT };
