/**
 * NEXUS AI — Premium marketing homepage renderer.
 *
 * Wraps the generated premium body (see marketing-premium-body.ts) with a
 * localized head and injects the dynamic parts: active language menu,
 * download versions/links from the release service, and theme attribute.
 *
 * Localization strategy:
 *  - `LABEL_ALIASES` re-uses existing `mkt.*` catalog keys (full 20-locale
 *    coverage) for strings that match the old marketing copy exactly.
 *  - `TR_TEXT` / `TR_RAW` provide a hand-written Turkish translation for the
 *    rest of the premium copy. Other locales keep the English premium copy,
 *    which matches the label() EN-fallback behavior used elsewhere.
 * Every needle is verified against the generated body by unit tests.
 */

import { isRtl, SUPPORTED_LOCALES, type Locale } from "@nexus/i18n";
import { demoReleases, escapeHtml, label, setLocale, SITE_URL } from "@nexus/web";
import { marketingPremiumCss } from "./marketing-premium-css.js";
import {
  renderPremiumBody,
  RELEASES_REPO,
  type PremiumDynamicParts,
} from "./marketing-premium-body.js";

/** Current desktop release (keep in sync with desktop/package.json). */
const DESKTOP_VERSION = "1.0.0";

const LANG_LABELS: Record<string, string> = {
  en: "English",
  tr: "Türkçe",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  cs: "Čeština",
  ru: "Русский",
  uk: "Українська",
  ar: "العربية",
  he: "עברית",
  hi: "हिन्दी",
  ja: "日本語",
  ko: "한국어",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
  vi: "Tiếng Việt",
};

/** Text-node needles resolved through existing mkt.* catalog keys (all locales). */
export const LABEL_ALIASES: ReadonlyArray<readonly [string, string]> = [
  ["Skip to content", "mkt.skipToContent"],
  ["Features", "mkt.nav.features"],
  ["How it works", "mkt.how.title"],
  ["Integrations", "mkt.nav.integrations"],
  ["Pricing", "mkt.nav.pricing"],
  ["Download", "mkt.nav.download"],
  ["FAQ", "mkt.nav.faq"],
  ["Active users", "mkt.stats.users"],
  ["Supported devices", "mkt.stats.devices"],
  ["On-device privacy", "mkt.stats.privacy"],
  ["Average rating", "mkt.stats.rating"],
  ["Is NEXUS completely free?", "mkt.faq.1.q"],
  ["Which devices are supported?", "mkt.faq.2.q"],
  ["Does it work without a cloud connection?", "mkt.faq.3.q"],
  ["How is remote access provided?", "mkt.faq.4.q"],
  ["Built for Apple Silicon and Intel with deep system integration.", "mkt.desktop.macosDesc"],
  ["Lightweight, fast, and compatible with all major distributions.", "mkt.desktop.linuxDesc"],
  ["Download on the", "mkt.download.mobile.apple"],
  ["App Store", "mkt.download.mobile.appleStore"],
  ["Get it on", "mkt.download.mobile.google"],
  ["Google Play", "mkt.download.mobile.googlePlay"],
  [
    "Your voice-first personal home operating system. Completely local, entirely yours.",
    "mkt.footer.desc",
  ],
  ["Platforms", "mkt.footer.platforms"],
  ["About us", "mkt.footer.about"],
  ["Privacy policy", "mkt.footer.privacy"],
  ["Terms of service", "mkt.footer.terms"],
  ["Start for free", "mkt.pricing.cta"],
];

/** Raw needles (attributes / script strings) translated only for Turkish. */
export const TR_RAW: ReadonlyArray<readonly [string, string]> = [
  ["“Set the house for movie night.”", "“Evi film gecesine hazırla.”"],
  ["“Make downstairs comfortable.”", "“Alt katı rahatlat.”"],
  ["“Lock up and switch everything off.”", "“Kilitle ve her şeyi kapat.”"],
  ["“Start my focus routine.”", "“Odak rutinimi başlat.”"],
  [
    "“Lock the doors, dim the lights, and start Focus.”",
    "“Kapıları kilitle, ışıkları kıs ve Odak'ı başlat.”",
  ],
  ['aria-label="Toggle color theme"', 'aria-label="Tema rengini değiştir"'],
  ['aria-label="Open menu"', 'aria-label="Menüyü aç"'],
  ['aria-label="Primary navigation"', 'aria-label="Birincil gezinme"'],
  ['aria-label="NEXUS home"', 'aria-label="NEXUS ana sayfa"'],
];

