// NEXUS tasarım dönüşü (regresyon) karşılaştırması — iki ekran görüntüsünü piksel piksel
// ölçer. Tasarıma dokunan bir değişiklikten önce ve sonra alınan görüntüler buradan
// geçirilir: 0 fark = görünüm birebir aynı; farklılık varsa kutusu (x/y/boyut) nerede
// olduğunu söyler. PNG çözümlemesi Chromium canvas'ında yapılır, ek bağımlılık yok.
// Kullanım: node scripts/ui-pixdiff.mjs ONCE.png SONRA.png
// Yalnızca PNG'yi base64 olarak çözer; dosyaları değiştirmez.
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const [a, b] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
const buf = async (f) => (await readFile(f)).toString("base64");
const out = await page.evaluate(
  async ([A, B]) => {
    const load = (d) =>
      new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = rej;
        im.src = "data:image/png;base64," + d;
      });
    const [ia, ib] = await Promise.all([load(A), load(B)]);
    if (ia.width !== ib.width || ia.height !== ib.height)
      return { size: [`${ia.width}×${ia.height}`, `${ib.width}×${ib.height}`], diff: -1, box: null };
    const px = (im) => {
      const c = document.createElement("canvas");
      c.width = im.width;
      c.height = im.height;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(im, 0, 0);
      return g.getImageData(0, 0, im.width, im.height).data;
    };
    const da = px(ia), db = px(ib);
    let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let i = 0; i < da.length; i += 4) {
      if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) + Math.abs(da[i + 3] - db[i + 3]) > 8) {
        n++;
        const p = i / 4, x = p % ia.width, y = (p / ia.width) | 0;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    return { size: `${ia.width}×${ia.height}`, diff: n, box: n ? [x0, y0, x1 - x0 + 1, y1 - y0 + 1] : null };
  },
  [await buf(a), await buf(b)]
);
console.log(`${a.split(/[\\/]/).pop()} → boyut ${out.size} · farklı piksel ${out.diff}${out.box ? " · fark kutusu x" + out.box[0] + " y" + out.box[1] + " " + out.box[2] + "×" + out.box[3] : ""}`);
await browser.close();
