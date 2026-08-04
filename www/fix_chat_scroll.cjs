const fs = require('fs');

let chat = fs.readFileSync('stitch-chat.html', 'utf8');

// Fix 1: Change Tasarruf Modu to yellow
chat = chat.replace(
    'class="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md border border-purple-100/50 rounded-2xl shadow-sm text-sm font-medium text-gray-700 shrink-0 transition-transform active:scale-95">\n            <svg class="h-4 w-4 text-nexus-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>\n            Tasarruf Modu',
    'class="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md border border-amber-200/50 rounded-2xl shadow-sm text-sm font-medium text-gray-700 shrink-0 transition-transform active:scale-95">\n            <svg class="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>\n            Tasarruf Modu'
);

// Fix 2: Add script to center the suggestions container on load
const scrollScript = `
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const scrollContainer = document.querySelector('.overflow-x-auto.no-scrollbar');
      if (scrollContainer) {
        // Center the scroll container initially
        scrollContainer.scrollLeft = (scrollContainer.scrollWidth - scrollContainer.clientWidth) / 2;
      }
    });
  </script>
</body>
`;

if (!chat.includes('scrollContainer.scrollLeft')) {
    chat = chat.replace('</body>', scrollScript);
}

fs.writeFileSync('stitch-chat.html', chat, 'utf8');
console.log('Fixed Tasarruf color and initial scroll position in stitch-chat.html');