/** Full text-node needles (wrapped in `>` … `<`) translated only for Turkish. */
export const TR_TEXT: ReadonlyArray<readonly [string, string]> = [
  // Header / nav
  ["Open account", "Hesap aç"],
  ["Download NEXUS", "NEXUS'u indir"],
  ["Try NEXUS", "NEXUS'u dene"],
  // Hero
  ["Your home.", "Senin evin."],
  ["One", "Tek"],
  ["intelligence.", "zekâ."],
  [
    "NEXUS is a smart home assistant that helps you manage your smart home devices.",
    "NEXUS, akıllı ev cihazlarınızı yönetmenize yardımcı olan bir akıllı ev asistanıdır.",
  ],
  ["Try NEXUS free", "NEXUS'u ücretsiz dene"],
  ["Get the mobile app", "Mobil uygulamayı indir"],
  ["100% local processing", "%100 yerel işleme"],
  ["No cloud dependency", "Bulut bağımlılığı yok"],
  ["Free to start", "Başlamak ücretsiz"],
  ["Lighting", "Aydınlatma"],
  ["12 scenes ready", "12 sahne hazır"],
  ["Climate", "İklim"],
  ["22° · Eco mode", "22° · Eko mod"],
  ["Security", "Güvenlik"],
  ["All zones secured", "Tüm bölgeler güvende"],
  ["Audio", "Ses"],
  ["4 rooms grouped", "4 oda gruplandı"],
  ["Energy", "Enerji"],
  ["18% below average", "Ortalamanın %18 altında"],
  ["NEXUS understood", "NEXUS anladı"],
  ["Running locally", "Yerelde çalışıyor"],
  ["No data leaves this device", "Hiçbir veri bu cihazdan çıkmaz"],
  // Metrics
  ["Live network", "Canlı ağ"],
  ["Synced", "Senkron"],
  ["Local only", "Yalnızca yerel"],
  ["Verified", "Doğrulanmış"],
  [
    "Private NEXUS environments running across homes and workspaces.",
    "Evlerde ve çalışma alanlarında çalışan özel NEXUS ortamları.",
  ],
  [
    "One intelligence layer across leading standards and ecosystems.",
    "Önde gelen standartlar ve ekosistemler genelinde tek zekâ katmanı.",
  ],
  [
    "Commands, routines, and context stay encrypted on your hardware.",
    "Komutlar, rutinler ve bağlam donanımında şifreli kalır.",
  ],
  [
    "Consistently rated for speed, calm design, and reliability.",
    "Hız, sakin tasarım ve güvenilirlik için istikrarlı biçimde yüksek puan alıyor.",
  ],
  ["12.8K reviews", "12.8K değerlendirme"],
  // Manifesto
  ["Designed differently", "Farklı tasarlandı"],
  ["A calmer way to run your connected life.", "Bağlantılı hayatını yönetmenin daha sakin yolu."],
  [
    "NEXUS replaces scattered apps, fragile cloud routines, and repetitive controls with one private intelligence layer built around you.",
    "NEXUS; dağınık uygulamaları, kırılgan bulut rutinlerini ve tekrarlayan kontrolleri senin etrafında kurulmuş tek bir özel zekâ katmanıyla değiştirir.",
  ],
  ["01 / PRIVATE", "01 / ÖZEL"],
  ["Everything stays home.", "Her şey evde kalır."],
  [
    "Your data, commands, routines, and history are processed locally. No cloud profiling. No behavioral tracking.",
    "Verilerin, komutların, rutinlerin ve geçmişin yerel olarak işlenir. Bulut profillemesi yok. Davranış takibi yok.",
  ],
  ["02 / NATURAL", "02 / DOĞAL"],
  ["Speak like a person.", "İnsan gibi konuş."],
  [
    "Ask for outcomes, not settings. NEXUS understands context, rooms, people, devices, and the way your household works.",
    "Ayarları değil sonuçları iste. NEXUS bağlamı, odaları, insanları, cihazları ve evinin işleyişini anlar.",
  ],
  ["03 / UNIVERSAL", "03 / EVRENSEL"],
  ["One layer, every device.", "Tek katman, her cihaz."],
  [
    "Matter, Zigbee, Z-Wave, Wi-Fi, HomeKit, and hundreds of APIs work together without locking you into one vendor.",
    "Matter, Zigbee, Z-Wave, Wi-Fi, HomeKit ve yüzlerce API seni tek bir markaya kilitlemeden birlikte çalışır.",
  ],
  ["04 / RESILIENT", "04 / DAYANIKLI"],
  ["Fast even when the internet is not.", "İnternet olmasa bile hızlı."],
  [
    "Local execution means instant response and reliable automations, including when your connection disappears.",
    "Yerel çalıştırma; bağlantın kesildiğinde bile anında yanıt ve güvenilir otomasyon demektir.",
  ],
  // Capabilities
  ["Capabilities", "Yetenekler"],
  ["Powerful underneath.", "Temelde güçlü."],
  ["Effortless on the surface.", "Yüzeyde zahmetsiz."],
  [
    "Advanced intelligence disappears into simple moments: a sentence, a routine, a room that already knows what you need.",
    "Gelişmiş zekâ basit anların içinde kaybolur: bir cümle, bir rutin, neye ihtiyacın olduğunu zaten bilen bir oda.",
  ],
  ["Meet NEXUS AI", "NEXUS AI ile tanış"],
  [
    "Your private voice assistant understands intent, coordinates devices, and completes multi-step requests without sending your voice to the cloud.",
    "Özel sesli asistanın niyeti anlar, cihazları koordine eder ve sesini buluta göndermeden çok adımlı istekleri tamamlar.",
  ],
  ["Listening locally", "Yerelde dinliyor"],
  ["devices", "cihaz"],
  ["routine", "rutin"],
  ["local response", "yerel yanıt"],
  ["Private by design", "Tasarım gereği özel"],
  [
    "Every command is processed on your hardware. You can inspect what happened and why.",
    "Her komut donanımında işlenir. Neyin neden olduğunu inceleyebilirsin.",
  ],
  ["NEXUS AI intent", "NEXUS AI niyeti"],
  ["Processed locally in 42 ms", "42 ms'de yerelde işlendi"],
  ["Device actions", "Cihaz eylemleri"],
  ["5 actions completed", "5 eylem tamamlandı"],
  ["Activity history", "Etkinlik geçmişi"],
  ["Encrypted on device", "Cihazda şifreli"],
  ["Unified standards", "Birleşik standartlar"],
  ["Connect the ecosystems you already own.", "Zaten sahip olduğun ekosistemleri bağla."],
  ["Universal device fabric", "Evrensel cihaz dokusu"],
  ["Auto-discovered · encrypted · local", "Otomatik keşif · şifreli · yerel"],
  ["6 online", "6 çevrimiçi"],
  ["Universal layer", "Evrensel katman"],
  ["Apple ecosystem", "Apple ekosistemi"],
  ["Low-power mesh", "Düşük güçlü mesh"],
  ["Device mesh", "Cihaz mesh ağı"],
  ["IP devices", "IP cihazları"],
  ["Secure sub-GHz", "Güvenli sub-GHz"],
  ["NEXUS graph synchronized", "NEXUS grafiği senkronize"],
  ["Invisible automation", "Görünmez otomasyon"],
  [
    "NEXUS AI combines presence, time, device state, and intent into routines that feel natural instead of programmed.",
    "NEXUS AI; varlık, zaman, cihaz durumu ve niyeti programlanmış değil doğal hissettiren rutinlerde birleştirir.",
  ],
  ["Home arrival detected", "Eve varış algılandı"],
  ["After sunset", "Gün batımından sonra"],
  ["Home occupied", "Ev dolu"],
  ["Phone nearby", "Telefon yakında"],
  ["Presence verified", "Varlık doğrulandı"],
  ["Context resolved", "Bağlam çözümlendi"],
  ["Scene activated", "Sahne etkinleştirildi"],
  ["Hall lights", "Koridor ışıkları"],
  ["Living room audio", "Salon sesi"],
  ["Executed on this device", "Bu cihazda çalıştırıldı"],
  ["0 cloud calls", "0 bulut çağrısı"],
  ["Instant response", "Anında yanıt"],
  [
    "NEXUS AI interprets, decides, and acts on your local hardware before a cloud assistant could finish connecting.",
    "NEXUS AI, bir bulut asistanı daha bağlanamadan yerel donanımında yorumlar, karar verir ve harekete geçer.",
  ],
  ["Instant by design", "Tasarım gereği anında"],
  [
    "No cloud round trip. No waiting for a remote model.",
    "Bulut gidiş-dönüşü yok. Uzak model bekleme yok.",
  ],
  ["Intent", "Niyet"],
  ["Reasoning", "Akıl yürütme"],
  ["Action", "Eylem"],
  ["99.98% success", "%99,98 başarı"],
  // How it works
  ["From download to connected in minutes.", "İndirmeden bağlantıya dakikalar içinde."],
  [
    "NEXUS discovers your environment, keeps setup local, and guides you through each connection without technical friction.",
    "NEXUS ortamını keşfeder, kurulumu yerelde tutar ve teknik sürtünme olmadan her bağlantıda sana yol gösterir.",
  ],
  ["Native setup", "Yerel kurulum"],
  ["Install your native core", "Yerel çekirdeğini kur"],
  [
    "Pick the signed build for your desktop. NEXUS configures the private local runtime automatically.",
    "Masaüstün için imzalı sürümü seç. NEXUS özel yerel çalışma ortamını otomatik yapılandırır.",
  ],
  ["≈ 2 minutes", "≈ 2 dakika"],
  ["Signed release", "İmzalı sürüm"],
  ["Private discovery", "Özel keşif"],
  ["Discover without the cloud", "Bulut olmadan keşfet"],
  [
    "NEXUS maps compatible devices over your local network and asks before every connection.",
    "NEXUS uyumlu cihazları yerel ağında haritalar ve her bağlantıdan önce izin ister.",
  ],
  ["Local-only scan", "Yalnızca yerel tarama"],
  ["Permission based", "İzin tabanlı"],
  ["Unified intelligence", "Birleşik zekâ"],
  ["Live through one private layer", "Tek özel katmanla yaşa"],
  [
    "Speak once, automate routines, and control the whole environment with one consistent interface.",
    "Bir kez söyle, rutinleri otomatikleştir ve tüm ortamı tek tutarlı arayüzle kontrol et.",
  ],
  ["Voice + routines", "Ses + rutinler"],
  // Integrations
  ["Works with what you already have.", "Zaten sahip olduklarınla çalışır."],
  ["Native bridge", "Yerel köprü"],
  ["Voice & devices", "Ses ve cihazlar"],
  ["Samsung ecosystem", "Samsung ekosistemi"],
  ["Local automation", "Yerel otomasyon"],
  ["Lighting & scenes", "Aydınlatma ve sahneler"],
  ["Whole-home audio", "Tüm ev ses sistemi"],
  ["Lights & sensors", "Işıklar ve sensörler"],
  ["Premium audio", "Premium ses"],
  ["Smart devices", "Akıllı cihazlar"],
  // Pricing
  [
    "Start free. Expand only when you need to.",
    "Ücretsiz başla. Sadece ihtiyacın olduğunda genişlet.",
  ],
  [
    "Core local control stays free. Premium plans add advanced intelligence, remote access, and household tools.",
    "Temel yerel kontrol ücretsiz kalır. Premium planlar gelişmiş zekâ, uzaktan erişim ve ev araçları ekler.",
  ],
  ["Local essentials", "Yerel temeller"],
  ["Free", "Ücretsiz"],
  ["Forever", "Sonsuza dek"],
  [
    "Everything you need to build a fast, private smart home around one local core.",
    "Tek yerel çekirdek etrafında hızlı ve özel bir akıllı ev kurmak için gereken her şey.",
  ],
  ["/ month", "/ ay"],
  ["No card required", "Kart gerekmez"],
  ["Local core capacity", "Yerel çekirdek kapasitesi"],
  ["05 devices", "05 cihaz"],
  ["On-device voice", "Cihaz üstü ses"],
  ["Community channel", "Topluluk kanalı"],
  ["Included in Free", "Ücretsiz plana dahil"],
  ["Up to 5 devices connected", "5 cihaza kadar bağlantı"],
  ["Basic voice commands and routines", "Temel sesli komutlar ve rutinler"],
  ["Community support", "Topluluk desteği"],
  ["Runs fully on your hardware", "Tamamen senin donanımında çalışır"],
  ["Adaptive intelligence", "Uyarlanabilir zekâ"],
  ["Most popular", "En popüler"],
  [
    "Advanced AI, secure remote access, and automations that continuously adapt to your routines.",
    "Gelişmiş yapay zekâ, güvenli uzaktan erişim ve rutinlerine sürekli uyum sağlayan otomasyonlar.",
  ],
  ["Cancel anytime", "İstediğin zaman iptal et"],
  ["Adaptive core capacity", "Uyarlanabilir çekirdek kapasitesi"],
  ["Unlimited", "Sınırsız"],
  ["Adaptive routines", "Uyarlanabilir rutinler"],
  ["Priority response", "Öncelikli yanıt"],
  ["Everything in Free, plus", "Ücretsiz plandaki her şey, artı"],
  ["Unlimited connected devices", "Sınırsız bağlı cihaz"],
  ["Advanced AI routines and automation", "Gelişmiş yapay zekâ rutinleri ve otomasyon"],
  ["Multi-room audio and scenes", "Çok odalı ses ve sahneler"],
  ["Priority 24/7 support", "Öncelikli 7/24 destek"],
  ["Secure remote access", "Güvenli uzaktan erişim"],
  ["Best balance of power and privacy", "Güç ve gizliliğin en iyi dengesi"],
  ["Shared household", "Paylaşılan ev"],
  ["Family", "Aile"],
  ["6 profiles", "6 profil"],
  [
    "A shared intelligence layer with individual access, preferences, safety, and control for everyone.",
    "Herkes için bireysel erişim, tercihler, güvenlik ve kontrol sunan paylaşılan zekâ katmanı.",
  ],
  ["One household", "Tek ev"],
  ["Household identity mesh", "Ev kimlik ağı"],
  ["06 profiles", "06 profil"],
  ["Private preferences", "Özel tercihler"],
  ["Managed access", "Yönetilen erişim"],
  ["Everything in Premium, plus", "Premium'daki her şey, artı"],
  ["Everything in Premium", "Premium'daki her şey"],
  ["Up to 6 family profiles", "6 aile profiline kadar"],
  ["Granular parental controls", "Ayrıntılı ebeveyn denetimleri"],
  ["Dedicated family dashboard", "Aileye özel panel"],
  ["Private profiles, one local core", "Özel profiller, tek yerel çekirdek"],
  // Mobile downloads
  ["Android phone and tablet", "Android telefon ve tablet"],
  ["iPhone and iPad", "iPhone ve iPad"],
  [
    "Install from Google Play, or download the APK directly and verify its checksum.",
    "Google Play'den kur ya da APK'yı doğrudan indirip sağlama toplamını doğrula.",
  ],
  [
    "The same local-first home, on iPhone and iPad, published on the App Store.",
    "Aynı yerel öncelikli ev deneyimi, App Store'da yayında olan iPhone ve iPad uygulamasıyla.",
  ],
  ["Local control", "Yerel kontrol"],
  ["Works offline", "Çevrimdışı çalışır"],
  ["No hub required", "Hub gerekmez"],
  ["Get it on Google Play", "Google Play'den al"],
  ["Download APK", "APK indir"],
  ["Download on the App Store", "App Store'dan indir"],
  // Mobile companion
  ["Available now", "Şimdi kullanılabilir"],
  ["NEXUS, now in your pocket.", "NEXUS artık cebinde."],
  [
    "Use the iOS and Android companion apps to talk to your home, approve automations, and check every local action from anywhere.",
    "iOS ve Android eşlik uygulamalarıyla evinle konuş, otomasyonları onayla ve her yerel eylemi istediğin yerden denetle.",
  ],
  ["End-to-end encrypted", "Uçtan uca şifreli"],
  ["Face ID / biometrics", "Face ID / biyometri"],
  ["Live household status", "Canlı ev durumu"],
  ["Scan for iPhone", "iPhone için tara"],
  ["Scan for Android", "Android için tara"],
  // Community
  ["Community", "Topluluk"],
  [
    "Real homes. Different routines. One private system.",
    "Gerçek evler. Farklı rutinler. Tek özel sistem.",
  ],
  [
    "A continuously moving wall of community stories shows how NEXUS fits into everyday homes, technical setups, and everything between them.",
    "Sürekli akan topluluk hikâyeleri duvarı, NEXUS'un gündelik evlere, teknik kurulumlara ve ikisi arasındaki her şeye nasıl uyduğunu gösterir.",
  ],
  ["12.8K community ratings", "12.8K topluluk puanı"],
  ["Across desktop and mobile NEXUS experiences", "Masaüstü ve mobil NEXUS deneyimleri genelinde"],
  [
    "NEXUS replaced four separate home apps in one evening. Voice control feels instant, and every routine keeps working even when the internet does not.",
    "NEXUS bir akşamda dört ayrı ev uygulamasının yerini aldı. Ses kontrolü anında hissettiriyor ve internet gitse bile her rutin çalışmaya devam ediyor.",
  ],
  ["Early adopter · United Kingdom", "Erken kullanıcı · Birleşik Krallık"],
  [
    "The local response time is the difference. Lights, scenes, and locks react before I finish lowering my hand from the microphone.",
    "Farkı yaratan yerel yanıt süresi. Işıklar, sahneler ve kilitler elimi mikrofondan indirmeden tepki veriyor.",
  ],
  ["Software engineer · Canada", "Yazılım mühendisi · Kanada"],
  [
    "I built a morning routine across Matter and Zigbee without touching a config file. It is powerful without feeling technical.",
    "Matter ve Zigbee genelinde bir sabah rutinini hiç yapılandırma dosyasına dokunmadan kurdum. Teknik hissettirmeden güçlü.",
  ],
  ["Smart-home enthusiast · Australia", "Akıllı ev meraklısı · Avustralya"],
  [
    "The interface finally makes a complex home feel calm. Every device has context, and the activity history is genuinely useful.",
    "Arayüz karmaşık bir evi sonunda sakin hissettiriyor. Her cihazın bağlamı var ve etkinlik geçmişi gerçekten işe yarıyor.",
  ],
  ["Product designer · Spain", "Ürün tasarımcısı · İspanya"],
  [
    "Local-first was the reason I tried NEXUS. The fact that it is also the fastest controller I have used was the surprise.",
    "NEXUS'u denememin sebebi yerel öncelikli olmasıydı. Kullandığım en hızlı kontrolcü olması ise sürpriz oldu.",
  ],
  ["Privacy advocate · UAE", "Gizlilik savunucusu · BAE"],
  [
    "A spare mini PC became the most reliable part of my smart home. Setup was clean, discovery was accurate, and recovery is effortless.",
    "Yedek bir mini PC akıllı evimin en güvenilir parçası oldu. Kurulum temizdi, keşif isabetliydi ve kurtarma zahmetsiz.",
  ],
  ["Home automation builder · USA", "Ev otomasyonu kurucusu · ABD"],
  [
    "My family actually uses it because the voice layer is simple. I keep the advanced controls, while everyone else just speaks naturally.",
    "Ailem gerçekten kullanıyor çünkü ses katmanı basit. Gelişmiş kontroller bende, diğer herkes sadece doğal konuşuyor.",
  ],
  ["Creative director · Portugal", "Kreatif direktör · Portekiz"],
  [
    "Device discovery found almost everything on the first scan. The remaining integrations were connected in minutes, not hours.",
    "Cihaz keşfi ilk taramada neredeyse her şeyi buldu. Kalan entegrasyonlar saatler değil dakikalar içinde bağlandı.",
  ],
  ["Systems architect · Japan", "Sistem mimarı · Japonya"],
  [
    "The audit trail makes automation understandable. I can see what ran, why it ran, and which device responded without sending data away.",
    "Denetim izi otomasyonu anlaşılır kılıyor. Neyin çalıştığını, neden çalıştığını ve hangi cihazın yanıt verdiğini veri dışarı gitmeden görebiliyorum.",
  ],
  ["Researcher · Germany", "Araştırmacı · Almanya"],
  [
    "Remote approvals are exactly what I needed. NEXUS stays local at home, but I can still help the family when I am away.",
    "Uzaktan onaylar tam ihtiyacım olan şeydi. NEXUS evde yerel kalıyor ama uzaktayken aileye yine de yardım edebiliyorum.",
  ],
  ["Household admin · Netherlands", "Ev yöneticisi · Hollanda"],
  [
    "Hover or focus the review wall to pause",
    "Duraklatmak için değerlendirme duvarına gel veya odaklan",
  ],
  // FAQ
  ["The important questions, answered.", "Önemli sorular, yanıtlandı."],
  [
    "NEXUS is built to stay transparent — about pricing, privacy, compatibility, and how your home runs.",
    "NEXUS; fiyatlandırma, gizlilik, uyumluluk ve evinin nasıl çalıştığı konusunda şeffaf kalmak üzere tasarlandı.",
  ],
  [
    "Yes. The core operating system and local control features are entirely free. Premium plans add advanced AI, secure remote access, and household management tools.",
    "Evet. Çekirdek işletim sistemi ve yerel kontrol özellikleri tamamen ücretsizdir. Premium planlar gelişmiş yapay zekâ, güvenli uzaktan erişim ve ev yönetimi araçları ekler.",
  ],
  [
    "NEXUS supports Matter, Zigbee, Z-Wave, Wi-Fi devices, and more than 500 API-based ecosystems.",
    "NEXUS; Matter, Zigbee, Z-Wave, Wi-Fi cihazlarını ve 500'den fazla API tabanlı ekosistemi destekler.",
  ],
  [
    "Yes. NEXUS communicates with devices over your local network, so core controls and automations continue working when the internet goes down.",
    "Evet. NEXUS cihazlarla yerel ağın üzerinden iletişim kurar; internet kesildiğinde temel kontroller ve otomasyonlar çalışmaya devam eder.",
  ],
  [
    "Premium users can connect through a secure end-to-end encrypted tunnel. You can also use your own VPN configuration.",
    "Premium kullanıcılar güvenli uçtan uca şifreli bir tünel üzerinden bağlanabilir. Kendi VPN yapılandırmanı da kullanabilirsin.",
  ],
  // CTA + footer
  ["Your home, your rules", "Senin evin, senin kuralların"],
  ["One system.", "Tek sistem."],
  ["Entirely yours.", "Tamamen senin."],
  [
    "Download NEXUS and replace fragmented controls with one fast, private intelligence layer.",
    "NEXUS'u indir; parçalı kontrolleri hızlı ve özel tek zekâ katmanıyla değiştir.",
  ],
  ["Download NEXUS free", "NEXUS'u ücretsiz indir"],
  ["Company & legal", "Şirket ve yasal"],
  ["All systems operational · Zero cookies", "Tüm sistemler çalışıyor · Sıfır çerez"],
  // Desktop-first downloads, honest device list (2026-10)
  ["Windows · macOS · Linux · local network", "Windows · macOS · Linux · yerel ağ"],
  ["No hub or cloud fee", "Hub ya da bulut ücreti yok"],
  ["Desktop", "Masaüstü"],
  ["Desktop platforms", "Masaüstü platformu"],
  [
    "Windows, macOS and Linux apps you can download today. Mobile apps are coming soon.",
    "Windows, macOS ve Linux uygulamaları bugün indirilebilir. Mobil uygulamalar yakında.",
  ],
  ["Local API", "Yerel API"],
  ["Device ecosystems", "Cihaz ekosistemi"],
  [
    "Philips Hue, Shelly, Tasmota, WLED, ESPHome, TP-Link Kasa and Yeelight.",
    "Philips Hue, Shelly, Tasmota, WLED, ESPHome, TP-Link Kasa ve Yeelight.",
  ],
  ["Hub, cloud or account fees", "Hub, bulut ya da hesap ücreti"],
  [
    "Devices are paired and controlled directly on your own network. No paid bridge or subscription is needed.",
    "Cihazlar doğrudan kendi ağınızda eşleştirilir ve kontrol edilir. Ücretli köprü ya da abonelik gerekmez.",
  ],
  [
    "Device commands go straight from the app to your devices. Nothing is routed through our servers.",
    "Cihaz komutları uygulamadan doğrudan cihazlarınıza gider. Hiçbiri sunucularımızdan geçmez.",
  ],
  [
    "Hue, Shelly, Tasmota, WLED and ESPHome work side by side through their own local APIs, so you are never locked into one vendor.",
    "Hue, Shelly, Tasmota, WLED ve ESPHome kendi yerel API'leriyle yan yana çalışır; tek bir markaya bağlı kalmazsınız.",
  ],
  ["Local bridge", "Yerel köprü"],
  ["Open firmware", "Açık yazılım"],
  ["LED strips", "LED şeritler"],
  ["DIY devices", "Kendin yap cihazlar"],
  ["Desktop app", "Masaüstü uygulaması"],
  ["Desktop app · LAN mode", "Masaüstü uygulaması · LAN modu"],
  ["Bridge · link button", "Köprü · bağlantı düğmesi"],
  ["Discovered on your network · local", "Ağınızda bulunur · yerel"],
  [
    "Connect the Wi-Fi devices you already own, without a paid hub.",
    "Sahip olduğunuz Wi-Fi cihazlarını ücretli bir hub olmadan bağlayın.",
  ],
  [
    "Download the installer for Windows, macOS or Linux. Every release lists SHA-256 checksums you can verify.",
    "Windows, macOS veya Linux kurulum dosyasını indirin. Her sürümde doğrulayabileceğiniz SHA-256 özetleri yayınlanır.",
  ],
  ["Checksums published", "Özetler yayınlanır"],
  [
    "Paired directly over your local network — no paid hub, cloud account or subscription. Matter, Tapo and Tuya are on the roadmap.",
    "Doğrudan yerel ağınız üzerinden eşleşir — ücretli hub, bulut hesabı ya da abonelik yok. Matter, Tapo ve Tuya yol haritasında.",
  ],
  ["Native on every desktop.", "Her masaüstünde yerel."],
  [
    "Download NEXUS for Windows, macOS or Linux today. The Android and iOS apps are on their way to the stores.",
    "NEXUS'u bugün Windows, macOS veya Linux için indirin. Android ve iOS uygulamaları mağazalara geliyor.",
  ],
  ["Windows 10 and 11", "Windows 10 ve 11"],
  [
    "One installer for Intel/AMD and ARM PCs. Includes automatic updates.",
    "Intel/AMD ve ARM bilgisayarlar için tek kurulum dosyası. Otomatik güncelleme içerir.",
  ],
  ["Auto-update", "Otomatik güncelleme"],
  ["Download for Windows", "Windows için indir"],
  [
    "First launch: if SmartScreen appears, choose “More info” → “Run anyway”.",
    "İlk açılış: SmartScreen uyarısı çıkarsa “Ek bilgi” → “Yine de çalıştır”ı seçin.",
  ],
  ["Apple silicon and Intel Macs", "Apple silicon ve Intel Mac'ler"],
  [
    "A universal app for every Mac on macOS 11 Big Sur or later.",
    "macOS 11 Big Sur ve sonrasındaki her Mac için evrensel uygulama.",
  ],
  ["Download for macOS", "macOS için indir"],
  [
    "First launch: right-click NEXUS in Applications and choose “Open”.",
    "İlk açılış: Uygulamalar klasöründe NEXUS'a sağ tıklayıp “Aç”ı seçin.",
  ],
  ["Ubuntu, Debian, Fedora and more", "Ubuntu, Debian, Fedora ve diğerleri"],
  [
    "A portable AppImage for any distribution, plus a .deb package.",
    "Her dağıtım için taşınabilir AppImage ve ayrıca .deb paketi.",
  ],
  ["Download AppImage", "AppImage indir"],
  ["Download .deb package", ".deb paketini indir"],
  [
    "All releases, release notes and SHA-256 checksums",
    "Tüm sürümler, sürüm notları ve SHA-256 özetleri",
  ],
  [
    "The same local-first home on Android. It will be published on Google Play.",
    "Aynı yerel öncelikli ev deneyimi Android'de. Google Play'de yayınlanacak.",
  ],
  ["Coming soon to Google Play", "Yakında Google Play'de"],
  [
    "The same local-first home on iPhone and iPad. It will be published on the App Store.",
    "Aynı yerel öncelikli ev deneyimi iPhone ve iPad'de. App Store'da yayınlanacak.",
  ],
  ["Coming soon to the App Store", "Yakında App Store'da"],
  ["Early access", "Erken erişim"],
  ["New, honest, and shaped by its first homes.", "Yeni, dürüst ve ilk evleriyle şekilleniyor."],
  [
    "NEXUS is in early access, so there are no ratings or reviews to show yet — we would rather earn them. Tell us which device you want supported next and we will prioritise it.",
    "NEXUS erken erişimde; bu yüzden henüz gösterecek puan ya da yorum yok — onları kazanmayı tercih ediyoruz. Sırada hangi cihazın desteklenmesini istediğinizi yazın, önceliklendirelim.",
  ],
  ["Send feedback", "Geri bildirim gönder"],
  [
    "Yes. Pairing and controlling devices on your local network, scenes and automations are free, with no hub, cloud account or subscription. Premium plans add advanced AI and household management tools.",
    "Evet. Yerel ağınızdaki cihazları eşleştirmek ve kontrol etmek, senaryolar ve otomasyonlar ücretsizdir; hub, bulut hesabı ya da abonelik gerekmez. Premium planlar gelişmiş yapay zekâ ve hane yönetimi araçları ekler.",
  ],
  [
    "Philips Hue, Shelly (Gen1, Plus and Pro), Tasmota, WLED and ESPHome devices are controlled directly over your local network. TP-Link Kasa and Yeelight work in the desktop app. Matter, Tapo and Tuya are on the roadmap.",
    "Philips Hue, Shelly (Gen1, Plus ve Pro), Tasmota, WLED ve ESPHome cihazları doğrudan yerel ağınız üzerinden kontrol edilir. TP-Link Kasa ve Yeelight masaüstü uygulamasında çalışır. Matter, Tapo ve Tuya yol haritasında.",
  ],
  ["Can I control my home while I am away?", "Evden uzaktayken evimi kontrol edebilir miyim?"],
  [
    "NEXUS talks to your devices on your home network. To control them while away, connect to your home through your own VPN (for example WireGuard on your router). A built-in remote option is planned.",
    "NEXUS cihazlarınızla ev ağınızda konuşur. Dışarıdayken kontrol etmek için kendi VPN'iniz üzerinden (örneğin modemdeki WireGuard) eve bağlanın. Yerleşik uzaktan erişim planlanıyor.",
  ],
  ["Android & iOS (soon)", "Android ve iOS (yakında)"],
  ["Apps", "Uygulamalar"],
  ["Coming soon · Android 7+", "Yakında · Android 7+"],
  ["Coming soon · iOS 15+", "Yakında · iOS 15+"],
  ["Free today. Premium when it is ready.", "Bugün ücretsiz. Premium hazır olduğunda."],
  [
    "Everything NEXUS does today is free, with no device limit and no account fee. Premium and Family plans are on the way.",
    "NEXUS'un bugün yaptığı her şey ücretsiz; cihaz sınırı ve hesap ücreti yok. Premium ve Aile planları yolda.",
  ],
  ["Device capacity", "Cihaz kapasitesi"],
  ["No limit", "Sınırsız"],
  ["Scenes and NEXUS AI", "Senaryolar ve NEXUS AI"],
  ["Scenes, automations and NEXUS AI chat", "Senaryolar, otomasyonlar ve NEXUS AI sohbeti"],
  ["Windows, macOS and Linux apps", "Windows, macOS ve Linux uygulamaları"],
  ["Soon", "Yakında"],
  ["Not on sale yet", "Henüz satışta değil"],
  ["Coming soon", "Yakında"],
  [
    "Yes. Pairing and controlling devices on your local network, scenes, automations and NEXUS AI are free, with no device limit, hub, cloud account or subscription. Paid Premium and Family plans will come later; nothing you use today will be taken away.",
    "Evet. Yerel ağındaki cihazları eşleştirmek ve kontrol etmek, senaryolar, otomasyonlar ve NEXUS AI ücretsizdir; cihaz sınırı, hub, bulut hesabı ya da abonelik yok. Ücretli Premium ve Aile planları daha sonra gelecek; bugün kullandığın hiçbir şey elinden alınmayacak.",
  ],
];

