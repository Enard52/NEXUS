// Fiyat bölümünü gerçek NEXUS+ planına (Whop) göre günceller. Idempotent.
// Kullanım: node scripts/site-pricing.cjs <index.html, tr/index.html, light.html, tr/light.html içeren klasör>
const fs = require("fs");
const path = require("path");
const root = process.argv[2];
const APP_PLUS = "https://nexus-web-jre.pages.dev/stitch-plus.html";
const check = '<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>';
const list = (items) =>
  '<ul class="feature-list">\n' +
  items.map((t) => `              <li>${check}${t}</li>`).join("\n") +
  "\n            </ul>";

const T = {
  en: {
    heading: ["Free today. Premium when it is ready.", "Free to use. NEXUS+ when you want more."],
    copy: [
      "Everything NEXUS does today is free, with no device limit and no account fee. Premium and Family plans are on the way.",
      "NEXUS is free to use, with no device limit and no account fee. NEXUS+ adds a much larger monthly NEXUS AI allowance. A Family plan is on the way.",
    ],
    faq: [
      "Paid Premium and Family plans will come later; nothing you use today will be taken away.",
      "The optional NEXUS+ subscription adds a larger NEXUS AI allowance, and a Family plan will come later; nothing you use today will be taken away.",
    ],
    premium: [
      [
        '<span class="plan-overline">Adaptive intelligence</span><h3>Premium</h3>',
        '<span class="plan-overline">More NEXUS AI</span><h3>NEXUS+</h3>',
      ],
      [
        '<span class="plan-badge popular">Coming soon</span>',
        '<span class="plan-badge popular">Free trial</span>',
      ],
      [
        "Advanced AI, secure remote access, and automations that continuously adapt to your routines.",
        "A much larger NEXUS AI allowance for your home: 2,000 credits every month instead of 30 a day.",
      ],
      [
        /<div class="price price-soon">Soon<\/div>\s*<span class="price-note">Not on sale yet<\/span>/,
        '<div class="price"><sup>₺</sup>499,99<span>/ month</span></div>\n              <span class="price-note">or ₺3,999.99/yr</span>',
      ],
      [
        "<span>Adaptive core capacity</span><strong>Unlimited</strong>",
        "<span>Monthly NEXUS AI allowance</span><strong>2,000 credits</strong>",
      ],
      [
        "<span>Adaptive routines</span><span>Priority response</span>",
        "<span>Same assistant</span><span>All your devices</span>",
      ],
      [
        /<ul class="feature-list">[\s\S]*?<\/ul>/,
        list([
          "2,000 NEXUS AI credits every month (Free: 30 per day)",
          "NEXUS AI smart home control",
          "Ask NEXUS AI to set scenes and answer in plain language",
          "Works on all your NEXUS devices",
          "One account, valid on every device",
        ]),
      ],
      [
        /<span class="button button-primary is-disabled" aria-disabled="true">Coming soon<\/span>/,
        `<a class="button button-primary" href="${APP_PLUS}" rel="noopener">Start free trial</a>`,
      ],
      [
        "Best balance of power and privacy",
        "Free trial (7 days yearly, 3 monthly) · cancel anytime",
      ],
      [
        /<div class="plan-price-row">\s*<div class="price"><sup>[^<]*<\/sup>[^<]*<span>[^<]*<\/span><\/div>\s*<span class="price-note">[^<]*<\/span>\s*<\/div>/,
        '<div class="plan-price-row">\n              <div class="price"><sup>$</sup>11.99<span>/ month</span></div>\n              <span class="price-note">or $89.99 / year (about $7.50 a month)</span>\n            </div>',
      ],
    ],
    family: [
      ["Everything in Premium, plus", "Everything in NEXUS+, plus"],
      [">Everything in Premium<", ">Everything in NEXUS+<"],
    ],
  },
  tr: {
    heading: [
      "Bugün ücretsiz. Premium hazır olduğunda.",
      "Ücretsiz kullan. Daha fazlası için NEXUS+.",
    ],
    copy: [
      "NEXUS&#39;un bugün yaptığı her şey ücretsiz; cihaz sınırı ve hesap ücreti yok. Premium ve Aile planları yolda.",
      "NEXUS ücretsiz kullanılır; cihaz sınırı ve hesap ücreti yok. NEXUS+ çok daha büyük bir aylık NEXUS AI hakkı ekler. Aile planı yolda.",
    ],
    faq: [
      "Ücretli Premium ve Aile planları daha sonra gelecek; bugün kullandığın hiçbir şey elinden alınmayacak.",
      "İsteğe bağlı NEXUS+ aboneliği daha büyük bir NEXUS AI hakkı ekler, Aile planı daha sonra gelecek; bugün kullandığın hiçbir şey elinden alınmayacak.",
    ],
    premium: [
      [
        '<span class="plan-overline">Uyarlanabilir zekâ</span><h3>Premium</h3>',
        '<span class="plan-overline">Daha fazla NEXUS AI</span><h3>NEXUS+</h3>',
      ],
      [
        '<span class="plan-badge popular">Yakında</span>',
        '<span class="plan-badge popular">Ücretsiz deneme</span>',
      ],
      [
        "Gelişmiş yapay zekâ, güvenli uzaktan erişim ve rutinlerine sürekli uyum sağlayan otomasyonlar.",
        "Evin için çok daha büyük bir NEXUS AI hakkı: günde 30 yerine her ay 2.000 kredi.",
      ],
      [
        /<div class="price price-soon">Yakında<\/div>\s*<span class="price-note">Henüz satışta değil<\/span>/,
        '<div class="price"><sup>₺</sup>499,99<span>/ ay</span></div>\n              <span class="price-note">veya ₺3.999,99/yıl</span>',
      ],
      [
        "<span>Uyarlanabilir çekirdek kapasitesi</span><strong>Sınırsız</strong>",
        "<span>Aylık NEXUS AI hakkı</span><strong>2.000 kredi</strong>",
      ],
      [
        "<span>Uyarlanabilir rutinler</span><span>Öncelikli yanıt</span>",
        "<span>Aynı asistan</span><span>Tüm cihazların</span>",
      ],
      [
        /<ul class="feature-list">[\s\S]*?<\/ul>/,
        list([
          "Her ay 2.000 NEXUS AI kredisi (Ücretsiz: günde 30)",
          "NEXUS AI ile akıllı ev kontrolü",
          "NEXUS AI ile doğal dille senaryo ve soru",
          "Tüm NEXUS cihazlarında çalışır",
          "Tek hesap, her cihazda geçerli",
        ]),
      ],
      [
        /<span class="button button-primary is-disabled" aria-disabled="true">Yakında<\/span>/,
        `<a class="button button-primary" href="${APP_PLUS}" rel="noopener">Ücretsiz dene</a>`,
      ],
      [
        "Güç ve gizliliğin en iyi dengesi",
        "Ücretsiz deneme (yıllık 7, aylık 3 gün) · istediğin zaman iptal",
      ],
      [
        /<div class="plan-price-row">\s*<div class="price"><sup>[^<]*<\/sup>[^<]*<span>[^<]*<\/span><\/div>\s*<span class="price-note">[^<]*<\/span>\s*<\/div>/,
        '<div class="plan-price-row">\n              <div class="price"><sup>₺</sup>499,99<span>/ ay</span></div>\n              <span class="price-note">veya yıllık ₺3.999,99 (ayda ₺333,33)</span>\n            </div>',
      ],
    ],
    family: [
      ["Premium&#39;daki her şey, artı", "NEXUS+&#39;daki her şey, artı"],
      ["Premium&#39;daki her şey</li>", "NEXUS+&#39;daki her şey</li>"],
    ],
  },
};

