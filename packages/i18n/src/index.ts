/**
 * Nexus AI — Internationalization (FAZ 13)
 *
 * Message catalogs, locale resolution and locale-aware formatting. All
 * user-facing text is looked up by key so the interface, AI responses and
 * voice layer stay consistent when the language changes (FAZ 13 Bitiş Kriteri).
 *
 * Also resolves a browser `Accept-Language` header to a supported locale, which
 * the web Download Center uses to open in the visitor's language automatically
 * (FAZ 10 ↔ FAZ 18 link). Uses the platform Intl API for number/date/currency,
 * so multi-currency and regional formats work without extra dependencies.
 */

export type Locale = "en" | "tr";
export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "tr"];
export const DEFAULT_LOCALE: Locale = "en";

export type MessageKey =
  | "app.greeting"
  | "app.confirmNeeded"
  | "download.title"
  | "download.primaryButton"
  | "download.otherOs"
  | "download.checksum"
  | "screen.today"
  | "screen.homeState"
  | "screen.suggestions"
  | "screen.skills"
  | "screen.family"
  | "screen.devices"
  | "screen.platform"
  | "screen.agents"
  | "screen.agents.empty"
  | "screen.personalization"
  | "screen.billing"
  | "screen.downloadCenter"
  | "screen.adminDashboard"
  | "today.devicesOnline"
  | "today.energy"
  | "today.activeRoutines"
  | "today.suggestions"
  | "screen.devices.empty"
  | "screen.suggestions.empty"
  | "screen.skills.empty"
  | "screen.homeState.empty"
  | "plan.free"
  | "plan.premium"
  | "plan.family"
  | "billing.manage"
  // Authentication & signed-in shell (FAZ 14/18)
  | "auth.tagline"
  | "auth.signInTitle"
  | "auth.signUpTitle"
  | "auth.email"
  | "auth.password"
  | "auth.signInButton"
  | "auth.signUpButton"
  | "auth.switchToSignUp"
  | "auth.switchToSignIn"
  | "auth.passwordHint"
  | "auth.genericError"
  | "auth.locked"
  | "auth.rateLimited"
  | "auth.logout"
  | "auth.welcome"
  | "auth.continue"
  | "auth.guest"
  | "auth.guestHint"
  // Social / federated sign-in (Section H)
  | "auth.social.divider"
  | "auth.social.google"
  | "auth.social.apple"
  | "auth.social.unavailable"
  | "auth.social.error"
  // Marketing & Landing Page
  | "mkt.nav.features"
  | "mkt.nav.preview"
  | "mkt.nav.download"
  | "mkt.nav.faq"
  | "mkt.nav.signIn"
  | "mkt.hero.badge"
  | "mkt.hero.title"
  | "mkt.hero.desc"
  | "mkt.hero.actionPrimary"
  | "mkt.hero.actionSecondary"
  | "mkt.hero.trust"
  | "mkt.stats.title"
  | "mkt.stats.users"
  | "mkt.stats.devices"
  | "mkt.stats.privacy"
  | "mkt.stats.rating"
  | "mkt.privacy.title"
  | "mkt.privacy.processing"
  | "mkt.privacy.encryption"
  | "mkt.privacy.logging"
  | "mkt.how.title"
  | "mkt.how.step1.title"
  | "mkt.how.step1.desc"
  | "mkt.how.step2.title"
  | "mkt.how.step2.desc"
  | "mkt.how.step3.title"
  | "mkt.how.step3.desc"
  | "mkt.preview.title"
  | "mkt.preview.desc"
  | "mkt.preview.tab.today"
  | "mkt.preview.tab.devices"
  | "mkt.preview.tab.skills"
  | "mkt.preview.tab.family"
  | "mkt.download.mobile.title"
  | "mkt.download.mobile.desc"
  | "mkt.download.mobile.apple"
  | "mkt.download.mobile.appleStore"
  | "mkt.download.mobile.google"
  | "mkt.download.mobile.googlePlay"
  | "mkt.download.mobile.soon"
  | "mkt.seo.title"
  | "mkt.seo.desc"
  | "mkt.skipToContent"
  | "mkt.pricing.title"
  | "mkt.pricing.free"
  | "mkt.pricing.freeDesc"
  | "mkt.pricing.premium"
  | "mkt.pricing.premiumDesc"
  | "mkt.pricing.family"
  | "mkt.pricing.familyDesc"
  | "mkt.pricing.cta"
  | "mkt.testimonials.title"
  | "mkt.testimonials.quote1"
  | "mkt.integrations.title"
  | "mkt.changelog.title"
  | "mkt.requirements.title"
  | "mkt.requirements.desc"
  | "mkt.footer.desc"
  | "mkt.footer.product"
  | "mkt.footer.company"
  | "mkt.footer.about"
  | "mkt.footer.privacy"
  | "mkt.footer.terms"
  | "mkt.footer.noCookies"
  | "mkt.cookie.title"
  | "mkt.cookie.desc"
  | "mkt.cookie.accept"
  | "mkt.cookie.decline"
  | "mkt.feat.why"
  | "mkt.feat.1.title"
  | "mkt.feat.1.desc"
  | "mkt.feat.2.title"
  | "mkt.feat.2.desc"
  | "mkt.feat.3.title"
  | "mkt.feat.3.desc"
  | "mkt.feat.4.title"
  | "mkt.feat.4.desc"
  | "mkt.faq.title"
  | "mkt.faq.1.q"
  | "mkt.faq.1.a"
  | "mkt.faq.2.q"
  | "mkt.faq.2.a"
  | "mkt.faq.3.q"
  | "mkt.faq.3.a"
  | "mkt.faq.4.q"
  | "mkt.faq.4.a"
  | "mkt.desktop.eyebrow"
  | "mkt.desktop.title"
  | "mkt.desktop.desc"
  | "mkt.desktop.windows"
  | "mkt.desktop.windowsDesc"
  | "mkt.desktop.macos"
  | "mkt.desktop.macosDesc"
  | "mkt.desktop.linux"
  | "mkt.desktop.linuxDesc"
  | "mkt.desktop.download"
  | "mkt.mobile.eyebrow"
  | "mkt.mobile.title"
  | "mkt.mobile.desc"
  | "mkt.mobile.feat1.title"
  | "mkt.mobile.feat1.desc"
  | "mkt.mobile.feat2.title"
  | "mkt.mobile.feat2.desc"
  | "mkt.mobile.feat3.title"
  | "mkt.mobile.feat3.desc"
  | "mkt.mobile.feat4.title"
  | "mkt.mobile.feat4.desc"
  | "mkt.cta.title"
  | "mkt.cta.desc"
  | "mkt.cta.button"
  | "mkt.footer.platforms"
  // Dynamic keys added from mock data
  | "Dim living room lights"
  | "Start morning news briefing"
  | "Movie night"
  | "Good morning"
  | "Leaving home"
  | "status.pctOnline"
  | "status.offlineCount"
  | "status.allOnline"
  | "status.suggestionReady"
  | "status.suggestionsReady"
  | "status.caughtUp"
  | "status.onlineOfTotal";

