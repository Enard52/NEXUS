const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const replacements = {
    'Ä±': 'ı', 'Ä°': 'İ', 'ÅŸ': 'ş', 'Åž': 'Ş', 
    'Ã¶': 'ö', 'Ã–': 'Ö', 'Ã§': 'ç', 'Ã‡': 'Ç', 
    'ÄŸ': 'ğ', 'Äž': 'Ğ', 'Ã¼': 'ü', 'Ãœ': 'Ü', 
    'â€”': '—', 'â€œ': '“', 'â€”': '”'
};
for (const f of files) {
    let text = fs.readFileSync(f, 'utf8');
    for (const [bad, good] of Object.entries(replacements)) {
        text = text.split(bad).join(good);
    }
    text = text.replace(/Nas\?l yard\?mc\? olabilirim\?/g, 'Nasıl yardımcı olabilirim?');
    text = text.replace(/Ba\?lant\?/g, 'Bağlantı');
    text = text.replace(/Ak\?ll\?/g, 'Akıllı');
    text = text.replace(/Giri\?/g, 'Giriş');
    text = text.replace(/Ke\?fet/g, 'Keşfet');
    text = text.replace(/NEXUS AI ile senaryonu yaz.../g, 'Nasıl yardımcı olabilirim?'); // Sync placeholder
    fs.writeFileSync(f, text, 'utf8');
}
console.log('Fixed encoding!');
