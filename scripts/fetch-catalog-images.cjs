// Genel cihaz katalogu icin GERCEK cihaz fotograflarini Wikimedia Commons'tan indirir.
// Kaynak: Wikimedia Commons (serbest lisansli gercek urun fotograflari).
const https = require('https');
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

// slug -> Commons arama anahtar kelimesi (Ingilizce, urun odakli)
const MAP = {
  'bulb': 'smart LED light bulb',
  'rgb-bulb': 'RGB color LED bulb',
  'led-strip': 'LED strip light',
  'panel-light': 'LED panel light',
  'light-switch': 'smart light switch wall',
  'smart-plug': 'smart plug socket',
  'power-strip': 'power strip extension',
  'wall-switch': 'wall light switch',
  'dimmer': 'dimmer switch knob',
  'motion-sensor': 'PIR motion sensor',
  'door-sensor': 'door window contact sensor',
  'temp-humidity': 'thermometer hygrometer',
  'water-leak': 'water leak detector sensor',
  'indoor-camera': 'indoor security camera',
  'outdoor-camera': 'outdoor surveillance camera',
  'camera-360': '360 panoramic camera',
  'smart-lock': 'smart door lock',
  'fingerprint-lock': 'fingerprint door lock',
  'thermostat': 'smart thermostat',
  'air-conditioner': 'air conditioner indoor unit',
  'humidifier': 'air humidifier',
  'air-quality': 'air quality monitor',
  'refrigerator': 'refrigerator fridge',
  'washing-machine': 'washing machine',
  'dishwasher': 'dishwasher',
  'dryer': 'clothes dryer machine',
  'smart-tv': 'smart television',
  'media-box': 'android tv box media player',
  'soundbar': 'soundbar speaker',
  'smart-speaker': 'smart speaker',
  'home-theater': 'home theater speaker',
  'smart-hub': 'smart home hub',
  'gateway': 'iot gateway device',
  'zigbee-bridge': 'zigbee hub',
  'hue-bridge': 'philips hue bridge',
  'wifi-router': 'wifi router',
  'robot-vacuum': 'robot vacuum cleaner',
  'robot-mop': 'robot mop cleaner',
  'window-robot': 'window cleaning robot',
  'pool-robot': 'robotic pool cleaner',
  'energy-meter': 'electricity energy meter',
  'smart-meter': 'smart electricity meter',
  'power-monitor': 'power consumption monitor plug',
  'solar-panel': 'solar panel',
  'energy-display': 'energy monitor display',
  'air-purifier': 'air purifier',
  'heater': 'electric space heater',
  'fan': 'electric fan',
  'mosquito-repellent': 'electric mosquito repellent',
};

const targets = [
  path.join(__dirname, '..', 'assets', 'products'),
  path.join(__dirname, '..', 'www', 'assets', 'products'),
  path.join(__dirname, '..', 'mobile-app', 'www', 'assets', 'products'),
];
targets.forEach((d) => fs.mkdirSync(d, { recursive: true }));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJsonOnce(url) {
  return new Promise((res, rej) => {
    https.get(url, { headers: { 'User-Agent': UA }, timeout: 15000 }, (r) => {
      let b = '';
      r.on('data', (c) => (b += c));
      r.on('end', () => {
        if (!/^\s*[{[]/.test(b)) return rej(new Error('throttled-text'));
        let j;
        try { j = JSON.parse(b); } catch (e) { return rej(new Error('parse')); }
        if (j && j.error) return rej(new Error('api-error:' + (j.error.code || '')));
        if (!j || !j.query) return rej(new Error('no-query'));
        return res(j);
      });
    }).on('error', rej).on('timeout', function () { this.destroy(new Error('timeout')); });
  });
}

async function getJson(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try { return await getJsonOnce(url); }
    catch (e) { await sleep(3000 * (attempt + 1)); }
  }
  throw new Error('throttled');
}

function getBuf(url) {
  return new Promise((res, rej) => {
    https.get(url, { headers: { 'User-Agent': UA }, timeout: 20000 }, (r) => {
      if (r.statusCode !== 200) { r.resume(); return rej(new Error('status ' + r.statusCode)); }
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => res(Buffer.concat(chunks)));
    }).on('error', rej).on('timeout', function () { this.destroy(new Error('timeout')); });
  });
}

async function pick(slug, query) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search'
    + '&gsrsearch=' + encodeURIComponent('filetype:bitmap ' + query)
    + '&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url%7Cmime%7Csize&iiurlwidth=400';
  const j = await getJson(url);
  const pages = j.query && j.query.pages ? Object.values(j.query.pages) : [];
  pages.sort((a, b) => (a.index || 0) - (b.index || 0));
  const kw = query.toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
  const usable = pages.filter((p) => {
    const ii = p.imageinfo && p.imageinfo[0];
    return ii && ii.thumburl && (ii.mime === 'image/jpeg' || ii.mime === 'image/png');
  });
  // once basligi sorgu kelimesi iceren sonuclari dene (alaka filtresi), sonra ilk uygun sonucu
  const relevant = usable.filter((p) => { const t = p.title.toLowerCase(); return kw.some((w) => t.indexOf(w) !== -1); });
  const ordered = relevant.concat(usable.filter((p) => relevant.indexOf(p) === -1));
  for (const p of ordered) {
    const ii = p.imageinfo[0];
    const ext = ii.mime === 'image/png' ? 'png' : 'jpg';
    try {
      const buf = await getBuf(ii.thumburl);
      if (buf.length < 800) continue;
      const file = slug + '.' + ext;
      targets.forEach((d) => fs.writeFileSync(path.join(d, file), buf));
      return { slug, file, title: p.title, bytes: buf.length };
    } catch (e) { /* sonrakini dene */ }
  }
  return { slug, err: 'no usable result' };
}

(async () => {
  const map = {};
  const fail = [];
  const entries = Object.entries(MAP);
  for (const [s, q] of entries) {
    const r = await pick(s, q).catch((e) => ({ slug: s, err: e.message }));
    if (r.file) { map[r.slug] = r.file; console.log('OK  ', r.slug, '<-', r.title); }
    else { fail.push(r.slug + ' [' + r.err + ']'); console.log('FAIL', r.slug, r.err); }
    await sleep(3500);
  }
  fs.writeFileSync(path.join(__dirname, '_img-map.json'), JSON.stringify(map, null, 2));
  console.log('\nDONE ' + Object.keys(map).length + '/' + entries.length + ' -> scripts/_img-map.json');
  if (fail.length) console.log('FAILED:', fail.join(', '));
  process.exit(0);
})();
