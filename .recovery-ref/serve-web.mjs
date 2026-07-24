// Minimal static server rooted at packages/web/dist so the demo's
// "/downloads/NEXUS-Setup-3.14.2.exe" link resolves to the real installer.
// Run: node .recovery-ref/serve-web.mjs   →  http://localhost:4175/
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "packages", "web", "dist");
const port = 4175;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".exe": "application/vnd.microsoft.portable-executable",
};

createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const filePath = normalize(join(root, pathname));
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const info = await stat(filePath);
    if (info.isDirectory()) {
      res.writeHead(302, { Location: pathname.replace(/\/?$/, "/") }).end();
      return;
    }
    const ext = extname(filePath).toLowerCase();
    const headers = { "Content-Type": MIME[ext] || "application/octet-stream" };
    if (ext === ".exe") {
      headers["Content-Disposition"] = 'attachment; filename="NEXUS-Setup-3.14.2.exe"';
    }
    res.writeHead(200, headers);
    res.end(await readFile(filePath));
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
}).listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`NEXUS demo → http://localhost:${port}/  (tr: http://localhost:${port}/tr/)`);
});
