// Analyze the recovered premium desktop page (public/desktop-home.html).
import { readFileSync } from "node:fs";

const src = readFileSync("public/desktop-home.html", "utf8");
const out = [];
out.push("chars: " + src.length);

const styleBlocks = [...src.matchAll(/<style[^>]*>/g)].map((m) => m.index);
out.push("style blocks at: " + styleBlocks.join(", "));
const styleEnd = src.indexOf("</style>");
out.push("first style len: " + (styleEnd - styleBlocks[0]));

const scriptBlocks = [...src.matchAll(/<script[^>]*>/g)].map((m) => m.index);
out.push("script blocks at: " + scriptBlocks.join(", "));

const bodyStart = src.indexOf("<body");
out.push("body starts: " + bodyStart);

for (const attr of ["onclick", "onerror", "onchange", "oninput", "onload", "onkeydown"]) {
  const n = (src.match(new RegExp(attr + '="', "g")) || []).length;
  out.push(`inline ${attr}=: ${n}`);
}

const ext = [...src.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => m[1]);
const hosts = {};
for (const u of ext) { try { const h = new URL(u).host; hosts[h] = (hosts[h] || 0) + 1; } catch {} }
out.push("external hosts: " + JSON.stringify(hosts));

const dataUris = (src.match(/data:image\//g) || []).length;
out.push("data: image URIs: " + dataUris);

for (const needle of ["Ensar", "3.14.2", "GOOD EVENING", "Good evening", "82°", "data-theme", "id=\"", "section", "aria-"]) {
  out.push(`needle ${JSON.stringify(needle)}: ${src.split(needle).length - 1}`);
}

// last script content preview (nav/behavior script)
const lastScript = scriptBlocks[scriptBlocks.length - 1];
out.push("--- last script preview ---");
out.push(src.slice(lastScript, lastScript + 1200));

console.log(out.join("\n"));
