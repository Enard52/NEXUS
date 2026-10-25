const fs = require("fs");
const path = require("path");

const markdownData = `
### 1. Elektrik Ustası
*   **Soket:** Akıllı Priz, Akıllı Priz (Bluetooth), Akıllı Priz (ZigBee), Akıllı Priz (Ağ Geçidi), Akıllı Priz (NB-IoT), Çoklu Priz, Çoklu Priz (Bluetooth), Çoklu Priz (Zigbee), Akıllı Çiftli Priz (BLE+Wi-Fi)
*   **Anahtar:** Anahtar, Anahtar (Bluetooth), Anahtar (ZigBee), Akıllı Anahtar (1 Çıkışlı), Akıllı Anahtar (2 Çıkışlı), Akıllı Anahtar (3 Çıkışlı), Akıllı Anahtar (4 Çıkışlı), Dokunmatik Anahtar (1 Çıkışlı), Dokunmatik Anahtar (2 Çıkışlı), Dokunmatik Anahtar (3 Çıkışlı), Dokunmatik Anahtar (4 Çıkışlı), Nötrsüz Anahtar (1 Çıkışlı), Nötrsüz Anahtar (2 Çıkışlı), Nötrsüz Anahtar (3 Çıkışlı), Nötrsüz Anahtar (4 Çıkışlı), Kablosuz Anahtar, Kablosuz Anahtar (1 Çıkışlı), Kablosuz Anahtar (2 Çıkışlı), Kablosuz Anahtar (3 Çıkışlı), Kablosuz Anahtar (4 Çıkışlı), Kablosuz Anahtar (6 Çıkışlı), Perde Anahtarı, Dimmer Anahtar, Dimmer Anahtar (Zigbee), Uyandırma Anahtarı, Akıllı Buton, Senaryo Anahtarı, Thermostat Switch, Işık ve Fan Anahtarı
*   **Diğer:** Garaj Kapısı Kumandası (Wi-Fi), Garaj Kapısı Kumandası (BLE)

### 2. Aydınlatma
*   **Işık Kaynağı:** Akıllı Lamba, Akıllı Lamba (Bluetooth), Akıllı Lamba (ZigBee), Işık Kaynağı (BLE+Wi-Fi), Retro Lamba, Retro Lamba (Bluetooth), Retro Lamba (ZigBee), Mum Lamba, Mum Lamba (Bluetooth), Mum Lamba (ZigBee), Spot Lamba, Spot Lamba (Bluetooth), Spot Lamba (ZigBee)
*   **Oda Işıkları:** Tavan Lambası, Tavan Lambası (Bluetooth), Tavan Lambası (ZigBee), Tavan Lambası (BLE+Wi-Fi), Tavan Vantilatörü Lambası, Masa Lambası, Masa Lambası (Bluetooth), Masa Lambası (ZigBee)
*   **Ambiyans Aydınlatması:** Şerit Lamba, Şerit Lamba (Bluetooth), Şerit Lamba (Zigbee), Şerit Lamba (BLE+Wi-Fi), Ambiyans Lambası, Ambiyans Lambası (Bluetooth), Ambiyans Lambası (Zigbee), Ambiyans Lambası (BLE+Wi-Fi), TV Ortam Işığı, Projektör
*   **Dış Mekan Aydınlatması:** Dış Mekan Aydınlatması, Dış Mekan Aydınlatması (BLE), Dış Mekan Aydınlatması (Zigbee), Güneş Enerjili Avlu Işığı, Bahçe Işığı, Çim Işığı, String Light
*   **Control Accessories:** Uzaktan Kumanda

### 3. Sensör
*   **Sensör:** Çok Fonksiyonlu Sensör, Sıcaklık ve Nem Sensörü, Sıcaklık ve Nem Sensörü (BLE), Sıcaklık ve Nem Sensörü (Zigbee), Aydınlatma Sensörü, Aydınlatma Sensörü (BLE), Aydınlatma Sensörü (Zigbee), Kapı ve Pencere Sensörü, Kapı ve Pencere Sensörü (Bluetooth), Kapı ve Pencere Sensörü (ZigBee), İnsan Vücudu Sensörü, İnsan Vücudu Sensörü (Bluetooth), İnsan Vücudu Sensörü (ZigBee), İnsan Varlığı Sensörü, İnsan Varlığı Sensörü (Bluetooth), Su Basman Sensörü, Su Basman Sensörü (Bluetooth), Su Basman Sensörü (ZigBee), Duman Dedektörü, Duman Dedektörü (Bluetooth), Duman Dedektörü (ZigBee), Gaz Dedektörü, Gaz Dedektörü (Bluetooth), Gaz Dedektörü (ZigBee), CO Dedektörü, Titreşim Sensörü, Titreşim Sensörü (Bluetooth), Titreşim Sensörü (ZigBee), Acil Durum Düğmesi, Acil Durum Düğmesi (Bluetooth), Acil Durum Düğmesi (Zigbee)
*   **Çevresel Sensörler:** Hava Kalitesi Sensörü, PM2.5, Toprak Sensörü
*   **basınç sensörü:** Basınç Sensörü, Basınç Sensörü (NB-IoT), Basınç Sensörü (Gateway)
*   **VOC:** Uçucu Organik Bileşik (VOC) Alarmı (Gateway)
*   **Termal alarm:** Termal Alarm, Termal Alarm (Gateway)

### 4. Büyük Ev Aletleri
*   **Klima:** Taşınabilir Klima, Taşınabilir Klima (Bluetooth), Klima, Duvar Tipi Klima, Ayaklı Klima, Pencere Tipi Klima
*   **Su Isıtıcıları:** Su Isıtıcısı, Hava Kaynaklı Su Isıtıcısı, Elektrikli Su Isıtıcısı, Su Isıtıcısı (Kazan Tipi), Hot Water Crculation Pump
*   **Kombiler:** Kombi
*   **Isı Pompaları:** Akıllı Isı Pompası
*   **Çamaşır Makineleri:** Çamaşır Makinesi
*   **Çamaşır Kurutma:** Çamaşır Kurutucu

### 5. Küçük Ev Aleti
*   **Mevsimlik Neutron Ürünler:** Elektirikli Soba, Elektirikli Soba (Gateway), Kalorifer Peteği, Elektrikli Battaniye, Elektrikli Şömine, Süpürgelik Tipi Elektirikli Soba, Alttan Isıtmalı Masa, Fan, Klima Fanı
*   **çevre:** Hava Temizleyici, Nemlendirici, Hava Nemlendirici, Sterilizatör, Nem Alma Cihazı, Hava Kutusu
*   **Temizlik Ürünleri:** Akıllı Robot Süpürge, Akıllı Robot Süpürge (2.4GHz&5GHz), Akıllı Robot Süpürge (Kamera), Cam Temizlik Robotu, Çim Biçme Makinesi, Elektrikli Süpürge, Robot pool cleaner
*   **İklimlendirme:** Termostat, Termostat (Gateway), Havalandırma Sistemi, Havalandırma Sistemi (Gateway), Termostatik Radyatör Vanası (TRV) (Gateway), Isıtma, Havalandırma ve İklimlendirme (HVAC), Termostatik Radyatör Vanası (TRV)
*   **Motor:** Perde, Perde (Gateway), Perde Zincir Motoru, Perde Motoru (Gateway), Çamaşır Kurutma Askısı, Çamaşır Kurutma Askısı (Gateway), Akıllı Kapı Pencere Sensörü
*   **Genel / Diğer:** Evcil Hayvan Tasması, Akvaryum, Balık Besleyici, Akvaryum Isıtıcı, Aquarium Pump, Mikrodalga Fırın, Akıllı Bitki Büyütme Işığı, Ayakkabı Sterilizatör Dolabı, Ayakkabı Kutusu, Giysi Bakım Makinesi, Elektrikli Sinek Öldürücü, Meteoroloji Saati
*   **Bebek Ürünleri:** Göğüs Pompası, Süt Makinesi, Biberon Isıtıcı, Akıllı Süt Isıtıcısı, Mama Hazırlayıcı, Sterilizatör Çelik Tencere, Sallanan Bebek Sandalyesi, Beşik
*   **Evcil Hayvan Ürünleri:** Akıllı Evcil Hayvan Besleme, Pet Feeder (2.4GHz&5GHz), Pet Feeder With Camera (2.4GHz&5GHz), Akıllı Evcil Hayvan Besleme (Kameralı), Evcil Hayvan Gıda Kovası, Evcil Hayvan Su Sebili, Kedi Kumu Kutusu, Evcil Hayvan Koku Giderici, Evcil Hayvan Kurutma Makinesi, Evcil Hayvan Topu, Evcil Hayvan Evi, Akvaryum Çoklu Prizi, Evcil Hayvan Çantası

### 6. Mutfak Aletleri
*   **Kitchen Electric:** Oven, Entegre Mutfak, Fırın, Gazlı Soba, Sterilizatör Kabini, Bulaşık Makinesi, Davlumbaz&Aspiratör, Buharlı Fırın
*   **Kitchen Small Electric:** Meyve Kurutma Makinesi, Buz Makinesi, Sıcak Hava Fritözü, Dondurma Makinesi, Yemek Pişirme Makinesi, Elektrikli Ocak, Pilav Pişirme Makinesi, Soya Sütü Makinesi, Mutfak Robotu, Ekmek Yapma Makinesi, Vakumlu Pişirme Makinesi, Katı Meyve Presi ve Blender, Meyve Sıkacağı
*   **Pişirme Ekipmanları:** Su Arıtma Cihazı, Su Arıtma Cihazı (Gateway), Çay Demleme Tezgahı, Smart Kettle, Kahve Makinesi
*   **Diğer:** Gıda Termometresi, Sebze Yıkama Makinesi, Şarap Dolabı, Çöp Öğütücü, Akıllı Çöp Tenekesi

### 7. Egzersiz ve Sağlık
*   **Spor Ekipmanları:** Hassas Mutfak Terazisi, Elektronik Akıllı Tartı, Akıllı İp Atlama, Akıllı Halter, Akıllı Badminton Raketi, Egzersiz Tekerleği, Tenis Raketi, Hula Hoop Çember, Direnç Bandı, Akıllı Bilek Güçlendirme Topu, Koşu Bandı, Kürek Çekme Aleti, Dikey Kondisyon Bisikleti
*   **Spor Test Ürünleri:** Saat/Bileklik, Temassız Ateş Ölçer, Tansiyon Aleti, Oksimetre
*   **Sleep:** Uyku Butonu, Akıllı Çalar Saat, Beyaz Dinlenme Işığı, Uyku İzleme Bandı, Akıllı Yastık, Akıllı Yatak, Akıllı Yatak (Gateway), Akıllı Bebek Bakım Monitörü
*   **Kişisel Bakım:** Diş Fırçası, Kulak Kiri Çıkarma Otoskopu (Kameralı), Akıllı Yüz Temizleyici, Yüz Buhar Makinesi, Saç kurutma makinesi
*   **Diğer:** Masaj Koltuğu, Ayak Küveti, Akıllı Kanepe, Akıllı Egzersiz Aynası, Fizyoterapi Cihazı, Akıllı Bardak

### 8. Kamera ve Kilit
*   **Kamera:** Akıllı Kamera (Wi-Fi), Akıllı Kamera (2.4GHz&5GHz), Akıllı Kamera (Bluetooth), Indoor PTZ Camera, PTZ Camera, 4G Kamera, Kameralı Kapı Zili, Akıllı Kapı Zili, Akıllı Kapı Zili (2.4GHz&5GHz), Kamera Lambası, Video Baz istasyonu (2.4GHz&5GHz), Ağ Video Kaydedici (NVR), Dijital Kayıt Cihazı (DVR), Bird Feeder, Mobile Camera
*   **Kapı kilidi:** Kapı Kilidi, Kapı Kilidi (Gateway), Kapı Kilidi (NB-IoT)
*   **Kameralı Kilitler:** Video Kilidi
*   **Kilit ve Aksesuarlar:** Dolap Kilidi, Asma Kilit, U Tipi Kilit, Anahtar Kutusu
*   **Akıllı kutu:** Kasa
*   **Giriş Kontrol Ürünleri:** Akıllı Turnike
*   **Smart Gating:** Smart Door, Smart Gating (Wi-Fi), Smart Gating (Bluetooth)

### 9. Ağ Geçidi Kontrol Paneli
*   **Ağ Geçidi:** Kablosuz Ağ Geçidi, Kablolu Ağ Geçidi, Çoklu Ağ Geçidi, Çok Fonksiyonlu Ağ Geçidi, Kablolu&Kablosuz Ağ Geçidi, Ağ Geçidi Prizi, Çok Modlu Ağ Geçidi (BLE+ZigBee), Çok Modlu Mühendislik Ağ Geçidi (BLE+ZigBee), Akıllı ZigBee Ağ Geçidi Pro, 4G çok modlu geçit (BLE+ZigBee), Birleşik Ağ Geçidi, Kablolu&Kablosuz Ağ Geçidi (ZigBee+PLC)
*   **Routerlar:** Yönlendirici
*   **Diğer:** Yoğunlaştırıcı (Gateway), Menzil Arttırıcı

### 10. Doğa Sporları
*   **Takip Cihazları:** GPS Vehicle Tracker (LTE Cat.1), Hırsız Alarmı (Bluetooth), Hırsız Alarmı (GPRS), İzleyici (NB-IoT), İzleyici (GPRS)
*   **Car-carried-devices:** Araç İçi Kamera (ekranlı) (Wi-Fi)
*   **4G Camera:** 4G Camera
*   **Travel:** Scooter, Elektrikli Kaykay (Hoverboard), Akıllı Elektrikli Araç (Bluetooth), Akıllı Elektrikli Araç (Bluetooth Tarama Kodu), Akıllı Elektrikli Araç (GPRS), Elektrikli Bisiklet (Bluetooth), Electric Bicycle (Cat.1), Akülü Tekerlekli Sandalye, Helmet, Hava Kompresörü

### 11. Enerji Tasarrufu
*   **Breaker:** Devre kesici, devre kesici (Gateway), Devre kesici (4G), Devre kesici (NB-IoT)
*   **Elektrik Sayaçları:** Akıllı Elektrik Sayacı (NB-IoT), Akıllı Elektrik Sayacı, Akıllı Elektrik Sayacı (Gateway), Akıllı Elektrik Sayacı (4G)
*   **Energy Mate:** Energy Mate
*   **Portable power supply:** Taşınabilir Güç İstasyonu
*   **Su Sayaçları:** Akıllı Su Sayacı, Akıllı Su Sayacı (Gateway), Akıllı Su Sayacı (NB-IoT), Akıllı Su Sayacı (4G), Akıllı Su Sayacı (GPRS)
*   **Bisiklet Şarj Üniteleri:** İki Tekerlekli Araç Şarj İstasyonu (4G), İki Tekerlekli Araç Şarj İstasyonu
*   **EV charger:** Elektrikli Araç Şarj İstasyonu (4G), Elektrikli Araç Şarj İstasyonu
*   **Akıllı Gaz Sayaçları:** Akıllı Gaz Sayacı, Akıllı Gaz Sayacı (Gateway), Akıllı Gaz Sayacı (4G), Akıllı Gaz Sayacı (NB-IoT)
*   **İnvertörler:** İnvertör
*   **Transformatörler:** Güç Transformatörleri

### 12. Eğlence
*   **Genel:** Televizyon, Bulut Fotoğraf Çerçevesi
*   **Printer:** Grafik yazıcı, 3D yazıcı
*   **Audio:** Earphone
*   **Dot Matrix Screen:** 12x48, 5x36
*   **Diğer:** Hikaye Makinesi, Kitap Okuyucu
*   **amplifier:** Amplifier

### 13. Sanayi ve Tarım
*   **çevre:** Bitki İzleyici
*   **Vana Kontrol Ekipmanları:** Su Vanası Kumandası, Su Vanası Kumandası (Gateway)
*   **sulama:** Sulama Fiskiyesi, Sulama Fiskiyesi (Gateway)

### 14. Diğer
*   **Diğer:** Konnektör, Evrensel Kumanda, Diğer, Diğer (NB-IoT), Diğer Cihazlar (Gateway), Akıllı Hoparlör, Mini Lift, Konferans Rezervasyon Ekranı
`;

