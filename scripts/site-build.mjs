// NEXUS tanıtım sitesi üreticisi (issue #2 — baştan tasarım)
// ------------------------------------------------------------
// Tek içerik kaynağı (site-content.mjs) → index/about sayfaları (EN + TR).
// Kullanım:  node scripts/site-build.mjs [--shots]
//   --shots  Playwright ile GERÇEK uygulama ekran görüntüsü üretir
//            (www/public/images/shots/*.png) ve hero bunları kullanır.
//
// Tasarım dili uygulamayla aynı: Inter, #4C7DFF→#22D3EE marka gradyanı,
// lavanta yüzeyler (#ECE9FD), beyaz kartlar, büyük köşeler, yumuşak gölge;
// karanlık/aydınlık tema; mobil öncelikli; prefers-reduced-motion saygılı.
// light.html varyantı artık /'ye yönlendirir (tek kanonik sayfa).

import { mkdirSync, writeFileSync, existsSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { content, brand, priceFor, APP_URL } from "./site-content.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = join(ROOT, "www", "public");

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

// ---------- tasarım sistemi (uygulamayla aynı dil) ----------
const CSS = `
:root{
  --brand:#4C7DFF; --brand-press:#3F6FFF; --accent:#22D3EE;
  --brand-grad:linear-gradient(135deg,#4C7DFF 0%,#22D3EE 100%);
  --page:#ECE9FD; --page-grad:linear-gradient(180deg,#ECE9FD 0%,#DDD8FB 100%);
  --surface:#FFFFFF; --surface-2:#F4F5FA; --text:#0F172A; --text-2:#334155;
  --muted:#64748B; --border:#E6E8F0; --danger:#E5484D;
  --radius:20px; --radius-lg:28px;
  --shadow:0 4px 16px rgba(15,23,42,.06); --shadow-lg:0 18px 50px rgba(15,23,42,.10);
  --header-h:64px; --max:1080px;
}
html[data-theme=dark]{
  --page:#0F172A; --page-grad:linear-gradient(180deg,#020617 0%,#0F172A 100%);
  --surface:#1E293B; --surface-2:#273449; --text:#F1F5F9; --text-2:#CBD5E1;
  --muted:#94A3B8; --border:rgba(148,163,184,.18);
  --shadow:0 4px 16px rgba(0,0,0,.45); --shadow-lg:0 18px 50px rgba(0,0,0,.5);
  color-scheme:dark;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  background:var(--page-grad) fixed;color:var(--text);-webkit-font-smoothing:antialiased;line-height:1.6}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block}
.wrap{max-width:var(--max);margin:0 auto;padding:0 20px}
.icon{width:24px;height:24px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}

/* başlık */
.hd{position:sticky;top:0;z-index:50;height:var(--header-h);display:flex;align-items:center;
  background:color-mix(in srgb,var(--surface) 82%,transparent);backdrop-filter:blur(14px);
  border-bottom:1px solid var(--border)}
.hd .wrap{display:flex;align-items:center;gap:14px;width:100%}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px;letter-spacing:-.02em}
.logo svg{width:30px;height:30px}
.nav{display:none;gap:4px;margin-left:auto}
.nav a{padding:8px 12px;border-radius:999px;font-size:14px;font-weight:600;color:var(--text-2)}
.nav a:hover{background:var(--surface);color:var(--text)}
.hd-cta{display:none;margin-left:8px}
.theme-t,.lang-t{border:1px solid var(--border);background:var(--surface);color:var(--text-2);
  border-radius:999px;padding:8px;line-height:0;cursor:pointer}
.theme-t:hover,.lang-t:hover{color:var(--text)}
.lang-t{font-size:12px;font-weight:700;padding:8px 12px;line-height:1.2}
@media(min-width:960px){.nav{display:flex}.hd-cta{display:inline-flex}}
@media(max-width:959px){.lang-t{margin-left:auto}}
@media(max-width:460px){.lang-t{margin-left:auto;padding:8px 9px;font-size:11px}.hd .wrap{gap:10px}}

/* butonlar */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 24px;
  border-radius:999px;font-weight:700;font-size:15px;cursor:pointer;border:0;transition:transform .15s ease,box-shadow .15s ease,background .15s}
.btn:active{transform:scale(.97)}
.btn-primary{background:var(--brand);color:#fff;box-shadow:0 8px 24px rgba(76,125,255,.30)}
.btn-primary:hover{background:var(--brand-press)}
.btn-ghost{background:var(--surface);color:var(--text);border:1px solid var(--border);box-shadow:var(--shadow)}
.btn-ghost:hover{border-color:var(--brand);color:var(--brand)}

/* hero */
.hero{padding:56px 0 32px;position:relative;overflow:hidden}
.hero .wrap{display:grid;gap:36px;align-items:center}
@media(min-width:960px){.hero .wrap{grid-template-columns:1.05fr .95fr;padding-top:32px}}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.08em;
  text-transform:uppercase;color:var(--brand);background:color-mix(in srgb,var(--brand) 10%,transparent);
  padding:6px 14px;border-radius:999px}
h1{font-size:clamp(34px,6vw,58px);line-height:1.06;letter-spacing:-.03em;margin:18px 0 0;font-weight:800}
h1 .grad{background:var(--brand-grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{font-size:clamp(15px,2vw,18px);color:var(--text-2);max-width:54ch;margin:18px 0 26px}
.hero-cta{display:flex;flex-wrap:wrap;gap:12px}
.ver-chip{display:inline-flex;align-items:center;gap:8px;margin-top:18px;font-size:13px;color:var(--muted)}
.ver-chip b{color:var(--text)}
.dot{width:8px;height:8px;border-radius:99px;background:#10B981;flex:none}
.trust{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.trust span{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--text-2);
  background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:8px 14px}
.trust .icon{width:15px;height:15px;color:var(--brand)}

/* telefon çerçevesi (gerçek ekran görüntüsüyle) */
.shot{position:relative;margin:0 auto;max-width:320px}
.shot-frame{border-radius:44px;border:10px solid #0b1020;box-shadow:var(--shadow-lg);overflow:hidden;background:#0b1020}
.shot-frame img{width:100%;aspect-ratio:390/844;object-fit:cover;object-position:top}
.shot-glow{position:absolute;inset:-12% -8%;background:var(--brand-grad);filter:blur(70px);opacity:.20;border-radius:50%;z-index:-1}
.shot-tabs{display:flex;justify-content:center;gap:6px;margin-top:14px;flex-wrap:wrap}
.shot-tab{border:1px solid var(--border);background:var(--surface);color:var(--muted);font:600 12px/1 Inter,sans-serif;
  border-radius:999px;padding:8px 13px;cursor:pointer}
.shot-tab[aria-selected=true]{background:var(--brand);border-color:var(--brand);color:#fff}

/* bölümler */
section{padding:72px 0}
.sec-head{max-width:640px;margin-bottom:36px}
h2{font-size:clamp(24px,4vw,36px);letter-spacing:-.02em;line-height:1.15;margin:0 0 12px;font-weight:800}
.sec-head p{color:var(--text-2);margin:0}
.grid{display:grid;gap:16px}
@media(min-width:700px){.grid.c3{grid-template-columns:repeat(3,1fr)}.grid.c2{grid-template-columns:repeat(2,1fr)}}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:24px;box-shadow:var(--shadow);transition:transform .2s ease,box-shadow .2s ease}
.card:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg)}
.f-ic{width:48px;height:48px;border-radius:14px;background:color-mix(in srgb,var(--brand) 11%,transparent);
  color:var(--brand);display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.f-ic .icon{width:24px;height:24px}
.card h3{margin:0 0 8px;font-size:17px;font-weight:700;letter-spacing:-.01em}
.card p{margin:0;color:var(--muted);font-size:14px}

/* nasıl çalışır */
.steps{display:grid;gap:16px;counter-reset:st}
@media(min-width:800px){.steps{grid-template-columns:repeat(3,1fr)}}
.step{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:26px 24px 24px;box-shadow:var(--shadow)}
.step-n{position:absolute;top:-16px;left:22px;width:34px;height:34px;border-radius:12px;background:var(--brand-grad);
  color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(76,125,255,.35)}
.step h3{margin:8px 0 8px;font-size:16px;font-weight:700}
.step p{margin:0;color:var(--muted);font-size:14px}

/* entegrasyonlar */
.int-groups{display:grid;gap:16px}
@media(min-width:800px){.int-groups{grid-template-columns:repeat(2,1fr)}}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.chip{display:inline-flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);
  border-radius:999px;padding:9px 15px;font-size:13.5px;font-weight:600;color:var(--text-2)}
.chip .icon{width:14px;height:14px;color:var(--brand)}
.int-more{margin-top:22px;display:inline-flex;align-items:center;gap:8px;color:var(--brand);font-weight:700;font-size:14px}

/* fiyatlar */
.plans{display:grid;gap:16px}
@media(min-width:900px){.plans{grid-template-columns:repeat(3,1fr)}}
.plan{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:28px;box-shadow:var(--shadow);display:flex;flex-direction:column}
.plan.hot{border-color:var(--brand);box-shadow:0 18px 50px rgba(76,125,255,.16)}
.plan-badge{position:absolute;top:-13px;left:24px;background:var(--brand-grad);color:#fff;font-size:11px;font-weight:800;
  letter-spacing:.06em;text-transform:uppercase;padding:6px 13px;border-radius:999px}
.plan h3{margin:0 0 14px;font-size:16px;font-weight:700}
.price{font-size:38px;font-weight:800;letter-spacing:-.03em;line-height:1}
.price small{font-size:14px;font-weight:600;color:var(--muted);letter-spacing:0}
.price-note{color:var(--muted);font-size:13px;margin-top:6px}
.plan ul{list-style:none;margin:20px 0 24px;padding:0;display:grid;gap:11px;flex:1}
.plan li{display:flex;gap:10px;font-size:14px;color:var(--text-2)}
.plan li .icon{width:17px;height:17px;color:#10B981;margin-top:2px}
.plan .btn{width:100%}
.plan .btn[aria-disabled=true]{opacity:.55;pointer-events:none}
.cur-note{font-size:12.5px;color:var(--muted);margin-top:18px}

/* indirmeler */
.dl-grid{display:grid;gap:16px}
@media(min-width:800px){.dl-grid{grid-template-columns:repeat(3,1fr)}}
.dl-card{display:flex;flex-direction:column;gap:6px;background:var(--surface);border:1px solid var(--border);
  border-radius:var(--radius-lg);padding:24px;box-shadow:var(--shadow);transition:transform .2s,box-shadow .2s;color:inherit}
.dl-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg);border-color:var(--brand)}
.dl-top{display:flex;align-items:center;gap:13px;margin-bottom:6px}
.dl-ic{width:46px;height:46px;border-radius:14px;background:color-mix(in srgb,var(--brand) 11%,transparent);color:var(--brand);
  display:flex;align-items:center;justify-content:center}
.dl-card h3{margin:0;font-size:16.5px}
.dl-card .plat{color:var(--muted);font-size:13px}
.dl-meta{display:flex;gap:8px;margin:10px 0 16px;flex-wrap:wrap}
.dl-meta span{font-size:12px;font-weight:700;color:var(--text-2);background:var(--surface-2);border-radius:8px;padding:5px 10px}
.dl-card .btn{margin-top:auto}
.dl-note{color:var(--muted);font-size:13px;margin-top:20px;max-width:72ch}
.dl-web{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;gap:16px;justify-content:space-between;
  background:var(--surface);border:1px dashed var(--border);border-radius:var(--radius-lg);padding:22px 26px}
.dl-web h3{margin:0 0 4px;font-size:16px}
.dl-web p{margin:0;color:var(--muted);font-size:14px}

/* sss */
details.faq{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);margin-bottom:12px;overflow:hidden}
details.faq summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:14px;
  padding:19px 22px;font-weight:700;font-size:15.5px}
details.faq summary::-webkit-details-marker{display:none}
details.faq summary .icon{transition:transform .2s;color:var(--muted)}
details.faq[open] summary .icon{transform:rotate(180deg)}
details.faq p{margin:0;padding:0 22px 20px;color:var(--text-2);font-size:14.5px}

/* footer */
.ft{border-top:1px solid var(--border);background:color-mix(in srgb,var(--surface) 55%,transparent);padding:44px 0 32px;margin-top:24px}
.ft-grid{display:grid;gap:28px}
@media(min-width:800px){.ft-grid{grid-template-columns:1.4fr repeat(4,1fr)}}
.ft h4{margin:0 0 12px;font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
.ft a{display:block;font-size:14px;color:var(--text-2);padding:5px 0}
.ft a:hover{color:var(--brand)}
.ft-brand p{color:var(--muted);font-size:13.5px;margin:12px 0 0;max-width:34ch}
.ft-bottom{margin-top:34px;padding-top:18px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:12px;
  justify-content:space-between;color:var(--muted);font-size:13px}

/* giriş animasyonu — hafif, reduced-motion kapalı */
.rv{opacity:0;transform:translateY(14px);transition:opacity .5s ease,transform .5s ease}
.rv.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.rv{opacity:1;transform:none;transition:none}}

/* about sayfası */
.about-hero{padding:64px 0 8px}
.about-body{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);
  padding:28px;margin:26px 0;display:grid;gap:14px}
.about-body p{margin:0;color:var(--text-2);font-size:15px}
`;

// ---------- sayfa davranış betiği ----------
function pageJs() {
  return `
// Tema: sistem tercihi + kullanıcı seçimi (localStorage)
(function(){var t;try{t=localStorage.getItem('nx-site-theme')}catch(e){}
  var d=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  document.documentElement.setAttribute('data-theme',d);})();
function nxToggleTheme(){var d=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',d);try{localStorage.setItem('nx-site-theme',d)}catch(e){}}

// Kaydırma giriş animasyonu
(function(){var els=document.querySelectorAll('.rv');
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(function(e){e.classList.add('in')});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{threshold:.12});
  els.forEach(function(e){io.observe(e)});})();

// SSS tek-açıklık davranışı
document.querySelectorAll('details.faq').forEach(function(d){d.addEventListener('toggle',function(){
  if(d.open)document.querySelectorAll('details.faq[open]').forEach(function(o){if(o!==d)o.open=false})})});
`.trim();
}

// GitHub Releases'ten sürüm + boyut (mevcut sitenin kalıcı mekanizması)
function downloadsJs() {
  return `
(function(){var TR=(document.documentElement.lang||'en').slice(0,2)==='tr';
  var FILES={windows:[["NEXUS-Setup.exe",".exe"]],linux:[["NEXUS-linux.AppImage",".AppImage"],["NEXUS-linux.deb",".deb"]],android:[["NEXUS-Android.apk",".apk"]]};
  function mb(n){return n>=1048576?(Math.round(n/104857.6)/10).toLocaleString(TR?'tr-TR':'en-US')+' MB':Math.round(n/1024)+' KB'}
  fetch('https://api.github.com/repos/Enard52/nexus-releases/releases/latest',{headers:{Accept:'application/vnd.github+json'}})
    .then(function(r){return r.ok?r.json():null})
    .then(function(d){
      if(!d||!d.tag_name)return;
      var v=String(d.tag_name).replace(/^v/,'');
      document.querySelectorAll('[data-nexus-ver]').forEach(function(e){e.textContent=v});
      var sizes={};(d.assets||[]).forEach(function(a){sizes[a.name]=a.size});
      Object.keys(FILES).forEach(function(p){
        var card=document.querySelector('.dl-card[data-platform="'+p+'"]');if(!card)return;
        var row=card.querySelector('.dl-meta');if(!row)return;
        FILES[p].forEach(function(f){var s=sizes[f[0]];
          var sp=document.createElement('span');
          sp.textContent=f[0].replace('NEXUS-','')+(s?' · '+mb(s):'');
          row.appendChild(sp);});
      });
    }).catch(function(){});
})();
`.trim();
}

// ---------- ikonlar (satır içi Lucide yolları — CDN yok) ----------
const ICONS = {
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  wifi: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  sparkles:
    '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
  languages:
    '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  monitor:
    '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z"/>',
};
const icon = (name, cls = "icon") =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;

// ---------- render ----------
function iconNames() {
  return Object.keys(ICONS);
}

function renderHeader(c) {
  return `<header class="hd">
  <div class="wrap">
    <a class="logo" href="${c.canonical}">${brand.logoSvg}<span>NEXUS</span></a>
    <nav class="nav" aria-label="${c.lang === "tr" ? "Ana menü" : "Main menu"}">
      ${c.nav.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join("\n      ")}
    </nav>
    <a class="btn btn-primary hd-cta" href="${c.navCta.href}" style="min-height:40px;padding:0 18px;font-size:13.5px">${esc(c.navCta.label)}</a>
    <button class="theme-t" onclick="nxToggleTheme()" aria-label="${c.lang === "tr" ? "Tema değiştir" : "Toggle theme"}">${icon("sun")}</button>
    <a class="lang-t" href="${c.footer.langSwitchHref}" hreflang="${c.lang === "tr" ? "en" : "tr"}">${esc(c.footer.langSwitchLabel)}</a>
  </div>
</header>`;
}

function renderHero(c, hasShots) {
  const shots = hasShots
    ? [
        { file: "home", label: c.lang === "tr" ? "Ana ekran" : "Home" },
        { file: "energy", label: c.lang === "tr" ? "Enerji" : "Energy" },
        { file: "smart", label: c.lang === "tr" ? "Akıllı" : "Smart" },
        { file: "chat", label: "NEXUS AI" },
      ]
    : [];
  return `<section class="hero" id="top">
  <div class="wrap">
    <div>
      <span class="eyebrow">${icon("sparkles", "icon")}${esc(c.hero.eyebrow)}</span>
      <h1>${esc(c.hero.h1a)}<br><span class="grad">${esc(c.hero.h1b)}</span></h1>
      <p class="lead">${esc(c.hero.lead)}</p>
      <div class="hero-cta">
        <a class="btn btn-primary" href="${c.hero.primary.href}">${esc(c.hero.primary.label)}</a>
        <a class="btn btn-ghost" href="${c.hero.secondary.href}" target="_blank" rel="noopener">${esc(c.hero.secondary.label)}</a>
      </div>
      <p class="ver-chip"><span class="dot"></span>${esc(c.hero.versionNote)}: <b data-nexus-ver>…</b></p>
      <div class="trust">
        ${c.hero.trust.map((t) => `<span>${icon("check")}${esc(t)}</span>`).join("\n        ")}
      </div>
    </div>
    ${
      hasShots
        ? `
    <div class="shot rv">
      <div class="shot-glow" aria-hidden="true"></div>
      <div class="shot-frame">
        ${shots.map((s, i) => `<img src="/images/shots/${s.file}.png" alt="${esc(c.hero.shotAlt)} — ${esc(s.label)}" width="390" height="844" loading="eager" decoding="async"${i === 0 ? "" : " hidden"} data-shot="${s.file}">`).join("\n        ")}
      </div>
      <div class="shot-tabs" role="tablist" aria-label="${c.lang === "tr" ? "Ekran görüntüleri" : "Screenshots"}">
        ${shots.map((s, i) => `<button class="shot-tab" role="tab" aria-selected="${i === 0}" data-shot-btn="${s.file}">${esc(s.label)}</button>`).join("\n        ")}
      </div>
    </div>`
        : ""
    }
  </div>
</section>`;
}

function renderFeatures(c) {
  return `<section id="features">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.features.heading)}</h2><p>${esc(c.features.lead)}</p></div>
    <div class="grid c3">
      ${c.features.items.map(([ic, t, d]) => `<article class="card rv"><div class="f-ic">${icon(ic)}</div><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

function renderHow(c) {
  return `<section id="how">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.how.heading)}</h2></div>
    <div class="steps">
      ${c.how.steps.map(([n, t, d]) => `<article class="step rv"><span class="step-n">${esc(n)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

function renderIntegrations(c) {
  return `<section id="integrations">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.integrations.heading)}</h2><p>${esc(c.integrations.lead)}</p></div>
    <div class="int-groups">
      ${c.integrations.groups.map(([g, items]) => `<div class="card rv"><h3>${esc(g)}</h3><div class="chips">${items.map((i) => `<span class="chip">${icon("plug")}${esc(i)}</span>`).join("")}</div></div>`).join("\n      ")}
    </div>
    <a class="int-more" href="${c.integrations.moreHref}" target="_blank" rel="noopener">${esc(c.integrations.more)} ${icon("arrow")}</a>
  </div>
</section>`;
}

function renderPricing(c) {
  const p = priceFor(c.lang);
  const plus = c.pricing.plans[1];
  const priceMain =
    c.lang === "tr" ? `${p.monthly}<small>/ay</small>` : `${p.monthly}<small>/mo</small>`;
  return `<section id="pricing">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.pricing.heading)}</h2><p>${esc(c.pricing.lead)}</p></div>
    <div class="plans">
      ${c.pricing.plans
        .map((plan) => {
          const price =
            plan.name === "NEXUS+" || plan.name.includes("+")
              ? priceMain
              : `${esc(plan.price)}${plan.price === "$0" || plan.price === "₺0" ? "" : `<small>${plan.soon ? "" : ""}</small>`}`;
          const period =
            plan.name === "NEXUS+" || plan.name.includes("+")
              ? c.lang === "tr"
                ? `${p.yearly}/yıl · ${esc(plan.period)}`
                : `${p.yearly}/yr · ${esc(plan.period)}`
              : esc(plan.period);
          return `<article class="plan rv${plan.badge ? " hot" : ""}">
        ${plan.badge ? `<span class="plan-badge">${esc(plan.badge)}</span>` : ""}
        <h3>${esc(plan.name)}</h3>
        <div class="price">${price}</div>
        <p class="price-note">${period}</p>
        <ul>${plan.features.map((f) => `<li>${icon("check")}${esc(f)}</li>`).join("")}</ul>
        ${
          plan.cta
            ? `<a class="btn btn-primary" href="${plan.cta.href}">${esc(plan.cta.label)}</a>`
            : `<span class="btn btn-ghost" aria-disabled="true">${plan.soon ? (c.lang === "tr" ? "Yakında" : "Coming soon") : c.lang === "tr" ? "Hepimize ücretsiz" : "Free for everyone"}</span>`
        }
      </article>`;
        })
        .join("\n      ")}
    </div>
    <p class="cur-note">${esc(c.pricing.manageNote)}</p>
  </div>
</section>`;
}

function renderDownloads(c) {
  return `<section id="downloads">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.downloads.heading)}</h2><p>${esc(c.downloads.lead)}</p></div>
    <div class="dl-grid">
      ${c.downloads.cards
        .map(
          ([
            plat,
            ic,
            name,
            sub,
            file,
            ext,
          ]) => `<a class="dl-card rv" data-platform="${plat}" href="${file === "NEXUS-Setup.exe" ? "downloads/NEXUS-Setup.exe" : `downloads/${file}`}" download>
        <div class="dl-top"><div class="dl-ic">${icon(ic)}</div><div><h3>${esc(name)}</h3><span class="plat">${esc(sub)}</span></div></div>
        <div class="dl-meta"><span>${icon("globe", "icon")}<b data-nexus-ver>…</b></span></div>
        <span class="btn btn-primary">${c.lang === "tr" ? "İndir" : "Download"}</span>
      </a>`,
        )
        .join("\n      ")}
      <div class="dl-web rv">
        <div><h3>${esc(c.downloads.webCard.title)}</h3><p>${esc(c.downloads.webCard.desc)}</p></div>
        <a class="btn btn-ghost" href="${c.downloads.webCard.cta.href}" target="_blank" rel="noopener">${esc(c.downloads.webCard.cta.label)}</a>
      </div>
    </div>
    <p class="dl-note">${esc(c.downloads.smartScreenNote)}</p>
  </div>
</section>`;
}

function renderFaq(c) {
  return `<section id="faq">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.faq.heading)}</h2></div>
    <div>
      ${c.faq.items.map(([q, a], i) => `<details class="faq rv"${i === 0 ? " open" : ""}><summary>${esc(q)}${icon("chev")}</summary><p>${esc(a)}</p></details>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

function renderFooter(c) {
  const col = (title, links) =>
    `<div><h4>${esc(title)}</h4>${links.map(([l, h]) => `<a href="${h}"${h.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${esc(l)}</a>`).join("")}</div>`;
  return `<footer class="ft">
  <div class="wrap">
    <div class="ft-grid">
      <div class="ft-brand">
        <a class="logo" href="${c.canonical}">${brand.logoSvg}<span>NEXUS</span></a>
        <p>${esc(c.footer.tagline)}</p>
      </div>
      ${col(c.footer.product, c.footer.productLinks)}
      ${col(c.footer.account, c.footer.accountLinks)}
      ${col(c.footer.legal, c.footer.legalLinks)}
      ${col(c.footer.project, c.footer.projectLinks)}
    </div>
    <div class="ft-bottom">
      <span>© ${new Date().getFullYear()} NEXUS. ${esc(c.footer.rights)}</span>
      <span>${icon("lock")} ${c.lang === "tr" ? "Ev verisi cihazında kalır." : "Your home data stays on your devices."}</span>
    </div>
  </div>
</footer>`;
}

function baseHead(c, path) {
  const SITE = "https://nexus-smarthome.pages.dev";
  const url = SITE + (path === "/" ? "/" : path);
  return `<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(c.title)}</title>
<meta name="description" content="${esc(c.description)}"/>
<link rel="canonical" href="${url}"/>
<link rel="alternate" hreflang="en" href="${SITE}/"/>
<link rel="alternate" hreflang="tr" href="${SITE}/tr/"/>
<link rel="alternate" hreflang="x-default" href="${SITE}/"/>
<link rel="icon" href="/icon.svg" type="image/svg+xml"/>
<link rel="manifest" href="/manifest.webmanifest"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="NEXUS"/>
<meta property="og:title" content="${esc(c.title)}"/>
<meta property="og:description" content="${esc(c.description)}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:image" content="${SITE}/og-cover.png"/>
<meta name="twitter:card" content="summary_large_image"/>
<link href="/fonts/inter/inter.css" rel="stylesheet"/>`;
}

// GitHub Pages → Cloudflare yönlendirmesi + dil algılama (bloklayan dış betik;
// CSP script-src 'self' ile uyumlu için satır içi değil).
function bootJs() {
  return `
if(location.hostname==='enard52.github.io'){location.replace('https://nexus-smarthome.pages.dev'+location.pathname.replace(/\\/index\\.html$/,'/').replace(/\\.html$/,'')+location.search+location.hash)}
(function(){try{var L=location,p=L.pathname,tr=/^\\/tr(\\/|$)/.test(p);
var q=new URLSearchParams(L.search).get('lang'),s=null;try{s=localStorage.getItem('nx-lang')}catch(e){}
if(q==='tr'||q==='en'){s=q;try{localStorage.setItem('nx-lang',q)}catch(e){}}
function d(){var a=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language]).filter(Boolean);
for(var i=0;i<a.length;i++){if(/^tr/i.test(String(a[i]).split(/[-_]/)[0]))return'tr'}
var z='';try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
return /Istanbul|Famagusta|Baku|Almaty|Qyzylorda|Aqtobe|Aqtau|Atyrau|Oral|Qostanay|Tashkent|Samarkand|Bishkek|Ashgabat/.test(z)?'tr':'en'}
if(!s&&tr)return;var w=s||d();var f=p.replace(/^\\/tr(\\/|$)/,'/').replace(/^\\/+/,'');if(f==='index.html')f='';
var t=(w==='tr'?'/tr/':'/')+f;if(t!==p&&!(t+'index.html'===p))L.replace(t+L.hash)}catch(e){}})();`.trim();
}

function renderLanding(c, hasShots) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "NEXUS",
    applicationCategory: "SmartHomeApplication",
    operatingSystem: "Windows, Linux, Android, Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: c.lang === "tr" ? "TRY" : "USD" },
    description: c.description,
    url: "https://nexus-smarthome.pages.dev",
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.items.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
  return `<!doctype html>
<html lang="${c.htmlLang}" data-theme="light">
<head>
<script src="/assets/site-boot.js"></script>
${baseHead(c, c.canonical)}
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>
<style>${CSS}</style>
</head>
<body>
${renderHeader(c)}
<main>
${renderHero(c, hasShots)}
${renderFeatures(c)}
${renderHow(c)}
${renderIntegrations(c)}
${renderPricing(c)}
${renderDownloads(c)}
${renderFaq(c)}
</main>
${renderFooter(c)}
<script src="/assets/site.js" defer></script>
<script src="/assets/site-downloads.js" defer></script>
${hasShots ? `<script src="/assets/site-shots.js" defer></script>` : ""}
</body>
</html>`;
}

function renderAbout(c) {
  return `<!doctype html>
<html lang="${c.htmlLang}" data-theme="light">
<head>
<script src="/assets/site-boot.js"></script>
${baseHead({ ...c, title: `${c.about.title} — NEXUS` }, c.lang === "tr" ? "/tr/about.html" : "/about.html")}
<style>${CSS}</style>
</head>
<body>
${renderHeader(c)}
<main class="wrap about-hero">
  <span class="eyebrow">${esc(c.about.title)}</span>
  <h2 style="font-size:clamp(26px,4vw,38px);margin-top:16px">${esc(c.about.title)}</h2>
  <div class="about-body rv">
    <p>${esc(c.about.lead)}</p>
    ${c.about.body.map((p) => `<p>${esc(p)}</p>`).join("\n    ")}
  </div>
  <h4 style="margin:8px 0 12px;font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)">${esc(c.about.linksTitle)}</h4>
  <div class="chips" style="margin-bottom:56px">
    ${c.footer.productLinks
      .concat(c.footer.projectLinks)
      .map(
        ([l, h]) =>
          `<a class="chip" href="${h}"${h.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${icon("arrow")}${esc(l)}</a>`,
      )
      .join("\n    ")}
  </div>
</main>
${renderFooter(c)}
<script src="/assets/site.js" defer></script>
</body>
</html>`;
}

// light.html artık tek kanonik sayfaya yönlendirir
function renderLightRedirect(tr) {
  const target = tr ? "/tr/" : "/";
  return `<!doctype html>
<html lang="${tr ? "tr" : "en"}">
<head>
<meta charset="utf-8"/>
<meta name="robots" content="noindex"/>
<title>NEXUS</title>
<link rel="canonical" href="https://nexus-smarthome.pages.dev${target}"/>
<meta http-equiv="refresh" content="0;url=${target}"/>
</head>
<body>
<script>location.replace('${target}'+location.hash)</script>
<a href="${target}">NEXUS</a>
</body>
</html>`;
}

// ---------- çalıştır ----------
const args = process.argv.slice(2);
const WITH_SHOTS = args.includes("--shots");
const shotsDir = join(PUB, "images", "shots");
const hasShots = WITH_SHOTS || existsSync(join(shotsDir, "home.png"));

// Harici betikler (CSP: script-src 'self' — satır içi betik yok)
mkdirSync(join(PUB, "assets"), { recursive: true });
writeFileSync(join(PUB, "assets", "site-boot.js"), bootJs() + "\n");
writeFileSync(join(PUB, "assets", "site.js"), pageJs() + "\n");
writeFileSync(join(PUB, "assets", "site-downloads.js"), downloadsJs() + "\n");
writeFileSync(
  join(PUB, "assets", "site-shots.js"),
  `document.querySelectorAll('[data-shot-btn]').forEach(function(b){b.addEventListener('click',function(){
  document.querySelectorAll('[data-shot]').forEach(function(img){img.hidden=img.getAttribute('data-shot')!==b.getAttribute('data-shot-btn')});
  document.querySelectorAll('[data-shot-btn]').forEach(function(x){x.setAttribute('aria-selected',x===b?'true':'false')});
})});\n`,
);

const outputs = [
  ["index.html", renderLanding(content.en, hasShots)],
  [join("tr", "index.html"), renderLanding(content.tr, hasShots)],
  ["about.html", renderAbout(content.en)],
  [join("tr", "about.html"), renderAbout(content.tr)],
  ["light.html", renderLightRedirect(false)],
  [join("tr", "light.html"), renderLightRedirect(true)],
];
mkdirSync(join(PUB, "tr"), { recursive: true });
for (const [rel, html] of outputs) {
  writeFileSync(join(PUB, rel), html + "\n");
  console.log("✓", rel, Math.round(html.length / 1024) + " KB");
}
console.log(
  hasShots ? "Ekran görüntüleri: VAR (images/shots/)" : "Ekran görüntüleri: YOK — --shots ile üret",
);
