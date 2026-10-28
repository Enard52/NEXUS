// Leaflet'i node_modules'dan www/leaflet'e taşır (npm bağımlılığı → paket içi varlık).
// Tıpkı copy-fonts/copy-lucide gibi: harici CDN'den çekmek yok, kütüphane repoda durur,
// böylece mobil paket çevrimdışı da açılır.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "leaflet", "dist");
const out = join(root, "www", "leaflet");

if (!existsSync(src)) {
  throw new Error("node_modules/leaflet bulunamadı — once 'pnpm add -D leaflet' calistirin.");
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const file of ["leaflet.js", "leaflet.css"]) {
  cpSync(join(src, file), join(out, file));
}
cpSync(join(src, "images"), join(out, "images"), { recursive: true });

console.log("Leaflet yerellestirildi: www/leaflet (js + css + images)");
