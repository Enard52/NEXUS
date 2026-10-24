// NEXUS — masaüstü uygulaması (Windows, macOS, Linux)
//
// Telefon uygulamasıyla aynı ekranları (stitch-*.html) çevrimdışı olarak paketler ve
// geniş ekranda masaüstü düzeninde açar. Ek olarak masaüstüne özgü bir köprü sağlar:
//   - Yerel ağ HTTP istekleri (CORS/mixed-content yok)  → Shelly, WLED, Tasmota, ESPHome, Hue
//   - Yerel ağ TCP istekleri                             → TP-Link Kasa, Yeelight
//   - Bilgisayarın yerel alt ağını bulma                  → otomatik cihaz taraması
// Güvenlik: köprü yalnızca özel ağ adreslerine (192.168.x, 10.x, 172.16-31.x, link-local,
// localhost) izin verir; uygulama içeriği izole bağlamda, Node erişimi olmadan çalışır.

const { app, BrowserWindow, Menu, shell, ipcMain, protocol, net, nativeTheme, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const http = require("node:http");
const tcp = require("node:net");
const { pathToFileURL } = require("node:url");

const APP_DIR = path.join(__dirname, "app");
const SCHEME = "nexus";
const START_URL = `${SCHEME}://app/index.html`;

app.setName("NEXUS");
if (process.platform === "win32") app.setAppUserModelId("app.nexus.desktop");

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

// ---------- Tek örnek ----------
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let win = null;

// ---------- Pencere boyutu hatırlama ----------
const stateFile = () => path.join(app.getPath("userData"), "window-state.json");
function loadBounds() {
  try { return JSON.parse(fs.readFileSync(stateFile(), "utf8")); } catch { return null; }
}
function saveBounds() {
  if (!win || win.isDestroyed()) return;
  try {
    const b = win.getNormalBounds();
    fs.writeFileSync(stateFile(), JSON.stringify({ ...b, maximized: win.isMaximized() }));
  } catch { /* yazılamazsa sorun değil */ }
}

// ---------- Özel ağ adresi denetimi ----------
function isPrivateHost(host) {
  const h = String(host || "").replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "localhost" || h === "::1") return true;
  if (/\.local$/.test(h)) return true; // mDNS adları (shelly-xxxx.local)
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return /^fe80:|^fc|^fd/.test(h);
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254);
}

// ---------- Köprü: yerel ağ HTTP ----------
ipcMain.handle("lan:http", (_e, opts) => new Promise((resolve, reject) => {
  let url;
  try { url = new URL(opts.url); } catch { return reject(new Error("geçersiz adres")); }
  if (url.protocol !== "http:" || !isPrivateHost(url.hostname)) return reject(new Error("yalnızca yerel ağ adreslerine izin verilir"));
  const body = opts.body == null ? null : Buffer.from(String(opts.body));
  const req = http.request(url, {
    method: opts.method || "GET",
    headers: { ...(opts.headers || {}), ...(body ? { "Content-Length": body.length } : {}) },
    timeout: Math.min(Number(opts.timeoutMs) || 2500, 15000),
  }, (res) => {
    const chunks = [];
    let size = 0;
    res.on("data", (c) => { size += c.length; if (size > 2 * 1024 * 1024) req.destroy(new Error("yanıt çok büyük")); else chunks.push(c); });
    res.on("end", () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString("utf8") }));
  });
  req.on("timeout", () => req.destroy(new Error("zaman aşımı")));
  req.on("error", (err) => reject(new Error(err.message)));
  if (body) req.write(body);
  req.end();
}));

