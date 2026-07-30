const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.startsWith('stitch-') && f.endsWith('.html'));

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('data.js')) {
        content = content.replace('<script src="theme.js"></script>', '<script src="theme.js"></script>\n<script src="data.js"></script>');
        fs.writeFileSync(file, content, 'utf8');
    }
}
