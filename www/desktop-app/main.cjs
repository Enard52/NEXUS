// NEXUS AI - Real desktop application
//
// This is the genuine desktop program. It boots the local NEXUS sync server,
// opens the premium frameless shell, and keeps running in the system tray.
// When a setup page is available, the app can also show the local onboarding
// flow before the first successful launch.

const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  shell,
  nativeImage,
  dialog,
  Notification,
} = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const HOST = "127.0.0.1";
const PORT = Number(process.env.NEXUS_PORT || 4178);
const APP_URL = `http://${HOST}:${PORT}/app`;
const REPO_ROOT = path.join(__dirname, "..");
const SERVER_ENTRY = path.join("packages", "server", "src", "main.ts");
const SERVER_DIST = path.join("packages", "server", "dist", "main.js");
const SETUP_BASE = app.isPackaged
  ? path.join(process.resourcesPath, "desktop-html")
  : path.join(REPO_ROOT, "packages", "desktop", "dist");

let win = null;
let tray = null;
let serverProc = null;
let startupTimer = null;
app.isQuitting = false;

app.setName("NEXUS");
app.setAppUserModelId("ai.nexus.desktop");
app.setAboutPanelOptions({
  applicationName: "NEXUS",
  applicationVersion: "3.14.2",
  copyright: "Copyright NEXUS Technologies Inc.",
});

// ── High DPI support ──────────────────────────────────────────────────────
// Let Chromium honor the OS scale factor for crisp rendering on Retina/4K
// displays, and let windows grow larger than the physical screen so maximized
// frameless windows are never clipped at high zoom levels.
app.commandLine.appendSwitch("high-dpi-support", "1");
app.commandLine.appendSwitch("force-device-scale-factor", "1");

function showAboutDialog() {
  if (win && !win.isDestroyed()) {
    dialog.showMessageBox(win, {
      type: "info",
      title: "About NEXUS",
      message: "NEXUS",
      detail: [
        "Personal Operating System",
        `Version 3.14.2`,
        "",
        "Copyright NEXUS Technologies Inc.",
      ].join("\n"),
      buttons: ["OK"],
    });
  }
}

function checkForUpdatesMenu() {
  // Auto-update is wired in updater.cjs (loaded lazily when packaged); when it
  // is unavailable (dev mode) we surface a friendly message instead of a no-op.
  if (typeof globalThis.__nexusCheckForUpdates === "function") {
    const handled = globalThis.__nexusCheckForUpdates();
    if (handled) return;
  }
  dialog.showMessageBox(win, {
    type: "info",
    title: "NEXUS — Updates",
    message: "Update checks run automatically on launch.",
    detail: "You are running NEXUS 3.14.2. The latest version is checked on every start.",
    buttons: ["OK"],
  });
}

// ── Auto-update (electron-updater, lazy-loaded) ─────────────────────────────
// Only armed in packaged builds; in dev the updater module is absent and the
// menu falls back to the informational dialog above.
function initAutoUpdater() {
  try {
    const updater = require("./updater.cjs");
    const armed = updater.initAutoUpdater(app, showNotification);
    if (armed) {
      globalThis.__nexusCheckForUpdates = updater.checkForUpdates;
    }
  } catch (err) {
    console.error("[nexus] auto-update init skipped:", err && err.message);
  }
}

