// NEXUS site SEO + sync script. Usage: node nexus-seo-apply.cjs <siteRepoDir>
const fs = require("fs");
const path = require("path");
const root = process.argv[2];
const BASE = "https://nexus-smarthome.pages.dev";
const TODAY = "2026-10-25";
const SUPPORT_EMAIL = "nexus.smarthome.app@gmail.com";

// file -> { route (en clean path), lang, kind }
const pages = [
  ["index.html", "/", "en", "home"],
  ["tr/index.html", "/", "tr", "home"],
  ["about.html", "/about", "en", "about"],
  ["about/index.html", "/about", "en", "about"],
  ["tr/about.html", "/about", "tr", "about"],
  ["privacy.html", "/privacy", "en", "privacy"],
  ["privacy/index.html", "/privacy", "en", "privacy"],
  ["tr/privacy.html", "/privacy", "tr", "privacy"],
  ["terms.html", "/terms", "en", "terms"],
  ["terms/index.html", "/terms", "en", "terms"],
  ["tr/terms.html", "/terms", "tr", "terms"],
  ["refund.html", "/refund", "en", "refund"],
  ["tr/refund.html", "/refund", "tr", "refund"],
  ["light.html", "/", "en", "light"],
  ["tr/light.html", "/", "tr", "light"],
  ["login.html", "/login", "en", "login"],
  ["tr/login.html", "/login", "tr", "login"],
  ["404.html", "/404", "en", "404"],
  ["tr/404.html", "/404", "tr", "404"],
];

const meta = {
  en: {
    title: {
      home: "NEXUS — Local-first smart home app for Windows, Linux and Android",
      about: "About NEXUS — Local-first smart home control",
      privacy: "Privacy Policy — NEXUS",
      terms: "Terms of Service — NEXUS",
      refund: "Refund and Cancellation Policy — NEXUS",
    },
    desc: {
      home: "NEXUS controls your smart home on your local network, with no hub or cloud fee. Free for Windows and Linux, test build for Android. iOS coming soon.",
      about: "NEXUS is a local-first smart home assistant. Learn what it is, how it works and what we believe about privacy and ownership of your home data.",
      privacy: "What data NEXUS processes, where and why: local control by default, account sync stored with Supabase, payments by Whop, and no selling of personal data.",
      terms: "The terms for using NEXUS apps and services: licence, accounts, NEXUS+ subscription, safety and liability.",
      refund: "Free trial, cancellation and refund terms for the NEXUS+ subscription.",
    },
    locale: "en_US",
    other: "tr_TR",
  },
  tr: {
    title: {
      home: "NEXUS — Windows, Linux ve Android için yerel akıllı ev uygulaması",
      about: "NEXUS Hakkında — Yerel öncelikli akıllı ev kontrolü",
      privacy: "Gizlilik Politikası — NEXUS",
      terms: "Kullanım Şartları — NEXUS",
      refund: "İade ve İptal Politikası — NEXUS",
    },
    desc: {
      home: "NEXUS, akıllı evinizi hub ya da bulut ücreti olmadan yerel ağınızda yönetir. Windows ve Linux için ücretsiz, Android için test sürümü. iOS yakında.",
      about: "NEXUS, yerel öncelikli bir akıllı ev asistanıdır. Nasıl çalıştığını, gizlilik ve ev verilerinizin size ait olması konusundaki yaklaşımımızı öğrenin.",
      privacy: "NEXUS hangi verileri, nerede ve neden işler: varsayılan yerel kontrol, Supabase'te hesap senkronu, Whop ile ödeme ve kişisel verilerin satılmaması.",
      terms: "NEXUS uygulama ve hizmetlerinin kullanım şartları: lisans, hesaplar, NEXUS+ aboneliği, güvenlik ve sorumluluk.",
      refund: "NEXUS+ aboneliği için ücretsiz deneme, iptal ve iade koşulları.",
    },
    locale: "tr_TR",
    other: "en_US",
  },
};

const abs = (route, lang) => BASE + (lang === "tr" ? "/tr" + (route === "/" ? "/" : route) : route);

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function stripTags(s) {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "’")
    .replace(/\s+/g, " ")
    .trim();
}

function faqFrom(html) {
  const out = [];
  const re = /<div class="faq-question">([\s\S]*?)<\/div>\s*<div class="faq-answer">([\s\S]*?)<\/div>/g;
  let m;
  while ((m = re.exec(html))) {
    out.push({
      "@type": "Question",
      name: stripTags(m[1]),
      acceptedAnswer: { "@type": "Answer", text: stripTags(m[2]) },
    });
  }
  return out;
}

