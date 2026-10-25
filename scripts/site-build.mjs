import { mkdirSync, writeFileSync, existsSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { content, brand, priceFor, CHECKOUT_URLS } from './site-content.mjs';
import { LEGAL_DOCS } from './site-legal-content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'www', 'public');

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  );

// ---------- Orijinal Marka ve Platform SVG Logoları ----------
const BRAND_LOGOS = {
  windows: `<svg viewBox="0 0 88 88" class="brand-svg" aria-hidden="true"><path fill="#0078D4" d="M0 12.402l35.688-4.86.016 34.423-35.67.203zm35.67 33.529l.028 34.453L.028 75.48.016 45.728zm4.326-39.025L87.914 0v41.527l-47.918.375zm47.918 43.465L40.014 88V46.527l47.904-.342z"/></svg>`,
  linux: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><path fill="#2B2B2B" d="M12.5 0.5C8.8 0.5 7.8 4.2 7.7 6.3c-.1 1.5-.4 2.4-1.2 3.6-.9 1.3-2.2 3-2.7 4.9-.5 1.7-.3 3.3.4 4.5.3.5.7.9 1.1 1.2.5.4 1.1.7 1.8.8.8.1 1.8 0 2.6-.5.8.7 1.8 1.1 2.8 1.1 1.2 0 2.2-.4 3-1.1.8.5 1.8.6 2.6.5.7-.1 1.3-.4 1.8-.8.4-.3.8-.7 1.1-1.2.7-1.2.9-2.8.4-4.5-.5-1.9-1.8-3.6-2.7-4.9-.8-1.2-1.1-2.1-1.2-3.6-.1-2.1-1.1-5.8-4.8-5.8z"/><ellipse cx="12.5" cy="14" rx="4.2" ry="5.5" fill="#FFFFFF"/><ellipse cx="10.8" cy="5.2" rx="0.8" ry="1.2" fill="#FFFFFF"/><ellipse cx="14.2" cy="5.2" rx="0.8" ry="1.2" fill="#FFFFFF"/><circle cx="11" cy="5.2" r="0.45" fill="#000000"/><circle cx="14" cy="5.2" r="0.45" fill="#000000"/><path fill="#FFB525" d="M12.5 6.5c-1.5 0-2 1.2-2 1.2s.8.5 2 .5 2-.5 2-.5-.5-1.2-2-1.2z"/><path fill="#F57900" d="M7 20c-1.5 0-2.5.8-2.5 1.8 0 .8.8 1.4 2 1.4 1.5 0 2.5-.8 3-1.8-.8-.9-1.7-1.4-2.5-1.4zm11 0c-.8 0-1.7.5-2.5 1.4.5 1 1.5 1.8 3 1.8 1.2 0 2-.6 2-1.4 0-1-1-1.8-2.5-1.8z"/></svg>`,
  android: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><path fill="#3DDC84" d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85 1.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 4.26 6 5.92 6 7.8h12c0-1.88-.97-3.54-2.47-4.64zM9 5.5c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75zm6 0c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75z"/></svg>`,
  shelly: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#4495D1"/><path fill="#fff" d="M12 4.5c-4.14 0-7.5 3.36-7.5 7.5 0 .58.07 1.15.2 1.69 1.42-.71 3.25-.94 5.3-.94h2.2c1.8 0 3.3.8 3.3 2.25 0 1.25-1.05 2.25-2.5 2.25H9.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h3.5c3.04 0 5.5-2.46 5.5-5.5 0-3.5-2.5-6-6.5-6.25z"/></svg>`,
  tasmota: `<svg viewBox="0 0 24 24" fill="#1FA3EC" class="brand-svg" aria-hidden="true"><path d="M12 0L0 12l1.371 1.372L12 2.743l10.629 10.629L24 12 12 0zm0 8.463a7.41 7.41 0 0 0-2.64 14.334v-2.133a5.464 5.464 0 0 1 1.671-10.17V24h1.94V10.494a5.464 5.464 0 0 1 1.669 10.171v2.133A7.41 7.41 0 0 0 12 8.463z"/></svg>`,
  esphome: `<svg viewBox="0 0 24 24" fill="#18BCF2" class="brand-svg" aria-hidden="true"><path d="M12 .311c-.384 0-.769.146-1.06.437l-9.878 9.88C.478 11.21 0 12.364 0 13.189v9c0 .825.675 1.5 1.5 1.5h5.899V8.755a.6.6 0 0 1 .6-.6h8a.6.6 0 0 1 .6.6v2.4a.6.6 0 0 1-.6.6h-5v1.2h5a.6.6 0 0 1 .6.6v2.4a.6.6 0 0 1-.6.6h-5v1.2h5a.6.6 0 0 1 .6.6v2.4a.6.6 0 0 1-.6.6h-5.6a.6.6 0 1 1 0-1.2h5v-1.2h-5a.6.6 0 0 1-.6-.6v-2.4a.6.6 0 0 1 .6-.6h5v-1.2h-5a.6.6 0 0 1-.6-.6v-2.4a.6.6 0 0 1 .6-.6h5v-1.2H8.6v14.334h13.9c.825 0 1.5-.675 1.5-1.5v-9c0-.825-.478-1.978-1.061-2.561l-9.88-9.88A1.5 1.5 0 0 0 12 .311"/></svg>`,
  philipshue: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#00A3E0"/><path fill="#fff" d="M12 4a5 5 0 0 0-5 5c0 1.95 1.12 3.64 2.76 4.47V16a1 1 0 0 0 1 1h2.48a1 1 0 0 0 1-1v-2.53A5.002 5.002 0 0 0 17 9a5 5 0 0 0-5-5zm-1.5 14h3v1.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75V18z"/></svg>`,
  homeassistant: `<svg viewBox="0 0 24 24" fill="#41BDF5" class="brand-svg" aria-hidden="true"><path d="M12 .311c-.384 0-.769.146-1.06.437l-9.878 9.88C.478 11.21 0 12.364 0 13.189v9c0 .825.675 1.5 1.5 1.5h21c.825 0 1.5-.675 1.5-1.5v-9c0-.825-.478-1.978-1.061-2.561l-9.88-9.88A1.5 1.5 0 0 0 12 .311m0 2.444 8.75 8.75v8.995h-5.25v-4.5a3.5 3.5 0 0 0-7 0v4.5H3.25V11.5z"/></svg>`,
  sonoff: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#00B0A0"/><path d="M7 12h10M12 7v10" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  tplink: `<svg viewBox="0 0 24 24" fill="#4ACBD6" class="brand-svg" aria-hidden="true"><path d="M15.185 0C10.218 0 6.25 3.984 6.25 8.903V10.8h4.99V8.903c0-2.135 1.736-3.863 3.946-3.863 2.187 0 3.708 1.536 3.708 3.815 0 2.257-1.64 3.912-3.827 3.912h-1.878v5.039h1.878c4.874 0 8.819-4.007 8.819-8.952C23.885 3.72 20.2 0 15.185 0zM.115 12.6v4.103c0 .624.523 1.248 1.236 1.248h4.753v4.801c0 .624.523 1.248 1.236 1.248h4.065V12.6Z"/></svg>`,
  yeelight: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#E60012"/><path d="M7 7l5 6 5-6M12 13v5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  wiz: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#00A6D6"/><path d="M6 8l3 8 3-8 3 8 3-8" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  lifx: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#E5007D"/><path fill="#fff" d="M12 5a4.5 4.5 0 0 0-4.5 4.5c0 1.8 1.1 3.3 2.6 4v2.5a.9.9 0 0 0 .9.9h2a.9.9 0 0 0 .9-.9v-2.5c1.5-.7 2.6-2.2 2.6-4A4.5 4.5 0 0 0 12 5z"/></svg>`,
  govee: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#1B6EF3"/><path d="M16 8h-5a4 4 0 0 0 0 8h5v-4h-4" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  matter: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#4B5562"/><path d="M12 6v6m0 0l-5 3m5-3l5 3" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  zigbee: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#EB0443"/><path d="M7 8h10l-10 8h10" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  wled: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#E040FB"/><path fill="#fff" d="M12 4a5 5 0 0 0-5 5c0 1.95 1.12 3.64 2.76 4.47V16a1 1 0 0 0 1 1h2.48a1 1 0 0 0 1-1v-2.53A5 5 0 0 0 17 9a5 5 0 0 0-5-5zm-1.5 14h3v1.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75V18z"/></svg>`,
  apple: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#FF9500"/><path fill="#fff" d="M12 4l-8 7h2.5v7.5h11V11H20z"/></svg>`,
  mqtt: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#660066"/><path d="M7 16a5 5 0 0 1 5-5m-5 5a8 8 0 0 1 8-8m-8 8h.01" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>`,
};

function getBrandLogo(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('shelly')) return BRAND_LOGOS.shelly;
  if (n.includes('tasmota')) return BRAND_LOGOS.tasmota;
  if (n.includes('wled')) return BRAND_LOGOS.wled;
  if (n.includes('esphome')) return BRAND_LOGOS.esphome;
  if (n.includes('hue') || n.includes('philips')) return BRAND_LOGOS.philipshue;
  if (n.includes('home assistant')) return BRAND_LOGOS.homeassistant;
  if (n.includes('sonoff')) return BRAND_LOGOS.sonoff;
  if (n.includes('tp-link') || n.includes('kasa')) return BRAND_LOGOS.tplink;
  if (n.includes('yeelight')) return BRAND_LOGOS.yeelight;
  if (n.includes('wiz')) return BRAND_LOGOS.wiz;
  if (n.includes('lifx')) return BRAND_LOGOS.lifx;
  if (n.includes('govee')) return BRAND_LOGOS.govee;
  if (n.includes('matter')) return BRAND_LOGOS.matter;
  if (n.includes('zigbee')) return BRAND_LOGOS.zigbee;
  if (n.includes('mqtt')) return BRAND_LOGOS.mqtt;
  return icon('plug');
}

function getPlatformLogo(plat) {
  if (plat === 'windows') return BRAND_LOGOS.windows;
  if (plat === 'linux') return BRAND_LOGOS.linux;
  if (plat === 'android') return BRAND_LOGOS.android;
  return BRAND_LOGOS.windows;
}

function icon(name, cls = 'icon') {
  const I = {
    check: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M20 6L9 17l-5-5"/></svg>`,
    download: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`,
    sparkles: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-7-7 7 7-7 7"/></svg>`,
    external: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>`,
    lock: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    plug: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 2v6m7 0H5a2 2 0 0 0-2 2v2a5 5 0 0 0 5 5h8a5 5 0 0 0 5-5v-2a2 2 0 0 0-2-2zM9 22v-4m6 4v-4"/></svg>`,
  };
  return I[name] || '';
}

