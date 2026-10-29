// NEXUS — masaüstü uygulaması (Windows, macOS, Linux)
//
// Telefon uygulamasıyla aynı ekranları (nexus-*.html) çevrimdışı olarak paketler ve
// geniş ekranda masaüstü düzeninde açar. Ek olarak masaüstüne özgü bir köprü sağlar:
//   - Yerel ağ HTTP istekleri (CORS/mixed-content yok)  → Shelly, WLED, Tasmota, ESPHome, Hue
//   - Yerel ağ TCP istekleri                             → TP-Link Kasa, Yeelight
//   - Bilgisayarın yerel alt ağını bulma                  → otomatik cihaz taraması
// Güvenlik: köprü yalnızca özel ağ adreslerine (192.168.x, 10.x, 172.16-31.x, link-local,
// localhost) izin verir; uygulama içeriği izole bağlamda, Node erişimi olmadan çalışır.
//
// Arka planda çalışma: pencere kapatılınca uygulama tepsi simgesine gizlenir ve çalışmaya
// devam eder (akıllı ev asistanı). Tepsi menüsünden: gösterme, "kapatınca arka planda
// çalış" seçeneği, bilgisayarla başlatma (Windows/macOS), yeniden başlatma ve tam çıkış.

const {
  app,
  BrowserWindow,
  Menu,
  shell,
  ipcMain,
  protocol,
  net,
  nativeTheme,
  dialog,
  Tray,
  Notification,
  screen,
  globalShortcut,
  session,
  nativeImage,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const http = require("node:http");
const tcp = require("node:net");
const dgram = require("node:dgram");
const { pathToFileURL } = require("node:url");

const APP_DIR = path.join(__dirname, "app");
const SCHEME = "nexus";
const PAGES = {
  home: "nexus-home.html",
  pair: "nexus-pair.html",
  messages: "nexus-messages.html",
  settings: "nexus-settings.html",
  chat: "nexus-chat.html",
};
function pageFromArgv(argv) {
  const a = (argv || []).find((x) => typeof x === "string" && x.startsWith("--go="));
  const key = a ? a.slice(5) : "";
  return Object.prototype.hasOwnProperty.call(PAGES, key) ? PAGES[key] : null;
}
const launchPage = pageFromArgv(process.argv);
const START_URL = `${SCHEME}://app/${launchPage || "index.html"}`;

app.setName("NEXUS");
if (process.platform === "win32") app.setAppUserModelId("app.nexus.desktop");

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

// ---------- Tek örnek ----------
if (!app.requestSingleInstanceLock()) {
  // Kilodu alan örnek değil. app.quit() burada yeterli değil: modülün geri kalanı
  // (whenReady → pencere + tray + global kısayol) çalışmaya devam ediyor, yani iki
  // simge birden kurulabiliyordu. Kaybeden süreç derhal sonlanır.
  app.quit();
  process.exit(0);
}

let win = null;

// ---------- Pencere boyutu hatırlama ----------
const stateFile = () => path.join(app.getPath("userData"), "window-state.json");
function loadBounds() {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), "utf8"));
  } catch {
    return null;
  }
}
function saveBounds() {
  if (!win || win.isDestroyed()) return;
  try {
    const b = win.getNormalBounds();
    fs.writeFileSync(stateFile(), JSON.stringify({ ...b, maximized: win.isMaximized() }));
  } catch {
    /* yazılamazsa sorun değil */
  }
}

// ---------- Dil tespiti ve çok dilli metinler ----------
// app.getLocale / getSystemLocale / getPreferredSystemLanguages YALNIZCA app hazır
// olduktan sonra çağrılabilir; önce çağrılırsa Electron fırlatır:
//   "app.getSystemLocale() can only be called after app is ready"
// detectLang modül yüklenirken de çalışıyor (uiLang'ın başlangıç değeri), bu yüzden
// hiçbir çağrı fırlatmamalı — 1.0.26'da tam bu yüzden Windows kurulumu açılışta çöktü.
// Hazır değilken Node/Chromium'un her zaman verdiği Intl yereli + saat dilimi kullanılır;
// whenReady içinde (aşağıda) tam API ile bir kez daha tespit edilir.
function appTag(fn) {
  if (typeof fn !== "function") return "";
  try {
    return String(fn.call(app) || "");
  } catch {
    return "";
  }
}
function detectLang() {
  let ready = false;
  try {
    ready = typeof app.isReady === "function" && !!app.isReady();
  } catch {
    ready = false;
  }
  const tags = [];
  if (ready) {
    tags.push(appTag(app.getLocale), appTag(app.getSystemLocale));
    try {
      if (typeof app.getPreferredSystemLanguages === "function")
        tags.push(...(app.getPreferredSystemLanguages() || []));
    } catch {
      /* hazır değilse/desteklenmiyorsa tahmin yeterli */
    }
  }
  try {
    tags.push(Intl.DateTimeFormat().resolvedOptions().locale || "");
  } catch {
    /* ICU yok */
  }
  if (/^(tr|az|kk|uz|ky|tk|tt|ba|crh|gag)\b/i.test(tags[0] || "")) return "tr";
  if (tags.some((t) => /[-_](TR|AZ|KZ|UZ|KG|TM)\b/i.test(t || ""))) return "tr";
  let tz = "";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch (e) {
    /* bilinmiyor */
  }
  if (
    /^(Europe\/Istanbul|Asia\/Istanbul|Asia\/Famagusta|Asia\/Baku|Asia\/(Almaty|Qyzylorda|Aqtobe|Aqtau|Atyrau|Oral|Qostanay)|Asia\/(Tashkent|Samarkand)|Asia\/Bishkek|Asia\/(Ashgabat|Ashkhabad)|Turkey)$/.test(
      tz,
    )
  )
    return "tr";
  return tags.some((t) => /^tr\b/i.test(t || "")) ? "tr" : "en";
}
let uiLang = detectLang();
const L = (tr, en) => (uiLang === "en" ? en : tr);

