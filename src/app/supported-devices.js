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
      availability: "all",
      note: "Yerel HTTP API — kurulumu en kolay marka",
      models: [
        { name: "Shelly Plug S", img: "generic-smart-plug.png", caps: ["switch", "energy"] },
        {
          name: "Shelly Bulb",
          img: "generic-led-bulb.png",
          caps: ["switch", "brightness", "colorTemp"],
        },
        { name: "Shelly Dimmer", img: "control-dimmer-knob.png", caps: ["switch", "brightness"] },
        { name: "Shelly 1 / 1PM Röle", img: "control-single-wall-switch.png", caps: ["switch"] },
        { name: "Shelly 2.5 Perde Motoru", aliases: ["roller"], img: "control-curtain-motor.png", caps: ["cover"] },
        { name: "Shelly RGBW2 Şerit", img: "generic-led-strip.png", caps: ["switch", "brightness", "color"] },
        {
          name: "Shelly Motion",
          img: "generic-motion-sensor.png",
          caps: ["motion", "temperature"],
        },
      ],
    },
    {
      brand: "Shelly Plus / Pro",
      protocol: "shelly-rpc",
      availability: "all",
      note: "Yerel RPC API (Gen2/Gen3)",
      models: [
        {
          name: "Shelly Plus 1PM",
          aliases: ["anahtar"],
          img: "control-single-wall-switch.png",
          caps: ["switch", "energy"],
        },
        { name: "Shelly Plus Plug S", img: "generic-smart-plug.png", caps: ["switch", "energy"] },
        { name: "Shelly Plus 2PM Perde", img: "control-curtain-motor.png", caps: ["cover"] },
        { name: "Shelly Plus RGBW PM", img: "generic-led-strip.png", caps: ["switch", "brightness", "color"] },
        {
          name: "Shelly Dimmer Gen3",
          img: "control-dimmer-knob.png",
          caps: ["switch", "brightness"],
        },
      ],
    },
    {
      brand: "Tasmota",
      protocol: "tasmota",
      category: "bridge", // ürün değil, yazılım/köprü: ürün listelerinden ayrı gruplanır
      availability: "all",
      note: "Açık kaynak yazılımlı priz, röle ve ampuller",
      models: [
        { name: "Tasmota Priz", img: "generic-smart-plug.png", caps: ["switch"] },
        { name: "Tasmota Röle", img: "generic-power-strip.png", caps: ["switch"] },
        {
          name: "Tasmota RGB Ampul",
          img: "generic-led-bulb.png",
          caps: ["switch", "brightness", "color"],
        },
      ],
    },
    {
      brand: "TP-Link Tapo",
      protocol: "tapo",
      availability: "desktop",
      note: "Yerel şifreli HTTP (KLAP) — TP-Link hesabı e-postası + şifresiyle, masaüstü uygulamasında; priz, anahtar ve ampuller (kamera ve enerji ölçümü henüz yok)",
      models: [
        { name: "Tapo P110 Akıllı Priz", img: "generic-smart-plug.png", caps: ["switch"] },
        { name: "Tapo L530E Ampul", img: "generic-led-bulb.png", caps: ["switch", "brightness", "color"] },
        { name: "Tapo S265 Termostat", img: "generic-thermostat-c.png", caps: ["temperature", "humidity"] },
        { name: "Tapo C210 Kamera", img: "security-indoor-camera.png", caps: ["camera"] },
      ],
    },
    {
      brand: "TP-Link Kasa",
      protocol: "kasa",
      availability: "desktop",
      note: "Yerel TCP — masaüstü uygulamasında",
      models: [
        { name: "Kasa KP105 Priz", img: "generic-smart-plug.png", caps: ["switch", "energy"] },
        { name: "Kasa KS205 Anahtar", img: "control-single-wall-switch.png", caps: ["switch"] },
        { name: "Kasa KL110 Ampul", img: "generic-led-bulb.png", caps: ["switch", "brightness"] },
      ],
    },
    {
      brand: "Yeelight",
      protocol: "yeelight",
      availability: "desktop",
      note: "Yerel TCP (LAN Control açık) — masaüstü uygulamasında",
      models: [
        {
          name: "Yeelight Tavan Lambası",
          img: "generic-ceiling-light.png",
          caps: ["switch", "brightness", "color"],
        },
        {
          name: "Yeelight Şerit",
          img: "generic-led-strip.png",
          caps: ["switch", "brightness", "color"],
        },
        {
          name: "Yeelight Masa Lambası",
          img: "generic-table-lamp.png",
          caps: ["switch", "brightness"],
        },
      ],
    },
    {
      brand: "WLED",
      protocol: "wled",
      category: "bridge", // ürün değil, yazılım/köprü: ürün listelerinden ayrı gruplanır
      availability: "all",
      note: "Açık JSON API",
      models: [
        {
          name: "WLED Şerit Kontrolcü",
          img: "generic-led-strip.png",
          caps: ["switch", "brightness", "color"],
        },
      ],
    },
    {
      brand: "ESPHome",
      protocol: "esphome",
      category: "bridge", // ürün değil, yazılım/köprü: ürün listelerinden ayrı gruplanır
      availability: "all",
      note: "web_server bileşeniyle — DIY cihazlar",
      models: [
        {
          name: "ESPHome Röle Paneli",
          aliases: ["çoklu priz"],
          img: "generic-power-strip.png",
          caps: ["switch"],
        },
        {
          name: "ESPHome Hava Sensörü",
          aliases: ["hava kalitesi", "sıcaklık ve nem sensörü"],
          img: "generic-air-quality.png",
          caps: ["temperature", "humidity"],
        },
      ],
    },
    {
      brand: "Philips Hue",
      protocol: "hue",
      availability: "all",
      note: "Yerel köprü API'si (Hue Bridge gerekir)",
      models: [
        {
          name: "Hue White & Color Ampul",
          img: "generic-led-bulb.png",
          caps: ["switch", "brightness", "color"],
        },
        {
          name: "Hue Gradient Şerit",
          img: "generic-led-strip.png",
          caps: ["switch", "brightness", "color"],
        },
      ],
    },
    {
      brand: "Home Assistant",
      protocol: "homeassistant",
      category: "bridge", // ürün değil, yazılım/köprü: ürün listelerinden ayrı gruplanır
      availability: "all",
      note: "Kendi Home Assistant sunucun üzerinden binlerce marka (Tuya, Xiaomi, Sonoff, Zigbee, Matter…) — ücretsiz",
      models: [
        {
          name: "Home Assistant Işık",
          img: "generic-led-bulb.png",
          caps: ["switch", "brightness", "color"],
        },
        { name: "Home Assistant Priz / Anahtar", img: "generic-smart-plug.png", caps: ["switch"] },
        { name: "Home Assistant Perde", img: "control-curtain-motor.png", caps: ["cover"] },
        {
          name: "Home Assistant Klima / Termostat",
          aliases: ["klima"],
          img: "generic-air-conditioner.png",
          caps: ["switch", "temperature"],
        },
        { name: "Home Assistant Fan", img: "generic-fan.png", caps: ["switch"] },
        { name: "Home Assistant Nemlendirici", img: "generic-humidifier.png", caps: ["switch", "airQuality"] },
        { name: "Home Assistant Medya Oynatıcı / TV", img: "generic-smart-tv.png", caps: ["switch", "media"] },
        { name: "Home Assistant Kilit", img: "security-keypad-lock.png", caps: ["lock"] },
        { name: "Home Assistant Robot Süpürge", img: "generic-robot-vacuum.png", caps: ["vacuum"] },
      ],
    },
    {
      brand: "Tuya (yerel mod)",
      protocol: "tuya-local",
      availability: "desktop",
      note: "Yerel LAN (3.3 / 3.4, şifreli TCP) — ücretsiz Tuya IoT hesabından alınan cihaz kimliği + yerel anahtarla, masaüstü uygulamasında; priz, anahtar ve ampuller",
      models: [
        { name: "Tuya Akıllı Priz", img: "generic-smart-plug.png", caps: ["switch"] },
        { name: "Tuya RGB Ampul", img: "generic-led-bulb.png", caps: ["switch", "brightness", "color"] },
        { name: "Tuya Akıllı Anahtar / Röle", img: "control-single-wall-switch.png", caps: ["switch"] },
        { name: "Tuya Kapı Sensörü", img: "security-door-sensor.png", caps: ["contact"] },
        {
          name: "Tuya Termostat",
          img: "generic-thermostat-c.png",
          caps: ["temperature", "humidity"],
        },
      ],
    },
    {
      brand: "Sonoff (DIY modu)",
      protocol: "sonoff",
      availability: "all",
      note: "eWeLink DIY modu (cihazda DIY açılmış olmalı) — çok kanallı modellerde her kanal ayrı cihaz",
      models: [
        { name: "Sonoff BASICR3 Röle", img: "control-single-wall-switch.png", caps: ["switch"] },
        { name: "Sonoff MINIR2 Röle", img: "control-single-wall-switch.png", caps: ["switch"] },
        { name: "Sonoff 4CHPROR3 4 Kanallı Röle", img: "control-four-gang-switch.png", caps: ["switch"] },
      ],
    },
    {
      brand: "WiZ",
      protocol: "wiz",
      availability: "desktop",
      note: "Yerel UDP — masaüstü uygulamasında; yerleşik sahneler dahil",
      models: [
        { name: "WiZ A60 Renkli Ampul", img: "generic-led-bulb.png", caps: ["switch", "brightness", "color"] },
        { name: "WiZ Işık Şeridi", img: "generic-led-strip.png", caps: ["switch", "brightness", "color"] },
      ],
    },
    {
      brand: "LIFX",
      protocol: "lifx",
      availability: "desktop",
      note: "Yerel UDP — masaüstü uygulamasında",
      models: [
        { name: "LIFX Mini Color Ampul", img: "generic-led-bulb.png", caps: ["switch", "brightness", "color"] },
        { name: "LIFX Z LED Şerit", img: "generic-led-strip.png", caps: ["switch", "brightness", "color"] },
      ],
    },
    {
      brand: "Govee",
      protocol: "govee",
      availability: "desktop",
      note: "Yerel UDP (Govee Home'da LAN Control açık olmalı) — masaüstü uygulamasında",
      models: [
        { name: "Govee H6159 LED Şerit", img: "generic-led-strip.png", caps: ["switch", "brightness", "color"] },
      ],
    },
    {
      brand: "Wake-on-LAN",
      protocol: "wol",
      category: "bridge", // ürün değil, yazılım/köprü: ürün listelerinden ayrı gruplanır
      availability: "all",
      note: "Ağ üzerinden PC veya TV uyandırma (Home Assistant standardı)",
      models: [{ name: "Wake-on-LAN PC / TV", img: "generic-smart-hub.png", caps: ["switch"] }],
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
  // Sıra önemli: özel eşleşmeler genel olanlardan önce gelir. Desenler küçük harf
  // (tr-TR) metne uygulanır.
  var CAP_HINTS = [
    // Yük anahtarlamayan düğmeler, kumandalar ve titreşim sensörü; duvar anahtarı/hareket sensöründen ayrı işlevlerdir.
    {
      test: /thermostat switch|termostat anahtar/,
      caps: ["switch", "temperature"],
      img: "control-thermostat-switch.png",
    },
    {
      test: /kablosuz anahtar|akıllı buton|senaryo anahtar|uyandırma anahtar|kumanda/,
      caps: ["button"],
      img: "control-wireless-button.png",
    },
    { test: /titreşim|vibration/, caps: ["sensor"], img: "generic-motion-sensor.png" },
    {
      test: /aydınlatma sensör|ışık sensör|lux/,
      caps: ["illuminance"],
      img: "generic-motion-sensor.png",
    },
    {
      test: /basınç sensör|çok fonksiyonlu sensör|meteoroloji/,
      caps: ["sensor"],
      img: "generic-pressure-sensor.png",
    },
    { test: /projektör|projeksiyon/, caps: ["switch", "media"], img: "generic-projector.png" },
    { test: /priz|plug/, caps: ["switch", "energy"], img: "generic-smart-plug.png" },
    {
      test: /evcil|pet feeder|kedi kumu|akvaryum|aquarium|balık besleyici/,
      caps: ["switch", "pet"],
      img: "misc-pet-feeder.png",
    },
    {
      test: /bebek|beşik|mama hazırlayıcı|göğüs pompa|biberon/,
      caps: ["baby"],
      img: "misc-baby-monitor.png",
    },
    {
      test: /tansiyon|oksimetre|ateş ölçer|bileklik|uyku|yastık|akıllı yatak|diş fırça|yüz temizley|yüz buhar|saç kurutma|masaj|ayak küvet|fizyoterapi|egzersiz aynası|kanepe|çalar saat|dinlenme ışığı|otoskop/,
      caps: ["health"],
      img: "health-smart-band.png",
    },
    {
      test: /ip atlama|halter|raket|egzersiz tekerle|hula|direnç bandı|bilek güçlendirme|koşu bandı|kürek çekme|kondisyon/,
      caps: ["fitness"],
      img: "generic-treadmill.png",
    },
    {
      test: /scooter|kaykay|bisiklet|bicycle|elektrikli araç(?! şarj)|tekerlekli sandalye|helmet|kompresör|tracker|(^|[\s(])izleyici/,
      caps: ["mobility"],
      img: "generic-scooter.png",
    },
    {
      test: /sulama|su vana|fiskiye|bitki|toprak sensör|çim biçme/,
      caps: ["switch", "garden"],
      img: "agri-irrigation-sprinkler.png",
    },
    {
      test: /ağ geçidi|çok modlu geçit|yönlendirici|router|menzil arttırıcı|yoğunlaştırıcı|konnektör/,
      caps: ["network"],
      img: "generic-smart-hub.png",
    },
    {
      test: /robot süpürge|elektrikli süpürge|cam temizlik robot|vacuum|pool cleaner/,
      caps: ["switch", "vacuum"],
      img: "generic-robot-vacuum.png",
    },
    {
      test: /kamera|camera|gözetim|kapı zili|doorbell|nvr|dvr|video baz/,
      caps: ["camera"],
      img: "security-indoor-camera.png",
    },
    {
      test: /kilit|kilid|lock|kasa|turnike|gating|smart door|anahtar kutusu/,
      caps: ["lock"],
      img: "security-keypad-lock.png",
    },
    {
      test: /duman|gaz dedekt|co dedekt|karbonmonoksit|su basma|sızıntı|siren|alarm|acil durum|organik bileşik/,
      caps: ["alarm"],
      img: "security-smoke-detector.png",
    },
    // Garaj/kapı açıcılar perdeden ayrı bir işlevdir (henüz desteklenen model yok).
    { test: /garaj|kapı açıcı|gate/, caps: ["switch", "cover"], img: "control-garage-remote.png" },
    {
      test: /perde|panjur|curtain|blind/,
      caps: ["switch", "cover"],
      img: "control-curtain-motor.png",
    },
    {
      test: /şerit|strip|rgb|ambiyans|ortam ışığı/,
      caps: ["switch", "brightness", "color"],
      img: "generic-led-strip.png",
    },
    { test: /dimmer/, caps: ["switch", "brightness"], img: "control-dimmer-knob.png" },
    {
      test: /tavan|avize|ceiling|armatür/,
      caps: ["switch", "brightness"],
      img: "generic-ceiling-light.png",
    },
    {
      test: /ampul|bulb|lamba|lamp|ışık|aydınlatma/,
      caps: ["switch", "brightness"],
      img: "generic-led-bulb.png",
    },
    {
      test: /hava temiz|purifier|nemlendirici|nem alma|humidifier|hava kutusu/,
      caps: ["switch", "airQuality"],
      img: "generic-air-purifier.png",
    },
    {
      test: /hava kalite|air quality|pm2\.5|voc/,
      caps: ["airQuality"],
      img: "generic-air-quality.png",
    },
    {
      test: /termostat|thermostat|trv|radyatör vana/,
      caps: ["temperature"],
      img: "generic-thermostat-c.png",
    },
    {
      test: /klima|kombi|ısıtıcı|soba|heater|ısı pompa|fan|vantilatör|havalandırma|kalorifer|battaniye|şömine|ısıtma|ısıtmalı/,
      caps: ["switch", "temperature"],
      img: "generic-air-conditioner.png",
    },
    {
      test: /sıcaklık|nem sensör|temperature|humidity/,
      caps: ["temperature", "humidity"],
      img: "generic-temp-humidity.png",
    },
    {
      test: /hareket|motion|varlı|vücudu|presence|titreşim/,
      caps: ["motion"],
      img: "generic-motion-sensor.png",
    },
    {
      test: /kapı|pencere|door|window|contact/,
      caps: ["contact"],
      img: "security-door-sensor.png",
    },
    {
      test: /devre kesici|breaker|invertör|transformatör|energy mate|güç istasyon|şarj istasyon/,
      caps: ["switch", "energy"],
      img: "energy-circuit-breaker.png",
    },
    {
      test: /televizyon|hoparlör|amplifier|earphone|kulaklık|fotoğraf çerçeve|ekran|kitap okuyucu|yazıcı|12x48|5x36/,
      caps: ["switch", "media"],
      img: "generic-smart-tv.png",
    },
    {
      test: /makine|fırın|oven|ocak|kettle|kahve|çamaşır|bulaşık|buzdolabı|mikrodalga|fritöz|blender|pişirme|robotu|mutfak|davlumbaz|aspiratör|sıkacağ|şarap dolab|çöp|sterilizatör|terazi|tartı|termometre|bardak|ayakkabı|sinek|giysi|ısıtıcı|lift/,
      caps: ["switch", "appliance"],
      img: "generic-smart-plug.png",
    },
    {
      test: /priz|plug|power strip|sayaç|meter/,
      caps: ["switch", "energy"],
      img: "generic-smart-plug.png",
    },
    {
      test: /anahtar|switch|buton|button|kumanda|remote/,
      caps: ["switch"],
      img: "control-single-wall-switch.png",
    },
  ];

  // Kontrol panelleri: aynı işlevi gören cihazlar tek panelde toplanır.
  // Panel, cihazın yetenek kümesinden (caps) baskın işleve göre seçilir.
  var PANELS = [
    // Etiket: panelin ne kontrol ettiğini söyler ("… kontrol paneli" + kontrol edilebilen şeyler).
    {
      id: "camera",
      label: "Kamera kontrol paneli · durum ve gizlilik",
      icon: "camera",
      when: ["camera"],
    },
    {
      id: "vacuum",
      label: "Robot süpürge kontrol paneli · başlat, durdur, eve dön",
      icon: "bot",
      when: ["vacuum"],
    },
    { id: "lock", label: "Kilit kontrol paneli · kilitle, aç", icon: "lock", when: ["lock"] },
    {
      id: "alarm",
      label: "Alarm kontrol paneli · kur, kapat, sirene",
      icon: "siren",
      when: ["alarm"],
    },
    {
      id: "cover",
      label: "Perde ve panjur kontrol paneli · aç, kapat, konum",
      icon: "blinds",
      when: ["cover"],
    },
    {
      id: "color-light",
      label: "Renkli aydınlatma kontrol paneli · renk, parlaklık",
      icon: "lightbulb",
      when: ["color"],
    },
    {
      id: "light",
      label: "Aydınlatma kontrol paneli · aç, kapat, parlaklık",
      icon: "lamp-ceiling",
      when: ["brightness"],
    },
    {
      id: "air",
      label: "Hava kalitesi paneli · ölçüm ve uyarılar",
      icon: "wind",
      when: ["airQuality"],
    },
    {
      id: "motion",
      label: "Hareket sensörü paneli · algılama ve uyarılar",
      icon: "radar",
      when: ["motion"],
    },
    {
      id: "contact",
      label: "Kapı ve pencere sensörü paneli · açık/kapalı durumu",
      icon: "door-closed",
      when: ["contact"],
    },
    {
      id: "pet",
      label: "Evcil hayvan kontrol paneli · besleme, takip",
      icon: "paw-print",
      when: ["pet"],
    },
    {
      id: "baby",
      label: "Bebek ürünleri paneli · izleme ve uyarılar",
      icon: "baby",
      when: ["baby"],
    },
    {
      id: "health",
      label: "Sağlık ve uyku paneli · ölçüm, takip",
      icon: "heart-pulse",
      when: ["health"],
    },
    {
      id: "fitness",
      label: "Spor ekipmanları paneli · takip, ölçüm",
      icon: "dumbbell",
      when: ["fitness"],
    },
    {
      id: "garden",
      label: "Bahçe ve sulama kontrol paneli · vana, zamanlama",
      icon: "sprout",
      when: ["garden"],
    },
    {
      id: "media",
      label: "Medya kontrol paneli · aç, kapat, ses, kanal",
      icon: "tv",
      when: ["media"],
    },
    {
      id: "appliance",
      label: "Ev aletleri kontrol paneli · başlat, durdur, program",
      icon: "cooking-pot",
      when: ["appliance"],
    },
    {
      id: "climate",
      label: "İklim kontrol paneli · sıcaklık, nem, mod",
      icon: "thermometer",
      when: ["temperature", "humidity"],
    },
    {
      id: "env",
      label: "Ortam sensörü paneli · sıcaklık, ışık, durum",
      icon: "gauge",
      when: ["illuminance", "sensor"],
    },
    {
      id: "energy",
      label: "Priz ve enerji kontrol paneli · aç, kapat, tüketim",
      icon: "plug-zap",
      when: ["energy"],
    },
    {
      id: "mobility",
      label: "Ulaşım ve takip paneli · konum, şarj",
      icon: "bike",
      when: ["mobility"],
    },
    {
      id: "network",
      label: "Ağ geçidi paneli · bağlantı, durum",
      icon: "router",
      when: ["network"],
    },
    {
      id: "switch",
      label: "Anahtar kontrol paneli · aç, kapat",
      icon: "toggle-left",
      when: ["switch"],
    },
  ];
  var OTHER_PANEL = { id: "other", label: "Diğer cihazlar", icon: "cpu" };

  window.nexusPanelOf = function (caps) {
    caps = caps || [];
    for (var i = 0; i < PANELS.length; i++) {
      for (var j = 0; j < PANELS[i].when.length; j++) {
        if (caps.indexOf(PANELS[i].when[j]) !== -1) {
          return { id: PANELS[i].id, label: PANELS[i].label, icon: PANELS[i].icon };
        }
      }
    }
    return { id: OTHER_PANEL.id, label: OTHER_PANEL.label, icon: OTHER_PANEL.icon };
  };

  window.nexusResolveDevice = function (name, groupTitle) {
    // Türkçe büyük/küçük harf (I/ı, İ/i) doğru eşleşsin diye tr yerel ayarıyla küçült.
    var label = (String(name || "") + " " + String(groupTitle || "")).toLocaleLowerCase("tr-TR");
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
        return {
          brand: "",
          protocol: "unknown",
          caps: CAP_HINTS[k].caps.slice(),
          img: CAP_HINTS[k].img,
        };
      }
    }
    return { brand: "", protocol: "unknown", caps: ["other"], img: "generic-smart-hub.png" };
  };

  // Katalogdaki bir ürün (ad + grup) desteklenen bir modelle AYNI işlevde mi?
  // Destek tek kaynaktan türetilir: NEXUS_SUPPORTED_DEVICES'a yeni model eklendiğinde ilgili
  // katalog ürünleri kendiliğinden görünür; katalog verisi silinmez.
  // İşlev = CAP_HINTS sırası (ör. priz, ampul, anahtar, hareket sensörü). Bir model, adının düştüğü
  // işleve ve görselinin ait olduğu ilk işleve kaydedilir. Wake-on-LAN ağ geçidi değildir.
  function hintIndexOf(label) {
    for (var k = 0; k < CAP_HINTS.length; k++) if (CAP_HINTS[k].test.test(label)) return k;
    return -1;
  }
  var supportedFnCache = null;
  function supportedFunctions() {
    var total = 0;
    NEXUS_SUPPORTED_DEVICES.forEach(function (g) {
      total += g.models.length;
    });
    if (supportedFnCache && supportedFnCache.total === total) return supportedFnCache.set;
    var set = {};
    NEXUS_SUPPORTED_DEVICES.forEach(function (g) {
      g.models.forEach(function (m) {
        if (m.img === "generic-smart-hub.png") return;
        // Model adı ve (varsa) işlev takma adları: adı hiçbir işleve düşmeyen modeller için.
        [m.name].concat(m.aliases || []).forEach(function (label) {
          var idx = hintIndexOf(String(label).toLocaleLowerCase("tr-TR"));
          if (idx >= 0) set[idx] = 1;
        });
      });
    });
    supportedFnCache = { total: total, set: set };
    return set;
  }
  window.nexusIsSupported = function (name, groupTitle) {
    for (var i = 0; i < NEXUS_SUPPORTED_DEVICES.length; i++) {
      for (var j = 0; j < NEXUS_SUPPORTED_DEVICES[i].models.length; j++) {
        if (NEXUS_SUPPORTED_DEVICES[i].models[j].name === name) return true;
      }
    }
    var idx = hintIndexOf(
      (String(name || "") + " " + String(groupTitle || "")).toLocaleLowerCase("tr-TR"),
    );
    return idx >= 0 && !!supportedFunctions()[idx];
  };
})();
