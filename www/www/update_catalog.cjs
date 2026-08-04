const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'stitch-integrations.html');
let html = fs.readFileSync(file, 'utf8');

const newCatalogJS = `    // ---- Genişletilmiş NEXUS Katalog Verisi ----
    var CATALOG = [
      { key: 'elektrik', label: 'Elektrik Ustası', groups: [
        { title: 'Prizler', items: [ { n: 'Akıllı Priz', img: 'smart_plug.jpg' }, { n: 'Akıllı Priz (Gateway)', img: 'smart_plug.jpg' }, { n: 'Duvar Prizi', img: 'smart_plug.jpg' } ] },
        { title: 'Çoklu Prizler', items: [ { n: 'Çoklu Priz', img: 'power-strip.jpg' }, { n: 'Dış Mekan Prizi', img: 'power-strip.jpg' } ] },
        { title: 'Anahtarlar', items: [ { n: 'Aç/Kapat Anahtarı', img: 'wall-switch.jpg' }, { n: 'Dimmer Anahtarı', img: 'light-switch.jpg' }, { n: 'Perde Anahtarı', img: 'light-switch.jpg' } ] },
        { title: 'Senaryo Kontrolü', items: [ { n: 'Senaryo Anahtarı', img: 'wall-switch.jpg' }, { n: 'Kablosuz Anahtar', img: 'wall-switch.jpg' } ] }
      ] },
      { key: 'aydinlatma', label: 'Aydınlatma', groups: [
        { title: 'Işık Kaynakları', items: [ { n: 'Akıllı Ampul (Wi-Fi)', img: 'smart_bulb.jpg' }, { n: 'Renkli LED Ampul', img: 'smart_bulb.jpg' }, { n: 'Spot Işığı', img: 'smart_bulb.jpg' }, { n: 'Tavan Lambası', img: 'smart_bulb.jpg' } ] },
        { title: 'Dekoratif', items: [ { n: 'LED Işık Şeridi', img: 'led-strip.jpg' }, { n: 'Masa Lambası', img: 'led-strip.jpg' }, { n: 'Ortam Işığı', img: 'led-strip.jpg' } ] }
      ] },
      { key: 'sensorler', label: 'Sensör', groups: [
        { title: 'Güvenlik', items: [ { n: 'Hareket Sensörü', img: 'motion-sensor.jpg' }, { n: 'Kapı/Pencere Sensörü', img: 'door-sensor.jpg' }, { n: 'Duman Dedektörü', img: 'motion-sensor.jpg' }, { n: 'Gaz Sensörü', img: 'motion-sensor.jpg' } ] },
        { title: 'Çevre', items: [ { n: 'Sıcaklık ve Nem Sensörü', img: 'temp-humidity.jpg' }, { n: 'Su Kaçağı Sensörü', img: 'water-leak.jpg' }, { n: 'Işık Sensörü', img: 'motion-sensor.jpg' } ] },
        { title: 'Sağlık', items: [ { n: 'Uyku Sensörü', img: 'motion-sensor.jpg' }, { n: 'Varlık Sensörü', img: 'motion-sensor.jpg' } ] }
      ] },
      { key: 'buyuk-ev', label: 'Büyük Ev Aletleri', groups: [
        { title: 'Buzdolabı', items: [ { n: 'Akıllı Buzdolabı', img: 'refrigerator.jpg' }, { n: 'Mini Buzdolabı', img: 'refrigerator.jpg' } ] },
        { title: 'Yıkama', items: [ { n: 'Çamaşır Makinesi', img: 'washing_machine.jpg' }, { n: 'Bulaşık Makinesi', img: 'washing_machine.jpg' }, { n: 'Kurutma Makinesi', img: 'washing_machine.jpg' } ] },
        { title: 'İklim', items: [ { n: 'Klima', img: 'air-conditioner.jpg' }, { n: 'Su Isıtıcı', img: 'refrigerator.jpg' } ] }
      ] },
      { key: 'kucuk-ev', label: 'Küçük Ev Aleti', groups: [
        { title: 'Hava', items: [ { n: 'Akıllı Vantilatör', img: 'fan.jpg' }, { n: 'Hava Temizleyici', img: 'air_purifier.jpg' }, { n: 'Nemlendirici', img: 'humidifier.jpg' } ] },
        { title: 'Isıtma', items: [ { n: 'Elektrikli Isıtıcı', img: 'heater.jpg' }, { n: 'Akıllı Termostat', img: 'thermostat.jpg' } ] },
        { title: 'Temizlik', items: [ { n: 'Robot Süpürge', img: 'robot_vacuum.jpg' }, { n: 'Robot Paspas', img: 'robot-mop.jpg' }, { n: 'Cam Temizleme Robotu', img: 'window-robot.jpg' } ] },
        { title: 'Diğer', items: [ { n: 'Sivrisinek Kovucu', img: 'mosquito.jpg' }, { n: 'Akıllı Çöp Kutusu', img: 'robot_vacuum.jpg' } ] }
      ] },
      { key: 'mutfak', label: 'Mutfak Aletleri', groups: [
        { title: 'Pişirme', items: [ { n: 'Air Fryer', img: 'fan.jpg' }, { n: 'Akıllı Fırın', img: 'washing_machine.jpg' }, { n: 'Mikrodalga', img: 'washing_machine.jpg' } ] },
        { title: 'İçecek', items: [ { n: 'Kahve Makinesi', img: 'air_purifier.jpg' }, { n: 'Akıllı Su Isıtıcısı (Kettle)', img: 'air_purifier.jpg' }, { n: 'Su Arıtma Cihazı', img: 'water-leak.jpg' } ] },
        { title: 'Diğer', items: [ { n: 'Blender', img: 'fan.jpg' }, { n: 'Mutfak Tartısı', img: 'smart-hub.jpg' } ] }
      ] },
      { key: 'saglik', label: 'Egzersiz ve Sağlık', groups: [
        { title: 'Ölçüm', items: [ { n: 'Akıllı Baskül', img: 'smart-hub.jpg' }, { n: 'Tansiyon Aleti', img: 'temp-humidity.jpg' }, { n: 'Akıllı Termometre', img: 'thermostat.jpg' } ] },
        { title: 'Giyilebilir', items: [ { n: 'Akıllı Saat', img: 'smart-hub.jpg' }, { n: 'Uyku Bandı', img: 'motion-sensor.jpg' } ] },
        { title: 'Egzersiz', items: [ { n: 'Koşu Bandı', img: 'washing_machine.jpg' }, { n: 'Kondisyon Bisikleti', img: 'washing_machine.jpg' } ] }
      ] },
      { key: 'guvenlik', label: 'Kamera ve Kilit', groups: [
        { title: 'Kameralar', items: [ { n: 'İç Mekan Kamerası', img: 'security_camera.jpg' }, { n: 'Dış Mekan Kamerası', img: 'security_camera.jpg' }, { n: 'PTZ Kamera', img: 'security_camera.jpg' }, { n: 'Bebek Kamerası', img: 'security_camera.jpg' } ] },
        { title: 'Kilit & Zil', items: [ { n: 'Akıllı Kapı Kilidi', img: 'door_lock.jpg' }, { n: 'Akıllı Kapı Zili', img: 'door_lock.jpg' }, { n: 'Kasa Kilidi', img: 'door_lock.jpg' } ] },
        { title: 'Alarm', items: [ { n: 'Alarm Sireni', img: 'smart_speaker.jpg' }, { n: 'Ana Ünite', img: 'smart-hub.jpg' } ] }
      ] },
      { key: 'gateway', label: 'Ağ Geçidi Kontrol', groups: [
        { title: 'Merkez', items: [ { n: 'Kablolu Ağ Geçidi', img: 'smart-hub.jpg' }, { n: 'Kablosuz Ağ Geçidi', img: 'smart-hub.jpg' }, { n: 'Çoklu Ağ Geçidi', img: 'smart-hub.jpg' } ] },
        { title: 'Ekranlar', items: [ { n: 'Akıllı Kontrol Paneli', img: 'thermostat.jpg' }, { n: 'Mini Panel', img: 'thermostat.jpg' } ] }
      ] },
      { key: 'doga', label: 'Doğa Sporları', groups: [
        { title: 'Araçlar', items: [ { n: 'Elektrikli Scooter', img: 'robot-mop.jpg' }, { n: 'Elektrikli Bisiklet', img: 'robot-mop.jpg' } ] },
        { title: 'Ekipman', items: [ { n: 'Akıllı Kask', img: 'motion-sensor.jpg' }, { n: 'Takip Cihazı', img: 'door-sensor.jpg' } ] }
      ] },
      { key: 'enerji', label: 'Enerji Tasarrufu', groups: [
        { title: 'Ölçüm', items: [ { n: 'Enerji Ölçüm Cihazı', img: 'energy-meter.jpg' }, { n: 'Akıllı Elektrik Sayacı', img: 'energy-meter.jpg' } ] },
        { title: 'İzleme', items: [ { n: 'Priz Bazlı Enerji İzleme', img: 'power-monitor.jpg' } ] },
        { title: 'Güneş Enerjisi', items: [ { n: 'Güneş Paneli İnvertörü', img: 'solar-panel.jpg' }, { n: 'Enerji Yönetim Panosu', img: 'energy-display.jpg' } ] }
      ] },
      { key: 'eglence', label: 'Eğlence', groups: [
        { title: 'Görüntü', items: [ { n: 'Akıllı TV', img: 'smart_tv.jpg' }, { n: 'Projeksiyon', img: 'smart_tv.jpg' }, { n: 'Medya Oynatıcı', img: 'smart-hub.jpg' } ] },
        { title: 'Ses', items: [ { n: 'Soundbar', img: 'soundbar.jpg' }, { n: 'Akıllı Hoparlör', img: 'smart_speaker.jpg' }, { n: 'Bluetooth Hoparlör', img: 'smart_speaker.jpg' } ] },
        { title: 'Aydınlatma', items: [ { n: 'Senkronize Işık Şeridi', img: 'led-strip.jpg' }, { n: 'PC Ortam Işığı', img: 'led-strip.jpg' } ] }
      ] },
      { key: 'sanayi', label: 'Sanayi ve Tarım', groups: [
        { title: 'Sulama', items: [ { n: 'Akıllı Sulama Valfi', img: 'water-leak.jpg' }, { n: 'Toprak Nem Sensörü', img: 'temp-humidity.jpg' }, { n: 'Hava İstasyonu', img: 'air-quality.jpg' } ] },
        { title: 'Tarım', items: [ { n: 'Bitki Yetiştirme Işığı', img: 'smart_bulb.jpg' }, { n: 'Sıcaklık Kontrolörü', img: 'thermostat.jpg' } ] },
        { title: 'Sanayi', items: [ { n: 'Endüstriyel Röle', img: 'power-strip.jpg' }, { n: 'Endüstriyel Sensör', img: 'motion-sensor.jpg' } ] }
      ] }
    ];

    // pair.html gibi eski baglantilardan gelen ?category anahtarlarini eslestir
    var CATALOG_ALIAS = {
      lighting: 'aydinlatma', plugs: 'elektrik', security: 'guvenlik', locks: 'guvenlik',
      climate: 'buyuk-ev', sensors: 'sensorler', entertainment: 'eglence', appliances: 'buyuk-ev',
      hubs: 'gateway', cleaning: 'kucuk-ev', energy: 'enerji'
    };`;

const regex = /\/\/\s*----\s*Manuel katalog veri semasi.*?var\s+CATALOG_ALIAS\s*=\s*\{.*?\};/s;

if (regex.test(html)) {
  html = html.replace(regex, newCatalogJS);
  fs.writeFileSync(file, html, 'utf8');
  console.log('Successfully updated CATALOG in stitch-integrations.html');
} else {
  console.log('Could not find CATALOG array to replace.');
}
