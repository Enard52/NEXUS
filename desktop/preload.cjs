// NEXUS masaüstü köprüsü — sayfalara yalnızca dar ve denetimli bir arayüz açılır.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nexusDesktop", {
  isDesktopApp: true,
  platform: process.platform,
  http: (opts) => ipcRenderer.invoke("lan:http", opts),
  tcp: (opts) => ipcRenderer.invoke("lan:tcp", opts),
  udp: (opts) => ipcRenderer.invoke("lan:udp", opts),
  subnets: () => ipcRenderer.invoke("lan:subnets"),
  info: () => ipcRenderer.invoke("app:info"),
  setLanguage: (lang) => ipcRenderer.send("app:language", lang),
  notifyEvent: (ev) => ipcRenderer.send("event:notify", ev),
  updateStatus: (st) => ipcRenderer.send("tray:status", st),
  onPaletteOpen: (cb) => {
    const handler = () => cb();
    ipcRenderer.on("palette:open", handler);
    return () => ipcRenderer.removeListener("palette:open", handler);
  },
  updates: {
    check: () => ipcRenderer.invoke("updates:check"),
    download: () => ipcRenderer.invoke("updates:download"),
    getState: () => ipcRenderer.invoke("updates:get-state"),
    getPrefs: () => ipcRenderer.invoke("updates:prefs:get"),
    setPrefs: (patch) => ipcRenderer.invoke("updates:prefs:set", patch),
    install: () => ipcRenderer.invoke("updates:install"),
    onState: (cb) => {
      const handler = (_e, state) => cb(state);
      ipcRenderer.on("updates:state", handler);
      return () => ipcRenderer.removeListener("updates:state", handler);
    },
  },
});