// ---------- Tasarım Sistemi CSS ----------
const CSS = `
:root{
  --brand:#4C7DFF; --brand-press:#3F6FFF; --accent:#22D3EE;
  --brand-grad:linear-gradient(135deg,#4C7DFF 0%,#22D3EE 100%);
  --page:#ECE9FD; --page-grad:linear-gradient(180deg,#ECE9FD 0%,#DDD8FB 100%);
  --surface:#FFFFFF; --surface-2:#F4F5FA; --text:#0F172A; --text-2:#334155;
  --muted:#64748B; --border:#E2E8F0; --danger:#E5484D;
  --radius:18px; --radius-lg:26px;
  --shadow:0 4px 16px rgba(15,23,42,.06); --shadow-lg:0 20px 48px rgba(15,23,42,.12);
  --header-h:68px; --max:1100px;
}
html[data-theme=dark]{
  --page:#0B0F19; --page-grad:linear-gradient(180deg,#0B0F19 0%,#111827 100%);
  --surface:#151B28; --surface-2:#1D2436; --text:#F8FAFC; --text-2:#CBD5E1;
  --muted:#94A3B8; --border:#263045;
  --shadow:0 4px 20px rgba(0,0,0,.35); --shadow-lg:0 20px 50px rgba(0,0,0,.5);
}
*{box-sizing:border-box}
body{
  margin:0;
  font:400 16px/1.6 Inter,system-ui,-apple-system,sans-serif;
  color:var(--text);
  background:var(--page-grad);
  background-attachment:fixed;
  min-height:100vh;
  -webkit-font-smoothing:antialiased;
}
a{color:inherit;text-decoration:none}
.wrap{max-width:var(--max);margin:0 auto;padding:0 20px}
.icon{width:20px;height:20px;vertical-align:middle;display:inline-block}
.brand-svg{width:22px;height:22px;vertical-align:middle;display:inline-block;flex-shrink:0}

/* Header */
.hd{position:sticky;top:0;z-index:100;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  background:color-mix(in srgb,var(--surface) 78%,transparent);border-bottom:1px solid var(--border);height:var(--header-h);display:flex;align-items:center}
.hd .wrap{display:flex;align-items:center;width:100%}
.logo{display:inline-flex;align-items:center;gap:10px;font-weight:800;font-size:19px;letter-spacing:-.02em}
.logo svg{width:32px;height:32px}

.nav{display:none;gap:6px;margin-left:auto}
.nav a{padding:8px 14px;border-radius:999px;font-size:14px;font-weight:600;color:var(--text-2);transition:all .15s ease}
.nav a:hover{background:var(--surface);color:var(--text)}

.nav-controls{display:flex;align-items:center;gap:10px;margin-left:auto}
@media(min-width:960px){.nav{display:flex}.nav-controls{margin-left:14px}}

/* Dil Değiştirici (Sleek Segmented Pill Control) */
.lang-switch{display:inline-flex;align-items:center;background:var(--surface-2);border:1px solid var(--border);
  border-radius:999px;padding:3px;box-shadow:0 1px 3px rgba(0,0,0,.04);height:38px;box-sizing:border-box}
.lang-btn{display:inline-flex;align-items:center;justify-content:center;border:0;background:transparent;
  color:var(--muted);font:700 12px/1 Inter,sans-serif;letter-spacing:.02em;height:30px;padding:0 12px;
  border-radius:999px;text-decoration:none !important;cursor:pointer;transition:all .18s cubic-bezier(.16,1,.3,1);user-select:none}
.lang-btn:hover:not(.active){color:var(--text);background:color-mix(in srgb,var(--surface) 70%,transparent)}
.lang-btn.active{background:var(--brand-grad);color:#fff !important;box-shadow:0 2px 8px rgba(76,125,255,.32);cursor:default}

/* Tema Değiştirici */
.theme-t{border:1px solid var(--border);background:var(--surface);color:var(--text-2);
  border-radius:999px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;
  cursor:pointer;box-shadow:var(--shadow);transition:transform .2s ease,color .15s ease,border-color .15s ease}
.theme-t:hover{transform:rotate(15deg);color:var(--text);border-color:var(--brand)}
.theme-t .ic-moon{display:none}
html[data-theme=dark] .theme-t .ic-sun{display:none}
html[data-theme=dark] .theme-t .ic-moon{display:block}

/* Butonlar */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 24px;
  border-radius:999px;font-weight:700;font-size:15px;cursor:pointer;border:0;transition:transform .15s ease,box-shadow .15s ease,background .15s ease}
.btn:active{transform:scale(.97)}
.btn-primary{background:var(--brand-grad);color:#fff;box-shadow:0 8px 24px rgba(76,125,255,.32)}
.btn-primary:hover{opacity:.95;box-shadow:0 10px 30px rgba(76,125,255,.45);transform:translateY(-1px)}
.btn-ghost{background:var(--surface);color:var(--text);border:1px solid var(--border);box-shadow:var(--shadow)}
.btn-ghost:hover{border-color:var(--brand);color:var(--brand)}
.btn.disabled{opacity:.55;pointer-events:none}

/* Hero */
.hero{padding:28px 0 20px;position:relative}
.hero .wrap{display:grid;gap:24px;align-items:center}
@media(min-width:960px){.hero .wrap{grid-template-columns:1.15fr .85fr;padding-top:12px;gap:32px}}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.08em;
  text-transform:uppercase;color:var(--brand);background:color-mix(in srgb,var(--brand) 10%,transparent);
  padding:5px 12px;border-radius:999px;margin-bottom:12px;border:1px solid color-mix(in srgb,var(--brand) 25%,transparent)}
h1{font-size:clamp(28px,4.2vw,46px);line-height:1.1;letter-spacing:-.03em;margin:0 0 14px;font-weight:800}
.grad{background:var(--brand-grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.lead{font-size:clamp(14.5px,1.6vw,17px);color:var(--text-2);margin:0 0 20px;max-width:52ch;line-height:1.55}
.hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:16px}
.ver-chip{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;color:var(--muted);background:var(--surface);
  border:1px solid var(--border);padding:3px 11px;border-radius:999px;box-shadow:var(--shadow)}
.dot{width:8px;height:8px;border-radius:50%;background:#10B981;box-shadow:0 0 8px #10B981;animation:pulseDot 2s infinite}
@keyframes pulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
.trust{display:flex;flex-wrap:wrap;gap:14px;margin-top:16px;font-size:12.5px;color:var(--muted)}
.trust span{display:inline-flex;align-items:center;gap:6px}
.trust .icon{color:#10B981;width:15px;height:15px}

/* Telefon Ön İzleme - Ekrana Tam Sığan ve Asla Kesilmeyen Gerçek Mockup */
.phone-wrapper{position:relative;margin:0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center}
.phone-glow{position:absolute;inset:-8% -8%;background:var(--brand-grad);filter:blur(50px);opacity:.3;
  border-radius:60px;z-index:0;pointer-events:none;animation:glowPulse 4s ease-in-out infinite}
@keyframes glowPulse{0%,100%{opacity:.25;transform:scale(1)}50%{opacity:.45;transform:scale(1.04)}}

.phone-case{
  position:relative;z-index:2;
  width:clamp(215px,21vw,245px);
  max-width:85vw;
  background:#14161C;
  border:1.5px solid rgba(255,255,255,.14);
  border-radius:38px;
  padding:6px;
  box-shadow:0 0 0 1px rgba(255,255,255,.06), 0 20px 44px -10px rgba(0,0,0,.5), 0 0 36px rgba(76,125,255,.2);
  user-select:none;
  cursor:grab;
  transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s ease;
  animation:phoneFloat 6s ease-in-out infinite;
}
.phone-case:active{cursor:grabbing}
@keyframes phoneFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}

@media(max-height:800px), (max-width:600px){
  .phone-case{width:clamp(195px,58vw,225px);border-radius:36px;padding:5px}
  .phone-inner-screen{border-radius:30px}
}
@media(max-width:380px){
  .phone-case{width:clamp(180px,62vw,198px);border-radius:32px;padding:4px}
  .phone-inner-screen{border-radius:26px}
}

.phone-inner-screen{
  position:relative;width:100%;
  aspect-ratio:390 / 844;
  border-radius:35px;overflow:hidden;
  background:#05070A;
}

/* Dinamik Ada */
.phone-island{
  position:absolute;top:6px;left:50%;transform:translateX(-50%);
  width:72px;height:18px;background:#000;border-radius:14px;z-index:40;
  display:flex;align-items:center;justify-content:space-between;padding:0 7px;
  box-shadow:0 0 0 1px rgba(255,255,255,.06);
  pointer-events:none;
}
.island-camera{width:7px;height:7px;border-radius:50%;background:#090d16;box-shadow:inset 0 0 2px #3b82f6}
.island-sensor{width:5px;height:5px;border-radius:50%;background:#090d16}

/* Ekran Slaytları */
.shot-slide{
  position:absolute;inset:0;opacity:0;
  transform:scale(.97);
  transition:opacity .4s cubic-bezier(.16,1,.3,1),transform .4s cubic-bezier(.16,1,.3,1);
  pointer-events:none;
}
.shot-slide img{width:100%;height:100%;object-fit:cover;display:block}
.shot-slide.active{opacity:1;transform:scale(1);pointer-events:auto}

/* Alt Çubuk (Home Indicator) */
.phone-home-indicator{
  position:absolute;bottom:4px;left:50%;transform:translateX(-50%);
  width:85px;height:3.5px;background:rgba(255,255,255,.75);border-radius:99px;z-index:35;
  pointer-events:none;
}

/* Telefon Cam Parıltısı */
.phone-glass-shine{
  position:absolute;top:0;left:-50%;width:200%;height:100%;
  background:linear-gradient(135deg,rgba(255,255,255,.1) 0%,rgba(255,255,255,0) 40%);
  pointer-events:none;z-index:32;border-radius:35px;
}

/* Gerçekçi Ekran Başlık Hapı & Minimalist Sayfalama */
.phone-bottom-bar{
  margin-top:8px;display:flex;flex-direction:column;align-items:center;gap:6px;
}
.phone-caption-pill{
  display:inline-flex;align-items:center;gap:6px;
  background:var(--surface);border:1px solid var(--border);border-radius:999px;
  padding:4px 12px;box-shadow:var(--shadow);font-size:12px;font-weight:700;color:var(--text);
  transition:all .2s ease;
}
.phone-caption-pill .badge{
  background:var(--brand-grad);color:#fff;font-size:10px;padding:2px 6px;border-radius:99px;
}
.phone-dots{
  display:flex;align-items:center;gap:4px;
}
.phone-dot{
  width:5px;height:5px;border-radius:999px;background:var(--border);border:0;padding:0;
  cursor:pointer;transition:all .25s ease;
}
.phone-dot.active{
  width:16px;background:var(--brand);box-shadow:0 0 6px rgba(76,125,255,.4);
}

.phone-tabs{
  display:flex;flex-wrap:wrap;justify-content:center;gap:4px;max-width:310px;margin:1px 0 2px;
}
.phone-tab{
  background:var(--surface);border:1px solid var(--border);border-radius:999px;
  padding:3px 9px;font-size:11px;font-weight:600;color:var(--text-2);
  cursor:pointer;transition:all .18s ease;
}
.phone-tab:hover{
  border-color:var(--brand);color:var(--brand);
}
.phone-tab.active{
  background:var(--brand-grad);color:#fff;border-color:transparent;
  box-shadow:0 2px 6px rgba(76,125,255,.3);
}

.phone-tap-hint{
  display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--muted);
}
.phone-tap-hint svg{width:12px;height:12px;color:var(--brand)}

/* Bölümler */
section{padding:72px 0}
@media(max-width:700px){section{padding:48px 0}}
.sec-head{max-width:640px;margin-bottom:36px}
h2{font-size:clamp(24px,3.8vw,36px);letter-spacing:-.02em;line-height:1.16;margin:0 0 12px;font-weight:800}
.sec-head p{color:var(--text-2);margin:0}
.grid{display:grid;gap:18px}
@media(min-width:700px){.grid.c3{grid-template-columns:repeat(3,1fr)}.grid.c2{grid-template-columns:repeat(2,1fr)}}

/* Kartlar - Asla gizli/kayıp kalmaz, opacity 1 */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:24px;box-shadow:var(--shadow);transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s ease,border-color .25s ease}
.card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:color-mix(in srgb,var(--brand) 30%,transparent)}
.f-ic{width:48px;height:48px;border-radius:14px;background:color-mix(in srgb,var(--brand) 12%,transparent);
  color:var(--brand);display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.card h3{margin:0 0 8px;font-size:17px;font-weight:700;letter-spacing:-.01em}
.card p{margin:0;color:var(--muted);font-size:14px}

/* Nasıl Çalışır */
.steps{display:grid;gap:18px;counter-reset:st}
@media(min-width:800px){.steps{grid-template-columns:repeat(3,1fr)}}
.step{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:26px 24px 24px;box-shadow:var(--shadow)}
.step-n{position:absolute;top:-16px;left:22px;width:34px;height:34px;border-radius:12px;background:var(--brand-grad);
  color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(76,125,255,.35)}
.step h3{margin:8px 0 8px;font-size:16.5px;font-weight:700}
.step p{margin:0;color:var(--muted);font-size:14px}

/* Entegrasyonlar */
.int-groups{display:grid;gap:18px}
@media(min-width:800px){.int-groups{grid-template-columns:repeat(2,1fr)}}
.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.chip{display:inline-flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--border);
  border-radius:999px;padding:9px 16px;font-size:13.5px;font-weight:600;color:var(--text-2);box-shadow:0 2px 6px rgba(15,23,42,.03);
  transition:all .18s ease}
.chip:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--brand) 40%,transparent);box-shadow:var(--shadow)}
.int-more{margin-top:22px;display:inline-flex;align-items:center;gap:8px;color:var(--brand);font-weight:700;font-size:14px}

/* Fiyatlar */
.billing-toggle-wrap{display:flex;align-items:center;justify-content:center;margin:0 0 32px}
.billing-toggle{display:inline-flex;align-items:center;background:var(--surface);border:1px solid var(--border);
  border-radius:999px;padding:4px;box-shadow:var(--shadow)}
.billing-btn{border:0;background:transparent;color:var(--muted);font:700 13px/1 Inter,sans-serif;
  padding:9px 18px;border-radius:999px;cursor:pointer;transition:all .18s ease;display:inline-flex;align-items:center;gap:6px}
.billing-btn.active{background:var(--brand-grad);color:#fff;box-shadow:0 4px 14px rgba(76,125,255,.35)}
.save-badge{font-size:11px;font-weight:800;background:rgba(255,255,255,.25);padding:3px 7px;border-radius:99px}
.billing-btn:not(.active) .save-badge{background:color-mix(in srgb,var(--brand) 15%,transparent);color:var(--brand)}

.plans{display:grid;gap:20px;width:100%;max-width:1100px;margin:0 auto}
@media(min-width:960px){.plans{grid-template-columns:repeat(3,1fr);align-items:stretch}}
@media(max-width:959px){.plans{grid-template-columns:1fr;max-width:440px;margin:0 auto}}
.plan{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:clamp(22px,2.8vw,30px);box-shadow:var(--shadow);display:flex;flex-direction:column;height:100%;
  box-sizing:border-box;transition:transform .25s ease,box-shadow .25s ease}
.plan:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.plan.hot{border:2px solid var(--brand);box-shadow:0 20px 50px rgba(76,125,255,.18)}
.plan-badge{position:absolute;top:-13px;left:24px;background:var(--brand-grad);color:#fff;font-size:11px;font-weight:800;
  letter-spacing:.06em;text-transform:uppercase;padding:6px 14px;border-radius:999px;box-shadow:0 4px 12px rgba(76,125,255,.35)}
.plan-head{min-height:106px;display:flex;flex-direction:column;justify-content:flex-start}
.plan h3{margin:0 0 10px;font-size:18px;font-weight:800}
.price{font-size:36px;font-weight:800;letter-spacing:-.03em;line-height:1}
.price small{font-size:13.5px;font-weight:600;color:var(--muted);letter-spacing:0}
.price-note{color:var(--muted);font-size:13px;margin:8px 0 0}
.plan ul{list-style:none;margin:22px 0 26px;padding:0;display:grid;gap:12px;flex:1;align-content:start}
.plan li{display:flex;align-items:flex-start;gap:10px;font-size:13.5px;color:var(--text-2);line-height:1.45}
.plan li .icon{width:16px;height:16px;color:#10B981;margin-top:2px;flex-shrink:0}
.plan .btn{width:100%;margin-top:auto}
.cur-note{font-size:12.5px;color:var(--muted);margin-top:18px;text-align:center}

/* İndirilenler & Etiketler (Badges) */
.dl-grid{display:grid;gap:18px}
@media(min-width:768px){.dl-grid{grid-template-columns:repeat(3,1fr)}}
.dl-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:26px;
  box-shadow:var(--shadow);display:flex;flex-direction:column;justify-content:space-between;
  transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}
.dl-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:color-mix(in srgb,var(--brand) 40%,transparent)}
.dl-top{display:flex;align-items:center;gap:14px;margin-bottom:18px}
.dl-ic{width:46px;height:46px;border-radius:12px;background:var(--surface-2);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center}
.dl-ic svg{width:26px;height:26px}
.dl-top h3{margin:0 0 2px;font-size:18px;font-weight:800}
.plat{color:var(--muted);font-size:13px;font-weight:500}
.dl-meta{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 22px}
.dl-meta span{background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:5px 10px;
  font-size:12px;font-weight:600;color:var(--text-2);box-shadow:0 1px 3px rgba(0,0,0,.02)}
.dl-card .btn{width:100%}
.dl-note{font-size:13px;color:var(--muted);margin-top:20px;text-align:center}

/* SSS */
.faq-list{display:grid;gap:14px;max-width:800px;margin:0 auto}
.faq-item{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow)}
.faq-q{width:100%;text-align:left;background:transparent;border:0;padding:20px 22px;font:700 16px/1.4 Inter,sans-serif;
  color:var(--text);display:flex;justify-content:space-between;align-items:center;cursor:pointer}
.faq-q:hover{color:var(--brand)}
.faq-a{padding:0 22px 20px;color:var(--text-2);font-size:14.5px;line-height:1.6;display:none}
.faq-item.open .faq-a{display:block}
.faq-item.open .faq-q svg{transform:rotate(180deg)}
.faq-q svg{transition:transform .2s ease;width:18px;height:18px;color:var(--muted);flex-shrink:0}

/* Footer */
.ft{border-top:1px solid var(--border);background:color-mix(in srgb,var(--surface) 60%,transparent);padding:48px 0 34px;margin-top:24px}
.ft-grid{display:grid;gap:28px}
@media(min-width:800px){.ft-grid{grid-template-columns:1.5fr repeat(3,1fr)}}
.ft h4{margin:0 0 14px;font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
.ft a{display:block;font-size:14px;color:var(--text-2);padding:5px 0;transition:color .15s ease}
.ft a:hover{color:var(--brand)}
.ft a.logo{display:inline-flex !important;align-items:center !important;gap:10px !important;font-size:20px !important;
  font-weight:800 !important;color:var(--text) !important;padding:0 !important;text-decoration:none !important}
.ft a.logo svg{width:32px !important;height:32px !important;flex-shrink:0 !important}
.ft-brand p{color:var(--muted);font-size:13.5px;margin:12px 0 0;max-width:34ch}
.ft-bottom{margin-top:36px;padding-top:20px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:14px;
  justify-content:space-between;align-items:center;color:var(--muted);font-size:13px}
.ft-privacy{display:inline-flex;align-items:center;gap:8px;font-weight:600;text-align:left}
.ft-privacy .icon{width:16px;height:16px;color:var(--brand);flex-shrink:0;margin:0}
@media(max-width:640px){.ft-bottom{flex-direction:column;align-items:flex-start;gap:12px}}

/* İçerikler varsayılan olarak görünür (opacity 1) */
.rv{opacity:1;transform:none}

/* About & Yasal Belge Sayfaları */
.about-hero{padding:64px 0 8px}
.about-body{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);
  padding:28px;margin:26px 0;display:grid;gap:14px}
.about-body p{margin:0;color:var(--text-2);font-size:15px}

.doc-hero{padding:56px 0 16px}
.doc-hero h1{font-size:clamp(28px,4vw,38px);margin:0 0 10px;font-weight:800;letter-spacing:-.02em}
.doc-hero .lead{color:var(--muted);font-size:14px;margin:0}
.doc-body{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);
  padding:36px;margin:24px 0 60px;line-height:1.75}
.doc-body h3{font-size:18px;font-weight:700;color:var(--text);margin:24px 0 8px}
.doc-body h3:first-child{margin-top:0}
.doc-body p{margin:0 0 14px;color:var(--text-2);font-size:15px}
.doc-body ul{margin:4px 0 16px 20px;padding:0;color:var(--text-2);font-size:15px}
.doc-body li{margin-bottom:8px}
.doc-body a{color:var(--brand);text-decoration:underline;text-underline-offset:2px}
.doc-body a:hover{color:var(--brand-dark)}
.doc-body .legal-updated{font-size:13px;color:var(--muted);margin-bottom:18px;font-style:italic}
@media(max-width:640px){
  .doc-body{padding:22px 18px}
}

/* İletişim & Destek Modülü (Contact Modal) */
.nx-modal-backdrop{
  position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  z-index:9999;display:none;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .25s ease;
}
.nx-modal-backdrop.open{display:flex;opacity:1}
.nx-modal-card{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:0 24px 64px -12px rgba(0,0,0,.5);
  width:100%;max-width:500px;max-height:92vh;overflow-y:auto;padding:30px;position:relative;
  transform:scale(.96);transition:transform .25s cubic-bezier(.16,1,.3,1);box-sizing:border-box;
}
.nx-modal-backdrop.open .nx-modal-card{transform:scale(1)}
.nx-modal-close{
  position:absolute;top:16px;right:16px;background:var(--surface-2);border:1px solid var(--border);
  color:var(--muted);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .18s ease;font-size:20px;line-height:1;padding:0;
}
.nx-modal-close:hover{color:var(--text);border-color:var(--text-2);transform:scale(1.05)}
.nx-modal-header{margin-bottom:20px}
.nx-modal-header h3{font-size:22px;font-weight:800;letter-spacing:-.02em;margin:0 0 6px;color:var(--text)}
.nx-modal-header p{margin:0;font-size:13.5px;color:var(--text-2);line-height:1.5}
.nx-form-group{margin-bottom:14px;display:flex;flex-direction:column;gap:5px}
.nx-form-group label{font-size:12px;font-weight:700;color:var(--text);letter-spacing:.02em}
.nx-form-input, .nx-form-select, .nx-form-textarea{
  width:100%;box-sizing:border-box;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);
  padding:10px 14px;font:500 13.5px Inter,sans-serif;color:var(--text);outline:none;transition:border-color .2s,box-shadow .2s;
}
.nx-form-input:focus, .nx-form-select:focus, .nx-form-textarea:focus{
  border-color:var(--brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 20%,transparent);
}
.nx-form-textarea{resize:vertical;min-height:92px}
.nx-form-submit{
  width:100%;background:var(--brand-grad);color:#fff;border:0;border-radius:var(--radius-sm);
  padding:12px 18px;font:700 14px Inter,sans-serif;cursor:pointer;display:inline-flex;align-items:center;
  justify-content:center;gap:8px;box-shadow:0 4px 16px rgba(76,125,255,.35);transition:opacity .2s,transform .15s;margin-top:4px;
}
.nx-form-submit:hover{opacity:.92;transform:translateY(-1px)}
.nx-form-submit:active{transform:translateY(0)}
.nx-form-submit:disabled{opacity:.6;cursor:not-allowed}
.nx-form-success{
  display:none;text-align:center;padding:20px 8px;
}
.nx-form-success svg{width:52px;height:52px;color:#10B981;margin:0 auto 12px;display:block}
.nx-form-success h4{font-size:19px;font-weight:800;margin:0 0 8px;color:var(--text)}
.nx-form-success p{font-size:13.5px;color:var(--text-2);line-height:1.5;margin:0 0 18px}
.nx-form-success .btn{margin:0 auto}
@media(max-width:480px){
  .nx-modal-card{padding:22px 18px}
}

/* Navbar Giriş / Hesap Butonu */
.nx-auth-btn{
  display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;padding:6px 14px;
  border-radius:999px;border:1px solid var(--border);background:var(--surface);color:var(--text);
  cursor:pointer;transition:all .18s ease;height:38px;box-sizing:border-box;
}
.nx-auth-btn:hover{border-color:var(--brand);color:var(--brand);background:var(--surface-2)}
.nx-auth-btn.logged-in{border-color:var(--brand);color:var(--brand);background:color-mix(in srgb,var(--brand) 8%,transparent)}
.nx-auth-btn .icon{width:15px;height:15px;flex-shrink:0}
.dot-online{width:7px;height:7px;border-radius:50%;background:#10B981;box-shadow:0 0 6px #10B981}

/* Auth Modal & Profile */
.nx-auth-alert{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:#ef4444;font-size:12.5px;padding:9px 12px;border-radius:var(--radius-sm);margin-bottom:14px;line-height:1.4}
.nx-auth-toggle{margin-top:16px;text-align:center;font-size:13px;color:var(--muted)}
.nx-link-btn{background:none;border:0;color:var(--brand);cursor:pointer;font:inherit;padding:0 4px;text-decoration:underline;text-underline-offset:2px}
.nx-link-btn:hover{color:var(--brand-dark)}
.nx-profile-badge{display:inline-flex;align-items:center;gap:8px;background:var(--surface-2);border:1px solid var(--border);padding:6px 14px;border-radius:999px;font-size:13px;font-weight:600;margin-bottom:12px;color:var(--text)}
.nx-avatar-dot{width:8px;height:8px;border-radius:50%;background:#10B981;box-shadow:0 0 8px #10B981}
.nx-profile-details{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 18px;margin:16px 0;display:grid;gap:12px}
.nx-detail-row{display:flex;justify-content:space-between;align-items:center;font-size:13.5px}
.nx-detail-row span{color:var(--muted)}
.nx-profile-actions{display:grid;gap:10px;margin-top:18px}
.w-full{width:100%}
.text-emerald{color:#10B981}

/* Hakkında Sayfası Kartları */
.about-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);padding:30px}
`;

