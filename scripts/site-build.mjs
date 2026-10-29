import { mkdirSync, writeFileSync, existsSync, cpSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { content, brand, priceFor, PRICES, CHECKOUT_URLS, MANAGE_URL } from './site-content.mjs';
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
    new Function('window', readFileSync(join(ROOT, 'src', 'app', 'supported-devices.js'), 'utf8'))(win);
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
  tuya: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#FF5000"/><path fill="#fff" d="M12 4.5a7.5 7.5 0 1 0 7.5 7.5H12V4.5z"/></svg>`,
  wol: `<svg viewBox="0 0 24 24" class="brand-svg" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#6366F1"/><path d="M12 3v9M6.3 7.3a8 8 0 1 0 11.4 0" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>`,
};

function getBrandLogo(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('shelly')) return BRAND_LOGOS.shelly;
  if (n.includes('tasmota')) return BRAND_LOGOS.tasmota;
  if (n.includes('wled')) return BRAND_LOGOS.wled;
  if (n.includes('esphome')) return BRAND_LOGOS.esphome;
  if (n.includes('hue') || n.includes('philips')) return BRAND_LOGOS.philipshue;
  if (n.includes('home assistant')) return BRAND_LOGOS.homeassistant;
  if (n.includes('tuya')) return BRAND_LOGOS.tuya;
  if (n.includes('wol') || n.includes('wake-on-lan') || n.includes('wake on lan')) return BRAND_LOGOS.wol;
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

function platformMarks() {
  return `<span class="plat-marks" aria-hidden="true">${getPlatformLogo('windows')}${getPlatformLogo('linux')}${getPlatformLogo('android')}</span>`;
}

function platformDownloadBtn(href, btnClass = 'btn btn-primary', isTr = false) {
  // Düğme metni eylem odaklı: platformlar zaten ikonlarla ve güven listesinde söyleniyor.
  const label = isTr ? 'NEXUS\u2019u \u0130ndir' : 'Download NEXUS';
  return `<a class="${btnClass} btn-platforms" href="${href}">${platformMarks()}<span>${label}</span></a>`;
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
    shield: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 3 5 6v6c0 4.5 2.8 7.6 7 9 4.2-1.4 7-4.5 7-9V6z"/></svg>`,
    home: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>`,
    layers: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m22 12.5-9.4 4.3a1.4 1.4 0 0 1-1.2 0L2 12.5"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m22 17.5-9.4 4.3a1.4 1.4 0 0 1-1.2 0L2 17.5"/></svg>`,
    eye: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    eyeOff: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/></svg>`,
    users: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    github: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.11.79-.25.79-.56v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.32-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.75.4-1.26.73-1.54-2.55-.29-5.23-1.27-5.23-5.67 0-1.25.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.17a11 11 0 0 1 5.78 0c2.2-1.48 3.17-1.17 3.17-1.17.63 1.58.23 2.75.11 3.04.74.81 1.19 1.84 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12v3.14c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>`,
  };
  return I[name] || '';
}

