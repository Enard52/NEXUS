const fs = require("fs");
let c = fs.readFileSync("packages/i18n/src/index.ts", "utf-8");

// Find TR catalog's setup.launchNow entry
const trStart = c.indexOf("  tr: {");
const trSetupLaunchNow = c.indexOf('"setup.launchNow"', trStart);
const lineEnd = c.indexOf("\n", trSetupLaunchNow);
const currentLine = c.substring(trSetupLaunchNow, lineEnd);
console.log("Found TR setup.launchNow:", currentLine);

// Insert new keys after it
const newKeys = `
    "setup.continue": "Devam Et",
    "setup.back": "Geri",
    "setup.cancel": "\u0130ptal",
    "setup.windowTitle": "NEXUS Kurulumu",
    "setup.titlebarText": "NEXUS AI Kurulumu",
    "setup.browseHint": "G\u00f6zat ileti\u015fim kutusu \u2014 yerel kabuk k\u00f6pr\u00fcs\u00fc ile entegre edin.",
    "setup.cancelConfirm": "Kurulumu iptal etmek istiyor musunuz?",
    "setup.completeAlert": "Kurulum tamamland\u0131. NEXUS AI ba\u015flat\u0131lmaya haz\u0131r.",
    "setup.bullet1": "Hafif arka plan servisi \u2014 bo\u015fta 50 MB RAM alt\u0131nda",
    "setup.bullet2": "Varsay\u0131lan olarak tamamen yerel \u2014 verileriniz cihaz\u0131n\u0131zdan asla ayr\u0131lmaz",
    "setup.bullet3": "Kutudan \u00e7\u0131kt\u0131\u011f\u0131 gibi 2.000+ ak\u0131ll\u0131 ev cihaz\u0131yla \u00e7al\u0131\u015f\u0131r",
    "setup.continueHint": "Devam etmek i\u00e7in <strong>Devam Et</strong> d\u00fc\u011fmesine t\u0131klay\u0131n.",
    "setup.licenseTitle": "Lisans S\u00f6zle\u015fmesi",
    "setup.licenseHint": "L\u00fctfen devam etmeden \u00f6nce a\u015fa\u011f\u0131daki lisans ko\u015fullar\u0131n\u0131 okuyun ve kabul edin.",
    "setup.licenseText": "NEXUS AI YAZILIM L\u0130SANS S\u00d6ZLE\u015eMES\u0130\\n\\nTelif Hakk\u0131 \u00a9 2024 NEXUS AI Teknolojileri. T\u00fcm haklar\u0131 sakl\u0131d\u0131r.\\n\\nL\u00dcTFEN YAZILIMI Y\u00dcKLEMEDEN VEYA KULLANMADAN \u00d6NCE BU L\u0130SANS S\u00d6ZLE\u015eMES\u0130N\u0130 D\u0130KKATLE OKUYUN.\\n\\n1. L\u0130SANS VER\u0130LMES\u0130. Bu S\u00f6zle\u015fmenin ko\u015fullar\u0131na tabi olarak size m\u00fcnhas\u0131r olmayan, devredilemez bir lisans verir.\\n\\n2. KISITLAMALAR. Yaz\u0131l\u0131m\u0131 kopyalayamaz, de\u011fi\u015ftiremez veya da\u011f\u0131tamazs\u0131n\u0131z.\\n\\n3. G\u0130ZL\u0130L\u0130K. Yaz\u0131l\u0131m \u00f6ncelikle cihaz \u00fczerinde \u00e7al\u0131\u015f\u0131r.\\n\\n4. FERAGAT. YAZILIM GARANT\u0130S\u0130Z SUNULUR.\\n\\n5. FESHETME. Bu lisans ihlal durumunda otomatik sona erer.",
    "setup.locationTitle": "Kurulum Konumu",
    "setup.locationDesc": "NEXUS AI uygulamas\u0131n\u0131n nereye y\u00fcklenece\u011fini se\u00e7in. \u00c7o\u011fu kullan\u0131c\u0131 i\u00e7in varsay\u0131lan konum \u00f6nerilir.",
    "setup.locationDescMac": "NEXUS AI uygulamas\u0131n\u0131n nereye y\u00fcklenece\u011fini se\u00e7in. macOS i\u00e7in /Applications klas\u00f6r\u00fc \u00f6nerilir.",
    "setup.browse": "G\u00f6zat\u2026",
    "setup.spaceInfo": "Gerekli alan: <strong>240 MB</strong> &nbsp;\u00b7&nbsp; Kullan\u0131labilir: <strong>48.2 GB</strong>",
    "setup.installingTitle": "NEXUS AI Y\u00fckleniyor",
    "setup.installingDesc": "NEXUS bilgisayar\u0131n\u0131za y\u00fcklenirken l\u00fctfen bekleyin.",
    "setup.installingStatus": "\u00c7ekirdek servisler y\u00fckleniyor\u2026",
    "setup.finishTitle": "NEXUS Haz\u0131r",
    "setup.finishDesc": "NEXUS AI ba\u015far\u0131yla kuruldu. <strong>Tamamla</strong> d\u00fc\u011fmesine t\u0131klay\u0131n.",`;

c = c.substring(0, lineEnd) + newKeys + c.substring(lineEnd);
fs.writeFileSync("packages/i18n/src/index.ts", c, "utf-8");
console.log("TR setup keys added successfully");
