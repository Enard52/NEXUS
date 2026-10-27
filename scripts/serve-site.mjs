// NEXUS — Yerel site sunucusu (Cloudflare Pages davranışını taklit eder)
// Kullanım: node scripts/serve-site.mjs [port]   (varsayılan 8767)
// Kaynak kök: www/public
// Pages gibi: /about → about.html, /tr/privacy → tr/privacy.html,
//             dizinler → index.html, bilinmeyen adres → 404.html (404 koduyla).
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "www", "public");
const PORT = Number(process.argv[2]) || 8767;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

async function fileAt(p) {
  const full = join(ROOT, p.replace(/^\//, ""));
  if (!full.startsWith(ROOT)) return null; // yol kaçışı
  const st = await stat(full).catch(() => null);
  if (st && st.isDirectory()) {
    for (const idx of ["index.html", "index.htm"]) {
      const f = join(full, idx);
      if (await stat(f).then(() => true).catch(() => false)) return f;
    }
    return null;
  }
  return st ? full : null;
}

async function resolve(p) {
  const direct = await fileAt(p);
  if (direct) return { file: direct, status: 200 };
  const clean = p.replace(/\/+$/, "");
  if (!/\.[a-z0-9]+$/i.test(clean)) {
    // Temiz URL: /about → about.html, /tr/about → tr/about.html
    const html = await fileAt(clean + ".html");
    if (html) return { file: html, status: 200 };
  }
  const notFound = await fileAt("/404.html");
  return notFound ? { file: notFound, status: 404 } : null;
}

const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  const hit = await resolve(p);
  if (!hit) { res.writeHead(404); res.end("not found"); return; }
  const data = await readFile(hit.file);
  res.writeHead(hit.status, { "content-type": MIME[extname(hit.file).toLowerCase()] || "application/octet-stream" });
  res.end(data);
});

server.listen(PORT, () => console.log(`NEXUS site → http://localhost:${PORT}/ (Pages benzeri temiz URL desteğiyle)`));
