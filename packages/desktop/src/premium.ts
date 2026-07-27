/**
 * NEXUS AI — Premium desktop shell renderer ("Windows · Home Studio").
 *
 * Single source of truth for the approved premium desktop design. Composes
 * the verbatim premium modules (css/body/script) into a full document and
 * localizes every user-visible string for Turkish. The generated output is
 * deterministic: the same inputs always produce the same page.
 *
 * The English reference markup lives in premium-body.ts / premium-script.ts;
 * regenerate those with scripts/gen-desktop-premium.mjs only after an
 * intentional hand-edit of the reference page.
 */
import { desktopPremiumBody } from "./premium-body.js";
import { desktopPremiumCss } from "./premium-css.js";
import { desktopPremiumScript } from "./premium-script.js";

export type DesktopPremiumTheme = "dark" | "light";
export type DesktopPremiumLocale = "en" | "tr";
export type DesktopPremiumOs = "windows" | "mac" | "linux";

export interface DesktopPremiumOptions {
  theme?: DesktopPremiumTheme;
  locale?: DesktopPremiumLocale;
  os?: DesktopPremiumOs;
}

/** Product OS label shown in the titlebar badge, page title and copy. */
const OS_LABEL: Record<DesktopPremiumOs, string> = {
  windows: "Windows",
  mac: "macOS",
  linux: "Linux",
};

/** Concrete OS release named in the platforms/updates views. */
const OS_VERSION: Record<DesktopPremiumOs, string> = {
  windows: "Windows 11",
  mac: "macOS 15",
  linux: "Ubuntu 24.04",
};

/**
 * Swaps the OS mentions in the shared premium markup/script. The reference
 * design is authored for Windows; every "Windows" occurrence in the body and
 * behavior script is user-visible copy (verified — none exist inside CSS
 * rules or embedded image data), so a token swap is safe for mac/linux.
 */
function adaptOs(text: string, os: DesktopPremiumOs): string {
  if (os === "windows") return text;
  return text.split("Windows 11").join(OS_VERSION[os]).split("Windows").join(OS_LABEL[os]);
}

const FAVICON =
  "data:image/svg+xml,%3Csvg%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%223%22%20y1%3D%222%22%20x2%3D%2229%22%20y2%3D%2230%22%3E%3Cstop%20stop-color%3D%22%236f9bff%22%2F%3E%3Cstop%20offset%3D%22.55%22%20stop-color%3D%22%235b8dff%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%238b7bff%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20x%3D%221%22%20y%3D%221%22%20width%3D%2230%22%20height%3D%2230%22%20rx%3D%229%22%20fill%3D%22url(%23g)%22%2F%3E%3Cpath%20d%3D%22M10.5%2022.5V10.5L21.5%2022.5V10.5%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%222.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E";