// ── Application menu (platform-specific) ───────────────────────────────────
// macOS gets the full app-name menu plus Edit/View/Window/Help; Windows and
// Linux get a File/Edit/View/Window/Help menu bar that mirrors native desktop
// conventions. Roles are used where possible so Chromium provides correct
// localized accelerators and behavior.
function buildAppMenu() {
  const isMac = process.platform === "darwin";
  const appMenu = {
    label: "NEXUS",
    submenu: [
      isMac
        ? { label: "About NEXUS", role: "about" }
        : { label: "About NEXUS", click: showAboutDialog },
      { type: "separator" },
      { label: "Check for Updates…", click: checkForUpdatesMenu },
      { type: "separator" },
      isMac ? { role: "services" } : null,
      isMac ? { type: "separator" } : null,
      isMac ? { role: "hide", label: "Hide NEXUS" } : null,
      isMac ? { role: "hideOthers" } : null,
      isMac ? { role: "unhide" } : null,
      { type: "separator" },
      { role: "quit", label: isMac ? "Quit NEXUS" : "Exit" },
    ].filter(Boolean),
  };

  const fileMenu = {
    label: "File",
    submenu: [
      {
        label: "New Window",
        accelerator: "CmdOrCtrl+N",
        click: () => toggleWindow(),
      },
      { type: "separator" },
      {
        label: "Open Data Folder…",
        accelerator: "CmdOrCtrl+O",
        click: () => {
          const config = readStoredConfig();
          if (config && fs.existsSync(config.path)) {
            shell.openPath(config.path);
          } else {
            dialog.showMessageBox(win, {
              type: "info",
              title: "NEXUS",
              message: "No data folder configured yet.",
              detail: "Complete the setup wizard to choose a Local Core data folder.",
              buttons: ["OK"],
            });
          }
        },
      },
      isMac ? { role: "close", label: "Close Window" } : { role: "quit", label: "Exit" },
    ],
  };

  const editMenu = {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      isMac ? { role: "pasteAndMatchStyle" } : null,
      { role: "delete" },
      { role: "selectAll" },
    ].filter(Boolean),
  };

  const viewMenu = {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forceReload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
      { type: "separator" },
      {
        label: "Toggle Dark/Light Theme",
        accelerator: "CmdOrCtrl+Shift+T",
        click: () => {
          if (win && !win.isDestroyed()) {
            win.webContents
              .executeJavaScript(
                `(function(){try{var d=document.documentElement;var cur=d.getAttribute('data-theme')||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');d.setAttribute('data-theme',cur==='dark'?'light':'dark');}catch(e){}})();`,
              )
              .catch(() => {});
          }
        },
      },
    ],
  };

  const windowMenu = {
    label: "Window",
    submenu: [
      { role: "minimize" },
      { role: "zoom" },
      { type: "separator" },
      { role: "front" },
      { type: "separator" },
      {
        label: "Show NEXUS",
        click: () => toggleWindow(),
      },
    ],
  };

  const helpMenu = {
    label: "Help",
    submenu: [
      {
        label: "NEXUS Documentation",
        click: () => shell.openExternal("https://nexus-ai.app/docs"),
      },
      {
        label: "Report an Issue",
        click: () => shell.openExternal("https://nexus-ai.app/support"),
      },
      { type: "separator" },
      isMac
        ? { label: "About NEXUS", role: "about" }
        : { label: "About NEXUS", click: showAboutDialog },
    ],
  };

  return Menu.buildFromTemplate([appMenu, fileMenu, editMenu, viewMenu, windowMenu, helpMenu]);
}

Menu.setApplicationMenu(buildAppMenu());

// macOS dock menu (quick actions when right-clicking the dock icon).
if (process.platform === "darwin" && typeof app.dock !== "undefined") {
  app.dock.setMenu(
    Menu.buildFromTemplate([
      { label: "Open NEXUS", click: () => toggleWindow() },
      { type: "separator" },
      { label: "Check for Updates…", click: checkForUpdatesMenu },
    ]),
  );
}

function getDataDir() {
  return process.env.NEXUS_DATA_DIR || path.join(app.getPath("userData"), "nexus-data");
}

// ── Native notifications helper ─────────────────────────────────────────────
// Centralizes OS-level notifications so every app event (server crash, update
// availability, renderer-initiated alerts) goes through one supported path.
function showNotification(title, body) {
  if (!Notification.isSupported()) return;
  try {
    new Notification({
      title: (title && String(title).trim()) || "NEXUS",
      body: (body && String(body).trim()) || "A desktop update is ready.",
      silent: false,
    }).show();
  } catch {
    /* notifications are best-effort; never block the app on them */
  }
}

function getConfigPath() {
  return path.join(getDataDir(), "nexus-config.json");
}

function ensureDataDir() {
  fs.mkdirSync(getDataDir(), { recursive: true });
}

function readStoredConfig() {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return null;
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.path !== "string") throw new Error("INVALID_CONFIG");
    const normalized = path.resolve(parsed.path);
    if (!fs.existsSync(normalized) || !fs.statSync(normalized).isDirectory()) {
      throw new Error("PATH_NOT_FOUND");
    }
    return { path: normalized };
  } catch (err) {
    try {
      fs.renameSync(configPath, `${configPath}.invalid`);
    } catch {
      /* ignore */
    }
    return null;
  }
}

function writeStoredConfig(config) {
  ensureDataDir();
  const configPath = getConfigPath();
  const tmpPath = `${configPath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  fs.renameSync(tmpPath, configPath);
}

function getSetupHtmlPath() {
  const os =
    process.platform === "win32" ? "windows" : process.platform === "darwin" ? "mac" : "linux";
  const locale = app.getLocale().startsWith("tr") ? "tr" : "en";
  const candidates = [
    path.join(SETUP_BASE, locale, os, "setup.html"),
    path.join(SETUP_BASE, os, "setup.html"),
    path.join(SETUP_BASE, locale, "setup.html"),
    path.join(SETUP_BASE, "setup.html"),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function probeHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://${HOST}:${PORT}/health`, { timeout: 1500 }, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(Boolean(parsed && parsed.ok && parsed.service === "nexus-local-core"));
        } catch {
          resolve(false);
        }
      });
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
    if (await probeHealth()) return true;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return false;
}