const FREE_FAMILY = {
  en: {
    free: [
      "Unlimited connected devices",
      "Scenes, automations and NEXUS AI chat (30 credits a day)",
      "Homes, rooms and household members with per-member permissions",
      "100% local device control",
      "Windows, Linux and Android apps",
    ],
    family: [
      "Everything in NEXUS+",
      "One subscription shared by up to 6 household members (coming soon)",
      "Shared NEXUS AI credits for the household (coming soon)",
      "Per-member permissions: already free in the app",
    ],
  },
  tr: {
    free: [
      "Sınırsız bağlı cihaz",
      "Senaryolar, otomasyonlar ve NEXUS AI sohbeti (günde 30 kredi)",
      "Evler, odalar ve üye başına izinli ev üyeleri",
      "%100 yerel cihaz kontrolü",
      "Windows, Linux ve Android uygulamaları",
    ],
    family: [
      "NEXUS+'taki her şey",
      "6 ev üyesine kadar tek abonelik (yakında)",
      "Ev için ortak NEXUS AI kredisi (yakında)",
      "Üye başına izinler: uygulamada şimdiden ücretsiz",
    ],
  },
};

const PLANS_V2 = {
  en: {
    free: {
      stat: ["NEXUS AI credits", "30 / day"],
      items: [
        "Unlimited connected devices, controlled on your own network",
        "Scenes, schedules and automations",
        "NEXUS AI assistant for device commands",
        "Homes, rooms, household members and per-member permissions",
        "Energy overview and device dashboards",
        "Optional free account to sync settings across devices",
        "Windows, Linux and Android apps",
      ],
    },
    premium: {
      stat: ["NEXUS AI credits", "2,000 / month"],
      desc: "A much larger monthly NEXUS AI allowance for your home: 2,000 credits a month instead of 30 a day.",
      items: [
        "2,000 NEXUS AI credits every month (Free: 30 per day)",
        "Ask NEXUS AI to set scenes and answer in plain language",
        "One subscription, valid on all your devices",
        "Free trial included, cancel at period end",
      ],
    },
    family: {
      stat: ["Household members", "Up to 6 · coming soon"],
      items: [
        "Everything in NEXUS+",
        "One subscription shared by up to 6 household members (coming soon)",
        "Shared NEXUS AI credits for the household (coming soon)",
        "Per-member permissions: already free in the app",
      ],
    },
  },
  tr: {
    free: {
      stat: ["NEXUS AI kredisi", "günde 30"],
      items: [
        "Kendi ağında kontrol edilen sınırsız bağlı cihaz",
        "Senaryolar, programlar ve otomasyonlar",
        "Cihaz komutları için NEXUS AI asistanı",
        "Evler, odalar, ev üyeleri ve üye başına izinler",
        "Enerji özeti ve cihaz panelleri",
        "Ayarları cihazlar arasında eşitleyen isteğe bağlı ücretsiz hesap",
        "Windows, Linux ve Android uygulamaları",
      ],
    },
    premium: {
      stat: ["NEXUS AI kredisi", "ayda 2.000"],
      desc: "Evin için çok daha büyük bir aylık NEXUS AI hakkı: günde 30 yerine ayda 2.000 kredi.",
      items: [
        "Her ay 2.000 NEXUS AI kredisi (Ücretsiz: günde 30)",
        "NEXUS AI ile doğal dille senaryo ve soru",
        "Tek abonelik, tüm cihazlarında geçerli",
        "Ücretsiz deneme dahil, dönem sonunda iptal",
      ],
    },
    family: {
      stat: ["Ev üyeleri", "6'ya kadar · yakında"],
      items: [
        "NEXUS+'taki her şey",
        "6 ev üyesine kadar tek abonelik (yakında)",
        "Ev için ortak NEXUS AI kredisi (yakında)",
        "Üye başına izinler: uygulamada şimdiden ücretsiz",
      ],
    },
  },
};
const OLD_PREMIUM_DESC = {
  en: [
    "A much larger NEXUS AI allowance for your home: 2,000 credits every month instead of 30 a day.",
  ],
  tr: [
    "Evin için çok daha büyük bir NEXUS AI hakkı: günde 30 yerine her ay 2.000 kredi.",
  ],
};