// ---------- Arka planda çalışma / tepsi ayarları ----------
// Akıllı ev asistanı olduğu için uygulama pencere kapatılsa da çalışmaya devam eder
// (tepsi simgesine gizlenir). Davranış tepsi menüsünden ve menü çubuğundan yönetilir.
const desktopSettingsFile = () => path.join(app.getPath("userData"), "desktop-settings.json");
function loadDesktopSettings() {
  try {
    return JSON.parse(fs.readFileSync(desktopSettingsFile(), "utf8"));
  } catch {
    return {};
  }
}
function persistDesktopSettings(patch) {
  try {
    fs.writeFileSync(desktopSettingsFile(), JSON.stringify({ ...loadDesktopSettings(), ...patch }));
  } catch {
    /* kota */
  }
}
let backgroundRun = loadDesktopSettings().backgroundRun !== false; // varsayılan: açık
let tray = null;
let trayBalloonShown = false;
let automationWorker = null;

// Otomasyon arka plan çalışanı (issue #24): gizli pencerede automation-worker.html
// çalışır. Kullanıcı pencereyi kapatsa da uygulama tepside olduğu sürece zaman
// tetikleyicili otomasyonlar değerlendirilmeye devam eder. Görünür pencere ile
// sahiplik, sayfanın localStorage kalp atışı ile paylaşılır; ikisi aynı anda
// çalıştırmaz. Sekme kısıtlaması (arka planda zamanlayıcı yavaşlatma) kapatılır.
function createAutomationWorker() {
  try {
    automationWorker = new BrowserWindow({
      show: false,
      skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false,
        spellcheck: false,
      },
    });
    automationWorker.loadURL(`${SCHEME}://app/automation-worker.html`);
    automationWorker.on("closed", () => {
      automationWorker = null;
    });
  } catch {
    /* protokol/pencere hazır değilse sessiz geç */
  }
}

function showMainWindow() {
  if (!win || win.isDestroyed()) {
    createWindow();
    return;
  }
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function showPage(page) {
  showMainWindow();
  if (win && !win.isDestroyed()) {
    win.loadURL(`${SCHEME}://app/${page}`);
  }
}

function quitApp() {
  app.isQuitting = true;
  app.quit();
}

function restartApp() {
  app.isQuitting = true;
  app.relaunch();
  app.quit();
}

// Bilgisayarla başlarken pencere açılmaz: uygulama doğrudan tepsiye iner (--hidden).
const LOGIN_ARGS = ["--hidden"];
function setOpenAtLogin(on) {
  try {
    app.setLoginItemSettings({ openAtLogin: !!on, openAsHidden: true, args: LOGIN_ARGS });
  } catch {
    /* platform desteklemiyorsa */
  }
}
function getOpenAtLogin() {
  try {
    return !!app.getLoginItemSettings({ args: LOGIN_ARGS }).openAtLogin;
  } catch {
    return false;
  }
}
// macOS'ta getLoginItemSettings() hazır değilken fırlatıyor ("can only be called
// after app is ready"). Bu değer yalnızca pencere kurulurken okunuyor (aşağıda
// ready-to-show), o yüzden tembel tutuluyor: modül yüklenirken çağrılırsa macOS
// kurulumu da açılışta çökerdi.
function wasOpenedAsHidden() {
  try {
    return !!(app.getLoginItemSettings() || {}).wasOpenedAsHidden;
  } catch {
    return false;
  }
}
const isStartHidden = () =>
  process.argv.includes("--hidden") || (process.platform === "darwin" && wasOpenedAsHidden());

let lastTrayStatus = null;

function trayTemplate() {
  const items = [];
  if (lastTrayStatus && lastTrayStatus.devices > 0) {
    items.push({
      label: L(
        `🟢  Ev: ${lastTrayStatus.devices} Cihaz (${lastTrayStatus.on} Açık)`,
        `🟢  Home: ${lastTrayStatus.devices} Devices (${lastTrayStatus.on} On)`,
      ),
      enabled: false,
    });
    items.push({ type: "separator" });
  }

  items.push(
    { label: L("NEXUS'u Aç", "Open NEXUS"), click: showMainWindow, default: true },
    { type: "separator" },
    {
      label: L("Kapatıldığında arka planda çalış", "Keep running in background when closed"),
      type: "checkbox",
      checked: backgroundRun,
      click: (item) => {
        backgroundRun = item.checked;
        persistDesktopSettings({ backgroundRun });
      },
    },
  );
  // Otomatik başlangıç Windows/macOS'ta anlamlı ve Electron destekli; Linux'ta yok.
  if (process.platform !== "linux") {
    items.push({
      label: L("Bilgisayar açıldığında otomatik başlat", "Launch on system startup"),
      type: "checkbox",
      checked: getOpenAtLogin(),
      click: (item) => setOpenAtLogin(item.checked),
    });
  }
  items.push(
    { type: "separator" },
    { label: L("Yeniden Başlat", "Restart"), click: restartApp },
    { label: L("Tamamen Çıkış", "Quit Completely"), click: quitApp },
  );
  return items;
}

function updateTrayMenu() {
  if (tray) tray.setContextMenu(Menu.buildFromTemplate(trayTemplate()));
}

function hideToTray() {
  if (!tray) createTray();
  if (win && !win.isDestroyed()) win.hide();
  if (trayBalloonShown) return;
  trayBalloonShown = true;
  const notifTitle = L("Arka Planda Çalışıyor", "Running in Background");
  const notifBody = L(
    "Cihaz bağlantıları ve otomasyonlar aktif. Açmak için simgeye tıklayın.",
    "Automations and device links stay active. Click icon to reopen.",
  );
  try {
    const pngPath = path.join(__dirname, "resources", "icon.png");
    const notifIcon = fs.existsSync(pngPath) ? pngPath : resolveTrayIcon();
    if (Notification.isSupported()) {
      const n = new Notification({
        title: notifTitle,
        body: notifBody,
        icon: notifIcon || undefined,
        silent: false,
      });
      n.on("click", () => showMainWindow());
      n.show();
    } else if (process.platform === "win32" && tray && tray.displayBalloon) {
      tray.displayBalloon({
        icon: resolveTrayIcon() || undefined,
        title: notifTitle,
        content: notifBody,
      });
    }
  } catch {
    /* bildirim gösterilemezse sorun değil */
  }
}

function resolveTrayIcon() {
  const icoPath = path.join(__dirname, "resources", "icon.ico");
  const pngPath = path.join(__dirname, "resources", "icon.png");
  if (process.platform === "win32" && fs.existsSync(icoPath)) {
    try {
      return nativeImage.createFromPath(icoPath);
    } catch {}
  }
  if (fs.existsSync(pngPath)) {
    try {
      return nativeImage.createFromPath(pngPath);
    } catch {}
  }
  if (fs.existsSync(icoPath)) {
    try {
      return nativeImage.createFromPath(icoPath);
    } catch {}
  }
  return null;
}

function createTray() {
  // macOS'ta dock zaten uygulamayı canlı tutar; tepsi Windows/Linux davranışıdır.
  if (process.platform === "darwin") return;
  if (tray) return;
  try {
    const iconImg = resolveTrayIcon();
    if (!iconImg || iconImg.isEmpty()) return;
    tray = new Tray(iconImg);
    tray.setToolTip("NEXUS");
    updateTrayMenu();
    tray.on("click", () => {
      if (win && !win.isDestroyed() && win.isVisible() && win.isFocused()) hideToTray();
      else showMainWindow();
    });
    tray.on("double-click", () => {
      showMainWindow();
    });
  } catch (e) {
    // Tepsi oluşturulamazsa (ortam desteklemiyorsa) uygulama klasik davranışa döner.
    tray = null;
  }
}

// ---------- Özel ağ adresi denetimi ----------
function isPrivateHost(host) {
  const h = String(host || "")
    .replace(/^\[|\]$/g, "")
    .toLowerCase();
  if (h === "localhost" || h === "::1" || h === "255.255.255.255") return true;
  if (/\.local$/.test(h)) return true; // mDNS adları (shelly-xxxx.local)
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return /^fe80:|^fc|^fd/.test(h);
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 10 ||
    a === 127 ||
    (a === 192 && b === 168) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 169 && b === 254) ||
    (a === 255 && b === 255)
  );
}