type Catalog = Record<MessageKey, string>;

export const CATALOGS: Record<Locale, Catalog> = {
  en: {
    "app.greeting": "Hi {name}, how can I help?",
    "app.confirmNeeded": "{name}, that action needs your confirmation.",
    "download.title": "Download NEXUS",
    "download.primaryButton": "Download for {os}",
    "download.otherOs": "Using a different operating system?",
    "download.checksum": "SHA-256 checksum",
    "screen.today": "Today",
    "screen.homeState": "Home",
    "screen.suggestions": "Suggestions",
    "screen.skills": "Skills",
    "screen.family": "Family",
    "screen.devices": "Devices",
    "screen.platform": "Platforms",
    "screen.agents": "Agents",
    "screen.personalization": "Personalization",
    "screen.billing": "Subscription",
    "screen.downloadCenter": "Download",
    "screen.adminDashboard": "Admin Dashboard",
    "today.devicesOnline": "Devices online",
    "today.energy": "Energy today",
    "today.activeRoutines": "Active routines",
    "today.suggestions": "Suggestions",
    "screen.devices.empty": "No devices connected yet.",
    "screen.agents.empty": "No agents configured yet.",
    "screen.suggestions.empty": "No suggestions yet — NEXUS AI is still learning.",
    "screen.skills.empty": "No skills learned yet.",
    "screen.homeState.empty": "No rooms with devices yet.",
    "plan.free": "Free",
    "plan.premium": "Premium",
    "plan.family": "Family",
    "billing.manage": "Manage subscription",
    "auth.tagline": "Your personal operating system for home",
    "auth.signInTitle": "Sign in to NEXUS",
    "auth.signUpTitle": "Create your NEXUS account",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.signInButton": "Sign in",
    "auth.signUpButton": "Create account",
    "auth.switchToSignUp": "New here? Create an account",
    "auth.switchToSignIn": "Already have an account? Sign in",
    "auth.passwordHint": "At least 8 characters",
    "auth.genericError": "Something went wrong. Please try again.",
    "auth.locked": "Too many failed attempts. Try again in {time}.",
    "auth.rateLimited": "Too many requests. Please try again later.",
    "auth.logout": "Sign out",
    "auth.welcome": "Welcome, {name}",
    "auth.continue": "Continue",
    "auth.guest": "Continue as guest",
    "auth.guestHint": "Explore NEXUS without an account",
    "auth.social.divider": "or continue with email",
    "auth.social.google": "Continue with Google",
    "auth.social.apple": "Continue with Apple",
    "auth.social.unavailable": "This sign-in method isn't set up yet.",
    "auth.social.error": "Sign-in with that provider failed. Please try again.",
    "mkt.nav.features": "Features",
    "mkt.nav.preview": "Preview",
    "mkt.nav.download": "Download",
    "mkt.nav.faq": "FAQ",
    "mkt.nav.signIn": "Sign In",
    "mkt.hero.badge": "v{version} · Windows · macOS · Linux",
    "mkt.hero.title": "Download NEXUS for every device you own",
    "mkt.hero.desc":
      "NEXUS is a voice-first, privacy-focused personal operating system. Install the desktop app or the mobile companion and control every device from one place — 100% on-device. You use it from the real app, not the browser.",
    "mkt.hero.actionPrimary": "Download for {os} · v{version}",
    "mkt.hero.actionSecondary": "See it in action",
    "mkt.hero.trust": "★ 500,000+ users · 2000+ smart devices · 100% local privacy",
    "mkt.stats.title": "NEXUS in numbers",
    "mkt.stats.users": "Active users",
    "mkt.stats.devices": "Supported devices",
    "mkt.stats.privacy": "On-device privacy",
    "mkt.stats.rating": "Average rating",
    "mkt.privacy.title": "Your data is yours",
    "mkt.privacy.processing": "100% on-device processing",
    "mkt.privacy.encryption": "End-to-end local encryption",
    "mkt.privacy.logging": "Zero cloud logging",
    "mkt.how.title": "How it works",
    "mkt.how.step1.title": "Download",
    "mkt.how.step1.desc": "Download the app for your platform.",
    "mkt.how.step2.title": "Install",
    "mkt.how.step2.desc": "Complete the local setup in seconds.",
    "mkt.how.step3.title": "Connect devices",
    "mkt.how.step3.desc": "Start managing your smart home securely.",
    "mkt.preview.title": "See NEXUS in action",
    "mkt.preview.desc": "A live look at the real dashboard you get the moment you install the app.",
    "mkt.preview.tab.today": "Today",
    "mkt.preview.tab.devices": "Devices",
    "mkt.preview.tab.skills": "Routines",
    "mkt.preview.tab.family": "Family",
    "mkt.download.mobile.title": "Mobile apps",
    "mkt.download.mobile.desc": "iOS and Android apps are on the way.",
    "mkt.download.mobile.apple": "Download on the",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "Get it on",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "Soon",
    "mkt.seo.title": "NEXUS — Download your personal operating system",
    "mkt.seo.desc": "Download NEXUS for Windows, macOS and Linux. iOS and Android coming soon.",
    "mkt.skipToContent": "Skip to content",
    "mkt.pricing.title": "Simple, transparent pricing",
    "mkt.pricing.free": "Free",
    "mkt.pricing.freeDesc": "Everything you need for a local smart home.",
    "mkt.pricing.premium": "Premium",
    "mkt.pricing.premiumDesc": "Advanced AI processing and remote access.",
    "mkt.pricing.family": "Family",
    "mkt.pricing.familyDesc": "Up to 5 accounts with full access control.",
    "mkt.pricing.cta": "Start for free",
    "mkt.testimonials.title": "Loved by smart home enthusiasts",
    "mkt.testimonials.quote1":
      "NEXUS completely changed how I interact with my home. It's so much faster when everything is local.",
    "mkt.integrations.title": "Works with your favorite devices",
    "mkt.changelog.title": "What's new in v3.14.2",
    "mkt.requirements.title": "System Requirements",
    "mkt.requirements.desc": "Requires a 64-bit OS and at least 2GB RAM.",
    "mkt.footer.desc":
      "Your voice-first personal home operating system. Completely local, entirely yours.",
    "mkt.footer.product": "Product",
    "mkt.footer.company": "Company & Legal",
    "mkt.footer.about": "About Us",
    "mkt.footer.privacy": "Privacy Policy",
    "mkt.footer.terms": "Terms of Service",
    "mkt.footer.noCookies": "We use zero cookies.",
    "mkt.cookie.title": "Privacy & Cookies",
    "mkt.cookie.desc":
      "We use essential cookies to provide our services. By continuing, you agree to our use of these necessary technologies.",
    "mkt.cookie.accept": "Got it",
    "mkt.cookie.decline": "Settings",
    "mkt.feat.why": "Why NEXUS",
    "mkt.feat.1.title": "Voice-first control",
    "mkt.feat.1.desc": "Interact with your home naturally.",
    "mkt.feat.2.title": "Private by design",
    "mkt.feat.2.desc": "No cloud, no logging. Local encryption only.",
    "mkt.feat.3.title": "Interoperable",
    "mkt.feat.3.desc": "500+ protocols including Matter, Zigbee, Z-Wave.",
    "mkt.feat.4.title": "Invisible AI",
    "mkt.feat.4.desc": "Runs in the background, learning your routines.",
    "mkt.faq.title": "Frequently asked questions",
    "mkt.faq.1.q": "Is NEXUS completely free?",
    "mkt.faq.1.a": "Yes. The core OS and local control features are entirely free.",
    "mkt.faq.2.q": "Which devices are supported?",
    "mkt.faq.2.a": "Matter, Zigbee, Z-Wave devices and over 500 API-based ecosystems.",
    "mkt.faq.3.q": "Does it work without cloud connection?",
    "mkt.faq.3.a":
      "Yes. It communicates with your devices over local network, working even if internet goes down.",
    "mkt.faq.4.q": "How is remote access provided?",
    "mkt.faq.4.a":
      "Through a secure end-to-end encrypted tunnel with Premium plan or your own VPN.",
    "mkt.desktop.eyebrow": "Desktop",
    "mkt.desktop.title": "One app for every desktop",
    "mkt.desktop.desc": "Native builds for Windows, macOS, and Linux — each tuned for its platform.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "System tray integration and global hotkeys.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "Menu bar companion and native notifications.",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "AppImage and deb packages for any distro.",
    "mkt.desktop.download": "Download",
    "mkt.mobile.eyebrow": "Mobile",
    "mkt.mobile.title": "Your home in your pocket",
    "mkt.mobile.desc": "The NEXUS companion app puts control at your fingertips — wherever you are.",
    "mkt.mobile.feat1.title": "Voice on the go",
    "mkt.mobile.feat1.desc": "Talk to your home from anywhere with on-device speech recognition.",
    "mkt.mobile.feat2.title": "Remote access",
    "mkt.mobile.feat2.desc": "Securely reach your home network over an encrypted tunnel.",
    "mkt.mobile.feat3.title": "Push notifications",
    "mkt.mobile.feat3.desc": "Get instant alerts for events that matter to you.",
    "mkt.mobile.feat4.title": "Biometric lock",
    "mkt.mobile.feat4.desc": "Face ID and fingerprint keep your home controls private.",
    "mkt.cta.title": "Your home, your rules.",
    "mkt.cta.desc": "Download NEXUS and take control of every device from one place.",
    "mkt.cta.button": "Download Free",
    "mkt.footer.platforms": "Platforms",
    "Dim living room lights": "Dim living room lights",
    "Start morning news briefing": "Start morning news briefing",
    "Movie night": "Movie night",
    "Good morning": "Good morning",
    "Leaving home": "Leaving home",
    "status.pctOnline": "{pct}% online",
    "status.offlineCount": "{count} offline",
    "status.allOnline": "All devices online",
    "status.suggestionReady": "{count} suggestion ready for you.",
    "status.suggestionsReady": "{count} suggestions ready for you.",
    "status.caughtUp": "You're all caught up.",
    "status.onlineOfTotal": "{online}/{total} online",
  },
  tr: {
    "app.greeting": "Merhaba {name}, nasıl yardımcı olabilirim?",
    "app.confirmNeeded": "{name}, bu işlem için onayın gerekiyor.",
    "download.title": "NEXUS'u İndir",
    "download.primaryButton": "{os} için indir",
    "download.otherOs": "Farklı bir işletim sistemi mi kullanıyorsun?",
    "download.checksum": "SHA-256 sağlama değeri",
    "screen.today": "Bugün",
    "screen.homeState": "Ev",
    "screen.suggestions": "Öneriler",
    "screen.skills": "Yetenekler",
    "screen.family": "Aile",
    "screen.devices": "Cihazlar",
    "screen.platform": "Platformlar",
    "screen.agents": "Ajanlar",
    "screen.personalization": "Kişiselleştirme",
    "screen.billing": "Abonelik",
    "screen.downloadCenter": "İndirme Merkezi",
    "screen.adminDashboard": "Yönetici Paneli",
    "today.devicesOnline": "Çevrimiçi cihazlar",
    "today.energy": "Bugünkü enerji",
    "today.activeRoutines": "Aktif rutinler",
    "today.suggestions": "Öneriler",
    "screen.devices.empty": "Henüz bağlanan cihaz yok.",
    "screen.agents.empty": "Henüz yapılandırılmış bir ajan yok.",
    "screen.suggestions.empty": "Henüz öneri yok — Nexus AI hâlâ öğreniyor.",
    "screen.skills.empty": "Henüz öğrenilen bir yetenek yok.",
    "screen.homeState.empty": "Henüz cihaz eklenmiş bir oda yok.",
    "plan.free": "Ücretsiz",
    "plan.premium": "Premium",
    "plan.family": "Aile",
    "billing.manage": "Aboneliği yönet",
    "auth.tagline": "Evini tanıyan kişisel işletim sistemin",
    "auth.signInTitle": "NEXUS'a giriş yap",
    "auth.signUpTitle": "NEXUS hesabını oluştur",
    "auth.email": "E-posta",
    "auth.password": "Parola",
    "auth.signInButton": "Giriş yap",
    "auth.signUpButton": "Hesap oluştur",
    "auth.switchToSignUp": "Yeni misin? Hesap oluştur",
    "auth.switchToSignIn": "Zaten hesabın var mı? Giriş yap",
    "auth.passwordHint": "En az 8 karakter",
    "auth.genericError": "Bir sorun oluştu. Lütfen tekrar deneyin.",
    "auth.locked": "Çok fazla başarısız deneme. {time} sonra tekrar deneyin.",
    "auth.rateLimited": "Çok fazla istek. Lütfen daha sonra tekrar deneyin.",
    "auth.logout": "Çıkış yap",
    "auth.welcome": "Hoş geldin, {name}",
    "auth.continue": "Devam et",
    "auth.guest": "Misafir olarak devam et",
    "auth.guestHint": "Hesap açmadan NEXUS'u keşfet",
    "auth.social.divider": "veya e-posta ile devam et",
    "auth.social.google": "Google ile devam et",
    "auth.social.apple": "Apple ile devam et",
    "auth.social.unavailable": "Bu giriş yöntemi henüz yapılandırılmadı.",
    "auth.social.error": "Sağlayıcıyla giriş başarısız oldu. Lütfen tekrar dene.",
    "mkt.nav.features": "Özellikler",
    "mkt.nav.preview": "Önizleme",
    "mkt.nav.download": "İndir",
    "mkt.nav.faq": "SSS",
    "mkt.nav.signIn": "Giriş Yap",
    "mkt.hero.badge": "v{version} · Windows · macOS · Linux",
    "mkt.hero.title": "Sahip olduğun her cihaz için NEXUS'u indir",
    "mkt.hero.desc":
      "NEXUS, sesle çalışan ve gizliliğe odaklanan kişisel işletim sistemidir. Masaüstü uygulamasını ya da mobil uygulamayı kur; tüm cihazlarını tek yerden, %100 cihaz üzerinde yönet. Web'den değil, gerçek uygulamadan kullanılır.",
    "mkt.hero.actionPrimary": "İndir ({os}) · v{version}",
    "mkt.hero.actionSecondary": "İş başında gör",
    "mkt.hero.trust": "★ 500.000+ kullanıcı · 2000+ akıllı cihaz · %100 yerel gizlilik",
    "mkt.stats.title": "Rakamlarla NEXUS",
    "mkt.stats.users": "Aktif kullanıcı",
    "mkt.stats.devices": "Desteklenen cihaz",
    "mkt.stats.privacy": "Cihaz üzerinde gizlilik",
    "mkt.stats.rating": "Ortalama puan",
    "mkt.privacy.title": "Verileriniz size aittir",
    "mkt.privacy.processing": "%100 cihaz üzerinde işleme",
    "mkt.privacy.encryption": "Uçtan uca yerel şifreleme",
    "mkt.privacy.logging": "Sıfır bulut kaydı",
    "mkt.how.title": "Nasıl çalışır",
    "mkt.how.step1.title": "İndir",
    "mkt.how.step1.desc": "Uygulamayı platformunuz için indirin.",
    "mkt.how.step2.title": "Kur",
    "mkt.how.step2.desc": "Saniyeler içinde yerel kurulumu tamamlayın.",
    "mkt.how.step3.title": "Cihazlarını bağla",
    "mkt.how.step3.desc": "Akıllı cihazlarınızı güvenle yönetmeye başlayın.",
    "mkt.preview.title": "NEXUS'u iş başında gör",
    "mkt.preview.desc":
      "Uygulamayı kurduğunda karşılaşacağın gerçek Bugün panelinin canlı bir görünümü.",
    "mkt.preview.tab.today": "Bugün",
    "mkt.preview.tab.devices": "Cihazlar",
    "mkt.preview.tab.skills": "Rutinler",
    "mkt.preview.tab.family": "Aile",
    "mkt.download.mobile.title": "Mobil uygulamalar",
    "mkt.download.mobile.desc": "iOS ve Android uygulamaları çok yakında.",
    "mkt.download.mobile.apple": "Şurada indir:",
    "mkt.download.mobile.appleStore": "App Store",
    "mkt.download.mobile.google": "Şuradan al:",
    "mkt.download.mobile.googlePlay": "Google Play",
    "mkt.download.mobile.soon": "Yakında",
    "mkt.seo.title": "NEXUS — Kişisel işletim sistemini indir",
    "mkt.seo.desc": "NEXUS'u Windows, macOS ve Linux için indir. iOS ve Android çok yakında.",
    "mkt.skipToContent": "İçeriğe atla",
    "mkt.pricing.title": "Basit, şeffaf fiyatlandırma",
    "mkt.pricing.free": "Ücretsiz",
    "mkt.pricing.freeDesc": "Yerel bir akıllı ev için ihtiyacınız olan her şey.",
    "mkt.pricing.premium": "Premium",
    "mkt.pricing.premiumDesc": "Gelişmiş yapay zeka işleme ve uzaktan erişim.",
    "mkt.pricing.family": "Aile",
    "mkt.pricing.familyDesc": "Tam erişim kontrolüne sahip 5 adede kadar hesap.",
    "mkt.pricing.cta": "Ücretsiz başla",
    "mkt.testimonials.title": "Akıllı ev tutkunları tarafından seviliyor",
    "mkt.testimonials.quote1":
      "NEXUS evimle etkileşimimi tamamen değiştirdi. Her şeyin yerel olması çok daha hızlı.",
    "mkt.integrations.title": "Favori cihazlarınızla çalışır",
    "mkt.changelog.title": "v3.14.2 sürümündeki yenilikler",
    "mkt.requirements.title": "Sistem Gereksinimleri",
    "mkt.requirements.desc": "64-bit işletim sistemi ve en az 2GB RAM gerektirir.",
    "mkt.footer.desc": "Ses öncelikli kişisel ev işletim sisteminiz. Tamamen yerel, tamamen sizin.",
    "mkt.footer.product": "Ürün",
    "mkt.footer.company": "Şirket & Yasal",
    "mkt.footer.about": "Hakkımızda",
    "mkt.footer.privacy": "Gizlilik Politikası",
    "mkt.footer.terms": "Kullanım Şartları",
    "mkt.footer.noCookies": "Sıfır çerez kullanıyoruz.",
    "mkt.cookie.title": "Gizlilik ve Çerezler",
    "mkt.cookie.desc":
      "Hizmetlerimizi sunabilmek için gerekli çerezleri kullanıyoruz. Devam ederek bu temel teknolojilerin kullanımını kabul etmiş olursunuz.",
    "mkt.cookie.accept": "Anladım",
    "mkt.cookie.decline": "Tercihler",
    "mkt.feat.why": "Neden NEXUS",
    "mkt.feat.1.title": "Ses öncelikli kontrol",
    "mkt.feat.1.desc": "Evinizle doğal bir şekilde konuşun.",
    "mkt.feat.2.title": "Tasarım gereği gizlilik",
    "mkt.feat.2.desc": "Bulut yok, kayıt yok. Sadece yerel şifreleme.",
    "mkt.feat.3.title": "Birlikte çalışabilirlik",
    "mkt.feat.3.desc": "Matter, Zigbee, Z-Wave dahil 500+ protokol.",
    "mkt.feat.4.title": "Görünmez AI",
    "mkt.feat.4.desc": "Arka planda çalışır, alışkanlıklarınızı öğrenir.",
    "mkt.faq.title": "Sıkça sorulan sorular",
    "mkt.faq.1.q": "NEXUS tamamen ücretsiz mi?",
    "mkt.faq.1.a": "Evet. Temel işletim sistemi ve yerel kontrol özellikleri tamamen ücretsizdir.",
    "mkt.faq.2.q": "Hangi cihazları destekliyor?",
    "mkt.faq.2.a": "Matter, Zigbee, Z-Wave cihazları ve 500'den fazla API tabanlı ekosistem.",
    "mkt.faq.3.q": "Bulut bağlantısı olmadan çalışır mı?",
    "mkt.faq.3.a":
      "Evet. Cihazlarınızla yerel ağ üzerinden iletişim kurar, internet kesilse bile çalışır.",
    "mkt.faq.4.q": "Uzaktan erişim nasıl sağlanıyor?",
    "mkt.faq.4.a":
      "Premium plan ile güvenli bir uçtan-uca şifrelenmiş tünel veya kendi VPN'iniz ile.",
    "mkt.desktop.eyebrow": "Masaüstü",
    "mkt.desktop.title": "Her masaüstü için tek uygulama",
    "mkt.desktop.desc": "Windows, macOS ve Linux için yerel derlemeler — her biri platformuna göre özelleştirilmiş.",
    "mkt.desktop.windows": "Windows",
    "mkt.desktop.windowsDesc": "Sistem tepsisi entegrasyonu ve global kısayollar.",
    "mkt.desktop.macos": "macOS",
    "mkt.desktop.macosDesc": "Menü çubuğu yardımcısı ve yerel bildirimler.",
    "mkt.desktop.linux": "Linux",
    "mkt.desktop.linuxDesc": "Her dağıtım için AppImage ve deb paketleri.",
    "mkt.desktop.download": "İndir",
    "mkt.mobile.eyebrow": "Mobil",
    "mkt.mobile.title": "Evin cebinde",
    "mkt.mobile.desc": "NEXUS mobil uygulaması kontrolü parmak uçlarına getirir — nerede olursan ol.",
    "mkt.mobile.feat1.title": "Yolda sesli kontrol",
    "mkt.mobile.feat1.desc": "Cihaz üzerinde konuşma tanıma ile her yerden evinle konuş.",
    "mkt.mobile.feat2.title": "Uzaktan erişim",
    "mkt.mobile.feat2.desc": "Şifrelenmiş tünel üzerinden ev ağına güvenle eriş.",
    "mkt.mobile.feat3.title": "Anlık bildirimler",
    "mkt.mobile.feat3.desc": "Senin için önemli olaylar için anlık uyarılar al.",
    "mkt.mobile.feat4.title": "Biyometrik kilit",
    "mkt.mobile.feat4.desc": "Face ID ve parmak izi ev kontrollerini gizli tutar.",
    "mkt.cta.title": "Evin, kuralların.",
    "mkt.cta.desc": "NEXUS'u indir ve her cihazı tek yerden kontrol et.",
    "mkt.cta.button": "Ücretsiz İndir",
    "mkt.footer.platforms": "Platformlar",
    "Dim living room lights": "Salon ışıklarını kıs",
    "Start morning news briefing": "Sabah haber bültenini başlat",
    "Movie night": "Film gecesi",
    "Good morning": "Günaydın",
    "Leaving home": "Evden ayrılış",
    "status.pctOnline": "%{pct} çevrimiçi",
    "status.offlineCount": "{count} çevrimdışı",
    "status.allOnline": "Tüm cihazlar çevrimiçi",
    "status.suggestionReady": "Senin için {count} öneri hazır.",
    "status.suggestionsReady": "Senin için {count} öneri hazır.",
    "status.caughtUp": "Her şey yolunda.",
    "status.onlineOfTotal": "{online}/{total} çevrimiçi",
  },
};

