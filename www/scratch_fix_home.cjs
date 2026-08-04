const fs = require('fs');

const file = 'c:/Users/ensar/Desktop/NEXUS-main/stitch-home.html';
let content = fs.readFileSync(file, 'utf8');

// Fix the mangled `el.style.disp`
content = content.replace(/el\.style\.disp\s*\/\/\s*Harita sayfasında kaydedilen hava durumu konumuyla senkron/, `el.style.display = 'flex';
          }
        }
      });

      // Harita sayfasında kaydedilen hava durumu konumuyla senkron`);

// Fix the mangled end of the block
const regexBadEnd = /\}\s*=\s*cityName\s*\+\s*" • "\s*\+\s*temp\s*\+\s*"°C "\s*\+\s*desc;/;
content = content.replace(regexBadEnd, `}`);

fs.writeFileSync(file, content);
console.log('Fixed stitch-home.html syntax errors');
