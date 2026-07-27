// Analyze public/desktop/windows/index.html for the premium→source port.
import { readFileSync } from "node:fs";

const src = readFileSync("public/desktop/windows/index.html", "utf8");
console.log("bytes:", src.length);

const styleStart = src.indexOf("<style>");
const styleEnd = src.indexOf("</style>");
const bodyStart = src.indexOf("<body");
const bodyEnd = src.lastIndexOf("</body>");
console.log("style block:", styleStart, "→", styleEnd, `(${styleEnd - styleStart} chars)`);
console.log("body block:", bodyStart, "→", bodyEnd, `(${bodyEnd - bodyStart} chars)`);
console.log("style count:", (src.match(/<style>/g) || []).length);
console.log("script tags:", (src.match(/<script/g) || []).length);

// Inline event handlers
for (const attr of ["onclick", "onerror", "onchange", "oninput", "onload", "onkeydown", "onsubmit", "onmouseover"]) {
  const n = (src.match(new RegExp(attr + '="', "g")) || []).length;
  if (n) console.log(`inline ${attr}=`, n);
}

// External resources
const imgs = [...src.matchAll(/src="(https?:[^"]+)"/g)].map((m) => m[1]);
const hosts = {};
for (const u of imgs) { const h = new URL(u).host; hosts[h] = (hosts[h] || 0) + 1; }
console.log("external img hosts:", hosts);

// Head lines
console.log("\n--- head (first 40 lines) ---");
console.log(src.slice(0, src.indexOf("</head>")).split("\n").slice(0, 40).join("\n").slice(0, 2500));

// Text markers that look dynamic (user name, versions, dates)
for (const needle of ["Ensar", "3.14.2", "v3.14", "GOOD EVENING", "Saturday", "82°F", "lang=", "data-theme"]) {
  const n = src.split(needle).length - 1;
  console.log(`needle "${needle}":`, n);
}