async function startLocalCore() {
  if (await probeHealth()) return true;
  if (serverProc && !serverProc.killed) {
    return waitForServer(4000);
  }

  ensureDataDir();

  const serverBundlePath = app.isPackaged
    ? path.join(process.resourcesPath, "server", "main.js")
    : path.join(REPO_ROOT, SERVER_DIST);
  const serverSourcePath = path.join(REPO_ROOT, SERVER_ENTRY);

  const baseEnv = {
    ...process.env,
    HOST,
    PORT: String(PORT),
    NEXUS_DATA_DIR: getDataDir(),
  };

  if (!app.isPackaged && !fs.existsSync(serverBundlePath) && fs.existsSync(serverSourcePath)) {
    serverProc = spawn("npx", ["tsx", serverSourcePath], {
      cwd: REPO_ROOT,
      env: baseEnv,
      shell: true,
      stdio: "inherit",
    });
  } else {
    if (!fs.existsSync(serverBundlePath)) {
      dialog.showErrorBox("Fatal Error", `Local Core bundle not found at ${serverBundlePath}`);
      return false;
    }
    serverProc = spawn(process.execPath, [serverBundlePath], {
      env: {
        ...baseEnv,
        ELECTRON_RUN_AS_NODE: "1",
      },
      stdio: "inherit",
    });
  }

  serverProc.on("exit", (code) => {
    serverProc = null;
    if (!app.isQuitting) {
      console.error(`[nexus] sync server exited (code ${code})`);
      // Surface the crash via an OS notification so a hidden/tray-only app still
      // tells the user something went wrong, then fall back to the offline UI.
      showNotification(
        "NEXUS — Local Core stopped",
        "The sync server stopped unexpectedly. Restarting…",
      );
      if (win && !win.isDestroyed()) {
        win.webContents.send("nx:server-crashed", code);
        loadOfflineScreen();
      }
    }
  });

  const up = await waitForServer(20000);
  if (!up) {
    stopServer();
    return false;
  }
  return true;
}

function stopServer() {
  if (startupTimer) {
    clearTimeout(startupTimer);
    startupTimer = null;
  }
  if (serverProc && !serverProc.killed) {
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(serverProc.pid), "/f", "/t"]);
      } else {
        try {
          process.kill(-serverProc.pid, "SIGTERM");
        } catch {
          /* ignore */
        }
        serverProc.kill("SIGTERM");
      }
    } catch {
      /* ignore */
    }
  }
  serverProc = null;
}

function isTrustedSender(event) {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (!senderWindow || senderWindow !== win) return false;
  const url = event.senderFrame?.url || "";
  return (
    url.startsWith("file://") ||
    url.startsWith(`http://${HOST}:${PORT}`) ||
    url.startsWith(`http://localhost:${PORT}`)
  );
}

function loadSetupScreen() {
  const setupHtml = getSetupHtmlPath();
  if (setupHtml) {
    return win.loadFile(setupHtml);
  }
  return loadOfflineScreen();
}

function loadOfflineScreen() {
  const offline = path.join(__dirname, "offline.html");
  return win.loadFile(offline);
}

