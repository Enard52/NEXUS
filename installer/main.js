// NEXUS AI — Setup wizard main process.
// Creates a frameless, fixed-size window that hosts the custom 5-step wizard UI
// and bridges the "native" actions the wizard needs over IPC: window controls,
// a real folder picker, OS-aware install info (platform, locale, default path,
// free disk space) and a real install step that copies the application payload,
// writes an install manifest and creates platform shortcuts.

const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require("electron");

app.setName("NEXUS Setup");
app.setAppUserModelId("ai.nexus.setup");

// Remove default application menu — no framework identifiers visible.
Menu.setApplicationMenu(null);
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");

const APP_VERSION = "3.14.2";

let win = null;
/** Result of the last successful install (used by nx:finish to launch). */
let installedLaunch = null;

// ── OS-aware install defaults ────────────────────────────────────────────────

/** Per-user install root that never needs elevation — mirrors what
 *  per-user installers (Squirrel/NSIS) do on each platform. */
function defaultInstallDir() {
  const home = os.homedir();
  switch (process.platform) {
    case "win32":
      return path.join(
        process.env.LOCALAPPDATA || path.join(home, "AppData", "Local"),
        "Programs",
        "NEXUS",
      );
    case "darwin":
      return path.join(home, "Applications", "NEXUS");
    default:
      return path.join(home, ".local", "share", "NEXUS");
  }
}

/** Free bytes on the volume that hosts `dir` (walks up to an existing parent). */
function freeBytesFor(dir) {
  let probe = dir;
  for (let i = 0; i < 20; i++) {
    try {
      const st = fs.statfsSync(probe);
      return st.bavail * st.bsize;
    } catch {
      const parent = path.dirname(probe);
      if (parent === probe) break;
      probe = parent;
    }
  }
  return null;
}

// ── Install payload ──────────────────────────────────────────────────────────

/** Locate the real application payload to install.
 *  1. A `payload/` folder bundled next to the packaged installer resources.
 *  2. The built desktop app portable binary from the repo (dev runs).
 *  3. Dev fallback: the workspace desktop-app itself, installed via launcher. */
function findPayload() {
  const repoRoot = path.join(__dirname, "..");
  const candidates = [];
  if (process.resourcesPath) {
    candidates.push({ kind: "dir", src: path.join(process.resourcesPath, "payload") });
  }
  const exeNames = [`NEXUS-${APP_VERSION}.exe`, "NEXUS.exe"];
  for (const name of exeNames) {
    candidates.push({ kind: "exe", src: path.join(repoRoot, "desktop-app", "dist", name) });
    candidates.push({ kind: "exe", src: path.join(path.dirname(app.getPath("exe")), name) });
  }
  for (const c of candidates) {
    try {
      const st = fs.statSync(c.src);
      if (c.kind === "dir" ? st.isDirectory() : st.isFile()) return c;
    } catch {
      /* keep looking */
    }
  }
  const devApp = path.join(repoRoot, "desktop-app", "main.cjs");
  if (fs.existsSync(devApp)) return { kind: "dev", src: path.join(repoRoot, "desktop-app") };
  return null;
}

function sendProgress(percent, key) {
  if (win && !win.isDestroyed()) win.webContents.send("nx:progress", { percent, key });
}

/** Create a desktop/start-menu shortcut for the installed launch target. */
function createShortcuts(launchTarget, installDir) {
  const iconIco = path.join(installDir, "assets", "icon.ico");
  const iconPng = path.join(installDir, "assets", "icon.png");
  if (process.platform === "win32") {
    const mkLnk = (lnkPath) =>
      `$ws = New-Object -ComObject WScript.Shell; ` +
      `$s = $ws.CreateShortcut('${lnkPath.replace(/'/g, "''")}'); ` +
      `$s.TargetPath = '${launchTarget.replace(/'/g, "''")}'; ` +
      `$s.WorkingDirectory = '${installDir.replace(/'/g, "''")}'; ` +
      (fs.existsSync(iconIco) ? `$s.IconLocation = '${iconIco.replace(/'/g, "''")}'; ` : "") +
      `$s.Description = 'NEXUS — Personal Operating System'; $s.Save()`;
    const desktopLnk = path.join(app.getPath("desktop"), "NEXUS.lnk");
    const startMenuDir = path.join(
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
      "Microsoft",
      "Windows",
      "Start Menu",
      "Programs",
    );
    const cmds = [mkLnk(desktopLnk), mkLnk(path.join(startMenuDir, "NEXUS.lnk"))];
    for (const cmd of cmds) {
      try {
        spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", cmd], {
          windowsHide: true,
          stdio: "ignore",
        });
      } catch {
        /* shortcuts are best-effort */
      }
    }
  } else if (process.platform === "linux") {
    try {
      const appsDir = path.join(os.homedir(), ".local", "share", "applications");
      fs.mkdirSync(appsDir, { recursive: true });
      const desktopEntry = [
        "[Desktop Entry]",
        "Type=Application",
        "Name=NEXUS",
        "Comment=Personal Operating System",
        `Exec=${JSON.stringify(launchTarget)}`,
        fs.existsSync(iconPng) ? `Icon=${iconPng}` : "Icon=nexus",
        "Terminal=false",
        "Categories=Utility;",
        "",
      ].join("\n");
      fs.writeFileSync(path.join(appsDir, "nexus.desktop"), desktopEntry, "utf8");
    } catch {
      /* best-effort */
    }
  }
  // macOS: apps live in ~/Applications by convention; Finder/Launchpad pick
  // them up automatically, no shortcut file needed.
}