function byNeedleLengthDesc(
  pairs: ReadonlyArray<readonly [string, string]>,
): Array<readonly [string, string]> {
  return [...pairs].sort((a, b) => b[0].length - a[0].length);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Matches `>   needle   <` text nodes while preserving surrounding whitespace. */
export function textNodePattern(needle: string): RegExp {
  return new RegExp(`>(\\s*)${escapeRegExp(needle)}(\\s*)<`, "g");
}

function replaceTextNode(body: string, en: string, replacement: string): string {
  return body.replace(
    textNodePattern(en),
    (_m, a: string, b: string) => `>${a}${replacement}${b}<`,
  );
}

/** User-visible CSS `content:` strings that must follow the locale (tr only). */
const TR_CSS: ReadonlyArray<readonly [string, string]> = [
  ['content: "Recommended";', 'content: "\u00d6nerilen";'],
  [
    'content: "Select to reveal answer";',
    'content: "Yan\u0131t\u0131 g\u00f6rmek i\u00e7in se\u00e7";',
  ],
];

/** Localizes the user-visible CSS-generated labels for Turkish pages. */
function localizePremiumCss(css: string, locale: Locale): string {
  if (locale !== "tr") return css;
  for (const [en, tr] of TR_CSS) {
    css = css.split(en).join(tr);
  }
  return css;
}

/** Applies catalog aliases (all locales) and the Turkish dictionary (tr only). */
function localizePremiumBody(body: string, locale: Locale): string {
  if (locale === "tr") {
    for (const [en, tr] of byNeedleLengthDesc(TR_RAW)) {
      body = body.split(en).join(tr);
    }
    for (const [en, tr] of byNeedleLengthDesc(TR_TEXT)) {
      body = replaceTextNode(body, en, escapeHtml(tr));
    }
  }
  for (const [en, key] of byNeedleLengthDesc(LABEL_ALIASES)) {
    body = replaceTextNode(body, en, escapeHtml(label(key)));
  }
  return body;
}

function requireRelease(platform: "android" | "ios") {
  const release = demoReleases().get(platform);
  if (!release) throw new Error(`missing release info for ${platform}`);
  return release;
}

const PREMIUM_FAVICON =
  "data:image/svg+xml,%3Csvg%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22nxlogo%22%20x1%3D%223%22%20y1%3D%222%22%20x2%3D%2229%22%20y2%3D%2230%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%236f9bff%22%2F%3E%3Cstop%20offset%3D%220.55%22%20stop-color%3D%22%235b8dff%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%238b7bff%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22nxsheen%22%20x1%3D%2216%22%20y1%3D%221%22%20x2%3D%2216%22%20y2%3D%2217%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%23ffffff%22%20stop-opacity%3D%220.30%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ffffff%22%20stop-opacity%3D%220%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20x%3D%221%22%20y%3D%221%22%20width%3D%2230%22%20height%3D%2230%22%20rx%3D%229%22%20fill%3D%22url(%23nxlogo)%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%221%22%20width%3D%2230%22%20height%3D%2230%22%20rx%3D%229%22%20fill%3D%22url(%23nxsheen)%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%2229%22%20height%3D%2229%22%20rx%3D%228.5%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.22%22%2F%3E%3Cpath%20d%3D%22M10.5%2022.5V10.5L21.5%2022.5V10.5%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%222.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E";

/** Marketing description matching the premium page (desktop apps are live, mobile is coming soon). */
function premiumSeoDescription(locale: Locale): string {
  if (locale === "tr") {
    return "NEXUS'u Windows, macOS ve Linux için ücretsiz indir. Cihazlarınla yerel ağda, hub ya da bulut ücreti olmadan konuşur. Android ve iOS yakında.";
  }
  return "Download NEXUS free for Windows, macOS and Linux. It talks to your devices on the local network, with no hub or cloud fee. Android and iOS coming soon.";
}

/**
 * Renders the full premium marketing homepage for the given locale/theme.
 * Platform highlighting is done client-side, so the user agent is not needed.
 */
export function renderMarketingPremiumDocument(
  locale: Locale,
  theme: "dark" | "light" = "dark",
): string {
  setLocale(locale);

  const android = requireRelease("android");
  const ios = requireRelease("ios");
  const versionWord = locale === "tr" ? "Sürüm" : "Version";

  const langItems = SUPPORTED_LOCALES.map(
    (l) =>
      `<a${l === locale ? ' class="active"' : ""} href="?lang=${l}">${LANG_LABELS[l] ?? l.toUpperCase()}</a>`,
  ).join("\n              ");
  const dyn: PremiumDynamicParts = {
    langCode: locale.slice(0, 2).toUpperCase(),
    langMenu: `<div class="language-menu" role="menu">\n              ${langItems}\n            </div>`,
    androidVersion: `${versionWord} ${android.version} · Android 12+`,
    iosVersion: `${versionWord} ${ios.version} · iOS 17+`,
    playHref: "https://play.google.com/store/apps/details?id=ai.nexus.app",
    appStoreHref: ios.downloadUrl,
    apkHref: android.downloadUrl,
    desktopVersion: `${versionWord} ${DESKTOP_VERSION}`,
  };

  const body = localizePremiumBody(renderPremiumBody(dyn), locale);

  const title = escapeHtml(label("mkt.seo.title"));
  const description = escapeHtml(premiumSeoDescription(locale));
  const hreflangs = SUPPORTED_LOCALES.map(
    (l) => `  <link rel="alternate" hreflang="${l}" href="/?lang=${l}" />`,
  ).join("\n");
  const dir = isRtl(locale) ? ' dir="rtl"' : "";
  const themeColor = theme === "light" ? "#f6f7fb" : "#09090b";

  return `<!doctype html>
<html lang="${locale}" data-theme="${theme}"${dir}>
<head>

  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${SITE_URL}" />
  <meta name="keywords" content="personal AI, voice assistant, smart home, privacy, cross-platform, automation, routines" />
  <meta name="theme-color" content="${themeColor}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="NEXUS" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${SITE_URL}" />
  <meta property="og:image" content="${SITE_URL}og-cover.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:site" content="@nexusai" />
  <meta name="twitter:image" content="${SITE_URL}og-cover.png" />
${hreflangs}
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}" />
  <link rel="preload" href="/fonts/space-grotesk-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="icon" href="${PREMIUM_FAVICON}" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <script>
    (function () {
      var saved = localStorage.getItem("nx-theme");
      if (saved === "light" || saved === "dark") document.documentElement.setAttribute("data-theme", saved);
    })();
  </script>
<style>${localizePremiumCss(marketingPremiumCss(), locale)}</style>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NEXUS",
    "description": "A voice-first, privacy-focused personal operating system for smart homes.",
    "url": "${SITE_URL}",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Windows, macOS, Linux",
    "downloadUrl": "${RELEASES_REPO}/releases/latest",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  </script>
</head>
<body>${body}</body>
</html>
`;
}

/**
 * Extracts the premium header, footer, and CSS so that auxiliary pages
 * (legal, about, 404) can wrap their own content in the premium shell.
 */
export function getPremiumShell(locale: Locale): { header: string; footer: string; css: string } {
  const langItems = SUPPORTED_LOCALES.map(
    (l) =>
      `<a${l === locale ? ' class="active"' : ""} href="?lang=${l}">${LANG_LABELS[l] ?? l.toUpperCase()}</a>`,
  ).join("\n              ");

  const dyn: PremiumDynamicParts = {
    langCode: locale.slice(0, 2).toUpperCase(),
    langMenu: `<div class="language-menu" role="menu">\n              ${langItems}\n            </div>`,
    androidVersion: "",
    iosVersion: "",
    playHref: "",
    appStoreHref: "",
    apkHref: "",
  };

  const body = localizePremiumBody(renderPremiumBody(dyn), locale);
  const mainStart = body.indexOf('<main id="main">');
  const mainEnd = body.indexOf("</main>") + 7;

  return {
    header: body.substring(0, mainStart),
    footer: body.substring(mainEnd),
    css: localizePremiumCss(marketingPremiumCss(), locale),
  };
}
