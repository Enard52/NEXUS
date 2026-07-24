// Zero-dependency static server for previewing the rebuilt web demo.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

const root = join(process.cwd(), "packages", "web", "dist");
const port = 4173;

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
      /* fall through to readFile error */
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
  // eslint-disable-next-line no-console
  console.log(`NEXUS web demo preview: http://localhost:${port}/`);
  console.log(`  EN dark   : http://localhost:${port}/`);
  console.log(`  EN light  : http://localhost:${port}/light.html`);
  console.log(`  TR dark   : http://localhost:${port}/tr/`);
  console.log(`  TR light  : http://localhost:${port}/tr/light.html`);
});
