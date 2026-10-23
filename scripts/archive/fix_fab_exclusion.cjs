const fs = require('fs');
let f = fs.readFileSync('ai-fab.js', 'utf8');
f = f.replace(/if \(EXCLUDE_PAGES\.some[\s\S]*?return;/, if (EXCLUDE_PAGES.some(function(p){ return location.href.includes(p); })) return;);
fs.writeFileSync('ai-fab.js', f, 'utf8');
