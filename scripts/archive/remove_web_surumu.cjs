const fs = require("fs");

let html = fs.readFileSync("stitch-profile.html", "utf8");

// Regex to find and remove the Web Sürümü list item
// Matches from <!-- NEXUS AI Web Sürümü --> (or any variation) to </a></li>
const regex = /<!-- NEXUS AI Web S[^>]+-->\s*<li><a[^>]+href="stitch-web\.html"[\s\S]*?<\/a><\/li>/;

html = html.replace(regex, "");

fs.writeFileSync("stitch-profile.html", html, "utf8");
console.log("Removed Web Sürümü from stitch-profile.html");
