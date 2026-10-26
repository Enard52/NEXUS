// Google dönüş sayfası çizilmeden önce belirteci ana pencereye verir.
const { ipcRenderer } = require("electron");
const hash = (location.hash || "").replace(/^#/, "");
if (/access_token=|error=/.test(hash)) ipcRenderer.send("oauth:popup-hash", hash);
