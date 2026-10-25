const fs = require("fs");
let theme = fs.readFileSync("theme.js", "utf8");
theme = theme.replace(
  "const storedName = localStorage.getItem('nexusUserName') || 'Ensar';",
  "const storedName = 'Yükleniyor...';",
);
fs.writeFileSync("theme.js", theme, "utf8");