// ---------- Köprü: yerel ağ TCP (Kasa 9999, Yeelight 55443) ----------
const TCP_PORTS = new Set([9999, 55443]);
ipcMain.handle("lan:tcp", (_e, opts) => new Promise((resolve, reject) => {
  const port = Number(opts.port);
  if (!isPrivateHost(opts.host) || !TCP_PORTS.has(port)) return reject(new Error("izin verilmeyen hedef"));
  const sock = tcp.createConnection({ host: opts.host, port });
  const timeout = Math.min(Number(opts.timeoutMs) || 2500, 15000);
  const chunks = [];
  let done = false;
  const finish = (fn, v) => { if (done) return; done = true; clearTimeout(timer); sock.destroy(); fn(v); };
  const timer = setTimeout(() => finish(reject, new Error("zaman aşımı")), timeout);
  sock.on("connect", () => {
    if (opts.bytes) sock.write(Buffer.from(opts.bytes));
    else sock.write(String(opts.text || ""));
  });
  sock.on("data", (c) => {
    chunks.push(c);
    const all = Buffer.concat(chunks);
    if (opts.lengthPrefixed && all.length >= 4 && all.length >= 4 + all.readUInt32BE(0)) finish(resolve, Array.from(all));
    if (opts.untilNewline && all.includes(10)) finish(resolve, all.toString("utf8"));
  });
  sock.on("end", () => { const all = Buffer.concat(chunks); finish(resolve, opts.bytes ? Array.from(all) : all.toString("utf8")); });
  sock.on("error", (err) => finish(reject, new Error(err.message)));
}));

// ---------- Köprü: yerel alt ağlar ----------
ipcMain.handle("lan:subnets", () => {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const ni of list || []) {
      if (ni.family !== "IPv4" || ni.internal || !isPrivateHost(ni.address) || ni.address.startsWith("169.254.")) continue;
      const prefix = ni.address.split(".").slice(0, 3).join(".");
      if (!out.includes(prefix)) out.push(prefix);
    }
  }
  return out;
});

ipcMain.handle("app:info", () => ({ version: app.getVersion(), platform: process.platform, arch: process.arch }));

