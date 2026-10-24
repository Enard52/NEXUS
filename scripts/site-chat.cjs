// Adds the floating NEXUS AI helper (bottom right) to site pages. Usage: node site-chat.cjs <siteDir>
const fs = require("fs");
const path = require("path");
const root = process.argv[2];
const API = "https://nexus-ai.ensarharmanci52.workers.dev";
const MARK = "<!--nexus-chat-->";
const T = {
  en: { title: "NEXUS AI", hello: "Hi! Ask me anything about NEXUS, plans or setup.", ph: "Type your question…", send: "Send", err: "I can't answer right now. Please email nexus.smarthome.app@gmail.com.", open: "Ask NEXUS AI", note: "AI answers may be inaccurate." },
  tr: { title: "NEXUS AI", hello: "Merhaba! NEXUS, planlar veya kurulum hakkında soru sorabilirsin.", ph: "Sorunu yaz…", send: "Gönder", err: "Şu an yanıt veremiyorum. Lütfen nexus.smarthome.app@gmail.com adresine yaz.", open: "NEXUS AI'a sor", note: "Yapay zekâ yanıtları hatalı olabilir." },
};
function block(lang) {
  const t = T[lang];
  return `${MARK}
<style>
#nx-fab{position:fixed;right:16px;bottom:16px;z-index:9998;display:flex;align-items:center;gap:8px;padding:12px 16px;border:0;border-radius:999px;background:linear-gradient(135deg,var(--primary,#818cf8),var(--accent,#38bdf8));color:#09090b;font:600 14px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35)}
#nx-box{position:fixed;right:16px;bottom:76px;z-index:9999;width:min(360px,calc(100vw - 32px));height:min(480px,calc(100vh - 100px));display:none;flex-direction:column;border-radius:16px;background:var(--bg,#09090b);color:var(--text,#e5e7eb);border:1px solid rgba(128,128,160,.35);box-shadow:0 16px 48px rgba(0,0,0,.45);overflow:hidden;font:14px/1.45 system-ui,sans-serif}
#nx-box.on{display:flex}
#nx-box header{padding:12px 14px;font-weight:700;border-bottom:1px solid rgba(128,128,160,.25);display:flex;justify-content:space-between}
#nx-box header button{background:none;border:0;color:inherit;font-size:18px;cursor:pointer}
#nx-log{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
#nx-log div{max-width:85%;padding:8px 12px;border-radius:12px;white-space:pre-wrap;background:rgba(128,128,160,.18)}
#nx-log .u{align-self:flex-end;background:var(--primary,#818cf8);color:#09090b}
#nx-note{padding:0 12px 6px;font-size:11px;opacity:.6}
#nx-form{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(128,128,160,.25)}
#nx-form input{flex:1;min-width:0;padding:10px 12px;border-radius:10px;border:1px solid rgba(128,128,160,.4);background:transparent;color:inherit;font:inherit}
#nx-form button{padding:0 14px;border:0;border-radius:10px;background:var(--primary,#818cf8);color:#09090b;font-weight:600;cursor:pointer}
</style>
<button id="nx-fab" type="button" aria-label="${t.open}">✨ ${t.open}</button>
<div id="nx-box" role="dialog" aria-label="${t.title}"><header><span>${t.title}</span><button type="button" id="nx-x" aria-label="Close">×</button></header><div id="nx-log"><div>${t.hello}</div></div><div id="nx-note">${t.note}</div><form id="nx-form"><input id="nx-in" maxlength="500" placeholder="${t.ph}" autocomplete="off"><button>${t.send}</button></form></div>
<script>(function(){var h=[],b=document.getElementById("nx-box"),l=document.getElementById("nx-log"),i=document.getElementById("nx-in");
function add(c,t){var d=document.createElement("div");if(c)d.className=c;d.textContent=t;l.appendChild(d);l.scrollTop=l.scrollHeight;return d}
document.getElementById("nx-fab").onclick=function(){b.classList.toggle("on");if(b.classList.contains("on"))i.focus()};
document.getElementById("nx-x").onclick=function(){b.classList.remove("on")};
document.getElementById("nx-form").onsubmit=function(e){e.preventDefault();var q=i.value.trim();if(!q)return;i.value="";add("u",q);h.push({role:"user",content:q});var w=add("","…");
fetch("${API}",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({lang:"${lang}",messages:h})}).then(function(r){return r.json()}).then(function(j){if(!j.reply)throw 0;w.textContent=j.reply;h.push({role:"assistant",content:j.reply})}).catch(function(){w.textContent=${JSON.stringify(t.err)}})}})();</script>`;
}
let n = 0;
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) { if (f !== "node_modules" && f !== ".git") walk(p); continue; }
    if (!f.endsWith(".html") || f.startsWith("google")) continue;
    let h = fs.readFileSync(p, "utf8");
    if (!h.includes("</body>")) continue;
    h = h.replace(/<!--nexus-chat-->[\s\S]*?<\/script>(?=\s*<\/body>)/, "");
    const lang = /<html[^>]*lang="tr"/.test(h) ? "tr" : "en";
    h = h.replace("</body>", block(lang) + "\n</body>");
    fs.writeFileSync(p, h); n++;
  }
})(root);
console.log("chat widget on", n, "pages");
