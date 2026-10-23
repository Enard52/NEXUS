const fs = require('fs');

let skillsHtml = fs.readFileSync('stitch-skills.html', 'utf8');

// Regex to remove the entire floating button div
// The div starts with <!-- NEXUS AI Floating Button... and ends before <script> lucide.createIcons() or <script> toggleQuickCreate
skillsHtml = skillsHtml.replace(
  /<!-- NEXUS AI Floating Button[^>]*>[\s\S]*?<div class="fixed bottom-8 left-1\/2 -translate-x-1\/2 z-20 w-full max-w-sm px-6">[\s\S]*?<\/button>\s*<\/div>/,
  ''
);

fs.writeFileSync('stitch-skills.html', skillsHtml, 'utf8');
console.log('Removed NEXUS AI Floating Button from stitch-skills.html');
