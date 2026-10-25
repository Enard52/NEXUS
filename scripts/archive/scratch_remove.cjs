const fs = require("fs");
const file = "c:/Users/ensar/Desktop/NEXUS-main/stitch-discover.html";
let html = fs.readFileSync(file, "utf8");

// The AI button is `<a href="stitch-chat.html" class="ai-button-gradient ..."> ... </a>`
// We will replace it using a regex.
const regex =
  /<!-- AI Button -->[\s\S]*?<a href="stitch-chat\.html" class="ai-button-gradient[^>]+>\s*AI\s*<\/a>/i;

if (regex.test(html)) {
  html = html.replace(regex, "<!-- AI Button removed -->");
  fs.writeFileSync(file, html, "utf8");
  console.log("Successfully removed AI button.");
} else {
  console.log("Target string not found with regex!");
}
