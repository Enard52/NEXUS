const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let updatedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');
  let changed = false;

  const backButtonRegex = /<(a|button)\s+([^>]*?(?:aria-label="Geri"|id="nav-back-btn"|id="back-link"|id="btn-back")[^>]*?)>/gi;

  content = content.replace(backButtonRegex, (match, tag, attrs) => {
    // Prevent double fixing
    if (attrs.includes('window.history.back()')) {
      return match;
    }
    
    // Extract fallback href
    let fallbackHref = "'stitch-home.html'";
    const hrefMatch = attrs.match(/\bhref="([^"]+)"/i);
    if (hrefMatch && !hrefMatch[1].startsWith('javascript:')) {
      fallbackHref = `'${hrefMatch[1]}'`;
    }

    // Strip old handlers
    let newAttrs = attrs.replace(/\bonclick="[^"]*"/gi, '');
    newAttrs = newAttrs.replace(/\bonclick='[^']*'/gi, '');
    
    if (hrefMatch && hrefMatch[1].startsWith('javascript:')) {
        newAttrs = newAttrs.replace(/\bhref="[^"]*"/gi, 'href="#"');
    }

    // We can't rely strictly on window.history.length > 1 on all platforms (like capacitor sometimes),
    // but typically history.back() will just silently fail if there's no history.
    // However, if we want to ensure they don't get stuck, we can check if document.referrer exists, or just use history.back() as requested.
    // Let's use a robust onclick handler.
    const newOnClick = `event.preventDefault(); window.history.back();`;

    if (tag.toLowerCase() === 'button') {
        newAttrs += ` onclick="${newOnClick}"`;
    } else {
        if (!newAttrs.includes('href=')) {
           newAttrs += ` href="#"`;
        }
        newAttrs += ` onclick="${newOnClick}"`;
    }

    return `<${tag} ${newAttrs.trim()}>`;
  });

  if (content !== fs.readFileSync(path.join(dir, file), 'utf8')) {
    fs.writeFileSync(path.join(dir, file), content, 'utf8');
    console.log(`Updated back buttons in ${file}`);
    updatedCount++;
  }
}

console.log(`Total files updated: ${updatedCount}`);
