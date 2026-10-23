const fs = require('fs');

let homeHtml = fs.readFileSync('stitch-home.html', 'utf8');

const hideStaticCardsScript = `
      // Harita sayfasında kaydedilen hava durumu konumuyla senkron
`;

// Wait, I will just replace the beginning of syncCards to include hiding logic
const newSyncCardsBegin = `
    function syncCards() {
      // Hide static cards if they are in nexusHiddenCards
      var hidden = [];
      try {
        hidden = JSON.parse(localStorage.getItem('nexusHiddenCards') || '[]');
      } catch(e) {}
      
      ['weather', 'dnd', 'energy'].forEach(function(id) {
        var el = document.getElementById('card-' + id);
        if (el) {
          if (hidden.indexOf(id) !== -1) {
            el.style.display = 'none';
          } else {
            el.style.display = 'flex';
          }
        }
      });

      // Harita sayfasında kaydedilen hava durumu konumuyla senkron
`;

homeHtml = homeHtml.replace(
  /function syncCards\(\) \{\s*\/\/ Harita sayfasında kaydedilen hava durumu konumuyla senkron/,
  newSyncCardsBegin
);

fs.writeFileSync('stitch-home.html', homeHtml, 'utf8');
console.log('Fixed static card hiding logic in stitch-home.html syncCards()');
