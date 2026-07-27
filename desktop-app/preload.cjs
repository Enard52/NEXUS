// NEXUS AI - Desktop preload (context-isolated bridge)
//
// Exposes only the narrow bridge the renderer needs:
//   - frameless window controls,
//   - setup wizard actions,
//   - offline-page retry helpers.

const { contextBridge, ipcRenderer } = require("electron");

const bridge = {
  window: {
    minimize: () => ipcRenderer.send("nx:minimize"),
    toggleMaximize: () => ipcRenderer.send("nx:toggle-maximize"),
    close: () => ipcRenderer.send("nx:close"),
  },
  setup: {
    browse: () => ipcRenderer.invoke("nx:setup-browse"),
    cancel: () => ipcRenderer.invoke("nx:setup-cancel"),
    complete: (config) => ipcRenderer.invoke("nx:setup-complete", config),
    launch: () => ipcRenderer.invoke("nx:setup-launch"),
  },
  retry: () => ipcRenderer.send("nx:retry"),
  appUrl: () => ipcRenderer.invoke("nx:app-url"),
};

contextBridge.exposeInMainWorld("nexusDesktop", bridge);
contextBridge.exposeInMainWorld("nx", bridge);

window.addEventListener("DOMContentLoaded", () => {
  const style = document.createElement("style");
  style.textContent = [
    ".titlebar { -webkit-app-region: drag; }",
    ".titlebar .wctl, .titlebar .wctl-btn, .titlebar .title-actions, .titlebar button, .titlebar a { -webkit-app-region: no-drag; }",
    ".wctl-btn { cursor: pointer; }",
  ].join("\n");
  document.head.appendChild(style);

  const buttons = Array.prototype.slice.call(document.querySelectorAll(".titlebar .wctl-btn"));
  const actions = ["minimize", "toggleMaximize", "close"];
  buttons.slice(0, 3).forEach((btn, i) => {
    btn.setAttribute("role", "button");
    btn.addEventListener("click", () => window.nexusDesktop.window[actions[i]]());
  });
});
