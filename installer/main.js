// NEXUS AI — Setup wizard, Electron main process.
// Creates a frameless, fixed-size window that hosts the custom 5-step wizard UI
// and bridges the few "native" actions the wizard needs (window controls, a real
// folder picker, and finish/launch) over IPC.

const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");

let win = null;

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

ipcMain.handle("nx:browse", async () => {
  if (!win) return null;
  const res = await dialog.showOpenDialog(win, {
    title: "Select installation folder",
    properties: ["openDirectory", "createDirectory"],
    defaultPath: "C:/Program Files",
  });
  if (res.canceled || res.filePaths.length === 0) return null;
  return path.join(res.filePaths[0], "NEXUS");
});

ipcMain.on("nx:finish", (_evt, launch) => {
  // In a real installer this would spawn the installed app. Here we simply
  // acknowledge and close the wizard; the flag is honoured if a launch target
  // exists later.
  if (launch) {
    // Placeholder for launching the installed NEXUS app.
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