// ---------- Tasarım Sistemi CSS ----------
const CSS = `
:root{
  /* Uygulama / program (www/css/nexus-ui.css) ile aynı açık palet. */
  --brand:#4C7DFF; --brand-press:#3F6FFF; --accent:#22D3EE;
  --brand-grad:linear-gradient(135deg,#4C7DFF 0%,#22D3EE 100%);
  --page:#ECE9FD; --page-grad:linear-gradient(180deg, #ECE9FD 0%, #DDD8FB 100%);
  --surface:#FFFFFF; --surface-2:#F4F5FA; --text:#0F172A; --text-2:#334155;
  --muted:#64748B; --border:#E6E8F0; --danger:#E5484D;
  --radius:20px; --radius-lg:28px;
  --shadow:0 4px 16px rgba(15, 23, 42, 0.06); --shadow-lg:0 24px 56px -12px rgba(15, 23, 42, 0.12);
  --header-h:68px; --max:1120px;
}
html{
  scrollbar-gutter: stable;
  overflow-x: clip;
  scroll-behavior: smooth;
}
body{overflow-x:clip}
::selection{background:color-mix(in srgb,var(--brand) 28%,transparent);color:var(--text)}
.skip{
  position:absolute;left:12px;top:-56px;z-index:200;background:var(--brand);color:#fff;
  padding:10px 14px;border-radius:12px;font-weight:700;font-size:13px;
}
.skip:focus{top:12px;outline:2px solid #fff;outline-offset:2px}
:focus-visible{outline:2px solid var(--brand);outline-offset:3px}
section[id]{scroll-margin-top:calc(var(--header-h) + 14px)}
@media (hover: hover) and (pointer: fine){
  .card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:color-mix(in srgb,var(--brand) 35%,transparent)}
  .step:hover{transform:translateY(-5px);box-shadow:var(--shadow-lg);border-color:color-mix(in srgb,var(--brand) 45%,transparent)}
  .plan:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
  .dl-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:color-mix(in srgb,var(--brand) 40%,transparent)}
  .dl-web-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-lg)}
}
@media (prefers-reduced-motion: reduce){
  html{scroll-behavior: auto !important}
  .card,.step,.plan,.dl-card,.dl-web-card,.phone-glow,.dot,.ft-status-dot,.shot-slide,.nav a{animation:none;transition:none}
  .card:hover,.step:hover,.plan:hover,.dl-card:hover,.dl-web-card:hover,.nav a:hover{transform:none}
}
@supports not (scrollbar-gutter: stable){
  html{overflow-y:scroll}
}
html.nx-modal-open,
html.nx-modal-open body{
  overflow:hidden !important;
  overscroll-behavior:none;
}
/* Kilit sırasında şerit SERBEST bırakılır ('stable' → auto): 'stable' kalsaydı,
   çubuğun ayırdığı 15px boş kalır ve Chrome oraya hiçbir şey boyamazdı — koyu
   backdrop'un yanında beyaz bir bant görünüyordu (piksel ölçümü: boya 504px'te
   bitiyor, pencere 520px). Çubuk zaten overflow:hidden ile gizli, şeride gerek yok.
   İçeriğin kaymaması JS'ten geliyor: nxLockScroll kilitleme öncesi gövde ve başlık
   kutularını piksel olarak sabitliyor. (Eski padding telafisi çift sayılıyor ve
   akıştaki içeriği ~7.5px sola kaydırıyordu; sabit navbar bundan etkilenmediği için
   kaymaz, "sadece içerik kayıyor" görüntüsü de buydu.) */
html.nx-modal-open{scrollbar-gutter:auto}
html[data-theme=dark]{
  --page:#0F172A; --page-grad:linear-gradient(180deg, #020617 0%, #0F172A 100%);
  --surface:#1E293B; --surface-2:#273449; --text:#F1F5F9; --text-2:#CBD5E1;
  --muted:#94A3B8; --border:rgba(148, 163, 184, 0.18);
  --shadow:0 4px 16px rgba(0, 0, 0, 0.45); --shadow-lg:0 24px 64px -12px rgba(0,0,0,.7);
}
*{box-sizing:border-box}
body{
  margin:0;
  padding-top:var(--header-h);
  font:400 16px/1.6 Inter,system-ui,-apple-system,sans-serif;
  color:var(--text);
  background:var(--page-grad);
  background-attachment:fixed;
  min-height:100vh;
  -webkit-font-smoothing:antialiased;
}
a{color:inherit;text-decoration:none}
.wrap{max-width:var(--max);margin:0 auto;padding:0 20px;min-width:0;width:100%}
@media(max-width:400px){.wrap{padding:0 16px}}
.icon{width:20px;height:20px;vertical-align:middle;display:inline-block}
.brand-svg{width:22px;height:22px;vertical-align:middle;display:inline-block;flex-shrink:0}

/* Header */
.hd{position:fixed;top:0;left:0;right:0;width:100%;z-index:100;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  background:color-mix(in srgb,var(--surface) 92%,transparent);border-bottom:1px solid var(--border);height:var(--header-h);display:flex;align-items:center}
.hd .wrap{display:flex;align-items:center;width:100%;gap:8px}
.logo{display:inline-flex;align-items:center;gap:10px;font-weight:800;font-size:19px;letter-spacing:-.02em;flex-shrink:0}
.logo svg{width:32px;height:32px}

.nav{display:none;gap:4px;margin-left:auto;align-items:center}
.nav a{
  padding:8px 14px;
  border-radius:999px;
  font-size:14px;
  font-weight:600;
  color:var(--text-2);
  transition:color .18s ease, background-color .18s ease, transform .15s cubic-bezier(.16,1,.3,1), box-shadow .18s ease;
  position:relative;
  user-select:none;
}
.nav a:hover{
  background:var(--surface);
  color:var(--text);
  transform:translateY(-1px);
}
.nav a:active{
  transform:scale(.94);
}
.nav a.active{
  color:var(--brand);
  background:color-mix(in srgb,var(--brand) 12%,transparent);
}
html[data-theme=dark] .nav a.active{
  color:#93c5fd;
  background:color-mix(in srgb,var(--brand) 22%,transparent);
}

.nav-controls{display:flex;align-items:center;gap:8px;margin-left:auto;flex-shrink:0}
@media(min-width:960px){.nav{display:flex}.nav-controls{margin-left:14px;gap:10px}}
@media(max-width:520px){
  :root{--header-h:58px}
  .hd{height:58px}
  .hd .wrap{padding:0 12px}
  .logo{gap:8px;font-size:16px}
  .logo svg{width:28px;height:28px}
  .hd .logo span{display:none}
  .nav-controls{gap:4px}
}

/* Dil Değiştirici (Sleek Segmented Pill Control) — tüm ziyaretçilere açık */
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

/* GitHub bağlantısı */
.gh-link{border:1px solid var(--border);background:var(--surface);color:var(--text-2);
  border-radius:999px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;
  cursor:pointer;box-shadow:var(--shadow);transition:transform .2s ease,color .15s ease,border-color .15s ease}
.gh-link svg{width:18px;height:18px}
.gh-link:hover{transform:translateY(-2px);color:var(--text);border-color:var(--brand)}
.dl-gh{margin-top:20px;text-align:center}

/* Butonlar */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 24px;
  border-radius:999px;font-weight:700;font-size:15px;cursor:pointer;border:0;transition:transform .15s ease,box-shadow .15s ease,background .15s ease}
.btn:active{transform:scale(.97)}
.btn-primary{background:var(--brand-grad);color:#fff;box-shadow:0 8px 24px rgba(76,125,255,.32)}
.btn-primary:hover{opacity:.95;box-shadow:0 10px 30px rgba(76,125,255,.45);transform:translateY(-1px)}
.btn-ghost{background:var(--surface);color:var(--text);border:1px solid var(--border);box-shadow:var(--shadow)}
.btn-ghost:hover{border-color:var(--brand);color:var(--brand)}
.btn.disabled{opacity:.55;pointer-events:none}
.btn-platforms{flex-wrap:wrap;padding:6px 16px 6px 8px;gap:10px}
.plat-marks{display:inline-flex;align-items:center;gap:5px;background:#fff;border-radius:999px;padding:5px 8px;flex-shrink:0;box-shadow:0 1px 3px rgba(15,23,42,.08)}
.plat-marks .brand-svg{width:18px;height:18px;display:block}
.btn-ghost .plat-marks{border:1px solid var(--border);box-shadow:none}
html[data-theme=dark] .btn-ghost .plat-marks{background:var(--surface)}

/* Hero */
.hero{padding:28px 0 32px;position:relative}
.hero::before{content:"";position:absolute;top:-80px;left:50%;transform:translateX(-50%);width:min(920px,100vw);height:520px;
  background:radial-gradient(ellipse at center,rgba(76,125,255,.16) 0%,rgba(34,211,238,.07) 45%,transparent 70%);pointer-events:none;z-index:0}
.hero .wrap{display:grid;gap:28px;align-items:center;position:relative;z-index:1}
.hero-copy{max-width:38rem;width:100%;min-width:0}
.hero-display{display:flex;flex-direction:column;align-items:center;text-align:center;width:100%;max-width:100%;margin:0 0 16px}
.eyebrow{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-size:clamp(10px,2.8vw,12px);font-weight:800;letter-spacing:.1em;
  text-transform:uppercase;color:var(--brand);background:none;padding:0;border:0;border-radius:0;margin:0 0 10px;
  box-shadow:none;line-height:1.25;text-wrap:balance;max-width:100%}
.eyebrow .icon{width:15px;height:15px;flex-shrink:0}
h1{font-size:clamp(30px,4.4vw,48px);line-height:1.1;letter-spacing:-.035em;margin:0 0 16px;font-weight:900}
.hero-copy h1{font-size:clamp(28px,7.2vw,40px);line-height:1.08;letter-spacing:-.04em;margin:0;white-space:normal;text-wrap:balance;max-width:12em}
.grad{background:linear-gradient(135deg,#4C7DFF 0%,#22D3EE 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.lead{font-size:clamp(15px,1.65vw,17.5px);color:var(--text-2);margin:0 0 22px;max-width:52ch;line-height:1.6}
.hero-copy .lead{font-size:clamp(15px,1.7vw,19px);line-height:1.5;color:var(--text);margin:0 0 10px;max-width:46ch;font-weight:500;text-align:left}
.hero-copy .lead-sub{font-size:15px;line-height:1.55;color:var(--muted);margin:0 0 26px;max-width:48ch;text-align:left}
.hero-cta{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-start;gap:12px 16px;margin-bottom:22px}
.ver-chip{display:inline-flex;align-items:center;gap:10px;font-size:12px;font-weight:650;color:var(--text-2);
  background:var(--surface);border:1px solid var(--border);
  padding:6px 8px 6px 12px;border-radius:12px;box-shadow:var(--shadow);line-height:1.2;margin:0}
.ver-chip .ver-num{display:inline-flex;align-items:center;background:var(--brand-grad);color:#fff;
  font-size:12.5px;font-weight:800;letter-spacing:.02em;padding:5px 10px;border-radius:8px}
.dot{width:8px;height:8px;border-radius:50%;background:#10B981;box-shadow:0 0 8px #10B981;animation:pulseDot 2s infinite;flex-shrink:0}
@keyframes pulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
.trust{display:grid;gap:10px;margin:0;padding:0;list-style:none;font-size:14px;color:var(--text-2)}
.trust li{display:flex;align-items:center;gap:8px}
.trust .icon{color:#10B981;width:16px;height:16px;flex-shrink:0}
@media(min-width:960px){
  .hero{padding:20px 0 28px}
  .hero .wrap{grid-template-columns:minmax(0,1fr) auto;gap:32px 56px;align-items:center;
    min-height:calc(100dvh - var(--header-h) - 36px)}
  .hero-copy{max-width:none}
  .hero-copy h1{font-size:clamp(32px,3.15vw,48px);line-height:1.08;white-space:normal;max-width:9.2em}
  .hero-display{width:fit-content;align-items:flex-start;text-align:left}
  .phone-wrapper{margin:0}
}
@media(max-width:959px){
  .hero{padding:20px 0 28px}
  .hero-copy{text-align:center;margin:0 auto}
  .hero-copy h1{white-space:normal;max-width:14em}
  .hero-copy .lead,.hero-copy .lead-sub{text-align:center;margin-left:auto;margin-right:auto}
  .hero-cta{justify-content:center}
  /* Tikler ortak bir sol hizada alt alta: liste bloğu ortada, satırlar sola dayalı */
  .trust{display:flex;flex-direction:column;align-items:flex-start;width:fit-content;margin:0 auto;text-align:left}
  .trust li{width:fit-content;max-width:100%}
}

/* Telefon Ön İzleme - Ekrana Tam Sığan ve Asla Kesilmeyen Gerçek Mockup */
.phone-wrapper{position:relative;margin:0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center}
.phone-glow{position:absolute;inset:-8% -8%;background:var(--brand-grad);filter:blur(50px);opacity:.3;
  border-radius:60px;z-index:0;pointer-events:none;animation:glowPulse 4s ease-in-out infinite}
@keyframes glowPulse{0%,100%{opacity:.25;transform:scale(1)}50%{opacity:.45;transform:scale(1.04)}}

.phone-case{
  position:relative;z-index:2;
  /* Aynı kasa; yükseklik ekrana sığsın diye genişlik viewport'tan türetilir (390/844 + çerçeve). */
  width:min(236px, 52vw, calc((100dvh - var(--header-h) - 64px) * 390 / 920));
  max-width:86vw;
  background:linear-gradient(145deg, #252834 0%, #13151b 50%, #0a0b0e 100%);
  border:2.5px solid rgba(255,255,255,.18);
  border-radius:42px;
  padding:7px;
  box-shadow:0 0 0 1px rgba(0,0,0,.6), 0 24px 48px -12px rgba(0,0,0,.6), 0 0 40px rgba(76,125,255,.16);
  user-select:none;
  cursor:default;
  transition:box-shadow .3s ease;
  animation:none;
}
.phone-case.previewing{cursor:default}

@media(max-width:959px){
  .phone-case{width:min(210px, 56vw, calc((100dvh - var(--header-h) - 48px) * 390 / 920));border-radius:38px;padding:6px}
  .phone-inner-screen{border-radius:22px}
}

.phone-inner-screen{
  position:relative;width:100%;
  aspect-ratio:390 / 844;
  /* Ekran köşesi kasa kadar yuvarlak olursa sağdaki AI yaprağı kesilir (ölçüldü). */
  border-radius:24px;overflow:hidden;
  background:#ECE9FD;
}

/* Dinamik Ada */
.phone-island{
  position:absolute;top:5px;left:50%;transform:translateX(-50%);
  width:min(64px, 28%);height:15px;background:#000;border-radius:14px;z-index:40;
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
.shot-slide img{width:100%;height:100%;object-fit:fill;display:block}
.shot-slide.active{opacity:1;transform:scale(1);pointer-events:auto}

/* Canli onizleme (telefonun icinde gercek uygulama).
   Uygulama ekranlari 390x844 tasarlanir; serceve kutusu ise ~215-245px. Bu yuzden
   iframe 390px genislikte render alir ve kutuya sigacak sekilde olceklenir — olcek
   JS ile --nx-preview-scale degiskenine yazilir (olcumsuz sabit birakilirsa uygulama
   190px'e sikisirir ve okunmaz). */
.phone-preview{position:absolute;inset:0;z-index:22;display:block;background:#ECE9FD;overflow:hidden}
.phone-preview.on{display:block}
.phone-case.previewing .phone-screen-content{display:none}
.phone-preview-frame{position:absolute;top:0;left:0;width:390px;height:844px;border:0;background:#ECE9FD;
  transform-origin:top left;transform:scale(var(--nx-preview-scale,.8));overflow:hidden;
  scrollbar-width:none;-ms-overflow-style:none}
.phone-preview-frame::-webkit-scrollbar,.phone-inner-screen::-webkit-scrollbar,.phone-preview::-webkit-scrollbar{width:0;height:0;display:none}
.phone-case.previewing .phone-arrow{display:none}
.phone-modes{display:flex;align-items:center;gap:4px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:3px;backdrop-filter:blur(8px)}
.phone-mode-btn{background:transparent;border:0;border-radius:999px;
  padding:5px 14px;min-height:30px;font:inherit;font-size:12px;font-weight:700;color:var(--text-2);
  cursor:pointer;transition:all .2s ease}
.phone-mode-btn.active{background:var(--brand-grad);color:#fff;box-shadow:0 2px 8px rgba(76,125,255,.35)}
.phone-mode-open{font-size:12px;font-weight:700;color:var(--brand);text-decoration:none;
  padding:5px 10px;min-height:30px;display:inline-flex;align-items:center}
.phone-mode-open:hover{text-decoration:underline}

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
  background:linear-gradient(135deg,rgba(255,255,255,.05) 0%,rgba(255,255,255,0) 36%);
  pointer-events:none;z-index:24;border-radius:inherit;
}

.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.phone-screen-content{position:absolute;inset:0;z-index:8;display:block}

/* Gerçekçi Ekran Başlık Hapı & Minimalist Sayfalama */
.phone-bottom-bar{display:none}
.phone-nav-row{
  display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;
}
.phone-caption-pill{
  display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;
  max-width:min(340px,92vw);
  background:var(--surface);border:1px solid var(--border);border-radius:18px;
  padding:8px 14px;box-shadow:var(--shadow);font-size:12.5px;font-weight:650;color:var(--text);
  line-height:1.35;text-align:center;
}
.phone-caption-pill .badge{
  background:var(--brand-grad);color:#fff;font-size:10px;font-weight:800;letter-spacing:.04em;
  padding:3px 8px;border-radius:99px;flex-shrink:0;
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
  display:inline-flex;align-items:center;justify-content:center;gap:6px;max-width:min(340px,92vw);
  font-size:12px;color:var(--text-2);line-height:1.4;text-align:center;
}
.phone-tap-hint svg{width:13px;height:13px;color:var(--brand);flex-shrink:0}

/* Bölümler */
section{padding:72px 0}
@media(max-width:700px){section{padding:48px 0}}
.sec-head{max-width:none;margin:0 0 32px}
.sec-mark{width:48px;height:48px;margin:0 auto 14px}
.sec-mark svg{width:48px;height:48px;display:block}
h2{font-size:clamp(14px,calc((100vw - 40px) / 23.2),2.15rem);letter-spacing:-.03em;line-height:1.2;margin:0 0 12px;font-weight:800}
.sec-head h2{white-space:nowrap;max-width:100%}
.sec-head p{color:var(--text-2);margin:0;max-width:54ch;line-height:1.6}
.sec-head.center{text-align:center;display:flex;flex-direction:column;align-items:center;margin-left:auto;margin-right:auto}
.sec-head.center p{margin:0 auto;max-width:min(54ch,100%);text-align:center}
.grid{display:grid;gap:18px}
@media(min-width:640px){.grid.c2{grid-template-columns:repeat(2,1fr)}}
@media(min-width:640px) and (max-width:959px){.grid.c3{grid-template-columns:repeat(2,1fr)}}
@media(min-width:960px){.grid.c3{grid-template-columns:repeat(3,1fr)}.sec-head{max-width:none}}

/* Kartlar - Asla gizli/kayıp kalmaz, opacity 1 */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:26px;box-shadow:var(--shadow);transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s ease,border-color .25s ease;position:relative;overflow:hidden;min-width:0}
@media(max-width:520px){.card{padding:20px 18px}.card h3{font-size:17px}}
.f-ic{width:50px;height:50px;border-radius:15px;background:color-mix(in srgb,var(--brand) 12%,transparent);
  color:var(--brand);display:flex;align-items:center;justify-content:center;margin-bottom:16px;border:1px solid color-mix(in srgb,var(--brand) 18%,transparent)}
.f-ic svg{width:25px;height:25px}
.card h3{margin:0 0 8px;font-size:18px;font-weight:800;letter-spacing:-.015em}
.card p{margin:0;color:var(--muted);font-size:14.5px;line-height:1.6}

/* Topluluk: kompakt katkıcı şeridi — çok kişi sığsın diye chip boyutunda.
   Kurucular sabit durur; depo açılınca GitHub API katkıcıları aynı satıra
   chip olarak eklenir (kurucular tekrar edilmez). */
.contrib-row{display:flex;flex-wrap:wrap;gap:10px 6px;justify-content:center;max-width:920px;margin:0 auto}
.contrib-chip{display:flex;flex-direction:column;align-items:center;gap:4px;width:auto;
  padding:8px 12px 6px;border-radius:14px;text-decoration:none;color:inherit;transition:transform .2s ease,background .2s ease}
.contrib-chip:hover{transform:translateY(-3px);background:color-mix(in srgb,var(--brand) 10%,transparent)}
.contrib-chip img{width:44px;height:44px;border-radius:50%;border:2px solid var(--brand)}
.contrib-login{font-size:10px;font-weight:600;color:var(--muted);white-space:nowrap}
.contrib-role{font-size:9px;font-weight:700;letter-spacing:.02em;padding:1px 7px;border-radius:999px}
.contrib-role.is-owner{color:#b45309;background:color-mix(in srgb,#f59e0b 14%,transparent)}
html[data-theme=dark] .contrib-role.is-owner{color:#fbbf24;background:color-mix(in srgb,#f59e0b 16%,transparent)}
.contrib-role.is-maintainer{color:var(--brand-press);background:color-mix(in srgb,var(--brand) 12%,transparent)}
html[data-theme=dark] .contrib-role.is-maintainer{color:#93b4ff;background:color-mix(in srgb,var(--brand) 16%,transparent)}

/* Nasıl Çalışır (1-2-3 Adım Tasarımı) */
.steps{display:grid;gap:20px;counter-reset:st;position:relative}
@media(min-width:800px){.steps{grid-template-columns:repeat(3,1fr)}}
.step{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px 22px;box-shadow:var(--shadow);transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s ease,border-color .3s ease;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);display:flex;flex-direction:column}
.step-top-row{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.step-n{width:36px;height:36px;border-radius:12px;background:var(--brand-grad);
  color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(76,125,255,.35);flex-shrink:0}
.step-micro-pill{font-size:11px;font-weight:800;letter-spacing:.06em;color:var(--muted);background:none;padding:0;border:0;border-radius:0;margin-left:auto;white-space:nowrap}
.step-icon-bubble{width:34px;height:34px;border-radius:10px;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--brand);flex-shrink:0}
.step-icon-bubble svg{width:17px;height:17px}
.step h3{margin:0 0 8px;font-size:17.5px;font-weight:800;letter-spacing:-.015em}
.step p{margin:0;color:var(--muted);font-size:13.5px;line-height:1.6}

/* Entegrasyonlar — masaüstü TCP ayrı zayıf kolon değil, HTTP'nin üstüne ekstra. */
.int-groups{display:grid;gap:16px}
.int-groups .card{display:flex;flex-direction:column}
.int-logo-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 12px}
.int-logo-row .brand-svg,.int-logo-row .icon{width:28px;height:28px;border-radius:8px}
.int-kicker{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
  color:var(--brand);background:none;border:0;border-left:2px solid var(--brand);border-radius:0;
  padding:0 0 0 10px;margin-bottom:10px;width:fit-content}
.int-groups .card h3{margin:0 0 8px}
.int-hint{margin:0 0 4px;color:var(--muted);font-size:13.5px;line-height:1.55}
.int-desktop{display:grid;gap:16px;padding:22px 24px;border-radius:var(--radius-lg);border:1px solid color-mix(in srgb,var(--brand) 28%,var(--border));
  background:linear-gradient(135deg,var(--surface) 0%,color-mix(in srgb,var(--brand) 8%,var(--surface)) 100%);box-shadow:var(--shadow)}
@media(min-width:720px){.int-desktop{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);align-items:center}}
.int-desktop .chips{margin-top:0}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.chip{display:inline-flex;align-items:center;gap:8px;background:var(--surface-2);border:1px solid var(--border);
  border-radius:12px;padding:7px 11px 7px 8px;min-height:40px;font-size:13px;font-weight:700;color:var(--text);
  transition:border-color .18s ease,box-shadow .18s ease;line-height:1.2}
.chip .brand-svg{width:22px;height:22px;border-radius:6px}
.chip:hover{transform:translateY(-2px);border-color:var(--brand);box-shadow:0 6px 18px rgba(76,125,255,.2);background:var(--surface)}
.int-more{margin-top:22px;display:inline-flex;align-items:center;gap:8px;min-height:44px;color:var(--brand);font:700 14px Inter,sans-serif;background:none;border:none;padding:10px 4px;cursor:pointer;transition:color .18s ease}
.int-more:hover{color:var(--brand-press);text-decoration:underline}
/* Matter/Zigbee: doğrudan bağlayıcı yok; HA köprüsü ayrı kartta anlatılır. */
.int-note,.int-bridge{margin:18px 0 0;padding:22px;border-radius:var(--radius-lg);border:1px solid var(--border);
  background:var(--surface);box-shadow:var(--shadow);color:var(--text-2)}
.int-bridge{display:grid;gap:18px}
@media(min-width:720px){.int-bridge{grid-template-columns:1.1fr .9fr;align-items:center}}
.int-bridge-kicker{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--brand);margin:0 0 8px}
.int-bridge h3{margin:0 0 8px;font-size:18px;font-weight:800;color:var(--text)}
.int-bridge p{margin:0;color:var(--muted);font-size:14px;line-height:1.6}
.int-bridge-points{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.int-bridge-points li{display:flex;gap:10px;align-items:flex-start;background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:12px 14px;font-size:13.5px;line-height:1.45;color:var(--text)}
.int-bridge-points .brand-svg,.int-bridge-points .icon{width:22px;height:22px;flex-shrink:0;margin-top:1px}

/* Fiyatlar */
#pricing{padding:48px 0 54px}
.billing-toggle-wrap{display:flex;align-items:center;justify-content:center;margin:0 0 24px}
.billing-toggle{display:inline-flex;flex-wrap:wrap;align-items:center;justify-content:center;max-width:100%;background:var(--surface);border:1px solid var(--border);
  border-radius:999px;padding:4px;box-shadow:var(--shadow)}
.billing-btn{border:0;background:transparent;color:var(--muted);font:700 13px/1 Inter,sans-serif;
  padding:8px 16px;border-radius:999px;cursor:pointer;transition:all .18s ease;display:inline-flex;align-items:center;gap:6px;min-height:40px}
.billing-btn.active{background:var(--brand-grad);color:#fff;box-shadow:0 4px 14px rgba(76,125,255,.35)}
.save-badge{font-size:11px;font-weight:800;background:rgba(255,255,255,.25);padding:3px 7px;border-radius:6px}
.billing-btn:not(.active) .save-badge{background:color-mix(in srgb,var(--brand) 15%,transparent);color:var(--brand)}

.plans{display:grid;gap:18px;width:100%;max-width:1100px;margin:22px auto 0}
@media(min-width:960px){.plans{grid-template-columns:repeat(3,1fr);align-items:stretch}}
@media(min-width:720px) and (max-width:959px){.plans{grid-template-columns:repeat(2,minmax(0,1fr));max-width:720px;margin:22px auto 0}.plan.hot{grid-column:1 / -1}}
@media(max-width:719px){.plans{grid-template-columns:1fr;max-width:440px;margin:22px auto 0}}
.plan{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:24px 20px 20px;box-shadow:var(--shadow);display:flex;flex-direction:column;height:100%;
  box-sizing:border-box;transition:transform .25s ease,box-shadow .25s ease}
.plan.hot{border:2px solid transparent;background-clip:padding-box;box-shadow:0 20px 50px rgba(76,125,255,.18)}
/* Popüler plan: dönen gradyan çerçeve (premium fiyat sayfası örüntüsü).
   Mask-halka tekniği: yalnızca 2px'lik halka çizilir, kart içeriği asla kapanmaz.
   @property desteklemeyen tarayıcılarda halka sabit gradyan olarak kalır. */
.plan.hot::before{content:"";position:absolute;inset:-2px;border-radius:30px;padding:2px;
  background:conic-gradient(from var(--nx-ang,0deg),#4C7DFF 0%,#22D3EE 30%,#8B7BFF 60%,#4C7DFF 100%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  mask-composite:exclude;
  animation:nx-rot 6s linear infinite;pointer-events:none}
@property --nx-ang{syntax:'<angle>';inherits:false;initial-value:0deg}
@keyframes nx-rot{to{--nx-ang:360deg}}
.plan-badge{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:var(--brand-grad);color:#fff;font-size:10.5px;font-weight:800;
  letter-spacing:.06em;text-transform:uppercase;padding:4px 11px;border-radius:8px;box-shadow:0 4px 12px rgba(76,125,255,.35);white-space:nowrap}
.plan-head{min-height:auto;margin-bottom:6px;display:flex;flex-direction:column;justify-content:flex-start}
.plan-logo{width:44px;height:44px;border-radius:14px;margin:4px 0 12px;display:flex;align-items:center;justify-content:center;
  background:color-mix(in srgb,var(--brand) 12%,transparent);color:var(--brand);flex-shrink:0}
.plan-logo .icon{width:22px;height:22px}
.plan.hot .plan-logo{background:color-mix(in srgb,var(--brand) 20%,transparent)}
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
.dl-top{display:flex;flex-direction:column;align-items:flex-start;gap:4px;margin-bottom:18px}
.dl-ic{width:46px;height:46px;border-radius:12px;background:var(--surface-2);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;margin-bottom:8px}
.dl-ic svg{width:26px;height:26px}
.dl-top h3{margin:0;font-size:18px;font-weight:800}
.plat{color:var(--muted);font-size:13px;font-weight:500}
.dl-meta{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 22px}
.dl-meta span,.dl-sums{background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:5px 10px;
  font-size:12px;font-weight:600;color:var(--text-2);box-shadow:0 1px 3px rgba(0,0,0,.02)}
/* Parmak hedefi: sağlama rozeti tıklanabilir, bu yüzden yüksekliği 28px'e çekiliyor. */
.dl-sums{display:inline-flex;align-items:center;padding:7px 11px;min-height:28px;text-decoration:none;
  transition:border-color .2s ease,color .2s ease}
.dl-sums:hover{border-color:var(--brand);color:var(--brand)}
.dl-card .btn{width:100%}
.dl-note{font-size:13px;color:var(--muted);margin-top:20px;text-align:center}
.dl-web-card{margin-top:22px;padding:26px 28px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
  box-shadow:var(--shadow);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:20px;
  background:linear-gradient(135deg,var(--surface) 0%,color-mix(in srgb,var(--brand) 6%,var(--surface)) 100%);
  transition:transform .2s ease,box-shadow .2s ease}
.dl-web-info{flex:1;min-width:0}
.dl-web-info h3{margin:0 0 6px;font-size:18px;font-weight:800}
.dl-web-info p{margin:0;color:var(--muted);font-size:14px;line-height:1.55}

/* SSS */
.faq-list{display:grid;gap:14px;max-width:800px;margin:0 auto}
.faq-item{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow)}
.faq-q{width:100%;text-align:left;background:transparent;border:0;padding:18px 18px;font:700 15px/1.4 Inter,sans-serif;
  color:var(--text);display:flex;justify-content:space-between;align-items:flex-start;cursor:pointer;gap:12px}
@media(min-width:640px){.faq-q{padding:20px 22px;font-size:16px;align-items:center}}
.faq-q span{flex:1;min-width:0}
.faq-q:hover{color:var(--brand)}
.faq-a{display:grid;grid-template-rows:0fr;overflow:hidden;padding:0 22px;color:var(--text-2);font-size:14.5px;line-height:1.6;
  transition:grid-template-rows .32s ease}
.faq-item.open .faq-a{grid-template-rows:1fr}
.faq-a-in{min-height:0;overflow:hidden}
.faq-a-in p{margin:2px 0 20px}
.faq-item.open .faq-q svg{transform:rotate(180deg)}
.faq-q svg{transition:transform .2s ease;width:18px;height:18px;color:var(--muted);flex-shrink:0}

/* Footer */
.ft{border-top:1px solid var(--border);background:color-mix(in srgb,var(--surface) 60%,transparent);padding:48px 0 34px;margin-top:24px}
.ft-grid{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:40px}
.ft-brand{max-width:390px;flex:1 1 260px}
.ft-links-group{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px;flex:1 1 420px;min-width:0;align-items:start}
.ft-col{min-width:0}
.ft h4{margin:0 0 14px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:800}
.ft a{display:block;font-size:13.5px;color:var(--text-2);padding:5px 0;transition:color .15s ease}
.ft a:hover{color:var(--brand)}
.ft a.logo{display:inline-flex !important;align-items:center !important;gap:10px !important;font-size:20px !important;
  font-weight:800 !important;color:var(--text) !important;padding:0 !important;text-decoration:none !important}
.ft a.logo svg{width:32px !important;height:32px !important;flex-shrink:0 !important}
.ft-brand p{color:var(--muted);font-size:13.5px;margin:12px 0 16px;max-width:44ch;line-height:1.6}
.ft-trust-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.ft-trust-badge,.ft-trust-pill{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;line-height:1;
  color:var(--text-2);padding:6px 13px;border-radius:999px;
  background:color-mix(in srgb,var(--surface) 80%,transparent);border:1px solid var(--border);
  box-shadow:0 1px 3px rgba(0,0,0,0.03);letter-spacing:0.01em;transition:all .2s ease}
.ft-trust-pill:hover{border-color:color-mix(in srgb,var(--brand) 40%,var(--border));color:var(--text);transform:translateY(-1px)}
.ft-trust-pill .icon{width:14px;height:14px;color:var(--brand);flex-shrink:0}
.ft-status-dot{width:7px;height:7px;border-radius:50%;background:#10B981;box-shadow:0 0 8px rgba(16,185,129,0.7);flex-shrink:0;animation:nxStatusPulse 2.5s infinite}
@keyframes nxStatusPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(1.2)}}
.nx-form-success{display:none;text-align:center;padding:24px 16px}
.nx-form-success svg{width:46px;height:46px;color:#10B981;margin:0 auto 12px;display:block}
.nx-form-success h4{margin:0 0 8px;font-size:18px;font-weight:800;color:var(--text)}
.nx-form-success p{margin:0 0 18px;color:var(--muted);font-size:13.5px;line-height:1.55}
.ft-bottom{margin-top:36px;padding-top:20px;border-top:1px solid var(--border);display:flex;
  align-items:center;justify-content:center;text-align:center;gap:12px 16px;color:var(--muted);font-size:13px}
.ft-privacy{display:inline-flex;align-items:flex-start;gap:8px;font-weight:600;text-align:left;min-width:0}
.ft-privacy .icon{width:16px;height:16px;color:var(--brand);flex-shrink:0;margin:2px 0 0}
@media(max-width:768px){
  .ft{padding:32px 0 22px;margin-top:16px}
  .ft-grid{flex-direction:column;gap:28px}
  .ft-brand{flex:none;max-width:none;width:100%}
  .ft-brand p{max-width:none;margin:12px 0 14px;font-size:14px;line-height:1.65}
  .ft-trust-row{margin-top:12px;gap:10px 14px}
  .ft-links-group{flex:none;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 28px;width:100%;align-items:start}
  .ft-col:last-child{grid-column:1 / -1;display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 16px}
  .ft-col:last-child h4{width:100%;margin:0 0 6px}
  .ft h4{margin-bottom:12px}
  .ft a{font-size:14px;padding:6px 0}
  .ft-bottom{margin-top:24px;padding-top:16px;gap:10px 16px;font-size:13px}
}
@media(max-width:480px){
  .ft{padding:28px 0 18px}
  .ft h4{font-size:11px;margin-bottom:10px;line-height:1.35}
  .ft a{font-size:13.5px;padding:5px 0}
  .ft-bottom{margin-top:20px;padding-top:14px}
}

/* İçerikler varsayılan olarak görünür (opacity 1). JS + IntersectionObserver
   destekliyorsa site-boot.js <html>'e nx-io ekler ve .rv öğeleri görünüme girince
   yumuşakça belirir (AOS örüntüsü: eşik 0.12, kardeşler arası kademeli gecikme).
   JS çalışmazsa nx-io hiç eklenmez → içerik her zaman görünür kalır. */
.rv{opacity:1;transform:none}
html.nx-io .rv{opacity:0;transform:translateY(16px);
  transition:opacity .55s cubic-bezier(.22,.61,.36,1),transform .55s cubic-bezier(.22,.61,.36,1);
  transition-delay:calc(var(--rv-i,0)*70ms)}
html.nx-io .rv.rv-in{opacity:1;transform:translateY(0)}
@media (prefers-reduced-motion: reduce){html.nx-io .rv{opacity:1;transform:none;transition:none}}

/* ---------- Premium mikro-etkileşimler (koyu + açık temada aynı değişkenlerle) ---------- */
/* Birincil düğmede ışık süpürmesi */
.btn-primary{position:relative;overflow:hidden}
.btn-primary::after{content:"";position:absolute;top:-20%;bottom:-20%;left:-45%;width:34%;
  background:linear-gradient(105deg,transparent,rgba(255,255,255,.42),transparent);
  transform:skewX(-18deg);transition:left .6s ease;pointer-events:none}
.btn-primary:hover::after,.btn-primary:focus-visible::after{left:125%}
/* Başlık: sayfa kayınca hafif gölgeyle yükselir */
.hd{transition:box-shadow .28s ease}
html.nx-scrolled .hd{box-shadow:0 10px 30px rgba(2,6,23,.22)}
/* İndirme kartı: ziyaretçinin platformu ("Sizin için" rozetiyle) vurgulanır */
.dl-card.dl-you{border-color:color-mix(in srgb,var(--brand) 55%,transparent);
  box-shadow:0 14px 38px rgba(76,125,255,.22)}
.dl-you-badge{position:absolute;top:16px;right:16px;background:var(--brand-grad);color:#fff;
  font-size:10.5px;font-weight:800;letter-spacing:.05em;padding:4px 11px;border-radius:999px;
  box-shadow:0 4px 14px rgba(76,125,255,.35)}
/* Telefon maketi: 3B giriş animasyonu + fare takibi (vanilla-tilt örüntüsü).
   Yalnızca transform: düzen kayması yok; reduced-motion'da hepsi kapalı. */
.phone-wrapper{perspective:1100px}
.phone-case{transform-style:preserve-3d;will-change:transform;
  animation:nx-phone-in .9s cubic-bezier(.22,.61,.36,1) .25s backwards}
@keyframes nx-phone-in{from{opacity:0;transform:translateY(30px) rotateY(-14deg) scale(.96)}
  to{opacity:1;transform:translateY(0) rotateY(0) scale(1)}}
/* Işımanın kendi glowPulse nefesi var (aşağıda); telefon fare takibiyle serbest.
   Camda periyodik yansıma süpürmesi (overflow hidden — kadraj dışına taşmaz) */
.phone-glass-shine{overflow:hidden}
.phone-glass-shine::after{content:"";position:absolute;top:-30%;bottom:-30%;left:0;width:44%;
  background:linear-gradient(105deg,transparent,rgba(255,255,255,.16),transparent);
  transform:translateX(-160%) skewX(-18deg);animation:nx-shine 7s ease-in-out 2.5s infinite;pointer-events:none}
@keyframes nx-shine{0%{transform:translateX(-160%) skewX(-18deg)}
  24%{transform:translateX(340%) skewX(-18deg)}100%{transform:translateX(340%) skewX(-18deg)}}
/* Sayfa başına dön düğmesi */
.nx-to-top{position:fixed;right:22px;bottom:22px;z-index:90;width:44px;height:44px;border-radius:999px;
  border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;
  display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;
  transform:translateY(10px);box-shadow:var(--shadow);
  transition:opacity .25s ease,transform .25s ease,visibility .25s,border-color .2s ease,color .2s ease}
.nx-to-top.show{opacity:1;visibility:visible;transform:none}
.nx-to-top:hover{color:var(--brand);border-color:var(--brand);transform:translateY(-2px)}
.nx-to-top svg{width:18px;height:18px}
@media(max-width:640px){.nx-to-top{right:14px;bottom:14px}}
@media (prefers-reduced-motion: reduce){
  .btn-primary::after{display:none}
  .phone-case,.phone-glass-shine::after{animation:none}
  .plan.hot::before{animation:none}
  .nx-to-top{transition:none}
  .hd{transition:none}
}

/* About & Yasal Belge Sayfaları */
.about-hero{padding:72px 0 28px;max-width:720px}
.about-kicker{margin:0 0 10px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--brand)}
.about-hero h1{font-size:clamp(28px,4.6vw,44px);letter-spacing:-.03em;line-height:1.12;margin:0 0 14px;font-weight:800;white-space:normal}
.about-hero .lead{font-size:17px;line-height:1.65;max-width:58ch;color:var(--text-2);margin:0}
.about-back{margin:0 0 18px}
.about-body{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);
  padding:28px;margin:26px 0;display:grid;gap:14px}
.about-body p{margin:0;color:var(--text-2);font-size:15px}
.about-card h2{font-size:22px;margin:0 0 12px;font-weight:800;letter-spacing:-.02em;white-space:normal}
.about-card p{font-size:15px;line-height:1.75;color:var(--text-2);margin:0}
.about-section{margin:8px 0 40px}
.about-section > h2{font-size:22px;font-weight:800;letter-spacing:-.02em;margin:0 0 8px;white-space:normal}
.about-section > p{color:var(--muted);font-size:14.5px;margin:0 0 20px}
.about-arch{display:grid;gap:14px}
@media(min-width:720px){.about-arch{grid-template-columns:repeat(3,1fr)}}
.about-arch .card{padding:22px;height:100%}
.about-arch h3{font-size:16px;font-weight:800;margin:0 0 8px}
.about-arch p{font-size:14px;line-height:1.6;color:var(--text-2);margin:0}
.about-cta{margin:8px 0 24px;background:color-mix(in srgb,var(--brand) 6%,var(--surface))}
.about-cta-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.about-cta-actions .btn{margin:0;width:100%;justify-content:center}
.about-cta-actions .btn-primary{grid-column:1 / -1}
@media(min-width:640px){
  .about-cta-actions{display:flex;flex-wrap:wrap;gap:12px}
  .about-cta-actions .btn{width:auto;grid-column:auto}
}

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
  position:fixed;top:0;right:0;bottom:0;left:0;width:100%;height:100%;height:100dvh;
  background:rgba(0,0,0,.75);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  z-index:9999;display:none;align-items:center;justify-content:center;padding:12px;opacity:0;transition:opacity .22s ease;
  overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;-ms-overflow-style:none;
}
.nx-modal-backdrop::-webkit-scrollbar{width:0;height:0;display:none}
.nx-modal-backdrop.open{display:flex;opacity:1}
.nx-modal-card{
  background:var(--surface);border:1px solid var(--border);border-radius:24px;box-shadow:0 24px 64px -12px rgba(0,0,0,.55);
  width:100%;max-width:440px;max-height:min(96dvh, calc(100% - 8px));padding:22px 24px 20px;position:relative;
  transform:scale(.96);transition:transform .22s cubic-bezier(.16,1,.3,1);box-sizing:border-box;margin:auto;
  overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;
  scrollbar-width:none;-ms-overflow-style:none;
}
.nx-modal-card::-webkit-scrollbar{width:0;height:0;display:none}
#nxAuthModal.nx-account-open .nx-modal-card{
  max-width:420px;padding:28px 18px 16px;
  background:
    radial-gradient(90% 140px at 50% 0%, color-mix(in srgb, var(--brand) 16%, transparent), transparent 72%),
    #fff;
}
html[data-theme=dark] #nxAuthModal.nx-account-open .nx-modal-card{
  background:
    radial-gradient(90% 140px at 50% 0%, color-mix(in srgb, var(--brand) 22%, transparent), transparent 72%),
    var(--surface);
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
  width:38px;height:38px;border-radius:50%;background:rgba(15,23,42,.85);
  border:1.5px solid rgba(255,255,255,.22);color:#fff;display:flex;align-items:center;
  justify-content:center;cursor:pointer;backdrop-filter:blur(8px);box-shadow:0 6px 18px rgba(0,0,0,.5);
  transition:all .2s ease;padding:0;
}
.phone-arrow:hover{background:var(--brand);border-color:var(--brand);transform:translateY(-50%) scale(1.08)}
.phone-arrow svg{width:18px;height:18px}
.phone-arrow-left{left:-19px}
.phone-arrow-right{right:-19px}
@media(max-width:480px){
  .phone-arrow-left{left:-12px}
  .phone-arrow-right{right:-12px}
}

/* Navbar Giriş / Hesap Butonu & Avatar */
.nx-auth-btn{
  display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;padding:5px 14px 5px 8px;
  border-radius:999px;border:1px solid var(--border);background:var(--surface);color:var(--text);
  cursor:pointer;transition:all .18s ease;height:38px;box-sizing:border-box;
}
.nx-auth-btn:hover{border-color:var(--brand);color:var(--brand);background:var(--surface-2)}
.nx-auth-btn.logged-in{
  border-color:transparent;background:transparent;box-shadow:none;color:var(--text);padding:2px 6px 2px 2px;
}
.nx-auth-btn.logged-in:hover{background:color-mix(in srgb,var(--brand) 8%,transparent);border-color:transparent;color:var(--text)}
@media(max-width:520px){
  .nx-auth-btn{width:38px;padding:0;justify-content:center}
  .nx-auth-btn .nx-nav-label{display:none}
  .lang-switch{height:34px;padding:2px}
  .lang-btn{height:28px;padding:0 9px;font-size:11px}
  .theme-t{width:34px;height:34px}
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

/* Hesap merkezi: kimlik, plan, işlemler. Sahte bağlantı durumu yok. */
.nx-account{flex-direction:column}
.nx-account-person{
  display:flex;flex-direction:column;align-items:center;text-align:center;
  padding:8px 28px 18px;
}
.nx-profile-avatar-large{
  width:76px;height:76px;border-radius:50%;background:var(--brand-grad);color:#fff;
  display:flex;align-items:center;justify-content:center;margin-bottom:14px;
  flex-shrink:0;box-shadow:0 12px 28px rgba(76,125,255,.32);
  border:3px solid color-mix(in srgb,#fff 72%,var(--surface));overflow:hidden;
}
.nx-profile-avatar-large .nx-avatar-photo{width:100%;height:100%;object-fit:cover;display:block}
.nx-profile-avatar-large .nx-user-icon{width:40px;height:40px;color:#fff;display:block}
/* Avatar değiştirme (sitede de uygulamadaki gibi): fotoğrafın ÜZERİNE binen rozet
   yok — eylemler avatarın altında ayrı satırda durur, fotoğraf asla kapanmaz. */
.nx-avatar-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;align-items:center;margin:-4px 0 10px}
.nx-avatar-actions button{
  background:none;border:none;font:600 12px Inter,sans-serif;color:var(--muted);
  cursor:pointer;padding:2px 4px;text-decoration:underline;
}
.nx-avatar-actions button:hover{color:var(--brand)}
.nx-avatar-actions button.is-danger{color:#ef4444}
.nx-avatar-actions button.is-danger:hover{color:#dc2626}
.nx-avatar-actions .nx-avatar-change{
  display:inline-flex;align-items:center;gap:5px;color:var(--brand);font-weight:700;text-decoration:none;
}
.nx-avatar-actions .nx-avatar-change:hover{color:var(--brand-press)}
.nx-avatar-actions .nx-avatar-change svg{width:13px;height:13px}
.nx-profile-name-wrap{width:100%;min-width:0}
.nx-profile-name-row{display:flex;align-items:center;justify-content:center;gap:6px;max-width:100%}
.nx-profile-name-row h3{
  margin:0;font-size:22px;font-weight:800;letter-spacing:-.03em;color:var(--text);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;
}
.nx-edit-name-btn{
  width:28px;height:28px;border-radius:50%;background:var(--surface-2);border:1px solid var(--border);
  color:var(--muted);cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:color .15s ease,border-color .15s ease,background .15s ease;
}
.nx-edit-name-btn:hover{color:var(--brand);border-color:var(--brand);background:var(--surface)}
.nx-edit-name-btn svg{width:13px;height:13px}
.nx-profile-email-chip{
  display:block;margin-top:3px;font-size:13.5px;color:var(--muted);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.nx-account-now{
  margin:0 4px 10px;font-size:12.5px;font-weight:600;color:var(--muted);text-align:center;line-height:1.4;
}
.nx-offer{
  margin:0 2px 12px;padding:1px;border-radius:20px;background:var(--brand-grad);
  box-shadow:0 16px 36px rgba(76,125,255,.16);
}
.nx-offer-inner{
  background:var(--surface);border-radius:19px;padding:16px 16px 14px;
}
html[data-theme=dark] .nx-offer-inner{background:#101726}
.nx-offer-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.nx-plan-tag{
  background:var(--brand-grad);color:#fff;font-size:12px;font-weight:700;
  padding:4px 10px;border-radius:999px;line-height:1.2;white-space:nowrap;display:inline-flex;
}
.nx-plan-tag.is-free{background:var(--surface-2);color:var(--text);border:1px solid var(--border)}
.nx-offer-price{text-align:right;line-height:1}
.nx-offer-price b{font-size:22px;font-weight:800;letter-spacing:-.03em;color:var(--text)}
.nx-offer-price small{display:block;margin-top:3px;font-size:12px;font-weight:600;color:var(--muted)}
.nx-offer-list{list-style:none;margin:14px 0 0;padding:0;display:grid;gap:9px}
.nx-offer-list li{
  display:flex;align-items:flex-start;gap:8px;font-size:13.5px;font-weight:600;
  color:var(--text);line-height:1.35;
}
.nx-offer-list svg{width:16px;height:16px;color:#10B981;flex-shrink:0;margin-top:1px}
.nx-account-save{margin:8px 0 0;font-size:12.5px;color:var(--muted);line-height:1.4}
.nx-account-upgrade{
  display:flex;align-items:center;justify-content:center;margin-top:14px;min-height:44px;
  border-radius:999px;background:var(--brand-grad);color:#fff;font-weight:700;font-size:14.5px;
  text-decoration:none;box-shadow:0 8px 20px rgba(76,125,255,.28);
}
.nx-account-upgrade:hover{opacity:.94}
a.nx-account-item{text-decoration:none;color:inherit;box-sizing:border-box}
.nx-offer-list.is-hidden,.nx-account-item.is-hidden,.nx-account-upgrade.is-hidden,.nx-account-save.is-hidden,.nx-account-now.is-hidden,.nx-offer-price.is-hidden{display:none !important}
.nx-account-menu{
  border:1px solid var(--border);border-radius:18px;overflow:hidden;background:var(--surface-2);margin:0 2px;
}
.nx-account-item{
  width:100%;display:flex;align-items:center;gap:12px;padding:12px 14px;background:transparent;
  border:0;border-top:1px solid var(--border);color:var(--text);cursor:pointer;text-align:left;font:inherit;
}
.nx-account-item:first-child{border-top:0}
.nx-account-item:hover{background:color-mix(in srgb,var(--brand) 8%,transparent)}
.nx-account-ico{
  width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;
  background:color-mix(in srgb,var(--brand) 12%,var(--surface));color:var(--brand);flex-shrink:0;
}
.nx-account-ico svg{width:16px;height:16px}
.nx-account-item-copy{display:flex;flex-direction:column;min-width:0;flex:1;gap:1px}
.nx-account-item-copy b{font-size:14px;font-weight:700;letter-spacing:-.01em}
.nx-account-item-copy small{font-size:12px;color:var(--muted);font-weight:500}
.nx-account-chevron{color:var(--muted);display:flex;flex-shrink:0}
.nx-account-chevron svg{width:16px;height:16px}
.nx-account-signout .nx-account-ico{
  background:color-mix(in srgb,var(--danger) 12%,var(--surface));color:var(--danger);
}
.nx-account-signout .nx-account-item-copy b{color:var(--danger)}
.nx-contact-security-note{
  font-size:12.5px;color:var(--text-2);margin:12px 0 0;text-align:left;display:flex;align-items:flex-start;
  justify-content:flex-start;gap:10px;line-height:1.45;padding:12px 14px;border-radius:14px;
  background:color-mix(in srgb,var(--brand) 8%,var(--surface-2));border:1px solid color-mix(in srgb,var(--brand) 18%,var(--border));
}
.nx-contact-security-note svg{width:16px;height:16px;color:var(--brand);flex-shrink:0;margin-top:1px}

/* Özel NEXUS Dialog (Alert / Prompt) */
.nx-dialog-backdrop{
  position:fixed;top:0;right:0;bottom:0;left:0;width:100%;height:100%;height:100dvh;
  background:rgba(0,0,0,.75);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  z-index:10050;display:none;align-items:center;justify-content:center;padding:12px;opacity:0;transition:opacity .2s ease;
  overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;-ms-overflow-style:none;
}
.nx-dialog-backdrop::-webkit-scrollbar{width:0;height:0;display:none}
.nx-dialog-backdrop.open{display:flex;opacity:1}
.nx-dialog-card{
  background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:22px 24px 20px;
  width:100%;max-width:380px;max-height:min(96dvh, calc(100% - 8px));text-align:center;box-shadow:0 24px 64px rgba(0,0,0,.55);
  transform:scale(.95);transition:transform .2s cubic-bezier(.16,1,.3,1);box-sizing:border-box;margin:auto;
  overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;-ms-overflow-style:none;
}
.nx-dialog-card::-webkit-scrollbar{width:0;height:0;display:none}
.nx-modal-backdrop,.nx-modal-backdrop *,
.nx-dialog-backdrop,.nx-dialog-backdrop *{
  scrollbar-width:none !important;-ms-overflow-style:none !important;
}
.nx-modal-backdrop::-webkit-scrollbar,.nx-modal-backdrop *::-webkit-scrollbar,
.nx-dialog-backdrop::-webkit-scrollbar,.nx-dialog-backdrop *::-webkit-scrollbar{
  width:0 !important;height:0 !important;display:none !important;background:transparent !important;
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

/* ---------- Modal: kaydırmasız tam görünüm ----------
   Kart içerikleri ekran yüksekliği daraldıkça zarifçe sıkışır; normal masaüstü
   ve telefon yüksekliklerinde kaydırma hiç devreye girmez — her şey görünür.
   Çok kısa ekranlarda (yatay telefon) gizli kaydırma son çare olarak kalır. */
.nx-modal-card{display:flex;flex-direction:column}
@media (max-height:840px){
  .nx-modal-card{padding:18px 22px 16px}
  #nxAuthModal.nx-account-open .nx-modal-card{padding:22px 18px 14px}
  .nx-account-person{padding:2px 24px 12px}
  .nx-profile-avatar-large{width:62px;height:62px;margin-bottom:10px}
  .nx-profile-name-row h3{font-size:19px}
  .nx-offer-inner{padding:13px 14px 12px}
  .nx-offer-list{gap:6px;margin-top:10px}
  .nx-account-upgrade{min-height:40px;margin-top:10px}
  .nx-app-input{height:38px}
  .nx-app-textarea{min-height:50px}
  .nx-app-submit{height:40px;margin-top:4px}
  .nx-auth-brand-badge h3{font-size:18px}
  #nxCheckoutMount{min-height:340px}
}
@media (max-height:700px){
  .nx-modal-card{padding:14px 18px 12px;border-radius:20px}
  #nxAuthModal.nx-account-open .nx-modal-card{padding:16px 16px 10px}
  .nx-app-logo{width:32px;height:32px;margin-bottom:4px}
  .nx-auth-brand-badge h3{font-size:16.5px;margin-bottom:2px}
  .nx-auth-brand-badge p{font-size:12px}
  .nx-field-label{font-size:10px}
  .nx-auth-field-wrap{margin-bottom:6px}
  .nx-app-input{height:36px;font-size:13px}
  .nx-app-textarea{min-height:44px;padding:6px 12px}
  .nx-app-submit{height:38px;font-size:13.5px;margin-top:3px}
  .nx-google-btn{height:36px;margin-top:5px}
  .nx-auth-links{gap:3px;margin-top:8px}
  .nx-auth-alert{padding:6px 10px;margin-bottom:6px}
  .nx-account-person{padding:0 18px 8px}
  .nx-profile-avatar-large{width:52px;height:52px;margin-bottom:8px}
  .nx-profile-name-row h3{font-size:17px}
  .nx-profile-email-chip{font-size:12.5px;margin-top:2px}
  .nx-account-now{margin-bottom:7px}
  .nx-offer{margin-bottom:8px}
  .nx-offer-inner{padding:11px 12px 10px;border-radius:17px}
  .nx-offer-price b{font-size:19px}
  .nx-offer-list{gap:5px;margin-top:8px}
  .nx-offer-list li{font-size:12.5px}
  .nx-account-item{padding-top:9px;padding-bottom:9px;gap:10px}
  .nx-account-ico{width:30px;height:30px;border-radius:10px}
  .nx-account-item-copy b{font-size:13px}
  .nx-account-item-copy small{font-size:11px}
  .nx-account-upgrade{min-height:36px;margin-top:9px;font-size:13.5px}
  .nx-account-save{margin-top:5px;font-size:11.5px}
  .nx-contact-security-note{padding:9px 12px;margin-top:9px;font-size:12px}
  .nx-modal-close{top:10px;right:10px;width:26px;height:26px}
  #nxCheckoutMount{min-height:280px}
}
@media (max-height:580px){
  .nx-modal-card{padding:12px 14px 10px}
  .nx-profile-avatar-large{width:44px;height:44px;margin-bottom:6px}
  .nx-offer-list{gap:4px}
  .nx-offer-list li{font-size:12px}
  .nx-app-input{height:34px}
  .nx-app-textarea{min-height:38px}
  .nx-app-submit,.nx-google-btn{height:34px}
  .nx-account-item{padding-top:7px;padding-bottom:7px}
}

/* Hakkında Sayfası Kartları */
.about-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);padding:30px}
`;