// ---------- Köprü: yerel ağ HTTP ----------
ipcMain.handle(
  "lan:http",
  (_e, opts) =>
    new Promise((resolve, reject) => {
      let url;
      try {
        url = new URL(opts.url);
      } catch {
        return reject(new Error("geçersiz adres"));
      }
      if (url.protocol !== "http:" || !isPrivateHost(url.hostname))
        return reject(new Error("yalnızca yerel ağ adreslerine izin verilir"));
      const body = opts.body == null ? null : Buffer.from(String(opts.body));
      const req = http.request(
        url,
        {
          method: opts.method || "GET",
          headers: { ...(opts.headers || {}), ...(body ? { "Content-Length": body.length } : {}) },
          timeout: Math.min(Number(opts.timeoutMs) || 2500, 15000),
        },
        (res) => {
          const chunks = [];
          let size = 0;
          res.on("data", (c) => {
            size += c.length;
            if (size > 2 * 1024 * 1024) req.destroy(new Error("yanıt çok büyük"));
            else chunks.push(c);
          });
          res.on("end", () =>
            resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString("utf8") }),
          );
        },
      );
      req.on("timeout", () => req.destroy(new Error("zaman aşımı")));
      req.on("error", (err) => reject(new Error(err.message)));
      if (body) req.write(body);
      req.end();
    }),
);

// ---------- Köprü: yerel ağ TCP (Kasa 9999, Yeelight 55443, Tuya Local 6668) ----------
const TCP_PORTS = new Set([9999, 55443, 6668]);
ipcMain.handle(
  "lan:tcp",
  (_e, opts) =>
    new Promise((resolve, reject) => {
      const port = Number(opts.port);
      if (!isPrivateHost(opts.host) || !TCP_PORTS.has(port))
        return reject(new Error("izin verilmeyen hedef"));
      const sock = tcp.createConnection({ host: opts.host, port });
      const timeout = Math.min(Number(opts.timeoutMs) || 2500, 15000);
      const chunks = [];
      let done = false;
      const finish = (fn, v) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        sock.destroy();
        fn(v);
      };
      const timer = setTimeout(() => finish(reject, new Error("zaman aşımı")), timeout);
      sock.on("connect", () => {
        if (opts.bytes) sock.write(Buffer.from(opts.bytes));
        else sock.write(String(opts.text || ""));
      });
      sock.on("data", (c) => {
        chunks.push(c);
        const all = Buffer.concat(chunks);
        if (opts.lengthPrefixed && all.length >= 4 && all.length >= 4 + all.readUInt32BE(0))
          finish(resolve, Array.from(all));
        if (opts.untilNewline && all.includes(10)) finish(resolve, all.toString("utf8"));
      });
      sock.on("end", () => {
        const all = Buffer.concat(chunks);
        finish(resolve, opts.bytes ? Array.from(all) : all.toString("utf8"));
      });
      sock.on("error", (err) => finish(reject, new Error(err.message)));
    }),
);

