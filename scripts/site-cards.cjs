// Adds brand-specific download card styling + live release data to the marketing home pages.
// Idempotent. Usage: node scripts/site-cards.cjs <dir containing index.html, tr/index.html, light.html, tr/light.html>
const fs = require("fs");
const path = require("path");
const root = process.argv[2];

const css = `<style id="nx-brand-downloads">
  .downloads-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }\n  @media (max-width: 800px) { .downloads-grid { grid-template-columns: 1fr !important; } }\n  .download-card { --brand: #4c7dff; --brand-2: #8b7bff; }
  .download-windows { --brand: #0078d4; --brand-2: #50a6f2; }
  .download-linux   { --brand: #e8590c; --brand-2: #f7b32b; }
  .download-android { --brand: #1fa95b; --brand-2: #3ddc84; }
  .download-ios     { --brand: #7b8494; --brand-2: #aab2c0; }
  .download-card {
    background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 90%, var(--brand) 10%), var(--surface)) !important;
    color: var(--text) !important;
    box-shadow: inset 0 4px 0 0 var(--brand), 0 18px 40px -24px color-mix(in srgb, var(--brand) 40%, rgba(0,0,0,.5)) !important;
  }
  .download-card h3 { color: var(--text) !important; }
  .download-card p, .download-card .download-note { color: var(--muted) !important; }
  .download-card:hover { border-color: color-mix(in srgb, var(--brand) 55%, transparent) !important;
    box-shadow: inset 0 4px 0 0 var(--brand), 0 28px 56px -24px color-mix(in srgb, var(--brand) 55%, transparent) !important; }
  .download-card .platform-icon { color: #fff !important; background: linear-gradient(135deg, var(--brand), var(--brand-2)) !important;
    box-shadow: 0 10px 22px -10px color-mix(in srgb, var(--brand) 80%, transparent); }
  .download-card .platform-icon .os-logo { color: #fff !important; }
  .download-card .platform-watermark { color: var(--brand) !important; }
  .download-card .version { color: var(--brand) !important; background: color-mix(in srgb, var(--brand) 14%, transparent) !important; }
  .download-card .platform-specs span { color: var(--muted) !important; }
  .download-card .download-button:not(.is-disabled) {
    background: linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%) !important; color: #fff !important;
    box-shadow: 0 14px 28px -14px color-mix(in srgb, var(--brand) 85%, transparent) !important; }
  .download-card.is-soon .download-button { opacity: .65; }
  .plan-stat { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; margin: 14px 0; border-radius: 14px; font-size: 13px;
    border: 1px solid color-mix(in srgb, var(--text) 10%, transparent); background: color-mix(in srgb, var(--surface) 70%, transparent); }
  .plan-stat span { color: var(--muted); }
  .plan-stat strong { font-weight: 800; color: var(--text); }
  .nx-chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 2px 0 14px; }
  .nx-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px; font-size: 12px; font-weight: 700;
    letter-spacing: .01em; border: 1px solid color-mix(in srgb, var(--brand) 35%, transparent);
    background: color-mix(in srgb, var(--brand) 8%, transparent); color: var(--text); }
  .nx-chip b { color: var(--brand); font-weight: 800; }
  .downloads-meta .nx-updated { display: block; margin-top: 6px; font-size: 12.5px; opacity: .75; }
</style>`;

const script = `<script>(function(){
  var TR=(document.documentElement.lang||"en").slice(0,2)==="tr";
  var FILES={
    windows:[["NEXUS-Setup.exe",".exe"]],
    linux:[["NEXUS-linux.AppImage",".AppImage"],["NEXUS-linux.deb",".deb"]],
    android:[["NEXUS-Android.apk",".apk"]]
  };
  function mb(n){return n>=1048576?(Math.round(n/104857.6)/10).toLocaleString(TR?"tr-TR":"en-US")+" MB":Math.round(n/1024)+" KB";}
  fetch("https://api.github.com/repos/Enard52/nexus-releases/releases/latest",{headers:{Accept:"application/vnd.github+json"}})
    .then(function(r){return r.ok?r.json():null})
    .then(function(d){
      if(!d||!d.tag_name)return;
      var v=String(d.tag_name).replace(/^v/,"");
      document.querySelectorAll("[data-nexus-ver]").forEach(function(e){e.textContent=v;});
      var sizes={};(d.assets||[]).forEach(function(a){sizes[a.name]=a.size;});
      Object.keys(FILES).forEach(function(p){
        var card=document.querySelector('.download-card[data-platform="'+p+'"]');
        if(!card||card.querySelector(".nx-chip-row"))return;
        var row=document.createElement("div");row.className="nx-chip-row";
        FILES[p].forEach(function(f){
          if(!sizes[f[0]])return;
          var c=document.createElement("span");c.className="nx-chip";
          c.innerHTML="<b>"+f[1]+"</b> "+mb(sizes[f[0]]);row.appendChild(c);
        });
        var vt=document.createElement("span");vt.className="nx-chip";vt.innerHTML="<b>v"+v+"</b>";row.insertBefore(vt,row.firstChild);
        if(!row.children.length)return;
        var anchor=card.querySelector(".platform-specs");
        if(anchor)anchor.insertAdjacentElement("afterend",row);
      });
      var meta=document.querySelector(".downloads-meta");
      if(meta&&d.published_at&&!meta.querySelector(".nx-updated")){
        var s=document.createElement("span");s.className="nx-updated";
        var dt=new Date(d.published_at).toLocaleDateString(TR?"tr-TR":"en-US",{year:"numeric",month:"long",day:"numeric"});
        s.textContent=(TR?"Son güncelleme: ":"Last updated: ")+dt+" · v"+v;meta.appendChild(s);
      }
    }).catch(function(){});
})();</script>`;

const OLD_SCRIPT = /<script>\(function\(\)\{(?:\s*var TR=|fetch\("https:\/\/api\.github\.com\/repos\/Enard52\/nexus-releases\/releases\/latest")[\s\S]*?<\/script>/;
let n = 0;
for (const f of ["index.html", "tr/index.html", "light.html", "tr/light.html"]) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) continue;
  let h = fs.readFileSync(p, "utf8");
  h = h.replace(/\s*<style id="nx-brand-downloads">[\s\S]*?<\/style>/, "");
  h = h.replace("</head>", () => "\n" + css + "\n</head>");
  if (OLD_SCRIPT.test(h)) h = h.replace(OLD_SCRIPT, () => script);
  else console.log("WARN: release script not found in", f);
  fs.writeFileSync(p, h);
  n++;
}
console.log("cards updated:", n);