// ---------- Sayfa Davranış Betiği (site.js) ----------
function pageJs() {
  return `
// Tema: sistem tercihi + kullanıcı seçimi
(function(){
  var d='light';
  var t=null;
  try{t=localStorage.getItem('nx-site-theme')}catch(e){}
  if(t==='dark'||t==='light') d=t;
  else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches) d='dark';
  document.documentElement.setAttribute('data-theme',d);
})();

function nxToggleTheme(){
  var d=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',d);
  try{localStorage.setItem('nx-site-theme',d)}catch(e){}
}

// Dil değiştirme: seçimi kaydet ve doğru sayfaya git
function nxSetLang(lang){
  try{localStorage.setItem('nx-lang',lang)}catch(e){}
  var p=location.pathname;
  var isTr=(p==='/tr/'||p.indexOf('/tr/')===0);
  if(lang==='tr'){
    if(isTr)return;
    var sub=p;
    while(sub.charAt(0)==='/')sub=sub.slice(1);
    location.href='/tr/'+sub+(sub?'':'?lang=tr')+location.hash;
  }else{
    if(!isTr)return;
    var sub=p.slice(3);
    while(sub.charAt(0)==='/')sub=sub.slice(1);
    location.href='/'+sub+(sub?'':'?lang=en')+location.hash;
  }
}

// İletişim & Destek Modülü Kontrolleri
function nxOpenContactModal(category){
  var m=document.getElementById('nxContactModal');
  if(!m)return;
  if(category){
    var sel=document.getElementById('nxContactCategory');
    if(sel)sel.value=category;
  }
  m.style.display='flex';
  setTimeout(function(){m.classList.add('open')},10);
  document.body.style.overflow='hidden';
}

function nxCloseContactModal(){
  var m=document.getElementById('nxContactModal');
  if(!m)return;
  m.classList.remove('open');
  setTimeout(function(){
    m.style.display='none';
    document.body.style.overflow='';
  },250);
}

function nxSubmitContact(e){
  e.preventDefault();
  var form=document.getElementById('nxContactForm');
  var btn=document.getElementById('nxContactSubmitBtn');
  var successEl=document.getElementById('nxContactSuccess');
  if(!form||!btn)return;

  var name=(document.getElementById('nxContactName').value||'').trim();
  var email=(document.getElementById('nxContactEmail').value||'').trim();
  var cat=document.getElementById('nxContactCategory').value;
  var msg=(document.getElementById('nxContactMsg').value||'').trim();

  if(!name||!email||!msg)return;

  btn.disabled=true;
  var origText=btn.innerHTML;
  btn.innerHTML=form.getAttribute('data-sending')||'Gönderiliyor…';

  fetch('https://formsubmit.co/ajax/nexus.smarthome.app@gmail.com',{
    method:'POST',
    headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify({
      name:name,
      email:email,
      _replyto:email,
      _subject:'[NEXUS Destek] '+cat+' — '+name,
      category:cat,
      message:msg,
      _template:'box'
    })
  })
  .then(function(r){return r.json();})
  .then(function(d){
    btn.disabled=false;
    btn.innerHTML=origText;
    form.style.display='none';
    if(successEl)successEl.style.display='block';
  })
  .catch(function(err){
    btn.disabled=false;
    btn.innerHTML=origText;
    var mailto='mailto:nexus.smarthome.app@gmail.com?subject='+encodeURIComponent('[NEXUS Destek] '+cat+' — '+name)+'&body='+encodeURIComponent('İsim: '+name+'\\nE-posta: '+email+'\\n\\nMesaj:\\n'+msg);
    location.href=mailto;
    form.style.display='none';
    if(successEl)successEl.style.display='block';
  });
}

// Auth & Giriş Kontrolleri
var nxAuthMode='login';

function nxUpdateNavAuth(){
  var user=null;
  try{user=localStorage.getItem('nexusCurrentUser');}catch(e){}
  var btn=document.getElementById('nxNavAuthBtn');
  var label=document.getElementById('nxNavAuthLabel');
  if(!btn||!label)return;
  var isTr=document.documentElement.lang==='tr';
  if(user){
    btn.classList.add('logged-in');
    var short=user.split('@')[0];
    if(short.length>12)short=short.slice(0,10)+'…';
    label.textContent=short;
  }else{
    btn.classList.remove('logged-in');
    label.textContent=isTr?'Giriş Yap':'Sign In';
  }
}

function nxOpenAuthModal(){
  var m=document.getElementById('nxAuthModal');
  if(!m)return;
  var user=null;
  try{user=localStorage.getItem('nexusCurrentUser');}catch(e){}
  var formView=document.getElementById('nxAuthFormView');
  var profileView=document.getElementById('nxAuthProfileView');
  var emailEl=document.getElementById('nxProfileEmail');

  if(user){
    if(formView)formView.style.display='none';
    if(profileView)profileView.style.display='block';
    if(emailEl)emailEl.textContent=user;
  }else{
    if(formView)formView.style.display='block';
    if(profileView)profileView.style.display='none';
    var alertEl=document.getElementById('nxAuthAlert');
    if(alertEl)alertEl.style.display='none';
  }

  m.style.display='flex';
  setTimeout(function(){m.classList.add('open')},10);
  document.body.style.overflow='hidden';
}

function nxCloseAuthModal(){
  var m=document.getElementById('nxAuthModal');
  if(!m)return;
  m.classList.remove('open');
  setTimeout(function(){
    m.style.display='none';
    document.body.style.overflow='';
  },250);
}

function nxToggleAuthMode(){
  var isTr=document.documentElement.lang==='tr';
  var title=document.getElementById('nxAuthTitle');
  var sub=document.getElementById('nxAuthSubtitle');
  var submitBtn=document.getElementById('nxAuthSubmitBtn');
  var prompt=document.getElementById('nxAuthSwitchPrompt');
  var switchBtn=document.getElementById('nxAuthSwitchBtn');
  var alertEl=document.getElementById('nxAuthAlert');
  if(alertEl)alertEl.style.display='none';

  if(nxAuthMode==='login'){
    nxAuthMode='signup';
    if(title)title.textContent=isTr?'Yeni Hesap Oluştur':'Create Account';
    if(sub)sub.textContent=isTr?'Evini tek merkezden yönetmek için hemen ücretsiz kaydol.':'Sign up free to control your home with zero lock-in.';
    if(submitBtn)submitBtn.innerHTML='<span>'+(isTr?'Kayıt Ol':'Sign Up')+'</span>';
    if(prompt)prompt.textContent=isTr?'Zaten hesabınız var mı?':'Already have an account?';
    if(switchBtn)switchBtn.textContent=isTr?'Giriş Yap':'Sign In';
  }else{
    nxAuthMode='login';
    if(title)title.textContent=isTr?'NEXUS Hesabım':'NEXUS Account';
    if(sub)sub.textContent=isTr?'Cihaz senkronizasyonu ve NEXUS+ aboneliğinizi yönetmek için giriş yapın.':'Sign in to synchronize your setup and manage your NEXUS+ subscription.';
    if(submitBtn)submitBtn.innerHTML='<span>'+(isTr?'Giriş Yap':'Sign In')+'</span>';
    if(prompt)prompt.textContent=isTr?'Hesabınız yok mu?':"Don't have an account?";
    if(switchBtn)switchBtn.textContent=isTr?'Hemen Kayıt Ol':'Sign Up';
  }
}

function nxSubmitAuth(e){
  e.preventDefault();
  var isTr=document.documentElement.lang==='tr';
  var email=(document.getElementById('nxAuthEmail').value||'').trim();
  var pass=document.getElementById('nxAuthPassword').value||'';
  var btn=document.getElementById('nxAuthSubmitBtn');
  var alertEl=document.getElementById('nxAuthAlert');

  if(!email||!pass)return;

  btn.disabled=true;
  var origText=btn.innerHTML;
  btn.innerHTML=isTr?'İşleniyor…':'Processing…';
  if(alertEl)alertEl.style.display='none';

  var SUPABASE_URL='https://flbctyolowzcizwwzbke.supabase.co';
  var SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYmN0eW9sb3d6Y2l6d3d6YmtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDc5MjMsImV4cCI6MjA5MjcyMzkyM30.iucht087oRSDQgpAGJ09-ruLImZDUCizeMsir1oIltg';

  var endpoint=nxAuthMode==='signup'
    ? SUPABASE_URL+'/auth/v1/signup'
    : SUPABASE_URL+'/auth/v1/token?grant_type=password';

  fetch(endpoint,{
    method:'POST',
    headers:{
      'apikey':SUPABASE_KEY,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({email:email,password:pass})
  })
  .then(function(res){
    return res.json().then(function(data){
      if(!res.ok){
        throw new Error(data.error_description||data.msg||data.message||'İşlem başarısız');
      }
      return data;
    });
  })
  .then(function(data){
    btn.disabled=false;
    btn.innerHTML=origText;
    var userEmail=(data.user&&data.user.email)||email;
    try{
      localStorage.setItem('nexusCurrentUser',userEmail);
      if(data.access_token){
        localStorage.setItem('nexus_cloud_session',JSON.stringify({
          accessToken:data.access_token,
          refreshToken:data.refresh_token,
          userId:data.user?data.user.id:null,
          email:userEmail
        }));
      }
    }catch(e){}
    nxUpdateNavAuth();
    nxOpenAuthModal();
  })
  .catch(function(err){
    btn.disabled=false;
    btn.innerHTML=origText;
    if(alertEl){
      var msg=err.message||'';
      if(/invalid login credentials/i.test(msg)){
        msg=isTr?'E-posta adresi veya şifre hatalı.':'Invalid email or password.';
      }else if(/already registered/i.test(msg)){
        msg=isTr?'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.':'This email is already registered. Please sign in.';
      }else if(/Password should be at least/i.test(msg)){
        msg=isTr?'Şifre en az 6 karakter olmalıdır.':'Password must be at least 6 characters.';
      }
      alertEl.textContent=msg;
      alertEl.style.display='block';
    }
  });
}

function nxSignOut(){
  try{
    localStorage.removeItem('nexusCurrentUser');
    localStorage.removeItem('nexus_cloud_session');
  }catch(e){}
  nxUpdateNavAuth();
  nxCloseAuthModal();
}

// Fiyatlandırma: Aylık / Yıllık geçişi
function nxSetBilling(period){
  var isYearly=period==='yearly';
  var btnM=document.getElementById('billingMonthly');
  var btnY=document.getElementById('billingYearly');
  if(btnM)btnM.classList.toggle('active',!isYearly);
  if(btnY)btnY.classList.toggle('active',isYearly);

  var isTr=document.documentElement.lang==='tr';
  var priceVal=document.getElementById('planPriceVal');
  var periodVal=document.getElementById('planPeriodVal');
  var priceNote=document.getElementById('planPriceNote');
  var cta=document.getElementById('nexusPlusCta');

  if(isYearly){
    if(priceVal)priceVal.textContent=isTr?'₺333,33':'$7.50';
    if(periodVal)periodVal.textContent=isTr?'/ay, yıllık':'/mo, billed yearly';
    if(priceNote)priceNote.textContent=isTr?'Yıllık ₺3.999,99 olarak faturalandırılır (%33 tasarruf)':'Billed as $89.99/yr (Save 33%)';
    if(cta&&cta.dataset.yearlyHref)cta.href=cta.dataset.yearlyHref;
  }else{
    if(priceVal)priceVal.textContent=isTr?'₺499,99':'$11.99';
    if(periodVal)periodVal.textContent=isTr?'/ay':'/mo';
    if(priceNote)priceNote.textContent=isTr?'Aylık faturalandırma':'Billed monthly';
    if(cta&&cta.dataset.monthlyHref)cta.href=cta.dataset.monthlyHref;
  }
}

// SSS tek-açıklık davranışı
function nxToggleFaq(btn){
  var item=btn.closest('.faq-item');
  var isOpen=item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(function(el){el.classList.remove('open')});
  if(!isOpen)item.classList.add('open');
}

// Gerçekçi Akıllı Telefon Ön İzleme Kontrolleri
var nxCurrentShot=0;
var nxShotTimer=null;
var nxShotsData=[];

function nxShowShot(idx){
  var slides=document.querySelectorAll('.shot-slide');
  var dots=document.querySelectorAll('.phone-dot');
  if(!slides.length)return;
  if(idx<0)idx=slides.length-1;
  if(idx>=slides.length)idx=0;
  nxCurrentShot=idx;

  slides.forEach(function(s,i){
    s.classList.toggle('active',i===idx);
  });
  dots.forEach(function(d,i){
    d.classList.toggle('active',i===idx);
  });
  var tabs=document.querySelectorAll('.phone-tab');
  tabs.forEach(function(t,i){
    t.classList.toggle('active',i===idx);
  });

  var titleEl=document.getElementById('phoneSlideTitle');
  var numEl=document.getElementById('phoneSlideNum');
  if(nxShotsData[idx]){
    if(titleEl)titleEl.textContent=nxShotsData[idx].label;
    if(numEl)numEl.textContent=(idx+1)+'/'+slides.length;
  }
}

function nxNextShot(){
  nxShowShot(nxCurrentShot+1);
  nxResetShotTimer();
}

function nxPrevShot(){
  nxShowShot(nxCurrentShot-1);
  nxResetShotTimer();
}

function nxResetShotTimer(){
  if(nxShotTimer)clearInterval(nxShotTimer);
  nxShotTimer=setInterval(function(){
    nxShowShot(nxCurrentShot+1);
  },4500);
}

// Telefon dokunma, sürükleme ve tıklama yönetimi
document.addEventListener('DOMContentLoaded',function(){
  var mockup=document.getElementById('phoneMockup');
  if(mockup){
    nxResetShotTimer();

    mockup.addEventListener('mouseenter',function(){if(nxShotTimer)clearInterval(nxShotTimer);});
    mockup.addEventListener('mouseleave',function(){nxResetShotTimer();});

    mockup.addEventListener('click',function(e){
      var rect=mockup.getBoundingClientRect();
      var x=e.clientX-rect.left;
      if(x<rect.width*0.35){
        nxPrevShot();
      }else{
        nxNextShot();
      }
    });

    var touchStartX=0;
    var touchEndX=0;
    mockup.addEventListener('touchstart',function(e){
      touchStartX=e.changedTouches[0].screenX;
      if(nxShotTimer)clearInterval(nxShotTimer);
    },{passive:true});
    mockup.addEventListener('touchend',function(e){
      touchEndX=e.changedTouches[0].screenX;
      var diff=touchEndX-touchStartX;
      if(diff>40) nxPrevShot();
      else if(diff<-40) nxNextShot();
      nxResetShotTimer();
    },{passive:true});
  }

  // Giriş Durumu Güncelleme
  nxUpdateNavAuth();

  // GitHub Sürüm Etiketi Çekimi (nexus-releases deposu)
  fetch('https://api.github.com/repos/Enard52/nexus-releases/releases/latest')
    .then(function(r){return r.ok?r.json():null;})
    .then(function(d){
      if(!d||!d.tag_name)return;
      var tag=String(d.tag_name);
      var v=tag.indexOf('v')===0?tag.slice(1):tag;
      document.querySelectorAll('[data-nexus-ver]').forEach(function(el){
        el.textContent='v'+v;
      });
    })
    .catch(function(){});
});
`.trim();
}

