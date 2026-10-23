const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'stitch-integrations.html');
let html = fs.readFileSync(file, 'utf8');

// Bulaşık makinesi, çamaşır makinesi vb. gerçek fotoğraf olanları vektörel (.png) olanlarla değiştir.
html = html.replace(/'dishwasher\.jpg'/g, "'dishwasher.png'");
html = html.replace(/'washing_machine\.jpg'/g, "'washing-machine.png'");
html = html.replace(/'refrigerator\.jpg'/g, "'fridge.png'");
html = html.replace(/'air-conditioner\.jpg'/g, "'air-conditioner.png'");
html = html.replace(/'robot_vacuum\.jpg'/g, "'vacuum-cleaner.png'");
html = html.replace(/'robot-mop\.jpg'/g, "'robot.png'");
html = html.replace(/'window-robot\.jpg'/g, "'robot.png'");
html = html.replace(/'fan\.jpg'/g, "'fan.png'");
html = html.replace(/'humidifier\.jpg'/g, "'humidifier.png'");

// Yanlış eşleşen cihazları (örneğin Air Fryer) listeden çıkar
html = html.replace(/\{ n: 'Air Fryer', img: 'oven\.jpg' \}, /g, "");
html = html.replace(/\{ n: 'Akıllı Saat', img: 'power-monitor\.jpg' \}, /g, "");
html = html.replace(/\{ n: 'Uyku Bandı', img: 'motion-sensor\.jpg' \}/g, "");
html = html.replace(/, \{ n: 'Uyku Bandı', img: 'motion-sensor\.jpg' \}/g, "");
html = html.replace(/\{ n: 'Kondisyon Bisikleti', img: 'treadmill\.jpg' \}/g, "");
html = html.replace(/, \{ n: 'Kondisyon Bisikleti', img: 'treadmill\.jpg' \}/g, "");
html = html.replace(/\{ n: 'Akıllı Çöp Kutusu', img: 'air_purifier\.jpg' \}/g, "");
html = html.replace(/, \{ n: 'Akıllı Çöp Kutusu', img: 'air_purifier\.jpg' \}/g, "");

fs.writeFileSync(file, html, 'utf8');
console.log('Fixed mismatched images and replaced messy photos with transparent PNGs in stitch-integrations.html');
