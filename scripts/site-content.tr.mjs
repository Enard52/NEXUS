import { RELEASES_URL } from "./site-constants.mjs";

export const tr = {
  lang: "tr",
  htmlLang: "tr",
  canonical: "/tr/",
  alternate: { en: "/", tr: "/tr/" },
  title: "NEXUS — Akıllı evin, kendi ağında, senin kontrolünde",
  ogImageAlt: "Masaüstü ve mobilde NEXUS akıllı ev ekosistemi",
  description:
    "NEXUS; Windows, macOS, Linux, Android ve iOS üzerinde çalışan yerel-öncelikli akıllı ev ekosistemi. Cihazlarınızla yerel ağınızda doğrudan iletişim, kesintisiz çalışan otomasyonlar ve anlık enerji ölçümleri. Ücretsiz; isteğe bağlı NEXUS+ yapay zekâ planı.",
  nav: [
    ["#features", "Özellikler"],
    ["#how", "Nasıl çalışır"],
    ["#integrations", "Entegrasyonlar"],
    ["#pricing", "Fiyatlar"],
    ["#downloads", "İndir"],
    ["#faq", "SSS"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Yerel-öncelikli akıllı ev",
    h1a: "Evini.",
    h1b: "Sessizce kontrol et.",
    lead: "Işıklarınız, iklimlendirmeniz, perdeleriniz ve sensörleriniz tek bir ekosistemde — bulut aracılarına ihtiyaç duymadan, doğrudan yerel ağınız üzerinden haberleşir. Kesintisiz otomasyonlar, canlı enerji ölçümleri ve internet kesilse de durmayan bir kontrol mimarisi.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Güncel sürüm",
    shotAlt: "NEXUS kontrol merkezi ve arayüzü",
    trust: [
      "Ücretsiz, sınırsız cihaz",
      "Kontrol için bulut şart değil",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Güçlü yerel altyapı. Zahmetsiz kontrol.",
    lead: "Tüm cihaz durumları, ölçümler ve senaryolar bulut sunucularına bağımlı olmadan doğrudan yerel ağınızda işlenir.",
    items: [
      [
        "zap",
        "Kesintisiz Yerel Otomasyonlar",
        "Saat ve gün batımı tetikleyicili senaryolar cihazlarınızda doğrudan yerel olarak yürütülür; masaüstünde arka planda sessizce çalışmaya devam eder.",
      ],
      [
        "gauge",
        "Canlı Enerji Ölçümleri",
        "Desteklenen akıllı priz ve anahtarlardan anlık watt ve güç tüketimi verilerini kendi yerel ağınız üzerinden gerçek zamanlı izleyin.",
      ],
      [
        "wifi",
        "Yerel Ağ Hızı",
        "Entegrasyonlar bölümündeki markalarla HTTP, TCP ve UDP üzerinden doğrudan yerel iletişim. Komut yolunda bulut yok.",
      ],
      [
        "lock",
        "Tasarımdan Gelen Gizlilik",
        "Ev düzenin ve cihaz verilerin yerel cihazında işlenir. NEXUS için hesap gerekir; senkron, kurulumunu satır bazlı erişim denetimi (RLS) korumalı kendi hesap satırına taşır. Cihaz komutları yine yerel ağında kalır.",
      ],
      [
        "sparkles",
        "NEXUS AI Asistanı",
        "Yerel akıllı ev komutları her zaman ücretsiz ve anında yanıt verir. İsteğe bağlı bulut yapay zekâsı ihtiyaç duyduğunuz her an yanınızda.",
      ],
      [
        "layers",
        "Açık Yerel Protokoller",
        "Doğrudan bağlayıcılar yerel ağında konuşur. Matter ve Zigbee kendi Home Assistant sunucun üzerinden katılır — hangisinin doğrudan olduğunu Entegrasyonlar listeler.",
      ],
    ],
  },
  how: {
    heading: "İndirmeden bağlanmaya dakikalar.",
    steps: [
      [
        "1",
        "Kur ve aç",
        "Platformuna uygun kurulum dosyasını indir (Windows, Linux veya Android). Sonra giriş yap: NEXUS için hesap gerekir; kurulumun da ekranlar arasında eşitlenir.",
      ],
      [
        "2",
        "Cihazlarını ekle",
        "Markanı seç, yerel ağı tara veya IP gir. Doğrudan bağlayıcısı olan markalar kendi protokolünde konuşur; o yolda üretici bulutu yok.",
      ],
      [
        "3",
        "Evinin tadını çıkar",
        "Sahneler, zamanlanmış otomasyonlar ve gerçek enerji okumaları — bilgisayarından ve telefonundan tümleşik kontrol.",
      ],
    ],
  },
  integrations: {
    heading: "Elindeki cihazlarla çalışır.",
    lead: "Önce ücretsiz, yerel protokoller. Doğrudan bağlayıcısı olmayan her şey Home Assistant köprüsüyle çalışır.",
    groups: [
      [
        "Yerel HTTP — her platformda",
        [
          "Shelly Gen1 & Gen2+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "Philips Hue köprüsü",
          "Home Assistant",
        ],
      ],
      [
        "Yerel ağ, hesap ya da anahtar gerekmez — masaüstü programında",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (DIY modu)", "Wake-on-LAN"],
      ],
    ],
    more: "Eksik bir şey mi var? Bağlayıcı iste",
    moreHref: "javascript:nxOpenContactModal('Cihaz & Bağlayıcı İsteği')",
  },
  pricing: {
    heading: "Ücretsiz kullan. Daha fazlasını istersen NEXUS+",
    lead: "",
    currencyNote: "Fiyatlar TL cinsinden",
    plans: [
      {
        name: "Ücretsiz",
        price: "₺0",
        period: "sonsuza dek",
        features: [
          "Sınırsız cihaz ve oda — desteklenen tüm yerel protokoller",
          "Sıfır bulut bağımlılığı: Kendi yerel ağınızda kesintisiz çalışma",
          "Günde 30 NEXUS AI komutu ve yerel cihaz kontrolü",
          "Zamanlanmış yerel otomasyonlar ve özel sahneler",
          "Çoklu cihaz hesap senkronizasyonu (odalar, cihazlar, sahneler)",
          "Tam gizlilik: Reklam izleyicisi ve veri ticareti yok",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "aylık",
        badge: "En çok tercih edilen",
        features: [
          "Ücretsiz plandaki tüm özelliklere ek olarak",
          "Günde 30 yerine ayda 2.000 NEXUS AI yanıtı",
          "NEXUS AI ile doğal dille senaryo kur ve evin hakkında soru sor",
          "Tek hesap, tüm NEXUS cihazlarında geçerli",
          "3 gün (aylık) / 7 gün (yıllık) deneme; dönem sonunda iptal",
        ],
        cta: {
          label: "Ücretsiz denemeyi başlat",
          monthlyLabel: "3 gün ücretsiz dene",
          yearlyLabel: "7 gün ücretsiz dene",
          href: "https://whop.com/checkout/plan_fAMBHwTVE0hR2",
          yearlyHref: "https://whop.com/checkout/plan_UEXO1F5mjIgWB",
        },
      },
      {
        name: "Aile",
        price: "Ücretsiz",
        period: "tüm aile için",
        badge: "Tüm ev için",
        features: [
          "Rol bazlı ev halkı yönetimi — üye sayısı sınırı yok",
          "Ev sahibi, üye ve misafir rolleri",
          "Üye başına kontrol, davet ve ayar yetkileri",
          "Sahneler ve otomasyonlar giriş yaptığın tüm cihazlarında senkron",
          "Tüm ekosistemde (masaüstü ve mobil) aktif",
          "Evinizle birlikte tamamen ücretsiz ve sınırsız",
        ],
        cta: { label: "Ailenle Başla", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "İptal; uygulamadaki Faturalandırma menüsünden veya bu sitedeki hesabınızdan dilediğiniz an tek tıkla yapılır. İptal, dönem sonunda geçerli olur.",
  },
  downloads: {
    heading: "Bilgisayarında yerel, telefonunda evinde.",
    lead: "Hepsi ücretsiz. Her kurulum dosyası, doğrulayabilmen için SHA-256 sağlama değeriyle birlikte sunulur.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64-bit", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian ve Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · imzalı APK",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Sürüm",
    sizeLabel: "Boyut",
    webCard: {
      title: "Tek hesap, tüm ekosisteminizde",
      desc: "Windows ve Linux masaüstü programı ve Android mobil uygulaması. Giriş yaptığınızda odalarınız, cihazlarınız, sahneleriniz ve otomasyonlarınız tüm ekranlarınızda eksiksiz senkronize olur.",
      cta: { label: "NEXUS'u İndir", href: "#downloads" },
    },
    smartScreenNote:
      "Windows için en kolay yol Microsoft Store: kurulum Microsoft tarafından imzalanır ve güncellemeler Store'dan gelir. Doğrudan .exe imzasızdır; Windows “bilinmeyen yayıncı” uyarısı verebilir — sağlama değerlerine bak.",
  },
  faq: {
    heading: "Önemli sorular, net yanıtlar.",
    items: [
      [
        "Verilerim ve ev kontrollerim gerçekten yerel mi çalışır?",
        "Evet. NEXUS, yerel-öncelikli (local-first) mimariyle çalışır. Cihazlarınız, odalarınız, otomasyonlarınız ve sensör verileriniz doğrudan kendi ev ağınızdaki donanımlarınız arasında işlenir. İnternet bağlantınız kesilse dahi tüm yerel anahtarlar, sahneler ve otomasyonlar anında çalışmaya devam eder. Giriş yaptığında ise kurulumun TLS ve satır bazlı erişim denetimi (RLS) altındaki kendi hesabına senkronize olur; kontrol için bu senkron zorunlu değildir.",
      ],
      [
        "NEXUS'ı tarayıcıdan kullanabilir miyim, yoksa program veya mobil uygulama kurmak şart mı?",
        "Masaüstü programını (Windows veya Linux) ya da Android uygulamasını kurman gerekir. NEXUS ayrı bir tarayıcı uygulaması olarak sunulmuyor. Cihaz komutları kendi yerel ağından gider. Shelly, Philips Hue, ESPHome, Tasmota, WLED ve Home Assistant yerel HTTP ile masaüstünde ve Android'de çalışır. TP-Link Kasa ve Yeelight ham TCP istediği için masaüstü programındadır. Bu site hesap, indirme ve faturalandırma içindir.",
      ],
      [
        "NEXUS+ aboneliği tam olarak ne sağlar?",
        "Temel akıllı ev yönetimi, sınırsız cihaz, oda ve yerel otomasyon ücretsizdir. NEXUS+ ücretsiz plandaki her şeyi, NEXUS AI ile doğal dille senaryo ve soruyu, ayda 2.000 yanıtı, Home Assistant, MQTT/Zigbee2MQTT, Tuya ve Tapo cihazı eklemeyi sağlayan gelişmiş bağlantıları ve tüm cihazlarında geçerli tek hesabı kapsar; aylıkta 3, yıllıkta 7 gün deneme vardır. Cihaz komutları yerelde çalışır. Ev halkı rolleri evinle birlikte ücretsizdir.",
      ],
      [
        "NEXUS+ aboneliğim hangi hesaba tanımlanır?",
        "Ödemede kullanılan e-posta adresine. Ödemeden önce bu sitede ya da uygulamada giriş yap: ödeme sayfası hesabının e-postasıyla dolu açılır ve abonelik giriş yaptığın her cihazda görünür. NEXUS+ hesap olmadan satın alınamaz. Başka bir e-postayla ödersen abonelik o e-postanın altında saklanır ve o e-postayla giriş yapana kadar hesabında görünmez.",
      ],
      [
        "Otomasyonlar ve zamanlanmış kurallar nasıl çalışır?",
        "NEXUS otomasyon motoru kurallarını ve zamanlayıcılarını NEXUS'u çalıştırdığın cihazda yürütür: masaüstü programı sistem tepsisinde arka planda kalarak gün boyu izler ve uygular, böylece aydınlatma, enerji ve güvenlik rutinleri bulutu beklemez. Telefondan tetiklediğin sahneler ve zamanlayıcılar yerel ağından anında uygulanır. Yeni olaylar, Anlık Bildirimler sayfasında açtığın kanallara dağıtılır: uygulama içi bildirim şeridi, sistem bildirimi, ntfy, Telegram veya kendi HTTPS webhook'un.",
      ],
      [
        "Hangi cihazlar ve markalar destekleniyor?",
        "NEXUS; Shelly (Gen1 ve Gen2+), Tasmota, WLED, ESPHome, Philips Hue ve Home Assistant'ı her platformda yerel HTTP ile, TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY modu) ve Wake-on-LAN'ı masaüstü uygulamasında hesap ya da anahtar gerekmeden yerel ağ üzerinden yönetir. Matter veya Zigbee cihazları kendi Home Assistant sunucun üzerinden katılır; NEXUS onu tek bir yerel merkez görür. Yerel IP keşfi cihazları bulut aracı olmadan anında eşleştirir.",
      ],
      [
        "Güvenlik kameraları ve sensörler nasıl entegre edilir?",
        "NEXUS; güvenlik kameralarınızın durumunu, gizlilik modlarını, hareket dedektörlerini ve kapı/pencere sensörlerini birleşik güvenlik merkezinde sunar. 'Evden Ayrılış' modunda kameraları ve sensörleri devreye sokabilir, 'Evdeyim' modunda gizlilik perdelerini otomatik kapatabilir, tüm güvenlik olaylarını anlık yerel bildirimlerle takip edebilirsiniz.",
      ],
      [
        "NEXUS+ aboneliğimi dilediğim an iptal edebilir miyim?",
        "Evet, hiçbir taahhüt ve bağlayıcılık yoktur. Aboneliğinizi dilediğiniz an tek tıkla iptal edebilirsiniz: İster uygulamadaki Hesap & Faturalandırma menüsünden, ister bu sitedeki hesabınızdan, isterseniz de sipariş e-posta makbuzunuz üzerinden hemen yönetebilirsiniz. İptal ettiğinizde mevcut döneminiz boyunca tüm ayrıcalıklarınız korunur ve sonraki dönem için hiçbir ücret alınmaz.",
      ],
      [
        "Evden uzaktayken evimi kontrol edebilir miyim?",
        "NEXUS bulut üzerinden değil: cihazlarınla doğrudan ev ağında konuşur ve aracı bir sunucusu yoktur. Dışarıdan erişmek için telefonunu veya dizüstünü Tailscale (alt ağ yönlendirici) ya da router'ındaki WireGuard gibi bir VPN ile ev ağına bağla; NEXUS evdeki gibi çalışır. NEXUS'ta henüz merkez adresi ayarı yok, bu yüzden VPN yerel adres aralığını erişilebilir kılmalı; yeni cihaz taraması da yalnızca ev ağında çalışır. Cihazları port yönlendirmeyle asla internete açma. Adım adım rehber depodaki docs/REMOTE-ACCESS.md dosyasındadır.",
      ],
      [
        "iPhone sürümü var mı?",
        "App Store uygulaması yok; çünkü NEXUS ücretli Apple Developer hesabı kullanmaz. Bir Mac ve ücretsiz Apple ID ile kendi iPhone'un için derleyebilirsin (rehber: docs/IOS-BUILD.md); bir sürümde imzasız IPA da yer alabilir ve AltStore veya Sideloadly bunu senin için imzalar. Bu yol gerçek bir iPhone'da henüz doğrulanmadı. Ücretsiz Apple ID ile uygulama 7 günde sona erer ve iOS'ta uygulama kapalıyken telefona bildirim gelmez. Ev merkezi yine masaüstü uygulamasıdır; iPhone bir istemcidir.",
      ],
      [
        "Cihazım listede yok, ne yapabilirim?",
        "NEXUS yalnızca belgelenmiş yerel protokolü olan cihazları destekler; yalnızca buluttan çalışan cihazlar desteklenmez, çünkü NEXUS hiçbir üretici bulutuyla konuşmaz. Uyumluluk listesinde (docs/COMPATIBILITY.md) TP-Link Tapo, DIY modunda Sonoff, WiZ, LIFX, Govee (LAN), yerel anahtarlı Tuya ve Wake-on-LAN de yer alır. Hepsinin otomatik protokol testi vardır, ancak bir model ancak biri gerçek cihazda çalıştığını bildirdiğinde doğrulanmış sayılır. Bu sitedeki iletişim formundan (“Yeni Cihaz & Bağlayıcı İsteği” konusu) ya da e-postayla yaz: marka ve model, ne beklediğin ve ne olduğu. Bir modelin senin gerçek cihazında çalıştığını bildirmen, onu doğrulanmış işaretlememizi sağlar; şifre, yerel anahtar veya token yazma.",
      ],
      [
        "Hesap açmak zorunda mıyım? Sunucu kapanırsa ne olur?",
        "Evet: NEXUS'u açmak için ücretsiz bir e-posta hesabıyla bir kez giriş yaparsın. Sonrasında cihaz kontrolü ve otomasyonlar kendi ağında çalışır, internet kesilse de sürer. Hesap; cihazlar arası eşitleme, Aile ve yapay zekâ asistanını ekler ve bunlar sınırları olan ücretsiz bulut hizmetlerini kullanır. Bunlardan biri kullanılamazsa — örneğin ücretsiz Supabase projesi yaklaşık bir hafta etkinlik olmayınca duraklatılırsa — bulut ekranları kaydedilmiş gibi göstermek yerine sunucuya ulaşılamadığını söyler; cihazlar, otomasyonlar ve tepsi çalışmaya devam eder. Yapay zekâ kotası veya hizmeti tükenirse asistan yanıt veremediğini belirtir.",
      ],
      [
        "Ayarlarımı yedekleyip başka cihaza taşıyabilir miyim?",
        "Evet. Ayarlar'daki yedek bölümünden ayarlarını ve otomasyonlarını JSON dosyası olarak dışa aktarıp başka bir cihazda veya yeniden kurulumdan sonra içe aktarabilirsin. Dosyada eşleşmiş cihaz listesinden şifreler, token'lar ve yerel anahtarlar çıkarılır; geri yükledikten sonra bunları yeniden gir. Yedek dosyasını gizli tut.",
      ],
      [
        "Enerji verilerimi dışa aktarabilir miyim?",
        "Evet. Enerji sayfası, cihazlarının bildirdiği en son gerçek güç ölçümlerini CSV veya JSON olarak dışa aktarabilir. NEXUS yalnızca güç bildiren cihazlar için veriye sahiptir; hiç cihaz eşleşmemişse aktarılacak bir şey yoktur.",
      ],
      [
        "Windows kurulum dosyasını açarken neden uyarı alıyorum?",
        "Microsoft Store'dan kurarsan bu uyarıyı görmezsin: o paketi Microsoft sertifikasyon sırasında imzalar ve güncellemeleri Store üzerinden iletir. Doğrudan indirilen .exe ise henüz ticari bir sertifikayla imzalı değil; bu yüzden SmartScreen “bilinmeyen yayıncı” gösterebilir. Çalıştırmadan önce dosyayı indirmeler bölümündeki sağlama değerleriyle karşılaştırabilirsin. Kod imzalama politikamız sitenin alt bilgisinden bağlantılıdır.",
      ],
    ],
  },
  about: {
    title: "NEXUS Hakkında",
    lead: "Akıllı evinizin kontrolü yalnızca sizin elinizde olmalıdır. Hız, sıfır bulut bağımlılığı ve tavizsiz gizlilik için inşa edilen yeni nesil yerel akıllı ev platformu.",
    manifesto: {
      heading: "Neden NEXUS Doğdu?",
      text: "Modern akıllı ev pazarı ne yazık ki kullanıcıları üretici bulutlarına, zorunlu abonelik duvarlarına ve gecikmeli sunucu yanıtlarına hapsetti. İnternetiniz koptuğunda evinizdeki ışığın yanmaması veya salonunuzdaki kameranın yabancı sunuculara veri aktarması kabul edilemez. NEXUS; evinize ait tüm kontrolün, senaryoların ve sensör verilerinin sadece sizin yerel ağınızda (LAN) ve donanımlarınızda kalması gerektiği inancıyla bağımsız olarak geliştirildi.",
    },
    pillars: [
      {
        title: "Tavizsiz Yerel Hız",
        desc: "Tüm komutlar ve otomasyonlar milisaniyeler içinde doğrudan cihazın yerel IP adresine iletilir. Sıfır bulut gecikmesi, internetten bağımsız kesintisiz çalışma.",
      },
      {
        title: "Gerçek Veri Mahremiyeti",
        desc: "Evinizin kat planı, oda isimleri ve kullanım alışkanlıklarınız satılmaz, profillenmez ve reklam hedeflemesi için kullanılmaz. NEXUS için hesap gerekir; senkron listesindeki tanımlar kendi hesabına taşınır. Cihaz komutları yerel ağında kalır.",
      },
      {
        title: "Sıfır Marka Kilidi",
        desc: "Shelly, Hue, ESPHome, Tasmota ve WLED doğrudan yerel protokolleriyle tek panodan yönetilir; Sonoff, Matter ve Zigbee cihazları ise kendi Home Assistant sunucun üzerinden katılır.",
      },
      {
        title: "Dürüst ve Şeffaf Model",
        desc: "Temel akıllı ev kontrolü, sınırsız oda ve cihaz herkes için ücretsizdir. NEXUS+ NEXUS AI planıdır ve o bulut kullanımının maliyetini karşılar.",
      },
    ],
    architecture: {
      heading: "Güvenilirlik Odaklı Mühendislik",
      lead: "NEXUS; masaüstünde sistem tepsisinde 7/24 arka planda nöbet tutan ultra hafif çekirdeği ve mobilde optimize edilmiş yerel köprüleriyle evinizi her an senkronize tutar.",
      items: [
        {
          icon: "layers",
          title: "Masaüstü",
          desc: "Windows, macOS ve Linux uygulaması sistem tepsisinde kalır; bilgisayar açıkken yerel zamanlayıcılar ve sensör kuralları çalışmaya devam eder. Windows ve Linux hazır kurulumla gelir; macOS kaynaktan derlenir (imzasız: sağ tık → Aç).",
        },
        {
          icon: "wifi",
          title: "Telefon",
          desc: "Android ve iOS uygulamaları aynı yerel ağa açılır; cihaz komutları yine LAN üzerinden gider. Android imzalı APK olarak gelir; iOS, Xcode ve ücretsiz bir Apple ID ile kaynaktan derlenir.",
        },
        {
          icon: "lock",
          title: "Hesap",
          desc: "Hesap gerekir ki odalar, cihazlar ve sahneler her ekranda aynı olsun. Cihaz komutları ev ağından çıkmaz.",
        },
      ],
    },
    linksTitle: "Pratik bağlantılar",
  },
  footer: {
    tagline:
      "Tüm akıllı evinizi tek bir merkezden, üretici bulutlarına bağımlı olmadan ve doğrudan yerel ağınız üzerinden yönetin. İnternet kesilse bile eviniz kusursuz çalışmaya devam eder.",
    product: "Ürün",
    productLinks: [
      ["Özellikler", "#features"],
      ["Fiyatlar", "#pricing"],
      ["İndir", "#downloads"],
      ["SSS", "#faq"],
      ["Hakkında", "/tr/about"],
    ],
    account: "Müşteri & Destek",
    accountLinks: [
      ["İletişim ve Teknik Destek", "javascript:nxOpenContactModal('Teknik Destek')"],
      ["Sürüm Notları ve Topluluk", RELEASES_URL],
      ["NEXUS'u İndir", "#downloads"],
    ],
    legal: "Legal",
    legalLinks: [
      ["Gizlilik", "/tr/privacy"],
      ["Şartlar", "/tr/terms"],
      ["İade", "/tr/refund"],
      ["Kod imzalama", "/tr/code-signing"],
      ["Katkı verin", "/tr/contribute"],
    ],
    rights: "Tüm hakları saklıdır.",
    langSwitchLabel: "English",
    langSwitchHref: "/",
  },
};