// ---------- Sayfa Davranış Betiği (site.js) ----------
function pageJs() {
  return `
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

// Modal açıkken sayfa kaymasın: gövde sabitlenir, tekerlek arka plana gitmez.
var nxScrollY=0;
var nxScrollLocked=false;
// Kilit sırasında kutusu piksele sabitlenen öğeler (gövde + sabit başlık).
// Kaydırma çubuğunun şeridi kilitte serbest kaldığı için sabit kutu genişler;
// bu öğeler eski genişliklerinde tutulmazsa navbar ve içerik kayar.
var nxPinned=[];
function nxPinBox(el,w){
  if(!el||!(w>0))return;
  el.style.left='0';
  el.style.right='auto';
  el.style.width=w+'px';
  nxPinned.push(el);
}
function nxUnpinBoxes(){
  while(nxPinned.length){
    var el=nxPinned.pop();
    el.style.left=''; el.style.right=''; el.style.width='';
  }
}
function nxGuardModalScroll(e){
  var node=e.target;
  while(node && node!==document.body){
    if(node.classList && (node.classList.contains('nx-modal-card') || node.classList.contains('nx-dialog-card'))){
      if(node.scrollHeight<=node.clientHeight+1){ e.preventDefault(); return; }
      if(e.touches) return;
      var dy=e.deltaY||0;
      if((dy<0 && node.scrollTop<=0) || (dy>0 && node.scrollTop+node.clientHeight>=node.scrollHeight-1)) e.preventDefault();
      return;
    }
    node=node.parentNode;
  }
  e.preventDefault();
}
function nxLockScroll(){
  // KİLİTLEMEDEN ÖNCE gövde ve başlığın gerçek genişliği ölçülür. Neden padding değil
  // de piksel genişlik: html overflow:hidden olunca kaydırma çubuğu VE ayırdığı şerit
  // kayboluyor (clientWidth 505 -> 520 ölçüldü). Sabit gövdenin containing block'u bu
  // şeridi zaten dışlıyor; üstüne bir de paddingRight=çubuk eklenince kutu iki kez
  // daralıyor ve margin:auto ile ortalanan içerik ~7.5px sola kayıyordu — sabit navbar
  // bundan etkilenmediği için kaymazdı, "sadece içerik kayıyor" görüntüsü buydu.
  // Şerit artık kilitte serbest (html.nx-modal-open{scrollbar-gutter:auto}), o yüzden
  // sabit kutu da genişliyor: gövde ve başlık kilit anındaki kutularına kilitlenir.
  var b=document.body;
  var nxBodyW=b.getBoundingClientRect().width;
  var nxHdr=document.querySelector('.hd');
  var nxHdrW=nxHdr?nxHdr.getBoundingClientRect().width:0;
  document.documentElement.classList.add('nx-modal-open');
  if(nxScrollLocked) return;
  nxScrollLocked=true;
  nxScrollY=window.scrollY||document.documentElement.scrollTop||0;
  b.style.position='fixed';
  b.style.top='-'+nxScrollY+'px';
  b.style.paddingRight='';
  nxPinBox(b,nxBodyW);
  nxPinBox(nxHdr,nxHdrW);
  document.addEventListener('wheel',nxGuardModalScroll,{passive:false,capture:true});
  document.addEventListener('touchmove',nxGuardModalScroll,{passive:false,capture:true});
}
function nxUnlockScroll(){
  var anyOpen=document.querySelectorAll('.nx-modal-backdrop.open,.nx-dialog-backdrop.open').length>0;
  if(anyOpen) return;
  document.documentElement.classList.remove('nx-modal-open');
  if(!nxScrollLocked) return;
  nxScrollLocked=false;
  document.removeEventListener('wheel',nxGuardModalScroll,true);
  document.removeEventListener('touchmove',nxGuardModalScroll,true);
  var b=document.body;
  b.style.position='';
  b.style.top='';
  b.style.paddingRight='';
  nxUnpinBoxes();
  // html{scroll-behavior:smooth} yüzünden bu geri yazma animasyonlu olurdu:
  // kapanışta istemsiz kaydırma animasyonu tetiklenmesin diye anında, sert geri yazılır.
  var de=document.documentElement;
  var prevBehavior=de.style.scrollBehavior;
  de.style.scrollBehavior='auto';
  window.scrollTo(0,nxScrollY);
  de.style.scrollBehavior=prevBehavior;
}

// İletişim & Destek Modülü Kontrolleri
function nxOpenContactModal(category){
  var m=document.getElementById('nxContactModal');
  if(!m)return;
  var form=document.getElementById('nxContactForm');
  var successEl=document.getElementById('nxContactSuccess');
  if(form)form.style.display='block';
  if(successEl)successEl.style.display='none';
  if(category){
    var sel=document.getElementById('nxContactCategory');
    if(sel)sel.value=category;
  }
  m.style.display='flex';
  setTimeout(function(){m.classList.add('open')},10);
  nxLockScroll();
}

// Mojibake Karakter Düzeltici & UTF-8 JWT Çözücü
function nxFixMojibake(str){
  if(!str)return '';
  try{
    if(/[\u00C2-\u00C5]/.test(str)){
      var bytes=new Uint8Array(str.length);
      for(var i=0;i<str.length;i++)bytes[i]=str.charCodeAt(i)&0xff;
      // NOTE: pageJs() is one big template literal. An unescaped hex escape would
      // be parsed at generation time into a REAL U+FFFD and land in site.js,
      // tripping the encoding guard. Doubling the backslash keeps it as text;
      // the browser parses the escape identically at runtime.
      var decoded=new TextDecoder('utf-8').decode(bytes);
      if(decoded && !decoded.includes('\\uFFFD'))return decoded;
    }
  }catch(e){}
  return str;
}
function nxDecodeJwt(token){
  try{
    var base64Url=token.split('.')[1];
    var base64=base64Url.replace(/-/g,'+').replace(/_/g,'/');
    while(base64.length%4)base64+='=';
    var binary=atob(base64);
    var bytes=new Uint8Array(binary.length);
    for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
  }catch(e){
    try{return JSON.parse(atob(token.split('.')[1]));}catch(err){return {};}
  }
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

// Uygulamada değiştirilen profil fotoğrafı (nexus_user_state → nexusAvatar) sitede de
// görünsün: giriş oturumu varsa hesabın senkronlu avatar değeri çekilir ve Google
// metadata avatarının önüne geçer. Uygulama ile aynı görünüm — avatar her yerde aynı.
// Satır yoksa (kullanıcı hiç uygulamadan giriş yapmadıysa) metadata avatarı kalır;
// satır varsa ve boşsa fotoğraf kaldırılmış demektir, varsayılan ikon gösterilir.
function nxFetchSyncedAvatar(){
  try{
    if(window.nxAvatarSaving) return; // yerel kayıt sürüyor: eski uzak değer geri çekilmesin
    var pending=null;
    try{ pending=localStorage.getItem('nxAvatarPending'); }catch(e){}
    if(pending){
      var pv='';
      try{ pv=(JSON.parse(pending)||{}).v; if(typeof pv!=='string') pv=''; }catch(e){}
      nxSiteSaveAvatar(pv); // önceki kayıt buluta gidemedi: önce onu tamamla
      return;
    }
    var s=nxCloudSession();
    if(!s||!s.accessToken||!s.userId) return;
    var cfg=nxCloudConfig();
    if(!cfg.url||!cfg.anonKey) return;
    var url=cfg.url+'/rest/v1/nexus_user_state?select=value&key=eq.nexusAvatar&user_id=eq.'+encodeURIComponent(s.userId);
    fetch(url,{headers:{apikey:cfg.anonKey,Authorization:'Bearer '+s.accessToken}})
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(rows){
        var now=nxCloudSession();
        if(!now||!now.userId||now.userId!==s.userId) return; // çıkış yapıldı ya da başka hesaba geçildi
        if(!rows||!rows.length) return; // hiç senkronlanmamış: metadata avatarı geçerli
        var v=(rows[0]&&typeof rows[0].value==='string')?rows[0].value:'';
        var cur=null;
        try{ cur=localStorage.getItem('nexusUserAvatar'); }catch(e){}
        if(v===cur) return;
        try{ localStorage.setItem('nexusUserAvatar', v); }catch(e){}
        nxUpdateNavAuth();
        var profileWrap=document.getElementById('nxProfileAvatarWrap');
        if(profileWrap) profileWrap.innerHTML = nxGetAvatarHtml(true);
      })
      .catch(function(){ /* çevrimdışı / erişilemedi: metadata avatarı kalır */ });
  }catch(e){}
}

// --- Sitede avatar değiştirme (uygulamadaki akışın karşılığı) -----------------
// Seçilen dosya 256px JPEG'e sıkıştırılır, yerelde uygulanır ve nexus_user_state
// (key=nexusAvatar) satırına yazılır; uygulama aynı satırdan okuduğu için avatar
// her yerde değişmiş olur. Kayıt buluta gidemezse kuyrukta bekler ve
// nxFetchSyncedAvatar bir sonraki açılışta önce onu tamamlar.
function nxSitePickAvatar(){
  var inp=document.getElementById('nxAvatarFileInput');
  if(inp) inp.click();
}

function nxSiteAvatarFile(input){
  var file=input.files&&input.files[0];
  if(!file) return;
  var reader=new FileReader();
  reader.onload=function(e){
    var raw=e.target.result;
    var img=new Image();
    img.onload=function(){
      try{
        var canvas=document.createElement('canvas');
        var maxDim=256;
        var scale=Math.min(maxDim/img.width,maxDim/img.height,1);
        canvas.width=Math.round(img.width*scale);
        canvas.height=Math.round(img.height*scale);
        var ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        nxSiteApplyAvatar(canvas.toDataURL('image/jpeg',0.85));
      }catch(err){ nxSiteApplyAvatar(raw); }
    };
    img.onerror=function(){ nxSiteApplyAvatar(raw); };
    img.src=raw;
  };
  reader.readAsDataURL(file);
  input.value='';
}

function nxSiteAvatarUpsert(val){
  try{
    var s=nxCloudSession();
    if(!s||!s.accessToken||!s.userId) return Promise.resolve(false);
    var cfg=nxCloudConfig();
    if(!cfg.url||!cfg.anonKey) return Promise.resolve(false);
    return fetch(cfg.url+'/rest/v1/nexus_user_state',{
      method:'POST',
      headers:{
        apikey:cfg.anonKey,
        Authorization:'Bearer '+s.accessToken,
        'Content-Type':'application/json',
        Prefer:'resolution=merge-duplicates'
      },
      body:JSON.stringify({user_id:s.userId,key:'nexusAvatar',value:val,updated_at:new Date().toISOString()})
    }).then(function(r){ return r.ok; },function(){ return false; });
  }catch(e){ return Promise.resolve(false); }
}

function nxSiteSaveAvatar(val){
  window.nxAvatarSaving=true;
  nxSiteAvatarUpsert(val).then(function(ok){
    window.nxAvatarSaving=false;
    try{
      if(ok) localStorage.removeItem('nxAvatarPending');
      else localStorage.setItem('nxAvatarPending', JSON.stringify({v:val}));
    }catch(e){}
  });
}

function nxSiteApplyAvatar(val){
  // "Google fotoğrafına dön" YALNIZCA Google girişinden gelen fotoğrafı saklar:
  // Google hesap avatarı her zaman googleusercontent.com'da barınır. Başka bir
  // https adresi (elle atanmış metadata vb.) geri dönüş kaynağı sayılmaz, böylece
  // seçenek e-posta ile giren kullanıcılara asla görünmez.
  var cur=null;
  try{ cur=localStorage.getItem('nexusUserAvatar'); }catch(e){}
  if(cur && cur.indexOf('data:')!==0 && cur!==val && /googleusercontent\.com|ggpht\.com/i.test(cur)){
    try{ localStorage.setItem('nexusUserGoogleAvatar', cur); }catch(e){}
  }
  try{ localStorage.setItem('nexusUserAvatar', val); }catch(e){}
  nxSiteSaveAvatar(val);
  nxUpdateNavAuth();
  var profileWrap=document.getElementById('nxProfileAvatarWrap');
  if(profileWrap) profileWrap.innerHTML = nxGetAvatarHtml(true);
  nxSiteAvatarActions();
}

function nxSiteRevertGoogleAvatar(){
  var g=null;
  try{ g=localStorage.getItem('nexusUserGoogleAvatar'); }catch(e){}
  if(g) nxSiteApplyAvatar(g);
}

function nxSiteRemoveAvatar(){
  nxSiteApplyAvatar('');
}

function nxSiteAvatarActions(){
  var cur='';
  try{ cur=localStorage.getItem('nexusUserAvatar')||''; }catch(e){}
  var g='';
  try{ g=localStorage.getItem('nexusUserGoogleAvatar')||''; }catch(e){}
  var rev=document.getElementById('nxAvatarRevertGoogle');
  var rm=document.getElementById('nxAvatarRemove');
  if(rev) rev.style.display = (g && cur!==g) ? '' : 'none';
  if(rm) rm.style.display = (cur.indexOf('data:')===0) ? '' : 'none';
}

// --- Hesap e-postası değiştirme ----------------------------------------------
// Supabase Auth: yeni adrese doğrulama bağlantısı gider; bağlantı onaylanana
// kadar giriş için eski adres geçerli kalır. Eski adres yerelde saklanmaya devam
// eder (oturum hâlâ o hesabın belirteciyle çalışır).
function nxChangeEmailPrompt(){
  var isTr=document.documentElement.lang==='tr';
  var s=nxCloudSession();
  var cfg=nxCloudConfig();
  if(!s||!s.accessToken||!cfg.url||!cfg.anonKey){ nxAuthUnavailable(); return; }
  var cur='';
  try{ cur=localStorage.getItem('nexusCurrentUser')||''; }catch(e){}
  nxShowPrompt(
    isTr?'E-posta Adresini Değiştir':'Change Email Address',
    isTr
      ? ('Mevcut adres: '+(cur||'—')+'. Yeni adrese bir doğrulama bağlantısı gönderilir; bağlantıyı onaylayana kadar girişte eski adres kullanılır.')
      : ('Current address: '+(cur||'—')+'. A confirmation link will be sent to the new address; the old one keeps working for sign-in until you confirm.'),
    '',
    nxSubmitEmailChange
  );
}

function nxSubmitEmailChange(val){
  var isTr=document.documentElement.lang==='tr';
  if(!val){ nxShowAlert(isTr?'Yeni e-posta adresini girin.':'Enter the new email address.',isTr?'Eksik bilgi':'Missing info','warning'); return; }
  if(val.indexOf('@')<1 || !/^\\S+@\\S+\\.\\S+$/.test(val)){ nxShowAlert(isTr?'Geçerli bir e-posta adresi girin.':'Enter a valid email address.',isTr?'Geçersiz adres':'Invalid address','warning'); return; }
  var s=nxCloudSession();
  var cfg=nxCloudConfig();
  if(!s||!s.accessToken||!cfg.url||!cfg.anonKey){ nxAuthUnavailable(); return; }
  fetch(cfg.url+'/auth/v1/user',{
    method:'PUT',
    headers:{
      'apikey':cfg.anonKey,
      'Authorization':'Bearer '+s.accessToken,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({email:val})
  })
  .then(function(res){
    return res.json().then(function(data){
      if(!res.ok){ throw new Error(data.msg||data.message||data.error_description||(isTr?'E-posta değiştirilemedi.':'Could not change the email.')); }
      return data;
    });
  })
  .then(function(){
    nxShowAlert(
      isTr
        ? ('Doğrulama bağlantısı '+val+' adresine gönderildi. Bağlantıya tıkladığında adresin değişir; o zamana kadar girişte eski adres geçerli kalır.')
        : ('A confirmation link was sent to '+val+'. Your address changes once you click it; until then the old address keeps working for sign-in.'),
      isTr?'Bağlantı gönderildi':'Link sent','success');
  })
  .catch(function(err){
    var msg=String((err&&err.message)||'');
    var text=msg;
    if(/already registered|already been registered|already exists|duplicate/i.test(msg)) text=isTr?'Bu e-posta zaten bir hesaba bağlı.':'That email is already registered.';
    else if(/not allowed|not authorized/i.test(msg)) text=isTr?'Bu e-posta sağlayıcısıyla kayıt yapılamıyor.':'Signups with this email provider are not allowed.';
    else if(/oturum/i.test(msg)) text=isTr?'Oturum bulunamadı. Çıkış yapıp tekrar giriş yap.':'Session not found. Sign out and sign in again.';
    nxShowAlert(text,isTr?'Değiştirilemedi':'Not changed','warning');
  });
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
    try{
      customName=localStorage.getItem('nexusUserName');
      if(customName){
        var fixed=nxFixMojibake(customName);
        if(fixed!==customName){customName=fixed;localStorage.setItem('nexusUserName',fixed);}
      }
    }catch(e){}
    var displayName = customName || user.split('@')[0];
    label.textContent = displayName;
    label.title = displayName + ' (' + user + ')';
    if(avatarWrap){
      avatarWrap.innerHTML='<div class="nx-nav-avatar">' + nxGetAvatarHtml(false) + '<span class="dot-online"></span></div>';
    }
    // Uygulamada seçilen profil fotoğrafı sitede de görünsün (senkronlu avatar).
    nxFetchSyncedAvatar();
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
  var recoveryView=document.getElementById('nxAuthRecoveryView');
  var isTr=document.documentElement.lang==='tr';
  if(recoveryView)recoveryView.style.display='none';

  if(user){
    if(formView)formView.style.display='none';
    if(profileView)profileView.style.display='flex';
    var customName=null;
    try{
      customName=localStorage.getItem('nexusUserName');
      if(customName){
        var fixed=nxFixMojibake(customName);
        if(fixed!==customName){customName=fixed;localStorage.setItem('nexusUserName',fixed);}
      }
    }catch(e){}
    var displayName = customName || user.split('@')[0];
    
    var avatarWrap=document.getElementById('nxProfileAvatarWrap');
    var nameEl=document.getElementById('nxProfileNameDisplay');
    var emailEl=document.getElementById('nxProfileEmail');
    if(avatarWrap) avatarWrap.innerHTML = nxGetAvatarHtml(true);
    if(nameEl)nameEl.textContent = displayName;
    if(emailEl)emailEl.textContent = user;
    nxSiteAvatarActions();
    
    var plusPlan = '';
    try {
      plusPlan = localStorage.getItem('nexusPlusPlan') || '';
      if (!plusPlan && window.nexusGetItem) plusPlan = window.nexusGetItem('nexusPlusPlan') || '';
    } catch (e) {}
    var plusActive = plusPlan === 'Aylık' || plusPlan === 'Yıllık';
    if (!plusActive) {
      try { plusActive = localStorage.getItem('nexusPlusActive') === 'true'; } catch (e) {}
    }
    var planTag=document.getElementById('nxProfilePlanTag');
    if(planTag){
      planTag.classList.toggle('is-free', !plusActive);
      if(!plusActive) planTag.textContent = isTr ? 'Ücretsiz' : 'Free';
      else if(plusPlan === 'Yıllık') planTag.textContent = isTr ? 'NEXUS+ · Yıllık' : 'NEXUS+ · Yearly';
      else if(plusPlan === 'Aylık') planTag.textContent = isTr ? 'NEXUS+ · Aylık' : 'NEXUS+ · Monthly';
      else planTag.textContent = 'NEXUS+';
    }
    var perksFree=document.getElementById('nxProfilePerksFree');
    var perksPlus=document.getElementById('nxProfilePerksPlus');
    if(perksFree)perksFree.classList.toggle('is-hidden', plusActive);
    if(perksPlus)perksPlus.classList.toggle('is-hidden', !plusActive);
    var upgrade=document.getElementById('nxProfileUpgrade');
    if(upgrade)upgrade.classList.toggle('is-hidden', plusActive);
    m.classList.add('nx-account-open');
    m.setAttribute('aria-labelledby','nxProfileNameDisplay');
  }else{
    if(formView)formView.style.display='block';
    if(profileView)profileView.style.display='none';
    m.classList.remove('nx-account-open');
    m.setAttribute('aria-labelledby','nxAuthTitle');
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
  try{curName=nxFixMojibake(localStorage.getItem('nexusUserName')||'');}catch(e){}
  nxShowPrompt(
    isTr ? 'İsmi Düzenle' : 'Edit Display Name',
    isTr ? 'Hesabınız için görünecek yeni bir isim girin:' : 'Enter your new display name:',
    curName,
    function(newName){
      if(!newName)return;
      try{localStorage.setItem('nexusUserName', nxFixMojibake(newName));}catch(e){}
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
  fetch(SUPABASE_URL+'/auth/v1/recover?redirect_to='+encodeURIComponent(window.location.origin+window.location.pathname),{
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
  var recoveryView=document.getElementById('nxAuthRecoveryView');
  if(recoveryView && recoveryView.style.display!=='none'){
    recoveryView.style.display='none';
    nxRecoveryToken=null;nxRecoveryRefresh=null;nxRecoveryEmail='';
  }
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
      fetch(SUPABASE_URL+'/auth/v1/recover?redirect_to='+encodeURIComponent(window.location.origin+window.location.pathname),{
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

/* ---------- Şifre sıfırlama bağlantısı (site köküne dönen recovery akışı) ----------
   Supabase bağlantısı #access_token=…&type=recovery ile döner. Token oturum olarak
   yazılmaz; kullanıcı yeni şifresini kaydedince oturum açılır. */
var nxRecoveryToken=null;
var nxRecoveryRefresh=null;
var nxRecoveryEmail='';

function nxShowRecovery(){
  var m=document.getElementById('nxAuthModal');
  var formView=document.getElementById('nxAuthFormView');
  var profileView=document.getElementById('nxAuthProfileView');
  var recoveryView=document.getElementById('nxAuthRecoveryView');
  if(!m||!recoveryView)return;
  if(formView)formView.style.display='none';
  if(profileView)profileView.style.display='none';
  recoveryView.style.display='block';
  m.classList.remove('nx-account-open');
  m.setAttribute('aria-labelledby','nxRecoveryTitle');
  var emailEl=document.getElementById('nxRecoveryEmail');
  if(emailEl)emailEl.textContent=nxRecoveryEmail||'';
  var alertEl=document.getElementById('nxRecoveryAlert');
  if(alertEl)alertEl.style.display='none';
  m.style.display='flex';
  setTimeout(function(){m.classList.add('open')},10);
  nxLockScroll();
}

function nxSubmitRecovery(e){
  e.preventDefault();
  var isTr=document.documentElement.lang==='tr';
  var a=(document.getElementById('nxRecoveryPassword')||{}).value||'';
  var b=(document.getElementById('nxRecoveryPassword2')||{}).value||'';
  var btn=document.getElementById('nxRecoverySubmitBtn');
  var alertEl=document.getElementById('nxRecoveryAlert');
  var cfg=nxCloudConfig();

  function fail(msg){
    if(alertEl){alertEl.textContent=msg;alertEl.style.display='block';}
  }
  if(!nxRecoveryToken){fail(isTr?'Sıfırlama bağlantısı geçersiz. Yeni bir bağlantı isteyin.':'This reset link is invalid. Please request a new one.');return;}
  if(a.length<6){fail(isTr?'Şifre en az 6 karakter olmalıdır.':'Password must be at least 6 characters.');return;}
  if(a!==b){fail(isTr?'Şifreler eşleşmiyor.':'Passwords do not match.');return;}
  if(!cfg.url||!cfg.anonKey){fail(nxAuthUnavailableMsg());return;}

  var origText=btn?btn.innerHTML:'';
  if(btn){btn.disabled=true;btn.innerHTML=isTr?'Kaydediliyor…':'Saving…';}
  if(alertEl)alertEl.style.display='none';

  fetch(cfg.url+'/auth/v1/user',{
    method:'PUT',
    headers:{
      'apikey':cfg.anonKey,
      'Authorization':'Bearer '+nxRecoveryToken,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({password:a})
  })
  .then(function(res){
    return res.json().then(function(data){
      if(!res.ok){
        throw new Error(data.msg||data.message||data.error_description||(isTr?'Şifre kaydedilemedi.':'Could not save the password.'));
      }
      return data;
    });
  })
  .then(function(data){
    if(btn){btn.disabled=false;btn.innerHTML=origText;}
    var email=(data&&data.email)||nxRecoveryEmail;
    try{
      if(email)localStorage.setItem('nexusCurrentUser',email);
      localStorage.setItem('nexus_cloud_session',JSON.stringify({
        accessToken:nxRecoveryToken,
        refreshToken:nxRecoveryRefresh,
        userId:(data&&data.id)||null,
        email:email
      }));
    }catch(err){}
    nxRecoveryToken=null;nxRecoveryRefresh=null;nxRecoveryEmail='';
    nxCloseAuthModal();
    nxUpdateNavAuth();
    nxShowAlert(
      isTr?'Şifreniz güncellendi ve hesabınıza giriş yapıldı.':'Your password has been updated and you are signed in.',
      isTr?'Şifre Güncellendi':'Password Updated',
      'success'
    );
  })
  .catch(function(err){
    if(btn){btn.disabled=false;btn.innerHTML=origText;}
    var msg=String((err&&err.message)||'');
    if(/expired|invalid|jwt/i.test(msg))msg=isTr?'Bağlantının süresi dolmuş. Yeni bir sıfırlama bağlantısı isteyin.':'This link has expired. Please request a new reset link.';
    else if(/same|different/i.test(msg))msg=isTr?'Yeni şifre eskisinden farklı olmalı.':'The new password must be different from the old one.';
    fail(msg||(isTr?'Şifre kaydedilemedi.':'Could not save the password.'));
  });
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
    ? SUPABASE_URL+'/auth/v1/signup?redirect_to='+encodeURIComponent(window.location.origin+window.location.pathname)
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
    if(!data.access_token){
      /* E-posta doğrulaması açık: oturum yok. Kullanıcıyı giriş yapmış gibi
         göstermek yanıltıcıydı; doğrulama bağlantısına yönlendiriyoruz. */
      nxShowAlert(
        isTr ? 'Kayıt alındı. Giriş yapabilmek için e-posta adresinize gönderilen doğrulama bağlantısına tıklayın.' : 'Account created. Click the verification link we sent to your email to sign in.',
        isTr ? 'E-postanızı Kontrol Edin' : 'Check Your Email',
        'success'
      );
      return;
    }
    try{
      localStorage.setItem('nexusCurrentUser',userEmail);
      if(data.user && data.user.user_metadata){
        if(data.user.user_metadata.avatar_url || data.user.user_metadata.picture){
          localStorage.setItem('nexusUserAvatar', data.user.user_metadata.avatar_url || data.user.user_metadata.picture);
        }
        if(data.user.user_metadata.full_name || data.user.user_metadata.name){
          localStorage.setItem('nexusUserName', nxFixMojibake(data.user.user_metadata.full_name || data.user.user_metadata.name));
        }
      }
      localStorage.setItem('nexus_cloud_session',JSON.stringify({
        accessToken:data.access_token,
        refreshToken:data.refresh_token,
        userId:data.user?data.user.id:null,
        email:userEmail
      }));
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
      cta.dataset.plan=isYearly?cta.dataset.yearlyPlan:cta.dataset.monthlyPlan;
      if(cta.dataset.yearlyUrl && isYearly)cta.href=cta.dataset.yearlyUrl;
      if(cta.dataset.yearlyLabel && isYearly)cta.textContent=cta.dataset.yearlyLabel;
      if(cta.dataset.monthlyLabel && !isYearly)cta.textContent=cta.dataset.monthlyLabel;
    }
  }else{
    if(priceVal)priceVal.textContent=bundle.price.monthly;
    if(periodVal)periodVal.textContent=isTr?'/ay':'/mo';
    if(priceNote)priceNote.textContent=isTr?'Aylık faturalandırma':'Billed monthly';
    if(cta){
      cta.dataset.plan=cta.dataset.monthlyPlan;
      if(cta.dataset.monthlyUrl)cta.href=cta.dataset.monthlyUrl;
      if(cta.dataset.monthlyLabel)cta.textContent=cta.dataset.monthlyLabel;
    }
  }
}

function nxOpenCheckout(e){
  var cta=document.getElementById('nexusPlusCta');
  if(!cta) return true;
  var yearly=document.getElementById('billingYearly');
  var isYearly=yearly && yearly.classList.contains('active');
  var url = isYearly ? (cta.dataset.yearlyUrl || ('https://whop.com/checkout/' + cta.dataset.yearlyPlan))
                     : (cta.dataset.monthlyUrl || ('https://whop.com/checkout/' + (cta.dataset.plan || cta.dataset.monthlyPlan)));
  if(url){
    if(e && e.preventDefault) e.preventDefault();
    var returnUrl = window.location.origin + window.location.pathname + '?payment=success';
    var sep = url.indexOf('?') >= 0 ? '&' : (url.endsWith('/') ? '?' : '/?');
    window.location.href = url + sep + 'redirect_url=' + encodeURIComponent(returnUrl);
    return false;
  }
  return true;
}
function nxCloseCheckout(){
  var modal=document.getElementById('nxCheckoutModal');
  if(!modal) return;
  modal.classList.remove('open');
  setTimeout(function(){
    modal.style.display='none';
    var box=document.getElementById('nxCheckoutMount');
    if(box) box.innerHTML='';
    nxUnlockScroll();
  }, 220);
}
function nxCloudSession(){
  try { return JSON.parse(localStorage.getItem('nexus_cloud_session')||'null'); } catch(err){ return null; }
}
function nxOpenBilling(){
  var panel=document.getElementById('nxBillingPanel');
  if(panel) panel.style.display='block';
  nxLoadBilling('status');
}
function nxLoadBilling(action){
  var status=document.getElementById('nxBillingStatus');
  var pays=document.getElementById('nxBillingPays');
  var cancelBtn=document.getElementById('nxBillingCancel');
  var isTr=document.documentElement.lang==='tr';
  var session=nxCloudSession();
  var cfg=nxCloudConfig();
  if(!session||!session.accessToken||!cfg.url||!cfg.anonKey){
    if(status) status.textContent=isTr?'Aboneliği görmek için yeniden giriş yap.':'Sign in again to see the subscription.';
    if(cancelBtn) cancelBtn.style.display='none';
    return;
  }
  if(status) status.textContent=isTr?'Yükleniyor…':'Loading…';
  fetch(cfg.url+'/functions/v1/whop-account',{
    method:'POST',
    headers:{ Authorization:'Bearer '+session.accessToken, apikey:cfg.anonKey, 'Content-Type':'application/json' },
    body:JSON.stringify({ action: action==='cancel'?'cancel':'status' })
  }).then(function(r){
    return r.json().then(function(d){ return { ok:r.ok, d:d }; });
  }).then(function(res){
    if(!res.ok){
      if(status) status.textContent=isTr?'Abonelik bilgisi alınamadı.':'Could not load the subscription.';
      if(cancelBtn) cancelBtn.style.display='none';
      return;
    }
    var m=res.d.membership;
    if(!m){
      if(status) status.textContent=isTr?'Bu hesapta NEXUS+ aboneliği yok.':'This account has no NEXUS+ subscription.';
      if(cancelBtn) cancelBtn.style.display='none';
    }else{
      var when=m.periodEnd ? new Date(m.periodEnd).toLocaleDateString(isTr?'tr-TR':'en-US') : '';
      if(status) status.textContent=(m.plan||'NEXUS+')+(m.cancelAtPeriodEnd?(isTr?' · dönem sonunda bitecek':' · ends at period end'):'')+(when?(isTr?' · yenileme ':' · renews ')+when:'');
      if(cancelBtn) cancelBtn.style.display=m.cancelAtPeriodEnd?'none':'flex';
    }
    if(pays){
      pays.innerHTML='';
      (res.d.payments||[]).forEach(function(pmt){
        var li=document.createElement('li');
        li.textContent=[pmt.amount, pmt.currency, pmt.status].filter(Boolean).join(' · ');
        pays.appendChild(li);
      });
    }
  }).catch(function(){
    if(status) status.textContent=isTr?'Abonelik bilgisi alınamadı.':'Could not load the subscription.';
  });
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
  nxHoldShotTimer(8000);
}

function nxPrevShot(){
  nxShowShot(nxCurrentShot-1);
  nxHoldShotTimer(8000);
}

function nxResetShotTimer(){
  if(nxShotTimer){ clearInterval(nxShotTimer); nxShotTimer=null; }
}

/* Otomatik tanıtım: hero görünürken 4 sn'de bir sonraki ekran. Kullanıcı
   dokunursa kısa süre durur, sonra kendiliğinden devam eder; sekme arka
   plana geçince veya maket görünmezken saymaz. */
var nxShotHold=null;
var nxPhoneInView=true;
function nxShotTick(){
  if(document.hidden || !nxPhoneInView || nxPreviewOn) return;
  nxShowShot(nxCurrentShot+1);
}
function nxStartShotTimer(){
  if(nxShotTimer || nxPreviewOn || nxShotHold) return;
  if(document.hidden || !nxPhoneInView) return;
  nxShotTimer=setInterval(nxShotTick,4000);
}
function nxHoldShotTimer(ms){
  nxResetShotTimer();
  if(nxShotHold){ clearTimeout(nxShotHold); nxShotHold=null; }
  if(nxPreviewOn) return;
  nxShotHold=setTimeout(function(){ nxShotHold=null; nxStartShotTimer(); }, ms||8000);
}

// Web uygulaması yayında değil. Telefon, uygulama ve programla aynı ekranların görsellerini gösterir.
var nxPreviewOn=false;

function nxScalePreview(){
  var box=document.querySelector('.phone-inner-screen');
  if(!box)return;
  var w=box.clientWidth||390;
  box.style.setProperty('--nx-preview-scale',(w/390).toFixed(4));
}

function nxUseShotFallback(){
  var prev=document.getElementById('phonePreview');
  var shots=document.querySelector('.phone-screen-content');
  var mock=document.getElementById('phoneMockup');
  if(prev) prev.style.display='none';
  if(shots){ shots.style.display='block'; shots.removeAttribute('aria-hidden'); }
  if(mock) mock.classList.remove('previewing');
  nxPreviewOn=false;
  nxResetShotTimer();
}
function nxPreviewLooksEmpty(frame){
  try{
    var href=frame.contentWindow && frame.contentWindow.location && frame.contentWindow.location.href;
    return !href || href==='about:blank';
  }catch(e){
    return false;
  }
}
function nxPreviewPage(){
  var page='nexus-home.html';
  var extra='';
  try{
    var saved=sessionStorage.getItem('nxPreviewPage')||'';
    if(/^nexus-[a-z0-9-]+\\.html$/.test(saved)) page=saved;
    var idx=sessionStorage.getItem('nxPreviewIndex')||'';
    if(/^\\d+$/.test(idx)) extra='&i='+idx;
  }catch(e){}
  return page+'?preview=1'+extra;
}
var nxPreviewBooted=false;
function nxBootPreview(){
  if(nxPreviewBooted) return;
  nxPreviewBooted=true;
  nxUseShotFallback();
}
window.addEventListener('message',function(e){
  var frame=document.getElementById('phonePreviewFrame');
  if(!frame) return;
  var base=frame.getAttribute('data-src')||'';
  var root=base.replace(/nexus-[a-z0-9-]+\\.html.*$/,'');
  if(!root || e.origin!==root.replace(/\\/$/,'')) return;
  var data=e.data||{};
  if(data.source!=='nexus-preview') return;
  var page=String(data.page||'');
  if(!/^nexus-[a-z0-9-]+\\.html$/.test(page)) return;
  var idx=String(data.index||'');
  if(idx && !/^\\d+$/.test(idx)) return;
  try{
    sessionStorage.setItem('nxPreviewPage', page);
    if(idx) sessionStorage.setItem('nxPreviewIndex', idx);
    else sessionStorage.removeItem('nxPreviewIndex');
  }catch(err){}
});

function nxSetPhoneMode(mode){
  nxBootPreview();
}

window.addEventListener('resize',nxScalePreview);
document.addEventListener('DOMContentLoaded',nxBootPreview);

// Telefon dokunma, sürükleme ve tıklama yönetimi
document.addEventListener('DOMContentLoaded',function(){
  var mockup=document.getElementById('phoneMockup');
  if(mockup){
    mockup.addEventListener('mouseenter',function(){if(nxPreviewOn)return;nxResetShotTimer();if(nxShotHold){clearTimeout(nxShotHold);nxShotHold=null;}});
    mockup.addEventListener('mouseleave',function(){if(nxPreviewOn)return;nxHoldShotTimer(3000);});

    mockup.addEventListener('click',function(e){
      if(nxPreviewOn)return;
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
      if(nxPreviewOn)return;
      touchStartX=e.changedTouches[0].screenX;
      nxResetShotTimer();
      if(nxShotHold){clearTimeout(nxShotHold);nxShotHold=null;}
    },{passive:true});
    mockup.addEventListener('touchend',function(e){
      if(nxPreviewOn)return;
      touchEndX=e.changedTouches[0].screenX;
      var diff=touchEndX-touchStartX;
      if(diff>40) nxPrevShot();
      else if(diff<-40) nxNextShot();
      nxHoldShotTimer(8000);
    },{passive:true});
  }

  /* Sekme gizliyken sayma, maket görünmezken de durur; geri gelince kısa bir
     aralıkla devam eder. Ok/dot ve nxNext/Prev çağrıları 8 sn'lik bekleme koyar. */
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){ nxResetShotTimer(); if(nxShotHold){clearTimeout(nxShotHold);nxShotHold=null;} }
    else if(nxPhoneInView){ nxHoldShotTimer(1200); }
  });
  var phoneWrap=document.querySelector('.phone-wrapper');
  if(phoneWrap && 'IntersectionObserver' in window){
    var phoneIo=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        nxPhoneInView=en.isIntersecting;
        if(nxPhoneInView){ nxHoldShotTimer(900); }
        else { nxResetShotTimer(); if(nxShotHold){clearTimeout(nxShotHold);nxShotHold=null;} }
      });
    },{ threshold:0.25 });
    phoneIo.observe(phoneWrap);
  }
  /* Koşulsuz başlangıç: IO arka plan sekmesinde ertelenirse bile tanıtım kalksın.
     nxShotTick zaten document.hidden ve görünüm kontrolü yapıyor. */
  nxStartShotTimer();

  /* OAuth / Google girişi, e-posta doğrulama ve şifre sıfırlama dönüşleri.
     Supabase implicit akışı belirteçleri hash içinde döndürür:
       • type=recovery → yeni şifre görünümü açılır (token oturum sayılmaz)
       • type=signup/email → e-posta doğrulandı, oturum açılır
       • error/error_description → süresi dolmuş bağlantı bildirimi
     Hash her durumda temizlenir; belirteç adres çubuğunda kalmaz. */
  var nxHashParams=null;
  if(window.location.hash && window.location.hash.length>1){
    try{nxHashParams=new URLSearchParams(window.location.hash.substring(1));}catch(e){nxHashParams=null;}
  }
  if(nxHashParams){
    var nxHashError=nxHashParams.get('error_description')||nxHashParams.get('error');
    if(nxHashError){
      var nxHashIsTr=document.documentElement.lang==='tr';
      var nxHashErrText=String(nxHashError).replace(/\\+/g,' ');
      try{nxHashErrText=decodeURIComponent(nxHashErrText);}catch(e){}
      nxShowAlert(
        /expired|invalid/i.test(nxHashErrText)
          ? (nxHashIsTr?'Bağlantının süresi dolmuş ya da geçersiz. Yeni bir bağlantı isteyin.':'This link has expired or is invalid. Please request a new one.')
          : nxHashErrText,
        nxHashIsTr?'Bağlantı Hatası':'Link Error',
        'warning'
      );
      history.replaceState(null,null,window.location.pathname+window.location.search);
    }else if(nxHashParams.get('access_token')){
      var nxHashToken=nxHashParams.get('access_token');
      var nxHashType=nxHashParams.get('type')||'';
      var nxHashRefresh=nxHashParams.get('refresh_token');
      var nxPayload=nxDecodeJwt(nxHashToken);
      var nxUserEmail=nxPayload.email||'kullanici@nexus';
      var nxMeta=nxPayload.user_metadata||{};
      if(nxHashType==='recovery'){
        nxRecoveryToken=nxHashToken;
        nxRecoveryRefresh=nxHashRefresh;
        nxRecoveryEmail=nxUserEmail;
        nxShowRecovery();
      }else{
        try{
          localStorage.setItem('nexusCurrentUser',nxUserEmail);
          if(nxMeta.avatar_url || nxMeta.picture){
            localStorage.setItem('nexusUserAvatar', nxMeta.avatar_url || nxMeta.picture);
          }
          if(nxMeta.full_name || nxMeta.name){
            localStorage.setItem('nexusUserName', nxFixMojibake(nxMeta.full_name || nxMeta.name));
          }
          localStorage.setItem('nexus_cloud_session',JSON.stringify({
            accessToken:nxHashToken,
            refreshToken:nxHashRefresh,
            userId:nxPayload.sub,
            email:nxUserEmail
          }));
        }catch(e){}
        nxUpdateNavAuth();
        if(nxHashType==='invite'){
          var nxInviteIsTr=document.documentElement.lang==='tr';
          nxShowAlert(
            nxInviteIsTr?'Davet kabul edildi — NEXUS hesabın hazır. Artık uygulama ve programla aynı hesapla giriş yapabilirsin.':'Invite accepted — your NEXUS account is ready. Sign in with the same account in the app and the desktop program.',
            nxInviteIsTr?'Davet Kabul Edildi':'Invite Accepted',
            'success'
          );
        }else if(nxHashType==='signup' || nxHashType==='email'){
          var nxSignupIsTr=document.documentElement.lang==='tr';
          nxShowAlert(
            nxSignupIsTr?'E-posta adresiniz doğrulandı ve giriş yapıldı.':'Your email is verified and you are signed in.',
            nxSignupIsTr?'E-posta Doğrulandı':'Email Verified',
            'success'
          );
        }
      }
      history.replaceState(null,null,window.location.pathname+window.location.search);
    }
  }

  // Whop Ödeme Dönüşü Kontrolü (Success / Cancel / Failed)
  try {
    var searchParams = new URLSearchParams(window.location.search);
    var payStatus = searchParams.get('payment') || searchParams.get('checkout') || searchParams.get('status');
    if(payStatus){
      var isTr = document.documentElement.lang === 'tr';
      if(payStatus === 'success'){
        nxShowAlert(
          isTr
            ? 'NEXUS+ ayrıcalıklarınız hesabınıza başarıyla tanımlandı. Uygulamayı indirip giriş yaparak tüm özelliklerin ve NEXUS AI yapay zekâsının tadını çıkarabilirsiniz.'
            : 'Your NEXUS+ privileges are now active on your account. Download the app and sign in to enjoy all premium features and NEXUS AI.',
          isTr ? 'Aboneliğiniz Başlatıldı!' : 'Subscription Activated!',
          'success',
          function(){
            var dl = document.getElementById('downloads');
            if(dl) dl.scrollIntoView({ behavior: 'smooth' });
          }
        );
      } else if(payStatus === 'failed' || payStatus === 'error'){
        nxShowAlert(
          isTr
            ? 'Ödeme işlemi tamamlanamadı veya kartınız onaylanmadı. Lütfen kart bilgilerinizi kontrol edip tekrar deneyin veya bankanızla görüşün.'
            : 'Payment could not be completed. Please check your card information and try again, or contact your issuing bank.',
          isTr ? 'Ödeme Gerçekleştirilemedi' : 'Payment Failed',
          'warning'
        );
      } else if(payStatus === 'cancel' || payStatus === 'canceled' || payStatus === 'cancelled'){
        nxShowAlert(
          isTr
            ? 'Ödeme adımı tamamlanmadan sonlandırıldı. İstediğiniz zaman planınızı seçip ücretsiz denemenizi başlatabilirsiniz.'
            : 'Checkout was not completed. You can start your free trial whenever you are ready.',
          isTr ? 'Ödeme İptal Edildi' : 'Checkout Canceled',
          'info'
        );
      }
      var cleanUrl = window.location.pathname + (window.location.hash || '');
      history.replaceState(null, document.title, cleanUrl);
    }
  } catch(e) {}

  // Giriş Durumu Güncelleme
  nxUpdateNavAuth();

  // İndirme: GitHub sürümü kaynak sürümüne yetişmişse oradan, değilse geçici kayıttan.
  // Etiket yine açılınca (Actions) latest bağlantıları kendiliğinden kullanılır.
  var NX_VER=${JSON.stringify(APP_VERSION.replace(/^v/, ''))};
  function nxVerLess(a,b){
    var pa=String(a).replace(/^v/,'').split('.').map(function(n){return parseInt(n,10)||0;});
    var pb=String(b).replace(/^v/,'').split('.').map(function(n){return parseInt(n,10)||0;});
    for(var i=0;i<3;i++){var da=pa[i]||0,db=pb[i]||0;if(da!==db)return da<db;}
    return false;
  }
  function nxApplyVer(tag){
    var v=String(tag||'');
    if(v.indexOf('v')===0)v=v.slice(1);
    if(!v)return;
    document.querySelectorAll('[data-nexus-ver]').forEach(function(el){el.textContent='v'+v;}); fetch('https://api.github.com/repos/Enard52/NEXUS/contributors?per_page=24').then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}).then(function(list){ if(!Array.isArray(list)||!list.length)return; var box=document.getElementById('nx-contrib'); if(!box)return; var SAFE_LOGIN=(function(s){if(typeof s!=='string'||s.length<1||s.length>39)return false;for(var i=0;i<s.length;i++){var c=s.charAt(i);var ok=(c>='a'&&c<='z')||(c>='A'&&c<='Z')||(c>='0'&&c<='9')||c==='-'||c==='_'||c==='.';if(!ok)return false;}return true;}), SAFE_PAGE='https://github.com/', SAFE_AV='https://avatars.githubusercontent.com/u/'; list.forEach(function(u){ if(!u||typeof u!=='object')return; var login=String(u.login||''); if(!SAFE_LOGIN(login))return; /* kurucular yukarıda sabit chip olarak durur */ if(login==='Enard52'||login==='hadesonline02')return; var page=SAFE_PAGE+login; if(u.html_url&&String(u.html_url).indexOf('https://github.com/')===0)page=u.html_url; var av=String(u.avatar_url||''); if(av.indexOf('https://avatars.githubusercontent.com/u/')!==0)return; var a=document.createElement('a'); a.href=page; a.target='_blank'; a.rel='noopener'; a.title='@'+login; a.className='contrib-chip'; var img=document.createElement('img'); img.src=av; img.alt='@'+login; img.width=88; img.height=88; img.loading='lazy'; var name=document.createElement('span'); name.className='contrib-login'; name.textContent='@'+login; a.appendChild(img); a.appendChild(name); box.appendChild(a); }); });
  }
  Promise.all([
    fetch('https://api.github.com/repos/Enard52/nexus-releases/releases/latest').then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}),
    fetch('/downloads/current.json').then(function(r){return r.ok?r.json():null;}).catch(function(){return null;})
  ]).then(function(pair){
    var gh=pair[0], mirror=pair[1];
    var ghVer=gh&&gh.tag_name?String(gh.tag_name).replace(/^v/,''):'';
    var ghReady=!!ghVer && !nxVerLess(ghVer, NX_VER);
    if(ghReady) nxApplyVer(gh.tag_name);
    if(ghReady || !mirror || !mirror.files) return;
    /* current.json = acil durum freni; dokunulmadığı sürece HİÇBİR bağlantı yazılmaz.
       'releases/latest/download/…' zaten GitHub'in en yeni YAYINLANMIŞ sürümüne döner,
       yani sürüm yükseltmek için bu dosyayı güncellemek gerekmez.
       Neden varsayılan kapalı — 29 Ekim'de iki ayrı başarısızlık modu da ölçüldü:
         a) dosya bayat kaldı (1.0.27 çıktı, JSON 1.0.26'da kaldı) → API'ya ulaşamayan
            ziyaretçi SESSİZCE ESKİ — o vakada çöken — kurucuya yönlendi;
         b) dosya öne düştü (sürüm basıldı, CI kurucusu henüz yüklenmedi) → pinli adres
            404 verir; 'latest' ise çalışmaya devam ederdi.
       Fren gerçekten gerekirse (bozuk bir sürüm yayımlandıysa) bakımcı "pinned": true
         ve doğrulanmış iyi sürümü elle yazar; bilinçli tek hamle, sessiz varsayılan değil. */
    if(mirror.pinned !== true) return;
    var names=mirror.files;
    document.querySelectorAll('a[href*="nexus-releases/releases/latest/download/"]').forEach(function(a){
      var file=decodeURIComponent((a.getAttribute('href')||'').split('/').pop().split('?')[0]);
      if(names[file]) a.href=names[file];
    });
  });

  // ESC Tuşu ile Modal Kapatma
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      nxCloseContactModal();
      nxCloseAuthModal();
    }
  });

  // Nav ve sayfa içi bağlantılarda akıcı animasyonlu kaydırma ve ScrollSpy
  function nxInitSmoothNav(){
    var navLinks = document.querySelectorAll('.nav a');
    var isAutoScrolling = false;

    function nxNormalizePath(p){
      if(!p) return '/';
      var s = String(p).split('?')[0].split('#')[0];
      if(s.slice(-11) === '/index.html') s = s.slice(0, -10);
      while(s.length > 1 && s.charAt(s.length - 1) === '/') s = s.slice(0, -1);
      return s || '/';
    }

    function nxSmoothScrollTo(targetEl, callback){
      if(!targetEl) return;
      var header = document.querySelector('.hd');
      var headerH = header ? header.offsetHeight : 68;
      var targetY = Math.max(0, targetEl.getBoundingClientRect().top + window.pageYOffset - headerH - 14);

      if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        window.scrollTo(0, targetY);
        if(callback) callback();
        return;
      }

      // Sekme görünmüyorken animasyon kareleri işletilmez: gizli sekmede doğrudan atla.
      if(document.hidden){
        window.scrollTo(0, targetY);
        if(callback) callback();
        return;
      }

      var startY = window.pageYOffset;
      var diff = targetY - startY;
      if(Math.abs(diff) < 2){
        if(callback) callback();
        return;
      }

      isAutoScrolling = true;
      var duration = Math.min(650, Math.max(340, Math.abs(diff) * 0.42));
      var startTime = null;
      var isCancelled = false;

      function onInterrupt(){
        isCancelled = true;
        isAutoScrolling = false;
        cleanup();
      }
      function cleanup(){
        window.removeEventListener('wheel', onInterrupt);
        window.removeEventListener('touchstart', onInterrupt);
      }
      window.addEventListener('wheel', onInterrupt, { passive: true });
      window.addEventListener('touchstart', onInterrupt, { passive: true });

      function easeOutQuart(x){
        return 1 - Math.pow(1 - x, 4);
      }

      function step(currentTime){
        if(isCancelled) return;
        if(!startTime) startTime = currentTime;
        var elapsed = currentTime - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = easeOutQuart(progress);
        window.scrollTo(0, startY + diff * eased);

        if(progress < 1){
          requestAnimationFrame(step);
        } else {
          cleanup();
          setTimeout(function(){
            isAutoScrolling = false;
            if(callback) callback();
          }, 60);
        }
      }

      requestAnimationFrame(step);
    }

    // Click dinleyicisi: Nav butonları ve sayfa içi bağlantılar
    document.addEventListener('click', function(e){
      var a = e.target.closest('a');
      if(!a) return;
      var rawHref = a.getAttribute('href');
      if(!rawHref) return;

      var url;
      try {
        url = new URL(a.href, window.location.href);
      } catch(err){
        return;
      }

      if(nxNormalizePath(url.pathname) === nxNormalizePath(window.location.pathname) && url.hash){
        var id = url.hash.replace(/^#/, '');
        var target = id ? document.getElementById(id) : null;
        if(target){
          e.preventDefault();
          if(history.pushState){
            history.pushState(null, '', url.hash);
          }

          if(a.closest('.nav')){
            navLinks.forEach(function(l){ l.classList.remove('active'); });
            a.classList.add('active');
          }

          nxSmoothScrollTo(target, function(){
            updateScrollSpy();
          });
        }
      }
    });

    // ScrollSpy
    var sections = [];
    navLinks.forEach(function(a){
      var href = a.getAttribute('href') || '';
      var id = href.replace(/^.*#/, '');
      var sec = id ? document.getElementById(id) : null;
      if(sec) sections.push({ id: id, el: sec, link: a });
    });

    function updateScrollSpy(){
      if(isAutoScrolling || !sections.length) return;
      var header = document.querySelector('.hd');
      var headerH = (header ? header.offsetHeight : 68) + 80;
      var scrollPos = window.pageYOffset + headerH;
      var atBottom = (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 60);
      var currentId = null;

      if(atBottom){
        currentId = sections[sections.length - 1].id;
      } else if(window.pageYOffset < 140){
        currentId = null;
      } else {
        for(var i = sections.length - 1; i >= 0; i--){
          var top = sections[i].el.getBoundingClientRect().top + window.pageYOffset;
          if(scrollPos >= top){
            currentId = sections[i].id;
            break;
          }
        }
      }

      sections.forEach(function(item){
        if(item.id === currentId){
          item.link.classList.add('active');
        } else {
          item.link.classList.remove('active');
        }
      });
    }

    if(sections.length){
      var ticking = false;
      window.addEventListener('scroll', function(){
        if(!ticking && !isAutoScrolling){
          requestAnimationFrame(function(){
            updateScrollSpy();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });

      updateScrollSpy();
    }
  }

  /* ---------- Premium mikro-etkileşimler (kademeli açılış, platform vurgusu, yukarı çık) ---------- */
  (function nxPolish(){
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tr = document.documentElement.lang === 'tr';
    window.__nxSiteReady = true;

    // 1) Scroll-reveal (AOS örüntüsü): .rv öğeleri görünüme girince belirir.
    //    Kademeli gecikme: aynı kapsayıcıdaki .rv kardeşler sırayla gelir (en fazla 5 adım).
    var rvEls = Array.prototype.slice.call(document.querySelectorAll('.rv'));
    if(rvEls.length){
      rvEls.forEach(function(el){
        var i = 0, sib = el.parentElement ? el.parentElement.children : [];
        for(var k = 0; k < sib.length && sib[k] !== el; k++){
          if(sib[k].classList && sib[k].classList.contains('rv')) i++;
        }
        el.style.setProperty('--rv-i', String(Math.min(i, 5)));
      });
      if(document.documentElement.classList.contains('nx-io') && 'IntersectionObserver' in window){
        var io = new IntersectionObserver(function(entries){
          entries.forEach(function(en){
            if(en.isIntersecting){ en.target.classList.add('rv-in'); io.unobserve(en.target); }
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
        rvEls.forEach(function(el){ io.observe(el); });
        /* Güvenlik ağı: arka plan sekmesinde IO geri çağrıları ertelenebilir.
           Görünür pencerede IO zaten anındadır; gecikse bile ilk ekrandaki öğeler
           1.2 sn içinde zorunlu belirir — kullanıcı asla boş bölüm görmez. */
        setTimeout(function(){
          Array.prototype.forEach.call(rvEls, function(el){
            if(el.classList.contains('rv-in')) return;
            var r = el.getBoundingClientRect();
            if(r.top < window.innerHeight && r.bottom > 0) el.classList.add('rv-in');
          });
        }, 1200);
      }
    }

    // 2) Yukarı çık düğmesi: kaydırınca belirir, var olan yumuşak kaydırmayı kullanır.
    var topBtn = document.createElement('button');
    topBtn.type = 'button';
    topBtn.className = 'nx-to-top';
    topBtn.setAttribute('aria-label', tr ? 'Sayfa başına dön' : 'Back to top');
    topBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(topBtn);
    topBtn.addEventListener('click', function(){
      var target = document.getElementById('top');
      if(target && typeof nxSmoothScrollTo === 'function') nxSmoothScrollTo(target);
      else window.scrollTo(0, 0);
    });

    // 3) Kaydırma durumu: başlık gölgesi + yukarı çık düğmesinin görünürlüğü.
    //    Yalnızca iki sınıf togglesi: rAF'siz de ucuz; sekme arka plandayken bile doğru kalır.
    function nxOnScroll(){
      var y = window.pageYOffset || 0;
      document.documentElement.classList.toggle('nx-scrolled', y > 10);
      topBtn.classList.toggle('show', y > 640);
    }
    window.addEventListener('scroll', nxOnScroll, { passive: true });
    nxOnScroll();

    // 4) Platform-farkında indirme vurgusu: ziyaretçinin işletim sistemi kartı işaretlenir.
    var dls = document.querySelectorAll('.dl-card[data-platform]');
    if(dls.length){
      var plat = '';
      try{
        var ua = navigator.userAgent || '';
        if(/Android/i.test(ua)) plat = 'android';
        else if(/Win/i.test(ua)) plat = 'windows';
        else if(/Mac/i.test(ua) && !/iPhone|iPad/i.test(ua)) plat = 'mac';
        else if(/Linux/i.test(ua)) plat = 'linux';
      }catch(e){}
      if(plat === 'windows' || plat === 'linux' || plat === 'android'){
        Array.prototype.forEach.call(dls, function(card){
          if(card.getAttribute('data-platform') !== plat) return;
          card.classList.add('dl-you');
          var badge = document.createElement('span');
          badge.className = 'dl-you-badge';
          badge.textContent = tr ? 'Sizin için' : 'For you';
          card.appendChild(badge);
        });
      }
    }

    // 5) Telefon maketi fare takibi (vanilla-tilt örüntüsü): yalnızca hassas imleçte,
    //    harekete duyarlılık kapalıysa hiç. Yumuşak takip: hedefe lerp'lenir, bırakınca
    //    kendiliğinden sıfıra iner ve transform temizlenir.
    var canTilt = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce;
    var caseEl = document.getElementById('phoneMockup');
    if(canTilt && caseEl){
      var tx = 0, ty = 0, cx = 0, cy = 0, tiltRaf = null, hovering = false;
      var nxTiltFrame = function(){
        cx += (tx - cx) * 0.14;
        cy += (ty - cy) * 0.14;
        caseEl.style.transform = 'rotateX(' + cy.toFixed(2) + 'deg) rotateY(' + cx.toFixed(2) + 'deg)';
        if(hovering || Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05){
          tiltRaf = requestAnimationFrame(nxTiltFrame);
        } else {
          tiltRaf = null;
          caseEl.style.transform = '';
        }
      };
      var stage = caseEl.closest('.phone-wrapper') || caseEl.parentElement;
      stage.addEventListener('mousemove', function(e){
        var r = caseEl.getBoundingClientRect();
        if(!r.width || !r.height) return;
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tx = Math.max(-1, Math.min(1, px)) * 9;
        ty = Math.max(-1, Math.min(1, py)) * -9;
        if(!tiltRaf){ hovering = true; tiltRaf = requestAnimationFrame(nxTiltFrame); }
      });
      stage.addEventListener('mouseleave', function(){
        tx = 0; ty = 0; hovering = false;
        if(!tiltRaf) tiltRaf = requestAnimationFrame(nxTiltFrame);
      });
    }
  })();

  nxInitSmoothNav();
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
  return `<a class="skip" href="#main">${isTr ? 'İçeriğe geç' : 'Skip to content'}</a>
<header class="hd">
  <div class="wrap">
    <a class="logo" href="${c.canonical}">${brand.logoSvg}<span>NEXUS</span></a>
    <nav class="nav" aria-label="${isTr ? 'Ana menü' : 'Main menu'}">
      ${c.nav.map(([href, label]) => {
        const h = currentPath && href.startsWith('#') ? c.canonical + href : href;
        return `<a href="${h}">${esc(label)}</a>`;
      }).join('\n      ')}
    </nav>
    <div class="nav-controls">
      <a class="gh-link" href="https://github.com/Enard52/NEXUS" target="_blank" rel="noopener" aria-label="${isTr ? 'GitHub deposu' : 'GitHub repository'}" title="${isTr ? 'Kaynak kodu GitHub\'da' : 'Source on GitHub'}">${icon('github')}</a>
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
  // Etiketler uygulamadaki gercek ekran basliklarindan yaziilir (verify-site bunu
  // site-shots.mjs'in kaynak listesiyle karsilastiriyor). Eskiden ikinci sekme
  // "Cihazlar & Odalar" idi ama kaynagi cihaz DETAY sayfasiydi: cihaz secilmeden
  // acildigi icin hero'da "Cihaz bulunamadi" hata karti gorunuyordu (olculdu).
  const shots = hasShots
    ? [
        { file: 'home', label: isTr ? 'Ana Ekran' : 'Home Screen', short: isTr ? 'Ana Ekran' : 'Home' },
        { file: 'pair', label: isTr ? 'Cihaz Ekleme Merkezi' : 'Add-Device Hub', short: isTr ? 'Cihaz Ekle' : 'Add' },
        { file: 'energy', label: isTr ? 'AI Enerji Tasarrufu' : 'AI Energy Saving', short: isTr ? 'Enerji' : 'Energy' },
        { file: 'smart', label: isTr ? 'Akıllı Senaryolar' : 'Smart Automations', short: isTr ? 'Senaryolar' : 'Automations' },
        { file: 'chat', label: isTr ? 'NEXUS AI Asistan' : 'NEXUS AI Assistant', short: isTr ? 'AI Sohbet' : 'AI Chat' },
        { file: 'lighting', label: isTr ? 'Aydınlatma Ustası' : 'Lighting Master', short: isTr ? 'Aydınlatma' : 'Lighting' },
        { file: 'scenes', label: isTr ? 'Film Modu' : 'Movie Mode', short: isTr ? 'Sinema' : 'Scenes' },
        { file: 'settings', label: isTr ? 'Ayarlar' : 'Settings', short: isTr ? 'Ayarlar' : 'Settings' },
      ]
    : [];

  const leadBits = String(c.hero.lead).match(/^(.+?[.!?])\s+(.+)$/);
  const leadMain = leadBits ? leadBits[1] : c.hero.lead;
  const leadSub = leadBits ? leadBits[2] : '';

  return `<section class="hero" id="top">
  <div class="wrap">
    <div class="hero-copy">
      <div class="hero-display rv">
        <span class="eyebrow">${icon('sparkles', 'icon')}${esc(c.hero.eyebrow)}</span>
        <h1>${esc(c.hero.h1a)} <span class="grad">${esc(c.hero.h1b)}</span></h1>
      </div>
      <p class="lead rv">${esc(leadMain)}</p>
      ${leadSub ? `<p class="lead-sub rv">${esc(leadSub)}</p>` : ''}
      <div class="hero-cta rv">
        ${platformDownloadBtn(c.hero.primary.href, 'btn btn-primary', isTr)}
        <p class="ver-chip"><span class="dot"></span><span>${esc(c.hero.versionNote)}</span><b class="ver-num" data-nexus-ver>${APP_VERSION}</b></p>
      </div>
      <ul class="trust rv">
        ${c.hero.trust.map((t) => `<li>${icon('check')}${esc(t)}</li>`).join('\n        ')}
      </ul>
    </div>
    ${
      hasShots
        ? `
    <div class="phone-wrapper rv">
      <div class="phone-glow" aria-hidden="true"></div>
      <div class="phone-case" id="phoneMockup" title="${isTr ? 'NEXUS ekranları' : 'NEXUS screens'}">
        <div class="phone-inner-screen">
          <div class="phone-island">
            <span class="island-camera"></span>
            <span class="island-sensor"></span>
          </div>
          <div class="phone-screen-content">
            ${shots.map((s, i) => `<div class="shot-slide${i === 0 ? ' active' : ''}" data-shot="${s.file}" data-label="${esc(s.label)}"><img src="/images/shots/${isTr ? '' : 'en/'}${s.file}.png" alt="${esc(c.hero.shotAlt)} — ${esc(s.label)}" width="390" height="844" loading="lazy"></div>`).join('\n            ')}
          </div>
          <div class="phone-home-indicator"></div>
          <div class="phone-glass-shine"></div>
        </div>
      </div>
      <span id="phonePreviewNote" class="sr-only">${isTr ? 'NEXUS arayüz ekranları' : 'NEXUS interface screens'}</span>
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
  const isTr = c.lang === 'tr';
  const stepIcons = ['wifi', 'zap', 'home'];
  const stepBadges = isTr
    ? ['01 • AĞ KEŞFİ', '02 • ANINDA EŞLE', '03 • YEREL ÇALIŞTIR']
    : ['01 • LAN SCAN', '02 • INSTANT PAIR', '03 • LOCAL RUN'];
  return `<section id="how">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.how.heading)}</h2><p>${esc(c.how.lead)}</p></div>
    <div class="steps">
      ${c.how.steps.map(([n, title, desc], idx) => `<div class="step rv">
        <div class="step-top-row">
          <span class="step-n">${n}</span>
          <span class="step-micro-pill">${stepBadges[idx] || ('ADIM ' + n)}</span>
          <div class="step-icon-bubble">${icon(stepIcons[idx] || 'check')}</div>
        </div>
        <h3>${esc(title)}</h3>
        <p>${esc(desc)}</p>
      </div>`).join('\n      ')}
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
  if (brands('all').length) {
    groups.push({
      kind: 'http',
      kicker: isTr ? 'HTTP · her yüzey' : 'HTTP · every surface',
      title: isTr ? 'Yerel HTTP' : 'Local HTTP',
      hint: isTr
        ? 'Masaüstü programı ve Android uygulaması aynı bağlayıcıları kullanır. Cihazın kendi HTTP arayüzüne, senin ağından.'
        : 'The desktop program and the Android app share these connectors. Straight to the device HTTP API on your LAN.',
      items: brands('all'),
    });
  }
  if (brands('desktop').length) {
    groups.push({
      kind: 'desktop',
      kicker: isTr ? 'Masaüstü programında ekstra' : 'Extra on the desktop program',
      title: isTr ? 'Masaüstünde yerel TCP' : 'Local TCP on desktop',
      hint: isTr
        ? 'Windows ve Linux programı yukarıdaki HTTP markalarının hepsini çalıştırır; buna yerel TCP ile TP-Link Kasa ve Yeelight eklenir. Android uygulamasında HTTP listesi durur.'
        : 'The Windows and Linux programs run every HTTP brand above, and add local TCP for TP-Link Kasa and Yeelight. The Android app keeps the HTTP list.',
      items: brands('desktop'),
    });
  }
  if (brands('soon').length) {
    groups.push({
      kind: 'soon',
      kicker: isTr ? 'Yakında' : 'Coming soon',
      title: isTr ? 'Doğrudan bağlayıcı yakında' : 'Direct connector coming soon',
      hint: '',
      items: brands('soon'),
    });
  }
  return groups;
}

function renderIntGroup(g) {
  const chips = `<div class="chips">${g.items.map((i) => `<span class="chip">${getBrandLogo(i)}${esc(i)}</span>`).join('')}</div>`;
  const logos =
    g.kind === 'desktop'
      ? `${getPlatformLogo('windows')}${getPlatformLogo('linux')}`
      : '';
  const mark = logos ? `<div class="int-logo-row" aria-hidden="true">${logos}</div>` : '';
  if (g.kind === 'desktop') {
    return `<div class="int-desktop rv">
      <div>
        ${mark}
        <span class="int-kicker">${esc(g.kicker)}</span>
        <h3>${esc(g.title)}</h3>
        <p class="int-hint">${esc(g.hint)}</p>
      </div>
      ${chips}
    </div>`;
  }
  return `<div class="card rv">${mark}<span class="int-kicker">${esc(g.kicker)}</span><h3>${esc(g.title)}</h3>${g.hint ? `<p class="int-hint">${esc(g.hint)}</p>` : ''}${chips}</div>`;
}

function renderIntegrations(c) {
  const isTr = c.lang === 'tr';
  return `<section id="integrations">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.integrations.heading)}</h2><p>${esc(c.integrations.lead)}</p></div>
    <div class="int-groups">
      ${integrationGroups(c).map(renderIntGroup).join('\n      ')}
    </div>
    <div class="int-note int-bridge rv">
      <div>
        <p class="int-bridge-kicker">${icon('layers')} ${isTr ? 'Köprü ile eklenenler' : 'Added through a bridge'}</p>
        <h3>${isTr ? 'Matter ve Zigbee' : 'Matter and Zigbee'}</h3>
        <p>${isTr
          ? 'NEXUS’ta doğrudan Matter veya Zigbee bağlayıcısı yok. Bu cihazlar kendi Home Assistant sunucuna eklenir; NEXUS o sunucuyla yerel ağında konuşur.'
          : 'NEXUS has no direct Matter or Zigbee connector. Those devices join your own Home Assistant server; NEXUS talks to that server on your LAN.'}</p>
      </div>
      <ul class="int-bridge-points">
        <li>${getBrandLogo('Matter')}<span><b>Matter / Zigbee</b> — ${isTr ? 'yalnızca kendi Home Assistant sunucun üzerinden' : 'only through your own Home Assistant server'}</span></li>
        <li>${icon('wifi')}<span><b>${isTr ? 'Diğer markalar' : 'Other brands'}</b> — ${isTr ? 'doğrudan yerel ağ, üretici bulutu yok' : 'direct LAN, no vendor cloud in the path'}</span></li>
      </ul>
    </div>
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
    <div class="sec-head center rv" style="${c.pricing.lead ? 'margin-bottom:28px' : 'margin-bottom:24px'}">
      <div class="sec-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><defs><linearGradient id="nx-pricing-lg" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse"><stop stop-color="#6f9bff"/><stop offset=".55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/></linearGradient></defs><rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nx-pricing-lg)"/><path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <h2${c.pricing.lead ? '' : ' style="margin-bottom:0"'}>${esc(c.pricing.heading)}</h2>${c.pricing.lead ? `\n      <p>${esc(c.pricing.lead)}</p>` : ''}
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
        ${platformDownloadBtn(c.pricing.plans[0].cta.href, 'btn btn-ghost', isTr)}
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
        <a class="btn btn-primary plan-cta" id="nexusPlusCta" href="${monthlyCheckout}" data-plan="${monthlyCheckout.split('/').pop()}" data-monthly-plan="${monthlyCheckout.split('/').pop()}" data-yearly-plan="${yearlyCheckout.split('/').pop()}" data-monthly-url="${monthlyCheckout}" data-yearly-url="${yearlyCheckout}" data-monthly-label="${esc(c.pricing.plans[1].cta.monthlyLabel || c.pricing.plans[1].cta.label)}" data-yearly-label="${esc(c.pricing.plans[1].cta.yearlyLabel || c.pricing.plans[1].cta.label)}" onclick="return nxOpenCheckout(event)">
          ${esc(c.pricing.plans[1].cta.monthlyLabel || c.pricing.plans[1].cta.label)}
        </a>
      </div>

      <!-- 3. Aile Planı -->
      <div class="plan rv">
        <span class="plan-badge" style="background:linear-gradient(135deg,#10B981,#059669)">${esc(c.pricing.plans[2].badge)}</span>
        <div class="plan-head">
          <h3>${esc(c.pricing.plans[2].name)}</h3>
          <div class="price">${esc(c.pricing.plans[2].price)} <small>/ ${esc(c.pricing.plans[2].period)}</small></div>
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
  // Saglama degerleri release varliklarinda yayinda (olculdu: uc dosya da 200 + gerçek hash).
  // Rozet dekoraif metin olmasin: kullanici hash'i gorebilsin diye dogrudan dosyaya baglaniyor.
  const SUMS = {
    windows: 'SHA256SUMS-Windows.txt',
    linux: 'SHA256SUMS-Linux.txt',
    android: 'NEXUS-Android.apk.sha256.txt',
  };
  const sumsLabel = c.lang === 'tr' ? 'Sağlama değerini gör' : 'View the published checksum';
  return `<section id="downloads">
  <div class="wrap">
    <div class="sec-head rv"><h2>${esc(c.downloads.heading)}</h2><p>${esc(c.downloads.lead)}</p></div>
    <div class="dl-grid">
      ${c.downloads.cards
        .map(
          ([plat, ic, name, sub, file, ext]) => `<div class="dl-card rv" data-platform="${plat}">
        <div class="dl-top">
          <div class="dl-ic">${getPlatformLogo(plat)}</div>
          <h3>${esc(name)}</h3>
          <span class="plat">${esc(sub)}</span>
        </div>
        <div class="dl-meta">
          <span><b data-nexus-ver>${APP_VERSION}</b></span>
          <span>${plat === 'windows' ? '64-bit .exe' : plat === 'android' ? 'APK' : '.deb'}</span>
          <a class="dl-sums" href="${DL_BASE}/${SUMS[plat]}" target="_blank" rel="noopener" title="${sumsLabel}">SHA-256</a>
        </div>
        <a class="btn btn-primary" href="${DL_BASE}/${file}" download>${icon('download')}${c.lang === 'tr' ? 'İndir' : 'Download'}</a>
      </div>`
        )
        .join('\n      ')}
    </div>
    <p class="dl-note">${esc(c.downloads.smartScreenNote)}</p>
    <div class="dl-gh"><a class="btn btn-ghost" href="https://github.com/Enard52/nexus-releases" target="_blank" rel="noopener" title="${c.lang === 'tr' ? 'Tüm kurucular, SHA-256 dosyaları ve güncelleme listeleri bu depoda' : 'Every installer, SHA-256 file and updater manifest lives in this repository'}">${icon('github')}${c.lang === 'tr' ? 'Kurulum deposunu gör' : 'View the installer repository'}</a></div>
  </div>
</section>`;
}

