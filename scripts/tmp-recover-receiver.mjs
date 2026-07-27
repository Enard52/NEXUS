// Emergency recovery receiver: accepts a POSTed HTML body and writes it to
// public/desktop-home.html. Used once to pull the premium desktop page out of
// the browser HTTP cache after the file went missing on disk.
import { createServer } from "node:http";
import { writeFileSync } from "node:fs";

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") {
    res.writeHead(200).end("ready");
    return;
  }
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    writeFileSync("public/desktop-home.html", body);
    console.log("saved public/desktop-home.html", body.length, "bytes");
    res.writeHead(200).end(String(body.length));
  });
});

const port = Number(process.env.RECOVER_PORT || 4199);
server.listen(port, "127.0.0.1", () => console.log("recovery receiver on " + port));
