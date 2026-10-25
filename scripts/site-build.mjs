import { mkdirSync, writeFileSync, existsSync, cpSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { content, brand, priceFor, PRICES, CHECKOUT_URLS, APP_URL } from './site-content.mjs';
import { LEGAL_DOCS } from './site-legal-content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'www', 'public');

/* --- Yıllık indirim oranı ---
   Eskiden her yerde elle "%33" yazıyordu; USD planında gerçek oran %37. Artık
   tek kaynak PRICES (cloud-sync.js ile birebir; packages/core/site-pricing.test.ts
   denetliyor) ve oran oradan hesaplanıyor. */
const priceNum = (v) => {
  const s = String(v).replace(/[^\d.,]/g, '');
  return s.includes(',') ? parseFloat(s.replace(/\./g, '').replace(',', '.')) : parseFloat(s);
};
const savePct = (cur) =>
  Math.round((1 - priceNum(PRICES[cur].yearly) / (priceNum(PRICES[cur].monthly) * 12)) * 100);
const SAVE = { TRY: savePct('TRY'), USD: savePct('USD') };

/* --- Sürüm rozetinin yedek değeri ---
   Kartlardaki sürüm canlıda api.github.com'dan geliyor; ziyaretçi IP'si hız sınırına
   takılırsa (60 istek/saat — ölçüldü) istek düşüyor ve HTML'deki değer görünüyor.
   Eskiden "v1.0.14" elle yazılıydı ve bayatlıyordu; artık masaüstü paketinin
   sürümünden (desktop/package.json) üretiliyor. */
const APP_VERSION = (() => {
  try {
    return 'v' + JSON.parse(readFileSync(join(ROOT, 'desktop', 'package.json'), 'utf8')).version;
  } catch {
    return 'v1.0.0';
  }
})();

/* --- Bulut yapılandırması: cloud-config.js gitignore'da, değerler depoya girmemeli ---
   Projemin URL'i ve anonim anahtarı eskiden üretilen site.js içine üç kez GÖMÜLÜYORDU ve
   www/public takipte olduğu için anahtar deponun kendisine girmişti. Artık build, anahtarı
   ayrı ve TAKİP EDİLMEYEN bir dosyaya (www/public/assets/cloud-config.js) yazıyor; site.js
   onu yalnızca çalışma zamanında window.NEXUS_CLOUD üzerinden okuyor. CI'da değerler
   ortamdan gelir (NEXUS_SUPABASE_URL / NEXUS_SUPABASE_ANON_KEY); dosya yoksa giriş
   modalları ağa gitmek yerine dürüstçe "kullanımda değil" diyor. */
const CLOUD = (() => {
  const env = { url: (process.env.NEXUS_SUPABASE_URL || '').trim(), anonKey: (process.env.NEXUS_SUPABASE_ANON_KEY || '').trim() };
  try {
    const src = readFileSync(join(ROOT, 'cloud-config.js'), 'utf8');
    const url = (src.match(/url:\s*"(https:\/\/[^"]+)"/) || [])[1] || '';
    const anonKey = (src.match(/anonKey:\s*"([^"]+)"/) || [])[1] || '';
    if (url && anonKey) return { url, anonKey };
  } catch {
    /* yerel dosya yok: CI'da ortam değişkenleri kullanılır */
  }
  return env;
})();

/* --- Cihaz matrisi: sitedeki "çalışır" listesi uygulamayla aynı kaynaktan ---
   Elle yazılan marka listesi zamanla uygulamadan saptı (HomeKit, Sonoff, WiZ, LIFX,
   Govee, Matter, Zigbee hiç yokken vaat ediliyordu). Artık supported-devices.js üretir. */
const DEVICE_MATRIX = (() => {
  try {
    const win = {};
    new Function('window', readFileSync(join(ROOT, 'supported-devices.js'), 'utf8'))(win);
    return win.NEXUS_SUPPORTED_DEVICES || [];
  } catch {
    return [];
  }
})();

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
    zap: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    gauge: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m12 14 4-4"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>`,
    wifi: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>`,
    layers: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m22 12.5-9.4 4.3a1.4 1.4 0 0 1-1.2 0L2 12.5"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m22 17.5-9.4 4.3a1.4 1.4 0 0 1-1.2 0L2 17.5"/></svg>`,
    eye: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    eyeOff: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/></svg>`,
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
html{
  scrollbar-gutter: stable;
}
@supports not (scrollbar-gutter: stable){
  html{overflow-y:scroll}
}
html.nx-modal-open,
html.nx-modal-open body{
  overflow:hidden !important;
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

/* Telefon Cam Parıltısı — taşmayı engellemek için kadrajın içinde kalır (ölçüldü:
   left:-50%/width:200% olan sürüm 390px'te belgeyi yatay kaydırıyordu). */
.phone-glass-shine{
  position:absolute;top:0;left:0;width:100%;height:100%;
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
  display:flex;align-items:center;gap:2px;
}
/* Dokunma alanı GERÇEKTEN 28px: noktanın kendisi 6px çizilir (::before), düğmenin
   kutusu 28px. Eskiden 6px kutuya ::after ile 30px sahte alan eklenmişti; komşu
   noktaların alanları üst üste bindiği için parmak yanlış ekrana basıyordu (ölçüldü). */
.phone-dot{
  width:28px;height:28px;border-radius:999px;background:transparent;border:0;padding:0;
  display:grid;place-items:center;cursor:pointer;
}
.phone-dot::before{
  content:'';display:block;width:6px;height:6px;border-radius:999px;background:var(--border);
  transition:all .25s ease;
}
.phone-dot.active::before{
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
.f-ic svg{width:24px;height:24px}
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
.int-more{margin-top:22px;display:inline-flex;align-items:center;gap:8px;min-height:44px;color:var(--brand);font:700 14px Inter,sans-serif;background:none;border:none;padding:10px 4px;cursor:pointer;transition:color .18s ease}
.int-more:hover{color:var(--brand-press);text-decoration:underline}
/* Entegrasyon uyarısı: doğrudan bağlayıcısı olmayan markaların gerçek koşulunu söyler. */
.int-note{margin:22px 0 0;padding:16px 18px;border-radius:var(--radius-lg);border:1px dashed color-mix(in srgb,var(--brand) 35%,var(--border));
  background:color-mix(in srgb,var(--brand) 5%,var(--surface));color:var(--muted);font-size:13.5px;line-height:1.6}

/* Fiyatlar */
#pricing{scroll-margin-top:80px;padding:48px 0 54px}
.billing-toggle-wrap{display:flex;align-items:center;justify-content:center;margin:0 0 24px}
.billing-toggle{display:inline-flex;align-items:center;background:var(--surface);border:1px solid var(--border);
  border-radius:999px;padding:4px;box-shadow:var(--shadow)}
.billing-btn{border:0;background:transparent;color:var(--muted);font:700 13px/1 Inter,sans-serif;
  padding:8px 16px;border-radius:999px;cursor:pointer;transition:all .18s ease;display:inline-flex;align-items:center;gap:6px}
.billing-btn.active{background:var(--brand-grad);color:#fff;box-shadow:0 4px 14px rgba(76,125,255,.35)}
.save-badge{font-size:11px;font-weight:800;background:rgba(255,255,255,.25);padding:3px 7px;border-radius:99px}
.billing-btn:not(.active) .save-badge{background:color-mix(in srgb,var(--brand) 15%,transparent);color:var(--brand)}

.plans{display:grid;gap:18px;width:100%;max-width:1100px;margin:22px auto 0}
@media(min-width:960px){.plans{grid-template-columns:repeat(3,1fr);align-items:stretch}}
@media(max-width:959px){.plans{grid-template-columns:1fr;max-width:440px;margin:22px auto 0}}
.plan{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:24px 20px 20px;box-shadow:var(--shadow);display:flex;flex-direction:column;height:100%;
  box-sizing:border-box;transition:transform .25s ease,box-shadow .25s ease}
.plan:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.plan.hot{border:2px solid var(--brand);box-shadow:0 20px 50px rgba(76,125,255,.18)}
.plan-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--brand-grad);color:#fff;font-size:10.5px;font-weight:800;
  letter-spacing:.06em;text-transform:uppercase;padding:4px 12px;border-radius:999px;box-shadow:0 4px 12px rgba(76,125,255,.35);white-space:nowrap}
.plan-head{min-height:auto;margin-bottom:6px;display:flex;flex-direction:column;justify-content:flex-start}
.plan h3{margin:0 0 6px;font-size:17.5px;font-weight:800}
.price{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.1}
.price small{font-size:13px;font-weight:600;color:var(--muted);letter-spacing:0}
.price-note{color:var(--muted);font-size:12px;margin:4px 0 0}
.plan ul{list-style:none;margin:14px 0 16px;padding:0;display:grid;gap:7px;flex:1;align-content:start}
.plan li{display:flex;align-items:flex-start;gap:8px;font-size:12.5px;color:var(--text-2);line-height:1.35}
.plan li .icon{width:15px;height:15px;color:#10B981;margin-top:2px;flex-shrink:0}
.plan .btn{width:100%;margin-top:auto;min-height:42px;height:42px;font-size:13.5px;border-radius:12px}
.cur-note{font-size:12px;color:var(--muted);margin-top:14px;text-align:center}

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
.ft-grid{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:40px}
.ft-brand{max-width:390px;flex:1 1 300px}
.ft-links-group{display:flex;flex-wrap:wrap;gap:48px;align-items:flex-start}
.ft-col{min-width:145px}
.ft h4{margin:0 0 14px;font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
.ft a{display:block;font-size:14px;color:var(--text-2);padding:5px 0;transition:color .15s ease}
.ft a:hover{color:var(--brand)}
.ft a.logo{display:inline-flex !important;align-items:center !important;gap:10px !important;font-size:20px !important;
  font-weight:800 !important;color:var(--text) !important;padding:0 !important;text-decoration:none !important}
.ft a.logo svg{width:32px !important;height:32px !important;flex-shrink:0 !important}
.ft-brand p{color:var(--muted);font-size:13.5px;margin:12px 0 16px;max-width:44ch;line-height:1.6}
.ft-pills{display:flex;flex-wrap:wrap;gap:8px}
.ft-pill{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:var(--text-2);background:var(--surface-2);border:1px solid var(--border);padding:4px 10px;border-radius:999px}
.ft-pill svg{width:13px;height:13px;color:var(--brand)}
.ft-bottom{margin-top:36px;padding-top:20px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:14px;
  justify-content:space-between;align-items:center;color:var(--muted);font-size:13px}
.ft-privacy{display:inline-flex;align-items:center;gap:8px;font-weight:600;text-align:left}
.ft-privacy .icon{width:16px;height:16px;color:var(--brand);flex-shrink:0;margin:0}
@media(max-width:768px){
  .ft-grid{flex-direction:column;gap:32px}
  .ft-links-group{display:grid;grid-template-columns:repeat(2,1fr);gap:28px;width:100%}
}
@media(max-width:480px){
  .ft-links-group{grid-template-columns:1fr;gap:22px}
  .ft-bottom{flex-direction:column;align-items:flex-start;gap:12px}
}

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
  position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  z-index:9999;display:none;align-items:center;justify-content:center;padding:20px 16px;opacity:0;transition:opacity .22s ease;
  overflow-y:auto;-webkit-overflow-scrolling:touch;
}
.nx-modal-backdrop.open{display:flex;opacity:1}
.nx-modal-card{
  background:var(--surface);border:1px solid var(--border);border-radius:24px;box-shadow:0 24px 64px -12px rgba(0,0,0,.55);
  width:100%;max-width:440px;padding:22px 24px 20px;position:relative;
  transform:scale(.96);transition:transform .22s cubic-bezier(.16,1,.3,1);box-sizing:border-box;margin:auto;
}
.nx-modal-backdrop.open .nx-modal-card{transform:scale(1)}
.nx-modal-close{
  position:absolute;top:14px;right:14px;background:var(--surface-2);border:1px solid var(--border);
  color:var(--muted);width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .18s ease;font-size:18px;line-height:1;padding:0;z-index:10;
}
.nx-modal-close:hover{color:var(--text);border-color:var(--text-2);transform:scale(1.05)}

/* Modal İçi Yardımcılar */
.w-full{width:100% !important;box-sizing:border-box !important}
.text-emerald{color:#10B981}

/* Telefon Ön İzleme Gezinme Okları */
.phone-arrow{
  position:absolute;top:50%;transform:translateY(-50%);z-index:45;
  width:34px;height:34px;border-radius:50%;background:rgba(20,22,28,.88);
  border:1.5px solid rgba(255,255,255,.2);color:#fff;display:flex;align-items:center;
  justify-content:center;cursor:pointer;backdrop-filter:blur(6px);box-shadow:0 4px 14px rgba(0,0,0,.45);
  transition:all .18s ease;padding:0;
}
.phone-arrow:hover{background:var(--brand);border-color:var(--brand);transform:translateY(-50%) scale(1.08)}
.phone-arrow svg{width:18px;height:18px}
.phone-arrow-left{left:-16px}
.phone-arrow-right{right:-16px}
@media(max-width:480px){
  .phone-arrow-left{left:-10px}
  .phone-arrow-right{right:-10px}
}

/* Navbar Giriş / Hesap Butonu & Avatar */
.nx-auth-btn{
  display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;padding:5px 14px 5px 8px;
  border-radius:999px;border:1px solid var(--border);background:var(--surface);color:var(--text);
  cursor:pointer;transition:all .18s ease;height:38px;box-sizing:border-box;
}
.nx-auth-btn:hover{border-color:var(--brand);color:var(--brand);background:var(--surface-2)}
.nx-auth-btn.logged-in{
  border-color:color-mix(in srgb,var(--brand) 45%,transparent);color:var(--text);
  background:color-mix(in srgb,var(--brand) 10%,var(--surface));padding:4px 14px 4px 6px;
}
.nx-nav-label{
  max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;
  vertical-align:middle;line-height:1.2;
}
.nx-nav-avatar{
  width:26px;height:26px;border-radius:50%;background:var(--brand-grad);color:#fff;
  display:inline-flex;align-items:center;justify-content:center;
  flex-shrink:0;box-shadow:0 2px 6px rgba(76,125,255,.35);position:relative;overflow:visible;
}
.nx-nav-avatar .nx-avatar-photo{
  width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;
}
.nx-nav-avatar .nx-user-icon{
  width:15px;height:15px;color:#fff;display:block;
}
.nx-nav-avatar .dot-online{
  position:absolute;bottom:-1px;right:-1px;width:7px;height:7px;border-radius:50%;background:#10B981;
  border:1.5px solid var(--surface);box-shadow:0 0 4px #10B981;z-index:2;
}

/* Auth Modal & Profile - Mobil & Masaüstü Uygulama ile 1:1 Uyumlu */
.nx-auth-brand-badge{display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:12px}
.nx-app-logo{width:40px;height:40px;margin-bottom:6px;filter:drop-shadow(0 4px 12px rgba(76,125,255,.3))}
.nx-app-logo svg{width:100%;height:100%}
.nx-auth-brand-badge h3{font-size:19px;font-weight:800;letter-spacing:-.02em;margin:0 0 3px;color:var(--text)}
.nx-auth-brand-badge p{font-size:12.5px;color:var(--muted);margin:0;max-width:32ch;line-height:1.4}

.nx-auth-field-wrap{margin-bottom:8px;position:relative}
.nx-field-label{font-size:11px;font-weight:700;color:var(--muted);letter-spacing:.02em;margin-bottom:2px;display:block}
.nx-app-input{
  width:100% !important;height:40px;box-sizing:border-box;background:var(--surface-2);border:1px solid var(--border);
  border-radius:12px;padding:0 14px;font:500 13.5px Inter,sans-serif;color:var(--text);outline:none;
  transition:all .2s ease;
}
.nx-app-input:focus{
  border-color:var(--brand);background:var(--surface);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 22%,transparent);
}
.nx-app-select{cursor:pointer;padding-right:28px}
.nx-app-textarea{height:auto;min-height:56px;padding:8px 12px;resize:vertical}
.nx-pw-toggle{
  position:absolute;top:50%;right:10px;transform:translateY(-50%);background:none;border:none;color:var(--muted);
  cursor:pointer;padding:6px;display:flex;align-items:center;justify-content:center;transition:color .18s;
}
.nx-pw-toggle:hover{color:var(--text)}
.nx-pw-toggle svg{width:16px;height:16px}

.nx-app-submit{
  width:100% !important;box-sizing:border-box !important;height:42px;border-radius:12px;font-size:14px;font-weight:700;
  display:flex !important;align-items:center;justify-content:center;cursor:pointer;border:0;transition:all .2s ease;
  margin-top:6px;gap:8px;box-shadow:0 4px 14px rgba(76,125,255,.35);background:var(--brand-grad);color:#fff;
}
.nx-app-submit:hover{opacity:.92;transform:translateY(-1px)}
.nx-app-submit:active{transform:translateY(0)}
.nx-app-submit:disabled{opacity:.6;cursor:not-allowed}

.nx-google-btn{
  width:100% !important;box-sizing:border-box !important;height:40px;background:var(--surface);border:1px solid var(--border);border-radius:12px;
  font:700 13px Inter,sans-serif;color:var(--text-2);cursor:pointer;display:inline-flex;align-items:center;
  justify-content:center;gap:8px;margin-top:7px;box-shadow:0 2px 6px rgba(0,0,0,.04);transition:all .2s ease;
}
.nx-google-btn:hover{background:var(--surface-2);border-color:var(--brand);color:var(--text);transform:translateY(-1px)}
.nx-auth-links{display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:12px;text-align:center}
.nx-auth-link{
  background:none;border:none;font:600 12.5px Inter,sans-serif;color:var(--brand);cursor:pointer;padding:2px;
  transition:all .18s;text-decoration:none;
}
.nx-auth-link:hover{text-decoration:underline;color:var(--brand-press)}
.nx-auth-link.muted{color:var(--muted);font-weight:500;font-size:12px}
.nx-auth-link.muted:hover{color:var(--text-2)}

.nx-auth-alert{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:#ef4444;font-size:12px;padding:8px 12px;border-radius:10px;margin-bottom:10px;line-height:1.4}

/* Profil & Gelişmiş Hesap Ayarları Görünümü */
.nx-profile-header{
  display:flex;align-items:center;gap:12px;margin-bottom:12px;background:var(--surface-2);border:1px solid var(--border);
  padding:12px 14px;border-radius:16px;
}
.nx-profile-avatar-large{
  width:52px;height:52px;border-radius:50%;background:var(--brand-grad);color:#fff;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;box-shadow:0 4px 14px rgba(76,125,255,.35);position:relative;overflow:visible;
}
.nx-profile-avatar-large .nx-avatar-photo{
  width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;
}
.nx-profile-avatar-large .nx-user-icon{
  width:30px;height:30px;color:#fff;display:block;
}
.nx-avatar-status-dot{
  position:absolute;bottom:0;right:0;width:11px;height:11px;border-radius:50%;background:#10B981;
  border:2px solid var(--surface-2);box-shadow:0 0 6px #10B981;z-index:2;
}
.nx-profile-name-wrap{flex:1;min-width:0}
.nx-profile-name-row{display:flex;align-items:center;gap:6px}
.nx-profile-name-row h3{margin:0;font-size:16px;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nx-edit-name-btn{
  background:none;border:none;color:var(--muted);cursor:pointer;padding:3px;display:flex;align-items:center;
  border-radius:6px;transition:all .15s ease;
}
.nx-edit-name-btn:hover{color:var(--brand);background:var(--surface)}
.nx-edit-name-btn svg{width:13px;height:13px}
.nx-profile-email-chip{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;margin-top:1px}

.nx-profile-grid{display:grid;gap:8px;margin-bottom:12px}
.nx-profile-card{
  background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:10px 12px;
}
.nx-profile-card-head{display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px}
.nx-plan-tag{
  background:var(--brand-grad);color:#fff;font-size:10px;font-weight:800;padding:2px 7px;border-radius:99px;
}
.nx-profile-card-sub{margin:0 0 8px;font-size:12.5px;font-weight:700;color:var(--text)}
.nx-profile-card-actions{display:flex;gap:6px;flex-wrap:wrap}
.btn-xs{padding:5px 11px;font-size:11.5px;font-weight:700;border-radius:999px;text-decoration:none;display:inline-flex;align-items:center;gap:4px}
.nx-status-pill{font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:99px}
.nx-status-pill.online{background:rgba(16,185,129,.12);color:#10B981;border:1px solid rgba(16,185,129,.3)}
.nx-profile-kv{display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-top:4px}
.nx-profile-kv small{color:var(--muted)}
.nx-profile-kv b{color:var(--text);font-weight:600}

.nx-profile-footer-actions{display:grid;gap:6px}
.nx-profile-link-btn{
  background:none;border:1px solid var(--border);border-radius:12px;color:var(--text-2);
  font:600 12px Inter,sans-serif;padding:7px 12px;cursor:pointer;display:inline-flex;align-items:center;
  justify-content:center;gap:6px;transition:all .18s ease;
}
.nx-profile-link-btn:hover{background:var(--surface-2);border-color:var(--brand);color:var(--brand)}
.nx-profile-link-btn svg{width:14px;height:14px}
.nx-contact-security-note{
  font-size:11px;color:var(--muted);margin:8px 0 0;text-align:center;display:flex;align-items:center;
  justify-content:center;gap:5px;
}
.nx-contact-security-note svg{width:12px;height:12px;color:var(--brand);flex-shrink:0}

/* Özel NEXUS Dialog (Alert / Prompt) */
.nx-dialog-backdrop{
  position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  z-index:10050;display:none;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .2s ease;
}
.nx-dialog-backdrop.open{display:flex;opacity:1}
.nx-dialog-card{
  background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:22px 24px 20px;
  width:100%;max-width:380px;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,.55);
  transform:scale(.95);transition:transform .2s cubic-bezier(.16,1,.3,1);box-sizing:border-box;margin:auto;
}
.nx-dialog-backdrop.open .nx-dialog-card{transform:scale(1)}
.nx-dialog-icon{
  width:46px;height:46px;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;
  background:var(--surface-2);border:1px solid var(--border);color:var(--brand);
}
.nx-dialog-icon.success{background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.3);color:#10B981}
.nx-dialog-icon.warning{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.3);color:#F59E0B}
.nx-dialog-icon.edit{background:color-mix(in srgb,var(--brand) 12%,transparent);border-color:color-mix(in srgb,var(--brand) 30%,transparent);color:var(--brand)}
.nx-dialog-icon svg{width:22px;height:22px}
.nx-dialog-card h3{margin:0 0 6px;font-size:17px;font-weight:800;color:var(--text)}
.nx-dialog-card p{margin:0;font-size:13px;color:var(--text-2);line-height:1.45}
.nx-dialog-actions{display:flex;gap:10px;margin-top:16px}
.nx-dialog-actions .btn{flex:1;min-height:38px;height:38px;font-size:13px;border-radius:10px}

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

// Modal Açıldığında Sayfanın Sağa/Sola Kaymasını Önleyen Kilit
function nxLockScroll(){
  document.documentElement.classList.add('nx-modal-open');
}

function nxUnlockScroll(){
  var anyOpen = document.querySelectorAll('.nx-modal-backdrop.open').length > 0;
  if(!anyOpen){
    document.documentElement.classList.remove('nx-modal-open');
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
  nxLockScroll();
}

function nxCloseContactModal(){
  var m=document.getElementById('nxContactModal');
  if(!m)return;
  m.classList.remove('open');
  setTimeout(function(){
    m.style.display='none';
    nxUnlockScroll();
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
var nxDialogCallback=null;

// Özel NEXUS Dialog (Alert & Prompt) Fonksiyonları
function nxShowAlert(msg, title, type, onOk){
  var isTr=document.documentElement.lang==='tr';
  var dlg=document.getElementById('nxCustomDialog');
  if(!dlg)return;
  var iconEl=document.getElementById('nxDialogIcon');
  var titleEl=document.getElementById('nxDialogTitle');
  var msgEl=document.getElementById('nxDialogMsg');
  var inputWrap=document.getElementById('nxDialogInputWrap');
  var cancelBtn=document.getElementById('nxDialogCancelBtn');
  var confirmBtn=document.getElementById('nxDialogConfirmBtn');

  if(inputWrap)inputWrap.style.display='none';
  if(cancelBtn)cancelBtn.style.display='none';
  if(confirmBtn){
    confirmBtn.textContent = isTr ? 'Anladım' : 'Got it';
    confirmBtn.className = 'btn btn-primary w-full';
  }

  type = type || 'info';
  if(iconEl){
    iconEl.className = 'nx-dialog-icon ' + type;
    if(type==='success'){
      iconEl.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    }else if(type==='warning'){
      iconEl.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>';
    }else{
      iconEl.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>';
    }
  }

  if(titleEl)titleEl.textContent = title || (isTr ? 'Bilgilendirme' : 'Notice');
  if(msgEl)msgEl.textContent = msg || '';

  nxDialogCallback = onOk || null;
  if(confirmBtn){
    confirmBtn.onclick = function(){
      nxCloseDialog();
      if(nxDialogCallback) nxDialogCallback();
    };
  }

  dlg.style.display='flex';
  setTimeout(function(){dlg.classList.add('open')},10);
  nxLockScroll();
}

function nxShowPrompt(title, msg, defaultValue, onConfirm){
  var isTr=document.documentElement.lang==='tr';
  var dlg=document.getElementById('nxCustomDialog');
  if(!dlg)return;
  var iconEl=document.getElementById('nxDialogIcon');
  var titleEl=document.getElementById('nxDialogTitle');
  var msgEl=document.getElementById('nxDialogMsg');
  var inputWrap=document.getElementById('nxDialogInputWrap');
  var input=document.getElementById('nxDialogInput');
  var cancelBtn=document.getElementById('nxDialogCancelBtn');
  var confirmBtn=document.getElementById('nxDialogConfirmBtn');

  if(inputWrap)inputWrap.style.display='block';
  if(input){
    input.value = defaultValue || '';
    setTimeout(function(){ input.focus(); input.select(); }, 100);
  }
  if(cancelBtn){
    cancelBtn.style.display='inline-flex';
    cancelBtn.textContent = isTr ? 'İptal' : 'Cancel';
  }
  if(confirmBtn){
    confirmBtn.textContent = isTr ? 'Kaydet' : 'Save';
    confirmBtn.className = 'btn btn-primary';
  }

  if(iconEl){
    iconEl.className = 'nx-dialog-icon edit';
    iconEl.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';
  }

  if(titleEl)titleEl.textContent = title || '';
  if(msgEl)msgEl.textContent = msg || '';

  nxDialogCallback = onConfirm || null;
  if(confirmBtn){
    confirmBtn.onclick = function(){
      var val = input ? input.value.trim() : '';
      nxCloseDialog();
      if(nxDialogCallback) nxDialogCallback(val);
    };
  }

  dlg.style.display='flex';
  setTimeout(function(){dlg.classList.add('open')},10);
  nxLockScroll();
}

function nxCloseDialog(){
  var dlg=document.getElementById('nxCustomDialog');
  if(!dlg)return;
  dlg.classList.remove('open');
  setTimeout(function(){
    dlg.style.display='none';
    nxUnlockScroll();
  },200);
}

// Avatar ve Kullanıcı Rozeti Yardımcısı (Fotoğraf Varsa Fotoğraf, Yoksa Modern Standart İkon)
var nxUserSvgIcon = '<svg viewBox="0 0 24 24" class="nx-user-icon" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';

function nxGetAvatarHtml(isLarge){
  var avatarUrl = null;
  try{ avatarUrl = localStorage.getItem('nexusUserAvatar'); }catch(e){}
  if(avatarUrl){
    /* DIKKAT: bu satirlar pageJs() icindeki sabit metin (template literal) icinde
       yaziliyor; tek tirnak kacisi iki kere kacislanmali (\\'). Tek kere yazilinca
       uretilen site.js'te syntax hatasi olusuyor ve sitedeki TUM JavaScript oliyordu
       (olculdu: canli nexus-smarthome.pages.dev/assets/site.js "Unexpected string"). */
    return '<img src="' + avatarUrl + '" alt="Avatar" class="nx-avatar-photo" onerror="this.outerHTML=\\'' + nxUserSvgIcon.replace(/"/g, '&quot;') + '\\';">';
  }
  return nxUserSvgIcon;
}

function nxUpdateNavAuth(){
  var user=null;
  try{user=localStorage.getItem('nexusCurrentUser');}catch(e){}
  var btn=document.getElementById('nxNavAuthBtn');
  var label=document.getElementById('nxNavAuthLabel');
  var avatarWrap=document.getElementById('nxNavAuthAvatar');
  if(!btn||!label)return;
  var isTr=document.documentElement.lang==='tr';
  if(user){
    btn.classList.add('logged-in');
    var customName=null;
    try{customName=localStorage.getItem('nexusUserName');}catch(e){}
    var displayName = customName || user.split('@')[0];
    label.textContent = displayName;
    label.title = displayName + ' (' + user + ')';
    if(avatarWrap){
      avatarWrap.innerHTML='<div class="nx-nav-avatar">' + nxGetAvatarHtml(false) + '<span class="dot-online"></span></div>';
    }
  }else{
    btn.classList.remove('logged-in');
    label.textContent = isTr ? 'Giriş Yap' : 'Sign In';
    label.title = '';
    if(avatarWrap){
      avatarWrap.innerHTML='<svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0-8 0 4 4 0 0 0 8 0"/></svg>';
    }
  }
}

function nxOpenAuthModal(){
  var m=document.getElementById('nxAuthModal');
  if(!m)return;
  var user=null;
  try{user=localStorage.getItem('nexusCurrentUser');}catch(e){}
  var formView=document.getElementById('nxAuthFormView');
  var profileView=document.getElementById('nxAuthProfileView');
  var isTr=document.documentElement.lang==='tr';

  if(user){
    if(formView)formView.style.display='none';
    if(profileView)profileView.style.display='block';
    var customName=null;
    try{customName=localStorage.getItem('nexusUserName');}catch(e){}
    var displayName = customName || user.split('@')[0];
    
    var avatarWrap=document.getElementById('nxProfileAvatarWrap');
    var nameEl=document.getElementById('nxProfileNameDisplay');
    var emailEl=document.getElementById('nxProfileEmail');
    if(avatarWrap){
      avatarWrap.innerHTML = nxGetAvatarHtml(true) + '<span class="nx-avatar-status-dot"></span>';
    }
    if(nameEl)nameEl.textContent = displayName;
    if(emailEl)emailEl.textContent = user;
    
    var plusActive = false;
    try{plusActive = localStorage.getItem('nexusPlusActive')==='true';}catch(e){}
    var planTag=document.getElementById('nxProfilePlanTag');
    var planDesc=document.getElementById('nxProfilePlanDesc');
    if(planTag)planTag.textContent = plusActive ? 'NEXUS+ Pro' : (isTr ? 'Ücretsiz' : 'Free');
    if(planDesc)planDesc.textContent = plusActive ? (isTr ? 'Aktif NEXUS+ Aboneliği (Sınırsız AI)' : 'Active NEXUS+ Pro (Unlimited AI)') : (isTr ? 'Temel Plan (Cihaz/Oda Sınırı Yok)' : 'Starter Plan (No device limits)');
  }else{
    if(formView)formView.style.display='block';
    if(profileView)profileView.style.display='none';
    var alertEl=document.getElementById('nxAuthAlert');
    if(alertEl)alertEl.style.display='none';
  }

  m.style.display='flex';
  setTimeout(function(){m.classList.add('open')},10);
  nxLockScroll();
}

function nxEditProfileName(){
  var isTr=document.documentElement.lang==='tr';
  var curName='';
  try{curName=localStorage.getItem('nexusUserName')||'';}catch(e){}
  nxShowPrompt(
    isTr ? 'İsmi Düzenle' : 'Edit Display Name',
    isTr ? 'Hesabınız için görünecek yeni bir isim girin:' : 'Enter your new display name:',
    curName,
    function(newName){
      if(!newName)return;
      try{localStorage.setItem('nexusUserName', newName);}catch(e){}
      nxUpdateNavAuth();
      nxOpenAuthModal();
    }
  );
}

// cloud-config.js CI'da üretilir; değer yoksa ağa gitmek yerine nedeni söylenir.
/* Bulut adresi + anonim anahtar build çıktısına gömülmez; sayfa /assets/cloud-config.js
   üzerinden gelir (gitignore'dur, CI/site yayınıda üretilir). Yoksa auth 'unavailable' der. */
function nxCloudConfig(){
  var c = (typeof window !== 'undefined' && window.NEXUS_CLOUD) || {};
  return { url: c.url || '', anonKey: c.anonKey || '' };
}
function nxAuthUnavailableMsg(){
  var isTr=document.documentElement.lang==='tr';
  return isTr?'Hesap işlemleri bu sürümde kapalı (bulut yapılandırması yok). Uygulamayı indirip oradan giriş yapabilirsin.':'Account actions are off in this build (no cloud config). Download the app and sign in there.';
}
function nxAuthUnavailable(){
  var isTr=document.documentElement.lang==='tr';
  nxShowAlert(nxAuthUnavailableMsg(),isTr?'Kullanımda değil':'Not available','warning');
}

function nxSendPasswordReset(){
  var isTr=document.documentElement.lang==='tr';
  var user=null;
  try{user=localStorage.getItem('nexusCurrentUser');}catch(e){}
  if(!user)return;
  var SUPABASE_URL=nxCloudConfig().url;
  var SUPABASE_KEY=nxCloudConfig().anonKey;
  if(!SUPABASE_URL||!SUPABASE_KEY){nxAuthUnavailable();return;}
  fetch(SUPABASE_URL+'/auth/v1/recover',{
    method:'POST',
    headers:{'apikey':SUPABASE_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({email:user})
  })
  .then(function(){
    nxShowAlert(
      isTr ? 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi ('+user+').' : 'Password reset link sent to your email ('+user+').',
      isTr ? 'Bağlantı Gönderildi' : 'Reset Link Sent',
      'success'
    );
  })
  .catch(function(){
    nxShowAlert(
      isTr ? 'Şifre sıfırlama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.' : 'Could not send reset email. Please try again later.',
      isTr ? 'Hata' : 'Error',
      'warning'
    );
  });
}

function nxCloseAuthModal(){
  var m=document.getElementById('nxAuthModal');
  if(!m)return;
  m.classList.remove('open');
  setTimeout(function(){
    m.style.display='none';
    nxUnlockScroll();
  },250);
}

function nxToggleAuthMode(){
  var isTr=document.documentElement.lang==='tr';
  var title=document.getElementById('nxAuthTitle');
  var sub=document.getElementById('nxAuthSubtitle');
  var submitBtn=document.getElementById('nxAuthSubmitBtn');
  var switchPrompt=document.getElementById('nxAuthSwitchPrompt');
  var alertEl=document.getElementById('nxAuthAlert');
  if(alertEl)alertEl.style.display='none';

  if(nxAuthMode==='login'){
    nxAuthMode='signup';
    if(title)title.textContent=isTr?'Yeni Hesap Oluştur':'Create Account';
    if(sub)sub.textContent=isTr?'Evini tek merkezden yönetmek için hemen ücretsiz kaydol.':'Sign up free to control your home with zero lock-in.';
    if(submitBtn)submitBtn.innerHTML='<span>'+(isTr?'Kayıt Ol':'Sign Up')+'</span>';
    if(switchPrompt)switchPrompt.textContent=isTr?'Zaten hesabınız var mı? Giriş Yap':'Already have an account? Sign In';
  }else{
    nxAuthMode='login';
    if(title)title.textContent=isTr?'Tekrar Hoş Geldin':'Welcome Back';
    if(sub)sub.textContent=isTr?'Evini tek merkezden yönetmek için giriş yap.':'Sign in to manage your smart home.';
    if(submitBtn)submitBtn.innerHTML='<span>'+(isTr?'Giriş Yap':'Sign In')+'</span>';
    if(switchPrompt)switchPrompt.textContent=isTr?'Hesabın yok mu? Yeni Hesap Oluştur':"Don't have an account? Sign up";
  }
}

function nxTogglePwVisible(){
  var input=document.getElementById('nxAuthPassword');
  var iconEl=document.getElementById('nxPwEyeIcon');
  if(!input||!iconEl)return;
  if(input.type==='password'){
    input.type='text';
    iconEl.innerHTML='<svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  }else{
    input.type='password';
    iconEl.innerHTML='<svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/></svg>';
  }
}

function nxGoogleLogin(){
  var SUPABASE_URL=nxCloudConfig().url;
  if(!SUPABASE_URL){nxAuthUnavailable();return;}
  var redir=window.location.origin + window.location.pathname;
  window.location.href = SUPABASE_URL + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(redir);
}

function nxForgotPassword(){
  var isTr=document.documentElement.lang==='tr';
  var email=(document.getElementById('nxAuthEmail').value||'').trim();
  nxShowPrompt(
    isTr ? 'Şifremi Unuttum' : 'Forgot Password',
    isTr ? 'Şifre sıfırlama bağlantısı gönderilecek e-posta adresinizi girin:' : 'Enter your email address to receive a password reset link:',
    email,
    function(inputEmail){
      if(!inputEmail)return;
      var alertEl=document.getElementById('nxAuthAlert');
      var SUPABASE_URL=nxCloudConfig().url;
      var SUPABASE_KEY=nxCloudConfig().anonKey;
      if(!SUPABASE_URL||!SUPABASE_KEY){if(alertEl){alertEl.textContent=nxAuthUnavailableMsg();alertEl.style.display='block';}return;}
      fetch(SUPABASE_URL+'/auth/v1/recover',{
        method:'POST',
        headers:{'apikey':SUPABASE_KEY,'Content-Type':'application/json'},
        body:JSON.stringify({email:inputEmail})
      })
      .then(function(){
        nxShowAlert(
          isTr ? 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi ('+inputEmail+').' : 'Password reset link sent to your email ('+inputEmail+').',
          isTr ? 'Bağlantı Gönderildi' : 'Reset Link Sent',
          'success'
        );
      })
      .catch(function(){
        nxShowAlert(
          isTr ? 'Şifre sıfırlama e-postası gönderilemedi.' : 'Could not send reset email.',
          isTr ? 'Hata' : 'Error',
          'warning'
        );
      });
    }
  );
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

  var SUPABASE_URL=nxCloudConfig().url;
  var SUPABASE_KEY=nxCloudConfig().anonKey;
  if(!SUPABASE_URL||!SUPABASE_KEY){
    btn.disabled=false;btn.innerHTML=origText;
    if(alertEl){alertEl.textContent=nxAuthUnavailableMsg();alertEl.style.display='block';}
    return;
  }

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
      if(data.user && data.user.user_metadata){
        if(data.user.user_metadata.avatar_url || data.user.user_metadata.picture){
          localStorage.setItem('nexusUserAvatar', data.user.user_metadata.avatar_url || data.user.user_metadata.picture);
        }
        if(data.user.user_metadata.full_name || data.user.user_metadata.name){
          localStorage.setItem('nexusUserName', data.user.user_metadata.full_name || data.user.user_metadata.name);
        }
      }
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
    localStorage.removeItem('nexusUserName');
    localStorage.removeItem('nexusUserAvatar');
    localStorage.removeItem('nexus_cloud_session');
  }catch(e){}
  nxUpdateNavAuth();
  nxCloseAuthModal();
}

// Fiyatlandırma: Aylık / Yıllık geçişi
// Rakamlar ve indirim oranı build'de PRICES'tan enjekte edilir (tek kaynak cloud-sync.js);
// elle yazılan fiyatlar zam geldiğinde yalan söylüyordu. site.js tek dosya olduğu için
// para birimi sayfanın dilinden seçilir (TR → TL, diğerleri → USD; cloud-sync.js de öyle yapıyor).
var NX_BILLING = ${JSON.stringify({
  tr: { price: PRICES.TRY, save: SAVE.TRY },
  en: { price: PRICES.USD, save: SAVE.USD },
})};
function nxSetBilling(period){
  var isYearly=period==='yearly';
  var btnM=document.getElementById('billingMonthly');
  var btnY=document.getElementById('billingYearly');
  if(btnM)btnM.classList.toggle('active',!isYearly);
  if(btnY)btnY.classList.toggle('active',isYearly);

  var isTr=document.documentElement.lang==='tr';
  var bundle=NX_BILLING[isTr?'tr':'en'];
  var priceVal=document.getElementById('planPriceVal');
  var periodVal=document.getElementById('planPeriodVal');
  var priceNote=document.getElementById('planPriceNote');
  var cta=document.getElementById('nexusPlusCta');

  if(isYearly){
    if(priceVal)priceVal.textContent=bundle.price.perMonthOfYear;
    if(periodVal)periodVal.textContent=isTr?'/ay, yıllık':'/mo, billed yearly';
    if(priceNote)priceNote.textContent=isTr
      ? ('Yıllık ' + bundle.price.yearly + ' olarak faturalandırılır (%' + bundle.save + ' tasarruf)')
      : ('Billed as ' + bundle.price.yearly + '/yr (Save ' + bundle.save + '%)');
    if(cta){
      if(cta.dataset.yearlyHref)cta.href=cta.dataset.yearlyHref;
      if(cta.dataset.yearlyLabel)cta.textContent=cta.dataset.yearlyLabel;
    }
  }else{
    if(priceVal)priceVal.textContent=bundle.price.monthly;
    if(periodVal)periodVal.textContent=isTr?'/ay':'/mo';
    if(priceNote)priceNote.textContent=isTr?'Aylık faturalandırma':'Billed monthly';
    if(cta){
      if(cta.dataset.monthlyHref)cta.href=cta.dataset.monthlyHref;
      if(cta.dataset.monthlyLabel)cta.textContent=cta.dataset.monthlyLabel;
    }
  }
}

// SSS tek-açıklık davranışı
function nxToggleFaq(btn){
  var item=btn.closest('.faq-item');
  var isOpen=item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(function(el){
    el.classList.remove('open');
    var b=el.querySelector('.faq-q');
    if(b)b.setAttribute('aria-expanded','false');
  });
  if(!isOpen){item.classList.add('open');btn.setAttribute('aria-expanded','true');}
}

// Gerçekçi Akıllı Telefon Ön İzleme Kontrolleri
var nxCurrentShot=0;
var nxShotTimer=null;

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
    d.setAttribute('aria-selected',i===idx?'true':'false');
  });

  var titleEl=document.getElementById('phoneSlideTitle');
  var numEl=document.getElementById('phoneSlideNum');
  var activeSlide=slides[idx];
  if(activeSlide){
    var label=activeSlide.getAttribute('data-label')||activeSlide.getAttribute('data-shot')||'';
    if(titleEl)titleEl.textContent=label;
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
      if(e.target.closest('.phone-arrow')) return;
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

  // OAuth / Google Giriş Dönüşü Kontrolü
  if(window.location.hash && window.location.hash.indexOf('access_token=')!==-1){
    try{
      var hashParams=new URLSearchParams(window.location.hash.substring(1));
      var token=hashParams.get('access_token');
      if(token){
        var payload=JSON.parse(atob(token.split('.')[1]));
        var userEmail=payload.email||'kullanici@nexus';
        localStorage.setItem('nexusCurrentUser',userEmail);
        if(payload.user_metadata){
          if(payload.user_metadata.avatar_url || payload.user_metadata.picture){
            localStorage.setItem('nexusUserAvatar', payload.user_metadata.avatar_url || payload.user_metadata.picture);
          }
          if(payload.user_metadata.full_name || payload.user_metadata.name){
            localStorage.setItem('nexusUserName', payload.user_metadata.full_name || payload.user_metadata.name);
          }
        }
        localStorage.setItem('nexus_cloud_session',JSON.stringify({
          accessToken:token,
          refreshToken:hashParams.get('refresh_token'),
          userId:payload.sub,
          email:userEmail
        }));
        history.replaceState(null,null,window.location.pathname+window.location.search);
      }
    }catch(e){}
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

  // ESC Tuşu ile Modal Kapatma
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      nxCloseContactModal();
      nxCloseAuthModal();
    }
  });
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
      ${APP_URL ? `<a href="${APP_URL}" target="_blank" rel="noopener">${isTr ? 'Web uygulaması' : 'Web app'}</a>` : ''}
    </nav>
    <div class="nav-controls">
      <div class="lang-switch" role="group" aria-label="${isTr ? 'Dil seçimi' : 'Language selection'}">
        ${isTr
          ? `<span class="lang-btn active">TR</span><a href="${enHref}" class="lang-btn" onclick="nxSetLang('en')" title="English">EN</a>`
          : `<a href="${trHref}" class="lang-btn" onclick="nxSetLang('tr')" title="Türkçe">TR</a><span class="lang-btn active">EN</span>`
        }
      </div>
      <button class="nx-auth-btn" id="nxNavAuthBtn" onclick="nxOpenAuthModal()" aria-label="${isTr ? 'Giriş Yap veya Hesap' : 'Sign In or Account'}">
        <span id="nxNavAuthAvatar"><svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0-8 0 4 4 0 0 0 8 0"/></svg></span>
        <span id="nxNavAuthLabel" class="nx-nav-label">${isTr ? 'Giriş Yap' : 'Sign In'}</span>
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
      <p class="ver-chip"><span class="dot"></span>${esc(c.hero.versionNote)}: <b data-nexus-ver>${APP_VERSION}</b></p>
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
            ${shots.map((s, i) => `<div class="shot-slide${i === 0 ? ' active' : ''}" data-shot="${s.file}" data-label="${esc(s.label)}"><img src="/images/shots/${isTr ? '' : 'en/'}${s.file}.png" alt="${esc(c.hero.shotAlt)} — ${esc(s.label)}" width="390" height="844" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async"></div>`).join('\n            ')}
          </div>
          <div class="phone-home-indicator"></div>
          <div class="phone-glass-shine"></div>
        </div>
        <button type="button" class="phone-arrow phone-arrow-left" onclick="event.stopPropagation();nxPrevShot()" aria-label="${isTr ? 'Önceki Ekran' : 'Previous Screen'}">
          <svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="m15 18-6-6 6-6"/></svg>
        </button>
        <button type="button" class="phone-arrow phone-arrow-right" onclick="event.stopPropagation();nxNextShot()" aria-label="${isTr ? 'Sonraki Ekran' : 'Next Screen'}">
          <svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
      <div class="phone-bottom-bar">
        <div class="phone-caption-pill" id="phoneCaptionPill">
          <span class="badge" id="phoneSlideNum">1/${shots.length}</span>
          <span id="phoneSlideTitle">${esc(shots[0].label)}</span>
        </div>
        <div class="phone-dots" role="tablist" aria-label="${isTr ? 'Ekranlar' : 'Screens'}">
          ${shots.map((s, i) => `<button role="tab" class="phone-dot${i === 0 ? ' active' : ''}" aria-selected="${i === 0 ? 'true' : 'false'}" onclick="nxShowShot(${i});nxResetShotTimer();" aria-label="${esc(s.label)}" title="${esc(s.label)}"></button>`).join('')}
        </div>
        <span class="phone-tap-hint">${icon('sparkles')}${isTr ? 'Sonraki ekran için dokunun veya oklara basın' : 'Tap phone or use arrows to explore'}</span>
      </div>
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

/* Entegrasyon listesi artık supported-devices.js'ten geliyor. Elle yazıldığı dönemde
   site, uygulamanın hiç bağlayıcısı olmayan markaları (HomeKit, Sonoff DIY, WiZ, LIFX,
   Govee LAN) ve Matter/Zigbee'yi doğrudan destek gibi gösteriyordu. */
function integrationGroups(c) {
  const isTr = c.lang === 'tr';
  if (!DEVICE_MATRIX.length) return c.integrations.groups;
  // supported-devices.js'teki marka adlarında Türkçe parantezli notlar var
  // ("Tuya (yerel mod)"); ikisinde de yalnızca marka görünür.
  const label = (b) => String(b).replace(/\s*\([^)]*\)\s*/g, '').trim();
  const brands = (av) => DEVICE_MATRIX.filter((d) => d.availability === av).map((d) => label(d.brand));
  const groups = [];
  if (brands('all').length) groups.push([isTr ? 'Yerel HTTP — her platformda' : 'Local HTTP — on every platform', brands('all')]);
  if (brands('desktop').length) groups.push([isTr ? 'Yerel TCP — masaüstü uygulamasında' : 'Local TCP — desktop app', brands('desktop')]);
  if (brands('soon').length) groups.push([isTr ? 'Doğrudan bağlayıcı yakında' : 'Direct connector coming soon', brands('soon')]);
  return groups;
}