function simplifyCard(html, cls, stat) {
  const idx = html.indexOf('<article class="price-card ' + cls);
  if (idx < 0) return html;
  const end = html.indexOf("</article>", idx);
  let card = html.slice(idx, end);
  card = card.replace(/\s*<span class="plan-code">[^<]*<\/span>/, "");
  card = card.replace(/\s*<div class="premium-orbit"[^>]*>[\s\S]*?<\/div>/, "");
  card = card.replace(
    /<div class="plan-console[^"]*"[^>]*>\s*<div class="plan-console-head">[\s\S]*?<\/div>\s*<div class="plan-console-track">[\s\S]*?<\/div>\s*<div class="plan-console-meta">[\s\S]*?<\/div>\s*<\/div>/,
    '<div class="plan-stat"><span>' + stat[0] + "</span><strong>" + stat[1] + "</strong></div>",
  );
  return html.slice(0, idx) + card + html.slice(end);
}

function replaceUl(html, cls, items) {
  const idx = html.indexOf('<article class="price-card ' + cls);
  if (idx < 0) return html;
  const a = html.indexOf('<ul class="feature-list">', idx);
  const b = html.indexOf("</ul>", a) + 5;
  if (a < 0 || b < 5) return html;
  return html.slice(0, a) + list(items) + html.slice(b);
}

function apply(s, pairs) {
  for (const [from, to] of pairs)
    s = typeof from === "string" ? s.split(from).join(to) : s.replace(from, () => to);
  return s;
}

let n = 0;
for (const f of ["index.html", "tr/index.html", "light.html", "tr/light.html"]) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) continue;
  const lang = f.startsWith("tr/") ? "tr" : "en";
  const t = T[lang];
  let h = fs.readFileSync(p, "utf8");
  h = apply(h, [t.heading, t.copy, t.faq]);
  if (lang === "tr")
    h = h.split("<sup>$</sup>0<span>/ ay</span>").join("<sup>₺</sup>0<span>/ ay</span>");
  const a = h.indexOf('<article class="price-card price-card-premium');
  const b = h.indexOf('<article class="price-card price-card-family');
  const end = h.indexOf("</article>", b);
  if (a < 0 || b < 0 || end < 0) {
    console.log("WARN premium/family card not found in", f);
    continue;
  }
  const before = h.slice(0, a);
  const premium = apply(h.slice(a, b), t.premium);
  const family = apply(h.slice(b, end), t.family);
  h = before + premium + family + h.slice(end);
  const V2 = PLANS_V2[lang];
  for (const old of OLD_PREMIUM_DESC[lang]) h = h.split(old).join(V2.premium.desc);
  h = replaceUl(h, "price-card-free", V2.free.items);
  h = replaceUl(h, "price-card-premium", V2.premium.items);
  h = replaceUl(h, "price-card-family", V2.family.items);
  h = simplifyCard(h, "price-card-free", V2.free.stat);
  h = simplifyCard(h, "price-card-premium", V2.premium.stat);
  h = simplifyCard(h, "price-card-family", V2.family.stat);
  fs.writeFileSync(p, h);
  n++;
  console.log("ok", f);
}
console.log("pricing updated:", n);
