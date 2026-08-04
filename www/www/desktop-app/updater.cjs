// NEXUS AI - Auto-update module (electron-updater)
//
// Wraps electron-updater so the main process can check GitHub Releases for a
// newer NEXUS build, download it in the background, and install it on quit
// (or immediately, on user request). The module is loaded lazily and only when
// the app is packaged: in development electron-updater has nothing to update
// against, so we no-op and let the "Check for Updates" menu item fall back to
// the informational dialog in main.cjs.
//
// Update artifacts are published from CI (see .github/workflows/desktop-release.yml)
// as GitHub Releases. electron-builder writes the latest.yml / latest-mac.yml /
// latest-linux.yml metadata next to the installers; electron-updater reads them
// from the configured `publish` provider (github) using the GH_TOKEN env var.

const { BrowserWindow } = require("electron");

let autoUpdater = null;
let initialized = false;

function tryRequireAutoUpdater() {
  try {
    // electron-updater is a runtime dependency of the desktop app. When the
    // app is packaged the module lives in node_modules; in a bare dev clone it
    // may be absent, which we treat as "updates unavailable".
    return require("electron-updater").autoUpdater;
  } catch {
    return null;
  }
}

// Resolve the focused window without depending on main.cjs module state, so
// this module stays independently testable.
function getActiveWindow() {
  const focused = BrowserWindow.getFocusedWindow();
  if (focused) return focused;
  const all = BrowserWindow.getAllWindows();
  return all.length ? all[0] : null;
}

/**
 * Wire electron-updater events to native notifications + IPC. Safe to call
 * once per process; subsequent calls are no-ops. Returns true when the updater
 * is available and armed, false otherwise (dev mode / missing dependency).
 *
 * @param {import("electron").App} app
 * @param {(title: string, body: string) => void} [notify]  optional native-notify helper
 */
function initAutoUpdater(app, notify) {
  if (initialized) return autoUpdater !== null;
  initialized = true;

  if (!app.isPackaged) return false;

  autoUpdater = tryRequireAutoUpdater();
  if (!autoUpdater) return false;

  // Don't crash the app if the update channel is misconfigured; surface it.
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  // Allow self-signed/private release assets when a token is configured but
  // never disable signature verification of the downloaded payload itself.
  autoUpdater.allowDowngrade = false;

  autoUpdater.on("checking-for-update", () => {
    if (notify) notify("NEXUS — Checking for updates", "Looking for a newer version…");
  });

  autoUpdater.on("update-available", (info) => {
    const version = (info && info.version) || "a newer version";
    if (notify) notify("NEXUS — Update available", `Downloading NEXUS ${version}…`);
  });

  autoUpdater.on("update-not-available", () => {
    if (notify) notify("NEXUS — Up to date", "You are running the latest version.");
  });

  autoUpdater.on("download-progress", (progress) => {
    // Progress is best surfaced in-app; we keep notifications unobtrusive.
    const w = getActiveWindow();
    if (w && !w.isDestroyed()) {
      w.webContents.send("nx:update-progress", {
        percent: Math.round(progress.percent || 0),
        transferred: progress.transferred,
        total: progress.total,
      });
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    const version = (info && info.version) || "new version";
    if (notify) notify("NEXUS — Update ready", `NEXUS ${version} will install on quit.`);
    const w = getActiveWindow();
    if (w && !w.isDestroyed()) {
      w.webContents.send("nx:update-ready", { version });
    }
  });

  autoUpdater.on("error", (err) => {
    console.error("[nexus] auto-update error:", err && err.message);
    if (notify) notify("NEXUS — Update check failed", "Could not check for updates right now.");
  });

  // Kick off the first check shortly after launch so it does not compete with
  // Local Core startup for CPU/network.
  setTimeout(() => {
    try {
      autoUpdater.checkForUpdatesAndNotify();
    } catch (err) {
      console.error("[nexus] auto-update check failed:", err && err.message);
    }
  }, 8000);

  return true;
}

/** Manual "Check for Updates" entry point invoked from the app menu. */
function checkForUpdates() {
  if (!autoUpdater) return false;
  try {
    autoUpdater.checkForUpdatesAndNotify();
    return true;
  } catch (err) {
    console.error("[nexus] manual update check failed:", err && err.message);
    return false;
  }
}

/** Quit and install a downloaded update immediately (renderer-triggered). */
function quitAndInstall() {
  if (!autoUpdater) return false;
  try {
    autoUpdater.quitAndInstall();
    return true;
  } catch {
    return false;
  }
}

module.exports = { initAutoUpdater, checkForUpdates, quitAndInstall };