let changed = 0;
for (const [file, route, lang, kind] of pages) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) {
    console.log("skip (missing)", file);
    continue;
  }
  let html = fs.readFileSync(p, "utf8");
  const m = meta[lang];
  const indexable = ["home", "about", "privacy", "terms", "refund"].includes(kind);
  const canonicalTarget = abs(route, lang);

  // --- strip old SEO tags ---
  html = html
    .replace(/\s*<meta name="description"[^>]*>/gi, "")
    .replace(/\s*<meta name="robots"[^>]*>/gi, "")
    .replace(/\s*<meta name="keywords"[^>]*>/gi, "")
    .replace(/\s*<link rel="canonical"[^>]*>/gi, "")
    .replace(/\s*<link rel="alternate" hreflang[^>]*>/gi, "")
    .replace(/\s*<meta property="og:[^>]*>/gi, "")
    .replace(/\s*<meta name="twitter:[^>]*>/gi, "");

  // --- title ---
  let title = m.title[kind];
  if (!title) {
    const old = html.match(/<title>([\s\S]*?)<\/title>/i);
    title = old ? old[1].trim() : "NEXUS";
  }
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);

  // --- unified SEO block after <title> ---
  const desc = m.desc[kind] || m.desc.home;
  const lines = [];
  lines.push(`<meta name="description" content="${esc(desc)}" />`);
  if (kind === "light" || kind === "login" || kind === "404") {
    lines.push(`<meta name="robots" content="noindex,follow" />`);
  } else {
    lines.push(
      `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />`
    );
  }
  const canonical = kind === "light" ? abs("/", lang) : indexable ? canonicalTarget : null;
  if (canonical) lines.push(`<link rel="canonical" href="${canonical}" />`);
  if (indexable) {
    lines.push(`<link rel="alternate" hreflang="en" href="${abs(route, "en")}" />`);
    lines.push(`<link rel="alternate" hreflang="tr" href="${abs(route, "tr")}" />`);
    lines.push(`<link rel="alternate" hreflang="x-default" href="${abs(route, "en")}" />`);
  }
  if (indexable) {
    lines.push(`<meta property="og:type" content="website" />`);
    lines.push(`<meta property="og:site_name" content="NEXUS" />`);
    lines.push(`<meta property="og:locale" content="${m.locale}" />`);
    lines.push(`<meta property="og:locale:alternate" content="${m.other}" />`);
    lines.push(`<meta property="og:title" content="${esc(title)}" />`);
    lines.push(`<meta property="og:description" content="${esc(desc)}" />`);
    lines.push(`<meta property="og:url" content="${canonicalTarget}" />`);
    lines.push(`<meta property="og:image" content="${BASE}/og-cover.png" />`);
    lines.push(`<meta property="og:image:width" content="1200" />`);
    lines.push(`<meta property="og:image:height" content="630" />`);
    lines.push(
      `<meta property="og:image:alt" content="${lang === "tr" ? "NEXUS akıllı ev uygulaması" : "NEXUS smart home app"}" />`
    );
    lines.push(`<meta name="twitter:card" content="summary_large_image" />`);
    lines.push(`<meta name="twitter:title" content="${esc(title)}" />`);
    lines.push(`<meta name="twitter:description" content="${esc(desc)}" />`);
    lines.push(`<meta name="twitter:image" content="${BASE}/og-cover.png" />`);
  }
  if (kind === "home") lines.push(`<meta name="msvalidate.01" content="00B49BF0F151CA4A717AADE975BB3380" />`);
  lines.push(`<meta name="application-name" content="NEXUS" />`);
  lines.push(`<meta name="apple-mobile-web-app-title" content="NEXUS" />`);
  html = html.replace(/(<title>[\s\S]*?<\/title>)/i, `$1\n  ${lines.join("\n  ")}`);

  // --- JSON-LD ---
  html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");
  if (kind === "home") {
    const faq = faqFrom(html);
    const graph = [
      {
        "@type": "Organization",
        "@id": BASE + "/#org",
        name: "NEXUS",
        url: BASE + "/",
        logo: BASE + "/icon.svg",
        email: SUPPORT_EMAIL,
        contactPoint: { "@type": "ContactPoint", email: SUPPORT_EMAIL, contactType: "customer support", availableLanguage: ["en", "tr"] },
      },
      {
        "@type": "WebSite",
        "@id": BASE + "/#website",
        url: BASE + "/",
        name: "NEXUS",
        inLanguage: ["en", "tr"],
        publisher: { "@id": BASE + "/#org" },
      },
      {
        "@type": "SoftwareApplication",
        "@id": BASE + "/#app",
        name: "NEXUS",
        description: desc,
        url: canonicalTarget,
        image: BASE + "/og-cover.png",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Windows, Linux, Android",
        inLanguage: lang,
        downloadUrl: "https://github.com/Enard52/nexus-releases/releases/latest",
        publisher: { "@id": BASE + "/#org" },
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ];
    if (faq.length) graph.push({ "@type": "FAQPage", "@id": canonicalTarget + "#faq", mainEntity: faq });
    const ld = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
    html = html.replace("</head>", `  <script type="application/ld+json">\n${ld}\n  </script>\n</head>`);
  }

  // --- iletişim adresi ---
  const mail = '<a href="mailto:' + SUPPORT_EMAIL + '">' + SUPPORT_EMAIL + "</a>";
  const enContact = /<p>If you have questions or requests about this Privacy Policy or your data, [^<]*<\/p>/;
  const trContact = /<p>Bu Gizlilik Politikası veya verilerinizle ilgili sorularınız için [^<]*<\/p>/;
  html = html.replace(enContact, "<p>If you have questions or requests about this Privacy Policy or your data, contact us at " + mail + ".</p>");
  html = html.replace(trContact, "<p>Bu Gizlilik Politikası veya verilerinizle ilgili sorularınız için " + mail + " adresinden bize ulaşabilirsiniz.</p>");
  // Ana sayfa: erken erişim bölümünde destek düğmesi (yoksa ekle)
  if (kind === "home" && !html.includes('class="early-access-actions"')) {
    const label = lang === "tr" ? "Destek / geri bildirim" : "Support / feedback";
    const btn = '\n          <p class="early-access-actions"><a class="button button-secondary" href="mailto:' + SUPPORT_EMAIL + '?subject=NEXUS">' + label + "</a></p>";
    html = html.replace(/(<section[^>]*id="early-access"[\s\S]*?<p class="section-copy">[\s\S]*?<\/p>)/, "$1" + btn);
  }

  // --- alt bilgi: destek adresi her sayfada, kaldırılan macOS bağlantısı ve doğrulanmamış şirket unvanı yok ---
  html = html.replace(/(<h3>(?:Company &amp; legal|Company & legal|Şirket ve yasal)<\/h3>[\s\S]*?)(<\/div>)/, (m, a, b) =>
    a.includes("mailto:") ? m : a + '  <a href="mailto:' + SUPPORT_EMAIL + '">' + (lang === "tr" ? "Destek" : "Support") + "</a>\n        " + b
  );
  if (!html.includes('href="/refund"')) html = html.replace(/(<a href="\/terms">[^<]*<\/a>)/, (m) => m + '\n          <a href="/refund">' + (lang === "tr" ? "İade Politikası" : "Refund Policy") + "</a>");
  html = html.replace(/\s*<a href="#downloads">macOS<\/a>/g, "");
  html = html.split("© 2026 NEXUS Technologies Inc.").join("© 2026 NEXUS");

  // --- other stale host refs ---
  html = html.split("https://enard52.github.io").join(BASE);

  // --- version fallback in download cards (live value is fetched from the API) ---
  html = html.replace(/<span data-nexus-ver>1\.0\.0<\/span>/g, "<span data-nexus-ver>1.0.7</span>");

  fs.writeFileSync(p, html);
  changed++;
  console.log("ok", file);
}

// --- robots.txt ---
fs.writeFileSync(
  path.join(root, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /login\nDisallow: /tr/login\nDisallow: /light\nDisallow: /tr/light\n\nSitemap: ${BASE}/sitemap.xml\n`
);

// --- sitemap.xml with hreflang alternates ---
const routes = [
  ["/", 1.0, "weekly"],
  ["/about", 0.5, "monthly"],
  ["/privacy", 0.3, "monthly"],
  ["/terms", 0.3, "monthly"],
  ["/refund", 0.3, "monthly"],
];
let sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
for (const [route, pr, cf] of routes) {
  for (const lang of ["en", "tr"]) {
    sm += `  <url>\n    <loc>${abs(route, lang)}</loc>\n    <xhtml:link rel="alternate" hreflang="en" href="${abs(route, "en")}" />\n    <xhtml:link rel="alternate" hreflang="tr" href="${abs(route, "tr")}" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(route, "en")}" />\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${cf}</changefreq>\n    <priority>${lang === "en" ? pr.toFixed(1) : Math.max(pr - 0.1, 0.2).toFixed(1)}</priority>\n  </url>\n`;
  }
}
sm += `</urlset>\n`;
fs.writeFileSync(path.join(root, "sitemap.xml"), sm);

// --- manifest ---
const mf = {
  name: "NEXUS",
  short_name: "NEXUS",
  description: "Local-first smart home control for Windows, Linux and Android.",
  id: "/",
  start_url: "/",
  scope: "/",
  display: "standalone",
  theme_color: "#8b7bff",
  background_color: "#09090b",
  icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
};
fs.writeFileSync(path.join(root, "manifest.webmanifest"), JSON.stringify(mf, null, 2) + "\n");
console.log("pages changed:", changed);
