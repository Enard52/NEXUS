const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "stitch-integrations.html");
let html = fs.readFileSync(file, "utf8");

const transparentScript = `
    // Arka planı beyaz olan resimleri şeffaf yapan akıllı fonksiyon
    function makeImagesTransparent() {
      const images = document.querySelectorAll('.product-tile img');
      images.forEach(img => {
        if (img.complete) {
          processImage(img);
        } else {
          img.addEventListener('load', () => processImage(img), { once: true });
        }
      });
    }

    function processImage(img) {
      if (img.dataset.processed) return;
      img.dataset.processed = 'true';
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      
      if (canvas.width === 0 || canvas.height === 0) return;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Beyaz ve beyaza çok yakın renkleri şeffaf yap
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0; // Alpha kanalını 0 yap (tam şeffaf)
          } else if (r > 230 && g > 230 && b > 230) {
            // Yumuşak geçiş için yarı şeffaf (Anti-aliasing kenarları)
            data[i + 3] = 100;
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        img.src = canvas.toDataURL('image/png');
      } catch (e) {
        console.warn('CORS or canvas error on image:', e);
      }
    }

    // Katalog render edildikten sonra çalıştır
    const originalRenderCatalogContent = renderCatalogContent;
    renderCatalogContent = function() {
      originalRenderCatalogContent();
      setTimeout(makeImagesTransparent, 100);
    };
    
    // Sayfa yüklendiğinde mevcut resimler için de çalıştır
    window.addEventListener('load', () => {
      setTimeout(makeImagesTransparent, 200);
    });
`;

// Insert the script right before closing </script> tag
if (!html.includes("makeImagesTransparent")) {
  html = html.replace("</script>", transparentScript + "\n  </script>");

  // Ayrıca HTML'deki bg-white sınıfını kaldırıp şeffaf yapalım
  html = html.replace(/bg-white rounded-2xl/g, "bg-transparent");

  fs.writeFileSync(file, html, "utf8");
  console.log("Successfully added transparency script to stitch-integrations.html");
} else {
  console.log("Script already exists.");
}