// ---------- Köprü: yerel ağ UDP (WiZ 38899, LIFX 56700, Govee 4001/4003, WoL 9/7; Govee yanıtları 4002'ye gelir) ----------
const UDP_PORTS = new Set([38899, 56700, 4001, 4003, 9, 7]);
const UDP_REPLY_PORTS = new Set([4002]);
const replyWaiters = new Map(); // port -> { sock, waiters: Map<host, (msg)=>void> }
function replyChannel(port) {
  return new Promise((resolve, reject) => {
    const existing = replyWaiters.get(port);
    if (existing) return resolve(existing);
    const sock = dgram.createSocket({ type: "udp4", reuseAddr: true });
    const ch = { sock, waiters: new Map() };
    sock.on("message", (msg, rinfo) => {
      const w = ch.waiters.get(rinfo.address);
      if (w) {
        ch.waiters.delete(rinfo.address);
        w(msg);
      }
    });
    sock.once("error", (err) => {
      replyWaiters.delete(port);
      reject(new Error(err.message));
    });
    sock.bind(port, () => {
      replyWaiters.set(port, ch);
      resolve(ch);
    });
  });
}
ipcMain.handle("lan:udp", async (_e, opts) => {
  const port = Number(opts.port);
  const replyPort = opts.replyPort ? Number(opts.replyPort) : 0;
  if (
    !isPrivateHost(opts.host) ||
    !UDP_PORTS.has(port) ||
    (replyPort && !UDP_REPLY_PORTS.has(replyPort))
  )
    throw new Error("izin verilmeyen hedef");
  const payload = opts.hex
    ? Buffer.from(String(opts.hex), "hex")
    : Buffer.from(String(opts.text || ""), "utf8");
  if (payload.length > 1024) throw new Error("paket çok büyük");
  const timeout = Math.min(Number(opts.timeoutMs) || 2500, 15000);
  const answer = (msg) => ({ text: msg.toString("utf8"), hex: msg.toString("hex") });
  if (opts.noReply) {
    // Yanıt vermeyen komutlar (Govee turn/brightness/colorwc, Wake-on-LAN): paketi gönderir, yazma hatasını bildirir.
    return await new Promise((resolve, reject) => {
      const sock = dgram.createSocket("udp4");
      sock.bind(0, () => {
        try {
          sock.setBroadcast(true);
        } catch (_) {}
        sock.send(payload, port, opts.host, (err) => {
          try {
            sock.close();
          } catch {
            /* kapalı */
          }
          if (err) reject(new Error(err.message));
          else resolve({ sent: true });
        });
      });
    });
  }
  if (replyPort) {
    const ch = await replyChannel(replyPort);
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        ch.waiters.delete(opts.host);
        reject(new Error("zaman aşımı"));
      }, timeout);
      ch.waiters.set(opts.host, (msg) => {
        clearTimeout(timer);
        resolve(answer(msg));
      });
      ch.sock.send(payload, port, opts.host, (err) => {
        if (err) {
          clearTimeout(timer);
          ch.waiters.delete(opts.host);
          reject(new Error(err.message));
        }
      });
    });
  }
  return await new Promise((resolve, reject) => {
    const sock = dgram.createSocket("udp4");
    let done = false;
    const finish = (fn, v) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        sock.close();
      } catch {
        /* kapalı */
      }
      fn(v);
    };
    const timer = setTimeout(() => finish(reject, new Error("zaman aşımı")), timeout);
    sock.on("message", (msg, rinfo) => {
      if (rinfo.address === opts.host) finish(resolve, answer(msg));
    });
    sock.on("error", (err) => finish(reject, new Error(err.message)));
    sock.send(payload, port, opts.host, (err) => {
      if (err) finish(reject, new Error(err.message));
    });
  });
});
// ---------- Köprü: yerel alt ağlar ----------
ipcMain.handle("lan:subnets", () => {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const ni of list || []) {
      if (
        ni.family !== "IPv4" ||
        ni.internal ||
        !isPrivateHost(ni.address) ||
        ni.address.startsWith("169.254.")
      )
        continue;
      const prefix = ni.address.split(".").slice(0, 3).join(".");
      if (!out.includes(prefix)) out.push(prefix);
    }
  }
  return out;
});

ipcMain.handle("app:info", () => ({
  version: app.getVersion(),
  platform: process.platform,
  arch: process.arch,
}));

ipcMain.handle("desktop:settings:get", () => ({
  backgroundRun,
  openAtLogin: getOpenAtLogin(),
  platform: process.platform,
}));

// ---------- HomeKit (HAP) köprüsü: cihazları Apple Ev'e gerçek aksesuar olarak yayınlar ----------
// Yalnızca yerel ağ; Apple Ev (iPhone/iPad/Mac) eşleşme koduyla bağlanır.
// Komut akışı: Apple Home → HAP karakteristik → bridge.cjs → bu süreç → penceredeki
// HomeKit ekranının executor'ı → NEXUS'un kendi setField yolu (doğrulamalar aynı).
const kitBridge = require("./kit/bridge.cjs");
let kitCmdSeq = 0;
let kitExecutorSender = null;
const kitCmdPending = new Map();

function kitBroadcastStatus() {
  const st = kitBridge.status();
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) {
      try {
        w.webContents.send("kit:status", st);
      } catch (e) {}
    }
  }
}

function kitRouteToRenderer(device, patch) {
  return new Promise((resolve, reject) => {
    // Komut, köprüyü başlatan ekranın webContents'ine döner (executor yalnız o sayfada).
    let wc = kitExecutorSender && !kitExecutorSender.isDestroyed() ? kitExecutorSender : null;
    if (!wc) {
      const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
      wc = win ? win.webContents : null;
    }
    if (!wc) return reject(new Error("NEXUS penceresi açık değil"));
    const seq = ++kitCmdSeq;
    kitCmdPending.set(seq, {
      resolve,
      reject,
      timer: setTimeout(() => {
        kitCmdPending.delete(seq);
        reject(new Error("komut zaman aşımı"));
      }, 6000),
    });
    try {
      wc.send("kit:command", { seq, device, patch });
    } catch (e) {
      clearTimeout(kitCmdPending.get(seq).timer);
      kitCmdPending.delete(seq);
      reject(e);
    }
  });
}

ipcMain.handle("kit:start", async (e, payload) => {
  try {
    kitExecutorSender = e.sender && !e.sender.isDestroyed() ? e.sender : null;
  } catch {
    kitExecutorSender = null;
  }
  const persistPath = path.join(app.getPath("userData"), "homekit-bridge");
  await kitBridge.startKn({
    persistPath,
    name: "NEXUS",
    pincode: payload && payload.pincode,
    devices: (payload && payload.devices) || [],
    onCommand: (device, patch) => kitRouteToRenderer(device, patch),
  });
  kitBroadcastStatus();
  return kitBridge.status();
});

ipcMain.handle("kit:stop", () => {
  kitBridge.stop();
  kitExecutorSender = null;
  kitBroadcastStatus();
  return kitBridge.status();
});

ipcMain.handle("kit:status", () => kitBridge.status());

ipcMain.handle("kit:commandResult", (_e, r) => {
  const pending = r && kitCmdPending.get(r.seq);
  if (!pending) return true;
  clearTimeout(pending.timer);
  kitCmdPending.delete(r.seq);
  if (r.ok) pending.resolve({ ok: true, state: r.state });
  else pending.reject(new Error(String(r.error || "komut başarısız")));
  return true;
});

ipcMain.handle("kit:state", (_e, r) => {
  if (!r || !r.id) return false;
  kitBridge.onStatePatch(r.id, r.patch);
  return true;
});

