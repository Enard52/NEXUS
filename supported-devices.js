// NEXUS — desteklenen cihaz matrisi (tek kaynak).
// Eşleştirme ekranı ve kontrol panelleri bu listeyi kullanır; Plan 4 connector'ları
// `protocol` anahtarına göre bu markaları besler.
// Yalnızca bulut ücreti ödemeden, yerel ağdan (LAN) kontrol edebildiğimiz cihazlar.
// img: assets/products/ altındaki gerçek ürün görseli (hotlink yok, offline çalışır).
(function () {
  "use strict";

  var NEXUS_SUPPORTED_DEVICES = [
    {
      brand: "Shelly",
      protocol: "shelly",
      note: "Yerel HTTP API — kurulumu en kolay marka",
      models: [
        { name: "Shelly Plug S", img: "generic-smart-plug.png", caps: ["switch", "energy"] },
        { name: "Shelly Bulb", img: "generic-led-bulb.png", caps: ["switch", "brightness", "colorTemp"] },
        { name: "Shelly Dimmer", img: "generic-wall-switch.png", caps: ["switch", "brightness"] },
        { name: "Shelly Motion", img: "generic-motion-sensor.png", caps: ["motion", "temperature"] },
      ],
    },
    {
      brand: "TP-Link Tapo",
      protocol: "tapo",
      note: "Yerel API (KLAP)",
      models: [
        { name: "Tapo P110 Akıllı Priz", img: "generic-smart-plug.png", caps: ["switch", "energy"] },
        { name: "Tapo L530E Ampul", img: "generic-led-bulb.png", caps: ["switch", "brightness", "color"] },
        { name: "Tapo S265 Termostat", img: "generic-thermostat.png", caps: ["temperature", "humidity"] },
        { name: "Tapo C210 Kamera", img: "generic-indoor-camera.png", caps: ["camera"] },
      ],
    },
    {
      brand: "TP-Link Kasa",
      protocol: "kasa",
      note: "Yerel API",
      models: [
        { name: "Kasa KP105 Priz", img: "generic-smart-plug.png", caps: ["switch", "energy"] },
        { name: "Kasa KS205 Anahtar", img: "generic-wall-switch.png", caps: ["switch"] },
        { name: "Kasa KL110 Ampul", img: "generic-led-bulb.png", caps: ["switch", "brightness"] },
      ],
    },
    {
      brand: "Yeelight",
      protocol: "yeelight",
      note: "Yerel TCP komutları",
      models: [
        { name: "Yeelight Tavan Lambası", img: "generic-ceiling-light.png", caps: ["switch", "brightness", "color"] },
        { name: "Yeelight Şerit", img: "generic-led-strip.png", caps: ["switch", "brightness", "color"] },
        { name: "Yeelight Masa Lambası", img: "generic-table-lamp.png", caps: ["switch", "brightness"] },
      ],
    },
    {
      brand: "WLED",
      protocol: "wled",
      note: "Açık JSON API",
      models: [
        { name: "WLED Şerit Kontrolcü", img: "generic-led-strip.png", caps: ["switch", "brightness", "color"] },
      ],
    },
    {
      brand: "ESPHome",
      protocol: "esphome",
      note: "Yerel API — DIY cihazlar",
      models: [
        { name: "ESPHome Röle Paneli", img: "generic-power-strip.png", caps: ["switch"] },
        { name: "ESPHome Hava Sensörü", img: "generic-air-quality.png", caps: ["temperature", "humidity"] },
      ],
    },
    {
      brand: "Philips Hue",
      protocol: "hue",
      note: "Yerel köprü API'si (Hue Bridge gerekir)",
      models: [
        { name: "Hue White & Color Ampul", img: "generic-led-bulb.png", caps: ["switch", "brightness", "color"] },
        { name: "Hue Gradient Şerit", img: "generic-led-strip.png", caps: ["switch", "brightness", "color"] },
      ],
    },
    {
      brand: "Tuya (yerel mod)",
      protocol: "tuya-local",
      note: "Gelişmiş: cihazın yerel anahtarı gerekir",
      models: [
        { name: "Tuya Akıllı Priz", img: "generic-smart-plug.png", caps: ["switch"] },
        { name: "Tuya RGB Ampul", img: "generic-led-bulb.png", caps: ["switch", "brightness", "color"] },
        { name: "Tuya Kapı Sensörü", img: "generic-door-lock.png", caps: ["contact"] },
      ],
    },
  ];

  window.NEXUS_SUPPORTED_DEVICES = NEXUS_SUPPORTED_DEVICES;

  // Plan 3 (kontrol panelleri) aynı capability kümesini paylaşan cihazları ortak
  // panelde toplar; gruplama anahtarı burada üretilir.
  window.nexusCapabilityKey = function (caps) {
    return (caps || []).slice().sort().join("+");
  };

  // Eşleştirme sırasında cihazın protokol/işlev/görsel bilgisini çözür.
  // 1) Desteklenen matriste ada göre birebir eşleşme, 2) katalog kategori başlığından
  // sezgileme, 3) bilinmeyen → tek anahtarlı "other" (panelde "Diğer" grubuna düşer).
  var CAP_HINTS = [
    { test: /şerit|strip|rgb/i, caps: ["switch", "brightness", "color"], img: "generic-led-strip.png" },
    { test: /ampul|bulb|lamba|lamp/i, caps: ["switch", "brightness"], img: "generic-led-bulb.png" },
    { test: /tavan|avize|ceiling|armatür/i, caps: ["switch", "brightness"], img: "generic-ceiling-light.png" },
    { test: /priz|plug|anahtar şerit|power strip/i, caps: ["switch", "energy"], img: "generic-smart-plug.png" },
    { test: /anahtar|switch|dimmer/i, caps: ["switch"], img: "generic-wall-switch.png" },
    { test: /kamera|camera|gözetim/i, caps: ["camera"], img: "generic-indoor-camera.png" },
    { test: /termostat|klima|kombi|ısıtıcı|heater/i, caps: ["temperature"], img: "generic-thermostat.png" },
    { test: /hareket|motion|varlık/i, caps: ["motion"], img: "generic-motion-sensor.png" },
    { test: /kapı|pencere|door|window|sensör|sensor/i, caps: ["contact"], img: "generic-door-sensor.png" },
    { test: /hava kalite|air quality/i, caps: ["airQuality"], img: "generic-air-quality.png" },
    { test: /robot|süpürge|vacuum/i, caps: ["vacuum"], img: "generic-smart-hub.png" },
  ];

  window.nexusResolveDevice = function (name, groupTitle) {
    var label = String(name || "") + " " + String(groupTitle || "");
    for (var i = 0; i < NEXUS_SUPPORTED_DEVICES.length; i++) {
      var group = NEXUS_SUPPORTED_DEVICES[i];
      for (var j = 0; j < group.models.length; j++) {
        if (group.models[j].name === name) {
          return {
            brand: group.brand,
            protocol: group.protocol,
            caps: group.models[j].caps.slice(),
            img: group.models[j].img,
          };
        }
      }
    }
    for (var k = 0; k < CAP_HINTS.length; k++) {
      if (CAP_HINTS[k].test.test(label)) {
        return { brand: "", protocol: "unknown", caps: CAP_HINTS[k].caps.slice(), img: CAP_HINTS[k].img };
      }
    }
    return { brand: "", protocol: "unknown", caps: ["other"], img: "generic-smart-hub.png" };
  };
})();
