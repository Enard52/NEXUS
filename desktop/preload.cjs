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
  googleLogin: (url) => ipcRenderer.invoke("auth:google", url),
  onOAuthCallback: (cb) => {
    const handler = (_e, hash) => cb(hash);
    ipcRenderer.on("oauth:success", handler);
    return () => ipcRenderer.removeListener("oauth:success", handler);
  },
  getDesktopSettings: () => ipcRenderer.invoke("desktop:settings:get"),
  setDesktopSettings: (patch) => ipcRenderer.invoke("desktop:settings:set", patch),
  kit: {
    start: (payload) => ipcRenderer.invoke("kit:start", payload),
    stop: () => ipcRenderer.invoke("kit:stop"),
    status: () => ipcRenderer.invoke("kit:status"),
    commandResult: (r) => ipcRenderer.invoke("kit:commandResult", r),
    pushState: (id, patch) => ipcRenderer.invoke("kit:state", { id, patch }),
    onStatus: (cb) => {
      const handler = (_e, st) => cb(st);
      ipcRenderer.on("kit:status", handler);
      return () => ipcRenderer.removeListener("kit:status", handler);
    },
    onCommand: (cb) => {
      const handler = (_e, cmd) => cb(cmd);
      ipcRenderer.on("kit:command", handler);
      return () => ipcRenderer.removeListener("kit:command", handler);
    },
  },
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
