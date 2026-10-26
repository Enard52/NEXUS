// NEXUS yasal metinlerinin tek kaynağı (TR + EN). Site sayfaları ve Whop PDF'leri buradan üretilir.
// Metinler ürünün GERÇEK davranışına göre yazılmıştır; davranış değişince (örn. bulut yapay zekâ eklenince)
// burası ve yalnızca burası güncellenir, ardından scripts/site-legal.cjs yeniden çalıştırılır.
// Not: Bu metinler bir avukat tarafından hazırlanmamıştır; satış hacmi büyürse hukuki inceleme önerilir.

const EMAIL = "nexus.smarthome.app@gmail.com";
const UPDATED = { tr: "Son güncelleme: 25 Ekim 2026", en: "Last updated: 25 October 2026" };
const OPERATOR = { tr: "NEXUS", en: "NEXUS" };

const privacy = {
  tr: {
    title: "Gizlilik Politikası",
    intro:
      "NEXUS, akıllı evinizi öncelikle kendi yerel ağınızda yöneten bir uygulamadır. Bu politika, hesap açtığınızda hangi verileri, neden ve nerede işlediğimizi açıkça anlatır.",
    sections: [
      {
        h: "Kısaca",
        ul: [
          "NEXUS'u kullanmak için hesap gerekir. Cihaz komutları yine yerel ağınızda çalışır; üretici bulutuna gönderilmez.",
          "Ayarlarınız, cihaz listeniz ve sohbet geçmişiniz her cihazda aynı olsun diye bulutta saklanır.",
          "Verilerinizi satmayız, reklam için kullanmayız, sizi profillemeyiz.",
          "Mikrofonu kullanmayız, ses kaydı almayız. Kamera yalnızca QR kod taramak için açılır ve görüntü cihazınızdan çıkmaz.",
        ],
      },
      { h: "Veri sorumlusu", p: [`Veri sorumlusu ${OPERATOR.tr}. İletişim: ${EMAIL}`] },
      {
        h: "Hangi verileri işliyoruz",
        ul: [
          "Hesap: e-posta adresiniz ve (varsa) adınız. Google ile girişte Google'ın verdiği e-posta ve profil adı. Şifreniz tek yönlü karma (hash) olarak Supabase Auth'ta tutulur; bize düz metin olarak görünmez.",
          "Senkronize uygulama verisi (yalnızca hesapla giriş yaptığınızda): profil adı ve fotoğrafı, tema/dil/birim ayarları, aile üyeleri, sahneler ve otomasyonlar, favori kartlar, NEXUS AI sohbet geçmişi ve kullanım sayacı, olay günlüğü, ev konumu/hava durumu tercihi ve eklediğiniz cihazların listesi (ad, oda, protokol, yerel ağ adresi, son durum).",
          "Abonelik (NEXUS+ satın aldıysanız): e-posta, plan, durum, dönem sonu ve Whop üyelik kimliği. Kart bilgileriniz yalnızca Whop'ta işlenir, bize ulaşmaz.",
          "Destek yazışmaları: bize yazdığınızda e-postanız ve mesajınız.",
          "Teknik kayıtlar: giriş ve hata günlükleri (IP adresi dahil) barındırma ve kimlik doğrulama sağlayıcılarımızda kısa süre tutulur.",
        ],
      },
      {
        h: "Hangi amaçla ve hukuki dayanak",
        p: [
          "Hesabınızı yönetmek, verilerinizi cihazlarınız arasında eşitlemek, aboneliğinizi sunmak ve size destek vermek için (sözleşmenin ifası); güvenliği sağlamak ve kötüye kullanımı önlemek için (meşru menfaat); yurt dışına aktarım için açık rızanız (aşağıya bakın).",
        ],
      },
      {
        h: "NEXUS AI",
        p: [
          "NEXUS AI iki parçadan oluşur. (1) Cihaz komutları (ışık açma, senaryo çalıştırma, durum sorma gibi) cihazınızda yerel olarak işlenir ve buluta gönderilmez. (2) Komut olmayan sohbet mesajlarınız ve soru-cevap istekleriniz yanıtlanmak üzere Cloudflare Workers AI hizmetine gönderilir; bununla birlikte cihaz adlarınız, türleriniz ve odalarınız bağlam olarak iletilir. Hesap bilgileriniz, e-postanız ve konumunuz iletilmez. Bu içerikleri yapay zekâ modellerini eğitmek için kullanmayız; Cloudflare ise hizmeti sunmak için işler. Gizlilik istiyorsanız sohbette yalnızca cihaz komutları kullanabilirsiniz. Sohbet geçmişiniz, hesapla giriş yaptıysanız diğer ayarlarınız gibi hesabınızla eşitlenir.",
        ],
      },
      {
        h: "Hizmet sağlayıcılar ve aktarımlar",
        ul: [
          "Supabase: kimlik doğrulama, veritabanı ve sistem e-postaları.",
          "Cloudflare: web sitesi ve web uygulamasının barındırılması; NEXUS AI sohbet yanıtları için Cloudflare Workers AI.",
          "Whop: abonelik ödemeleri ve fatura.",
          "Google: Google ile giriş ve (Gmail üzerinden) doğrulama/şifre sıfırlama e-postaları.",
          "GitHub: kurulum dosyalarının dağıtımı.",
          "Open-Meteo: hava durumu için şehir/yaklaşık koordinat bilgisi.",
          "OpenStreetMap / Nominatim: harita ve konum araması; Unsplash: bazı yedek görseller.",
        ],
        p: [
          "Bu sağlayıcıların sunucuları Türkiye dışında olabilir. Hesap açarak ve/veya ödeme yaparak verilerinizin bu sağlayıcılara ve yurt dışına aktarılmasına açık rıza vermiş olursunuz; rızanızı hesabınızı sildirerek geri alabilirsiniz.",
        ],
      },
      {
        h: "Çerezler ve izleme",
        p: [
          "Web sitemiz çerez kullanmaz ve analitik/reklam izleyicisi içermez. Uygulama, ayarlarınızı cihazınızın yerel depolamasında (localStorage) tutar.",
        ],
      },
      {
        h: "Saklama ve silme",
        p: [
          "Verilerinizi hesabınız açık olduğu sürece saklarız. Hesabınızın ve verilerinizin silinmesi için " +
            EMAIL +
            " adresine yazın; talebinizi en geç 30 gün içinde yerine getiririz (yasal saklama yükümlülüğü olan abonelik kayıtları hariç). Uygulamada hesap silme düğmesi henüz yoktur.",
        ],
      },
      {
        h: "Haklarınız",
        p: [
          "6698 sayılı KVKK m.11 ve (uygulanıyorsa) GDPR kapsamında: verilerinizin işlenip işlenmediğini öğrenme, erişim, düzeltme, silme, işlemeye itiraz ve taşınabilirlik haklarına sahipsiniz. Başvuru için " +
            EMAIL +
            " adresine yazın. Kişisel Verileri Koruma Kurulu'na şikâyet hakkınız saklıdır.",
        ],
      },
      {
        h: "Güvenlik",
        p: [
          "Bağlantılar TLS ile şifrelenir. Veritabanında satır bazlı erişim denetimi vardır: her kullanıcı yalnızca kendi verisini okuyabilir ve yazabilir. Hiçbir sistem tamamen güvenli değildir; güçlü bir şifre kullanmanızı ve cihazlarınızı güncel tutmanızı öneririz.",
        ],
      },
      {
        h: "Üçüncü taraf cihazlar",
        p: [
          "Bağladığınız akıllı cihazlar (ör. Shelly, WLED, ESPHome) kendi üreticilerinin sunucularıyla kendi gizlilik politikalarına göre haberleşebilir. NEXUS verilerinizi bu üreticilerle paylaşmaz.",
        ],
      },
      {
        h: "Çocuklar",
        p: [
          "NEXUS 13 yaşın altındaki çocuklara yönelik değildir ve onlardan bilerek veri toplamayız.",
        ],
      },
      {
        h: "Değişiklikler",
        p: [
          "Bu politikayı güncelleyebiliriz; önemli değişiklikleri uygulama veya site üzerinden duyururuz.",
        ],
      },
      { h: "İletişim", p: [`Sorularınız için: ${EMAIL}`] },
    ],
  },
  en: {
    title: "Privacy Policy",
    intro:
      "NEXUS manages your smart home primarily on your own local network. This policy explains clearly what data we process, why and where when you create an account.",
    sections: [
      {
        h: "In short",
        ul: [
          "An account is required to use NEXUS. Device commands still run on your local network; they are not sent through a vendor cloud.",
          "Your settings, device list and chat history are stored in the cloud so they match on every device.",
          "We do not sell your data, use it for advertising or profile you.",
          "We never use the microphone or record audio. The camera opens only to scan QR codes and the image never leaves your device.",
        ],
      },
      { h: "Data controller", p: [`The data controller is ${OPERATOR.en}. Contact: ${EMAIL}`] },
      {
        h: "What data we process",
        ul: [
          "Account: your email address and (if provided) your name. With Google sign-in, the email and profile name Google provides. Your password is stored only as a one-way hash in Supabase Auth; we cannot see it.",
          "Synced app data (only when signed in): profile name and photo, theme/language/unit settings, household members, scenes and automations, favourite cards, NEXUS AI chat history and usage counter, event log, home location/weather preference and the list of devices you added (name, room, protocol, local network address, last state).",
          "Subscription (if you bought NEXUS+): email, plan, status, period end and Whop membership ID. Your card details are processed only by Whop and never reach us.",
          "Support messages: your email and message when you write to us.",
          "Technical logs: sign-in and error logs (including IP address) kept briefly by our hosting and authentication providers.",
        ],
      },
      {
        h: "Purposes and legal bases",
        p: [
          "To manage your account, sync your data across devices, provide your subscription and give support (performance of a contract); to keep the service secure and prevent abuse (legitimate interest); and for transfers abroad, your explicit consent (see below).",
        ],
      },
      {
        h: "NEXUS AI",
        p: [
          "NEXUS AI has two parts. (1) Device commands (turn on a light, run a scene, ask for status) are processed locally on your device and are not sent to the cloud. (2) Messages that are not device commands, such as general chat and questions, are sent to Cloudflare Workers AI to be answered; the names, types and rooms of your devices are included as context. Your account details, email and location are not sent. We do not use this content to train AI models; Cloudflare processes it to provide the service. If you prefer, you can use only device commands in the chat. If you are signed in, your chat history syncs with your account like your other settings.",
        ],
      },
      {
        h: "Service providers and transfers",
        ul: [
          "Supabase: authentication, database and system emails.",
          "Cloudflare: hosting of the website and web app; Cloudflare Workers AI for NEXUS AI chat answers.",
          "Whop: subscription payments and invoicing.",
          "Google: Google sign-in and (via Gmail) verification / password-reset emails.",
          "GitHub: distribution of installers.",
          "Open-Meteo: city / approximate coordinates for weather.",
          "OpenStreetMap / Nominatim: maps and place search; Unsplash: some fallback images.",
        ],
        p: [
          "These providers' servers may be outside Türkiye. By creating an account and/or paying you give explicit consent to your data being transferred to them and abroad; you can withdraw consent by having your account deleted.",
        ],
      },
      {
        h: "Cookies and tracking",
        p: [
          "Our website uses no cookies and contains no analytics or advertising trackers. The app keeps your settings in your device's local storage (localStorage).",
        ],
      },
      {
        h: "Retention and deletion",
        p: [
          "We keep your data while your account is open. To delete your account and data, write to " +
            EMAIL +
            "; we will complete the request within 30 days (except subscription records we must keep by law). The app does not yet have a delete-account button.",
        ],
      },
      {
        h: "Your rights",
        p: [
          "Under Turkish Law No. 6698 (KVKK) art. 11 and, where applicable, the GDPR, you may ask whether your data is processed, access it, correct it, have it deleted, object to processing and request portability. Write to " +
            EMAIL +
            ". You may also complain to the Turkish Personal Data Protection Authority.",
        ],
      },
      {
        h: "Security",
        p: [
          "Connections are encrypted with TLS. The database enforces row-level access control: each user can read and write only their own data. No system is perfectly secure; we recommend a strong password and keeping your devices up to date.",
        ],
      },
      {
        h: "Third-party devices",
        p: [
          "Smart devices you connect (e.g. Shelly, WLED, ESPHome) may talk to their manufacturers' servers under their own privacy policies. NEXUS does not share your data with those manufacturers.",
        ],
      },
      {
        h: "Children",
        p: [
          "NEXUS is not directed to children under 13 and we do not knowingly collect their data.",
        ],
      },
      {
        h: "Changes",
        p: [
          "We may update this policy; we will announce significant changes in the app or on the website.",
        ],
      },
      { h: "Contact", p: [`Questions: ${EMAIL}`] },
    ],
  },
};

