const fs = require('fs');

let smart = fs.readFileSync('stitch-smart.html', 'utf8');

const target = `<button class="bg-[#7C5CFF] text-white rounded-full p-1.5">
<svg class="w-6 h-6" fill="none" stroke="currentColor" viewbox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path></svg>
</button>`;

const replacement = `<button aria-label="Hızlı ekle" class="text-[#7C5CFF] p-1 active:scale-95 transition-transform" onclick="window.location.href='stitch-plus.html'">
<svg class="h-8 w-8" fill="none" stroke="currentColor" viewbox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
<path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
</svg>
</button>`;

// Also let's check if there are other files using this exact plus icon that shouldn't
// e.g. stitch-cards.html uses some icons but they are delete/expand buttons.

if (smart.includes(target)) {
    smart = smart.replace(target, replacement);
    fs.writeFileSync('stitch-smart.html', smart, 'utf8');
} else {
    // Maybe line endings are different
    const regex = /<button class="bg-\[#7C5CFF\] text-white rounded-full p-1\.5">[\s\S]*?<\/button>/g;
    smart = smart.replace(regex, replacement);
    fs.writeFileSync('stitch-smart.html', smart, 'utf8');
}

console.log("Replaced plus icon in stitch-smart.html");
