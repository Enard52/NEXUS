// NEXUS AI — Desktop preload (context-isolated bridge)
//
// The app's title bar is rendered by the server (the same premium chrome used
// everywhere). Here we (1) expose safe window-control IPC to the page and
// (2) turn the frameless window's title bar into a draggable region and wire its
// decorative window-control buttons (minimize / maximize / close, in that order)
// to real actions — so the rendered chrome behaves like a native window.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nexusDesktop", {
  minimize: () => ipcRenderer.send("nx:minimize"),
  toggleMaximize: () => ipcRenderer.send("nx:toggle-maximize"),
  close: () => ipcRenderer.send("nx:close"),
});

window.addEventListener("DOMContentLoaded", () => {
  // Drag regions: the title bar drags the window; interactive controls do not.
  const style = document.createElement("style");
  style.textContent = [
    ".titlebar { -webkit-app-region: drag; }",
    ".titlebar .wctl, .titlebar .wctl-btn, .titlebar .title-actions," +
      " .titlebar button, .titlebar a { -webkit-app-region: no-drag; }",
    ".wctl-btn { cursor: pointer; }",
  ].join("\n");
  document.head.appendChild(style);

  // Bind the three decorative window controls to native actions, in order.
  const buttons = Array.prototype.slice.call(document.querySelectorAll(".titlebar .wctl-btn"));
  const actions = ["minimize", "toggleMaximize", "close"];
  buttons.slice(0, 3).forEach((btn, i) => {
    btn.setAttribute("role", "button");
    btn.addEventListener("click", () => window.nexusDesktop[actions[i]]());
  });
});