const terms = {
  tr: {
    title: "Kullanım Şartları",
    intro: `NEXUS uygulamasını ve ilgili hizmetleri (“Hizmetler”) indirerek, kurarak veya kullanarak bu şartları kabul etmiş olursunuz. Hizmetleri sunan: ${OPERATOR.tr}. İletişim: ${EMAIL}`,
    sections: [
      {
        h: "Lisans",
        p: [
          "Size, NEXUS yazılımını sahibi olduğunuz veya kontrol ettiğiniz cihazlarda kişisel ve ticari olmayan ev otomasyonu amacıyla kullanmanız için kişisel, münhasır olmayan, devredilemez ve iptal edilebilir bir lisans veriyoruz. Yazılımı dağıtamaz, kiralayamaz, satamaz, alt lisanslayamaz, tersine mühendislik yapamaz veya NEXUS ile doğrudan rekabet eden bir ürün geliştirmek için kullanamazsınız. Üçüncü taraf bileşenler kendi lisanslarına tabidir.",
        ],
      },
      {
        h: "Hesap",
        p: [
          "NEXUS'u kullanmak için hesap gerekir. Bilgilerinizi doğru tutmak ve şifrenizi korumak sizin sorumluluğunuzdadır. Hesabınızla yapılan işlemlerden siz sorumlusunuz. Şartlara aykırı kullanımda hesabı askıya alma veya kapatma hakkımızı saklı tutarız.",
        ],
      },
      {
        h: "Akıllı ev güvenliği",
        ul: [
          "NEXUS bir konfor aracıdır; yangın, gaz, sağlık veya can güvenliği gibi kritik işlevler için tek başına güvenilmemelidir.",
          "Cihazlarınıza gönderilen komutlar ve ağınızın güvenliği sizin sorumluluğunuzdadır. Cihaz yazılımlarını ve yönlendirici ayarlarınızı güncel tutun.",
          "Güvenlik amacıyla kilitler sohbetten açılmaz.",
        ],
      },
      {
        h: "NEXUS AI ve krediler",
        p: [
          "Ücretsiz planda günde 30, NEXUS+ aboneliğinde ayda 2.000 NEXUS AI kredisi verilir. Krediler devredilemez, nakde çevrilemez ve dönem sonunda sıfırlanır. NEXUS AI hata yapabilir; sonuçları kontrol etmek sizin sorumluluğunuzdadır.",
        ],
      },
      {
        h: "NEXUS+ aboneliği",
        ul: [
          "Planlar: Aylık ve Yıllık. Türkiye için TL, diğer ülkeler için USD fiyatlı planlar sunulur (şu an Aylık ₺499,99 / $11.99, Yıllık ₺3.999,99 / $89.99). Güncel fiyatlar ödeme sayfasında gösterilir; vergiler ödeme sayfasında eklenebilir. Yıllık planda 7 gün, aylık planda 3 gün ücretsiz deneme sunulur.",
          "Ödemeler Whop üzerinden alınır. Abonelik, siz iptal edene kadar her dönem otomatik yenilenir; deneme süresi bitince seçtiğiniz plan ücreti tahsil edilir.",
          "Aboneliğinizi dilediğiniz an uygulamadaki Faturalandırma sayfasından veya bu sitedeki hesabınızdan iptal edebilirsiniz. İptal, içinde bulunduğunuz dönemin sonunda geçerli olur.",
          "Ödemede NEXUS hesabınızın e-posta adresini kullanmalısınız; abonelik bu e-postayla eşleşir.",
          "Fiyat değişikliklerini yürürlüğe girmeden en az 30 gün önce duyururuz; mevcut dönemi etkilemez.",
          "İade koşulları İade ve İptal Politikası'nda yer alır.",
        ],
      },
      {
        h: "Hizmet değişiklikleri ve kesintiler",
        p: [
          "Hizmetleri geliştirebilir, değiştirebilir veya bakım için geçici olarak durdurabiliriz. Hizmetin kesintisiz veya hatasız olacağını garanti etmeyiz.",
        ],
      },
      {
        h: "Fikri mülkiyet",
        p: [
          "NEXUS yazılımı, tasarımı, markası ve içerikleri üzerindeki haklar işletmeciye aittir. Bu şartlar size yalnızca yukarıdaki lisansı verir.",
        ],
      },
      {
        h: "Sorumluluğun sınırı",
        p: [
          "Yazılım “olduğu gibi” sunulur. Kanunun izin verdiği azami ölçüde, Hizmetlerin kullanımından doğan dolaylı zararlardan (veri kaybı, cihaz veya mal hasarı dahil) sorumlu değiliz; toplam sorumluluğumuz, son 12 ayda bize ödediğiniz tutarla sınırlıdır. Tüketici mevzuatından doğan ve sınırlanamayan haklarınız saklıdır.",
        ],
      },
      {
        h: "Fesih",
        p: [
          "Hesabınızı dilediğiniz an kapatabilirsiniz (bkz. Gizlilik Politikası). Şartlara aykırı kullanımda erişiminizi sonlandırabiliriz.",
        ],
      },
      {
        h: "Uygulanacak hukuk",
        p: [
          "Bu şartlara Türkiye Cumhuriyeti hukuku uygulanır. Tüketici olarak, tüketici hakem heyetlerine ve tüketici mahkemelerine başvuru hakkınız saklıdır.",
        ],
      },
      {
        h: "Değişiklikler",
        p: [
          "Şartları güncelleyebiliriz; önemli değişiklikleri uygulama veya site üzerinden duyururuz. Değişiklikten sonra Hizmetleri kullanmaya devam etmeniz yeni şartları kabul ettiğiniz anlamına gelir.",
        ],
      },
      { h: "İletişim", p: [EMAIL] },
    ],
  },
  en: {
    title: "Terms of Service",
    intro: `By downloading, installing or using the NEXUS app and related services (the “Services”) you accept these terms. The Services are provided by ${OPERATOR.en}. Contact: ${EMAIL}`,
    sections: [
      {
        h: "Licence",
        p: [
          "We grant you a personal, non-exclusive, non-transferable, revocable licence to use the NEXUS software on devices you own or control, for personal, non-commercial home automation. You may not distribute, lease, sell, sub-license, reverse-engineer it, or use it to build a product that directly competes with NEXUS. Third-party components are subject to their own licences.",
        ],
      },
      {
        h: "Account",
        p: [
          "Using NEXUS requires an account. You are responsible for keeping your details accurate and your password safe, and for activity under your account. We may suspend or close accounts that breach these terms.",
        ],
      },
      {
        h: "Smart home safety",
        ul: [
          "NEXUS is a convenience tool; do not rely on it alone for critical functions such as fire, gas, health or life safety.",
          "You are responsible for the commands sent to your devices and for the security of your network. Keep device firmware and router settings up to date.",
          "For safety, locks cannot be opened from chat.",
        ],
      },
      {
        h: "NEXUS AI and credits",
        p: [
          "The free plan includes 30 NEXUS AI credits per day; a NEXUS+ subscription includes 2,000 per month. Credits are non-transferable, cannot be exchanged for cash and reset at the end of the period. NEXUS AI can make mistakes; checking results is your responsibility.",
        ],
      },
      {
        h: "NEXUS+ subscription",
        ul: [
          "Plans: Monthly and Yearly, priced in TRY for Türkiye and in USD elsewhere (currently Monthly ₺499.99 / $11.99, Yearly ₺3,999.99 / $89.99). Current prices are shown at checkout; taxes may be added at checkout. The yearly plan includes a 7-day free trial and the monthly plan a 3-day free trial.",
          "Payments are taken through Whop. The subscription renews automatically each period until you cancel; when the trial ends your chosen plan's price is charged.",
          "You can cancel at any time from Billing in the app or from your account on this website. Cancellation takes effect at the end of the current period.",
          "At checkout use your NEXUS account's email address; the subscription is matched to that email.",
          "We announce price changes at least 30 days before they take effect; they do not affect the current period.",
          "Refund terms are in the Refund and Cancellation Policy.",
        ],
      },
      {
        h: "Changes and interruptions",
        p: [
          "We may improve, change or temporarily suspend the Services for maintenance. We do not guarantee uninterrupted or error-free service.",
        ],
      },
      {
        h: "Intellectual property",
        p: [
          "Rights in the NEXUS software, design, brand and content belong to the operator. These terms give you only the licence above.",
        ],
      },
      {
        h: "Limitation of liability",
        p: [
          "The software is provided “as is”. To the maximum extent permitted by law we are not liable for indirect damages (including data loss or damage to devices or property) arising from use of the Services; our total liability is limited to the amount you paid us in the previous 12 months. Consumer rights that cannot be limited by law are unaffected.",
        ],
      },
      {
        h: "Termination",
        p: [
          "You may close your account at any time (see the Privacy Policy). We may end your access if you breach these terms.",
        ],
      },
      {
        h: "Governing law",
        p: [
          "These terms are governed by the laws of the Republic of Türkiye. As a consumer you keep the right to apply to consumer arbitration committees and consumer courts.",
        ],
      },
      {
        h: "Changes to these terms",
        p: [
          "We may update these terms and will announce significant changes in the app or on the website. Continuing to use the Services after a change means you accept the new terms.",
        ],
      },
      { h: "Contact", p: [EMAIL] },
    ],
  },
};

