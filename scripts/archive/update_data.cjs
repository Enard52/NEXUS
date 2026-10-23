const fs = require('fs');
let js = fs.readFileSync('data.js', 'utf8');
js = js.replace('// Let individual pages handle complex rendering (lists, states, etc)', 
// Special binding for pre-existing UI IDs
const userNameElement = document.getElementById('nexus-user-name');
if (userNameElement) {
    userNameElement.textContent = data.displayName || 'Kullanıcı';
}

// Let individual pages handle complex rendering (lists, states, etc));
fs.writeFileSync('data.js', js, 'utf8');
