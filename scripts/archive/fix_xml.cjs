const fs = require('fs');
const path = 'android/app/src/main/AndroidManifest.xml';

let content = fs.readFileSync(path, 'utf8');
// Remove BOM
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}
fs.writeFileSync(path, content, 'utf8');
console.log('Removed BOM from AndroidManifest.xml');
