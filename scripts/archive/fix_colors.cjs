const fs = require("fs");

let html = fs.readFileSync("stitch-home.html", "utf8");

// Replace the DND logic
html = html.replace(
  /if \(isActive\) \{[\s\S]*?el\.textContent = displayText;[\s\S]*?el\.parentElement\.classList\.add\('bg-\[#FF3B5C\]'\);[\s\S]*?\}/,
  `if (isActive) {
        el.textContent = displayText;
        el.classList.remove('text-slate-400');
        el.classList.add('text-[#FF3B5C]', 'font-semibold');
      }`,
);

// Replace the Energy logic
html = html.replace(
  /if \(activeStrategies > 0\) \{[\s\S]*?el\.textContent = activeStrategies \+ ' Tasarruf Aktif';[\s\S]*?el\.parentElement\.classList\.add\('bg-\[#7C5CFF\]'\);[\s\S]*?\}/,
  `if (activeStrategies > 0) {
          el.textContent = activeStrategies + ' Tasarruf Aktif';
          el.classList.remove('text-slate-400');
          el.classList.add('text-[#7C5CFF]', 'font-semibold');
        }`,
);

fs.writeFileSync("stitch-home.html", html, "utf8");
console.log("Fixed colors in stitch-home.html");
