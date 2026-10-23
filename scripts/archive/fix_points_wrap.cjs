const fs = require('fs');

let menu = fs.readFileSync('stitch-menu.html', 'utf8');

// Add whitespace-nowrap and truncate to the H1 and P
menu = menu.replace(
    '<h1 class="text-xl text-text-primary mb-1 font-extrabold leading-tight">NEXUS AI Puanları</h1>',
    '<h1 class="text-xl text-text-primary mb-1 font-extrabold leading-tight whitespace-nowrap truncate tracking-tight">NEXUS AI Puanları</h1>'
);
menu = menu.replace(
    '<p class="text-text-secondary font-medium">Günlük sıfırlama 30/30</p>',
    '<p class="text-text-secondary font-medium whitespace-nowrap truncate">Günlük sıfırlama 30/30</p>'
);

fs.writeFileSync('stitch-menu.html', menu, 'utf8');
console.log('Fixed wrapping in stitch-menu.html');
