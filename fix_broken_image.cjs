const fs = require('fs');

let html = fs.readFileSync('stitch-smart.html', 'utf8');

// Replace the broken cinema image URL with a known good one
html = html.replace(
  /https:\/\/images\.unsplash\.com\/photo-1585675101077-d6b0db6b26fb\?auto=format&fit=crop&w=256&q=80/g,
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=256&q=80'
);

fs.writeFileSync('stitch-smart.html', html, 'utf8');
console.log('Fixed the broken image URL for Sinema Modu');