/** Perform the real installation into `targetDir`. Returns launch info. */
async function performInstall(targetDir) {
  const payload = findPayload();
  sendProgress(8, "core");
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, "assets"), { recursive: true });

  // Brand assets (used for shortcut icons and the installed app).
  for (const asset of ["icon.ico", "icon.png", "tray.png"]) {
    const src = path.join(__dirname, "assets", asset);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(targetDir, "assets", asset));
  }
  sendProgress(28, "voice");

  let launchTarget = null;
  if (payload && payload.kind === "dir") {
    fs.cpSync(payload.src, targetDir, { recursive: true });
    // Locate the executable inside the copied payload (portable builds are
    // named NEXUS-<version>.exe; unpacked builds ship NEXUS.exe / nexus).
    const names =
      process.platform === "win32" ? ["NEXUS.exe", `NEXUS-${APP_VERSION}.exe`] : ["nexus", "NEXUS"];
    for (const name of names) {
      const cand = path.join(targetDir, name);
      if (fs.existsSync(cand)) {
        launchTarget = cand;
        break;
      }
    }
    if (!launchTarget) throw new Error("payload-executable-missing");
  } else if (payload && payload.kind === "exe") {
    const dest = path.join(targetDir, "NEXUS.exe");
    fs.copyFileSync(payload.src, dest);
    launchTarget = dest;
  } else if (payload && payload.kind === "dev") {
    // Workspace install: write a real launcher that starts the desktop app.
    if (process.platform === "win32") {
      const cmd = path.join(targetDir, "NEXUS.cmd");
      fs.writeFileSync(
        cmd,
        `@echo off\r\ntitle NEXUS\r\ncd /d "${payload.src}"\r\nnpm start\r\n`,
        "utf8",
      );
      launchTarget = cmd;
    } else {
      const sh = path.join(targetDir, "nexus.sh");
      fs.writeFileSync(sh, `#!/bin/sh\ncd "${payload.src}"\nnpm start\n`, { mode: 0o755 });
      launchTarget = sh;
    }
  } else {
    throw new Error("payload-not-found");
  }
  sendProgress(58, "devices");

  createShortcuts(launchTarget, targetDir);
  sendProgress(79, "privacy");

  // Install manifest — lets support/uninstall tooling see what was installed.
  const manifest = {
    name: "NEXUS",
    version: APP_VERSION,
    platform: process.platform,
    arch: process.arch,
    installedAt: new Date().toISOString(),
    installDir: targetDir,
    launchTarget,
  };
  fs.writeFileSync(path.join(targetDir, "install.json"), JSON.stringify(manifest, null, 2), "utf8");
  sendProgress(94, "finalize");

  installedLaunch = { launchTarget, cwd: targetDir };
  sendProgress(100, "done");
  return { ok: true, installDir: targetDir, launchTarget };
}

// ── Window ───────────────────────────────────────────────────────────────────

function createWindow() {
  win = new BrowserWindow({
    width: 720,
    height: 600,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    backgroundColor: "#0e0f12",
    icon: path.join(__dirname, "assets", "icon.png"), // brand mark (taskbar / window)
    show: false,
    title: "NEXUS Setup",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadFile(path.join(__dirname, "wizard.html"));
  win.once("ready-to-show", () => win.show());
}

// ── Native bridge ────────────────────────────────────────────────────────────

ipcMain.on("nx:minimize", () => {
  if (win) win.minimize();
});

ipcMain.on("nx:close", () => {
  if (win) win.close();
});

// OS-aware setup facts for the wizard UI (platform, language, paths, disk).
ipcMain.handle("nx:info", () => {
  const dir = defaultInstallDir();
  return {
    platform: process.platform,
    locale: app.getLocale(),
    version: APP_VERSION,
    defaultPath: dir,
    freeBytes: freeBytesFor(dir),
    requiredBytes: 240 * 1024 * 1024,
  };
});

ipcMain.handle("nx:browse", async () => {
  if (!win) return null;
  const roots = {
    win32: process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Programs") : "C:\\",
    darwin: path.join(os.homedir(), "Applications"),
    linux: path.join(os.homedir(), ".local", "share"),
  };
  const res = await dialog.showOpenDialog(win, {
    title: "Select installation folder",
    properties: ["openDirectory", "createDirectory"],
    defaultPath: roots[process.platform] || os.homedir(),
  });
  if (res.canceled || res.filePaths.length === 0) return null;
  const picked = res.filePaths[0];
  return path.basename(picked).toUpperCase() === "NEXUS" ? picked : path.join(picked, "NEXUS");
});

// Real install: copies the payload, writes the manifest, creates shortcuts.
ipcMain.handle("nx:install", async (_evt, targetDir) => {
  const dir =
    typeof targetDir === "string" && targetDir.trim() ? targetDir.trim() : defaultInstallDir();
  try {
    return await performInstall(dir);
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

ipcMain.on("nx:finish", (_evt, launch) => {
  if (launch && installedLaunch && fs.existsSync(installedLaunch.launchTarget)) {
    try {
      if (process.platform === "win32" && installedLaunch.launchTarget.endsWith(".cmd")) {
        spawn("cmd.exe", ["/c", "start", "", installedLaunch.launchTarget], {
          cwd: installedLaunch.cwd,
          detached: true,
          stdio: "ignore",
          windowsHide: true,
        }).unref();
      } else {
        spawn(installedLaunch.launchTarget, [], {
          cwd: installedLaunch.cwd,
          detached: true,
          stdio: "ignore",
        }).unref();
      }
    } catch {
      /* launching is best-effort; the shortcuts are already in place */
    }
  }
  if (win) win.close();
});

ipcMain.on("nx:open-external", (_evt, url) => {
  if (typeof url === "string" && /^https?:\/\//.test(url)) shell.openExternal(url);
});

// ── Lifecycle ────────────────────────────────────────────────────────────────

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
