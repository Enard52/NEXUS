/**
 * NEXUS — Batch DeepL Translation Script
 * Translates all EN catalog keys to 18 target languages.
 * Outputs a JSON file that can be inserted into the i18n catalog.
 */

import https from "https";
import fs from "fs";

const DEEPL_KEY = "850398e6-f11e-4676-a713-83e4c73b2c8f:fx";
const API_URL = "https://api-free.deepl.com/v2/translate";

// DeepL language code mapping
const DEEPL_LANG_MAP = {
  es: "ES", fr: "FR", de: "DE", it: "IT", pt: "PT-BR", nl: "NL",
  pl: "PL", cs: "CS", ru: "RU", uk: "UK", ar: "AR",
  ja: "JA", ko: "KO", "zh-Hans": "ZH-HANS",
  he: "HE", hi: "HI", "zh-Hant": "ZH-HANT", vi: "VI",
};

// All languages now supported by DeepL
const MANUAL_LANGS = [];

// EN catalog - all keys
const EN_CATALOG = {
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
  "mkt.nav.pricing": "Pricing",
  "mkt.nav.testimonials": "Testimonials",
  "mkt.nav.integrations": "Integrations",
  "mkt.nav.about": "About Us",
  "mkt.nav.download": "Download",
  "mkt.nav.faq": "FAQ",
  "mkt.nav.signIn": "Sign In",
  "mkt.hero.badge": "v{version} · Windows · macOS · Linux",
  "mkt.hero.title": "Download NEXUS for every device you own",
  "mkt.hero.desc": "NEXUS is a voice-first, privacy-focused personal operating system. Install the desktop app or the mobile companion and control every device from one place — 100% on-device. You use it from the real app, not the browser.",
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
  "mkt.testimonials.quote1": "NEXUS completely changed how I interact with my home. Having everything local is just so much faster.",
  "mkt.testimonials.author1": "Sarah Jenkins",
  "mkt.testimonials.role1": "Early Adopter",
  "mkt.testimonials.quote2": "Finally, a smart home hub that respects my privacy. The local AI processing is incredibly responsive.",
  "mkt.testimonials.author2": "David Chen",
  "mkt.testimonials.role2": "Software Engineer",
  "mkt.testimonials.quote3": "Setting up complex routines is a breeze. I love that it doesn't break when my internet goes down.",
  "mkt.testimonials.author3": "Emma Thompson",
  "mkt.testimonials.role3": "Smart Home Enthusiast",
  "mkt.integrations.title": "Works with your favorite devices",
  "mkt.changelog.title": "What's new in v3.14.2",
  "mkt.requirements.title": "System Requirements",
  "mkt.requirements.desc": "Requires a 64-bit OS and at least 2GB RAM.",
  "mkt.footer.desc": "Your voice-first personal home operating system. Completely local, entirely yours.",
  "mkt.footer.product": "Product",
  "mkt.footer.company": "Company & Legal",
  "mkt.footer.about": "About Us",
  "mkt.footer.privacy": "Privacy Policy",
  "mkt.footer.terms": "Terms of Service",
  "mkt.footer.noCookies": "We use zero cookies.",
  "mkt.cookie.title": "Privacy & Cookies",
  "mkt.cookie.desc": "We use essential cookies to provide our services. By continuing, you agree to our use of these necessary technologies.",
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
  "mkt.faq.3.a": "Yes. It communicates with your devices over local network, working even if internet goes down.",
  "mkt.faq.4.q": "How is remote access provided?",
  "mkt.faq.4.a": "Through a secure end-to-end encrypted tunnel with Premium plan or your own VPN.",
  "mkt.desktop.eyebrow": "Desktop",
  "mkt.desktop.title": "One app for every desktop",
  "mkt.desktop.desc": "Native builds for Windows, macOS, and Linux — each tuned for its platform.",
  "mkt.desktop.windows": "Windows",
  "mkt.desktop.windowsDesc": "Optimized for Windows 10 & 11 with seamless background operation.",
  "mkt.desktop.macos": "macOS",
  "mkt.desktop.macosDesc": "Built for Apple Silicon and Intel with deep system integration.",
  "mkt.desktop.linux": "Linux",
  "mkt.desktop.linuxDesc": "Lightweight, fast, and compatible with all major distributions.",
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
  "mobile.menu": "Menu",
  "mobile.more": "More",
  "mobile.systemStatus": "NEXUS System Status",
  "mobile.localNetwork": "Local Network Connection",
  "mobile.offline": "100% Offline",
  "mobile.localAI": "Local AI Engine",
  "mobile.deviceNetwork": "Device Network",
  "mobile.online": "Online",
  "mobile.quickControls": "QUICK CONTROLS",
  "mobile.privacyShield": "Offline Privacy Shield",
  "mobile.active": "Active",
  "mobile.voiceWake": "Voice Wake (\"NEXUS\")",
  "mobile.on": "On",
  "mobile.autoBackup": "Auto Home Backup",
  "mobile.backupTime": "Daily 03:00",
  "mobile.moreSub.suggestions": "3 scheduled smart automation suggestions",
  "mobile.moreSub.skills": "5 learned active voice skills & scenarios",
  "mobile.moreSub.personalization": "Assistant name, voice model & privacy settings",
  "mobile.moreSub.billing": "NEXUS Family Plan · Active Subscription",
  "mobile.moreSub.downloads": "3 OS platform releases & SHA-256 validation",
  "mobile.moreSub.platform": "Cross-platform device sync",
  "mobile.moreSub.agents": "Autonomous AI agents",
  "mobile.moreSub.admin": "System administration & metrics",
  "desktop.title": "Personal Operating System",
  "setup.welcome": "Welcome",
  "setup.license": "License",
  "setup.location": "Location",
  "setup.installing": "Installing",
  "setup.finish": "Finish",
  "setup.welcomeTitle": "Welcome to NEXUS Setup",
  "setup.welcomeDesc": "This wizard will guide you through the installation of NEXUS AI — your personal operating system for the home.",
  "setup.accept": "I accept the license agreement",
  "setup.chooseFolder": "Choose installation folder",
  "setup.installBtn": "Install",
  "setup.complete": "Setup Complete",
  "setup.launchNow": "Launch NEXUS now",
};

