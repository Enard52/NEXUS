const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico').default || require('png-to-ico');

async function run() {
  const svgPath = path.join(__dirname, '../packages/web/dist/icon.svg');
  const pngPath = path.join(__dirname, 'assets/icon.png');
  const png256Path = path.join(__dirname, 'assets/icon-256.png');
  const icoPath = path.join(__dirname, 'assets/icon.ico');

  if (!fs.existsSync(svgPath)) {
    throw new Error('SVG logo bulunamadi: ' + svgPath);
  }

  console.log('Generating high-res PNG icon from brand logo...');
  await sharp(svgPath)
    .resize(1024, 1024)
    .png()
    .toFile(pngPath);
    
  // 256x256 ICO için yardımcı png oluştur
  await sharp(svgPath)
    .resize(256, 256)
    .png()
    .toFile(png256Path);

  console.log('Generating ICO icon for Windows...');
  const icoBuffer = await pngToIco([png256Path]);
  fs.writeFileSync(icoPath, icoBuffer);
  
  // temizlik
  fs.unlinkSync(png256Path);
  
  console.log('Brand icons generated successfully in assets folder.');
}

run().catch(console.error);