// ---------- HTML Üretim Fonksiyonları ----------
function renderHeader(c, currentPath = '') {
  const isTr = c.lang === 'tr';
  let enHref = '/?lang=en';
  let trHref = '/tr/?lang=tr';
  if (currentPath) {
    const clean = currentPath.replace(/^\/?(tr\/)?/, '').replace(/\.html$/, '');
    if (clean && clean !== 'index') {
      enHref = `/${clean}.html?lang=en`;
      trHref = `/tr/${clean}.html?lang=tr`;
    }
  }
  return `<header class="hd">
  <div class="wrap">
    <a class="logo" href="${c.canonical}">${brand.logoSvg}<span>NEXUS</span></a>
    <nav class="nav" aria-label="${isTr ? 'Ana menü' : 'Main menu'}">
      ${c.nav.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('\n      ')}
    </nav>
    <div class="nav-controls">
      <div class="lang-switch" role="group" aria-label="${isTr ? 'Dil seçimi' : 'Language selection'}">
        ${isTr
          ? `<span class="lang-btn active">TR</span><a href="${enHref}" class="lang-btn" onclick="nxSetLang('en')" title="English">EN</a>`
          : `<a href="${trHref}" class="lang-btn" onclick="nxSetLang('tr')" title="Türkçe">TR</a><span class="lang-btn active">EN</span>`
        }
      </div>
      <button class="nx-auth-btn" id="nxNavAuthBtn" onclick="nxOpenAuthModal()" aria-label="${isTr ? 'Giriş Yap veya Hesap' : 'Sign In or Account'}">
        <svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0-8 0 4 4 0 0 0 8 0"/></svg>
        <span id="nxNavAuthLabel">${isTr ? 'Giriş Yap' : 'Sign In'}</span>
      </button>
      <button class="theme-t" onclick="nxToggleTheme()" aria-label="${isTr ? 'Tema değiştir' : 'Toggle theme'}" title="${isTr ? 'Karanlık/Aydınlık Tema' : 'Toggle theme'}">
        <span class="ic-sun">${icon('sun')}</span>
        <span class="ic-moon">${icon('moon')}</span>
      </button>
    </div>
  </div>
</header>`;
}

