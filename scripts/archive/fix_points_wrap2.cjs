const fs = require('fs');

let menu = fs.readFileSync('stitch-menu.html', 'utf8');

// The container
menu = menu.replace(
    '<div class="flex justify-between items-center gap-3 mb-6">',
    '<div class="flex justify-between items-center gap-2 sm:gap-3 mb-6">'
);

// The H1
menu = menu.replace(
    '<h1 class="text-xl text-text-primary mb-1 font-extrabold leading-tight whitespace-nowrap truncate tracking-tight">NEXUS AI Puanları</h1>',
    '<h1 class="text-[17px] sm:text-xl text-text-primary mb-1 font-extrabold leading-tight whitespace-nowrap tracking-tight">NEXUS AI Puanları</h1>'
);

// The P
menu = menu.replace(
    '<p class="text-text-secondary font-medium whitespace-nowrap truncate">Günlük sıfırlama 30/30</p>',
    '<p class="text-xs sm:text-sm text-text-secondary font-medium whitespace-nowrap">Günlük sıfırlama 30/30</p>'
);

// The Button
menu = menu.replace(
    '<a href="stitch-plus.html" class="gradient-button text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md active:scale-95 transition-transform flex-shrink-0 whitespace-nowrap">',
    '<a href="stitch-plus.html" class="gradient-button text-white px-3 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-transform flex-shrink-0 whitespace-nowrap">'
);

fs.writeFileSync('stitch-menu.html', menu, 'utf8');
console.log('Adjusted sizes in stitch-menu.html so it fits on one line without truncation');
