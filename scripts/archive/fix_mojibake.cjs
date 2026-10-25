const fs = require("fs");
const path = require("path");

const replacements = {
  "Ã§": "ç",
  "Ã‡": "Ç",
  "Ã¶": "ö",
  "Ã–": "Ö",
  "Ã¼": "ü",
  Ãœ: "Ü",
  "Ä±": "ı",
  "Ä°": "İ",
  ÅŸ: "ş",
  Åž: "Ş",
  ÄŸ: "ğ",
  Äž: "Ğ",
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  for (const [bad, good] of Object.entries(replacements)) {
    // Escape characters for regex just in case, though these are straightforward
    const regex = new RegExp(bad, "g");
    content = content.replace(regex, good);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Fixed: ${filePath}`);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === "node_modules" || file === ".git" || file === ".github") continue;

    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      traverse(fullPath);
    } else if (stat.isFile()) {
      if (
        fullPath.endsWith(".html") ||
        fullPath.endsWith(".js") ||
        fullPath.endsWith(".json") ||
        fullPath.endsWith(".md")
      ) {
        fixFile(fullPath);
      }
    }
  }
}

traverse(__dirname);
console.log("Mojibake replacement complete.");