ipcMain.handle("desktop:settings:set", (_e, patch) => {
  if (patch && typeof patch.backgroundRun === "boolean") {
    backgroundRun = patch.backgroundRun;
    persistDesktopSettings({ backgroundRun });
  }
  if (patch && typeof patch.openAtLogin === "boolean" && process.platform !== "linux") {
    setOpenAtLogin(patch.openAtLogin);
  }
  updateTrayMenu();
  return {
    backgroundRun,
    openAtLogin: getOpenAtLogin(),
    platform: process.platform,
  };
});

// Google girişi kullanıcının varsayılan sistem tarayıcısında (Chrome, Edge vb.) açılır;
// böylece tarayıcıda kayıtlı olan mevcut Google hesapları doğrudan görünür.
// Dönüşte yerel loopback sunucusu belirteci alıp masaüstü penceresine aktarır.
let loopbackServer = null;
function oauthTokenFrom(targetUrl) {
  if (!targetUrl || typeof targetUrl !== "string") return "";
  const hashIdx = targetUrl.indexOf("#");
  const hash = hashIdx !== -1 ? targetUrl.slice(hashIdx + 1) : "";
  if (/access_token=|error=/.test(hash)) return hash;
  try {
    const u = new URL(targetUrl);
    if (u.searchParams.get("access_token") || u.searchParams.get("error")) return u.search.slice(1);
  } catch {
    /* adres parçalanamadı */
  }
  return "";
}
function deliverOAuth(hash) {
  if (win && !win.isDestroyed() && hash) win.webContents.send("oauth:success", hash);
}
function startGoogleAuth(customUrl) {
  const authUrl = customUrl || "";
  if (!authUrl || !win || win.isDestroyed()) return;

  if (loopbackServer) {
    try {
      loopbackServer.close();
    } catch {}
    loopbackServer = null;
  }

  const http = require("http");
  loopbackServer = http.createServer((req, res) => {
    const reqUrl = req.url || "";

    // 2. Adım: Tarayıcıdaki JavaScript hash belirtecini buraya GET ile iletir
    if (reqUrl.startsWith("/__oauth_token?")) {
      const hash = reqUrl.slice("/__oauth_token?".length);
      const token = oauthTokenFrom(String(hash).startsWith("#") ? hash : "#" + hash);
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ ok: true }));

      if (token) {
        deliverOAuth(token);
        if (win && !win.isDestroyed()) {
          win.show();
          win.focus();
          if (typeof win.flashFrame === "function") win.flashFrame(true);
        }
      }
      setTimeout(() => {
        if (loopbackServer) {
          try {
            loopbackServer.close();
          } catch {}
          loopbackServer = null;
        }
      }, 1000);
      return;
    }

    // 1. Adım: Google & Supabase girişi tamamlandığında tarayıcı buraya yönlenir
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>NEXUS — Giriş Başarılı</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: #1e293b;
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 24px;
      padding: 40px 32px;
      text-align: center;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .icon {
      width: 64px;
      height: 64px;
      background: rgba(76, 125, 255, 0.15);
      color: #4C7DFF;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.01em; }
    p { color: #94a3b8; font-size: 15px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
    </div>
    <h1>Giriş Başarılı!</h1>
    <p>NEXUS masaüstü uygulamasına aktarılıyor. Bu sekmeyi kapatabilirsin.</p>
  </div>
  <script>
    (function() {
      var hash = location.hash || "";
      if (hash) {
        fetch("/__oauth_token?" + hash.replace(/^#/, "")).then(function() {
          setTimeout(function() { window.close(); }, 1200);
        }).catch(function() {});
      }
    })();
  </script>
</body>
</html>`);
  });

  loopbackServer.listen(0, "127.0.0.1", () => {
    const port = loopbackServer.address().port;
    const redirectUrl = `http://127.0.0.1:${port}/oauth-callback`;

    let targetUrl = authUrl;
    try {
      const u = new URL(authUrl);
      u.searchParams.set("redirect_to", redirectUrl);
      targetUrl = u.toString();
    } catch {
      targetUrl =
        authUrl +
        (authUrl.includes("?") ? "&" : "?") +
        "redirect_to=" +
        encodeURIComponent(redirectUrl);
    }

    // Kullanıcının mevcut Google hesaplarının bulunduğu varsayılan tarayıcıda açılır
    shell.openExternal(targetUrl);
  });

  setTimeout(() => {
    if (loopbackServer) {
      try {
        loopbackServer.close();
      } catch {}
      loopbackServer = null;
    }
  }, 180000);
}

ipcMain.handle("auth:google", async (_e, customUrl) => {
  startGoogleAuth(customUrl);
});

