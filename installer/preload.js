// Secure context bridge: exposes only a tiny, explicit "native" API to the wizard.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nx", {
  minimize: () => ipcRenderer.send("nx:minimize"),
  close: () => ipcRenderer.send("nx:close"),
  // OS-aware setup facts: platform, locale, version, default path, disk space.
  info: () => ipcRenderer.invoke("nx:info"),
  browse: () => ipcRenderer.invoke("nx:browse"),
  // Real installation into the chosen folder; resolves { ok, installDir, launchTarget }.
  install: (targetDir) => ipcRenderer.invoke("nx:install", targetDir),
  // Progress events emitted by the main process during nx:install.
  onProgress: (cb) => ipcRenderer.on("nx:progress", (_evt, data) => cb(data)),
  finish: (launch) => ipcRenderer.send("nx:finish", !!launch),
  openExternal: (url) => ipcRenderer.send("nx:open-external", url),
});
