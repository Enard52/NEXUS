// NEXUS masaüstü köprüsü — sayfalara yalnızca dar ve denetimli bir arayüz açılır.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nexusDesktop", {
  isDesktopApp: true,
  platform: process.platform,
  http: (opts) => ipcRenderer.invoke("lan:http", opts),
  tcp: (opts) => ipcRenderer.invoke("lan:tcp", opts),
  subnets: () => ipcRenderer.invoke("lan:subnets"),
  info: () => ipcRenderer.invoke("app:info"),
  setLanguage: (lang) => ipcRenderer.send("app:language", lang),
});
