const fs = require('fs');

const AIR_FRYER_URL = 'https://images.unsplash.com/photo-1621644788177-3363f8222998?auto=format&fit=crop&w=300&q=80';
const DISHWASHER_URL = 'https://images.unsplash.com/photo-1583947581924-860bda6a45df?auto=format&fit=crop&w=300&q=80';

const files = ['stitch-integrations.html'];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        // 1. Fix "Air Fryer" mapping
        // Currently it might be "fan.jpg" or "oven.jpg" or "home-automation.png"
        content = content.replace(/("n"\s*:\s*"Air Fryer"\s*,\s*"img"\s*:\s*")([^"]+)(")/g, `$1${AIR_FRYER_URL}$3`);
        
        // 2. Fix "Sıcak Hava Fritözü" mapping
        content = content.replace(/("n"\s*:\s*"Sıcak Hava Fritözü"\s*,\s*"img"\s*:\s*")([^"]+)(")/g, `$1${AIR_FRYER_URL}$3`);
        
        // 3. Fix "Bulaşık Makinesi" mapping
        content = content.replace(/("n"\s*:\s*"Bulaşık Makinesi"\s*,\s*"img"\s*:\s*")([^"]+)(")/g, `$1${DISHWASHER_URL}$3`);

        // Also fix the shorthand version from backup/previous code just in case
        content = content.replace(/(\{.*?n:\s*'Air Fryer',\s*img:\s*')([^']+)'/g, `$1${AIR_FRYER_URL}'`);
        content = content.replace(/(\{.*?n:\s*'Bulaşık Makinesi',\s*img:\s*')([^']+)'/g, `$1${DISHWASHER_URL}'`);

        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated mappings in ${file}`);
    }
});

