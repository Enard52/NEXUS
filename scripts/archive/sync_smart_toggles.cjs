const fs = require('fs');

let smartHtml = fs.readFileSync('stitch-smart.html', 'utf8');

// The toggle switches have class "sr-only peer". Let's add an ID or a class to bind them, and some JS at the end.
// First, we add an ID to the switches and save logic.
const jsToAppend = `
<script>
  // Senaryo ve Otomasyon Toggle state sync
  (function() {
    document.querySelectorAll('#tab-automation input[type="checkbox"]').forEach((checkbox, index) => {
      const key = 'nexusAutoToggle_' + index;
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        checkbox.checked = saved === 'true';
      }
      checkbox.addEventListener('change', function() {
        localStorage.setItem(key, this.checked);
      });
    });
  })();
</script>
`;

// Insert the JS right before the closing body tag (or just append it)
smartHtml = smartHtml.replace(/<\/body>/, jsToAppend + '\n</body>');

fs.writeFileSync('stitch-smart.html', smartHtml, 'utf8');
console.log('Updated stitch-smart.html toggle sync logic');
