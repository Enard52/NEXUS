const fs = require("fs");
const files = fs.readdirSync(".").filter((f) => f.startsWith("stitch-") && f.endsWith(".html"));

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");

  // 1. Add discover-badge ID to the red dot and hide it by default
  content = content.replace(
    /<span class="absolute top-0 right-0 w-2\.5 h-2\.5 bg-red-500 border-2 border-white rounded-full"><\/span>/g,
    '<span id="discover-badge" class="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full hidden"></span>',
  );
  content = content.replace(
    /<span class="absolute top-0 right-0 w-2\.5 h-2\.5 bg-red-500 border-2 border-white rounded-full hidden"><\/span>/g,
    '<span id="discover-badge" class="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full hidden"></span>',
  );

  // Fix stitch-cards.html deletion logic
  if (file === "stitch-cards.html") {
    content = content.replace(
      /onclick="this\.closest\('article'\)\.remove\(\)"/g,
      'onclick="deleteCard(this)"',
    );
    if (!content.includes("function deleteCard")) {
      content = content.replace(
        "</script>\n</body>",
        `
    function deleteCard(btn) {
      const article = btn.closest('article');
      const text = article.querySelector('p').textContent.trim();
      let id = 'weather';
      if (text.includes('Kapalı') || text.includes('dnd')) id = 'dnd';
      if (text.includes('kWh') || text.includes('energy')) id = 'energy';
      
      let hidden = JSON.parse(localStorage.getItem('nexusHiddenCards') || '[]');
      if (!hidden.includes(id)) {
        hidden.push(id);
        localStorage.setItem('nexusHiddenCards', JSON.stringify(hidden));
      }
      article.remove();
    }
  </script>\n</body>`,
      );
    }
  }

  // Fix stitch-home.html cards to match IDs
  if (file === "stitch-home.html") {
    if (!content.includes('id="card-weather"')) {
      content = content.replace(
        '<!-- Weather Card -->\n<article class="',
        '<!-- Weather Card -->\n<article id="card-weather" class="',
      );
      content = content.replace(
        '<!-- Weather Card -->\r\n<article class="',
        '<!-- Weather Card -->\r\n<article id="card-weather" class="',
      );
      content = content.replace(
        '<!-- DND Card -->\n<article class="',
        '<!-- DND Card -->\n<article id="card-dnd" class="',
      );
      content = content.replace(
        '<!-- DND Card -->\r\n<article class="',
        '<!-- DND Card -->\r\n<article id="card-dnd" class="',
      );
      content = content.replace(
        '<!-- Energy Today Card -->\n<article class="',
        '<!-- Energy Today Card -->\n<article id="card-energy" class="',
      );
      content = content.replace(
        '<!-- Energy Today Card -->\r\n<article class="',
        '<!-- Energy Today Card -->\r\n<article id="card-energy" class="',
      );
    }
  }

  fs.writeFileSync(file, content, "utf8");
}

// Update data.js for global badge and card hiding logic
let dataJs = fs.readFileSync("data.js", "utf8");
if (!dataJs.includes("discover-badge")) {
  dataJs = dataJs.replace(
    "document.dispatchEvent(new CustomEvent('nexusDataReady', { detail: data }));",
    `
    // Hide deleted cards on Home
    if (window.location.pathname.includes('stitch-home.html') || window.location.pathname.endsWith('/')) {
        let hidden = JSON.parse(localStorage.getItem('nexusHiddenCards') || '[]');
        hidden.forEach(id => {
            const el = document.getElementById('card-' + id);
            if (el) el.remove();
        });
    }

    // Realistic Notification Badge Logic
    const discoverBadge = document.getElementById('discover-badge');
    if (discoverBadge) {
        if (window.location.pathname.includes('stitch-discover.html')) {
            localStorage.setItem('nexusNotificationsRead', 'true');
        }
        
        // Let's pretend the server returns unread suggestions if we haven't clicked it
        const isRead = localStorage.getItem('nexusNotificationsRead') === 'true';
        if (!isRead) {
            discoverBadge.classList.remove('hidden');
        } else {
            discoverBadge.classList.add('hidden');
        }
    }

    document.dispatchEvent(new CustomEvent('nexusDataReady', { detail: data }));`,
  );
  fs.writeFileSync("data.js", dataJs, "utf8");
}

console.log("Applied badge and card logic");
