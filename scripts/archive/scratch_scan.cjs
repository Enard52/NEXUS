const fs = require('fs');

const file = 'c:/Users/ensar/Desktop/NEXUS-main/stitch-scan.html';
let content = fs.readFileSync(file, 'utf8');

const targetRegex = /<button class="flex flex-col items-center gap-2\.5 text-white\/90" onclick="toggleCodeSheet\(\)">[\s\S]*?<span class="text-sm leading-tight text-center">Kurulum<br\/>Kodunu Girin<\/span>[\s\S]*?<\/button>/;

const replacement = `<a class="flex flex-col items-center gap-2.5 text-white/90" href="stitch-integrations.html">
<span class="w-14 h-14 rounded-2xl bg-[#7C5CFF]/80 flex items-center justify-center shadow-lg shadow-[#7C5CFF]/30">
<svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewbox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round"></path></svg>
</span>
<span class="text-sm font-semibold leading-tight text-center">Manuel<br/>Ekle</span>
</a>`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(file, content);
  console.log('Replaced successfully');
} else {
  console.log('Target not found');
}
