const fs = require("fs");

const files = fs.readdirSync(".").filter((f) => f.endsWith(".html") && f.startsWith("stitch-"));

files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");
  let originalContent = content;

  const aTagRegex = /<a\s+[^>]*aria-label="Geri"[^>]*>/gi;
  content = content.replace(aTagRegex, (match) => {
    // If it already contains the fix, skip
    if (match.includes("history.back()")) return match;
    return match.replace(
      /href="[^"]*"/i,
      `href="javascript:void(0)" onclick="window.history.length > 1 ? history.back() : window.location.href='stitch-home.html'"`,
    );
  });

  const btnRegex = /<button\s+[^>]*aria-label="Geri"[^>]*>/gi;
  content = content.replace(btnRegex, (match) => {
    if (match.includes('onclick="window.history.back()"')) {
      return match.replace(
        /onclick="window\.history\.back\(\)"/i,
        `onclick="window.history.length > 1 ? history.back() : window.location.href='stitch-home.html'"`,
      );
    }
    return match;
  });

  if (originalContent !== content) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`Updated back button in ${file}`);
  }
});