function createWindow(mode = "app") {
  const options = {
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#05060a",
    icon: path.join(__dirname, "assets", "icon.png"),
    show: false,
    title: "NEXUS",
    // High DPI: allow the window to grow larger than the physical screen so a
    // maximized frameless window is never clipped at high OS zoom levels.
    enableLargerThanScreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      // Let the renderer read the real device pixel ratio for crisp custom
      // canvases/icons; defaults keep text legible on high-density displays.
      backgroundThrottling: false,
      spellcheck: true,
    },
  };

  if (process.platform === "darwin") {
    options.titleBarStyle = "hidden";
    options.trafficLightPosition = { x: 14, y: 14 };
  } else {
    options.frame = false;
  }

  win = new BrowserWindow(options);

  const ua = `Mozilla/5.0 (${process.platform === "win32" ? "Windows NT 10.0; Win64; x64" : process.platform === "darwin" ? "Macintosh; Intel Mac OS X" : "X11; Linux x86_64"}) AppleWebKit/537.36 (KHTML, like Gecko) NexusDesktop/${app.getVersion()}`;
  win.webContents.setUserAgent(ua);

  if (mode === "app") {
    win.loadURL(APP_URL, { userAgent: ua });
  } else if (mode === "setup") {
    loadSetupScreen();
  } else {
    loadOfflineScreen();
  }

  win.once("ready-to-show", () => win.show());

  // Stable memory: keep references to long-lived listeners so they can be
  // removed when the window is destroyed, preventing leaks if createWindow is
  // ever called again and guaranteeing a clean teardown on quit.
  const onWillNavigate = (event, url) => {
    try {
      const parsed = new URL(url);
      const allowedLocal =
        parsed.protocol === "file:" ||
        (parsed.protocol === "http:" &&
          (parsed.hostname === HOST || parsed.hostname === "localhost") &&
          Number(parsed.port) === PORT);
      if (!allowedLocal) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  };
  const windowOpenHandler = ({ url }) => {
    if (
      url.startsWith(`http://${HOST}:${PORT}`) ||
      url.startsWith(`http://localhost:${PORT}`) ||
      url.startsWith("file://")
    ) {
      return { action: "allow" };
    }
    if (url.startsWith("https://") || url.startsWith("mailto:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  };

  win.webContents.on("will-navigate", onWillNavigate);
  win.webContents.setWindowOpenHandler(windowOpenHandler);

  win.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });

  win.on("closed", () => {
    // Detach listeners and null the reference so a fresh window can be created
    // without the old webContents retaining handlers/GC roots.
    try {
      if (win && !win.isDestroyed()) {
        win.webContents.removeAllListeners("will-navigate");
        win.webContents.destroy();
      }
    } catch {
      /* window already torn down */
    }
    win = null;
  });
}

function toggleWindow() {
  if (!win) {
    const config = readStoredConfig();
    if (config) {
      startLocalCore().then((up) => createWindow(up !== false));
    } else {
      createWindow("setup");
    }
    return;
  }

  if (win.isVisible() && !win.isMinimized()) {
    win.hide();
  } else {
    win.show();
    win.focus();
  }
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, "assets", "tray.png"));
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip("NEXUS - Personal Operating System");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Open NEXUS", click: () => toggleWindow() },
      { type: "separator" },
      {
        label: "Quit NEXUS",
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]),
  );
  tray.on("click", () => toggleWindow());
}

