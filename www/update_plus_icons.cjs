const fs = require('fs');
let html = fs.readFileSync('stitch-plus.html', 'utf8');

// Replace left button
html = html.replace('<button aria-label="Geri" class="p-2">', '<button aria-label="Geri" class="p-2" onclick="window.history.back()">');

// Replace right button
html = html.replace('<button aria-label="Yasal belgeler" class="p-2">', '<button aria-label="Yasal belgeler" class="p-2" onclick="alert(\\'Kullanım Koşulları ve Gizlilik Politikası yakında eklenecektir.\\')">');

fs.writeFileSync('stitch-plus.html', html, 'utf8');