// Helper to assign a logical image to an item
function getImageFor(itemName) {
  let lower = itemName.toLowerCase();

  if (lower.includes("priz") || lower.includes("soket") || lower.includes("fiş"))
    return "power-strip.png";
  if (lower.includes("anahtar") || lower.includes("düğme") || lower.includes("button"))
    return "switch.png";
  if (lower.includes("perde")) return "home-automation.png";

  if (
    lower.includes("lamba") ||
    lower.includes("ampul") ||
    lower.includes("ışık") ||
    lower.includes("light")
  )
    return "light.png";

  if (
    lower.includes("sensör") ||
    lower.includes("dedektör") ||
    lower.includes("detector") ||
    lower.includes("alarm")
  ) {
    if (lower.includes("kapı") || lower.includes("pencere")) return "door-sensor.png";
    if (lower.includes("su") || lower.includes("basman")) return "water.png";
    if (lower.includes("sıcaklık") || lower.includes("nem")) return "temperature.png";
    if (lower.includes("hava") || lower.includes("gaz")) return "air-quality.png";
    return "motion-detector.png";
  }

  if (lower.includes("klima") || lower.includes("termostat") || lower.includes("hvac"))
    return "air-conditioner.png";
  if (lower.includes("çamaşır")) return "washing-machine.png";
  if (lower.includes("komb") || lower.includes("ısıtıcı")) return "temperature-inside.png";

  if (lower.includes("süpürge") || lower.includes("paspas")) return "vacuum-cleaner.png";
  if (lower.includes("temizlik") || lower.includes("robot")) return "robot.png";

  if (lower.includes("fırın") || lower.includes("oven")) return "oven.jpg";
  if (lower.includes("mikrodalga")) return "microwave.jpg";
  if (lower.includes("kahve")) return "coffee_maker.jpg";
  if (lower.includes("kettle")) return "kettle.jpg";
  if (lower.includes("bulaşık")) return "dishwasher.png";
  if (lower.includes("su arıtma")) return "water_purifier.jpg";
  if (lower.includes("blender")) return "blender.jpg";
  if (lower.includes("mutfak") || lower.includes("yemek")) return "home-automation.png";

  if (lower.includes("tartı") || lower.includes("terazi") || lower.includes("baskül")) {
    if (lower.includes("mutfak")) return "kitchen_scale.jpg";
    return "smart_scale.jpg";
  }
  if (lower.includes("tansiyon")) return "blood_pressure.jpg";
  if (lower.includes("saat")) return "dashboard.png";
  if (lower.includes("koşu") || lower.includes("bisiklet")) return "treadmill.jpg";

  if (lower.includes("kamera") || lower.includes("camera") || lower.includes("ptz"))
    return "camera.png";
  if (lower.includes("kilit") || lower.includes("kasa") || lower.includes("turnike"))
    return "door-lock.png";
  if (lower.includes("zil") || lower.includes("doorbell")) return "doorbell.jpg";

  if (lower.includes("ağ geçidi") || lower.includes("gateway") || lower.includes("hub"))
    return "hub.png";
  if (lower.includes("yönlendirici") || lower.includes("router")) return "wifi-router.png";

  if (lower.includes("scooter") || lower.includes("kaykay") || lower.includes("tekerlek"))
    return "scooter.jpg";
  if (lower.includes("takip") || lower.includes("tracker") || lower.includes("izleyici"))
    return "panorama.png";

  if (lower.includes("sayacı") || lower.includes("meter") || lower.includes("ölçüm"))
    return "energy-meter.png";
  if (lower.includes("güneş") || lower.includes("solar")) return "solar-panel.png";

  if (lower.includes("televizyon") || lower.includes("tv")) return "tv.png";
  if (lower.includes("hoparlör") || lower.includes("ses") || lower.includes("audio"))
    return "speaker.png";
  if (lower.includes("projeksiyon")) return "projector.jpg";

  if (lower.includes("vana") || lower.includes("valve") || lower.includes("sulama"))
    return "water.png";

  return "home-automation.png"; // default fallback
}

