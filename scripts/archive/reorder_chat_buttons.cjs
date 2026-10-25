const fs = require("fs");

let chatHtml = fs.readFileSync("stitch-chat.html", "utf8");

const regex = /<div class="flex items-center gap-3 px-6 w-max mx-auto">([\s\S]*?)<\/div>\s*<\/div>/;
const match = chatHtml.match(regex);

if (match) {
  const buttonsHtml = match[1];

  // We can extract each button using regex
  const btnRegex = /<button[\s\S]*?<\/button>/g;
  const buttons = [...buttonsHtml.matchAll(btnRegex)].map((m) => m[0]);

  // Original buttons order (0-based indices from extraction):
  // 0: Akıllı Kontrol (purple)
  // 1: Tasarruf Modu (amber)
  // 2: Sıcaklık Ayarı (blue)
  // 3: Gece Modu (indigo)
  // 4: Müzik Başlat (rose)

  // New Order:
  // 1. Sıcaklık Ayarı (2)
  // 2. Müzik Başlat (4)
  // 3. Tasarruf Modu (1)
  // 4. Gece Modu (3)
  // 5. Akıllı Kontrol (0)

  if (buttons.length >= 5) {
    const newButtonsHtml = `
          ${buttons[2]}
          ${buttons[4]}
          ${buttons[1]}
          ${buttons[3]}
          ${buttons[0]}
        `;

    const newContainerHtml = `<div class="flex items-center gap-3 px-6 w-max mx-auto">\n${newButtonsHtml}\n        </div>\n      </div>`;
    chatHtml = chatHtml.replace(regex, newContainerHtml);

    fs.writeFileSync("stitch-chat.html", chatHtml, "utf8");
    console.log("Buttons reordered successfully.");
  } else {
    console.log("Could not find all 5 buttons. Found: " + buttons.length);
  }
} else {
  console.log("Could not find the container regex match.");
}
