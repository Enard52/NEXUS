lucide.createIcons();

function focusCatalogSearch() {
  const input = document.getElementById("catalog-search");
  if (!input) return;
  input.focus();
  input.select();
}

// Gömülü mod: pair.html içinde iframe olarak gösterilince kendi başlığını gizle
if (new URLSearchParams(location.search).has("embed")) {
  var _ih = document.getElementById("int-header");
  if (_ih) _ih.style.display = "none";
}

// ---- Tam 1:1 NEXUS Katalog Verisi (Tuya Referanslı) ----
var CATALOG = [
  {
    key: "elektrik-ustasi",
    label: "Elektrik Ustası",
    groups: [
      {
        title: "Soket",
        items: [
          {
            n: "Akıllı Priz",
            img: "generic-smart-plug.png",
          },
          {
            n: "Akıllı Priz (Bluetooth)",
            img: "generic-smart-plug.png",
          },
          {
            n: "Akıllı Priz (ZigBee)",
            img: "generic-smart-plug.png",
          },
          {
            n: "Akıllı Priz (Ağ Geçidi)",
            img: "generic-smart-plug.png",
          },
          {
            n: "Akıllı Priz (NB-IoT)",
            img: "generic-smart-plug.png",
          },
          {
            n: "Çoklu Priz",
            img: "generic-smart-plug.png",
          },
          {
            n: "Çoklu Priz (Bluetooth)",
            img: "generic-smart-plug.png",
          },
          {
            n: "Çoklu Priz (Zigbee)",
            img: "generic-smart-plug.png",
          },
          {
            n: "Akıllı Çiftli Priz (BLE+Wi-Fi)",
            img: "generic-smart-plug.png",
          },
        ],
      },
      {
        title: "Anahtar",
        items: [
          {
            n: "Anahtar",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Anahtar (Bluetooth)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Anahtar (ZigBee)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Akıllı Anahtar (1 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Akıllı Anahtar (2 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Akıllı Anahtar (3 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Akıllı Anahtar (4 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Dokunmatik Anahtar (1 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Dokunmatik Anahtar (2 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Dokunmatik Anahtar (3 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Dokunmatik Anahtar (4 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Nötrsüz Anahtar (1 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Nötrsüz Anahtar (2 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Nötrsüz Anahtar (3 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Nötrsüz Anahtar (4 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Kablosuz Anahtar",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Kablosuz Anahtar (1 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Kablosuz Anahtar (2 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Kablosuz Anahtar (3 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Kablosuz Anahtar (4 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Kablosuz Anahtar (6 Çıkışlı)",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Perde Anahtarı",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Dimmer Anahtar",
            img: "control-dimmer-knob.png",
          },
          {
            n: "Dimmer Anahtar (Zigbee)",
            img: "control-dimmer-knob.png",
          },
          {
            n: "Uyandırma Anahtarı",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Akıllı Buton",
            img: "generic-smart-hub.png",
          },
          {
            n: "Senaryo Anahtarı",
            img: "control-single-wall-switch.png",
          },
          {
            n: "Thermostat Switch",
            img: "generic-smart-hub.png",
          },
          {
            n: "Işık ve Fan Anahtarı",
            img: "control-single-wall-switch.png",
          },
        ],
      },
      {
        title: "Diğer",
        items: [
          {
            n: "Garaj Kapısı Kumandası (Wi-Fi)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Garaj Kapısı Kumandası (BLE)",
            img: "generic-smart-hub.png",
          },
        ],
      },
    ],
  },
  {
    key: "aydinlatma",
    label: "Aydınlatma",
    groups: [
      {
        title: "Işık Kaynağı",
        items: [
          {
            n: "Akıllı Lamba",
            img: "generic-led-bulb.png",
          },
          {
            n: "Akıllı Lamba (Bluetooth)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Akıllı Lamba (ZigBee)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Işık Kaynağı (BLE+Wi-Fi)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Retro Lamba",
            img: "generic-led-bulb.png",
          },
          {
            n: "Retro Lamba (Bluetooth)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Retro Lamba (ZigBee)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Mum Lamba",
            img: "generic-led-bulb.png",
          },
          {
            n: "Mum Lamba (Bluetooth)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Mum Lamba (ZigBee)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Spot Lamba",
            img: "generic-led-bulb.png",
          },
          {
            n: "Spot Lamba (Bluetooth)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Spot Lamba (ZigBee)",
            img: "generic-led-bulb.png",
          },
        ],
      },
      {
        title: "Oda Işıkları",
        items: [
          {
            n: "Tavan Lambası",
            img: "generic-led-bulb.png",
          },
          {
            n: "Tavan Lambası (Bluetooth)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Tavan Lambası (ZigBee)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Tavan Lambası (BLE+Wi-Fi)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Tavan Vantilatörü Lambası",
            img: "generic-smart-hub.png",
          },
          {
            n: "Masa Lambası",
            img: "generic-led-bulb.png",
          },
          {
            n: "Masa Lambası (Bluetooth)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Masa Lambası (ZigBee)",
            img: "generic-led-bulb.png",
          },
        ],
      },
      {
        title: "Ambiyans Aydınlatması",
        items: [
          {
            n: "Şerit Lamba",
            img: "generic-led-bulb.png",
          },
          {
            n: "Şerit Lamba (Bluetooth)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Şerit Lamba (Zigbee)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Şerit Lamba (BLE+Wi-Fi)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Ambiyans Lambası",
            img: "generic-led-bulb.png",
          },
          {
            n: "Ambiyans Lambası (Bluetooth)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Ambiyans Lambası (Zigbee)",
            img: "generic-led-bulb.png",
          },
          {
            n: "Ambiyans Lambası (BLE+Wi-Fi)",
            img: "generic-led-bulb.png",
          },
          {
            n: "TV Ortam Işığı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Projektör",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Dış Mekan Aydınlatması",
        items: [
          {
            n: "Dış Mekan Aydınlatması",
            img: "generic-smart-hub.png",
          },
          {
            n: "Dış Mekan Aydınlatması (BLE)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Dış Mekan Aydınlatması (Zigbee)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Güneş Enerjili Avlu Işığı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Bahçe Işığı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Çim Işığı",
            img: "generic-smart-hub.png",
          },
          {
            n: "String Light",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Control Accessories",
        items: [
          {
            n: "Uzaktan Kumanda",
            img: "generic-smart-hub.png",
          },
        ],
      },
    ],
  },
  {
    key: "sensor",
    label: "Sensör",
    groups: [
      {
        title: "Sensör",
        items: [
          {
            n: "Çok Fonksiyonlu Sensör",
            img: "security-motion-sensor.png",
          },
          {
            n: "Sıcaklık ve Nem Sensörü",
            img: "generic-temp-humidity.png",
          },
          {
            n: "Sıcaklık ve Nem Sensörü (BLE)",
            img: "generic-temp-humidity.png",
          },
          {
            n: "Sıcaklık ve Nem Sensörü (Zigbee)",
            img: "generic-temp-humidity.png",
          },
          {
            n: "Aydınlatma Sensörü",
            img: "security-motion-sensor.png",
          },
          {
            n: "Aydınlatma Sensörü (BLE)",
            img: "security-motion-sensor.png",
          },
          {
            n: "Aydınlatma Sensörü (Zigbee)",
            img: "security-motion-sensor.png",
          },
          {
            n: "Kapı ve Pencere Sensörü",
            img: "security-door-sensor.png",
          },
          {
            n: "Kapı ve Pencere Sensörü (Bluetooth)",
            img: "security-door-sensor.png",
          },
          {
            n: "Kapı ve Pencere Sensörü (ZigBee)",
            img: "security-door-sensor.png",
          },
          {
            n: "İnsan Vücudu Sensörü",
            img: "security-motion-sensor.png",
          },
          {
            n: "İnsan Vücudu Sensörü (Bluetooth)",
            img: "security-motion-sensor.png",
          },
          {
            n: "İnsan Vücudu Sensörü (ZigBee)",
            img: "security-motion-sensor.png",
          },
          {
            n: "İnsan Varlığı Sensörü",
            img: "security-motion-sensor.png",
          },
          {
            n: "İnsan Varlığı Sensörü (Bluetooth)",
            img: "security-motion-sensor.png",
          },
          {
            n: "Su Basman Sensörü",
            img: "generic-smart-hub.png",
          },
          {
            n: "Su Basman Sensörü (Bluetooth)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Su Basman Sensörü (ZigBee)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Duman Dedektörü",
            img: "security-motion-sensor.png",
          },
          {
            n: "Duman Dedektörü (Bluetooth)",
            img: "security-motion-sensor.png",
          },
          {
            n: "Duman Dedektörü (ZigBee)",
            img: "security-motion-sensor.png",
          },
          {
            n: "Gaz Dedektörü",
            img: "security-motion-sensor.png",
          },
          {
            n: "Gaz Dedektörü (Bluetooth)",
            img: "security-motion-sensor.png",
          },
          {
            n: "Gaz Dedektörü (ZigBee)",
            img: "security-motion-sensor.png",
          },
          {
            n: "CO Dedektörü",
            img: "security-motion-sensor.png",
          },
          {
            n: "Titreşim Sensörü",
            img: "security-motion-sensor.png",
          },
          {
            n: "Titreşim Sensörü (Bluetooth)",
            img: "security-motion-sensor.png",
          },
          {
            n: "Titreşim Sensörü (ZigBee)",
            img: "security-motion-sensor.png",
          },
          {
            n: "Acil Durum Düğmesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Acil Durum Düğmesi (Bluetooth)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Acil Durum Düğmesi (Zigbee)",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Çevresel Sensörler",
        items: [
          {
            n: "Hava Kalitesi Sensörü",
            img: "generic-smart-hub.png",
          },
          {
            n: "PM2.5",
            img: "generic-smart-hub.png",
          },
          {
            n: "Toprak Sensörü",
            img: "security-motion-sensor.png",
          },
        ],
      },
      {
        title: "basınç sensörü",
        items: [
          {
            n: "Basınç Sensörü",
            img: "security-motion-sensor.png",
          },
          {
            n: "Basınç Sensörü (NB-IoT)",
            img: "security-motion-sensor.png",
          },
          {
            n: "Basınç Sensörü (Gateway)",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "VOC",
        items: [
          {
            n: "Uçucu Organik Bileşik (VOC) Alarmı (Gateway)",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Termal alarm",
        items: [
          {
            n: "Termal Alarm",
            img: "generic-smart-hub.png",
          },
          {
            n: "Termal Alarm (Gateway)",
            img: "generic-smart-hub.png",
          },
        ],
      },
    ],
  },
  {
    key: "buyuk-ev-aletleri",
    label: "Büyük Ev Aletleri",
    groups: [
      {
        title: "Klima",
        items: [
          {
            n: "Taşınabilir Klima",
            img: "generic-smart-hub.png",
          },
          {
            n: "Taşınabilir Klima (Bluetooth)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Klima",
            img: "generic-smart-hub.png",
          },
          {
            n: "Duvar Tipi Klima",
            img: "generic-smart-hub.png",
          },
          {
            n: "Ayaklı Klima",
            img: "generic-smart-hub.png",
          },
          {
            n: "Pencere Tipi Klima",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Su Isıtıcıları",
        items: [
          {
            n: "Su Isıtıcısı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Hava Kaynaklı Su Isıtıcısı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Elektrikli Su Isıtıcısı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Su Isıtıcısı (Kazan Tipi)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Hot Water Circulation Pump",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Kombiler",
        items: [
          {
            n: "Kombi",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Isı Pompaları",
        items: [
          {
            n: "Akıllı Isı Pompası",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Çamaşır Makineleri",
        items: [
          {
            n: "Çamaşır Makinesi",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Çamaşır Kurutma",
        items: [
          {
            n: "Çamaşır Kurutucu",
            img: "generic-smart-hub.png",
          },
        ],
      },
    ],
  },
  {
    key: "kucuk-ev-aleti",
    label: "Küçük Ev Aleti",
    groups: [
      {
        title: "Mevsimlik Neutron Ürünler",
        items: [
          {
            n: "Elektirikli Soba",
            img: "generic-smart-hub.png",
          },
          {
            n: "Elektirikli Soba (Gateway)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Kalorifer Peteği",
            img: "generic-smart-hub.png",
          },
          {
            n: "Elektrikli Battaniye",
            img: "generic-smart-hub.png",
          },
          {
            n: "Elektrikli Şömine",
            img: "generic-smart-hub.png",
          },
          {
            n: "Süpürgelik Tipi Elektirikli Soba",
            img: "generic-smart-hub.png",
          },
          {
            n: "Alttan Isıtmalı Masa",
            img: "generic-smart-hub.png",
          },
          {
            n: "Fan",
            img: "generic-smart-hub.png",
          },
          {
            n: "Klima Fanı",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "çevre",
        items: [
          {
            n: "Hava Temizleyici",
            img: "generic-smart-hub.png",
          },
          {
            n: "Nemlendirici",
            img: "generic-smart-hub.png",
          },
          {
            n: "Hava Nemlendirici",
            img: "generic-smart-hub.png",
          },
          {
            n: "Sterilizatör",
            img: "generic-smart-hub.png",
          },
          {
            n: "Nem Alma Cihazı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Hava Kutusu",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Temizlik Ürünleri",
        items: [
          {
            n: "Akıllı Robot Süpürge",
            img: "generic-robot-vacuum.png",
          },
          {
            n: "Akıllı Robot Süpürge (2.4GHz&5GHz)",
            img: "generic-robot-vacuum.png",
          },
          {
            n: "Akıllı Robot Süpürge (Kamera)",
            img: "generic-robot-vacuum.png",
          },
          {
            n: "Cam Temizlik Robotu",
            img: "generic-robot-vacuum.png",
          },
          {
            n: "Çim Biçme Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Elektrikli Süpürge",
            img: "generic-smart-hub.png",
          },
          {
            n: "Robot pool cleaner",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "İklimlendirme",
        items: [
          {
            n: "Termostat",
            img: "generic-thermostat-c.png",
          },
          {
            n: "Termostat (Gateway)",
            img: "generic-thermostat-c.png",
          },
          {
            n: "Havalandırma Sistemi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Havalandırma Sistemi (Gateway)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Termostatik Radyatör Vanası (TRV) (Gateway)",
            img: "generic-thermostat-c.png",
          },
          {
            n: "Isıtma",
            img: "generic-smart-hub.png",
          },
          {
            n: "Havalandırma ve İklimlendirme (HVAC)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Termostatik Radyatör Vanası (TRV)",
            img: "generic-thermostat-c.png",
          },
        ],
      },
      {
        title: "Motor",
        items: [
          {
            n: "Perde",
            img: "generic-smart-hub.png",
          },
          {
            n: "Perde (Gateway)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Perde Zincir Motoru",
            img: "generic-smart-hub.png",
          },
          {
            n: "Perde Motoru (Gateway)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Çamaşır Kurutma Askısı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Çamaşır Kurutma Askısı (Gateway)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Kapı Pencere Sensörü",
            img: "security-door-sensor.png",
          },
        ],
      },
      {
        title: "Genel / Diğer",
        items: [
          {
            n: "Evcil Hayvan Tasması",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akvaryum",
            img: "generic-smart-hub.png",
          },
          {
            n: "Balık Besleyici",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akvaryum Isıtıcı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Aquarium Pump",
            img: "generic-smart-hub.png",
          },
          {
            n: "Mikrodalga Fırın",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Bitki Büyütme Işığı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Ayakkabı Sterilizatör Dolabı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Ayakkabı Kutusu",
            img: "generic-smart-hub.png",
          },
          {
            n: "Giysi Bakım Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Elektrikli Sinek Öldürücü",
            img: "generic-smart-plug.png",
          },
          {
            n: "Meteoroloji Saati",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Bebek Ürünleri",
        items: [
          {
            n: "Göğüs Pompası",
            img: "generic-smart-hub.png",
          },
          {
            n: "Süt Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Biberon Isıtıcı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Süt Isıtıcısı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Mama Hazırlayıcı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Sterilizatör Çelik Tencere",
            img: "generic-smart-hub.png",
          },
          {
            n: "Sallanan Bebek Sandalyesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Beşik",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Evcil Hayvan Ürünleri",
        items: [
          {
            n: "Akıllı Evcil Hayvan Besleme",
            img: "generic-smart-hub.png",
          },
          {
            n: "Pet Feeder (2.4GHz&5GHz)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Pet Feeder With Camera (2.4GHz&5GHz)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Evcil Hayvan Besleme (Kameralı)",
            img: "security-indoor-camera.png",
          },
          {
            n: "Evcil Hayvan Gıda Kovası",
            img: "generic-smart-hub.png",
          },
          {
            n: "Evcil Hayvan Su Sebili",
            img: "generic-smart-hub.png",
          },
          {
            n: "Kedi Kumu Kutusu",
            img: "generic-smart-hub.png",
          },
          {
            n: "Evcil Hayvan Koku Giderici",
            img: "generic-smart-hub.png",
          },
          {
            n: "Evcil Hayvan Kurutma Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Evcil Hayvan Topu",
            img: "generic-smart-hub.png",
          },
          {
            n: "Evcil Hayvan Evi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akvaryum Çoklu Prizi",
            img: "generic-smart-plug.png",
          },
          {
            n: "Evcil Hayvan Çantası",
            img: "generic-smart-hub.png",
          },
        ],
      },
    ],
  },
  {
    key: "mutfak-aletleri",
    label: "Mutfak Aletleri",
    groups: [
      {
        title: "Kitchen Electric",
        items: [
          {
            n: "Oven",
            img: "generic-smart-hub.png",
          },
          {
            n: "Entegre Mutfak",
            img: "generic-smart-hub.png",
          },
          {
            n: "Fırın",
            img: "generic-smart-hub.png",
          },
          {
            n: "Gazlı Soba",
            img: "generic-smart-hub.png",
          },
          {
            n: "Sterilizatör Kabini",
            img: "generic-smart-hub.png",
          },
          {
            n: "Bulaşık Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Davlumbaz&Aspiratör",
            img: "generic-smart-hub.png",
          },
          {
            n: "Buharlı Fırın",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Kitchen Small Electric",
        items: [
          {
            n: "Meyve Kurutma Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Buz Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Sıcak Hava Fritözü",
            img: "generic-smart-hub.png",
          },
          {
            n: "Dondurma Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Yemek Pişirme Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Elektrikli Ocak",
            img: "generic-smart-hub.png",
          },
          {
            n: "Pilav Pişirme Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Soya Sütü Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Mutfak Robotu",
            img: "generic-smart-hub.png",
          },
          {
            n: "Ekmek Yapma Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Vakumlu Pişirme Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Katı Meyve Presi ve Blender",
            img: "generic-smart-hub.png",
          },
          {
            n: "Meyve Sıkacağı",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Pişirme Ekipmanları",
        items: [
          {
            n: "Su Arıtma Cihazı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Su Arıtma Cihazı (Gateway)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Çay Demleme Tezgahı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Smart Kettle",
            img: "generic-smart-hub.png",
          },
          {
            n: "Kahve Makinesi",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Diğer",
        items: [
          {
            n: "Gıda Termometresi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Sebze Yıkama Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Şarap Dolabı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Çöp Öğütücü",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Çöp Tenekesi",
            img: "generic-smart-hub.png",
          },
        ],
      },
    ],
  },
  {
    key: "egzersiz-ve-saglik",
    label: "Egzersiz ve Sağlık",
    groups: [
      {
        title: "Spor Ekipmanları",
        items: [
          {
            n: "Hassas Mutfak Terazisi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Elektronik Akıllı Tartı",
            img: "generic-smart-scale.png",
          },
          {
            n: "Akıllı İp Atlama",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Halter",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Badminton Raketi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Egzersiz Tekerleği",
            img: "generic-smart-hub.png",
          },
          {
            n: "Tenis Raketi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Hula Hoop Çember",
            img: "generic-smart-hub.png",
          },
          {
            n: "Direnç Bandı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Bilek Güçlendirme Topu",
            img: "generic-smart-hub.png",
          },
          {
            n: "Koşu Bandı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Kürek Çekme Aleti",
            img: "generic-smart-hub.png",
          },
          {
            n: "Dikey Kondisyon Bisikleti",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Spor Test Ürünleri",
        items: [
          {
            n: "Saat/Bileklik",
            img: "generic-smart-hub.png",
          },
          {
            n: "Temassız Ateş Ölçer",
            img: "generic-smart-hub.png",
          },
          {
            n: "Tansiyon Aleti",
            img: "generic-smart-scale.png",
          },
          {
            n: "Oksimetre",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Sleep",
        items: [
          {
            n: "Uyku Butonu",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Çalar Saat",
            img: "generic-smart-hub.png",
          },
          {
            n: "Beyaz Dinlenme Işığı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Uyku İzleme Bandı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Yastık",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Yatak",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Yatak (Gateway)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Bebek Bakım Monitörü",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Kişisel Bakım",
        items: [
          {
            n: "Diş Fırçası",
            img: "generic-smart-hub.png",
          },
          {
            n: "Kulak Kiri Çıkarma Otoskopu (Kameralı)",
            img: "security-indoor-camera.png",
          },
          {
            n: "Akıllı Yüz Temizleyici",
            img: "generic-smart-hub.png",
          },
          {
            n: "Yüz Buhar Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Saç kurutma makinesi",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Diğer",
        items: [
          {
            n: "Masaj Koltuğu",
            img: "generic-smart-hub.png",
          },
          {
            n: "Ayak Küveti",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Kanepe",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Egzersiz Aynası",
            img: "generic-smart-hub.png",
          },
          {
            n: "Fizyoterapi Cihazı",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Bardak",
            img: "generic-smart-hub.png",
          },
        ],
      },
    ],
  },
  {
    key: "kamera-ve-kilit",
    label: "Kamera ve Kilit",
    groups: [
      {
        title: "Kamera",
        items: [
          {
            n: "Akıllı Kamera (Wi-Fi)",
            img: "security-indoor-camera.png",
          },
          {
            n: "Akıllı Kamera (2.4GHz&5GHz)",
            img: "security-indoor-camera.png",
          },
          {
            n: "Akıllı Kamera (Bluetooth)",
            img: "security-indoor-camera.png",
          },
          {
            n: "Indoor PTZ Camera",
            img: "generic-smart-hub.png",
          },
          {
            n: "PTZ Camera",
            img: "generic-smart-hub.png",
          },
          {
            n: "4G Kamera",
            img: "security-indoor-camera.png",
          },
          {
            n: "Kameralı Kapı Zili",
            img: "security-keypad-lock.png",
          },
          {
            n: "Akıllı Kapı Zili",
            img: "security-keypad-lock.png",
          },
          {
            n: "Akıllı Kapı Zili (2.4GHz&5GHz)",
            img: "security-keypad-lock.png",
          },
          {
            n: "Kamera Lambası",
            img: "security-indoor-camera.png",
          },
          {
            n: "Video Baz istasyonu (2.4GHz&5GHz)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Ağ Video Kaydedici (NVR)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Dijital Kayıt Cihazı (DVR)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Bird Feeder",
            img: "generic-smart-hub.png",
          },
          {
            n: "Mobile Camera",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Kapı kilidi",
        items: [
          {
            n: "Kapı Kilidi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Kapı Kilidi (Gateway)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Kapı Kilidi (NB-IoT)",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Kameralı Kilitler",
        items: [
          {
            n: "Video Kilidi",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Kilit ve Aksesuarlar",
        items: [
          {
            n: "Dolap Kilidi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Asma Kilit",
            img: "security-keypad-lock.png",
          },
          {
            n: "U Tipi Kilit",
            img: "security-keypad-lock.png",
          },
          {
            n: "Anahtar Kutusu",
            img: "control-single-wall-switch.png",
          },
        ],
      },
      {
        title: "Akıllı kutu",
        items: [
          {
            n: "Kasa",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Giriş Kontrol Ürünleri",
        items: [
          {
            n: "Akıllı Turnike",
            img: "security-keypad-lock.png",
          },
        ],
      },
      {
        title: "Smart Gating",
        items: [
          {
            n: "Smart Door",
            img: "generic-smart-hub.png",
          },
          {
            n: "Smart Gating (Wi-Fi)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Smart Gating (Bluetooth)",
            img: "generic-smart-hub.png",
          },
        ],
      },
    ],
  },
  {
    key: "ag-gecidi-kontrol-paneli",
    label: "Ağ Geçidi Kontrol Paneli",
    groups: [
      {
        title: "Ağ Geçidi",
        items: [
          {
            n: "Kablosuz Ağ Geçidi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Kablolu Ağ Geçidi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Çoklu Ağ Geçidi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Çok Fonksiyonlu Ağ Geçidi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Kablolu&Kablosuz Ağ Geçidi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Ağ Geçidi Prizi",
            img: "generic-smart-plug.png",
          },
          {
            n: "Çok Modlu Ağ Geçidi (BLE+ZigBee)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Çok Modlu Mühendislik Ağ Geçidi (BLE+ZigBee)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı ZigBee Ağ Geçidi Pro",
            img: "generic-smart-hub.png",
          },
          {
            n: "4G çok modlu geçit (BLE+ZigBee)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Birleşik Ağ Geçidi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Kablolu&Kablosuz Ağ Geçidi (ZigBee+PLC)",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Routerlar",
        items: [
          {
            n: "Yönlendirici",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Diğer",
        items: [
          {
            n: "Yoğunlaştırıcı (Gateway)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Menzil Arttırıcı",
            img: "generic-smart-hub.png",
          },
        ],
      },
    ],
  },
  {
    key: "doga-sporlari",
    label: "Doğa Sporları",
    groups: [
      {
        title: "Takip Cihazları",
        items: [
          {
            n: "GPS Vehicle Tracker (LTE Cat.1)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Hırsız Alarmı (Bluetooth)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Hırsız Alarmı (GPRS)",
            img: "generic-smart-hub.png",
          },
          {
            n: "İzleyici (NB-IoT)",
            img: "generic-smart-hub.png",
          },
          {
            n: "İzleyici (GPRS)",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Car-carried-devices",
        items: [
          {
            n: "Araç İçi Kamera (ekranlı) (Wi-Fi)",
            img: "security-indoor-camera.png",
          },
        ],
      },
      {
        title: "4G Camera",
        items: [
          {
            n: "4G Camera",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Travel",
        items: [
          {
            n: "Scooter",
            img: "generic-smart-hub.png",
          },
          {
            n: "Elektrikli Kaykay (Hoverboard)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Elektrikli Araç (Bluetooth)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Elektrikli Araç (Bluetooth Tarama Kodu)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Elektrikli Araç (GPRS)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Elektrikli Bisiklet (Bluetooth)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Electric Bicycle (Cat.1)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akülü Tekerlekli Sandalye",
            img: "generic-smart-hub.png",
          },
          {
            n: "Helmet",
            img: "generic-smart-hub.png",
          },
          {
            n: "Hava Kompresörü",
            img: "generic-smart-hub.png",
          },
        ],
      },
    ],
  },
  {
    key: "enerji-tasarrufu",
    label: "Enerji Tasarrufu",
    groups: [
      {
        title: "Breaker",
        items: [
          {
            n: "Devre kesici",
            img: "generic-smart-hub.png",
          },
          {
            n: "devre kesici (Gateway)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Devre kesici (4G)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Devre kesici (NB-IoT)",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Elektrik Sayaçları",
        items: [
          {
            n: "Akıllı Elektrik Sayacı (NB-IoT)",
            img: "generic-smart-plug.png",
          },
          {
            n: "Akıllı Elektrik Sayacı",
            img: "generic-smart-plug.png",
          },
          {
            n: "Akıllı Elektrik Sayacı (Gateway)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Elektrik Sayacı (4G)",
            img: "generic-smart-plug.png",
          },
        ],
      },
      {
        title: "Energy Mate",
        items: [
          {
            n: "Energy Mate",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Portable power supply",
        items: [
          {
            n: "Taşınabilir Güç İstasyonu",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Su Sayaçları",
        items: [
          {
            n: "Akıllı Su Sayacı",
            img: "generic-smart-plug.png",
          },
          {
            n: "Akıllı Su Sayacı (Gateway)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Su Sayacı (NB-IoT)",
            img: "generic-smart-plug.png",
          },
          {
            n: "Akıllı Su Sayacı (4G)",
            img: "generic-smart-plug.png",
          },
          {
            n: "Akıllı Su Sayacı (GPRS)",
            img: "generic-smart-plug.png",
          },
        ],
      },
      {
        title: "Bisiklet Şarj Üniteleri",
        items: [
          {
            n: "İki Tekerlekli Araç Şarj İstasyonu (4G)",
            img: "generic-smart-hub.png",
          },
          {
            n: "İki Tekerlekli Araç Şarj İstasyonu",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "EV charger",
        items: [
          {
            n: "Elektrikli Araç Şarj İstasyonu (4G)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Elektrikli Araç Şarj İstasyonu",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Akıllı Gaz Sayaçları",
        items: [
          {
            n: "Akıllı Gaz Sayacı",
            img: "generic-smart-plug.png",
          },
          {
            n: "Akıllı Gaz Sayacı (Gateway)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Gaz Sayacı (4G)",
            img: "generic-smart-plug.png",
          },
          {
            n: "Akıllı Gaz Sayacı (NB-IoT)",
            img: "generic-smart-plug.png",
          },
        ],
      },
      {
        title: "İnvertörler",
        items: [
          {
            n: "İnvertör",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Transformatörler",
        items: [
          {
            n: "Güç Transformatörleri",
            img: "generic-smart-hub.png",
          },
        ],
      },
    ],
  },
  {
    key: "eglence",
    label: "Eğlence",
    groups: [
      {
        title: "Genel",
        items: [
          {
            n: "Televizyon",
            img: "generic-smart-hub.png",
          },
          {
            n: "Bulut Fotoğraf Çerçevesi",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Printer",
        items: [
          {
            n: "Grafik yazıcı",
            img: "generic-smart-hub.png",
          },
          {
            n: "3D yazıcı",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Audio",
        items: [
          {
            n: "Earphone",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Dot Matrix Screen",
        items: [
          {
            n: "12x48",
            img: "generic-smart-hub.png",
          },
          {
            n: "5x36",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Diğer",
        items: [
          {
            n: "Hikaye Makinesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Kitap Okuyucu",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "amplifier",
        items: [
          {
            n: "Amplifier",
            img: "generic-smart-hub.png",
          },
        ],
      },
    ],
  },
  {
    key: "sanayi-ve-tarim",
    label: "Sanayi ve Tarım",
    groups: [
      {
        title: "çevre",
        items: [
          {
            n: "Bitki İzleyici",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "Vana Kontrol Ekipmanları",
        items: [
          {
            n: "Su Vanası Kumandası",
            img: "generic-smart-hub.png",
          },
          {
            n: "Su Vanası Kumandası (Gateway)",
            img: "generic-smart-hub.png",
          },
        ],
      },
      {
        title: "sulama",
        items: [
          {
            n: "Sulama Fiskiyesi",
            img: "generic-smart-hub.png",
          },
          {
            n: "Sulama Fiskiyesi (Gateway)",
            img: "generic-smart-hub.png",
          },
        ],
      },
    ],
  },
  {
    key: "diger",
    label: "Diğer",
    groups: [
      {
        title: "Diğer",
        items: [
          {
            n: "Konnektör",
            img: "generic-smart-hub.png",
          },
          {
            n: "Evrensel Kumanda",
            img: "generic-smart-hub.png",
          },
          {
            n: "Diğer",
            img: "generic-smart-hub.png",
          },
          {
            n: "Diğer (NB-IoT)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Diğer Cihazlar (Gateway)",
            img: "generic-smart-hub.png",
          },
          {
            n: "Akıllı Hoparlör",
            img: "generic-smart-hub.png",
          },
          {
            n: "Mini Lift",
            img: "generic-smart-hub.png",
          },
          {
            n: "Konferans Rezervasyon Ekranı",
            img: "generic-smart-hub.png",
          },
        ],
      },
    ],
  },
];

// pair.html gibi eski baglantilardan gelen ?category anahtarlarini eslestir
var CATALOG_ALIAS = {
  lighting: "aydinlatma",
  plugs: "elektrik-ustasi",
  security: "kamera-ve-kilit",
  locks: "kamera-ve-kilit",
  climate: "buyuk-ev-aletleri",
  sensors: "sensor",
  entertainment: "eglence",
  appliances: "buyuk-ev-aletleri",
  hubs: "ag-gecidi-kontrol-paneli",
  cleaning: "kucuk-ev-aleti",
  energy: "enerji-tasarrufu",
  "kapi-ve-erisim": "kamera-ve-kilit",
  "ayd-nlatma": "aydinlatma",
  "elektrik-ustas-": "elektrik-ustasi",
  "e-lence": "eglence",
  "k---k-ev-aleti": "kucuk-ev-aleti",
  "b-y-k-ev-aletleri": "buyuk-ev-aletleri",
  "sens-r": "sensor",
  "a--ge-idi-kontrol-paneli": "ag-gecidi-kontrol-paneli",
};

var activeCatalogCategory = CATALOG[0].key;

function escapeCatalogHtml(value) {
  return repairCatalogText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Cift-kodlanmis UTF-8 metni cozer (UTF-8 baytlari latin1/cp1252 gibi okunmus).
// Kaliplar kaynakta literal bozuk karakter olarak DEGIL \u kacislariyla duruyor:
// boylece bu dosyanin kendisi mojibake icermez ve encoding-guard onu temiz sayar.
var CP1252_TO_BYTE = {
  "\u20ac": 0x80,
  "\u201a": 0x82,
  "\u0192": 0x83,
  "\u201e": 0x84,
  "\u2026": 0x85,
  "\u2020": 0x86,
  "\u2021": 0x87,
  "\u02c6": 0x88,
  "\u2030": 0x89,
  "\u0160": 0x8a,
  "\u2039": 0x8b,
  "\u0152": 0x8c,
  "\u017d": 0x8e,
  "\u2018": 0x91,
  "\u2019": 0x92,
  "\u201c": 0x93,
  "\u201d": 0x94,
  "\u2022": 0x95,
  "\u2013": 0x96,
  "\u2014": 0x97,
  "\u02dc": 0x98,
  "\u2122": 0x99,
  "\u0161": 0x9a,
  "\u203a": 0x9b,
  "\u0153": 0x9c,
  "\u017e": 0x9e,
  "\u0178": 0x9f,
};

// Devam bayti gibi gorunen karakterler: 0x80-0xbf (latin1) + cp1252'nin
// 0x80-0x9f araligina karsilik gelen 27 karakteri (€, ’, ”, —, ™ ...).
var SUSPECT_RE = new RegExp(
  "[\\u00c2-\\u00ef][\\u0080-\\u00bf" +
    Object.keys(CP1252_TO_BYTE)
      .map(function (ch) {
        return "\\u" + ("000" + ch.charCodeAt(0).toString(16)).slice(-4);
      })
      .join("") +
    "]{1,2}",
  "g",
);

function suspectRunToBytes(run) {
  var bytes = new Uint8Array(run.length);
  for (var i = 0; i < run.length; i++) {
    var ch = run.charAt(i);
    bytes[i] = Object.prototype.hasOwnProperty.call(CP1252_TO_BYTE, ch)
      ? CP1252_TO_BYTE[ch]
      : ch.charCodeAt(0);
  }
  return bytes;
}

function decodeSuspectRun(run) {
  var first = run.charCodeAt(0);
  var twoByte = run.length === 2 && first >= 0xc2 && first <= 0xdf;
  var threeByte = run.length === 3 && first >= 0xe0 && first <= 0xef;
  if (!twoByte && !threeByte) return null;
  try {
    var decoded = new TextDecoder("utf-8", { fatal: true }).decode(suspectRunToBytes(run));
    return decoded === run ? null : decoded;
  } catch (e) {
    return null;
  }
}

function repairCatalogText(value) {
  var s = String(value || "");
  // SUSPECT_RE global: .test() lastIndex'i ilerletir, bu yuzden iki tarafta da sifirlaniyor.
  SUSPECT_RE.lastIndex = 0;
  var suspect = SUSPECT_RE.test(s);
  SUSPECT_RE.lastIndex = 0;
  if (!suspect) return s;
  return s.replace(SUSPECT_RE, function (run) {
    for (var len = run.length; len >= 2; len--) {
      var fixed = decodeSuspectRun(run.slice(0, len));
      if (fixed) return len === run.length ? fixed : fixed + run.slice(len);
    }
    return run;
  });
}

function normalizeCatalogText(value) {
  return repairCatalogText(value)
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function catalogDisplayName(value) {
  var name = repairCatalogText(value)
    .replace(
      /\s*\((Bluetooth|ZigBee|Zigbee|Wi-Fi|BLE|BLE\+Wi-Fi|NB-IoT|Gateway|Ağ Geçidi|2\.4GHz&5GHz|2\.4GHz|4G|GPRS|LTE Cat\.1|Cat\.1)\)/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
  var switchTypeMatch = name.match(/^(.*?Anahtar(?:ı)?)\s*\(([1-6])\s*Çıkışlı\)$/i);
  if (switchTypeMatch) {
    var counts = { 1: "Tekli", 2: "İkili", 3: "Üçlü", 4: "Dörtlü", 5: "Beşli", 6: "Altılı" };
    return counts[switchTypeMatch[2]] + " " + switchTypeMatch[1];
  }
  return name;
}

function pickCatalogImage(text, candidates) {
  var hash = 0;
  for (var i = 0; i < text.length; i += 1) hash = (hash + text.charCodeAt(i) * (i + 3)) % 9973;
  return candidates[hash % candidates.length];
}

function pickVariantCatalogImage(text, candidates) {
  var variants = [
    "bluetooth",
    "zigbee",
    "gateway",
    "ağ geçidi",
    "nb-iot",
    "ble+wi-fi",
    "2.4ghz",
    "4g",
  ];
  for (var i = 0; i < variants.length; i += 1) {
    if (text.indexOf(variants[i]) !== -1) return candidates[(i + 1) % candidates.length];
  }
  return pickCatalogImage(text, candidates);
}

function inferCatalogImage(item, groupTitle) {
  var itemText = normalizeCatalogText(item && item.n ? item.n : "");
  var groupText = normalizeCatalogText(groupTitle || "");
  var text = normalizeCatalogText((item && item.n ? item.n : "") + " " + (groupTitle || ""));
  // Ürün adına özel eşleşmeler (genel kurallardan önce)
  if (/masa lambasi|masa lambası/.test(itemText)) return "generic-table-lamp.png";
  if (/^(retro|mum|spot) lamba/.test(itemText)) return "generic-led-bulb.png";
  if (/arac ici kamera|araç içi kamera/.test(itemText)) return "outdoor-dash-camera.png";
  if (/kurutma askisi|kurutma askısı/.test(itemText)) return "generic-clothes-dryer.png";
  if (/elektrikli supurge|elektrikli süpürge/.test(itemText)) return "generic-robot-vacuum.png";
  if (/garaj/.test(itemText)) return "control-garage-remote.png";
  if (/acil durum dugmesi|emergency button/.test(itemText)) return "control-emergency-button.png";
  if (/hirsiz alarm|hırsız alarm/.test(itemText)) return "security-siren.png";
  if (/proje?ks?iyon|projektor/.test(itemText)) return "generic-projector.png";
  if (/su aritma|water purifier/.test(itemText)) return "generic-water-purifier-system.png";
  if (
    /hot water.*pump|circulation pump|crculation pump|sirkulasyon pompasi|sirkülasyon pompası/.test(
      itemText,
    )
  )
    return "generic-circulation-pump.png";
  if (/cay demleme|çay demleme/.test(itemText)) return "generic-tea-brewer.png";
  if (/hava kaynakli su isiticisi|hava kaynaklı su ısıtıcısı/.test(itemText))
    return "generic-heat-pump.png";
  if (/kazan tipi/.test(itemText)) return "generic-combi-boiler.png";
  if (/su isiticilari|su ısıtıcıları/.test(groupText)) return "generic-water-heater.png";
  if (/smart kettle|kettle/.test(itemText)) return "generic-kettle.png";
  if (/tasinabilir klima|taşınabilir klima/.test(itemText)) return "generic-portable-ac.png";
  if (/duvar tipi klima/.test(itemText)) return "generic-air-conditioner.png";
  if (/ayakli klima|ayaklı klima/.test(itemText)) return "generic-floor-ac.png";
  if (/pencere tipi klima/.test(itemText)) return "generic-window-ac.png";
  if (/kahve|coffee/.test(itemText)) return "generic-espresso-machine.png";
  if (/meyve kurutma/.test(itemText)) return "generic-food-dehydrator.png";
  if (/sicak hava fritoz|sıcak hava fritöz/.test(itemText)) return "generic-air-fryer.png";
  if (/pilav pisirme|pilav pişirme/.test(itemText)) return "generic-rice-cooker.png";
  if (/vakumlu pisirme|vakumlu pişirme|sous vide/.test(itemText)) return "generic-sous-vide.png";
  if (/sebze yikama|sebze yıkama/.test(itemText)) return "generic-vegetable-washer.png";
  if (/sterilizator celik tencere|sterilizatör çelik tencere|biberon steril/.test(itemText))
    return "misc-baby-sterilizer.png";
  if (/sterilizator kabini|sterilizatör kabini/.test(itemText))
    return "generic-sterilizer-cabinet.png";
  if (/su isiticisi|su ısıtıcısı|water heater/.test(itemText)) return "generic-water-heater.png";
  if (/isi pompasi|ısı pompası|heat pump/.test(itemText)) return "generic-heat-pump.png";
  if (/kombi/.test(itemText)) return "generic-combi-boiler.png";
  if (/kalorifer petegi|kalorifer peteği/.test(itemText)) return "generic-radiator.png";
  if (/gazli soba|gazlı soba|gas cooktop/.test(itemText)) return "generic-gas-cooktop.png";
  if (/elektrikli battaniye/.test(itemText)) return "generic-electric-blanket.png";
  if (/somine|şömine|fireplace/.test(itemText)) return "generic-electric-fireplace.png";
  if (/masaj koltugu|masaj koltuğu/.test(itemText)) return "health-massage-chair.png";
  if (/kondisyon bisikleti|exercise bike/.test(itemText)) return "sport-exercise-bike.png";
  if (/akulu tekerlekli sandalye|akülü tekerlekli sandalye|wheelchair/.test(itemText))
    return "outdoor-electric-wheelchair.png";
  if (/kulak kiri|otoskop|otoscope/.test(itemText)) return "health-otoscope.png";
  if (/at[eə]s olcer|ateş ölçer|forehead thermometer/.test(itemText))
    return "health-forehead-thermometer.png";
  if (/oksimetre|oximeter/.test(itemText)) return "health-pulse-oximeter.png";
  if (/basinc sensor|basınç sensör|pressure sensor/.test(itemText))
    return "generic-pressure-sensor.png";
  if (/yuz temizleyici|yüz temizleyici/.test(itemText)) return "health-face-cleanser.png";
  if (/video baz istasyonu|video base/.test(itemText)) return "security-video-base-station.png";
  if (/video kilidi|video lock/.test(itemText)) return "security-video-door-lock.png";
  if (/menzil arttirici|menzil artırıcı|range extender/.test(itemText))
    return "generic-range-extender.png";
  if (/iki tekerlekli.*sarj|iki tekerlekli.*şarj/.test(itemText))
    return "energy-two-wheel-charger-station.png";
  if (/elektrikli bisiklet|electric bicycle/.test(itemText)) return "outdoor-electric-bike.png";
  if (/bitki izleyici|toprak sensor|toprak sensör|plant monitor/.test(itemText))
    return "agri-plant-monitor-pot.png";
  if (/su vanasi kumandasi|su vanası kumandası/.test(itemText))
    return "agri-water-valve-controller.png";
  if (/supurgelik.*soba|baseboard heater/.test(text)) return "generic-baseboard-heater.png";
  if (/cim bicme|cim biçme|lawn mower/.test(text)) return "outdoor-lawn-mower.png";
  if (/davlumbaz|aspirator|aspiratör|range hood/.test(text)) return "generic-range-hood.png";
  if (/alttan isit.*masa|heated table/.test(text)) return "misc-heated-table.png";
  if (/camasir kurutucu|çamaşır kurutucu|clothes dryer/.test(text))
    return "generic-clothes-dryer.png";
  if (/havalandirma|havalandırma|ventilation|hvac/.test(text)) return "generic-ventilation.png";
  if (/isitma|ısıtma/.test(text)) return "generic-heater.png";
  if (/robot.*supurge|akilli robot|vacuum|supurge/.test(text)) return "generic-robot-vacuum.png";
  if (/robot pool cleaner|pool cleaner/.test(text)) return "generic-robot-vacuum.png";
  if (/mop|zemin|cam temizlik|window/.test(text)) return "generic-robot-vacuum.png";
  if (/aquarium pump|akvaryum pompasi|akvaryum pompa/.test(text)) return "misc-aquarium-pump.png";
  if (
    /pet feeder|evcil hayvan besleme|gida kovasi|gida kovası|balik besleyici|balık besleyici/.test(
      text,
    )
  )
    return "misc-pet-feeder.png";
  if (/evcil hayvan su sebili|pet water/.test(text)) return "misc-pet-fountain.png";
  if (/evcil hayvan tasmasi|evcil hayvan tasmasi|pet collar/.test(text))
    return "misc-pet-collar.png";
  if (/akvaryum coklu prizi|akvaryum çoklu prizi/.test(text)) return "generic-power-strip.png";
  if (/akvaryum/.test(text)) return "misc-aquarium.png";
  if (/kedi kumu/.test(text)) return "misc-litter-box.png";
  if (/evcil hayvan koku/.test(text)) return "misc-pet-odor-purifier.png";
  if (/evcil hayvan kurutma/.test(text)) return "misc-pet-dryer.png";
  if (/evcil hayvan topu/.test(text)) return "misc-pet-ball.png";
  if (/evcil hayvan cantasi|evcil hayvan çantasi|evcil hayvan çantası/.test(text))
    return "misc-pet-carrier.png";
  if (/evcil hayvan evi/.test(text)) return "misc-litter-box.png";
  if (/gogus pompasi|göğüs pompasi|göğüs pompası/.test(text)) return "misc-breast-pump.png";
  if (/sut makinesi|süt makinesi/.test(text)) return "misc-milk-maker.png";
  if (/biberon|sut isitic|süt isitic|süt ısıtıcı|sut isitici/.test(text))
    return "misc-bottle-warmer.png";
  if (/mama hazirlayici|mama hazırlayıcı/.test(text)) return "misc-formula-maker.png";
  if (/besik|beşik|bebek sandalyesi/.test(text)) return "misc-baby-cradle.png";
  if (/bebek bakim monitor|bebek bakım monitör/.test(text)) return "misc-baby-monitor.png";
  if (/bird feeder/.test(text)) return "security-bird-feeder.png";
  if (/kapi zili|doorbell|zil/.test(text)) return "security-video-doorbell.png";
  if (/nvr|dvr|kaydedici|recorder/.test(text)) return "security-nvr.png";
  if (/kamera|camera|video/.test(text)) {
    if (/(^|[^0-9.])4g\b|mobile|arac/.test(text)) return "security-4g-camera.png";
    if (/dis|outdoor/.test(text)) return "security-outdoor-camera.png";
    if (/ptz/.test(text)) return "security-ptz-camera.png";
    if (/lamba|flood/.test(text)) return "security-floodlight-camera.png";
    return "security-indoor-camera.png";
  }
  if (/kapi ve pencere|pencere sensor|door.*sensor/.test(text)) return "security-door-sensor.png";
  if (/turnike/.test(text)) return "security-turnstile.png";
  if (/kasa/.test(text)) return "security-safe-box.png";
  if (/anahtar kutusu/.test(text)) return "security-key-safe.png";
  if (/dolap kilidi/.test(text)) return "security-cabinet-lock.png";
  if (/asma kilit/.test(text)) return "security-padlock.png";
  if (/u tipi kilit/.test(text)) return "security-u-lock.png";
  if (/parmak|fingerprint/.test(text)) return "security-fingerprint-lock.png";
  if (/kapi|kilit|lock/.test(text)) return "security-keypad-lock.png";
  if (/gaz dedektor|gaz alarm/.test(text)) return "security-gas-detector.png";
  if (/duman|co dedektor|termal alarm|alarm/.test(text)) return "security-smoke-detector.png";
  if (/su basman|su sizinti|leak/.test(text)) return "security-water-leak.png";
  if (/sicaklik ve nem|nem sensor|temperature humidity/.test(text))
    return "generic-temp-humidity.png";
  if (/hava kalitesi|pm2\.5|voc|toprak|basinc/.test(text)) return "generic-air-quality.png";
  if (/sensor|dedektor|hareket|motion|varlik|vucudu|titreşim|titresim|acil/.test(text))
    return "generic-motion-sensor.png";
  if (/coklu priz|uzatma|power strip/.test(text)) return "generic-power-strip.png";
  if (/priz|soket|plug/.test(text)) return "generic-smart-plug.png";
  if (/acil durum dugmesi|emergency button/.test(text)) return "control-emergency-button.png";
  if (/senaryo anahtar|uyandirma anahtar/.test(text)) return "control-scenario-switch.png";
  if (/akilli buton|smart button/.test(text)) return "control-smart-button.png";
  if (/kablosuz anahtar/.test(text)) return "control-wireless-button.png";
  if (/dimmer/.test(text)) return "control-dimmer-knob.png";
  if (/perde anahtar|curtain switch/.test(text)) return "control-curtain-switch.png";
  if (/perde|curtain|motor/.test(text)) return "control-curtain-motor.png";
  if (/garaj/.test(text)) return "control-garage-controller.png";
  if (/evrensel kumanda|uzaktan kumanda|remote|kumanda/.test(text))
    return "control-remote-control.png";
  if (/ir blaster|(^|[^a-z])ir([^a-z]|$)/.test(text)) return "control-ir-blaster.png";
  if (/thermostat switch/.test(text)) return "control-thermostat-switch.png";
  if (/dokunmatik anahtar|touch switch/.test(text)) return "control-touch-switch.png";
  if (/4 cikis|4 çıkış|dort|dört/.test(text) && /anahtar|switch/.test(text))
    return "control-four-gang-switch.png";
  if (/3 cikis|3 çıkış|uclu|üçlü/.test(text) && /anahtar|switch/.test(text))
    return "control-triple-wall-switch.png";
  if (/2 cikis|2 çıkış|cift|çift|ikili/.test(text) && /anahtar|switch/.test(text))
    return "control-double-wall-switch.png";
  if (/anahtar|switch/.test(text)) return "control-single-wall-switch.png";
  if (/serit|strip|ambiyans|tv ortam/.test(text)) return "generic-led-strip.png";
  if (/tavan|ceiling|oda isik/.test(text)) return "generic-ceiling-light.png";
  if (/masa|mum|retro/.test(text)) return "generic-table-lamp.png";
  if (/dis mekan|bahce|cim|avlu|string light|spot/.test(text)) return "generic-outdoor-light.png";
  if (/bitki buyutme isigi|bitki buyutme ışığı|grow light/.test(text)) return "agri-grow-light.png";
  if (/lamba|ampul|isik|led|aydinlatma/.test(text)) return "generic-led-bulb.png";
  if (/meteoroloji saati|weather/.test(text)) return "misc-weather-clock.png";
  if (/ayakkabi steril|ayakkabı steril/.test(text)) return "misc-shoe-sterilizer.png";
  if (/ayakkabi kutusu|ayakkabı kutusu/.test(text)) return "misc-shoe-box.png";
  if (/giysi bakim|giysi bakım/.test(text)) return "misc-garment-care.png";
  if (/sinek|mosquito/.test(text)) return "misc-mosquito-lamp.png";
  if (/buz makinesi/.test(text)) return "misc-ice-maker.png";
  if (/dondurma/.test(text)) return "misc-ice-cream-maker.png";
  if (/ekmek/.test(text)) return "misc-bread-maker.png";
  if (/cop|çöp/.test(text)) return "misc-trash-can.png";
  if (/termostat|thermostat|trv|hvac/.test(text)) return "generic-thermostat-c.png";
  if (/klima|air conditioner/.test(text)) return "generic-air-conditioner.png";
  if (/hava temiz|purifier|sterilizator|nem alma|hava kutusu/.test(text))
    return "generic-air-purifier.png";
  if (/nemlendirici|humidifier/.test(text)) return "generic-humidifier.png";
  if (/fan|vantilator/.test(text)) return "generic-fan.png";
  if (/isik pompa|isi pompa|soba|isitic|kalorifer|battaniye|somine|heater|kombi/.test(text))
    return "generic-heater.png";
  if (/buzdolabi|refrigerator|fridge|sarap dolabi/.test(text)) return "generic-refrigerator.png";
  if (/camasir makinesi|washing/.test(text)) return "generic-washing-machine.png";
  if (/bulasik|dishwasher/.test(text)) return "generic-dishwasher.png";
  if (/mikrodalga|microwave/.test(text)) return "generic-microwave.png";
  if (/firin|oven|fritoz|ocak|pisirme|davlumbaz|entegre mutfak/.test(text))
    return "generic-oven.png";
  if (/kahve|coffee/.test(text)) return "generic-coffee-maker.png";
  if (/kettle|cay|su isitic/.test(text)) return "generic-kettle.png";
  if (/soya sutu|soya sütü/.test(text)) return "misc-milk-maker.png";
  if (/blender|robotu|sikacagi|presi|meyve|sebze yikama|sebze yıkama/.test(text))
    return "generic-blender.png";
  if (/mutfak terazisi|hassas/.test(text)) return "generic-kitchen-scale.png";
  if (/gida termometresi|food thermometer/.test(text)) return "misc-food-thermometer.png";
  if (/su aritma|water purifier/.test(text)) return "generic-water-purifier.png";
  if (/grafik yazici|grafik yazıcı|photo printer/.test(text)) return "ent-photo-printer.png";
  if (/3d yazici|3d yazıcı/.test(text)) return "ent-3d-printer.png";
  if (/earphone|kulaklik|kulaklık/.test(text)) return "ent-earbuds.png";
  if (/dot matrix|12x48|5x36/.test(text)) return "ent-dot-matrix-display.png";
  if (/hikaye makinesi|story/.test(text)) return "ent-story-speaker.png";
  if (/kitap okuyucu|reader/.test(text)) return "ent-ereader.png";
  if (/amplifier/.test(text)) return "ent-amplifier.png";
  if (/bulut fotograf|fotoğraf çerçevesi|photo frame|cerceve/.test(text))
    return "ent-photo-frame.png";
  if (/tv|televizyon|ekran|cerceve/.test(text)) return "generic-smart-tv.png";
  if (/hoparlor|speaker|soundbar|audio|earphone|amplifier|ses/.test(text))
    return "generic-smart-speaker.png";
  if (/projeksiyon|projektor/.test(text)) return "generic-projector.png";
  if (/router|yonlendirici|menzil/.test(text)) return "generic-range-extender.png";
  if (/energy mate/.test(text)) return "energy-mate-display.png";
  if (/inverter|invertor/.test(text)) return "energy-inverter.png";
  if (/transformator|transformatör/.test(text)) return "energy-transformer.png";
  if (/devre kesici|breaker/.test(text)) return "energy-circuit-breaker.png";
  if (/iki tekerlekli.*sarj|iki tekerlekli.*şarj/.test(text)) return "energy-two-wheel-charger.png";
  if (/ev sarj|ev charger|sarj istasyonu|şarj istasyonu/.test(text))
    return "generic-ev-charger.png";
  if (/guc istasyonu|portable power/.test(text)) return "generic-power-station.png";
  if (/su sayac/.test(text)) return "generic-water-meter.png";
  if (/gaz sayac|gaz sayaç/.test(text)) return "energy-gas-meter.png";
  if (/saya|meter|enerji|devre kesici|breaker|inverter|transformator/.test(text))
    return "generic-energy-meter.png";
  if (/solar|gunes/.test(text)) return "generic-solar-panel.png";
  if (/gps vehicle tracker|izleyici|tracker|hirsiz|hırsız/.test(text))
    return "outdoor-gps-tracker.png";
  if (/arac ici kamera|araç içi kamera/.test(text)) return "outdoor-dash-camera.png";
  if (/electric bicycle|elektrikli bisiklet/.test(text)) return "outdoor-electric-bike.png";
  if (/helmet/.test(text)) return "outdoor-helmet.png";
  if (/hava kompresoru|hava kompresörü/.test(text)) return "outdoor-air-compressor.png";
  if (
    /scooter|kaykay|hoverboard|akilli elektrikli arac|akıllı elektrikli araç|tekerlekli/.test(text)
  )
    return "generic-scooter.png";
  if (/kosu|treadmill|kondisyon/.test(text)) return "generic-treadmill.png";
  if (/kan basinci|tansiyon|blood|oksimetre|ates/.test(text)) return "generic-blood-pressure.png";
  if (/tarti|scale|baskul/.test(text)) return "generic-smart-scale.png";
  if (/ip atlama/.test(text)) return "sport-jump-rope.png";
  if (/halter/.test(text)) return "sport-dumbbell.png";
  if (/badminton|tenis raketi/.test(text)) return "sport-badminton-racket.png";
  if (/hula hoop|cember|çember/.test(text)) return "sport-hula-hoop.png";
  if (/direnc bandi|direnç bandı|resistance band/.test(text)) return "sport-resistance-band.png";
  if (/bilek guclendirme|bilek güçlendirme|wrist/.test(text)) return "sport-wrist-ball-v3.png";
  if (/egzersiz tekerlegi|egzersiz tekerleği/.test(text)) return "sport-exercise-wheel.png";
  if (/kurek cekme|kürek çekme/.test(text)) return "sport-rowing-machine.png";
  if (/saat\/bileklik|bileklik|uyku izleme band/.test(text)) return "health-smart-band.png";
  if (/uyku butonu/.test(text)) return "health-sleep-button.png";
  if (/calar saat|çalar saat/.test(text)) return "health-alarm-clock.png";
  if (/beyaz dinlenme/.test(text)) return "health-sleep-light.png";
  if (/akilli yastik|akıllı yastık/.test(text)) return "health-smart-pillow.png";
  if (/akilli yatak|akıllı yatak/.test(text)) return "health-smart-bed.png";
  if (/ayak kuveti|ayak küveti|foot spa/.test(text)) return "health-foot-spa.png";
  if (/akilli kanepe|akıllı kanepe|smart sofa/.test(text)) return "health-smart-sofa.png";
  if (/egzersiz aynasi|egzersiz aynası|fitness mirror/.test(text))
    return "health-fitness-mirror.png";
  if (/fizyoterapi|physio/.test(text)) return "health-physio-device.png";
  if (/akilli bardak|akıllı bardak|smart cup/.test(text)) return "misc-smart-cup.png";
  if (/yuz temizleyici|yüz temizleyici/.test(text)) return "health-face-cleanser.png";
  if (/yuz buhar|yüz buhar/.test(text)) return "health-facial-steamer.png";
  if (/sac kurutma|saç kurutma/.test(text)) return "health-hair-dryer.png";
  if (/dis fircasi|diş fırçası|toothbrush/.test(text)) return "health-toothbrush-v2.png";
  if (/bitki izleyici/.test(text)) return "agri-plant-monitor.png";
  if (/sulama fiskiye|sulama fiskiyesi/.test(text)) return "agri-irrigation-sprinkler.png";
  if (/su vanasi|su vanası/.test(text)) return "agri-water-valve.png";
  if (/smart door|smart gating/.test(text)) return "security-gate-opener.png";
  if (/mini lift/.test(text)) return "misc-mini-lift.png";
  if (/konnektor|connector/.test(text)) return "generic-power-strip.png";
  if (/ag gecidi|gateway|zigbee|hub|kopru|kontrol paneli/.test(text))
    return "generic-smart-hub.png";
  return "generic-smart-hub.png";
}

// Aynı işleve sahip ürünler aynı görseli kullanır (ör. 2/3/4 çıkışlı ve dokunmatik anahtarlar
// tek duvar anahtarı görseli); cihaz özellikleri kontrol panelinde yeteneklere göre gösterilir.
var CATALOG_FUNCTION_IMAGE = {
  "control-double-wall-switch.png": "control-single-wall-switch.png",
  "control-triple-wall-switch.png": "control-single-wall-switch.png",
  "control-four-gang-switch.png": "control-single-wall-switch.png",
  "control-touch-switch.png": "control-single-wall-switch.png",
  "security-motion-sensor.png": "generic-motion-sensor.png",
};
function catalogFunctionImage(file) {
  return CATALOG_FUNCTION_IMAGE[file] || file;
}

function catalogTileHtml(item, groupTitle) {
  var safe = escapeCatalogHtml(item.n);
  var display = escapeCatalogHtml(catalogDisplayName(item.n));
  var safeGroup = escapeCatalogHtml(groupTitle || "Genel");
  // Yalnızca kategoriye özel gerçek ürün fotoğrafları (assets/products/<kategori>-*.png) doğrudan kullanılır.
  // Eski genel görseller (smart_hub.jpg, light-switch.jpg vb.) 200+ üründe aynı fotoğrafı gösteriyordu;
  // onların yerine ürün adına göre en uygun gerçek ürün fotoğrafı seçilir.
  // Görsel ürünün İŞLEVİNE göre seçilir (ürün adı + grup); katalogdaki "img" alanı yalnızca işlev
  // çıkarılamazsa kullanılır. "generic-smart-hub.png" katalogda yer tutucudur, doğrudan kullanılmaz.
  var image = catalogFunctionImage(inferCatalogImage(item, groupTitle));
  if (
    image === "generic-smart-hub.png" &&
    item.img &&
    item.img !== "generic-smart-hub.png" &&
    /^(generic|control|security|energy|ent|health|misc|outdoor|sport|agri)-[a-z0-9-]+\.png$/i.test(
      item.img,
    )
  ) {
    image = catalogFunctionImage(item.img);
  }
  var imageVersion = "20261029-products-10";
  return (
    '<button type="button" class="product-tile product-card text-left active:scale-[0.98] transition-transform cursor-pointer group" onclick="searchAndPairDevice(this, \'' +
    safe +
    "')\">" +
    '<div class="product-image-stage">' +
    '<img src="assets/products/' +
    image +
    "?v=" +
    imageVersion +
    '" data-file="' +
    image +
    '" alt="' +
    safe +
    '" class="catalog-img object-contain transition-transform duration-300 group-active:scale-95" loading="lazy" onerror="this.onerror=null;this.src=&quot;assets/products/generic-smart-hub.png?v=' +
    imageVersion +
    '&quot;;" />' +
    "</div>" +
    '<div class="px-1 pt-1 flex min-h-[30px] flex-col items-center justify-start">' +
    '<span class="product-name">' +
    display +
    "</span>" +
    '<span class="product-category-pill">' +
    safeGroup +
    "</span>" +
    "</div>" +
    "</button>"
  );
}

function dedupeCatalogItems(items) {
  var seen = {};
  return (items || []).filter(function (item) {
    var key = normalizeCatalogText(catalogDisplayName(item.n || ""));
    if (!key) return false;
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function catalogGroupHtml(title, items) {
  var uniqueItems = dedupeCatalogItems(items);
  if (!uniqueItems.length) return "";
  return (
    '<div class="mb-9">' +
    '<p class="catalog-group-title">' +
    escapeCatalogHtml(title) +
    "</p>" +
    '<div class="product-grid">' +
    uniqueItems
      .map(function (item) {
        return catalogTileHtml(item, title);
      })
      .join("") +
    "</div>" +
    "</div>"
  );
}

// Yalnızca protokol desteği olan kategoriler gösterilir.
// Tam katalog (CATALOG) silinmez, ileride yeni protokoller eklendiğinde kullanılmak üzere korunur.
var SUPPORTED_CATEGORY_KEYS = [
  "aydinlatma",
  "elektrik-ustasi",
  "sensor",
  "enerji-tasarrufu",
  "ag-gecidi-kontrol-paneli",
];

// Ürün düzeyinde destek: yalnızca desteklenen bir modelle aynı işlevi gören ürünler gösterilir
// (nexusIsSupported, supported-devices.js). Matrise model eklenince ilgili ürünler kendiliğinden görünür.
function isCatalogItemSupported(item, groupTitle) {
  return typeof nexusIsSupported !== "function" || nexusIsSupported(item.n, groupTitle);
}

function getVisibleCatalog() {
  var out = [];
  CATALOG.forEach(function (c) {
    if (SUPPORTED_CATEGORY_KEYS.indexOf(c.key) === -1) return;
    var groups = [];
    c.groups.forEach(function (g) {
      var items = g.items.filter(function (it) {
        return isCatalogItemSupported(it, g.title);
      });
      if (items.length) groups.push({ title: g.title, items: items });
    });
    if (groups.length) out.push({ key: c.key, label: c.label, groups: groups });
  });
  return out;
}

function renderCatalogRail() {
  var rail = document.getElementById("catalog-rail");
  if (!rail) return;
  var list = getVisibleCatalog();
  rail.innerHTML = list
    .map(function (c) {
      var cls = c.key === activeCatalogCategory ? "cat-btn cat-active" : "cat-btn cat-inactive";
      return (
        '<button type="button" onclick="selectCatalogCategory(\'' +
        c.key +
        '\')" class="' +
        cls +
        ' w-full text-left py-3.5 px-3">' +
        '<span class="cat-text text-[13px] block">' +
        escapeCatalogHtml(c.label) +
        "</span></button>"
      );
    })
    .join("");
}

function renderCatalogContent() {
  var content = document.getElementById("catalog-content");
  if (!content) return;
  var query = normalizeCatalogText(
    ((document.getElementById("catalog-search") || {}).value || "").trim(),
  );
  var list = getVisibleCatalog();

  if (query) {
    var matches = [];
    list.forEach(function (c) {
      c.groups.forEach(function (g) {
        g.items.forEach(function (it) {
          if (normalizeCatalogText(it.n).indexOf(query) !== -1) matches.push(it);
        });
      });
    });
    matches = dedupeCatalogItems(matches);
    content.innerHTML = matches.length
      ? catalogGroupHtml("Arama Sonuçları", matches)
      : '<div class="px-6 py-16 text-center"><p class="text-sm font-medium text-slate-500 dark:text-slate-300">Aramanla eşleşen cihaz bulunamadı.</p></div>';
    content.scrollTop = 0;
    return;
  }

  if (activeCatalogCategory === "all") {
    content.innerHTML = list
      .map(function (c) {
        return (
          '<section class="mb-10">' +
          '<h2 class="catalog-heading mb-4 text-lg font-black text-slate-900">' +
          escapeCatalogHtml(c.label) +
          "</h2>" +
          c.groups
            .map(function (g) {
              return catalogGroupHtml(g.title, g.items);
            })
            .join("") +
          "</section>"
        );
      })
      .join("");
    content.scrollTop = 0;
    return;
  }

  var cat =
    list.filter(function (c) {
      return c.key === activeCatalogCategory;
    })[0] || list[0];
  content.innerHTML = cat
    ? cat.groups
        .map(function (g) {
          return catalogGroupHtml(g.title, g.items);
        })
        .join("")
    : "";
  content.scrollTop = 0;
}

function selectCatalogCategory(key) {
  activeCatalogCategory = key;
  var searchEl = document.getElementById("catalog-search");
  if (searchEl) searchEl.value = "";
  renderCatalogRail();
  renderCatalogContent();
}

function openCodeModal() {
  window.location.href = "nexus-setup-code.html";
}

function closeCodeModal() {
  const modal = document.getElementById("code-modal");
  const content = document.getElementById("code-modal-content");
  content.classList.remove("scale-100");
  content.classList.add("scale-95");
  setTimeout(() => {
    modal.classList.add("hidden");
    document.getElementById("setup-code-input").value = "";
  }, 200);
}

function submitCode() {
  const input = document.getElementById("setup-code-input").value;
  if (input.length < 4) {
    showIntegrationsToast("Lütfen geçerli bir kod girin.");
    return;
  }
  closeCodeModal();
  setTimeout(() => {
    window.location.href = "nexus-setup-code.html";
  }, 150);
}

// Cihaza özel tarama: seçilen ürünü ağda arar (aynı protokol / aynı tür), bulursa gerçek adresiyle ekler.
// Bulamazsa kullanıcı onaylarsa cihaz yine de ürün görseliyle eklenir.
var _search = null;

function catalogKindOf(caps) {
  caps = caps || [];
  if (caps.indexOf("brightness") !== -1 || caps.indexOf("color") !== -1) return "light";
  if (caps.indexOf("energy") !== -1) return "plug";
  if (caps.indexOf("switch") !== -1) return "switch";
  return "";
}

function catalogMatches(info, resolved, name) {
  if (!info) return false;
  if (info.kind === "bridge") return !!resolved.protocol && resolved.protocol === info.protocol;
  if (resolved.protocol && resolved.protocol !== "unknown")
    return resolved.protocol === info.protocol;
  var want = catalogKindOf(resolved.caps);
  var label =
    String(info.name || "").toLocaleLowerCase("tr-TR") +
    " " +
    String(info.model || "").toLocaleLowerCase("tr-TR");
  var tokens = String(name || "")
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .filter(function (t) {
      return t.length > 3;
    });
  if (
    tokens.some(function (t) {
      return label.indexOf(t) !== -1;
    })
  )
    return true;
  return !!want && info.kind === want;
}

function makePairedEntry(s, found) {
  // Katalogdan eklenen cihaz henüz gerçekten bağlanmadı; bağlantı (host) yoksa "bağlı" denmez.
  const entry = {
    id: "catalog-" + encodeURIComponent(s.safeName),
    name: s.safeName,
    icon: "cpu",
    room: "Katalog · bağlı değil",
  };
  entry.protocol = s.resolved.protocol;
  entry.brand = s.resolved.brand;
  entry.caps = s.resolved.caps;
  entry.img = s.resolved.img;
  if (s.tileFile) entry.img = s.tileFile;
  if (found) {
    const host = /^https?:\/\//.test(found.host) ? found.host : "http://" + found.host;
    entry.id = ("lan-" + host).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    entry.host = host;
    entry.protocol = found.protocol;
    entry.kind = found.kind;
    entry.model = found.model;
    entry.endpointId = found.endpointId != null ? found.endpointId : 0;
    entry.entity = found.entity || null;
    if (found.caps) entry.caps = found.caps;
    entry.room = "Yerel ağ";
  }
  return entry;
}

function savePairedEntry(entry) {
  const paired = getPairedDevices();
  if (
    !paired.some(
      (d) =>
        d &&
        (d.name === entry.name || (entry.host && d.host === entry.host && d.name === entry.name)),
    )
  ) {
    paired.push(entry);
    nexusSetItem("nexusPairedDevices", JSON.stringify(paired));
    if (window.nexusCloud) window.nexusCloud.notifyLocalChange();
  }
}

function searchAndPairDevice(el, deviceName) {
  const safeName = (deviceName || "Yeni cihaz").trim();
  const groupTitle = nexusSrcText(el && el.querySelector(".product-category-pill"));
  const resolved =
    typeof nexusResolveDevice === "function"
      ? nexusResolveDevice(safeName, groupTitle)
      : { protocol: "unknown", brand: "", caps: ["other"], img: "generic-smart-hub.png" };
  const tileImg = el && el.querySelector("img");
  const tileFile = tileImg ? tileImg.getAttribute("data-file") || "" : "";
  const s = {
    safeName: safeName,
    resolved: resolved,
    tileFile: tileFile,
    stop: false,
    found: null,
    done: false,
  };
  if (_search) _search.stop = true;
  _search = s;

  const overlay = document.getElementById("loading-overlay");
  overlay.style.display = "flex";
  document.getElementById("loading-spinner").classList.remove("hidden");
  document.getElementById("loading-notfound").classList.add("hidden");
  document.getElementById("loading-notfound").classList.remove("flex");
  document.getElementById("loading-title").textContent = safeName + " aranıyor…";
  document.getElementById("loading-sub").textContent =
    "Wi-Fi ağındaki cihazlar taranıyor. Cihazın açık olduğundan emin ol.";

  const finishSearch = function () {
    if (s.done || _search !== s) return;
    s.done = true;
    if (s.found) {
      // Köprüler (Hue, Home Assistant) kullanıcı onayı gerektirir: eşleştirme ekranı devralır.
      if (s.found.kind === "bridge") {
        window.location.href =
          "nexus-pair.html?host=" +
          encodeURIComponent(String(s.found.host).replace(/^https?:\/\//, ""));
        return;
      }
      savePairedEntry(makePairedEntry(s, s.found));
      navigateAfterPair();
      return;
    }
    if (s.cancelled) return;
    document.getElementById("loading-spinner").classList.add("hidden");
    const nf = document.getElementById("loading-notfound");
    nf.classList.remove("hidden");
    nf.classList.add("flex");
    if (window.lucide) lucide.createIcons();
  };

  if (!window.nexusLan || !window.nexusLan.autoScan) {
    setTimeout(finishSearch, 600);
    return;
  }
  const taken = {};
  getPairedDevices().forEach(function (d) {
    if (d && d.host) taken[d.host] = 1;
  });
  const limit = setTimeout(function () {
    s.stop = true;
  }, 25000);
  window.nexusLan
    .autoScan({
      shouldStop: function () {
        return s.stop;
      },
      onFound: function (info) {
        const host = /^https?:\/\//.test(info.host) ? info.host : "http://" + info.host;
        if (!s.found && !taken[host] && catalogMatches(info, resolved, safeName)) {
          s.found = info;
          s.stop = true;
        }
      },
    })
    .catch(function () {})
    .then(function () {
      clearTimeout(limit);
      finishSearch();
    });
}

function cancelDeviceSearch() {
  if (_search) {
    _search.stop = true;
    _search.cancelled = true;
    _search.done = true;
  }
  hideOverlay();
}

function hideOverlay() {
  if (_search) _search.stop = true;
  document.getElementById("loading-overlay").style.display = "none";
}

function getPairedDevices() {
  let devices = [];
  try {
    devices = JSON.parse(nexusGetItem("nexusPairedDevices") || "[]");
  } catch (error) {}
  return Array.isArray(devices) ? devices : [];
}

function navigateAfterPair() {
  const target = "nexus-home.html";
  if (window.top && window.top !== window) {
    window.top.location.href = target;
    return;
  }
  window.location.href = target;
}

var _catalogSearchEl = document.getElementById("catalog-search");
if (_catalogSearchEl) {
  _catalogSearchEl.addEventListener("input", renderCatalogContent);
}

(function initManualCatalog() {
  var params = new URLSearchParams(window.location.search);
  var requested = params.get("category");
  var mapped = requested ? CATALOG_ALIAS[requested] || requested : null;
  var visible = getVisibleCatalog();
  var valid = visible.some(function (c) {
    return c.key === mapped;
  });
  activeCatalogCategory =
    mapped === "all" || valid ? mapped : visible[0] ? visible[0].key : "aydinlatma";
  renderCatalogRail();
  renderCatalogContent();
})();
