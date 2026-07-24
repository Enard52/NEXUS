// Zero-dependency static server for previewing ALL built demos (repo root).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

const root = process.cwd();
const port = 4174;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath.endsWith("/")) urlPath += "index.html";
    const filePath = normalize(join(root, urlPath));
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    let target = filePath;
    try {
      const s = await stat(target);
      if (s.isDirectory()) target = join(target, "index.html");
    } catch {
      /* fall through */
    }
    const body = await readFile(target);
    res.writeHead(200, { "Content-Type": types[extname(target)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>404 Not Found</h1>");
  }
});

server.listen(port, () => {
  const b = `http://localhost:${port}`;
  console.log(`NEXUS all-demos preview: ${b}/`);
  console.log(`  Desktop app (Windows)   : ${b}/packages/desktop/dist/windows/index.html`);
  console.log(`  Setup wizard (Windows)  : ${b}/packages/desktop/dist/windows/setup.html`);
  console.log(`  Setup wizard (TR)       : ${b}/packages/desktop/dist/tr/windows/setup.html`);
  console.log(`  Mobile app              : ${b}/packages/mobile/dist/index.html`);
});