let categories = [];
let currentCategory = null;

const lines = markdownData.split("\n");
for (const line of lines) {
  if (line.startsWith("### ")) {
    const titleText = line.replace("### ", "").trim();
    // format: 1. Elektrik Ustası
    const label = titleText.replace(/^\d+\.\s*/, "");
    const key = label.toLowerCase().replace(/[^a-z0-9]/gi, "-");
    currentCategory = { key, label, groups: [] };
    categories.push(currentCategory);
  } else if (line.startsWith("*   **")) {
    if (!currentCategory) continue;
    // format: *   **Soket:** Akıllı Priz, ...
    const match = line.match(/\*\s+\*\*(.*?):\*\*\s*(.*)/);
    if (match) {
      const groupTitle = match[1].trim();
      const itemsRaw = match[2]
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      const items = itemsRaw.map((itemName) => {
        return { n: itemName, img: getImageFor(itemName) };
      });
      currentCategory.groups.push({ title: groupTitle, items });
    }
  }
}

const catalogJsonStr = JSON.stringify(categories, null, 2);

const newCatalogCode = `    // ---- Tam 1:1 NEXUS Katalog Verisi (Tuya Referanslı) ----
    var CATALOG = ${catalogJsonStr};

    // pair.html gibi eski baglantilardan gelen ?category anahtarlarini eslestir
    var CATALOG_ALIAS = {
      lighting: 'aydinlatma', plugs: 'elektrik-ustasi', security: 'kamera-ve-kilit', locks: 'kamera-ve-kilit',
      climate: 'buyuk-ev-aletleri', sensors: 'sensor', entertainment: 'eglence', appliances: 'buyuk-ev-aletleri',
      hubs: 'ag-gecidi-kontrol-paneli', cleaning: 'kucuk-ev-aleti', energy: 'enerji-tasarrufu'
    };`;

const filepath = path.join(__dirname, "stitch-integrations.html");
let html = fs.readFileSync(filepath, "utf8");

const regex =
  /\/\/\s*----\s*(?:Genişletilmiş|Manuel).*?Katalog Verisi.*?var\s+CATALOG_ALIAS\s*=\s*\{.*?\};/s;

if (regex.test(html)) {
  html = html.replace(regex, newCatalogCode);
  fs.writeFileSync(filepath, html, "utf8");
  console.log("Successfully updated 1:1 CATALOG in stitch-integrations.html");
} else {
  console.log("Regex failed, could not update.");
}
