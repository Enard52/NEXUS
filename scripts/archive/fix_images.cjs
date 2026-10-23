const fs = require('fs');

// Global unbreakable image handler
const globalHandler = `
// Global Unbreakable Image Handler
window.addEventListener('error', function(e) {
  if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
    if (e.target.dataset.fallbackApplied) return;
    e.target.dataset.fallbackApplied = 'true';
    
    const isAvatar = e.target.id.includes('avatar') || e.target.src.includes('randomuser');
    
    if (isAvatar) {
      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
    } else {
      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23f8fafc'%3E%3Crect width='400' height='300' rx='24'/%3E%3Cpath d='M120 220l40-50 50 60 60-80 40 70H120z' fill='%23e2e8f0'/%3E%3Ccircle cx='270' cy='110' r='24' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='24' fill='%2394a3b8'%3EG%C3%B6rsel Y%C3%BCklenemedi%3C/text%3E%3C/svg%3E";
    }
  }
}, true);
`;

let theme = fs.readFileSync('theme.js', 'utf8');
if (!theme.includes('Global Unbreakable Image Handler')) {
    fs.writeFileSync('theme.js', globalHandler + '\n' + theme, 'utf8');
}

// Fix stitch-onboarding.html explicit broken google link
let onboarding = fs.readFileSync('stitch-onboarding.html', 'utf8');
onboarding = onboarding.replace(/https:\/\/lh3\.googleusercontent\.com[^"]+/, 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80');
fs.writeFileSync('stitch-onboarding.html', onboarding, 'utf8');

console.log("Images fixed.");