/** Renders the premium desktop shell for the requested theme, locale and OS. */
export function renderDesktopPremiumDocument(options: DesktopPremiumOptions = {}): string {
  const theme = options.theme ?? "dark";
  const locale = options.locale ?? "en";
  const os = options.os ?? "windows";
  let body = desktopPremiumBody();
  let script = desktopPremiumScript();
  if (locale === "tr") {
    body = localizePremiumBodyTr(body);
    script = localizePremiumScriptTr(script);
  }
  body = adaptOs(body, os);
  script = adaptOs(script, os);
  const title =
    locale === "tr"
      ? `NEXUS AI — ${OS_LABEL[os]} · Ev Stüdyosu`
      : `NEXUS AI — ${OS_LABEL[os]} · Home Studio`;
  const description =
    locale === "tr"
      ? `${OS_LABEL[os]} için NEXUS AI yerel öncelikli kişisel işletim sistemi.`
      : `NEXUS AI local-first personal operating system for ${OS_LABEL[os]}.`;
  return `<!doctype html>
<html lang="${locale}" data-theme="${theme}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="theme-color" content="#09090b" />
    <meta name="description" content="${description}" />
    <meta name="application-name" content="NEXUS AI" />
    <title>${title}</title>
    <link rel="icon" href="${FAVICON}" />
    <style>${desktopPremiumCss()}</style>
  </head>
  ${body}<script>${script}</script>
  </body>
</html>
`;
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Replaces a whole text node (`>  needle  <`) preserving surrounding whitespace. */
function replaceTextNodes(html: string, needle: string, replacement: string): string {
  const pattern = new RegExp(`>(\\s*)${escapeRegExp(needle)}(\\s*)<`, "g");
  return html.replace(pattern, (_m, pre: string, post: string) => `>${pre}${replacement}${post}<`);
}

/**
 * Turkish dictionary for body text nodes. Brand, product and proper names
 * (NEXUS, Philips Hue, Nest, Sonos, Nuki, Roborock, Local Core, Wi-Fi…) stay
 * untranslated on purpose — cross-platform brand consistency.
 */
const TR_TEXT: ReadonlyArray<readonly [string, string]> = [
  // Titlebar + sidebar (primary: Home/Rooms/Devices/Automations/Assistant ·
  // secondary: Household/Settings/Updates/Help — no bucket labels)
  ["Local Personal Operating System", "Yerel Kişisel İşletim Sistemi"],
  ["Windows · Local", "Windows · Yerel"],
  ["Ask NEXUS AI", "NEXUS AI'ya sor"],
  ["Voice or keyboard", "Ses veya klavye"],
  ["Home", "Ev"],
  ["Rooms", "Odalar"],
  ["Devices", "Cihazlar"],
  ["Automations", "Otomasyonlar"],
  ["Assistant", "Asistan"],
  ["Household", "Ev halkı"],
  ["Settings", "Ayarlar"],
  ["Updates", "Güncellemeler"],
  ["Help", "Yardım"],
  ["Owner · Family", "Sahip · Aile"],
  // Home view
  ["Good evening, Ensar", "İyi akşamlar, Ensar"],
  ["Your home", "Eviniz"],
  ["Entry", "Giriş"],
  ["Utility", "Çamaşırlık"],
  ["Local Core ready · 6 of 8 devices online", "Local Core hazır · 8 cihazdan 6'sı çevrimiçi"],
  ["Search NEXUS", "NEXUS'ta ara"],
  ["Living room", "Oturma odası"],
  ["· 82°F · 3 local devices", "· 82°F · 3 yerel cihaz"],
  ["All devices", "Tüm cihazlar"],
  ["By capability", "Yeteneğe göre"],
  ["All off", "Tümünü kapat"],
  ["Controls", "Kontroller"],
  ["NEXUS noticed", "NEXUS fark etti"],
  [
    "Energy use is 8% above your normal Saturday pattern.",
    "Enerji kullanımı normal cumartesi düzeninizin %8 üzerinde.",
  ],
  ["Explain", "Açıkla"],
  ["Online · Eco cooling", "Çevrimiçi · Eko soğutma"],
  ["Room", "Oda"],
  ["Capability", "Yetenek"],
  ["Climate", "İklim"],
  ["Response", "Yanıt"],
  ["Local device status", "Yerel cihaz durumu"],
  ["Refreshing your home", "Eviniz yenileniyor"],
  ["Try again", "Tekrar dene"],
  ["Dismiss", "Kapat"],
  ["78% · Living room", "%78 · Oturma odası"],
  ["80°F · Cooling", "80°F · Soğutma"],
  ["Paused", "Duraklatıldı"],
  ["Locked · Entry", "Kilitli · Giriş"],
  ["Charging · 82%", "Şarj oluyor · %82"],
  ["Ask naturally · runs locally", "Doğal konuş · yerelde çalışır"],
  ["Smart", "Akıllı"],
  ["Lock up", "Kilitle"],
  ["Explain energy", "Enerjiyi açıkla"],
  ["Create routine", "Rutin oluştur"],
  ["Understood", "Anlaşıldı"],
  ["Security scope checked", "Güvenlik kapsamı denetlendi"],
  ["Ready to act locally", "Yerelde çalışmaya hazır"],
  // Device drawer + inspector
  ["Today", "Bugün"],
  ["Selected device", "Seçili cihaz"],
  ["Cooling · Eco", "Soğutma · Eko"],
  ["Control", "Kontrol"],
  ["Details", "Ayrıntılar"],
  ["Related", "İlgili"],
  ["History", "Geçmiş"],
  ["Target temperature", "Hedef sıcaklık"],
  ["Quick actions", "Hızlı eylemler"],
  ["Add to a scene", "Sahneye ekle"],
  ["Reuse this exact state", "Bu durumu yeniden kullan"],
  ["Ask about this device", "Bu cihaz hakkında sor"],
  ["Share live context with NEXUS AI", "NEXUS AI ile canlı bağlamı paylaş"],
  ["Live context", "Canlı bağlam"],
  ["Indoor humidity", "İç nem"],
  ["Connection", "Bağlantı"],
  ["Wi-Fi · Strong", "Wi-Fi · Güçlü"],
  ["Last activity", "Son etkinlik"],
  ["Adjusted 8 min ago", "8 dk önce ayarlandı"],
  ["Local execution path", "Yerel yürütme yolu"],
  ["Thermostat", "Termostat"],
  ["Processed on this PC", "Bu bilgisayarda işlendi"],
  ["Hardware and connection", "Donanım ve bağlantı"],
  ["Protocol", "Protokol"],
  ["3rd generation", "3. nesil"],
  ["Firmware", "Aygıt yazılımı"],
  ["Hardware", "Donanım"],
  ["24 V HVAC · 46% humidity", "24 V HVAC · %46 nem"],
  ["Packet loss", "Paket kaybı"],
  ["Now", "Şimdi"],
  ["Last seen", "Son görülme"],
  ["Connected intelligence", "Bağlantılı zeka"],
  ["Calm evening", "Sakin akşam"],
  ["Skill · uses temperature and presence", "Yetenek · sıcaklık ve varlık kullanır"],
  ["Presence climate", "Varlığa göre iklim"],
  ["Automation · living room", "Otomasyon · oturma odası"],
  ["Energy Agent", "Enerji Ajanı"],
  ["Optimizes Eco schedule", "Eko programını optimize eder"],
  ["Eco target confirmed", "Eko hedefi onaylandı"],
  ["NEXUS AI · presence context", "NEXUS AI · varlık bağlamı"],
  ["Energy profile applied", "Enerji profili uygulandı"],
  ["Energy Agent · approved locally", "Enerji Ajanı · yerelde onaylandı"],
  ["Firmware verified", "Aygıt yazılımı doğrulandı"],
  ["Security Agent", "Güvenlik Ajanı"],
  ["Device came online", "Cihaz çevrimiçi oldu"],
  ["Local network", "Yerel ağ"],
  // Rooms view
  [
    "Rooms come from where your paired devices actually are.",
    "Odalar, eşleştirilmiş cihazlarınızın gerçekte bulunduğu yerlerden oluşur.",
  ],
  ["3 local devices", "3 yerel cihaz"],
  ["1 local device", "1 yerel cihaz"],
  // Automations view (Suggestions section)
  ["Suggestions", "Öneriler"],
  ["Security", "Güvenlik"],
  ["Three useful changes", "Üç faydalı değişiklik"],
  ["Private ranking", "Özel sıralama"],
  ["Reduce standby use after midnight", "Gece yarısından sonra bekleme tüketimini azalt"],
  ["Save ~8%", "~%8 tasarruf"],
  ["High confidence", "Yüksek güven"],
  ["Scan network", "Ağı tara"],
  // Devices view
  ["Paired products", "Eşleştirilmiş ürünler"],
  ["Online now", "Şu an çevrimiçi"],
  ["Universal capabilities", "Evrensel yetenekler"],
  ["Cloud-only actions today", "Bugün yalnızca buluttaki eylemler"],
  ["Product", "Ürün"],
  ["Universal capability", "Evrensel yetenek"],
  ["State", "Durum"],
  ["Lighting", "Aydınlatma"],
  ["Online · 78%", "Çevrimiçi · %78"],
  ["Online · 80°F", "Çevrimiçi · 80°F"],
  ["Audio", "Ses"],
  ["Online · paused", "Çevrimiçi · duraklatıldı"],
  ["Access control", "Erişim kontrolü"],
  ["Locked", "Kilitli"],
  ["Cleaning", "Temizlik"],
  // Assistant view (Skills section)
  ["Skills", "Yetenekler"],
  ["New skill", "Yeni yetenek"],
  ["Active skills", "Etkin yetenekler"],
  ["All healthy", "Tümü sağlıklı"],
  ["Last run 20:40", "Son çalışma 20:40"],
  ["Open", "Aç"],
  ["Medium risk", "Orta risk"],
  ["Deep focus", "Derin odak"],
  ["Voice enabled", "Ses etkin"],
  ["Permissions", "İzinler"],
  // Assistant view (Agents section)
  ["Agents", "Ajanlar"],
  ["Current orchestration", "Geçerli orkestrasyon"],
  ["Local execution", "Yerel yürütme"],
  ["Intent + plan", "Niyet + plan"],
  ["Home Agent", "Ev Ajanı"],
  ["3 device actions", "3 cihaz eylemi"],
  ["Scope approved", "Kapsam onaylandı"],
  ["Device Fabric", "Cihaz Dokusu"],
  ["2 actions complete", "2 eylem tamamlandı"],
  ["Specialist agents", "Uzman ajanlar"],
  ["Active · 5 scopes", "Etkin · 5 kapsam"],
  ["PC Agent", "PC Ajanı"],
  ["Active · 4 scopes", "Etkin · 4 kapsam"],
  ["Always active", "Her zaman etkin"],
  // Settings view (Connections section)
  ["Connections", "Bağlantılar"],
  [
    "Connections, security, and the plan for this household.",
    "Bu ev halkı için bağlantılar, güvenlik ve plan.",
  ],
  ["Pair a device", "Cihaz eşleştir"],
  ["Your NEXUS devices", "NEXUS cihazlarınız"],
  ["Sync healthy", "Eşitleme sağlıklı"],
  [
    "This device · Local Core host · last sync now",
    "Bu cihaz · Local Core ana makinesi · son eşitleme şimdi",
  ],
  ["Trusted", "Güvenilir"],
  ["Ensar’s iPhone", "Ensar'ın iPhone'u"],
  ["Connected", "Bağlı"],
  // Household view
  ["Household members", "Ev halkı üyeleri"],
  ["Voice verified", "Ses doğrulandı"],
  ["Managed", "Yönetilen"],
  // Assistant view (Preferences section)
  ["Preferences", "Tercihler"],
  ["Experience memory", "Deneyim hafızası"],
  ["NEXUS AI identity", "NEXUS AI kimliği"],
  ["Assistant name", "Asistan adı"],
  ["Wake phrase", "Uyandırma ifadesi"],
  ["Response style", "Yanıt stili"],
  ["Balanced", "Dengeli"],
  // Settings view (Security & activity section)
  ["Security & activity", "Güvenlik ve etkinlik"],
  ["Export report", "Raporu dışa aktar"],
  ["Actions policy-checked", "Eylemler politika denetiminden geçti"],
  ["Blocked threats today", "Bugün engellenen tehditler"],
  ["Approval requests", "Onay istekleri"],
  ["Local", "Yerel"],
  ["Audit storage", "Denetim depolama"],
  ["Recent verified actions", "Son doğrulanmış eylemler"],
  ["Integrity verified", "Bütünlük doğrulandı"],
  ["Front door locked", "Ön kapı kilitlendi"],
  ["Evening lighting applied", "Akşam aydınlatması uygulandı"],
  ["Calm evening skill · 4 Philips Hue bulbs", "Sakin akşam yeteneği · 4 Philips Hue ampul"],
  ["Connector signature verified", "Bağlayıcı imzası doğrulandı"],
  ["Security Agent · Hue Connector 2.4.1", "Güvenlik Ajanı · Hue Connector 2.4.1"],
  // Settings view (Plan section — flat, no tab bar)
  ["Your NEXUS plan", "NEXUS planınız"],
  ["/month", "/ay"],
  ["Manage plan", "Planı yönet"],
  ["Current billing period", "Geçerli fatura dönemi"],
  ["July 15 — August 14, 2026", "15 Temmuz — 14 Ağustos 2026"],
  ["Active", "Etkin"],
  ["Connected devices", "Bağlı cihazlar"],
  ["8 active of unlimited", "sınırsız içinde 8 etkin"],
  ["No limit", "Sınır yok"],
  ["Household profiles", "Ev halkı profilleri"],
  ["3 active of 5 included", "dahil 5 profilden 3'ü etkin"],
  ["2 available", "2 kullanılabilir"],
  // Updates view
  ["3.15.0 available", "3.15.0 mevcut"],
  ["Version 3.15.0", "Sürüm 3.15.0"],
  ["Installation integrity", "Kurulum bütünlüğü"],
  [
    "Verify the installed files before restarting.",
    "Yeniden başlatmadan önce kurulu dosyaları doğrulayın.",
  ],
  // Help view
  ["Search help", "Yardımda ara"],
  ["System checks", "Sistem denetimleri"],
  ["Healthy · 14 ms", "Sağlıklı · 14 ms"],
  ["Voice service", "Ses hizmeti"],
  ["Ready", "Hazır"],
  ["Device connectors", "Cihaz bağlayıcıları"],
  ["Review", "İncele"],
  // Dialog + toasts region
  ["Edit preference", "Tercihi düzenle"],
  ["Saved to the active NEXUS profile.", "Etkin NEXUS profiline kaydedildi."],
  ["Value", "Değer"],
  ["Cancel", "İptal"],
  ["Save changes", "Değişiklikleri kaydet"],
];

/** Attribute-level replacements (aria-label, placeholder, title, alt, data-*). */
const TR_ATTR: ReadonlyArray<readonly [string, string]> = [
  ['aria-label="Window controls"', 'aria-label="Pencere kontrolleri"'],
  ['aria-label="Minimize"', 'aria-label="Simge durumuna küçült"'],
  ['aria-label="Maximize or restore"', 'aria-label="Ekranı kapla veya geri yükle"'],
  ['aria-label="Close"', 'aria-label="Kapat"'],
  ['aria-label="Primary navigation"', 'aria-label="Birincil gezinme"'],
  ['aria-label="Open profile for Ensar Yılmaz"', 'aria-label="Ensar Yılmaz profilini aç"'],
  ['aria-label="Change theme"', 'aria-label="Temayı değiştir"'],
  ['aria-label="Notifications"', 'aria-label="Bildirimler"'],
  ['aria-label="Browse your home"', 'aria-label="Evinize göz atın"'],
  ['aria-label="Connected devices"', 'aria-label="Bağlı cihazlar"'],
  ['aria-label="Add device"', 'aria-label="Cihaz ekle"'],
  [
    'aria-label="Change NEXUS AI execution mode"',
    'aria-label="NEXUS AI yürütme modunu değiştir"',
  ],
  ['aria-label="Talk to NEXUS AI"', 'aria-label="NEXUS AI ile konuş"'],
  ['aria-label="Close device controls"', 'aria-label="Cihaz kontrollerini kapat"'],
  ['aria-label="Toggle selected device"', 'aria-label="Seçili cihazı aç/kapat"'],
  ['aria-label="Device context"', 'aria-label="Cihaz bağlamı"'],
  ['aria-label="Device level"', 'aria-label="Cihaz seviyesi"'],
  ['aria-label="Warm white"', 'aria-label="Sıcak beyaz"'],
  ['aria-label="Soft white"', 'aria-label="Yumuşak beyaz"'],
  ['aria-label="Daylight"', 'aria-label="Gün ışığı"'],
  ['aria-label="Cool blue"', 'aria-label="Soğuk mavi"'],
  ['aria-label="Local execution route"', 'aria-label="Yerel yürütme rotası"'],
  ['placeholder="Search settings and devices"', 'placeholder="Ayarları ve cihazları ara"'],
  [
    'placeholder="Try “Set a calm evening in the living room”…"',
    'placeholder="“Oturma odasında sakin bir akşam ayarla” deneyin…"',
  ],
  [
    'placeholder="Search setup, devices, agents, security, and billing…"',
    'placeholder="Kurulum, cihaz, ajan, güvenlik ve faturalamada ara…"',
  ],
  ['title="Owner · Family"', 'title="Sahip · Aile"'],
  [
    'title="Living room · 82°F · occupied · 3 local devices"',
    'title="Oturma odası · 82°F · dolu · 3 yerel cihaz"',
  ],
  ['title="Change theme"', 'title="Temayı değiştir"'],
  [
    'alt="Nest Learning Thermostat third generation"',
    'alt="Üçüncü nesil Nest Learning Thermostat"',
  ],
  ['alt="Philips Hue White A19 smart bulb"', 'alt="Philips Hue White A19 akıllı ampul"'],
  ['alt="Black Sonos One speaker"', 'alt="Siyah Sonos One hoparlör"'],
  ['alt="Roborock S4 at charging dock"', 'alt="Şarj istasyonunda Roborock S4"'],
  ['data-toast="Account menu opened"', 'data-toast="Hesap menüsü açıldı"'],
  ['data-toast="No critical notifications"', 'data-toast="Kritik bildirim yok"'],
  ['data-toast="Secure add-device flow opened"', 'data-toast="Güvenli cihaz ekleme akışı açıldı"'],
  ['data-toast="Suggestion history opened"', 'data-toast="Öneri geçmişi açıldı"'],
  ['data-toast="Energy routine draft opened"', 'data-toast="Enerji rutini taslağı açıldı"'],
  ['data-toast="Skill draft opened"', 'data-toast="Yetenek taslağı açıldı"'],
  ['data-toast="Security recommendation opened"', 'data-toast="Güvenlik önerisi açıldı"'],
  ['data-toast="Local network scan started"', 'data-toast="Yerel ağ taraması başlatıldı"'],
  ['data-toast="Skill builder opened"', 'data-toast="Yetenek oluşturucu açıldı"'],
  ['data-toast="Calm evening skill opened"', 'data-toast="Sakin akşam yeteneği açıldı"'],
  ['data-toast="Lock up skill opened"', 'data-toast="Kilitleme yeteneği açıldı"'],
  ['data-toast="Deep focus skill opened"', 'data-toast="Derin odak yeteneği açıldı"'],
  ['data-toast="Agent permissions opened"', 'data-toast="Ajan izinleri açıldı"'],
  ['data-toast="Pair-device QR opened"', 'data-toast="Cihaz eşleştirme QR kodu açıldı"'],
  ['data-toast="Family invitation opened"', 'data-toast="Aile daveti açıldı"'],
  [
    'data-toast="Experience memory explorer opened"',
    'data-toast="Deneyim hafızası gezgini açıldı"',
  ],
  [
    'data-toast="Security report export prepared"',
    'data-toast="Güvenlik raporu dışa aktarımı hazırlandı"',
  ],
  ['data-toast="Plan management opened"', 'data-toast="Plan yönetimi açıldı"'],
  ['data-toast="Update download started"', 'data-toast="Güncelleme indirmesi başladı"'],
  [
    'data-prompt="Turn off every device in the living room"',
    'data-prompt="Oturma odasındaki tüm cihazları kapat"',
  ],
  [
    'data-prompt="Explain why energy use is higher today and suggest a safe change"',
    'data-prompt="Bugün enerji kullanımının neden yüksek olduğunu açıkla ve güvenli bir değişiklik öner"',
  ],
  [
    'data-prompt="Lock up and switch everything off"',
    'data-prompt="Kilitle ve her şeyi kapat"',
  ],
  [
    'data-prompt="Why is energy use higher today?"',
    'data-prompt="Bugün enerji kullanımı neden daha yüksek?"',
  ],
  [
    'data-prompt="Create a calm evening routine"',
    'data-prompt="Sakin bir akşam rutini oluştur"',
  ],
  [
    'data-prompt="Add the selected device to a new scene"',
    'data-prompt="Seçili cihazı yeni bir sahneye ekle"',
  ],
  [
    'data-prompt="Explain the current state of this device"',
    'data-prompt="Bu cihazın mevcut durumunu açıkla"',
  ],
  ['data-label="Assistant name"', 'data-label="Asistan adı"'],
  ['data-label="Wake phrase"', 'data-label="Uyandırma ifadesi"'],
  ['data-label="Response style"', 'data-label="Yanıt stili"'],
  ['data-options="Concise|Balanced|Detailed"', 'data-options="Kısa|Dengeli|Ayrıntılı"'],
];

/**
 * Turkish dictionary for user-visible strings inside the behavior script.
 * Applied as whole `"…"`-quoted literal replacements so identifiers, DOM ids,
 * protocol/model/firmware values and event names are never touched.
 */
const TR_SCRIPT: ReadonlyArray<readonly [string, string]> = [
  // Device metadata (written into the DOM by updateDevice)
  ["Soft white smart LED · E26 · Bluetooth + Hue Bridge", "Yumuşak beyaz akıllı LED · E26 · Bluetooth + Hue Bridge"],
  ["Living room", "Oturma odası"],
  ["Lighting", "Aydınlatma"],
  ["Online · responding locally", "Çevrimiçi · yerelde yanıt veriyor"],
  ["Living room lights", "Oturma odası ışıkları"],
  ["4 bulbs grouped", "4 ampul gruplandı"],
  ["Brightness", "Parlaklık"],
  ["Hue Bridge · Strong", "Hue Bridge · Güçlü"],
  ["Power draw", "Güç tüketimi"],
  ["Changed 3 min ago", "3 dk önce değişti"],
  ["Philips Hue White A19 smart bulb", "Philips Hue White A19 akıllı ampul"],
  ["Learning climate controller · Wi-Fi · Eco cooling", "Öğrenen iklim denetleyicisi · Wi-Fi · Eko soğutma"],
  ["Climate", "İklim"],
  ["Online · Eco cooling", "Çevrimiçi · Eko soğutma"],
  ["Cooling · Eco", "Soğutma · Eko"],
  ["Target temperature", "Hedef sıcaklık"],
  ["3rd generation", "3. nesil"],
  ["Wi-Fi · Strong", "Wi-Fi · Güçlü"],
  ["24 V HVAC · 46% humidity", "24 V HVAC · %46 nem"],
  ["Indoor humidity", "İç nem"],
  ["Adjusted 8 min ago", "8 dk önce ayarlandı"],
  ["Nest Learning Thermostat third generation", "Üçüncü nesil Nest Learning Thermostat"],
  ["Wireless smart speaker · AirPlay 2 · two Class-D amplifiers", "Kablosuz akıllı hoparlör · AirPlay 2 · iki Class-D amplifikatör"],
  ["Audio", "Ses"],
  ["Online · playback paused", "Çevrimiçi · oynatma duraklatıldı"],
  ["Living room audio", "Oturma odası sesi"],
  ["Sonos One · Paused", "Sonos One · Duraklatıldı"],
  ["Volume", "Ses düzeyi"],
  ["Wi-Fi · Excellent", "Wi-Fi · Mükemmel"],
  ["Audio format", "Ses formatı"],
  ["Paused 12 min ago", "12 dk önce duraklatıldı"],
  ["Black Sonos One speaker", "Siyah Sonos One hoparlör"],
  ["Retrofit access control · Bluetooth · Bridge connectivity", "Sonradan takılan erişim kontrolü · Bluetooth · Bridge bağlantısı"],
  ["Entry", "Giriş"],
  ["Access control", "Erişim kontrolü"],
  ["Online · locked securely", "Çevrimiçi · güvenle kilitli"],
  ["Front door", "Ön kapı"],
  ["Locked · Door closed", "Kilitli · Kapı kapalı"],
  ["Battery", "Pil"],
  ["Nuki Bridge · Strong", "Nuki Bridge · Güçlü"],
  ["4 × AA · 64% remaining", "4 × AA · %64 kaldı"],
  ["Door sensor", "Kapı sensörü"],
  ["Closed", "Kapalı"],
  ["Locked 18 min ago", "18 dk önce kilitlendi"],
  ["Laser navigation robot vacuum · Wi-Fi · charging dock", "Lazer navigasyonlu robot süpürge · Wi-Fi · şarj istasyonu"],
  ["Utility", "Çamaşırlık"],
  ["Cleaning", "Temizlik"],
  ["Docked · charging", "İstasyonda · şarj oluyor"],
  ["Floor cleaning", "Zemin temizliği"],
  ["Docked · Next run 10:00", "İstasyonda · Sonraki çalışma 10:00"],
  ["Wi-Fi 2.4 GHz · Good", "Wi-Fi 2.4 GHz · İyi"],
  ["Charging · Last clean 46 m²", "Şarj oluyor · Son temizlik 46 m²"],
  ["Dock state", "İstasyon durumu"],
  ["Charging", "Şarj oluyor"],
  ["Docked 26 min ago", "26 dk önce istasyona döndü"],
  ["Roborock S4 robot vacuum at its charging dock", "Şarj istasyonunda Roborock S4 robot süpürge"],
  // Page headers (eyebrow, title) — one pair per pages-map entry
  ["Good evening, Ensar", "İyi akşamlar, Ensar"],
  ["Your home", "Eviniz"],
  ["Your home, by space", "Eviniz, alanlara göre"],
  ["Rooms", "Odalar"],
  ["Everything connected, locally", "Her şey bağlı, yerel olarak"],
  ["Devices", "Cihazlar"],
  ["Scenes, routines & suggestions", "Sahneler, rutinler ve öneriler"],
  ["Automations", "Otomasyonlar"],
  ["NEXUS AI · runs on this device", "NEXUS AI · bu cihazda çalışır"],
  ["Assistant", "Asistan"],
  ["People & access", "Kişiler ve erişim"],
  ["Household", "Ev halkı"],
  ["Security, plan & connections", "Güvenlik, plan ve bağlantılar"],
  ["Settings", "Ayarlar"],
  ["Windows distribution", "Windows dağıtımı"],
  ["Updates", "Güncellemeler"],
  ["Onboarding & diagnostics", "Başlangıç ve tanılama"],
  ["Help", "Yardım"],
  // Settings defaults (must match translated data-options)
  ["Balanced", "Dengeli"],
  // Assistant state messages
  ["Ask naturally · runs locally", "Doğal konuş · yerelde çalışır"],
  ["Listening locally…", "Yerelde dinliyor…"],
  ["Understanding · checking permissions…", "Anlıyor · izinler denetleniyor…"],
  ["Ready · 42 ms", "Hazır · 42 ms"],
  ["Couldn’t complete that locally", "Bu işlem yerelde tamamlanamadı"],
  // Device UI states
  ["Local discovery", "Yerel keşif"],
  ["Refreshing your home", "Eviniz yenileniyor"],
  ["NEXUS is checking trusted devices and capabilities on your local network.", "NEXUS, yerel ağınızdaki güvenilir cihazları ve yetenekleri denetliyor."],
  ["Try again", "Tekrar dene"],
  ["No devices found", "Cihaz bulunamadı"],
  ["Your local home is ready to connect", "Yerel eviniz bağlanmaya hazır"],
  ["Scan this network or add a device securely. Credentials and home topology remain on this PC.", "Bu ağı tarayın veya güvenle cihaz ekleyin. Kimlik bilgileri ve ev topolojisi bu bilgisayarda kalır."],
  ["Scan network", "Ağı tara"],
  ["Connection interrupted", "Bağlantı kesildi"],
  ["Selected device is offline", "Seçili cihaz çevrimdışı"],
  ["NEXUS kept the last trusted state and will reconnect without sending device data to the cloud.", "NEXUS son güvenilir durumu korudu ve cihaz verisini buluta göndermeden yeniden bağlanacak."],
  ["Retry connection", "Bağlantıyı yeniden dene"],
  ["Permission required", "İzin gerekli"],
  ["Allow local network access", "Yerel ağ erişimine izin ver"],
  ["Windows local-network permission is required to discover and control devices in your home.", "Evinizdeki cihazları keşfetmek ve kontrol etmek için Windows yerel ağ izni gerekir."],
  ["Open permissions", "İzinleri aç"],
  ["Local service unavailable", "Yerel hizmet kullanılamıyor"],
  ["NEXUS couldn’t refresh this view", "NEXUS bu görünümü yenileyemedi"],
  ["Your existing device data is safe. Retry the local service without resetting your home.", "Mevcut cihaz verileriniz güvende. Evinizi sıfırlamadan yerel hizmeti yeniden deneyin."],
  // Drawer state labels
  ["Refreshing local state…", "Yerel durum yenileniyor…"],
  ["No selected device", "Seçili cihaz yok"],
  ["Offline · Last state saved", "Çevrimdışı · Son durum kaydedildi"],
  ["Local network permission required", "Yerel ağ izni gerekli"],
  ["Device controls", "Cihaz kontrolleri"],
  // Toasts and traces
  ["The native flow is ready to continue.", "Yerel akış devam etmeye hazır."],
  ["Intent understood", "Niyet anlaşıldı"],
  ["Checking scope", "Kapsam denetleniyor"],
  ["Planning local tools", "Yerel araçlar planlanıyor"],
  ["Security scope approved", "Güvenlik kapsamı onaylandı"],
  ["Ready to execute locally", "Yerelde çalıştırmaya hazır"],
  ["NEXUS AI is ready", "NEXUS AI hazır"],
  ["All devices", "Tüm cihazlar"],
  ["By capability", "Yeteneğe göre"],
  ["NEXUS chooses the safest efficient route.", "NEXUS en güvenli ve verimli rotayı seçer."],
  ["Only deterministic skills and actions may run.", "Yalnızca deterministik yetenekler ve eylemler çalışabilir."],
  ["NEXUS may plan multiple steps with approvals.", "NEXUS onaylarla çok adımlı plan yapabilir."],
  ["Connect this button to the Electron or Tauri window bridge.", "Bu düğmeyi Electron veya Tauri pencere köprüsüne bağlayın."],
  ["Checksum copied", "Sağlama toplamı kopyalandı"],
  ["SHA-256 is ready to paste.", "SHA-256 yapıştırılmaya hazır."],
  ["Windows permissions opened", "Windows izinleri açıldı"],
  ["Allow local network access, then return to NEXUS.", "Yerel ağ erişimine izin verin, sonra NEXUS'a dönün."],
  ["Device enabled", "Cihaz etkinleştirildi"],
  ["Device paused", "Cihaz duraklatıldı"],
  ["The Security Engine approved the local action.", "Güvenlik Motoru yerel eylemi onayladı."],
  ["Light temperature updated", "Işık sıcaklığı güncellendi"],
  ["NEXUS AI is listening", "NEXUS AI dinliyor"],
  ["Speech is processed locally on this Windows PC.", "Konuşma bu Windows bilgisayarında yerel olarak işlenir."],
];

/** Template-literal fragments inside the script that carry visible words. */
const TR_SCRIPT_RAW: ReadonlyArray<readonly [string, string]> = [
  ["} is offline`", "} çevrimdışı`"],
  ["” was planned with explicit local tools.`", "” açık yerel araçlarla planlandı.`"],
  ["`Latest ${d.category.toLowerCase()} state was resolved locally over ${d.protocol}.`", "`Son ${d.category.toLowerCase()} durumu ${d.protocol} üzerinden yerelde çözüldü.`"],
  ["} mode`", "} modu`"],
  ["`Window: ${", "`Pencere: ${"],
  ["} updated`", "} güncellendi`"],
  // Mode chip label is derived from the mode id; map it to Turkish.
  [
    "next[0].toUpperCase() + next.slice(1)",
    '({ smart: "Akıllı", controlled: "Kontrollü", agent: "Ajan" })[next]',
  ],
];

/** Localizes user-visible strings in the premium behavior script for Turkish. */
export function localizePremiumScriptTr(script: string): string {
  for (const [en, tr] of TR_SCRIPT) script = script.split(`"${en}"`).join(`"${tr}"`);
  for (const [en, tr] of TR_SCRIPT_RAW) script = script.split(en).join(tr);
  return script;
}

/** Localizes the premium body markup for Turkish. */
export function localizePremiumBodyTr(html: string): string {
  for (const [en, tr] of TR_TEXT) html = replaceTextNodes(html, en, tr);
  for (const [en, tr] of TR_ATTR) html = html.split(en).join(tr);
  return html;
}

export { TR_TEXT, TR_ATTR, TR_SCRIPT, TR_SCRIPT_RAW };
