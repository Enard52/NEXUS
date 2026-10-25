const fs = require("fs");

// 1. Remove FAB from stitch-chat.html
let chatHtml = fs.readFileSync("stitch-chat.html", "utf8");
chatHtml = chatHtml.replace(/<script src="ai-fab\.js"><\/script>\r?\n?/g, "");
fs.writeFileSync("stitch-chat.html", chatHtml, "utf8");
console.log("Removed FAB from stitch-chat.html");

// 2. Replace Otomasyon tab in stitch-smart.html with stitch-skills.html content
let skillsHtml = fs.readFileSync("stitch-skills.html", "utf8");
const mainMatch = skillsHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
if (mainMatch) {
  let innerMain = mainMatch[1];
  let smartHtml = fs.readFileSync("stitch-smart.html", "utf8");

  // Need to replace everything from <div id="tab-automation" class="hidden"> up to <!-- END: Otomasyon Tab -->
  smartHtml = smartHtml.replace(
    /<div id="tab-automation" class="hidden">[\s\S]*?<!-- END: Otomasyon Tab -->/,
    `<div id="tab-automation" class="hidden">\n${innerMain}\n      </div>\n      <!-- END: Otomasyon Tab -->`,
  );
  fs.writeFileSync("stitch-smart.html", smartHtml, "utf8");
  console.log("Replaced Otomasyon tab in stitch-smart.html");
}

// 3. Add Weather API fetch to stitch-home.html
let homeHtml = fs.readFileSync("stitch-home.html", "utf8");

const weatherScript = `
      // Harita sayfasında kaydedilen hava durumu konumuyla senkron
      var loc = localStorage.getItem('nexusWeatherLocation');
      var weatherEl = document.getElementById('weather-location');
      if (loc && weatherEl) {
        weatherEl.textContent = loc + " - Yükleniyor...";
        fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(loc) + '&count=1&language=tr&format=json')
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data.results && data.results.length > 0) {
              var result = data.results[0];
              var lat = result.latitude;
              var lon = result.longitude;
              var cityName = result.name;
              
              return fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true')
                .then(function(res2) { return res2.json(); })
                .then(function(data2) {
                  if (data2.current_weather) {
                    var temp = Math.round(data2.current_weather.temperature);
                    var code = data2.current_weather.weathercode;
                    var desc = 'Açık';
                    if (code >= 1 && code <= 3) desc = 'Bulutlu';
                    if (code >= 45 && code <= 48) desc = 'Sisli';
                    if (code >= 51 && code <= 67) desc = 'Yağmurlu';
                    if (code >= 71 && code <= 77) desc = 'Karlı';
                    if (code >= 80 && code <= 82) desc = 'Sağanak Yağışlı';
                    if (code >= 95) desc = 'Fırtınalı';
                    
                    weatherEl.textContent = cityName + " • " + temp + "°C " + desc;
                    weatherEl.classList.remove('text-slate-400');
                    weatherEl.classList.add('text-slate-700', 'font-semibold');
                  } else {
                    weatherEl.textContent = loc + " (Veri alınamadı)";
                  }
                });
            } else {
              weatherEl.textContent = loc + " (Bulunamadı)";
            }
          })
          .catch(function(err) {
            weatherEl.textContent = loc + " (Bağlantı hatası)";
          });
      }
`;

// Find where weather sync starts and replace it
homeHtml = homeHtml.replace(
  /\/\/ Harita sayfasında kaydedilen hava durumu konumuyla senkron[\s\S]*?var loc = localStorage\.getItem\('nexusWeatherLocation'\);[\s\S]*?if \(loc\) \{[\s\S]*?var el = document\.getElementById\('weather-location'\);[\s\S]*?if \(el\) el\.textContent = loc;[\s\S]*?\}/,
  weatherScript.trim(),
);

fs.writeFileSync("stitch-home.html", homeHtml, "utf8");
console.log("Added real weather API to stitch-home.html");
