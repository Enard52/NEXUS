const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let updatedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');
  let originalContent = content;

  // The corrupted string looks like this:
  // onclick="window.history.length  onclick="event.preventDefault(); window.history.back();"> 1 ? history.back() : window.location.href='stitch-home.html'">
  // Sometimes it's slightly different depending on spaces or the fallback URL.

  const fixRegex = /onclick="window\.history\.length\s*onclick="event\.preventDefault\(\);\s*window\.history\.back\(\);">\s*1\s*\?\s*history\.back\(\)\s*:\s*window\.location\.href='[^']*'">/g;

  content = content.replace(fixRegex, 'onclick="event.preventDefault(); window.history.back();">');

  // There might be another variation where the original button had no fallback url but was something like:
  // onclick="history.length > 1 ? ...
  const altRegex = /onclick="history\.length\s*onclick="event\.preventDefault\(\);\s*window\.history\.back\(\);">\s*1\s*\?\s*history\.back\(\)\s*:\s*window\.location\.href='[^']*'">/g;
  content = content.replace(altRegex, 'onclick="event.preventDefault(); window.history.back();">');

  if (content !== originalContent) {
    fs.writeFileSync(path.join(dir, file), content, 'utf8');
    console.log(`Fixed corruption in ${file}`);
    updatedCount++;
  }
}

console.log(`Total corrupted files fixed: ${updatedCount}`);
