const fs = require('fs');
let html = fs.readFileSync('stitch-map.html', 'utf8');

const newFunction = `async function locateMe() {
      setStatus('Konumun bulunuyor...');
      try {
        let lat, lon;
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation) {
          const position = await Capacitor.Plugins.Geolocation.getCurrentPosition();
          lat = position.coords.latitude;
          lon = position.coords.longitude;
        } else {
          if (!navigator.geolocation) { 
            setStatus('Cihazın konum servisini desteklemiyor.'); 
            return; 
          }
          const p = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          lat = p.coords.latitude;
          lon = p.coords.longitude;
        }
        
        moveMap(lat, lon);
        fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=tr&lat=' + lat + '&lon=' + lon)
          .then(function (r) { return r.json(); })
          .then(function (r) {
            setStatus('');
            var name = r.display_name ? shortName(r.display_name) : 'Mevcut Konum';
            addressInput.value = name;
            selectLocation(name);
          })
          .catch(function () { setStatus(''); addressInput.value = 'Mevcut Konum'; selectLocation('Mevcut Konum'); });
      } catch (e) {
        setStatus('Konum izni verilmedi veya hata oluştu.');
      }
    }`;

html = html.replace(/function locateMe\(\) \{[\s\S]*?setStatus\('Konum izni verilmedi\.'\);\s*\}\);\s*\}/, newFunction);

fs.writeFileSync('stitch-map.html', html, 'utf8');
