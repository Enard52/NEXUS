const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.startsWith('stitch-') && f.endsWith('.html'));
  
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('<script src="auth.js"></script>')) {
    if (content.includes('<script src="theme.js"></script>')) {
       content = content.replace('<script src="theme.js"></script>', '<script src="auth.js"></script>\n  <script src="theme.js"></script>');
    } else if (content.includes('</head>')) {
       content = content.replace('</head>', '  <script src="auth.js"></script>\n</head>');
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Added auth.js to ${file}`);
  }
});