function renderIntegrations(c) {
  const isTr = c.lang === 'tr';
  return `<section id="integrations">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.integrations.heading)}</h2><p>${esc(c.integrations.lead)}</p></div>
    <div class="int-groups">
      ${integrationGroups(c).map(([g, items]) => `<div class="card rv"><h3>${esc(g)}</h3><div class="chips">${items.map((i) => `<span class="chip">${getBrandLogo(i)}${esc(i)}</span>`).join('')}</div></div>`).join('\n      ')}
    </div>
    <p class="int-note rv">${isTr
      ? 'Matter, Zigbee, Tuya, Sonoff ve Xiaomi gibi protokoller kendi Home Assistant sunucun üzerinden eklenir; NEXUS\u2019un bu markalar için doğrudan bağlayıcısı yoktur.'
      : 'Matter, Zigbee, Tuya, Sonoff and Xiaomi come in through your own Home Assistant server; NEXUS has no direct connector for those brands.'}</p>
    <button type="button" class="int-more" onclick="nxOpenContactModal('${isTr ? 'Cihaz & Bağlayıcı İsteği' : 'Connector Request'}')">${esc(c.integrations.more)} ${icon('arrow')}</button>
  </div>
</section>`;
}

function renderPricing(c) {
  const p = priceFor(c.lang);
  const isTr = c.lang === 'tr';
  const monthlyCheckout = isTr ? CHECKOUT_URLS.TRY.monthly : CHECKOUT_URLS.USD.monthly;
  const yearlyCheckout = isTr ? CHECKOUT_URLS.TRY.yearly : CHECKOUT_URLS.USD.yearly;
  const save = isTr ? SAVE.TRY : SAVE.USD;

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
          <span class="save-badge">${isTr ? `%${save} Tasarruf` : `Save ${save}%`}</span>
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
          <div class="price"><span id="planPriceVal">${p.monthly}</span> <small id="planPeriodVal">${isTr ? '/ay' : '/mo'}</small></div>
          <p class="price-note" id="planPriceNote">${isTr ? 'Aylık faturalandırma' : 'Billed monthly'}</p>
        </div>
        <ul>
          ${c.pricing.plans[1].features.map((f) => `<li>${icon('check')}${esc(f)}</li>`).join('\n          ')}
        </ul>
        <a class="btn btn-primary plan-cta" id="nexusPlusCta" href="${monthlyCheckout}" data-monthly-href="${monthlyCheckout}" data-yearly-href="${yearlyCheckout}" data-monthly-label="${esc(c.pricing.plans[1].cta.monthlyLabel || c.pricing.plans[1].cta.label)}" data-yearly-label="${esc(c.pricing.plans[1].cta.yearlyLabel || c.pricing.plans[1].cta.label)}" target="_blank" rel="noopener">
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
          <span><b data-nexus-ver>${APP_VERSION}</b></span>
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
      ${c.faq.items.map(([q, a], i) => `<div class="faq-item rv${i === 0 ? ' open' : ''}"><button class="faq-q" aria-expanded="${i === 0 ? 'true' : 'false'}" onclick="nxToggleFaq(this)"><span>${esc(q)}</span>${icon('arrow')}</button><div class="faq-a"><p>${esc(a)}</p></div></div>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

function renderFooter(c) {
  const col = (title, links) =>
    `<div class="ft-col"><h4>${esc(title)}</h4>${links.map(([l, h]) => {
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
        <div class="ft-pills">
          <span class="ft-pill">${icon('lock')} ${c.lang === 'tr' ? 'Yerel Ağ Güvenliği' : 'Local-First LAN'}</span>
          <span class="ft-pill">${icon('zap')} ${c.lang === 'tr' ? 'Kontrol için bulut şart değil' : 'Control without the cloud'}</span>
          <span class="ft-pill">${icon('sparkles')} ${c.lang === 'tr' ? 'Gizlilik Odaklı' : 'Privacy-First'}</span>
        </div>
      </div>
      <div class="ft-links-group">
        ${col(c.footer.product, c.footer.productLinks)}
        ${col(c.footer.account, c.footer.accountLinks)}
        ${col(c.footer.legal, c.footer.legalLinks)}
      </div>
    </div>
    <div class="ft-bottom">
      <span>© ${new Date().getFullYear()} NEXUS. ${esc(c.footer.rights)}</span>
      <span class="ft-privacy">${icon('lock')} ${c.lang === 'tr' ? 'Yerel kontrol hesap gerektirmez.' : 'Local control needs no account.'}</span>
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
    
    <!-- Marka Rozeti & Başlık (Giriş Modülü ile Birebir Marka Kimliği) -->
    <div class="nx-auth-brand-badge">
      <div class="nx-app-logo">${brand.logoSvg}</div>
      <h3 id="nxContactTitle">${isTr ? 'NEXUS Destek & İletişim' : 'NEXUS Support & Inquiries'}</h3>
      <p id="nxContactSubtitle">${isTr ? 'Teknik destek, cihaz entegrasyonu ve tüm sorularınız için doğrudan ekibimize yazın.' : 'Reach out for technical inquiries, device connectors, and questions.'}</p>
    </div>

    <form id="nxContactForm" onsubmit="nxSubmitContact(event)" data-sending="${isTr ? 'Gönderiliyor…' : 'Sending…'}">
      <div class="nx-auth-field-wrap">
        <label for="nxContactName" class="nx-field-label">${isTr ? 'Adınız Soyadınız' : 'Your Name'}</label>
        <input type="text" id="nxContactName" class="nx-app-input" required placeholder="${isTr ? 'Örn. Can Demir' : 'e.g. Alex Morgan'}" autocomplete="name">
      </div>
      <div class="nx-auth-field-wrap">
        <label for="nxContactEmail" class="nx-field-label">${isTr ? 'E-posta Adresiniz (Yanıt bu adrese iletilecektir)' : 'Your Email (We will reply here)'}</label>
        <input type="email" id="nxContactEmail" class="nx-app-input" required placeholder="${isTr ? 'ornek@eposta.com' : 'name@example.com'}" autocomplete="email">
      </div>
      <div class="nx-auth-field-wrap">
        <label for="nxContactCategory" class="nx-field-label">${isTr ? 'Konu / Talep Türü' : 'Subject / Topic'}</label>
        <select id="nxContactCategory" class="nx-app-input nx-app-select">
          <option value="${isTr ? 'Teknik Destek' : 'Technical Support'}">${isTr ? 'Teknik Destek ve Kurulum' : 'Technical Support & Setup'}</option>
          <option value="${isTr ? 'Cihaz & Bağlayıcı İsteği' : 'Connector Request'}">${isTr ? 'Yeni Cihaz & Bağlayıcı İsteği' : 'New Device / Connector Request'}</option>
          <option value="${isTr ? 'NEXUS+ ve Abonelik' : 'NEXUS+ & Billing'}">${isTr ? 'NEXUS+ ve Fatura / Abonelik' : 'NEXUS+ & Billing Questions'}</option>
          <option value="${isTr ? 'Geri Bildirim & Öneri' : 'Feedback & Suggestion'}">${isTr ? 'Geri Bildirim veya Öneri' : 'General Feedback or Suggestion'}</option>
        </select>
      </div>
      <div class="nx-auth-field-wrap">
        <label for="nxContactMsg" class="nx-field-label">${isTr ? 'Mesajınız' : 'Your Message'}</label>
        <textarea id="nxContactMsg" class="nx-app-input nx-app-textarea" required rows="3" placeholder="${isTr ? 'Nasıl yardımcı olabiliriz? Lütfen detayları paylaşın…' : 'How can we help? Please describe your request in detail…'}"></textarea>
      </div>
      <button type="submit" id="nxContactSubmitBtn" class="btn btn-primary w-full nx-app-submit">
        <svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m22 2-7 20-4-9-9-4Z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M22 2 11 13"/></svg>
        <span>${isTr ? 'Mesajı Gönder' : 'Send Message'}</span>
      </button>
      <p class="nx-contact-security-note">
        ${icon('lock')} ${isTr ? 'Talebiniz geliştirici ekibimize doğrudan iletilir. En geç 24 saat içinde dönüş yapılır.' : 'Your message is sent directly to developers. Replies within 24h.'}
      </p>
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
      <div class="nx-auth-brand-badge">
        <div class="nx-app-logo">${brand.logoSvg}</div>
        <h3 id="nxAuthTitle">${isTr ? 'Tekrar Hoş Geldin' : 'Welcome Back'}</h3>
        <p id="nxAuthSubtitle">${isTr ? 'Evini tek merkezden yönetmek için giriş yap.' : 'Sign in to manage your smart home.'}</p>
      </div>
      <form id="nxAuthForm" onsubmit="nxSubmitAuth(event)">
        <div id="nxAuthAlert" class="nx-auth-alert" style="display:none"></div>
        <div class="nx-auth-field-wrap">
          <label for="nxAuthEmail" class="nx-field-label">${isTr ? 'E-posta Adresi' : 'Email Address'}</label>
          <input type="email" id="nxAuthEmail" class="nx-app-input" required placeholder="${isTr ? 'ornek@eposta.com' : 'name@example.com'}" autocomplete="email">
        </div>
        <div class="nx-auth-field-wrap">
          <label for="nxAuthPassword" class="nx-field-label">${isTr ? 'Şifre' : 'Password'}</label>
          <div style="position:relative">
            <input type="password" id="nxAuthPassword" class="nx-app-input" required placeholder="${isTr ? '••••••••' : '••••••••'}" autocomplete="current-password" style="padding-right:44px">
            <button type="button" class="nx-pw-toggle" onclick="nxTogglePwVisible()" aria-label="${isTr ? 'Şifreyi Göster' : 'Show password'}">
              <span id="nxPwEyeIcon">${icon('eyeOff')}</span>
            </button>
          </div>
        </div>
        <button type="submit" id="nxAuthSubmitBtn" class="btn btn-primary w-full nx-app-submit">
          <span>${isTr ? 'Giriş Yap' : 'Sign In'}</span>
        </button>
        <button type="button" class="nx-google-btn" onclick="nxGoogleLogin()">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
          <span>${isTr ? 'Google ile devam et' : 'Continue with Google'}</span>
        </button>
      </form>
      <div class="nx-auth-links">
        <button type="button" class="nx-auth-link" onclick="nxToggleAuthMode()">
          <span id="nxAuthSwitchPrompt">${isTr ? 'Hesabın yok mu? Yeni Hesap Oluştur' : "Don't have an account? Sign up"}</span>
        </button>
        <button type="button" class="nx-auth-link muted" onclick="nxForgotPassword()">
          <span>${isTr ? 'Şifremi Unuttum' : 'Forgot Password?'}</span>
        </button>
      </div>
    </div>

    <!-- Profil & Gelişmiş Hesap Ayarları Görünümü (Giriş Yapılmışsa) -->
    <div id="nxAuthProfileView" style="display:none">
      <div class="nx-auth-brand-badge" style="margin-bottom:12px">
        <div class="nx-app-logo" style="width:36px;height:36px;margin-bottom:4px">${brand.logoSvg}</div>
        <h3 style="font-size:18px">${isTr ? 'NEXUS Hesap Merkezi' : 'NEXUS Account Hub'}</h3>
        <p style="font-size:12px">${isTr ? 'Cihazlarınız ve ev ayarlarınız bu hesapla senkronize edilir.' : 'Your devices and home automations synchronize with this account.'}</p>
      </div>

      <div class="nx-profile-header">
        <div class="nx-profile-avatar-large" id="nxProfileAvatarWrap">
          <svg viewBox="0 0 24 24" class="nx-user-icon" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
          <span class="nx-avatar-status-dot"></span>
        </div>
        <div class="nx-profile-name-wrap">
          <div class="nx-profile-name-row">
            <h3 id="nxProfileNameDisplay">Kullanıcı</h3>
            <button type="button" class="nx-edit-name-btn" onclick="nxEditProfileName()" title="${isTr ? 'İsmi Düzenle' : 'Edit Name'}">
              <svg viewBox="0 0 24 24" class="icon"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
          </div>
          <span id="nxProfileEmail" class="nx-profile-email-chip">kullanici@eposta.com</span>
        </div>
      </div>

      <!-- Detay Kartları -->
      <div class="nx-profile-grid">
        <div class="nx-profile-card">
          <div class="nx-profile-card-head">
            <span>${isTr ? 'Abonelik & Plan' : 'Subscription & Tier'}</span>
            <span class="nx-plan-tag" id="nxProfilePlanTag">Free</span>
          </div>
          <p id="nxProfilePlanDesc" class="nx-profile-card-sub">${isTr ? 'Temel Başlangıç Planı' : 'Starter Free Plan'}</p>
          <div class="nx-profile-card-actions">
            <a href="${c.canonical}#pricing" class="btn-xs btn-primary" onclick="nxCloseAuthModal()">${isTr ? `NEXUS+ Yükselt (%${SAVE.TRY} İndirim)` : `Upgrade to NEXUS+ (Save ${SAVE.USD}%)`}</a>
            <a href="https://whop.com/hub/" target="_blank" rel="noopener" class="btn-xs btn-ghost">${isTr ? 'Faturalar & Whop' : 'Billing & Whop'}</a>
          </div>
        </div>

        <div class="nx-profile-card">
          <div class="nx-profile-card-head">
            <span>${isTr ? 'Bulut & Eşitleme' : 'Cloud & Sync'}</span>
            <span class="nx-status-pill online">${isTr ? 'Bağlı' : 'Connected'}</span>
          </div>
          <div class="nx-profile-kv">
            <small>${isTr ? 'Altyapı' : 'Engine'}</small>
            <b>Supabase Cloud & Auth</b>
          </div>
          <div class="nx-profile-kv">
            <small>${isTr ? 'Eşitleme' : 'Sync Status'}</small>
            <b class="text-emerald">${isTr ? 'Tüm cihazlarla senkron' : 'In sync across devices'}</b>
          </div>
        </div>
      </div>

      <!-- Hesap İşlemleri -->
      <div class="nx-profile-footer-actions">
        <button type="button" class="nx-profile-link-btn" onclick="nxSendPasswordReset()">
          <svg viewBox="0 0 24 24" class="icon"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          <span>${isTr ? 'Şifre Sıfırlama Bağlantısı Gönder' : 'Send Password Reset Email'}</span>
        </button>
        <button type="button" class="btn btn-outline w-full" onclick="nxSignOut()">
          <svg viewBox="0 0 24 24" class="icon"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          <span>${isTr ? 'Oturumu Kapat' : 'Sign Out'}</span>
        </button>
      </div>
    </div>

  </div>
</div>`;
}

function renderCustomDialog(c) {
  const isTr = c.lang === 'tr';
  return `
<div id="nxCustomDialog" class="nx-dialog-backdrop" onclick="if(event.target===this)nxCloseDialog()" role="dialog" aria-modal="true" aria-labelledby="nxDialogTitle" style="display:none">
  <div class="nx-dialog-card">
    <div class="nx-dialog-icon" id="nxDialogIcon"></div>
    <h3 id="nxDialogTitle"></h3>
    <p id="nxDialogMsg"></p>
    <div id="nxDialogInputWrap" style="display:none;margin:12px 0 6px">
      <input type="text" id="nxDialogInput" class="nx-app-input" autocomplete="off">
    </div>
    <div class="nx-dialog-actions">
      <button type="button" class="btn btn-outline" id="nxDialogCancelBtn" onclick="nxCloseDialog()">${isTr ? 'İptal' : 'Cancel'}</button>
      <button type="button" class="btn btn-primary" id="nxDialogConfirmBtn">${isTr ? 'Tamam' : 'OK'}</button>
    </div>
  </div>
</div>`;
}

const SITE_ORIGIN = 'https://nexus-smarthome.pages.dev';

/* Cloudflare Pages, about.html isteğini 308 ile /about'a yönendirir. Kanonik adres
   .html'li bırakılıyordu: arama motoru iki kopya görüyor, og:url da yanlış çıkıyordu.
   Aynı hata hreflang'da da vardı: her sayfa EN/TR karşılığı olarak ana sayfayı gösteriyordu. */
function cleanPath(path) {
  let p = String(path || '/').replace(/index\.html$/i, '').replace(/\.html$/i, '');
  if (p === '/tr' || p === '/tr/') return '/tr/';
  p = p.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

function routePair(path) {
  const clean = cleanPath(path);
  const slug = clean.startsWith('/tr') ? clean.slice(3) || '/' : clean;
  return {
    clean,
    en: slug === '/' ? '/' : slug,
    tr: slug === '/' ? '/tr/' : '/tr' + slug,
  };
}

function baseHead(c, path, opts = {}) {
  const route = routePair(path);
  const url = SITE_ORIGIN + route.clean;
  const ogImage = SITE_ORIGIN + '/og-cover.png';
  const jsonLd = opts.schema
    ? `\n<script type="application/ld+json">${JSON.stringify(opts.schema).replace(/</g, '\\u003c')}</script>`
    : '';
  return `<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(opts.title || c.title)}</title>
<meta name="description" content="${esc(opts.description || c.description)}"/>
<link rel="canonical" href="${url}"/>
<link rel="alternate" hreflang="en" href="${SITE_ORIGIN}${route.en}"/>
<link rel="alternate" hreflang="tr" href="${SITE_ORIGIN}${route.tr}"/>
<link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}${route.en}"/>
<link rel="icon" href="/icon.svg" type="image/svg+xml"/>
<link rel="apple-touch-icon" href="/icons/icon-192.png"/>
<link rel="manifest" href="/manifest.webmanifest"/>
<meta property="og:type" content="${opts.ogType || 'website'}"/>
<meta property="og:site_name" content="NEXUS"/>
<meta property="og:locale" content="${c.lang === 'tr' ? 'tr_TR' : 'en_US'}"/>
<meta property="og:title" content="${esc(opts.title || c.title)}"/>
<meta property="og:description" content="${esc(opts.description || c.description)}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:image" content="${ogImage}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="${esc(c.ogImageAlt)}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(opts.title || c.title)}"/>
<meta name="twitter:description" content="${esc(opts.description || c.description)}"/>
<meta name="twitter:image" content="${ogImage}"/>
<link href="/fonts/inter/inter.css" rel="stylesheet"/>${jsonLd}`;
}

/* Yapılandırılmış veri: arama sonuçlarında yazılım + SSS olarak çıkması için.
   Yalnızca gerçekten var olan alanlar doldurulur (indirme bağlantıları, gerçek SSS). */
function landingSchema(c) {
  const isTr = c.lang === 'tr';
  const dl = (file) => `https://github.com/Enard52/nexus-releases/releases/latest/download/${file}`;
  const apps = (c.downloads.cards || [])
    .filter(([, , , , file]) => !!file)
    .map(([plat, , name, , file]) => ({
      '@type': 'SoftwareApplication',
      name: 'NEXUS' + (isTr ? ' — ' + name : ' — ' + name),
      applicationCategory: 'HomeApplication',
      operatingSystem: plat === 'windows' ? 'Windows' : plat === 'android' ? 'Android' : 'Linux',
      url: dl(file),
      offers: { '@type': 'Offer', price: '0', priceCurrency: isTr ? 'TRY' : 'USD' },
    }));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'NEXUS',
        url: SITE_ORIGIN + (isTr ? '/tr/' : '/'),
        logo: SITE_ORIGIN + '/icon.svg',
        email: 'nexus.smarthome.app@gmail.com',
      },
      {
        '@type': 'WebSite',
        name: 'NEXUS',
        url: SITE_ORIGIN + (isTr ? '/tr/' : '/'),
        inLanguage: isTr ? 'tr' : 'en',
      },
      ...apps,
      {
        '@type': 'FAQPage',
        mainEntity: ((c.faq && c.faq.items) || []).map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: String(a).replace(/<[^>]+>/g, '') },
        })),
      },
    ],
  };
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
${baseHead(c, c.lang === 'tr' ? '/tr/' : '/', { schema: landingSchema(c) })}
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
${renderCustomDialog(c)}
<script src="/assets/cloud-config.js"></script>
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
${baseHead(c, path, {
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebPage', name: c.about.title, url: SITE_ORIGIN + cleanPath(path), inLanguage: c.htmlLang },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: isTr ? 'Ana sayfa' : 'Home', item: SITE_ORIGIN + (isTr ? '/tr/' : '/') },
            { '@type': 'ListItem', position: 2, name: c.about.title, item: SITE_ORIGIN + cleanPath(path) },
          ],
        },
      ],
    },
  })}
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
${renderCustomDialog(c)}
<script src="/assets/cloud-config.js"></script>
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
${baseHead(c, path, {
    title: doc.title + ' — NEXUS',
    description: (doc.intro || doc.title) + ' — NEXUS',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: doc.title,
      url: canonicalUrl,
      inLanguage: c.htmlLang,
      isPartOf: { '@type': 'WebSite', url: SITE_ORIGIN + (isTr ? '/tr/' : '/') },
    },
  })}
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
${renderCustomDialog(c)}
<script src="/assets/cloud-config.js"></script>
<script src="/assets/site.js"></script>
</body>
</html>`;
}

/* 404 sayfası üretimin parçasıydı ama uzun süre elle kalmış bayat bir kopyaydı:
   253 KB, içinde var olmayan #bölüm bağlantıları, yayınlanmayan "iOS (yakında)"
   iddiası ve çalışmayan tema/dil düğmeleri vardı. Artık üretiliyor: JS yok, dolayısıyla
   ölü düğme yok; iki dilde karşılıklı bağlantı ve gerçek hedeflere giden iki bağlantı. */
function renderNotFound(c) {
  const isTr = c.lang === 'tr';
  const other = isTr ? content.en : content.tr;
  const home = isTr ? '/tr/' : '/';
  return `<!DOCTYPE html>