function renderFaq(c) {
  return `<section id="faq">
  <div class="wrap">
    <div class="sec-head center rv" style="margin-bottom:36px"><h2>${esc(c.faq.heading)}</h2></div>
    <div class="faq-list">
      ${c.faq.items.map(([q, a]) => `<div class="faq-item rv"><button class="faq-q" aria-expanded="false" onclick="nxToggleFaq(this)"><span>${esc(q)}</span>${icon('arrow')}</button><div class="faq-a"><div class="faq-a-in"><p>${esc(a)}</p></div></div></div>`).join('\n      ')}
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

  const contrib = c.lang === 'tr'
    ? { h: 'Toplulukla inşa edildi', p: 'NEXUS açık kaynaklıdır — her katkı algılanır.', o: 'Sahip', m: 'Yetkili' }
    : { h: 'Built with the community', p: 'NEXUS is open source — every contribution is credited.', o: 'Owner', m: 'Maintainer' };
  const contribHtml = `<section id="community">
  <div class="wrap">
    <div class="sec-head center rv"><h2>${esc(contrib.h)}</h2><p>${esc(contrib.p)}</p></div>
    <div id="nx-contrib" class="contrib-row">
      <a class="contrib-chip rv" href="https://github.com/Enard52" target="_blank" rel="noopener" title="@Enard52 — ${esc(contrib.o)}">
        <img src="https://github.com/Enard52.png" width="88" height="88" alt="@Enard52" loading="lazy"/>
        <span class="contrib-login">@Enard52</span>
        <span class="contrib-role is-owner">${esc(contrib.o)}</span>
      </a>
      <a class="contrib-chip rv" href="https://github.com/hadesonline02" target="_blank" rel="noopener" title="@hadesonline02 — ${esc(contrib.m)}">
        <img src="https://github.com/hadesonline02.png" width="88" height="88" alt="@hadesonline02" loading="lazy"/>
        <span class="contrib-login">@hadesonline02</span>
        <span class="contrib-role is-maintainer">${esc(contrib.m)}</span>
      </a>
    </div>
  </div>
</section>`;
  return contribHtml + `<footer class="ft">
  <div class="wrap">
    <div class="ft-grid">
      <div class="ft-brand">
        <a class="logo" href="${c.canonical}">${brand.logoSvg}<span>NEXUS</span></a>
        <p>${esc(c.footer.tagline)}</p>
        <div class="ft-trust-row">
          <span class="ft-trust-pill"><span class="ft-status-dot"></span>${c.lang === 'tr' ? '%100 Yerel Kontrol' : '100% Local Control'}</span>
          <span class="ft-trust-pill">${icon('shield')}${c.lang === 'tr' ? 'Sıfır Bulut Bağımlılığı' : 'Zero Cloud Dependency'}</span>
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
    <div id="nxContactSuccess" class="nx-form-success" style="display:none">
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
  const p = priceFor(c.lang);
  const tick = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m5 12 5 5L20 7"/></svg>`;
  const freeLines = isTr
    ? [
        'Sınırsız cihaz ve oda',
        'Yerel otomasyon ve sahneler',
        'Günde 30 AI komutu',
        'Cihazlar arasında eşitleme',
      ]
    : [
        'Unlimited devices and rooms',
        'Local automations and scenes',
        '30 AI commands a day',
        'Sync across your devices',
      ];
  const offerLines = isTr
    ? [
        'Günde 30 yerine ayda 2.000 AI yanıtı',
        'NEXUS AI ile doğal dille senaryo ve soru',
        'Tek hesap, tüm cihazlarında geçerli',
        'Dönem sonunda iptal',
      ]
    : [
        '2,000 AI replies a month instead of 30 a day',
        'Ask NEXUS AI to set scenes and answer in plain language',
        'One account, valid on every device',
        'Cancel at period end',
      ];
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

    <!-- Şifre sıfırlama bağlantısından gelen görünüm -->
    <div id="nxAuthRecoveryView" style="display:none">
      <div class="nx-auth-brand-badge">
        <div class="nx-app-logo">${brand.logoSvg}</div>
        <h3 id="nxRecoveryTitle">${isTr ? 'Yeni Şifre Belirle' : 'Set a New Password'}</h3>
        <p id="nxRecoverySubtitle">${isTr ? 'Hesabınız için yeni bir şifre girin.' : 'Choose a new password for your account.'}</p>
        <p id="nxRecoveryEmail" class="nx-profile-email-chip" style="margin-top:8px"></p>
      </div>
      <form id="nxRecoveryForm" onsubmit="nxSubmitRecovery(event)">
        <div id="nxRecoveryAlert" class="nx-auth-alert" style="display:none"></div>
        <div class="nx-auth-field-wrap">
          <label for="nxRecoveryPassword" class="nx-field-label">${isTr ? 'Yeni Şifre' : 'New Password'}</label>
          <input type="password" id="nxRecoveryPassword" class="nx-app-input" required placeholder="${isTr ? 'En az 6 karakter' : 'At least 6 characters'}" autocomplete="new-password">
        </div>
        <div class="nx-auth-field-wrap">
          <label for="nxRecoveryPassword2" class="nx-field-label">${isTr ? 'Yeni Şifre (tekrar)' : 'New Password (again)'}</label>
          <input type="password" id="nxRecoveryPassword2" class="nx-app-input" required placeholder="${isTr ? '••••••••' : '••••••••'}" autocomplete="new-password">
        </div>
        <button type="submit" id="nxRecoverySubmitBtn" class="btn btn-primary w-full nx-app-submit">
          <span>${isTr ? 'Şifreyi Kaydet' : 'Save Password'}</span>
        </button>
      </form>
      <div class="nx-auth-links">
        <button type="button" class="nx-auth-link muted" onclick="nxCloseAuthModal()">
          <span>${isTr ? 'Kapat' : 'Close'}</span>
        </button>
      </div>
    </div>

    <div id="nxAuthProfileView" class="nx-account" style="display:none">
      <div class="nx-account-person">
        <div class="nx-profile-avatar-large" id="nxProfileAvatarWrap">
          <svg viewBox="0 0 24 24" class="nx-user-icon" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
        </div>
        <div class="nx-avatar-actions" id="nxAvatarActions">
          <button type="button" class="nx-avatar-change" onclick="nxSitePickAvatar()" aria-label="${isTr ? 'Profil fotoğrafını değiştir' : 'Change profile photo'}" title="${isTr ? 'Profil fotoğrafını değiştir' : 'Change profile photo'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <span>${isTr ? 'Fotoğrafı değiştir' : 'Change photo'}</span>
          </button>
          <button type="button" id="nxAvatarRevertGoogle" style="display:none" onclick="nxSiteRevertGoogleAvatar()">${isTr ? 'Google fotoğrafına dön' : 'Back to Google photo'}</button>
          <button type="button" class="is-danger" id="nxAvatarRemove" style="display:none" onclick="nxSiteRemoveAvatar()">${isTr ? 'Fotoğrafı kaldır' : 'Remove photo'}</button>
        </div>
        <input type="file" id="nxAvatarFileInput" accept="image/*" style="display:none" onchange="nxSiteAvatarFile(this)">
        <div class="nx-profile-name-wrap">
          <div class="nx-profile-name-row">
            <h3 id="nxProfileNameDisplay">${isTr ? 'Kullanıcı' : 'Account'}</h3>
            <button type="button" class="nx-edit-name-btn" onclick="nxEditProfileName()" title="${isTr ? 'İsmi düzenle' : 'Edit name'}" aria-label="${isTr ? 'İsmi düzenle' : 'Edit name'}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
          </div>
          <span id="nxProfileEmail" class="nx-profile-email-chip"></span>
        </div>
      </div>

      <section class="nx-offer" aria-label="${isTr ? 'Plan' : 'Plan'}">
        <div class="nx-offer-inner">
          <div class="nx-offer-top">
            <span class="nx-plan-tag is-free" id="nxProfilePlanTag">${isTr ? 'Ücretsiz' : 'Free'}</span>
          </div>
          <ul class="nx-offer-list" id="nxProfilePerksFree">
            ${freeLines.map((line) => `<li>${tick}<span>${line}</span></li>`).join('')}
          </ul>
          <ul class="nx-offer-list is-hidden" id="nxProfilePerksPlus">
            ${offerLines.map((line) => `<li>${tick}<span>${line}</span></li>`).join('')}
          </ul>
        </div>
      </section>

      <div id="nxBillingPanel" class="nx-offer" style="display:none">
        <div class="nx-offer-inner">
          <p id="nxBillingStatus" class="nx-account-now" style="text-align:left;margin:0 0 8px"></p>
          <ul id="nxBillingPays" class="nx-offer-list"></ul>
          <button type="button" id="nxBillingCancel" class="nx-account-upgrade" style="display:none" onclick="nxLoadBilling('cancel')">${isTr ? 'Dönem sonunda iptal et' : 'Cancel at period end'}</button>
        </div>
      </div>

      <div class="nx-account-menu">
        <a id="nxProfileUpgrade" class="nx-account-item" href="${c.canonical}#pricing" onclick="nxCloseAuthModal()">
          <span class="nx-account-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 8v8M8 12h8"/></svg></span>
          <span class="nx-account-item-copy">
            <b>${isTr ? "NEXUS+'a geç" : 'Upgrade to NEXUS+'}</b>
            <small>${isTr ? `Aylık ${p.monthly} · Yıllık ${p.yearly}` : `Monthly ${p.monthly} · Yearly ${p.yearly}`}</small>
          </span>
          <span class="nx-account-chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg></span>
        </a>
        <button type="button" class="nx-account-item" onclick="nxOpenBilling()">
          <span class="nx-account-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M2 10h20"/></svg></span>
          <span class="nx-account-item-copy">
            <b>${isTr ? 'Aboneliği yönet' : 'Manage subscription'}</b>
            <small>${isTr ? 'Durum, ödemeler ve iptal' : 'Status, payments, and cancellation'}</small>
          </span>
          <span class="nx-account-chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg></span>
        </button>
        <button type="button" class="nx-account-item" onclick="nxSendPasswordReset()">
          <span class="nx-account-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m4 7 8 6 8-6"/></svg></span>
          <span class="nx-account-item-copy">
            <b>${isTr ? 'Şifreyi sıfırla' : 'Reset password'}</b>
            <small>${isTr ? 'Bağlantı e-postana gider' : 'A link goes to your email'}</small>
          </span>
          <span class="nx-account-chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg></span>
        </button>
        <button type="button" class="nx-account-item" onclick="nxChangeEmailPrompt()">
          <span class="nx-account-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span>
          <span class="nx-account-item-copy">
            <b>${isTr ? 'E-posta adresini değiştir' : 'Change email address'}</b>
            <small>${isTr ? 'Doğrulama bağlantısı yeni adresine gider' : 'A confirmation link goes to the new address'}</small>
          </span>
          <span class="nx-account-chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg></span>
        </button>
        <button type="button" class="nx-account-item nx-account-signout" onclick="nxSignOut()">
          <span class="nx-account-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg></span>
          <span class="nx-account-item-copy"><b>${isTr ? 'Oturumu kapat' : 'Sign out'}</b></span>
        </button>
      </div>
    </div>

  </div>
</div>
<div id="nxCheckoutModal" class="nx-modal-backdrop" onclick="if(event.target===this)nxCloseCheckout()" role="dialog" aria-modal="true" aria-label="${isTr ? 'Ödeme' : 'Checkout'}">
  <div class="nx-modal-card" style="max-width:480px;padding:18px 16px 16px">
    <button class="nx-modal-close" onclick="nxCloseCheckout()" aria-label="${isTr ? 'Kapat' : 'Close'}">&times;</button>
    <div id="nxCheckoutMount" style="min-height:420px"></div>
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
  // Marka kapağı: TR sayfalarda TR, geri kalanlarda EN banner (branding/ tek kaynak).
  // Kök de EN sayfadır: EN kapak. TR sayfalar TR kapak gösterir.
  const ogImage = SITE_ORIGIN + (c.lang === 'tr' ? '/og-cover-tr.jpg' : '/og-cover-en.jpg');
  const jsonLd = opts.schema
    ? `\n<script type="application/ld+json">${JSON.stringify(opts.schema).replace(/</g, '\\u003c')}</script>`
    : '';
  return `<meta charset="utf-8"/>
<script>
(function(){
  try{
    var d='light',t=null;
    try{t=localStorage.getItem('nx-site-theme')}catch(e){}
    if(t==='dark'||t==='light') d=t;
    else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches) d='dark';
    document.documentElement.setAttribute('data-theme',d);
  }catch(e){}
  try{
    if('scrollRestoration' in history) history.scrollRestoration='manual';
    var nav=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];
    var reload=nav&&nav.type==='reload';
    if(reload){
      if(location.hash) history.replaceState(null,'',location.pathname+location.search);
      scrollTo(0,0);
    }else if(location.hash){
      document.addEventListener('DOMContentLoaded',function(){
        var id=location.hash.slice(1);
        var el=id&&document.getElementById(id);
        if(el) el.scrollIntoView();
      });
    }
  }catch(e){}
})();
</script>
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
<meta name="theme-color" content="#ECE9FD"/>
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
    var L=location, p=L.pathname, isTrPage=(p==='/tr/'||p.indexOf('/tr/')!==-1);
    var navLangs=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language]).filter(Boolean);
    var turkic=/^(tr|az|kk|uz|ky|tk|tt|ba|crh|gag)$/;
    var home=false;
    for(var i=0;i<navLangs.length;i++){
      var bits=String(navLangs[i]).toLowerCase().replace('_','-').split('-');
      if(turkic.test(bits[0])||bits.slice(1).some(function(b){return /^(tr|az|kz|uz|kg|tm)$/.test(b);})){home=true;break;}
    }
    if(home) document.documentElement.setAttribute('data-home-lang','tr');
    var q=new URLSearchParams(L.search).get('lang');
    var saved=null;
    try{saved=localStorage.getItem('nx-lang')}catch(e){}
    if(!home){
      saved='en';
      try{localStorage.setItem('nx-lang','en')}catch(e){}
    }else if(q==='tr'||q==='en'){
      saved=q;
      try{localStorage.setItem('nx-lang',q)}catch(e){}
    }
    var targetLang=home?(saved||'tr'):'en';
    var isProd=(location.hostname==='nexus-smarthome.pages.dev'||location.hostname==='enard52.github.io');
    if(isProd){
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
    }
  }catch(e){}
  /* Scroll-reveal etiketi: ilk boyamadan ÖNCE eklenir (parlama olmasın). site.js
     yüklenmezse içerik görünmez kalmasın diye güvenlik ağı: 2.5 sn içinde
     __nxSiteReady işareti gelmezse etiket geri çekilir ve her şey görünür kalır. */
  try{
    var noMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!noMotion&&'IntersectionObserver' in window){
      document.documentElement.classList.add('nx-io');
      setTimeout(function(){
        if(!window.__nxSiteReady) document.documentElement.classList.remove('nx-io');
      },2500);
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
<main id="main">
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
<script src="/assets/site.js?v=20261029b"></script>
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
<main id="main" class="wrap" style="padding-bottom:60px">
  <div class="about-hero rv">
    <a class="int-more about-back" href="${c.canonical}">${icon('arrow', 'icon')} ${isTr ? 'Ana sayfaya dön' : 'Back to home'}</a>
    <p class="about-kicker">${isTr ? 'Ürün' : 'Product'}</p>
    <h1>${esc(ab.title)}</h1>
    <p class="lead">${esc(ab.lead)}</p>
  </div>

  <div class="about-card rv">
    <h2>${esc(ab.manifesto.heading)}</h2>
    <p>${esc(ab.manifesto.text)}</p>
  </div>

  <div class="about-section">
    <h2>${isTr ? 'Dört temel ilke' : 'Four principles'}</h2>
    <p>${isTr ? 'NEXUS mimarisini şekillendiren kurallar.' : 'The rules that shape how NEXUS is built.'}</p>
    <div class="grid c2" style="gap:16px">
      ${ab.pillars.map((p, i) => `
        <div class="card rv" style="padding:24px">
          <div class="f-ic">${icon(['zap', 'shield', 'plug', 'sparkles'][i])}</div>
          <h3 style="font-size:17px;font-weight:700;margin:0 0 8px">${esc(p.title)}</h3>
          <p style="font-size:14px;line-height:1.6;color:var(--text-2);margin:0">${esc(p.desc)}</p>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="about-section">
    <h2>${esc(ab.architecture.heading)}</h2>
    <p>${esc(ab.architecture.lead)}</p>
    <div class="about-arch">
      ${(ab.architecture.items || []).map((item) => `
        <div class="card rv">
          <div class="f-ic">${icon(item.icon)}</div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.desc)}</p>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="about-card about-cta rv">
    <h2>${isTr ? 'Kurulum dosyaları' : 'Get the apps'}</h2>
    <p style="margin:0 0 18px">${isTr ? 'Tüm platformlar ücretsiz: Windows, Linux ve Android hazır kurulumla gelir; macOS ve iOS kaynaktan derlenir. Cihaz komutları yerel ağında kalır.' : 'Every platform is free: ready installers for Windows, Linux and Android; macOS and iOS build from source. Device commands stay on your LAN.'}</p>
    <div class="about-cta-actions">
      ${platformDownloadBtn(`${c.canonical}#downloads`, 'btn btn-primary', isTr)}
      <a href="${c.canonical}#features" class="btn btn-ghost">${isTr ? 'Özellikler' : 'Features'}</a>
      <a href="${c.canonical}#pricing" class="btn btn-ghost">${isTr ? 'Fiyatlar' : 'Pricing'}</a>
    </div>
  </div>
</main>
${renderFooter(c)}
${renderContactModal(c)}
${renderAuthModal(c)}
${renderCustomDialog(c)}
<script src="/assets/cloud-config.js"></script>
<script src="/assets/site.js?v=20261029b"></script>
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
<main id="main" class="wrap">
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
<script src="/assets/site.js?v=20261029b"></script>
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
      ${platformDownloadBtn(`${home}#downloads`, 'btn', isTr)}
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

/* Giriş kısa yolu tanıtım sitesinin indirme bölümüne gider. Ayrı bir tarayıcı
   uygulaması yayınlanmıyor; hesap masaüstü programında ve Android'de açılır. */
function renderSignInRedirect(tr) {
  const home = tr ? '/tr/#downloads' : '/#downloads';
  const t = tr
    ? { lang: 'tr', title: 'NEXUS kurulumu', h1: 'Giriş programda', p: 'Hesap, masaüstü programında ve Android uygulamasında açılır. Kurulum dosyaları ana sayfada.', link: 'Kurulumu indir' }
    : { lang: 'en', title: 'Get NEXUS', h1: 'Sign in from the app', p: 'Your account opens in the desktop program and the Android app. Installers are on the home page.', link: 'Download' };
  return `<!DOCTYPE html><html lang="${t.lang}" data-theme="dark"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${t.title}</title><meta name="robots" content="noindex"/>
<meta http-equiv="refresh" content="0;url=${home}"/>
<style>:root{color-scheme:dark light}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#09090b;color:#e5e7eb;font:16px Inter,system-ui,sans-serif;text-align:center}main{padding:24px}h1{font-size:20px;margin:0 0 8px}p{margin:0;color:#9ca3af;font-size:14px}a{display:inline-block;margin-top:16px;min-height:44px;padding:12px 20px;border-radius:12px;background:#818cf8;color:#09090b;font-weight:700;text-decoration:none}</style>
</head><body><main><h1>${t.h1}</h1><p>${t.p}</p><p><a href="${home}">${t.link}</a></p></main>
<script>location.replace(${JSON.stringify(home)});</script></body></html>`;
}

/* Mobil uygulamada Google girişi sistem tarayıcısında yapılır. Supabase yalnız
   site alan adına dönüşe izin verdiği için belirteçler önce buraya gelir; sayfa
   onları nexus://auth adresine taşır ve tarayıcı geçmişinde bırakmaz. */
function renderAppAuth() {
  return `<!DOCTYPE html>
<html lang="tr" data-theme="light">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>NEXUS — Giriş aktarımı</title>
<meta name="robots" content="noindex, nofollow"/>
<meta name="referrer" content="no-referrer"/>
<link rel="icon" href="/icon.svg" type="image/svg+xml"/>
<link href="/fonts/inter/inter.css" rel="stylesheet"/>
<style>
  :root { color-scheme: light dark; --bg:#fafafc; --fg:#0b1020; --fg2:#5a6172; --bd:#e6e8f0; --brand:#4C7DFF; --ok:#0f9d70; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0b0d14; --fg:#eef1f8; --fg2:#9aa3b5; --bd:#232838; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100dvh; display:grid; place-items:center; background:var(--bg); color:var(--fg);
         font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif; -webkit-font-smoothing:antialiased; padding:24px; }
  .box { max-width:520px; text-align:center; }
  .mark { width:56px; height:56px; margin:0 auto 18px; display:block; }
  .badge { width:44px; height:44px; margin:0 auto 16px; border-radius:50%; display:grid; place-items:center;
           background:color-mix(in srgb, var(--ok) 14%, transparent); color:var(--ok); }
  .badge svg { width:24px; height:24px; }
  .badge.warn { background:color-mix(in srgb, #e11d48 12%, transparent); color:#e11d48; }
  h1 { font-size:26px; font-weight:800; letter-spacing:-.02em; margin:0 0 10px; }
  p { font-size:15px; line-height:1.65; color:var(--fg2); margin:0 0 24px; }
  a.btn { display:inline-flex; align-items:center; justify-content:center; min-height:48px; padding:0 24px; border-radius:12px;
          font-size:15px; font-weight:700; text-decoration:none; background:var(--brand); color:#fff; }
  .hint { margin:18px 0 0; font-size:13px; color:var(--fg2); }
  .hint a { color:var(--brand); font-weight:700; text-decoration:none; }
  .hidden { display:none !important; }
</style>
</head>
<body>
  <main class="box">
    <img class="mark" src="/icon.svg" alt="NEXUS" width="56" height="56"/>
    <div id="ok" class="hidden">
      <div class="badge" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>
      <h1 id="ok-title">Giriş tamamlandı</h1>
      <p id="ok-text">NEXUS uygulaması açılıyor. Açılmazsa aşağıdaki düğmeye dokun.</p>
      <a class="btn" id="open-app" href="nexus://auth">NEXUS’u aç</a>
      <p class="hint"><span id="no-app">Uygulama yüklü değil mi?</span> <a href="/tr/#downloads" id="download-link">Android sürümünü indir</a></p>
    </div>
    <div id="fail" class="hidden">
      <div class="badge warn" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg></div>
      <h1 id="fail-title">Giriş tamamlanamadı</h1>
      <p id="fail-text">Bağlantının süresi dolmuş olabilir. NEXUS’a dönüp yeniden dene.</p>
      <a class="btn" href="nexus://auth">NEXUS’a dön</a>
    </div>
  </main>
  <script>
    (function () {
      var tr = /^tr\\b/i.test(navigator.language || '');
      document.documentElement.lang = tr ? 'tr' : 'en';
      function set(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
      function show(id) { var el = document.getElementById(id); if (el) el.classList.remove('hidden'); }

      var hash = location.hash && location.hash.length > 1 ? location.hash.slice(1) : '';
      var query = location.search && location.search.length > 1 ? location.search.slice(1) : '';
      var raw = hash || query;
      var params = new URLSearchParams(raw);
      var hasToken = !!(params.get('access_token') && params.get('refresh_token'));
      var error = params.get('error') || '';
      var appUrl = 'nexus://auth' + (raw ? '#' + raw : '');

      // Belirteçleri tarayıcı geçmişinde bırakma; adres çubuğu temiz kalsın.
      try { history.replaceState(null, '', location.pathname); } catch (e) {}

      if (hasToken) {
        show('ok');
        if (tr) {
          set('ok-title', 'Giriş tamamlandı');
          set('ok-text', 'NEXUS uygulaması açılıyor. Açılmazsa aşağıdaki düğmeye dokun.');
          set('open-app', 'NEXUS’u aç');
          set('no-app', 'Uygulama yüklü değil mi?');
          set('download-link', 'Android sürümünü indir');
          document.getElementById('download-link').href = '/tr/#downloads';
        } else {
          set('ok-title', 'Signed in');
          set('ok-text', 'Opening the NEXUS app. If it does not open, tap the button below.');
          set('open-app', 'Open NEXUS');
          set('no-app', 'App not installed?');
          set('download-link', 'Download the Android version');
          document.getElementById('download-link').href = '/#downloads';
        }
        var open = document.getElementById('open-app');
        if (open) open.setAttribute('href', appUrl);
        // Özel şemayı kendiliğinden açmayı dene; tarayıcı engellerse düğme hazır.
        setTimeout(function () { try { location.href = appUrl; } catch (e) {} }, 450);
        return;
      }

      show('fail');
      if (tr) {
        set('fail-title', 'Giriş tamamlanamadı');
        set('fail-text', 'Bağlantının süresi dolmuş olabilir. NEXUS’a dönüp yeniden dene.');
      } else {
        set('fail-title', 'Sign-in failed');
        set('fail-text', 'The link may have expired. Go back to NEXUS and try again.');
      }
      if (error) {
        var desc = params.get('error_description') || error;
        desc = desc.replace(/\\+/g, ' ');
        set('fail-text', desc);
      }
    })();
  </script>
</body>
</html>`;
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
Disallow: /app-auth.html
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
        theme_color: '#4C7DFF',
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
/* HTTP başlıkları da üretilir: telefon çerçevesindeki canlı önizleme, uygulamanın
   origin'ini frame-src olarak ister. Elle tutulan _headers bu bağı takipte bayat
   kalıyordu; artık APP_URL'den türüyor (verify-site yayınlanan başlığı da denetliyor). */
function renderHeaders() {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "frame-src 'self'",
    'connect-src \'self\' https://api.github.com https://formsubmit.co https://*.supabase.co',
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "form-action 'self'",
  ].join('; ');
  return `# scripts/site-build.mjs → renderHeaders() üretir; elle düzenlemeyin.
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Content-Security-Policy: ${csp}

/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=86400

/assets/site.js
  Cache-Control: public, max-age=0, must-revalidate

/assets/site-boot.js
  Cache-Control: public, max-age=0, must-revalidate

/images/*
  Cache-Control: public, max-age=604800

/*.svg
  Cache-Control: public, max-age=86400

/*.png
  Cache-Control: public, max-age=86400
`;
}

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
  // Mobil Google giriş dönüşü: belirteçleri uygulamanın nexus://auth adresine taşır.
  writeFileSync(join(PUB, 'app-auth.html'), renderAppAuth(), 'utf8');

  // 404 artık üretimin parçası: bayat elle kopya (253 KB, ölü bağlantılar) siliniyor.
  writeFileSync(join(PUB, '404.html'), renderNotFound(content.en), 'utf8');
  writeFileSync(join(PUB, 'tr', '404.html'), renderNotFound(content.tr), 'utf8');

  // Keşif dosyaları da üretime dahil (index.html <link rel="manifest"> bunlara işaret ediyor).
  // Marka görselleri: og kapakları (1200×630) + e-posta üst banner türevleri (~40 KB JPEG).
  mkdirSync(join(PUB, 'images', 'mail'), { recursive: true });
  for (const bf of ['og-cover-en.jpg', 'og-cover-tr.jpg', 'og-cover-neutral.jpg']) {
    if (existsSync(join(ROOT, 'branding', bf))) cpSync(join(ROOT, 'branding', bf), join(PUB, bf));
  }
  for (const bf of ['mail-banner-tr.jpg', 'mail-banner-en.jpg']) {
    if (existsSync(join(ROOT, 'branding', bf))) cpSync(join(ROOT, 'branding', bf), join(PUB, 'images', 'mail', bf));
  }
  writeFileSync(join(PUB, 'robots.txt'), renderRobots(), 'utf8');
  writeFileSync(join(PUB, 'sitemap.xml'), renderSitemap(today), 'utf8');
  writeFileSync(join(PUB, 'manifest.webmanifest'), renderManifest(), 'utf8');
  writeFileSync(join(PUB, '_headers'), renderHeaders(), 'utf8');

  console.log('✓ index.html');
  console.log('✓ tr/index.html');
  console.log('✓ 404.html & tr/404.html');
  console.log('✓ login.html & tr/login.html');
  console.log('✓ app-auth.html');
  console.log('✓ about.html');
  console.log('✓ tr/about.html');
  console.log('✓ privacy.html & tr/privacy.html');
  console.log('✓ terms.html & tr/terms.html');
  console.log('✓ refund.html & tr/refund.html');
  console.log('✓ assets/site.js');
  console.log('✓ assets/site-boot.js');
  console.log('✓ robots.txt & sitemap.xml & manifest.webmanifest & _headers');
  console.log('Ekran görüntüleri:', hasShots ? 'VAR (images/shots/)' : 'YOK');
}

build();