function renderHero(c, hasShots) {
  const isTr = c.lang === 'tr';
  const shots = hasShots
    ? [
        { file: 'home', label: isTr ? 'Ana Kontrol Paneli' : 'Home Dashboard', short: isTr ? 'Ana Panel' : 'Home' },
        { file: 'devices', label: isTr ? 'Cihazlar & Odalar' : 'Devices & Rooms', short: isTr ? 'Cihazlar' : 'Devices' },
        { file: 'energy', label: isTr ? 'Canlı Enerji Matrisi' : 'Live Energy Grid', short: isTr ? 'Enerji' : 'Energy' },
        { file: 'smart', label: isTr ? 'Akıllı Senaryolar' : 'Automations', short: isTr ? 'Senaryolar' : 'Automations' },
        { file: 'chat', label: isTr ? 'NEXUS AI Asistan' : 'AI Assistant', short: isTr ? 'AI Sohbet' : 'AI Chat' },
        { file: 'lighting', label: isTr ? 'Aydınlatma Kontrolü' : 'Lighting Master', short: isTr ? 'Aydınlatma' : 'Lighting' },
        { file: 'scenes', label: isTr ? 'Film Modu & Ambiyans' : 'Movie Mode & Scenes', short: isTr ? 'Sinema' : 'Scenes' },
        { file: 'settings', label: isTr ? 'Sistem & Entegrasyonlar' : 'Settings & Hub', short: isTr ? 'Ayarlar' : 'Settings' },
      ]
    : [];

  return `<section class="hero" id="top">
  <div class="wrap">
    <div>
      <span class="eyebrow">${icon('sparkles', 'icon')}${esc(c.hero.eyebrow)}</span>
      <h1>${esc(c.hero.h1a)}<br><span class="grad">${esc(c.hero.h1b)}</span></h1>
      <p class="lead">${esc(c.hero.lead)}</p>
      <div class="hero-cta">
        <a class="btn btn-primary" href="${c.hero.primary.href}">${esc(c.hero.primary.label)}</a>
      </div>
      <p class="ver-chip"><span class="dot"></span>${esc(c.hero.versionNote)}: <b data-nexus-ver>v1.0.14</b></p>
      <div class="trust">
        ${c.hero.trust.map((t) => `<span>${icon('check')}${esc(t)}</span>`).join('\n        ')}
      </div>
    </div>
    ${
      hasShots
        ? `
    <div class="phone-wrapper rv">
      <div class="phone-glow" aria-hidden="true"></div>
      <div class="phone-case" id="phoneMockup" title="${isTr ? 'Sonraki ekran için dokunun veya kaydırın' : 'Tap or swipe to see next screen'}">
        <div class="phone-inner-screen">
          <div class="phone-status-bar">
            <span>09:41</span>
            <div class="phone-status-icons">
              <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"/></svg>
              <svg viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
              <svg viewBox="0 0 24 24"><path d="M17 5v14H7V5h10m1-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg>
            </div>
          </div>
          <div class="phone-island">
            <span class="island-camera"></span>
            <span class="island-sensor"></span>
          </div>
          <div class="phone-screen-content">
            ${shots.map((s, i) => `<div class="shot-slide${i === 0 ? ' active' : ''}" data-shot="${s.file}"><img src="/images/shots/${s.file}.png" alt="${esc(c.hero.shotAlt)} — ${esc(s.label)}" width="390" height="844" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async"></div>`).join('\n            ')}
          </div>
          <div class="phone-home-indicator"></div>
          <div class="phone-glass-shine"></div>
        </div>
      </div>
      <div class="phone-bottom-bar">
        <div class="phone-caption-pill" id="phoneCaptionPill">
          <span class="badge" id="phoneSlideNum">1/${shots.length}</span>
          <span id="phoneSlideTitle">${esc(shots[0].label)}</span>
        </div>
        <div class="phone-dots" role="tablist" aria-label="${isTr ? 'Ekranlar' : 'Screens'}">
          ${shots.map((s, i) => `<button class="phone-dot${i === 0 ? ' active' : ''}" onclick="nxShowShot(${i});nxResetShotTimer();" aria-label="${esc(s.label)}" title="${esc(s.label)}"></button>`).join('')}
        </div>
        <span class="phone-tap-hint">${icon('sparkles')}${isTr ? 'Sonraki ekran için dokunun veya kaydırın' : 'Tap or swipe to see next screen'}</span>
      </div>
      <script>
        nxShotsData = ${JSON.stringify(shots)};
      </script>
    </div>`
        : ''
    }
  </div>
</section>`;
}