// ---------- Uygulama içeriği: nexus://app/... → paketlenmiş dosyalar ----------
function serveApp() {
  protocol.handle(SCHEME, (request) => {
    const { pathname } = new URL(request.url);
    const rel = decodeURIComponent(pathname).replace(/^\/+/, "") || "index.html";
    const file = path.normalize(path.join(APP_DIR, rel));
    if (!file.startsWith(APP_DIR)) return new Response("Yasak", { status: 403 });
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return new Response("Bulunamadı", { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
}

function isAppUrl(u) { return typeof u === "string" && u.startsWith(`${SCHEME}://app/`); }

function createWindow() {
  const saved = loadBounds();
  win = new BrowserWindow({
    width: saved?.width || 1360,
    height: saved?.height || 860,
    x: saved?.x,
    y: saved?.y,
    minWidth: 900,
    minHeight: 620,
    title: "NEXUS",
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0f172a" : "#ECE9FD",
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "resources", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  if (saved?.maximized) win.maximize();
  win.once("ready-to-show", () => win.show());
  win.on("close", saveBounds);

  // Dış bağlantılar varsayılan tarayıcıda açılır; uygulama dışına gezinme engellenir
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:|^mailto:|^tel:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    if (/^https?:|^mailto:|^tel:/.test(url)) shell.openExternal(url);
  });

  win.loadURL(START_URL);
}

// Menü ve iletişim kutuları uygulamanın diliyle (Türkçe / English) gösterilir.
// Uygulama dili renderer'dan bildirilir (app:language); bildirilene kadar sistem dili kullanılır.
// Türk dünyası (TR, KKTC, AZ, KZ, UZ, KG, TM) → Türkçe, diğerleri → İngilizce. Uygulama açılınca
// kullanıcının kendi seçimi (theme.js) setLanguage ile buraya gelir ve menüler ona uyar.
function detectLang() {
  const tags = [app.getLocale ? app.getLocale() : "", app.getSystemLocale ? app.getSystemLocale() : ""].concat(app.getPreferredSystemLanguages ? app.getPreferredSystemLanguages() : []);
  if (/^(tr|az|kk|uz|ky|tk|tt|ba|crh|gag)\b/i.test(tags[0] || "")) return "tr";
  if (tags.some((t) => /[-_](TR|AZ|KZ|UZ|KG|TM)\b/i.test(t || ""))) return "tr";
  let tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { /* bilinmiyor */ }
  if (/^(Europe\/Istanbul|Asia\/Istanbul|Asia\/Famagusta|Asia\/Baku|Asia\/(Almaty|Qyzylorda|Aqtobe|Aqtau|Atyrau|Oral|Qostanay)|Asia\/(Tashkent|Samarkand)|Asia\/Bishkek|Asia\/(Ashgabat|Ashkhabad)|Turkey)$/.test(tz)) return "tr";
  return tags.some((t) => /^tr\b/i.test(t || "")) ? "tr" : "en";
}
let uiLang = "en";
const L = (tr, en) => (uiLang === "en" ? en : tr);

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{ label: "NEXUS", submenu: [{ role: "about", label: L("NEXUS Hakkında", "About NEXUS") }, { type: "separator" }, { role: "hide", label: L("Gizle", "Hide") }, { role: "hideOthers", label: L("Diğerlerini Gizle", "Hide Others") }, { type: "separator" }, { role: "quit", label: L("Çıkış", "Quit") }] }] : []),
    { label: L("Dosya", "File"), submenu: [isMac ? { role: "close", label: L("Pencereyi Kapat", "Close Window") } : { role: "quit", label: L("Çıkış", "Exit") }] },
    { label: L("Düzen", "Edit"), submenu: [{ role: "undo", label: L("Geri Al", "Undo") }, { role: "redo", label: L("Yinele", "Redo") }, { type: "separator" }, { role: "cut", label: L("Kes", "Cut") }, { role: "copy", label: L("Kopyala", "Copy") }, { role: "paste", label: L("Yapıştır", "Paste") }, { role: "selectAll", label: L("Tümünü Seç", "Select All") }] },
    { label: L("Görünüm", "View"), submenu: [{ role: "reload", label: L("Yenile", "Reload") }, { type: "separator" }, { role: "resetZoom", label: L("Gerçek Boyut", "Actual Size") }, { role: "zoomIn", label: L("Yakınlaştır", "Zoom In") }, { role: "zoomOut", label: L("Uzaklaştır", "Zoom Out") }, { type: "separator" }, { role: "togglefullscreen", label: L("Tam Ekran", "Full Screen") }] },
    { label: L("Yardım", "Help"), submenu: [
      { label: "NEXUS Sitesi", click: () => shell.openExternal("https://nexus-ai-app.pages.dev") },
      { label: L("Sürüm ", "Version ") + app.getVersion(), enabled: false },
    ] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.on("app:language", (_e, lang) => {
  if ((lang === "tr" || lang === "en") && lang !== uiLang) { uiLang = lang; buildMenu(); }
});

// ---------- Otomatik güncelleme (GitHub Releases) ----------
function setupUpdates() {
  if (!app.isPackaged || process.env.NEXUS_NO_UPDATE) return;
  let autoUpdater;
  try { ({ autoUpdater } = require("electron-updater")); } catch { return; }
  autoUpdater.autoDownload = true;
  autoUpdater.on("update-downloaded", (info) => {
    dialog.showMessageBox(win, {
      type: "info",
      buttons: [L("Şimdi yeniden başlat", "Restart now"), L("Sonra", "Later")],
      defaultId: 0,
      title: L("NEXUS güncellemesi hazır", "NEXUS update ready"),
      message: L(`NEXUS ${info.version} indirildi.`, `NEXUS ${info.version} has been downloaded.`),
      detail: L("Uygulamayı yeniden başlattığında yeni sürüm açılır.", "The new version opens when you restart the app."),
    }).then(({ response }) => { if (response === 0) autoUpdater.quitAndInstall(); });
  });
  autoUpdater.on("error", () => { /* çevrimdışıyken sessiz kal */ });
  autoUpdater.checkForUpdates().catch(() => {});
}

app.on("second-instance", () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.whenReady().then(() => {
  uiLang = detectLang();
  serveApp();
  buildMenu();
  createWindow();
  setupUpdates();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
