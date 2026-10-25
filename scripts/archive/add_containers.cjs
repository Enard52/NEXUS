const fs = require("fs");

let home = fs.readFileSync("stitch-home.html", "utf8");
if (!home.includes("dynamic-devices-grid")) {
  home = home.replace(
    "</div>\n<!-- Edit/Düzenle Button (opens card edit page) -->",
    '</div>\n<!-- Cihazlar -->\n<div class="grid grid-cols-2 gap-4 mt-4" id="dynamic-devices-grid" data-purpose="devices-grid"></div>\n<!-- Edit/Düzenle Button (opens card edit page) -->',
  );
  // For fuzzy matching in case line endings differ
  home = home.replace(
    /<\/div>\s*<!-- Edit\/D[^]*?zenle Button/,
    '</div>\n<!-- Cihazlar -->\n<div class="grid grid-cols-2 gap-4 mt-4" id="dynamic-devices-grid" data-purpose="devices-grid"></div>\n<!-- Edit/Düzenle Button',
  );
  fs.writeFileSync("stitch-home.html", home, "utf8");
}

let cards = fs.readFileSync("stitch-cards.html", "utf8");
if (!cards.includes("dynamic-devices-grid")) {
  // Looking for the end of #edit-grid. It's right before </main> or </div>... wait.
  // Let's replace the last </div> before </main> or something.
  // In stitch-cards.html:
  // ...
  //   </article>
  // </div>
  // </main>
  cards = cards.replace(
    /<\/div>\s*<\/main>/,
    '</div>\n<!-- Cihazlar -->\n<div class="grid grid-cols-2 gap-4 mt-4" id="dynamic-devices-grid" data-purpose="devices-grid"></div>\n</main>',
  );
  fs.writeFileSync("stitch-cards.html", cards, "utf8");
}

console.log("Containers added.");