// Keys that contain placeholders and shouldn't have them translated
const PLACEHOLDER_KEYS = new Set([
  "mkt.hero.badge", "mkt.hero.actionPrimary", "status.pctOnline",
  "status.offlineCount", "status.suggestionReady", "status.suggestionsReady",
  "status.onlineOfTotal", "app.greeting", "app.confirmNeeded",
  "download.primaryButton", "auth.locked", "auth.welcome",
]);

function deeplTranslate(texts, targetLang) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams();
    texts.forEach(t => params.append("text", t));
    params.append("source_lang", "EN");
    params.append("target_lang", targetLang);

    const postData = params.toString();
    const url = new URL(API_URL);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${DEEPL_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`DeepL API error ${res.statusCode}: ${data}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          resolve(json.translations.map(t => t.text));
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

// Map of placeholder markers (DeepL preserves capitalized tokens)
const PH_MAP = {};
let phIdx = 0;

function wrapPlaceholders(text) {
  // Replace {name} with numbered markers that DeepL won't translate
  return text.replace(/\{(\w+)\}/g, (match, name) => {
    const marker = `NXPH${phIdx++}`;
    PH_MAP[marker] = `{${name}}`;
    return marker;
  });
}

function unwrapPlaceholders(text) {
  // Restore all NXPH markers back to {placeholder}
  return text.replace(/NXPH(\d+)/g, (match) => PH_MAP[match] || match);
}

async function translateBatch(keys, targetLang) {
  // Reset placeholder map per language
  phIdx = 0;
  Object.keys(PH_MAP).forEach(k => delete PH_MAP[k]);
  
  // Wrap placeholders
  const texts = keys.map(k => wrapPlaceholders(EN_CATALOG[k]));

  // DeepL has a limit of 50 texts per request
  const BATCH_SIZE = 40;
  const results = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    console.log(`  Translating batch ${Math.floor(i/BATCH_SIZE)+1} (${batch.length} texts) to ${targetLang}...`);
    const translated = await deeplTranslate(batch, targetLang);
    results.push(...translated);
    // Delay to respect rate limits
    if (i + BATCH_SIZE < texts.length) await new Promise(r => setTimeout(r, 1500));
  }

  // Unwrap placeholders
  return results.map(t => unwrapPlaceholders(t));
}

async function main() {
  const allKeys = Object.keys(EN_CATALOG);
  const output = {};
  
  // Load existing results if any
  const outPath = new URL("../scripts/translated-catalogs.json", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
  try {
    const existing = JSON.parse(fs.readFileSync(outPath, "utf-8"));
    Object.assign(output, existing);
  } catch {}

  // Translate DeepL-supported languages sequentially with big delays
  const langs = Object.entries(DEEPL_LANG_MAP);
  for (let li = 0; li < langs.length; li++) {
    const [locale, deeplLang] = langs[li];
    // Skip if already successfully translated
    if (output[locale] && !output[locale]._error && Object.keys(output[locale]).length > 10) {
      console.log(`\n=== ${locale}: already done, skipping ===`);
      continue;
    }
    console.log(`\n=== Translating to ${locale} (${deeplLang}) [${li+1}/${langs.length}] ===`);
    try {
      const translations = await translateBatch(allKeys, deeplLang);
      output[locale] = {};
      allKeys.forEach((key, i) => {
        output[locale][key] = translations[i];
      });
      console.log(`  ✓ Done: ${translations.length} keys translated`);
      // Save after each language in case of crash
      fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
      // Wait 3 seconds between languages to respect rate limits
      if (li < langs.length - 1) {
        console.log(`  (waiting 3s before next language...)`);
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (err) {
      console.error(`  ✗ Error for ${locale}: ${err.message}`);
      output[locale] = { _error: err.message };
      // If rate limited, wait longer and retry
      if (err.message.includes('429')) {
        console.log(`  Rate limited! Waiting 10s then retrying...`);
        await new Promise(r => setTimeout(r, 10000));
        li--; // retry this language
        delete output[locale];
        continue;
      }
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\n✓ Output written to ${outPath}`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
