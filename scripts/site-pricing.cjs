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
        "A much larger NEXUS AI allowance for your home: 2,000 credits every month and advanced NEXUS AI models.",
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
        "<span>Advanced models</span><span>All your devices</span>",
      ],
      [
        /<ul class="feature-list">[\s\S]*?<\/ul>/,
        list([
          "2,000 NEXUS AI credits every month (Free: 30 per day)",
          "NEXUS AI smart home control",
          "Advanced NEXUS AI models",
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
        "Evin için çok daha büyük bir NEXUS AI hakkı: her ay 2.000 kredi ve gelişmiş NEXUS AI modelleri.",
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
        "<span>Gelişmiş modeller</span><span>Tüm cihazların</span>",
      ],
      [
        /<ul class="feature-list">[\s\S]*?<\/ul>/,
        list([
          "Her ay 2.000 NEXUS AI kredisi (Ücretsiz: günde 30)",
          "NEXUS AI ile akıllı ev kontrolü",
          "Gelişmiş NEXUS AI modelleri",
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
    ],
    family: [
      ["Premium&#39;daki her şey, artı", "NEXUS+&#39;daki her şey, artı"],
      ["Premium&#39;daki her şey</li>", "NEXUS+&#39;daki her şey</li>"],
    ],
  },
};

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
  fs.writeFileSync(p, h);
  n++;
  console.log("ok", f);
}
console.log("pricing updated:", n);
