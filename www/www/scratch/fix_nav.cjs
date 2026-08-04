const fs = require('fs');

const pages = [
  { file: 'stitch-home.html', name: 'Ev', icon: 'home', color: '#4C7DFF' },
  { file: 'stitch-smart.html', name: 'Akıllı', icon: 'layout-grid', color: '#7C5CFF' },
  { file: 'stitch-discover.html', name: 'Keşfet', icon: 'compass', color: '#00D1FF' },
  { file: 'stitch-profile.html', name: 'Profil', icon: 'user', color: '#FF7B4C' }
];

function generateNav(activeFile) {
  let navHtml = `<nav class="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 flex items-center justify-around px-2 z-50" style="padding-bottom: max(0.5rem, env(safe-area-inset-bottom)); height: calc(4.5rem + env(safe-area-inset-bottom));" data-purpose="bottom-nav">\n`;
  
  pages.forEach(p => {
    const isActive = (p.file === activeFile);
    // Remove the arbitrary color classes like text-[#4C7DFF] and just use inline styles to be totally safe in tailwind JIT if it's missing, or use standard tailwind colors if they are configured. 
    // Wait, the project doesn't have a tailwind config, it uses CDN. Arbitrary values in CDN sometimes need to be statically present. Let's just use inline style for colors.
    const colorStyle = isActive ? `color: ${p.color};` : `color: #94a3b8;`; 
    const iconStroke = isActive ? 'stroke-[2]' : 'stroke-[1.5]';
    const textWeight = isActive ? 'font-bold' : 'font-medium';
    
    navHtml += `  <a href="${p.file}" class="flex flex-col items-center gap-1 transition-colors active:scale-95" style="${colorStyle}">\n`;
    navHtml += `    <i class="w-6 h-6 ${iconStroke}" data-lucide="${p.icon}"></i>\n`;
    navHtml += `    <span class="text-[10px] ${textWeight}">${p.name}</span>\n`;
    navHtml += `  </a>\n`;
  });
  
  navHtml += `</nav>`;
  return navHtml;
}

pages.forEach(p => {
  if (fs.existsSync(p.file)) {
    let content = fs.readFileSync(p.file, 'utf8');
    // Replace existing nav
    const newNav = generateNav(p.file);
    content = content.replace(/<nav[^>]*data-purpose="bottom-nav"[^>]*>.*?<\/nav>/s, newNav);
    fs.writeFileSync(p.file, content, 'utf8');
    console.log('Updated nav in', p.file);
  }
});
