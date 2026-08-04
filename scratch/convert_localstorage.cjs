const fs = require('fs');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        if (f.startsWith('backup_html') || f.startsWith('scratch') || f.startsWith('node_modules')) continue;
        
        if (f.endsWith('.js') || f.endsWith('.html')) {
            // We skip auth.js because it defines nexusGetItem/nexusSetItem and uses localStorage explicitly!
            if (f === 'auth.js') continue;
            
            let content = fs.readFileSync(f, 'utf8');
            let updated = content;
            
            // Replace localStorage.getItem(...)
            updated = updated.replace(/localStorage\.getItem\(/g, 'nexusGetItem(');
            
            // Replace localStorage.setItem(...)
            updated = updated.replace(/localStorage\.setItem\(/g, 'nexusSetItem(');
            
            // Replace localStorage.removeItem(...)
            updated = updated.replace(/localStorage\.removeItem\(/g, 'nexusRemoveItem(');

            if (content !== updated) {
                fs.writeFileSync(f, updated, 'utf8');
                console.log(`Converted localStorage in ${f}`);
            }
        }
    }
}

processDir('.');
