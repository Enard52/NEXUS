// NEXUS AI - Real desktop application
//
// This is the genuine desktop program. It boots the local NEXUS sync server,
// opens the premium frameless shell, and keeps running in the system tray.
// When a setup page is available, the app can also show the local onboarding
// flow before the first successful launch.

const { app, BrowserWindow, Tray, Menu, ipcMain, shell, nativeImage, dialog } = require("electron");
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

if (process.platform === "darwin") {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "NEXUS",
        submenu: [
          { label: "About NEXUS", role: "about" },
          { type: "separator" },
          { role: "hide", label: "Hide NEXUS" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit", label: "Quit NEXUS" },
        ],
      },
    ]),
  );
} else {
  Menu.setApplicationMenu(null);
}

function getDataDir() {
  return process.env.NEXUS_DATA_DIR || path.join(app.getPath("userData"), "nexus-data");
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
  const os = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "mac" : "linux";
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
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
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

  win.webContents.on("will-navigate", (event, url) => {
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
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
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
  });

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
    const config = readStoredConfig();
    if (config) {
      const up = await startLocalCore();
      createWindow(up !== false);
    } else {
      createWindow("setup");
    }
  });

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const config = readStoredConfig();
      if (config) {
        const up = await startLocalCore();
        createWindow(up !== false);
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
