// NEXUS desktop preview server serves public/ on port 4179.
// Root serves the canonical desktop preview mirror: public/desktop/windows/
// index.html, which (like its byte-identical alias public/desktop-home.html)
// is generated from packages/desktop/src via `pnpm build:static` — never
// hand-edited (see the duplicate-file rule in scripts/copy-static.mjs).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize, resolve } from "node:path";

const root = resolve("public");
const port = Number(process.env.PORT || 4179);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json; charset=utf-8",
};

const primaryDesktopPath = "/desktop/windows/index.html";

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/" || urlPath === "/desktop-home.html") {
      urlPath = primaryDesktopPath;
    }
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
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`NEXUS desktop preview: http://127.0.0.1:${port}/ (${primaryDesktopPath})`);
});
