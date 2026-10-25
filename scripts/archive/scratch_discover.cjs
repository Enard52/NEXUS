const fs = require("fs");
const file = "c:/Users/ensar/Desktop/NEXUS-main/stitch-discover.html";
let html = fs.readFileSync(file, "utf8");

const targetStr = `<!-- AI Button -->
<a href="stitch-chat.html" class="ai-button-gradient w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md text-sm" style="background: linear-gradient(135deg, #7C5CFF 0%, #22D3EE 100%);">
        AI
      </a>`;

if (html.includes(targetStr)) {
  html = html.replace(targetStr, "<!-- AI Button removed -->");
  fs.writeFileSync(file, html, "utf8");
  console.log("Successfully removed the AI button.");
} else {
  console.log("Target string not found!");
}