// ---------- Uygulama içeriği: nexus://app/... → paketlenmiş dosyalar ----------
function serveApp() {
  protocol.handle(SCHEME, (request) => {
    const { pathname } = new URL(request.url);
    const rel = decodeURIComponent(pathname).replace(/^\/+/, "") || "index.html";
    const file = path.normalize(path.join(APP_DIR, rel));
    if (!file.startsWith(APP_DIR)) return new Response("Yasak", { status: 403 });
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
      return new Response("Bulunamadı", { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
}

function isAppUrl(u) {
  return typeof u === "string" && u.startsWith(`${SCHEME}://app/`);
}

// Kayıtlı pencere konumu artık hiçbir ekranda değilse (monitör çıkarıldı, çözünürlük değişti)
// konumu bırak: pencere ana ekranda ortalanır.
function onScreen(b) {
  if (!b || typeof b.x !== "number" || typeof b.y !== "number") return false;
  const w = b.width || 400,
    h = b.height || 300;
  return screen
    .getAllDisplays()
    .some(
      ({ workArea: a }) =>
        b.x + w > a.x + 80 &&
        b.x < a.x + a.width - 80 &&
        b.y + 40 > a.y &&
        b.y < a.y + a.height - 80,
    );
}
function rescueWindow() {
  if (!win || win.isDestroyed() || win.isMaximized() || win.isFullScreen()) return;
  if (!onScreen(win.getBounds())) win.center();
}

function createWindow() {
  const saved = loadBounds();
  if (saved && !onScreen(saved)) {
    delete saved.x;
    delete saved.y;
  }
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
  win.removeMenu();
  win.setMenuBarVisibility(false);
  if (saved?.maximized) win.maximize();
  // Sessiz başlangıç: tepsi varsa pencere açılmadan arka planda başlar; yoksa normal açılır.
  win.once("ready-to-show", () => {
    if (!(isStartHidden() && tray && backgroundRun)) win.show();
  });
  // Pencere kapatılınca: arka planda çalışma açıksa ve tepsi varsa uygulamayı
  // tepsiye gizle (akıllı ev asistanı çalışmaya devam eder); değilse normal çık.
  win.on("close", (event) => {
    saveBounds();
    if (app.isQuitting) return;
    if (!backgroundRun || !tray) {
      app.isQuitting = true;
      if (automationWorker && !automationWorker.isDestroyed()) {
        try {
          automationWorker.destroy();
        } catch {}
      }
      app.quit();
      return;
    }
    event.preventDefault();
    hideToTray();
  });

  // Dış bağlantılar varsayılan tarayıcıda açılır. Giriş adresi tarayıcıya bırakılmaz;
  // Google penceresi uygulamanın içinde kalır, dönüşteki oturum siteye düşmez.
  function leaveApp(url) {
    const token = oauthTokenFrom(url);
    if (token) {
      deliverOAuth(token);
      return;
    }
    if (/supabase\.co\/auth\/v1\/authorize/.test(url)) {
      startGoogleAuth(url);
      return;
    }
    if (/^https?:|^mailto:|^tel:/.test(url)) shell.openExternal(url);
  }
  win.webContents.setWindowOpenHandler(({ url }) => {
    leaveApp(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    leaveApp(url);
  });

  win.on("closed", () => {
    win = null;
  });

  win.loadURL(START_URL);
}

// Menü ve iletişim kutuları uygulamanın diliyle (Türkçe / English) gösterilir.
function buildMenu() {
  const isMac = process.platform === "darwin";
  if (!isMac) {
    Menu.setApplicationMenu(null);
    if (win && !win.isDestroyed()) win.removeMenu();
    return;
  }
  const template = [
    {
      label: "NEXUS",
      submenu: [
        { role: "about", label: L("NEXUS Hakkında", "About NEXUS") },
        { type: "separator" },
        { role: "hide", label: L("Gizle", "Hide") },
        { role: "hideOthers", label: L("Diğerlerini Gizle", "Hide Others") },
        { type: "separator" },
        { role: "quit", label: L("Çıkış", "Quit") },
      ],
    },
    {
      label: L("Dosya", "File"),
      submenu: [
        {
          label: L("Arka Plana Gizle", "Hide to Background"),
          accelerator: "CommandOrControl+Shift+H",
          click: () => hideToTray(),
        },
        { type: "separator" },
        { label: L("Yeniden Başlat", "Restart"), click: restartApp },
        { role: "close", label: L("Pencereyi Kapat", "Close Window") },
      ],
    },
    {
      label: L("Düzen", "Edit"),
      submenu: [
        { role: "undo", label: L("Geri Al", "Undo") },
        { role: "redo", label: L("Yinele", "Redo") },
        { type: "separator" },
        { role: "cut", label: L("Kes", "Cut") },
        { role: "copy", label: L("Kopyala", "Copy") },
        { role: "paste", label: L("Yapıştır", "Paste") },
        { role: "selectAll", label: L("Tümünü Seç", "Select All") },
      ],
    },
    {
      label: L("Görünüm", "View"),
      submenu: [
        { role: "reload", label: L("Yenile", "Reload") },
        { type: "separator" },
        { role: "resetZoom", label: L("Gerçek Boyut", "Actual Size") },
        { role: "zoomIn", label: L("Yakınlaştır", "Zoom In") },
        { role: "zoomOut", label: L("Uzaklaştır", "Zoom Out") },
        { type: "separator" },
        { role: "togglefullscreen", label: L("Tam Ekran", "Full Screen") },
      ],
    },
    {
      label: L("Yardım", "Help"),
      submenu: [
        {
          label: "NEXUS Sitesi",
          click: () => shell.openExternal("https://nexus-smarthome.pages.dev"),
        },
        { label: L("Sürüm ", "Version ") + app.getVersion(), enabled: false },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.on("app:language", (_e, lang) => {
  if ((lang === "tr" || lang === "en") && lang !== uiLang) {
    uiLang = lang;
    buildMenu();
    updateTrayMenu();
    setupJumpList();
  }
});

// ---------- Otomatik güncelleme (GitHub Releases) + uygulama içi güncelleme arayüzü ----------
// Durum akışı: idle → checking → downloading(%) → ready → (quitAndInstall).
// Ayarlar sayfası updates:check / updates:install çağırır; her değişimde
// "updates:state" olayu olarak render'a gönderilir. Geliştirme sürümünde
// ("unsupported") arayüz kontrolü sessizce geçersizleşir.
let updatesWired = false;
let updateState = {
  state: "idle",
  currentVersion: app.getVersion(),
  availableVersion: null,
  progress: 0,
  error: null,
};

function getAutoUpdater() {
  try {
    return require("electron-updater").autoUpdater;
  } catch {
    return null;
  }
}

function sendUpdateState(patch) {
  updateState = { ...updateState, ...patch };
  if (win && !win.isDestroyed()) win.webContents.send("updates:state", updateState);
}

// Güncelleme tercihleri (otomatik indirme). Kullanıcı verisi klasöründe saklanır.
const updatePrefsPath = () => path.join(app.getPath("userData"), "update-prefs.json");
function readUpdatePrefs() {
  try {
    return { autoDownload: false, ...JSON.parse(fs.readFileSync(updatePrefsPath(), "utf8")) };
  } catch {
    return { autoDownload: false };
  }
}
function writeUpdatePrefs(patch) {
  const next = { ...readUpdatePrefs(), ...patch };
  try {
    fs.writeFileSync(updatePrefsPath(), JSON.stringify(next));
  } catch {
    /* kaydedilemezse varsayılan kalır */
  }
  return next;
}

function wireUpdater(autoUpdater) {
  if (updatesWired) return;
  updatesWired = true;
  // Varsayılan: kullanıcı indirmeyi kendisi başlatır; "otomatik indir" açıksa hemen iner.
  autoUpdater.autoDownload = false;
  autoUpdater.on("checking-for-update", () => sendUpdateState({ state: "checking", error: null }));
  autoUpdater.on("update-available", (info) => {
    const version = (info && info.version) || null;
    if (readUpdatePrefs().autoDownload) {
      sendUpdateState({
        state: "downloading",
        availableVersion: version,
        progress: 0,
        error: null,
      });
      autoUpdater.downloadUpdate().catch((e) =>
        sendUpdateState({
          state: "error",
          error: (e && e.message) || L("indirme başarısız", "download failed"),
        }),
      );
    } else {
      sendUpdateState({ state: "available", availableVersion: version, progress: 0, error: null });
    }
  });
  autoUpdater.on("update-not-available", () =>
    sendUpdateState({ state: "latest", availableVersion: null, error: null }),
  );
  autoUpdater.on("download-progress", (p) =>
    sendUpdateState({ state: "downloading", progress: Math.round(p.percent || 0) }),
  );
  autoUpdater.on("error", (e) =>
    sendUpdateState({
      state: "error",
      error: (e && e.message) || L("bilinmeyen hata", "unknown error"),
    }),
  );
  autoUpdater.on("update-downloaded", (info) => {
    sendUpdateState({
      state: "ready",
      availableVersion: (info && info.version) || updateState.availableVersion,
      progress: 100,
    });
    // Pencere açıksa klasik diyalog; tepside gizliyse balonla haber ver (arayüz de hazır gösterir).
    const apply = () => autoUpdater.quitAndInstall();
    if (win && !win.isDestroyed() && win.isVisible()) {
      dialog
        .showMessageBox(win, {
          type: "info",
          buttons: [L("Şimdi yeniden başlat", "Restart now"), L("Sonra", "Later")],
          defaultId: 0,
          title: L("NEXUS güncellemesi hazır", "NEXUS update ready"),
          message: L(
            `NEXUS ${info.version} indirildi.`,
            `NEXUS ${info.version} has been downloaded.`,
          ),
          detail: L(
            "Uygulamayı yeniden başlattığında yeni sürüm açılır.",
            "The new version opens when you restart the app.",
          ),
        })
        .then(({ response }) => {
          if (response === 0) apply();
        });
    } else {
      try {
        if (process.platform === "win32" && tray && tray.displayBalloon) {
          tray.displayBalloon({
            iconType: "info",
            title: "NEXUS",
            content: L(
              "Yeni sürüm indirildi. Uygulamayı açıp Ayarlar → Masaüstü Uygulaması'ndan kurabilirsin.",
              "A new version was downloaded. Open the app and install it from Settings → Desktop App.",
            ),
          });
        }
      } catch {
        /* balon gösterilemezse sorun değil */
      }
    }
  });
}

ipcMain.handle("updates:check", async () => {
  if (!app.isPackaged || process.env.NEXUS_NO_UPDATE)
    return { ...updateState, state: "unsupported" };
  const autoUpdater = getAutoUpdater();
  if (!autoUpdater) return { ...updateState, state: "unsupported" };
  wireUpdater(autoUpdater);
  sendUpdateState({ state: "checking", error: null });
  try {
    await autoUpdater.checkForUpdates();
  } catch (e) {
    sendUpdateState({
      state: "error",
      error:
        (e && e.message) ||
        L("güncelleme sunucusuna ulaşılamadı", "could not reach the update server"),
    });
  }
  return updateState;
});

ipcMain.handle("updates:get-state", () => updateState);
ipcMain.handle("updates:prefs:get", () => readUpdatePrefs());
ipcMain.handle("updates:prefs:set", (_e, patch) => {
  const next = writeUpdatePrefs({ autoDownload: !!(patch && patch.autoDownload) });
  // Otomatik indirme açıldıysa ve bir sürüm zaten bulunmuşsa hemen indir.
  if (next.autoDownload && updateState.state === "available") startDownload();
  return next;
});

async function startDownload() {
  const autoUpdater = getAutoUpdater();
  if (!autoUpdater || updateState.state !== "available") return false;
  sendUpdateState({ state: "downloading", progress: 0, error: null });
  try {
    await autoUpdater.downloadUpdate();
  } catch (e) {
    sendUpdateState({
      state: "error",
      error: (e && e.message) || L("indirme başarısız", "download failed"),
    });
    return false;
  }
  return true;
}

ipcMain.handle("updates:download", () => startDownload());

ipcMain.handle("updates:install", () => {
  const autoUpdater = getAutoUpdater();
  if (!autoUpdater || updateState.state !== "ready") return false;
  app.isQuitting = true; // close işleyicisi pencereyi tekrar tepsiye gizlemesin
  autoUpdater.quitAndInstall();
  return true;
});

// Arka plan denetimi: kullanıcı "Güncellemeleri Kontrol Et"e basmadan menüde güncelleme görünür.
// Açılışta ağ henüz hazır olmayabilir; bu yüzden başarısızlıkta kısa aralıkla yeniden dener,
// sonra düzenli aralıklarla ve pencereye dönüldüğünde (30 dk geçtiyse) tekrar bakar.
const BG_CHECK_EVERY = 3 * 60 * 60 * 1000;
const BG_CHECK_MIN_GAP = 30 * 60 * 1000;
let lastBgCheck = 0;
let bgRetries = 0;
let bgAnnounced = null;

async function backgroundCheck() {
  const autoUpdater = getAutoUpdater();
  if (!autoUpdater) return;
  // Zaten bulunmuş/iniyor/hazır bir sürüm varsa durumu bozma.
  if (["available", "downloading", "ready", "checking"].includes(updateState.state)) return;
  lastBgCheck = Date.now();
  try {
    await autoUpdater.checkForUpdates();
    bgRetries = 0;
  } catch {
    if (bgRetries < 5) {
      bgRetries++;
      setTimeout(backgroundCheck, 60 * 1000);
    }
  }
  // Yeni sürüm bulunduysa tepsiden bir kez haber ver (pencere kapalı/gizliyse de fark edilsin).
  if (updateState.state === "available" && bgAnnounced !== updateState.availableVersion) {
    bgAnnounced = updateState.availableVersion;
    try {
      if (
        process.platform === "win32" &&
        tray &&
        tray.displayBalloon &&
        !(win && win.isVisible() && win.isFocused())
      ) {
        tray.displayBalloon({
          iconType: "info",
          title: "NEXUS",
          content: L(
            `Yeni sürüm ${updateState.availableVersion} hazır. Menüdeki yeşil düğmeyle indirebilirsin.`,
            `Version ${updateState.availableVersion} is available. Use the green button in the menu to download it.`,
          ),
        });
      }
    } catch {
      /* balon gösterilemezse sorun değil */
    }
  }
}

function setupUpdates() {
  if (!app.isPackaged || process.env.NEXUS_NO_UPDATE) return;
  const autoUpdater = getAutoUpdater();
  if (!autoUpdater) return;
  wireUpdater(autoUpdater);
  setTimeout(backgroundCheck, 8 * 1000);
  setInterval(backgroundCheck, BG_CHECK_EVERY).unref();
  app.on("browser-window-focus", () => {
    if (Date.now() - lastBgCheck > BG_CHECK_MIN_GAP) backgroundCheck();
  });
}

app.on("second-instance", (_e, argv) => {
  // Uygulama zaten açıksa (tepside gizli bile olsa) pencereyi öne getir.
  showMainWindow();
  const page = pageFromArgv(argv); // görev çubuğu hızlı görevleri (--go=sayfa)
  if (page && win && !win.isDestroyed()) win.loadURL(`${SCHEME}://app/${page}`);
});

// ---------- Yerel bildirimler ve tepsi ipucu (event-bridge.js) ----------
// Arayüz yeni olayı bildirir; pencere öndeyken bildirim gösterilmez (zaten ekranda).
const notifyStamps = [];
const clip = (v, n) => String(v == null ? "" : v).slice(0, n);
ipcMain.on("event:notify", (_e, ev) => {
  try {
    if (!ev || typeof ev !== "object" || !Notification.isSupported()) return;
    if (win && !win.isDestroyed() && win.isVisible() && win.isFocused()) return;
    const now = Date.now();
    while (notifyStamps.length && now - notifyStamps[0] > 10000) notifyStamps.shift();
    if (notifyStamps.length >= 4) return; // sel olmasın: 10 sn'de en fazla 4
    notifyStamps.push(now);
    const targetPage =
      ev && typeof ev.page === "string" && ev.page ? ev.page : "nexus-messages.html";
    const pngPath = path.join(__dirname, "resources", "icon.png");
    const notifIcon = fs.existsSync(pngPath) ? pngPath : resolveTrayIcon();
    const n = new Notification({
      title: clip(ev.title, 80) || "NEXUS",
      body: clip(ev.detail, 200),
      icon: notifIcon || undefined,
      silent: false,
    });
    n.on("click", () => showPage(targetPage));
    n.show();
  } catch {
    /* bildirim gösterilemezse sorun değil */
  }
});

ipcMain.on("tray:status", (_e, st) => {
  if (!tray || !st || typeof st !== "object") return;
  const num = (v) => Math.max(0, Math.min(9999, Math.floor(Number(v) || 0)));
  const d = num(st.devices),
    on = num(st.on),
    un = num(st.unread);
  lastTrayStatus = { devices: d, on, unread: un };
  const text = L(
    `NEXUS — ${d} cihaz · ${on} açık` + (un ? ` · ${un} okunmamış bildirim` : ""),
    `NEXUS — ${d} device${d === 1 ? "" : "s"} · ${on} on` + (un ? ` · ${un} unread` : ""),
  );
  try {
    tray.setToolTip(text);
    updateTrayMenu();
  } catch {
    /* tepsi kapanmış olabilir */
  }
});

// ---------- Windows görev çubuğu hızlı görevleri (JumpList) ----------
function setupJumpList() {
  if (process.platform !== "win32") return;
  const resolveTaskIcon = (key) => {
    if (app.isPackaged) {
      const unpacked = path.join(
        process.resourcesPath,
        "app.asar.unpacked",
        "resources",
        "icons",
        `${key}.ico`,
      );
      if (fs.existsSync(unpacked)) return unpacked;
    }
    const devPath = path.join(__dirname, "resources", "icons", `${key}.ico`);
    if (fs.existsSync(devPath)) return devPath;
    return process.execPath;
  };
  const task = (key, title, description) => ({
    program: process.execPath,
    arguments: `--go=${key}`,
    iconPath: resolveTaskIcon(key),
    iconIndex: 0,
    title,
    description,
  });
  try {
    app.setUserTasks([
      task("home", L("Ev", "Home"), L("Ana ekranı aç", "Open the home screen")),
      task("pair", L("Cihaz Ekle", "Add device"), L("Yeni cihaz ekle", "Add a new device")),
      task(
        "messages",
        L("Mesaj Merkezi", "Message Center"),
        L("Bildirimleri aç", "Open notifications"),
      ),
      task("settings", L("Ayarlar", "Settings"), L("Ayarları aç", "Open settings")),
    ]);
  } catch {
    /* JumpList desteklenmiyorsa sorun değil */
  }
}

// ---------- Ctrl+Alt+N: uygulamayı (tepsideyken bile) komut paletiyle aç ----------
function registerPaletteShortcut() {
  try {
    globalShortcut.register("CommandOrControl+Alt+N", () => {
      showMainWindow();
      if (win && !win.isDestroyed()) win.webContents.send("palette:open");
    });
  } catch {
    /* kısayol başka uygulamada kullanılıyorsa sessiz geç */
  }
}
app.on("will-quit", () => {
  try {
    globalShortcut.unregisterAll();
  } catch {
    /* yok */
  }
});

// Güncelleyici (quitAndInstall) ve diğer çıkış yolları gerçek kapanmaya işaret etmeli;
// aksi halde close işleyicisi pencereyi tekrar tepsiye gizler.
app.on("before-quit", () => {
  app.isQuitting = true;
});

app.whenReady().then(() => {
  uiLang = detectLang();
  // QR tarama kamerayı, ev konumu da konumu ister. İkisi de programın içinde kalır.
  const deskPerm = {
    media: 1,
    geolocation: 1,
    "clipboard-sanitized-write": 1,
    fullscreen: 1,
    notifications: 1,
  };
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(!!deskPerm[permission]);
  });
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => !!deskPerm[permission]);
  serveApp();
  buildMenu();
  createWindow();
  createTray();
  createAutomationWorker();
  setupJumpList();
  registerPaletteShortcut();
  screen.on("display-removed", rescueWindow);
  screen.on("display-metrics-changed", rescueWindow);
  setupUpdates();
  app.on("activate", () => {
    if (!win || win.isDestroyed()) createWindow();
    else showMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