<html lang="${c.htmlLang}" data-theme="light">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${isTr ? 'Sayfa bulunamadı — NEXUS' : 'Page not found — NEXUS'}</title>
<meta name="robots" content="noindex"/>
<link rel="canonical" href="${SITE_ORIGIN}${home}"/>
<link rel="alternate" hreflang="en" href="${SITE_ORIGIN}${isTr ? '/' : '/tr/'}"/>
<link rel="icon" href="/icon.svg" type="image/svg+xml"/>
<link href="/fonts/inter/inter.css" rel="stylesheet"/>
<style>
  :root { color-scheme: light dark; --bg:#fafafc; --fg:#0b1020; --fg2:#5a6172; --bd:#e6e8f0; --brand:#4C7DFF; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0b0d14; --fg:#eef1f8; --fg2:#9aa3b5; --bd:#232838; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100dvh; display:grid; place-items:center; background:var(--bg); color:var(--fg);
         font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif; -webkit-font-smoothing:antialiased; padding:24px; }
  .box { max-width:520px; text-align:center; }
  .mark { width:56px; height:56px; margin:0 auto 18px; display:block; }
  .code { font-size:13px; font-weight:800; letter-spacing:.14em; color:var(--brand); margin:0 0 10px; }
  h1 { font-size:26px; font-weight:800; letter-spacing:-.02em; margin:0 0 10px; }
  p { font-size:15px; line-height:1.65; color:var(--fg2); margin:0 0 26px; }
  .row { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; }
  a.btn { display:inline-flex; align-items:center; min-height:44px; padding:0 20px; border-radius:12px;
          font-size:14.5px; font-weight:700; text-decoration:none; border:1px solid var(--bd); color:var(--fg); background:transparent; }
  a.btn.primary { background:var(--brand); border-color:var(--brand); color:#fff; }
  .lang { margin-top:26px; font-size:13px; color:var(--fg2); }
  .lang a { color:var(--brand); font-weight:700; text-decoration:none; }
</style>
</head>
<body>
  <main class="box">
    <svg class="mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><defs><linearGradient id="lg" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse"><stop stop-color="#6f9bff"/><stop offset=".55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/></linearGradient></defs><rect x="1" y="1" width="30" height="30" rx="9" fill="url(#lg)"/><path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <p class="code">404</p>
    <h1>${isTr ? 'Bu adres NEXUS’ta yok' : 'This page isn’t part of NEXUS'}</h1>
    <p>${isTr
      ? 'Bağlantı taşınmış ya da yanlış yazılmış olabilir. Uygulama indirme ve fiyatlandırma ana sayfada.'
      : 'The link may have moved or been mistyped. Downloads and pricing live on the home page.'}</p>
    <div class="row">
      <a class="btn primary" href="${home}">${isTr ? 'Ana sayfaya dön' : 'Back to home'}</a>
      <a class="btn" href="${home}#downloads">${isTr ? 'Uygulamaları indir' : 'Download the apps'}</a>
    </div>
    <p class="lang">${isTr
      ? `Bu sayfayı İngilizce okumak istersen: <a href="/404.html">English</a>`
      : `Read this page in Turkish: <a href="/tr/404.html">Türkçe</a>`}</p>
  </main>
</body>
</html>`;
}

function renderLightRedirect(tr) {
  const target = tr ? '/tr/' : '/';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex"/><meta http-equiv="refresh" content="0;url=${target}"/><script>location.replace('${target}');</script></head><body></body></html>`;
}

/* Giriş/kayıt için kısa yol: eskiden elle yazılmıştı ve web uygulamasının adresi
   kopyalanmıştı; artık APP_URL tek kaynaktan üretilir (site.js ile aynı değer). */
function renderSignInRedirect(tr) {
  const t = tr
    ? { lang: 'tr', title: 'NEXUS\u2019a giriş yap', h1: 'NEXUS\u2019a giriş', p: 'Web uygulamasına yönlendiriliyorsun\u2026', link: 'Web uygulamasını aç' }
    : { lang: 'en', title: 'Sign in to NEXUS', h1: 'Sign in to NEXUS', p: 'Taking you to the web app\u2026', link: 'Open the web app' };
  return `<!DOCTYPE html><html lang="${t.lang}" data-theme="dark"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${t.title}</title><meta name="robots" content="noindex"/>
<meta http-equiv="refresh" content="0;url=${APP_URL}"/>
<style>:root{color-scheme:dark light}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#09090b;color:#e5e7eb;font:16px Inter,system-ui,sans-serif;text-align:center}main{padding:24px}h1{font-size:20px;margin:0 0 8px}p{margin:0;color:#9ca3af;font-size:14px}a{display:inline-block;margin-top:16px;min-height:44px;padding:12px 20px;border-radius:12px;background:#818cf8;color:#09090b;font-weight:700;text-decoration:none}</style>
</head><body><main><h1>${t.h1}</h1><p>${t.p}</p><p><a href="${APP_URL}">${t.link}</a></p></main>
<script>location.replace(${JSON.stringify(APP_URL)});</script></body></html>`;
}

/* Eskiden robots/sitemap/manifest'i scripts/site-seo.cjs sayfa çıktısının üstünde
   dolaşıp yazıyordu; artık tek üretici bu dosya. Böylece elle sürüm kopyası,
   bayat enard52.github.io adresi ve sayfa listesi ile gerçek arasındaki fark kalmıyor.
   Adres biçimi canonical'lerle birebir aynı: / , /tr/ , /about , /tr/about. */
const SEO_ROUTES = [
  ['/', 1.0, 'weekly'],
  ['/about', 0.5, 'monthly'],
  ['/privacy', 0.3, 'monthly'],
  ['/terms', 0.3, 'monthly'],
  ['/refund', 0.3, 'monthly'],
];
const urlFor = (route, lang) => (lang === 'tr' ? (route === '/' ? '/tr/' : '/tr' + route) : route);

function renderRobots() {
  return `User-agent: *
Allow: /
Disallow: /login
Disallow: /tr/login
Disallow: /light
Disallow: /tr/light

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;
}

function renderSitemap(today) {
  const rows = [];
  for (const [route, pr, cf] of SEO_ROUTES) {
    for (const lang of ['en', 'tr']) {
      const en = SITE_ORIGIN + urlFor(route, 'en');
      const tr = SITE_ORIGIN + urlFor(route, 'tr');
      const loc = lang === 'tr' ? tr : en;
      const prio = lang === 'tr' ? Math.max(pr - 0.1, 0.2).toFixed(1) : pr.toFixed(1);
      rows.push(
        `  <url>\n` +
          `    <loc>${loc}</loc>\n` +
          `    <xhtml:link rel="alternate" hreflang="en" href="${en}" />\n` +
          `    <xhtml:link rel="alternate" hreflang="tr" href="${tr}" />\n` +
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${en}" />\n` +
          `    <lastmod>${today}</lastmod>\n` +
          `    <changefreq>${cf}</changefreq>\n` +
          `    <priority>${prio}</priority>\n` +
          `  </url>`
      );
    }
  }
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    rows.join('\n') +
    `\n</urlset>\n`
  );
}

