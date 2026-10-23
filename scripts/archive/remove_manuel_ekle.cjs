const fs = require('fs');
const file = 'c:/Users/ensar/Desktop/NEXUS-main/stitch-smart.html';
let html = fs.readFileSync(file, 'utf8');

const regex = /<a class="flex items-center space-x-4 p-3 rounded-2xl active:bg-slate-50 transition-colors" href="stitch-integrations\.html">[\s\S]*?<span class="text-xl font-semibold text-slate-800">Manuel Ekle<\/span>\s*<\/a>/i;

if (regex.test(html)) {
  html = html.replace(regex, '<!-- Manuel Ekle removed -->');
  fs.writeFileSync(file, html, 'utf8');
  console.log('Successfully removed Manuel Ekle button.');
} else {
  console.log('Manuel Ekle button not found.');
}
