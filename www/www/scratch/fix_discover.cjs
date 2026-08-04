const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');
  let changed = false;

  // Replace lucide:more-horizontal with lucide:settings-2
  if (content.includes('lucide:more-horizontal')) {
    content = content.replace(/lucide:more-horizontal/g, 'lucide:settings-2');
    changed = true;
  }

  // Add smart-scene-page script to guest mode if not there
  if (file === 'stitch-guest-mode.html') {
    if (!content.includes('smart-scene-page.js')) {
      content = content.replace('</head>', '<script src="smart-scene-page.js"></script></head>');
      content = content.replace('<body', '<body data-scene-page="guest-mode" data-back-href="stitch-discover.html" data-complete-href="stitch-home.html"');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(path.join(dir, file), content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
