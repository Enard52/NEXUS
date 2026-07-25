// NEXUS AI — Real desktop application
//
// This is the genuine desktop *program* (not the setup wizard): it boots the
// local NEXUS sync server, opens a frameless window that loads the exact same
// synced app the web/mobile surfaces use — served with the desktop chrome — and
// lives in the system tray so it keeps running in the background.
//
//   • Same login, same real per-user data, same design system.
//   • A custom User-Agent marker ("NexusDesktop") makes the server return the
//     windowed desktop shell (title bar + sidebar).
//   • Closing the window hides it to the tray; quitting is explicit (tray menu).
//
// Dev launch:  npm start   (spawns the workspace server via tsx if none is up)

const { app, BrowserWindow, Tray, Menu, ipcMain, shell, nativeImage } = require("electron");

app.setName("NEXUS");
app.setAppUserModelId("ai.nexus.desktop");

// Brand-only application menu — no framework identifiers visible anywhere.
app.setAboutPanelOptions({
  applicationName: "NEXUS",
  applicationVersion: "3.14.2",
  copyright: "© NEXUS Technologies Inc.",
});
if (process.platform === "darwin") {
  Menu.setApplicationMenu(Menu.buildFromTemplate([{
    label: "NEXUS",
    submenu: [
      { label: "About NEXUS", role: "about" },
      { type: "separator" },
      { role: "hide", label: "Hide NEXUS" },
      { role: "unhide" },
      { type: "separator" },
      { role: "quit", label: "Quit NEXUS" },
    ],
  }]));
} else {
  Menu.setApplicationMenu(null);
}

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const PORT = Number(process.env.NEXUS_PORT || 4178);
const APP_URL = `http://localhost:${PORT}/app`;
const REPO_ROOT = path.join(__dirname, "..");
const SERVER_ENTRY = path.join("packages", "server", "src", "main.ts");

let win = null;
let tray = null;
let serverProc = null;
app.isQuitting = false;

// ── Server lifecycle ─────────────────────────────────────────────────────────

/** Resolve true once the sync server answers on PORT (any HTTP status is fine). */
function probeServer() {
  return new Promise((resolve) => {
    const req = http.get(APP_URL, { timeout: 1500 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probeServer()) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

/** Start the workspace sync server via tsx if it is not already running.
 *  Packaged builds outside the repo have no server sources to spawn: in that
 *  case we simply keep probing and let the offline page take over. */
async function ensureServer() {
  if (await probeServer()) return true; // already running (e.g. `pnpm --filter @nexus/server start`)
  if (!fs.existsSync(path.join(REPO_ROOT, SERVER_ENTRY))) {
    // No workspace next to the binary (installed build) — wait briefly in case
    // a locally installed server is still booting, then fall back to offline UI.
    return waitForServer(4000);
  }
  serverProc = spawn("npx", ["tsx", SERVER_ENTRY], {
    cwd: REPO_ROOT,
    env: { ...process.env, PORT: String(PORT) },
    shell: true,
    stdio: "inherit",
  });
  serverProc.on("exit", (code) => {
    serverProc = null;
    if (!app.isQuitting) console.error(`[nexus] sync server exited (code ${code})`);
  });
  return waitForServer(20000);
}

function stopServer() {
  if (serverProc && !serverProc.killed) {
    try {
      serverProc.kill();
    } catch {
      /* ignore */
    }
    serverProc = null;
  }
}

// ── Window + tray ────────────────────────────────────────────────────────────

function createWindow(serverUp = true) {
  win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    frame: false, // the app renders its own premium title bar
    backgroundColor: "#05060a",
    icon: path.join(__dirname, "assets", "icon.png"), // brand mark (taskbar / window)
    show: false,
    title: "NEXUS",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Custom User-Agent: brand-only identifier, no framework/engine names.
  const ua = `Mozilla/5.0 (${process.platform === "win32" ? "Windows NT 10.0; Win64; x64" : process.platform === "darwin" ? "Macintosh; Intel Mac OS X" : "X11; Linux x86_64"}) AppleWebKit/537.36 (KHTML, like Gecko) NexusDesktop/3.14.2`;
  win.webContents.setUserAgent(ua);

  if (serverUp) win.loadURL(APP_URL, { userAgent: ua });
  else win.loadFile(path.join(__dirname, "offline.html"));
  win.once("ready-to-show", () => win.show());

  // If the server drops while the app is open, fall back to the offline page
  // instead of Chromium's default error surface.
  win.webContents.on("did-fail-load", (_e, code, _desc, failedUrl) => {
    if (code !== -3 /* ERR_ABORTED (in-page nav) */ && String(failedUrl).startsWith("http")) {
      win.loadFile(path.join(__dirname, "offline.html"));
    }
  });

  // Open external links in the OS browser, keep app links in-window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\/localhost/.test(url)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Close hides to tray; real quit only via the tray menu.
  win.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
  win.on("closed", () => {
    win = null;
  });
}

function toggleWindow() {
  if (!win) {
    createWindow();
    return;
  }
  if (win.isVisible() && !win.isMinimized()) win.hide();
  else {
    win.show();
    win.focus();
  }
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, "assets", "tray.png"));
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip("NEXUS — Personal Operating System");
  const menu = Menu.buildFromTemplate([
    { label: "Open NEXUS", click: () => toggleWindow() },
    { type: "separator" },
    {
      label: "Quit NEXUS",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
  tray.on("click", () => toggleWindow());
}

// ── Native bridge for the frameless title bar's window controls ───────────────

ipcMain.on("nx:minimize", () => win && win.minimize());
ipcMain.on("nx:toggle-maximize", () => {
  if (!win) return;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});
ipcMain.on("nx:close", () => win && win.close());

// Offline page: report the app URL and retry the connection on demand.
ipcMain.on("nx:retry", async () => {
  if (!win) return;
  if (await probeServer()) win.loadURL(APP_URL);
});
ipcMain.handle("nx:app-url", () => APP_URL);

// ── App lifecycle ─────────────────────────────────────────────────────────────

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      win.show();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    createTray();
    const up = await ensureServer();
    createWindow(up !== false);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else if (win) win.show();
  });

  // Tray app: do not quit when the window is closed.
  app.on("window-all-closed", () => {
    /* keep running in the tray */
  });

  app.on("before-quit", () => {
    app.isQuitting = true;
  });
  app.on("will-quit", stopServer);
}