const refund = {
  tr: {
    title: "İade ve İptal Politikası",
    intro:
      "Bu politika NEXUS+ aboneliği için deneme, iptal ve iade koşullarını açıklar. Yasal tüketici haklarınız saklıdır.",
    sections: [
      {
        h: "Ücretsiz deneme",
        p: [
          "Yıllık planda 7 gün, aylık planda 3 gün ücretsiz deneme vardır. Deneme bitmeden iptal ederseniz hiçbir ücret alınmaz. İptal etmezseniz deneme sonunda seçtiğiniz plan ücreti tahsil edilir.",
        ],
      },
      {
        h: "Nasıl iptal edilir",
        ul: [
          "Uygulamada: Plus → Faturalandırma → Dönem sonunda iptal et.",
          "Web sitesinde: giriş yap → hesap → dönem sonunda iptal et.",
          "İptal, içinde bulunduğunuz ödeme döneminin sonunda geçerli olur; o zamana kadar NEXUS+ özelliklerini kullanmaya devam edersiniz ve yeni dönem için ücret alınmaz.",
        ],
      },
      {
        h: "İade",
        ul: [
          "İlk ücretlendirmeden itibaren 14 gün içinde, nedeni belirtmeden iade talep edebilirsiniz; ödemenin tamamını iade ederiz.",
          "Otomatik yenilemelerde, yenileme tarihinden itibaren 3 gün içinde talep ederseniz o dönemin ücretini iade ederiz.",
          "Bu sürelerin dışında, kullanılmış dönemler için kısmi iade yapılmaz; ancak hizmetin bize bağlı bir hata nedeniyle kullanılamaması gibi haklı durumlarda iade değerlendirilir.",
          "Kötüye kullanım (ör. aynı hesapla tekrarlayan iade) tespit edilirse talebi reddetme hakkımızı saklı tutarız.",
        ],
      },
      {
        h: "İade nasıl talep edilir",
        p: [
          `${EMAIL} adresine NEXUS hesabınızın e-postasını ve talebinizi yazın. Onaylanan iadeler Whop üzerinden orijinal ödeme yöntemine yapılır; tutarın hesabınıza yansıması bankanıza göre genellikle 5–10 iş günü sürer.`,
        ],
      },
      {
        h: "Yasal haklar",
        p: [
          "Bu politika, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamındaki yasal haklarınızı (cayma hakkı ve istisnaları dahil) sınırlamaz.",
        ],
      },
      { h: "İletişim", p: [EMAIL] },
    ],
  },
  en: {
    title: "Refund and Cancellation Policy",
    intro:
      "This policy explains trial, cancellation and refund terms for the NEXUS+ subscription. Your statutory consumer rights are unaffected.",
    sections: [
      {
        h: "Free trial",
        p: [
          "The yearly plan includes a 7-day free trial and the monthly plan a 3-day free trial. If you cancel before the trial ends you are not charged. If you do not cancel, your chosen plan's price is charged when the trial ends.",
        ],
      },
      {
        h: "How to cancel",
        ul: [
          "In the app: Plus → Billing → Cancel at period end.",
          "On the website: sign in → account → cancel at period end.",
          "Cancellation takes effect at the end of the current billing period; you keep NEXUS+ features until then and are not charged for the next period.",
        ],
      },
      {
        h: "Refunds",
        ul: [
          "You may request a refund within 14 days of your first charge without giving a reason; we refund the full payment.",
          "For automatic renewals, if you ask within 3 days of the renewal date we refund that period's charge.",
          "Outside these windows we do not refund used periods, but we will consider refunds in justified cases such as the service being unusable because of a fault on our side.",
          "We may refuse a request if we detect abuse (for example repeated refunds on the same account).",
        ],
      },
      {
        h: "How to request a refund",
        p: [
          `Email ${EMAIL} with your NEXUS account email and your request. Approved refunds are issued through Whop to the original payment method; it usually takes 5–10 business days to appear, depending on your bank.`,
        ],
      },
      {
        h: "Statutory rights",
        p: [
          "This policy does not limit your statutory rights under Turkish Consumer Protection Law No. 6502 and the Distance Contracts Regulation (including the right of withdrawal and its exceptions).",
        ],
      },
      { h: "Contact", p: [EMAIL] },
    ],
  },
};

module.exports = { EMAIL, UPDATED, docs: { privacy, terms, refund } };