function renderFeatures(c) {
  return `<section id="features">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.features.heading)}</h2><p>${esc(c.features.lead)}</p></div>
    <div class="grid c3">
      ${c.features.items.map(([ic, title, desc]) => `<div class="card rv"><div class="f-ic">${icon(ic)}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

function renderHow(c) {
  return `<section id="how">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.how.heading)}</h2><p>${esc(c.how.lead)}</p></div>
    <div class="steps">
      ${c.how.steps.map(([n, title, desc]) => `<div class="step rv"><span class="step-n">${n}</span><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

function renderIntegrations(c) {
  return `<section id="integrations">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.integrations.heading)}</h2><p>${esc(c.integrations.lead)}</p></div>
    <div class="int-groups">
      ${c.integrations.groups.map(([g, items]) => `<div class="card rv"><h3>${esc(g)}</h3><div class="chips">${items.map((i) => `<span class="chip">${getBrandLogo(i)}${esc(i)}</span>`).join('')}</div></div>`).join('\n      ')}
    </div>
    <a class="int-more" href="${c.integrations.moreHref}" target="_blank" rel="noopener">${esc(c.integrations.more)} ${icon('arrow')}</a>
  </div>
</section>`;
}

function renderPricing(c) {
  const p = priceFor(c.lang);
  const isTr = c.lang === 'tr';
  const monthlyCheckout = isTr ? CHECKOUT_URLS.TRY.monthly : CHECKOUT_URLS.USD.monthly;
  const yearlyCheckout = isTr ? CHECKOUT_URLS.TRY.yearly : CHECKOUT_URLS.USD.yearly;

  return `<section id="pricing">
  <div class="wrap">
    <div class="sec-head rv" style="text-align:center;margin:0 auto 28px">
      <h2>${esc(c.pricing.heading)}</h2>
      <p>${esc(c.pricing.lead)}</p>
    </div>

    <!-- Aylık / Yıllık Geçiş Düğmesi -->
    <div class="billing-toggle-wrap rv">
      <div class="billing-toggle" role="group" aria-label="${isTr ? 'Faturalandırma dönemi' : 'Billing period'}">
        <button id="billingMonthly" class="billing-btn active" onclick="nxSetBilling('monthly')">
          ${isTr ? 'Aylık' : 'Monthly'}
        </button>
        <button id="billingYearly" class="billing-btn" onclick="nxSetBilling('yearly')">
          ${isTr ? 'Yıllık' : 'Yearly'}
          <span class="save-badge">${isTr ? '%33 Tasarruf' : 'Save 33%'}</span>
        </button>
      </div>
    </div>

    <div class="plans">
      <!-- 1. Ücretsiz Plan -->
      <div class="plan rv">
        <span class="plan-badge" style="background:var(--surface-2);color:var(--text);border:1px solid var(--border)">${isTr ? 'Temel Başlangıç' : 'Starter'}</span>
        <div class="plan-head">
          <h3>${esc(c.pricing.plans[0].name)}</h3>
          <div class="price">${c.pricing.plans[0].price} <small>/ ${esc(c.pricing.plans[0].period)}</small></div>
          <p class="price-note">${isTr ? 'Cihaz veya oda sınırı yok' : 'No device or room limits'}</p>
        </div>
        <ul>
          ${c.pricing.plans[0].features.map((f) => `<li>${icon('check')}${esc(f)}</li>`).join('\n          ')}
        </ul>
        <a class="btn btn-ghost" href="${c.pricing.plans[0].cta.href}">${esc(c.pricing.plans[0].cta.label)}</a>
      </div>

      <!-- 2. NEXUS+ Plan (Popüler) -->
      <div class="plan hot rv" id="nexusPlusPlan">
        <span class="plan-badge">${esc(c.pricing.plans[1].badge)}</span>
        <div class="plan-head">
          <h3>${esc(c.pricing.plans[1].name)}</h3>
          <div class="price"><span id="planPriceVal">${isTr ? '₺499,99' : '$11.99'}</span> <small id="planPeriodVal">${isTr ? '/ay' : '/mo'}</small></div>
          <p class="price-note" id="planPriceNote">${isTr ? 'Aylık faturalandırma' : 'Billed monthly'}</p>
        </div>
        <ul>
          ${c.pricing.plans[1].features.map((f) => `<li>${icon('check')}${esc(f)}</li>`).join('\n          ')}
        </ul>
        <a class="btn btn-primary plan-cta" id="nexusPlusCta" href="${monthlyCheckout}" data-monthly-href="${monthlyCheckout}" data-yearly-href="${yearlyCheckout}" target="_blank" rel="noopener">
          ${esc(c.pricing.plans[1].cta.label)}
        </a>
      </div>

      <!-- 3. Aile Planı (Uygulamada Açık & Dahil) -->
      <div class="plan rv">
        <span class="plan-badge" style="background:linear-gradient(135deg,#10B981,#059669)">${esc(c.pricing.plans[2].badge)}</span>
        <div class="plan-head">
          <h3>${esc(c.pricing.plans[2].name)}</h3>
          <div class="price">${isTr ? 'Dahil' : 'Included'} <small>/ ${esc(c.pricing.plans[2].period)}</small></div>
          <p class="price-note">${isTr ? 'Tüm aile fertleri için hazır' : 'Ready for the whole family'}</p>
        </div>
        <ul>
          ${c.pricing.plans[2].features.map((f) => `<li>${icon('check')}${esc(f)}</li>`).join('\n          ')}
        </ul>
        <a class="btn btn-ghost" href="${c.pricing.plans[2].cta.href}">${esc(c.pricing.plans[2].cta.label)}</a>
      </div>
    </div>
    <p class="cur-note rv">${esc(c.pricing.currencyNote)} · ${esc(c.pricing.manageNote)}</p>
  </div>
</section>`;
}

function renderDownloads(c) {
  const DL_BASE = 'https://github.com/Enard52/nexus-releases/releases/latest/download';
  return `<section id="downloads">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.downloads.heading)}</h2><p>${esc(c.downloads.lead)}</p></div>
    <div class="dl-grid">
      ${c.downloads.cards
        .map(
          ([plat, ic, name, sub, file, ext]) => `<a class="dl-card rv" data-platform="${plat}" href="${DL_BASE}/${file}" download>
        <div class="dl-top">
          <div class="dl-ic">${getPlatformLogo(plat)}</div>
          <div><h3>${esc(name)}</h3><span class="plat">${esc(sub)}</span></div>
        </div>
        <div class="dl-meta">
          <span><b data-nexus-ver>v1.0.14</b></span>
          <span>${plat === 'windows' ? '64-bit .exe' : plat === 'android' ? 'APK' : 'AppImage / .deb'}</span>
          <span>SHA-256</span>
        </div>
        <span class="btn btn-primary">${icon('download')}${c.lang === 'tr' ? 'İndir' : 'Download'}</span>
      </a>`
        )
        .join('\n      ')}
    </div>
    <p class="dl-note">${esc(c.downloads.smartScreenNote)}</p>
  </div>
</section>`;
}

function renderFaq(c) {
  return `<section id="faq">
  <div class="wrap">
    <div class="sec-head rv" style="text-align:center;margin:0 auto 36px"><h2>${esc(c.faq.heading)}</h2></div>
    <div class="faq-list">
      ${c.faq.items.map(([q, a], i) => `<div class="faq-item rv${i === 0 ? ' open' : ''}"><button class="faq-q" onclick="nxToggleFaq(this)"><span>${esc(q)}</span>${icon('arrow')}</button><div class="faq-a"><p>${esc(a)}</p></div></div>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

function renderFooter(c) {
  const col = (title, links) =>
    `<div><h4>${esc(title)}</h4>${links.map(([l, h]) => {
      let href = h;
      if (href.startsWith('#')) href = c.canonical + href;
      return `<a href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(l)}</a>`;
    }).join('')}</div>`;

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
    </div>
    <div class="ft-bottom">
      <span>© ${new Date().getFullYear()} NEXUS. ${esc(c.footer.rights)}</span>
      <span class="ft-privacy">${icon('lock')} ${c.lang === 'tr' ? 'Ev verisi cihazınızda kalır.' : 'Your home data stays on your devices.'}</span>
    </div>
  </div>
</footer>`;
}

function renderContactModal(c) {
  const isTr = c.lang === 'tr';
  return `
<div id="nxContactModal" class="nx-modal-backdrop" onclick="if(event.target===this)nxCloseContactModal()" role="dialog" aria-modal="true" aria-labelledby="nxContactTitle">
  <div class="nx-modal-card">
    <button class="nx-modal-close" onclick="nxCloseContactModal()" aria-label="${isTr ? 'Kapat' : 'Close'}">&times;</button>
    <div class="nx-modal-header">
      <h3 id="nxContactTitle">${isTr ? 'NEXUS İletişim & Destek' : 'NEXUS Contact & Support'}</h3>
      <p>${isTr ? 'Sorularınız, teknik destek talepleriniz veya yeni cihaz entegrasyonu önerileriniz için formu doldurun. Mesajınız doğrudan geliştirici ekibimize iletilir.' : 'Have a question, technical inquiry, or device connector request? Fill out the form below to reach our team directly.'}</p>
    </div>
    <form id="nxContactForm" onsubmit="nxSubmitContact(event)" data-sending="${isTr ? 'Gönderiliyor…' : 'Sending…'}">
      <div class="nx-form-group">
        <label for="nxContactName">${isTr ? 'Adınız Soyadınız' : 'Your Name'}</label>
        <input type="text" id="nxContactName" class="nx-form-input" required placeholder="${isTr ? 'Örn. Ahmet Yılmaz' : 'e.g. John Doe'}" autocomplete="name">
      </div>
      <div class="nx-form-group">
        <label for="nxContactEmail">${isTr ? 'E-posta Adresiniz (Yanıt bu adrese iletilecektir)' : 'Your Email (We will reply to this address)'}</label>
        <input type="email" id="nxContactEmail" class="nx-form-input" required placeholder="${isTr ? 'ornek@eposta.com' : 'name@example.com'}" autocomplete="email">
      </div>
      <div class="nx-form-group">
        <label for="nxContactCategory">${isTr ? 'Konu / Talep Türü' : 'Subject / Topic'}</label>
        <select id="nxContactCategory" class="nx-form-select">
          <option value="${isTr ? 'Teknik Destek' : 'Technical Support'}">${isTr ? 'Teknik Destek ve Kurulum' : 'Technical Support & Setup'}</option>
          <option value="${isTr ? 'Cihaz & Bağlayıcı İsteği' : 'Connector Request'}">${isTr ? 'Yeni Cihaz & Bağlayıcı İsteği' : 'New Device / Connector Request'}</option>
          <option value="${isTr ? 'NEXUS+ ve Abonelik' : 'NEXUS+ & Billing'}">${isTr ? 'NEXUS+ ve Fatura / Abonelik' : 'NEXUS+ & Billing Questions'}</option>
          <option value="${isTr ? 'Geri Bildirim & Öneri' : 'Feedback & Suggestion'}">${isTr ? 'Geri Bildirim veya Öneri' : 'General Feedback or Suggestion'}</option>
        </select>
      </div>
      <div class="nx-form-group">
        <label for="nxContactMsg">${isTr ? 'Mesajınız' : 'Your Message'}</label>
        <textarea id="nxContactMsg" class="nx-form-textarea" required rows="4" placeholder="${isTr ? 'Nasıl yardımcı olabiliriz? Lütfen detayları paylaşın…' : 'How can we help? Please describe your request in detail…'}"></textarea>
      </div>
      <button type="submit" id="nxContactSubmitBtn" class="nx-form-submit">
        <span>${isTr ? 'Mesajı Gönder' : 'Send Message'}</span>
      </button>
    </form>
    <div id="nxContactSuccess" class="nx-form-success">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
      <h4>${isTr ? 'Mesajınız Başarıyla İletildi!' : 'Message Received!'}</h4>
      <p>${isTr ? 'Talebiniz ekibimize ulaştı. Belirttiğiniz e-posta adresi üzerinden en kısa sürede sizinle iletişime geçeceğiz.' : 'Thank you for reaching out. Our team will review your message and reply to your email address shortly.'}</p>
      <button type="button" class="btn btn-outline" onclick="nxCloseContactModal()">${isTr ? 'Kapat' : 'Close'}</button>
    </div>
  </div>
</div>`;
}

function renderAuthModal(c) {
  const isTr = c.lang === 'tr';
  return `
<div id="nxAuthModal" class="nx-modal-backdrop" onclick="if(event.target===this)nxCloseAuthModal()" role="dialog" aria-modal="true" aria-labelledby="nxAuthTitle">
  <div class="nx-modal-card">
    <button class="nx-modal-close" onclick="nxCloseAuthModal()" aria-label="${isTr ? 'Kapat' : 'Close'}">&times;</button>
    
    <!-- Giriş / Kayıt Görünümü -->
    <div id="nxAuthFormView">
      <div class="nx-modal-header">
        <h3 id="nxAuthTitle">${isTr ? 'NEXUS Hesabım' : 'NEXUS Account'}</h3>
        <p id="nxAuthSubtitle">${isTr ? 'Cihaz senkronizasyonu ve NEXUS+ aboneliğinizi yönetmek için giriş yapın.' : 'Sign in to synchronize your setup and manage your NEXUS+ subscription.'}</p>
      </div>
      <form id="nxAuthForm" onsubmit="nxSubmitAuth(event)">
        <div id="nxAuthAlert" class="nx-auth-alert" style="display:none"></div>
        <div class="nx-form-group">
          <label for="nxAuthEmail">${isTr ? 'E-posta Adresi' : 'Email Address'}</label>
          <input type="email" id="nxAuthEmail" class="nx-form-input" required placeholder="name@example.com" autocomplete="email">
        </div>
        <div class="nx-form-group">
          <label for="nxAuthPassword">${isTr ? 'Şifre' : 'Password'}</label>
          <input type="password" id="nxAuthPassword" class="nx-form-input" required placeholder="••••••••" autocomplete="current-password">
        </div>
        <button type="submit" id="nxAuthSubmitBtn" class="nx-form-submit">
          <span>${isTr ? 'Giriş Yap' : 'Sign In'}</span>
        </button>
      </form>
      <div class="nx-auth-toggle">
        <span id="nxAuthSwitchPrompt">${isTr ? 'Hesabınız yok mu?' : "Don't have an account?"}</span>
        <button type="button" class="nx-link-btn" onclick="nxToggleAuthMode()"><b id="nxAuthSwitchBtn">${isTr ? 'Hemen Kayıt Ol' : 'Sign Up'}</b></button>
      </div>
    </div>

    <!-- Profil Görünümü (Giriş Yapılmışsa) -->
    <div id="nxAuthProfileView" style="display:none">
      <div class="nx-modal-header">
        <div class="nx-profile-badge">
          <span class="nx-avatar-dot"></span>
          <span id="nxProfileEmail">kullanici@eposta.com</span>
        </div>
        <h3>${isTr ? 'Hesap & Senkronizasyon' : 'Account & Sync'}</h3>
        <p>${isTr ? 'Hesabınız aktif. Tüm cihazlarınızda ve programda ev ayarlarınız otomatik senkronize edilir.' : 'Your account is active. Your home settings synchronize automatically across all devices.'}</p>
      </div>
      <div class="nx-profile-details">
        <div class="nx-detail-row">
          <span>${isTr ? 'Bulut Senkronu' : 'Cloud Sync'}</span>
          <b class="text-emerald">${isTr ? 'Aktif (Supabase)' : 'Active (Supabase)'}</b>
        </div>
        <div class="nx-detail-row">
          <span>${isTr ? 'Abonelik Durumu' : 'Plan Status'}</span>
          <b id="nxProfilePlan">${isTr ? 'NEXUS Standart (Ücretsiz)' : 'NEXUS Standard (Free)'}</b>
        </div>
      </div>
      <div class="nx-profile-actions">
        <a href="${c.canonical}#pricing" class="btn btn-primary w-full" onclick="nxCloseAuthModal()">${isTr ? 'NEXUS+ Planlarını Gör' : 'View NEXUS+ Plans'}</a>
        <button type="button" class="btn btn-outline w-full" onclick="nxSignOut()">${isTr ? 'Oturumu Kapat' : 'Sign Out'}</button>
      </div>
    </div>

  </div>
</div>`;
}

function baseHead(c, path) {
  const SITE = 'https://nexus-smarthome.pages.dev';
  const url = SITE + (path === '/' ? '/' : path);
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

function bootJs() {
  return `
if(location.hostname==='enard52.github.io'){
  var p=location.pathname;
  if(p.endsWith('/index.html')) p=p.slice(0,-10);
  else if(p.endsWith('.html')) p=p.slice(0,-5);
  location.replace('https://nexus-smarthome.pages.dev'+p+location.search+location.hash);
}
(function(){
  try{
    var L=location, p=L.pathname, isTrPage=(p==='/tr/'||p.indexOf('/tr/')===0);
    var q=new URLSearchParams(L.search).get('lang');
    var saved=null;
    try{saved=localStorage.getItem('nx-lang')}catch(e){}
    if(q==='tr'||q==='en'){
      saved=q;
      try{localStorage.setItem('nx-lang',q)}catch(e){}
    }
    var targetLang=saved;
    if(!targetLang){
      var navLangs=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language]).filter(Boolean);
      var isTr=false;
      for(var i=0;i<navLangs.length;i++){
        var code=String(navLangs[i]).toLowerCase().split('-')[0].split('_')[0];
        if(code==='tr'){isTr=true;break;}
      }
      targetLang=isTr?'tr':'en';
    }
    if(targetLang==='tr'&&!isTrPage){
      var rel=p;
      while(rel.charAt(0)==='/')rel=rel.slice(1);
      if(rel==='index.html')rel='';
      L.replace('/tr/'+rel+L.search+L.hash);
    }else if(targetLang==='en'&&isTrPage){
      var rel=p.slice(3);
      while(rel.charAt(0)==='/')rel=rel.slice(1);
      if(rel==='index.html')rel='';
      L.replace('/'+rel+L.search+L.hash);
    }
  }catch(e){}
})();`.trim();
}

function renderLanding(c, hasShots) {
  return `<!DOCTYPE html>
<html lang="${c.htmlLang}" data-theme="light">
<head>
${baseHead(c, c.lang === 'tr' ? '/tr/' : '/')}
<style>${CSS}</style>
<script src="/assets/site-boot.js"></script>
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
${renderContactModal(c)}
${renderAuthModal(c)}
<script src="/assets/site.js"></script>
</body>
</html>`;
}

function renderAbout(c) {
  const isTr = c.lang === 'tr';
  const path = isTr ? '/tr/about.html' : '/about.html';
  const ab = c.about;
  return `<!DOCTYPE html>
<html lang="${c.htmlLang}" data-theme="light">
<head>
${baseHead(c, path)}
<style>${CSS}</style>
<script src="/assets/site-boot.js"></script>
</head>
<body>
${renderHeader(c, path)}
<main class="wrap" style="padding-bottom:60px">
  <div class="about-hero rv">
    <a class="int-more" href="${c.canonical}" style="margin-bottom:12px">${icon('arrow', 'icon')} ${isTr ? 'Ana sayfaya dön' : 'Back to home'}</a>
    <h1>${esc(ab.title)}</h1>
    <p class="lead">${esc(ab.lead)}</p>
  </div>

  <div class="about-card rv" style="margin:24px 0 32px">
    <h2 style="font-size:22px;margin:0 0 12px;font-weight:800;letter-spacing:-.02em">${esc(ab.manifesto.heading)}</h2>
    <p style="font-size:15px;line-height:1.75;color:var(--text-2);margin:0">${esc(ab.manifesto.text)}</p>
  </div>

  <div style="margin:32px 0 16px">
    <h2 style="font-size:22px;font-weight:800;letter-spacing:-.02em;margin:0 0 8px">${isTr ? 'Dört Temel İlkemiz' : 'Our Four Core Pillars'}</h2>
    <p style="color:var(--muted);font-size:14.5px;margin:0 0 20px">${isTr ? 'NEXUS mimarisini şekillendiren tavizsiz mühendislik kuralları.' : 'The uncompromising engineering principles behind NEXUS.'}</p>
    <div class="grid c2" style="gap:16px">
      ${ab.pillars.map((p, i) => `
        <div class="card rv" style="padding:24px">
          <div class="f-ic">${icon(i === 0 ? 'zap' : i === 1 ? 'shield' : i === 2 ? 'globe' : 'sparkles')}</div>
          <h3 style="font-size:17px;font-weight:700;margin:0 0 8px">${esc(p.title)}</h3>
          <p style="font-size:14px;line-height:1.6;color:var(--text-2);margin:0">${esc(p.desc)}</p>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="about-card rv" style="margin:32px 0;background:color-mix(in srgb,var(--brand) 6%,var(--surface))">
    <h2 style="font-size:20px;margin:0 0 10px;font-weight:800">${esc(ab.architecture.heading)}</h2>
    <p style="font-size:14.5px;line-height:1.65;color:var(--text-2);margin:0 0 18px">${esc(ab.architecture.lead)}</p>
    <div style="display:flex;flex-wrap:wrap;gap:12px">
      <a href="${c.canonical}#downloads" class="btn btn-primary btn-sm">${isTr ? 'Uygulamayı İndir' : 'Download Apps'}</a>
      <a href="${c.canonical}#features" class="btn btn-outline btn-sm">${isTr ? 'Tüm Özellikleri İncele' : 'Explore Features'}</a>
    </div>
  </div>
</main>
${renderFooter(c)}
${renderContactModal(c)}
${renderAuthModal(c)}
<script src="/assets/site.js"></script>
</body>
</html>`;
}

function renderLegalDoc(c, slug, doc) {
  const isTr = c.lang === 'tr';
  const path = isTr ? `/tr/${slug}.html` : `/${slug}.html`;
  const canonicalUrl = `https://nexus-smarthome.pages.dev${isTr ? '/tr/' + slug : '/' + slug}`;
  const enUrl = `https://nexus-smarthome.pages.dev/${slug}`;
  const trUrl = `https://nexus-smarthome.pages.dev/tr/${slug}`;

  return `<!DOCTYPE html>
<html lang="${c.htmlLang}" data-theme="light">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(doc.title)} — NEXUS</title>
<meta name="description" content="${esc(doc.title)} — NEXUS smart home"/>
<link rel="canonical" href="${canonicalUrl}"/>
<link rel="alternate" hreflang="en" href="${enUrl}"/>
<link rel="alternate" hreflang="tr" href="${trUrl}"/>
<link rel="alternate" hreflang="x-default" href="${enUrl}"/>
<link rel="icon" href="/icon.svg" type="image/svg+xml"/>
<link rel="manifest" href="/manifest.webmanifest"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="NEXUS"/>
<meta property="og:title" content="${esc(doc.title)} — NEXUS"/>
<meta property="og:description" content="${esc(doc.title)} — NEXUS smart home"/>
<meta property="og:url" content="${canonicalUrl}"/>
<meta property="og:image" content="https://nexus-smarthome.pages.dev/og-cover.png"/>
<meta name="twitter:card" content="summary_large_image"/>
<link href="/fonts/inter/inter.css" rel="stylesheet"/>
<style>${CSS}</style>
<script src="/assets/site-boot.js"></script>
</head>
<body>
${renderHeader(c, path)}
<main class="wrap">
  <div class="doc-hero rv">
    <a class="int-more" href="${c.canonical}" style="margin-bottom:12px">${icon('arrow', 'icon')} ${isTr ? 'Ana sayfaya dön' : 'Back to home'}</a>
    <h1>${esc(doc.title)}</h1>
  </div>
  <div class="doc-body rv">
    ${doc.body}
  </div>
</main>
${renderFooter(c)}
${renderContactModal(c)}
${renderAuthModal(c)}
<script src="/assets/site.js"></script>
</body>
</html>`;
}

function renderLightRedirect(tr) {
  const target = tr ? '/tr/' : '/';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta http-equiv="refresh" content="0;url=${target}"/><script>location.replace('${target}');</script></head><body></body></html>`;
}

// ---------- Build Yürütme ----------
function build() {
  const hasShots = existsSync(join(PUB, 'images', 'shots', 'home.png'));

  mkdirSync(join(PUB, 'assets'), { recursive: true });
  mkdirSync(join(PUB, 'tr'), { recursive: true });
  mkdirSync(join(PUB, 'fonts', 'inter'), { recursive: true });

  if (existsSync(join(ROOT, 'fonts', 'inter', 'inter.css'))) {
    cpSync(join(ROOT, 'fonts', 'inter'), join(PUB, 'fonts', 'inter'), { recursive: true });
  }

  writeFileSync(join(PUB, 'assets', 'site.js'), pageJs(), 'utf8');
  writeFileSync(join(PUB, 'assets', 'site-boot.js'), bootJs(), 'utf8');

  writeFileSync(join(PUB, 'index.html'), renderLanding(content.en, hasShots), 'utf8');
  writeFileSync(join(PUB, 'tr', 'index.html'), renderLanding(content.tr, hasShots), 'utf8');
  writeFileSync(join(PUB, 'about.html'), renderAbout(content.en), 'utf8');
  writeFileSync(join(PUB, 'tr', 'about.html'), renderAbout(content.tr), 'utf8');

  // Yasal Sayfalar (Yeni Tasarım & Tipografi)
  writeFileSync(join(PUB, 'privacy.html'), renderLegalDoc(content.en, 'privacy', LEGAL_DOCS.privacyEn), 'utf8');
  writeFileSync(join(PUB, 'tr', 'privacy.html'), renderLegalDoc(content.tr, 'privacy', LEGAL_DOCS.privacyTr), 'utf8');
  writeFileSync(join(PUB, 'terms.html'), renderLegalDoc(content.en, 'terms', LEGAL_DOCS.termsEn), 'utf8');
  writeFileSync(join(PUB, 'tr', 'terms.html'), renderLegalDoc(content.tr, 'terms', LEGAL_DOCS.termsTr), 'utf8');
  writeFileSync(join(PUB, 'refund.html'), renderLegalDoc(content.en, 'refund', LEGAL_DOCS.refundEn), 'utf8');
  writeFileSync(join(PUB, 'tr', 'refund.html'), renderLegalDoc(content.tr, 'refund', LEGAL_DOCS.refundTr), 'utf8');

  writeFileSync(join(PUB, 'light.html'), renderLightRedirect(false), 'utf8');
  writeFileSync(join(PUB, 'tr', 'light.html'), renderLightRedirect(true), 'utf8');

  console.log('✓ index.html');
  console.log('✓ tr/index.html');
  console.log('✓ about.html');
  console.log('✓ tr/about.html');
  console.log('✓ privacy.html & tr/privacy.html');
  console.log('✓ terms.html & tr/terms.html');
  console.log('✓ refund.html & tr/refund.html');
  console.log('✓ assets/site.js');
  console.log('✓ assets/site-boot.js');
  console.log('Ekran görüntüleri:', hasShots ? 'VAR (images/shots/)' : 'YOK');
}

build();
