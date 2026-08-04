const fs = require('fs');
let content = fs.readFileSync('stitch-pair.html', 'utf8');

const replacements = {
  "openCatalogCategory('lighting')": "openCatalogCategory('ayd-nlatma')",
  "openCatalogCategory('security')": "openCatalogCategory('kamera-ve-kilit')",
  "openCatalogCategory('climate')": "openCatalogCategory('enerji-tasarrufu')",
  "openCatalogCategory('plugs')": "openCatalogCategory('elektrik-ustas-')",
  "openCatalogCategory('entertainment')": "openCatalogCategory('e-lence')",
  "openCatalogCategory('locks')": "openCatalogCategory('kamera-ve-kilit')",
  "openCatalogCategory('cleaning')": "openCatalogCategory('k---k-ev-aleti')",
  "openCatalogCategory('appliances')": "openCatalogCategory('b-y-k-ev-aletleri')"
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
}

fs.writeFileSync('stitch-pair.html', content, 'utf8');
console.log('Fixed catalog category links');
