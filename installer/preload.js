// Secure context bridge: exposes only a tiny, explicit "native" API to the wizard.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nx", {
  minimize: () => ipcRenderer.send("nx:minimize"),
  close: () => ipcRenderer.send("nx:close"),
  browse: () => ipcRenderer.invoke("nx:browse"),
  finish: (launch) => ipcRenderer.send("nx:finish", !!launch),
  openExternal: (url) => ipcRenderer.send("nx:open-external", url),
});