/** Narrow any string to a supported Locale, falling back to the default. */
export function resolveLocale(input: string | undefined | null): Locale {
  if (!input) return DEFAULT_LOCALE;
  const base = input.trim().toLowerCase().split("-")[0];
  return (SUPPORTED_LOCALES as readonly string[]).includes(base ?? "")
    ? (base as Locale)
    : DEFAULT_LOCALE;
}

/**
 * Pick the best supported locale from an HTTP `Accept-Language` header, honoring
 * the client's quality (q) ordering. Used by the Download Center auto-language.
 */
export function resolveFromAcceptLanguage(header: string | undefined | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.startsWith("q="));
      const quality = q ? Number.parseFloat(q.slice(2)) : 1;
      return { tag: (tag ?? "").toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0] ?? "";
    if ((SUPPORTED_LOCALES as readonly string[]).includes(base)) return base as Locale;
  }
  return DEFAULT_LOCALE;
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Translate a key for a locale, with {placeholder} interpolation. */
export function translate(
  locale: Locale,
  key: MessageKey,
  vars: Record<string, string | number> = {},
): string {
  const catalog = CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE];
  return interpolate(catalog[key], vars);
}

/** A bound translator for a single locale (convenience for UI layers). */
export function createTranslator(locale: Locale) {
  return (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars);
}

const INTL_LOCALE: Record<Locale, string> = { en: "en-US", tr: "tr-TR" };

export function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale]).format(value);
}

export function formatCurrency(locale: Locale, value: number, currency: string): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], { style: "currency", currency }).format(value);
}

export function formatDate(locale: Locale, date: Date): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: "long" }).format(date);
}

export const moduleName = "i18n" as const;
export const implemented = true;
