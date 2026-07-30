const https = require('https');

function searchUnsplash(query) {
  return new Promise((resolve) => {
    https.get(`https://unsplash.com/s/photos/${encodeURIComponent(query)}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Find photo IDs in the HTML, e.g., href="/photos/..."
        const regex = /itemProp="url" href="\/photos\/([a-zA-Z0-9-]+)"/g;
        let match;
        const ids = [];
        while ((match = regex.exec(data)) !== null) {
          if (match[1] && match[1].includes('-')) {
             // Unsplash IDs usually end with a 11-12 char random string
             const parts = match[1].split('-');
             const realId = parts[parts.length - 1];
             ids.push(realId);
          }
        }
        resolve(ids);
      });
    }).on('error', () => resolve([]));
  });
}

async function run() {
  const queries = [
    'smart-bulb', 'robot-vacuum', 'smart-plug', 'security-camera',
    'air-purifier', 'smart-tv', 'air-conditioner', 'washing-machine',
    'refrigerator', 'smart-speaker', 'led-strip', 'thermostat'
  ];
  
  for (const q of queries) {
    const ids = await searchUnsplash(q);
    console.log(`${q}: ${ids.slice(0, 3).join(', ')}`);
  }
}

run();