function renderManifest() {
  return (
    JSON.stringify(
      {
        name: 'NEXUS',
        short_name: 'NEXUS',
        // Dürüst tanım: macOS sürümü yok (Windows/Linux masaüstü + Android).
        description: 'Local-first smart home control for Windows, Linux and Android.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#8b7bff',
        background_color: '#09090b',
        // PNG'ler scripts/site-icons.mjs ile icon.svg'den üretilir (apple-touch-icon
        // ve Android kurulum ikonu SVG'yi kullanamaz; /icons/*.png 404 olmasın).
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      null,
      2
    ) + '\n'
  );
}

// ---------- Build Yürütme ----------
function build() {
  const hasShots = existsSync(join(PUB, 'images', 'shots', 'home.png'));
  const today = new Date().toISOString().slice(0, 10);

  mkdirSync(join(PUB, 'assets'), { recursive: true });
  mkdirSync(join(PUB, 'tr'), { recursive: true });
  mkdirSync(join(PUB, 'fonts', 'inter'), { recursive: true });

  if (existsSync(join(ROOT, 'fonts', 'inter', 'inter.css'))) {
    cpSync(join(ROOT, 'fonts', 'inter'), join(PUB, 'fonts', 'inter'), { recursive: true });
  }

  writeFileSync(join(PUB, 'assets', 'site.js'), pageJs(), 'utf8');
  writeFileSync(join(PUB, 'assets', 'site-boot.js'), bootJs(), 'utf8');
  // Anahtar takipteki derleme çıktısına geri dönmesin: bu dosya .gitignore'da.
  writeFileSync(
    join(PUB, 'assets', 'cloud-config.js'),
    `// NEXUS site bulut yapilandirmasi — scripts/site-build.mjs tarafindan uretildi.
// Depoya girmez (.gitignore); site yayininda cloud-config.js veya NEXUS_SUPABASE_* saglanir.
window.NEXUS_CLOUD = {
  url: ${JSON.stringify(CLOUD.url)},
  anonKey: ${JSON.stringify(CLOUD.anonKey)},
};
`,
    'utf8'
  );

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

  // login.html de artık üretiliyor: elle kopyalanan sürüm APP_URL'den kopabiliyordu.
  writeFileSync(join(PUB, 'login.html'), renderSignInRedirect(false), 'utf8');
  writeFileSync(join(PUB, 'tr', 'login.html'), renderSignInRedirect(true), 'utf8');

  // 404 artık üretimin parçası: bayat elle kopya (253 KB, ölü bağlantılar) siliniyor.
  writeFileSync(join(PUB, '404.html'), renderNotFound(content.en), 'utf8');
  writeFileSync(join(PUB, 'tr', '404.html'), renderNotFound(content.tr), 'utf8');

  // Keşif dosyaları da üretime dahil (index.html <link rel="manifest"> bunlara işaret ediyor).
  writeFileSync(join(PUB, 'robots.txt'), renderRobots(), 'utf8');
  writeFileSync(join(PUB, 'sitemap.xml'), renderSitemap(today), 'utf8');
  writeFileSync(join(PUB, 'manifest.webmanifest'), renderManifest(), 'utf8');

  console.log('✓ index.html');
  console.log('✓ tr/index.html');
  console.log('✓ 404.html & tr/404.html');
  console.log('✓ login.html & tr/login.html');
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
