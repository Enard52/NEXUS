const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ICONS = [
  {
    name: 'home',
    // Home icon
    svg: `<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g-home" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6F9BFF"/>
          <stop offset="50%" stop-color="#5B8DFF"/>
          <stop offset="100%" stop-color="#8B7BFF"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#g-home)"/>
      <g fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="translate(10, 10)">
        <path d="M3 10.5 14 2.5l11 8V24a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="10 26 10 14 18 14 18 26"/>
      </g>
    </svg>`
  },
  {
    name: 'pair',
    // Plus / Add device icon
    svg: `<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g-pair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#56CCF2"/>
          <stop offset="50%" stop-color="#4C7DFF"/>
          <stop offset="100%" stop-color="#6F9BFF"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#g-pair)"/>
      <g fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(10, 10)">
        <circle cx="14" cy="14" r="12" stroke-width="2.8"/>
        <line x1="14" y1="8" x2="14" y2="20"/>
        <line x1="8" y1="14" x2="20" y2="14"/>
      </g>
    </svg>`
  },
  {
    name: 'messages',
    // Bell / Notification icon
    svg: `<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g-msg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#8B7BFF"/>
          <stop offset="50%" stop-color="#7C5CFC"/>
          <stop offset="100%" stop-color="#6F9BFF"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#g-msg)"/>
      <g fill="none" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" transform="translate(10, 9)">
        <path d="M19 8a5 5 0 0 0-10 0c0 7-3 9-3 9h16s-3-2-3-9"/>
        <path d="M11.73 21a2 2 0 0 0 3.54 0"/>
      </g>
    </svg>`
  },
  {
    name: 'settings',
    // Gear / Settings icon
    svg: `<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g-set" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6B7280"/>
          <stop offset="50%" stop-color="#4B5563"/>
          <stop offset="100%" stop-color="#5B8DFF"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#g-set)"/>
      <g fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(10, 10)">
        <circle cx="14" cy="14" r="4.5"/>
        <path d="M14 2v3M14 23v3M2 14h3M23 14h3M5.5 5.5l2.1 2.1M20.4 20.4l2.1 2.1M5.5 22.5l2.1-2.1M20.4 7.6l2.1-2.1"/>
      </g>
    </svg>`
  }
];

function pngsToIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4); // count

  let offset = 6 + (count * 16);
  const entries = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // colors
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...images.map(i => i.buffer)]);
}

async function run() {
  const outDir = path.join(__dirname, '..', 'desktop', 'resources', 'icons');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 256, height: 256 } });

  const SIZES = [16, 24, 32, 48];

  for (const item of ICONS) {
    const images = [];
    for (const size of SIZES) {
      await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;background:transparent;overflow:hidden;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;">
        <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
          ${item.svg.replace('width="48" height="48"', `width="${size}" height="${size}"`)}
        </div>
      </body></html>`);

      const buf = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
      images.push({ width: size, height: size, buffer: buf });
    }

    const icoBuf = pngsToIco(images);
    const icoPath = path.join(outDir, `${item.name}.ico`);
    fs.writeFileSync(icoPath, icoBuf);
    console.log(`Created: ${icoPath} (${icoBuf.length} bytes, ${SIZES.length} resolutions)`);
  }

  await browser.close();
  console.log('All JumpList icons generated successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