ipcMain.on("nx:minimize", (event) => {
  if (!isTrustedSender(event)) return;
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.on("nx:toggle-maximize", (event) => {
  if (!isTrustedSender(event)) return;
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;
  if (window.isMaximized()) window.unmaximize();
  else window.maximize();
});

ipcMain.on("nx:close", (event) => {
  if (!isTrustedSender(event)) return;
  BrowserWindow.fromWebContents(event.sender)?.close();
});

ipcMain.on("nx:renderer-event", (event, payload) => {
  if (!isTrustedSender(event)) return;
  if (!payload || typeof payload.name !== "string") return;

  if (payload.name === "notify") {
    const detail = payload.detail && typeof payload.detail === "object" ? payload.detail : {};
    const title = typeof detail.title === "string" ? detail.title : "NEXUS";
    const body = typeof detail.body === "string" ? detail.body : "A desktop update is ready.";
    showNotification(title, body);
  }
});

ipcMain.handle("nx:setup-browse", async (event) => {
  if (!isTrustedSender(event)) return { ok: false, error: "UNAUTHORIZED" };
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return { ok: false, error: "WINDOW_NOT_FOUND" };

  const result = await dialog.showOpenDialog(window, {
    title: "Choose NEXUS Local Core Data Folder",
    properties: ["openDirectory", "createDirectory"],
  });

  if (result.canceled || !result.filePaths[0]) {
    return { ok: false, canceled: true };
  }

  return { ok: true, path: result.filePaths[0] };
});

// ── Native save dialog (export / "save as" flows) ───────────────────────────
// Lets the renderer request a real OS save dialog (file picker for writing)
// without exposing Node primitives. The renderer receives the chosen path and
// is responsible for the actual write via its own fetch/IPC.
ipcMain.handle("nx:save-dialog", async (event, options = {}) => {
  if (!isTrustedSender(event)) return { ok: false, error: "UNAUTHORIZED" };
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return { ok: false, error: "WINDOW_NOT_FOUND" };

  const result = await dialog.showSaveDialog(window, {
    title: typeof options.title === "string" ? options.title : "Save File",
    defaultPath: typeof options.defaultPath === "string" ? options.defaultPath : undefined,
    filters: Array.isArray(options.filters) ? options.filters : undefined,
    buttonLabel: typeof options.buttonLabel === "string" ? options.buttonLabel : undefined,
  });

  if (result.canceled || !result.filePath) {
    return { ok: false, canceled: true };
  }
  return { ok: true, path: result.filePath };
});

ipcMain.handle("nx:setup-cancel", async (event) => {
  if (!isTrustedSender(event)) return { ok: false, error: "UNAUTHORIZED" };
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return { ok: false, error: "WINDOW_NOT_FOUND" };

  const result = await dialog.showMessageBox(window, {
    type: "question",
    buttons: ["Cancel Setup", "Continue Setup"],
    defaultId: 1,
    title: "NEXUS Setup",
    message: "Are you sure you want to cancel the NEXUS setup process?",
  });

  if (result.response === 0) {
    app.isQuitting = true;
    app.quit();
    return { ok: true };
  }

  return { ok: false, canceled: true };
});

ipcMain.handle("nx:setup-complete", async (event, rawConfig) => {
  if (!isTrustedSender(event)) return { ok: false, error: "UNAUTHORIZED" };
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return { ok: false, error: "WINDOW_NOT_FOUND" };

  if (!rawConfig || typeof rawConfig.path !== "string") {
    return { ok: false, error: "INVALID_CONFIG" };
  }

  const normalizedPath = path.resolve(rawConfig.path);
  if (!fs.existsSync(normalizedPath)) {
    return { ok: false, error: "PATH_NOT_FOUND" };
  }
  if (!fs.statSync(normalizedPath).isDirectory()) {
    return { ok: false, error: "PATH_NOT_A_DIRECTORY" };
  }

  try {
    writeStoredConfig({ path: normalizedPath });
  } catch (err) {
    return { ok: false, error: "CONFIG_SAVE_FAILED" };
  }

  const up = await startLocalCore();
  if (!up) {
    return { ok: false, error: "LOCAL_CORE_START_FAILED" };
  }

  return { ok: true };
});

ipcMain.handle("nx:setup-launch", async (event) => {
  if (!isTrustedSender(event)) return { ok: false, error: "UNAUTHORIZED" };
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return { ok: false, error: "WINDOW_NOT_FOUND" };

  const config = readStoredConfig();
  if (!config) {
    return { ok: false, error: "SETUP_NOT_COMPLETE" };
  }

  const up = await startLocalCore();
  if (!up) {
    return { ok: false, error: "LOCAL_CORE_START_FAILED" };
  }

  await window.loadURL(APP_URL, { userAgent: window.webContents.userAgent });
  return { ok: true };
});

ipcMain.on("nx:retry", async (event) => {
  if (!isTrustedSender(event)) return;
  if (!win) return;
  const up = await startLocalCore();
  if (up) {
    win.loadURL(APP_URL, { userAgent: win.webContents.userAgent });
  }
});

ipcMain.handle("nx:app-url", (event) => {
  if (!isTrustedSender(event)) return "";
  return APP_URL;
});

// Renderer can request an immediate install of an already-downloaded update.
ipcMain.handle("nx:install-update", (event) => {
  if (!isTrustedSender(event)) return { ok: false, error: "UNAUTHORIZED" };
  try {
    const updater = require("./updater.cjs");
    const installed = updater.quitAndInstall();
    return { ok: installed };
  } catch {
    return { ok: false };
  }
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    createTray();
    initAutoUpdater();
    const config = readStoredConfig();
    if (config) {
      // Fast startup: show the window immediately with the offline screen so the
      // user sees a responsive app, then boot the server in the background and
      // navigate to the live app URL once it is healthy. This avoids a blank/
      // blocked first paint while the Local Core bundle spins up.
      createWindow("offline");
      startLocalCore().then((up) => {
        if (up && win && !win.isDestroyed()) {
          win.loadURL(APP_URL, { userAgent: win.webContents.userAgent });
        }
      });
    } else {
      createWindow("setup");
    }
  });

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const config = readStoredConfig();
      if (config) {
        createWindow("offline");
        startLocalCore().then((up) => {
          if (up && win && !win.isDestroyed()) {
            win.loadURL(APP_URL, { userAgent: win.webContents.userAgent });
          }
        });
      } else {
        createWindow("setup");
      }
    } else if (win) {
      win.show();
    }
  });

  app.on("window-all-closed", () => {
    /* keep running in the tray */
  });

  app.on("before-quit", () => {
    app.isQuitting = true;
  });
  app.on("will-quit", stopServer);
}
