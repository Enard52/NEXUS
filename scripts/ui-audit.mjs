// NEXUS arayüz denetimi — uygulama kodunu değiştirmez, yalnızca ölçer ve ekran görüntüsü alır.
// Tüm stitch-*.html ekranlarını 4 cihaz profilinde (telefon/tablet/bilgisayar/Electron-900)
// ve 3 hesap durumunda (hesapsız · cihazlı · anonim) yükleyip düzen/işlev sorunlarını tarar.
// Kullanım: SERVE_DIR=www node scripts/ui-audit.mjs   (pnpm audit:ui)
// Çıktı: .shot-ui-audit-<SERVE_DIR>/report.json + shots/  →  özet: pnpm audit:ui:summary
// Seçenekler:
//   node scripts/ui-audit.mjs                → tam tarama (fresh + cihazlı durum)
//   node scripts/ui-audit.mjs --only=home,smart
//   node scripts/ui-audit.mjs --profiles=phone,desktop
//   node scripts/ui-audit.mjs --no-shots     → yalnızca metrik
import http from "node:http";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// SERVE_DIR varsayılan olarak "www": kökte derlenmiş varlıklar (tailwind/font/lucide)
// olmadığı için aksi halde sayfalar stylesız ölçülür ve denetim yanıltıcı olur.
const SERVE_DIR = process.env.SERVE_DIR || "www";
const SERVE = join(ROOT, SERVE_DIR);
const OUT = join(ROOT, `.shot-ui-audit-${SERVE_DIR}`);
const PORT = 4823;
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const NO_SHOTS = process.argv.includes("--no-shots");

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".mjs": "text/javascript", ".cjs": "text/javascript", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon", ".woff2": "font/woff2",
  ".woff": "font/woff", ".ttf": "font/ttf", ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8", ".pdf": "application/pdf",
};

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url || "/").split("?")[0]);
    if (p === "/" || p === "") p = "/index.html";
    const file = join(SERVE, p.replace(/^\//, ""));
    const data = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

// ---------------------------------------------------------------- profiller
const UA_PHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const UA_TABLET =
  "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

const PROFILES = {
  phone: {
    label: "Telefon 390×844", viewport: { width: 390, height: 844 }, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, userAgent: UA_PHONE, locale: "tr-TR", timezoneId: "Europe/Istanbul",
  },
  tablet: {
    label: "Tablet 834×1112", viewport: { width: 834, height: 1112 }, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, userAgent: UA_TABLET, locale: "tr-TR", timezoneId: "Europe/Istanbul",
  },
  desktop: {
    label: "Bilgisayar 1440×900", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
    isMobile: false, hasTouch: false, locale: "tr-TR", timezoneId: "Europe/Istanbul",
  },
  deskmin: {
    label: "Electron en küçük 900×620", viewport: { width: 900, height: 620 }, deviceScaleFactor: 1,
    isMobile: false, hasTouch: false, locale: "tr-TR", timezoneId: "Europe/Istanbul",
  },
};

// ---------------------------------------------------------------- durumlar
// (a) yeni kullanıcı: hesap var ama hiç cihaz yok  (b) 4 cihaz eşleşmiş
const QA_USER = "qa@nexus.local";
const SEEDED_DEVICES = [
  { id: "dev-1", name: "Oturma Odası Lambası", host: "192.168.1.31", protocol: "hue", model: "Hue Bridge", kind: "light", icon: "lightbulb", room: "Oturma Odası" },
  { id: "dev-2", name: "Mutfak Prizi", host: "192.168.1.32", protocol: "tplink", model: "Tapo P110", kind: "plug", icon: "zap", room: "Mutfak" },
  { id: "dev-3", name: "Yatak Odası Kliması", host: "192.168.1.33", protocol: "daikin", model: "Daikin", kind: "climate", icon: "thermometer", room: "Yatak Odası" },
  { id: "dev-4", name: "Güvenlik Kamerası", host: "192.168.1.34", protocol: "onvif", model: "ONVIF", kind: "camera", icon: "video", room: "Giriş" },
];
const STATES = {
  fresh: { label: "cihazsız yeni kullanıcı", seed: () => {} },
  devices: { label: "4 cihaz eşleşmiş", seed: (ls) => ls.setItem(`${QA_USER}_nexusPairedDevices`, JSON.stringify(SEEDED_DEVICES)) },
};

// ---------------------------------------------------------------- sayfalar
const PUBLIC_PAGES = new Set([
  "stitch-login.html", "stitch-onboarding.html", "stitch-forgot-password.html", "stitch-register.html",
]);
let pages = (await readdir(SERVE)).filter((f) => /^stitch-.*\.html$/.test(f)).sort();
const only = arg("only");
if (only) {
  const keys = only.split(",").map((s) => s.trim().toLowerCase());
  pages = pages.filter((p) => keys.some((k) => p.toLowerCase().includes(k)));
}
const profileKeys = arg("profiles") ? arg("profiles").split(",") : Object.keys(PROFILES);

// ---------------------------------------------------------------- ölçüm
const MEASURE = () => {
  const root = document.documentElement;
  const vw = window.innerWidth, vh = window.innerHeight;
  const cs = (el) => getComputedStyle(el);
  const rect = (el) => el.getBoundingClientRect();
  const visible = (el) => {
    const s = cs(el);
    if (s.display === "none" || s.visibility === "hidden" || parseFloat(s.opacity) === 0) return false;
    const r = rect(el);
    return r.width > 0.5 && r.height > 0.5;
  };
  const desc = (el) => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || "",
    cls: String(typeof el.className === "string" ? el.className : el.className?.baseVal || "").trim().slice(0, 110),
    txt: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 45),
  });
  const inScrollX = (el) => {
    let p = el.parentElement;
    while (p && p !== root) {
      const s = cs(p);
      if (s.overflowX === "auto" || s.overflowX === "scroll") return true;
      p = p.parentElement;
    }
    return false;
  };
  const offscreenByTransform = (el) => {
    let p = el;
    while (p && p !== root) {
      const t = cs(p).transform;
      if (t && t !== "none" && /matrix/.test(t)) {
        const m = t.match(/matrix\(([^)]+)\)/);
        if (m) {
          const parts = m[1].split(",").map(Number);
          if (Math.abs(parts[4] || 0) > 40 || Math.abs(parts[5] || 0) > 40) return true;
        }
      }
      p = p.parentElement;
    }
    return false;
  };
  // Öğenin GERÇEKTEN görünen alanı: kırpma yapan (overflow != visible) ataların kutularıyla kesişim
  const clipRectOf = (el) => {
    let r = rect(el);
    let o = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    let p = el.parentElement;
    while (p && p !== root) {
      const s = cs(p);
      if (s.overflow !== "visible" || s.overflowX !== "visible" || s.overflowY !== "visible") {
        const pr = rect(p);
        o = { left: Math.max(o.left, pr.left), top: Math.max(o.top, pr.top), right: Math.min(o.right, pr.right), bottom: Math.min(o.bottom, pr.bottom) };
      }
      p = p.parentElement;
    }
    return o;
  };
  const all = Array.from(document.querySelectorAll("body *"));
  const out = {
    title: document.title,
    htmlClass: root.className,
    nxPage: root.getAttribute("data-nx-page"),
    isDesk: root.classList.contains("nx-desk"),
    isTab: root.classList.contains("nx-tab"),
    vw, vh,
    docScrollW: root.scrollWidth,
    docClientW: root.clientWidth,
    scrollH: root.scrollHeight,
    bodyTextLen: (document.body.innerText || "").replace(/\s+/g, " ").trim().length,
  };
  out.hOverflowPx = out.docScrollW - out.docClientW;

  // 1) Yatay taşma yapan görünür öğeler
  out.overflow = [];
  for (const el of all) {
    if (!visible(el)) continue;
    const r = rect(el);
    if (r.right <= vw + 2 && r.left >= -2) continue;
    if (inScrollX(el)) continue;                     // kaydırılabilir şerit: normal
    if (offscreenByTransform(el)) continue;          // kapalı çekmece: normal
    const s = cs(el);
    out.overflow.push({
      ...desc(el), pos: s.position,
      left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width),
      overRight: Math.round(r.right - vw), overLeft: Math.round(-r.left),
    });
    if (out.overflow.length >= 15) break;
  }

  // 2) Alt menü (bottom-nav) içeriği yutuyor mu?
  out.navInfo = null; out.navCovered = [];
  const navCands = all.filter((el) => {
    if (el.tagName !== "NAV" && !el.classList.contains("bottom-nav")) return false;
    if (!visible(el)) return false;
    const s = cs(el), r = rect(el);
    return (s.position === "fixed" || s.position === "sticky") && r.bottom >= vh - 3 && r.width > vw * 0.4;
  });
  const nav = navCands[0] || null;
  if (nav) {
    const nr = rect(nav);
    out.navInfo = { h: Math.round(nr.height), top: Math.round(nr.top), purpose: nav.getAttribute("data-purpose") || "" };
    window.scrollTo(0, document.body.scrollHeight);
    for (const el of all) {
      if (nav.contains(el) || el.contains(nav)) continue;
      if (!visible(el)) continue;
      const s = cs(el);
      if (s.position === "fixed" || s.position === "sticky") continue;
      const r = clipRectOf(el);
      if (r.bottom - r.top < 2) continue;
      if (r.bottom > nr.top + 3 && r.top < nr.bottom - 3 && r.right > 0 && r.left < vw) {
        const isLeafText = el.children.length === 0 && (el.textContent || "").trim().length > 0;
        if (!isLeafText && !/^(IMG|SVG|BUTTON|INPUT|A)$/.test(el.tagName)) continue;
        out.navCovered.push({ ...desc(el), bottom: Math.round(r.bottom), navTop: Math.round(nr.top), hidden: Math.round(r.bottom - nr.top) });
        if (out.navCovered.length >= 10) break;
      }
    }
    window.scrollTo(0, 0);
  }

  // 3) Sabit başlık içeriği yutuyor mu? (sayfa üstünde)
  out.headerCovered = [];
  window.scrollTo(0, 0);
  const heads = all.filter((el) => {
    if (!/^(HEADER|DIV|NAV)$/.test(el.tagName)) return false;
    if (!visible(el)) return false;
    const s = cs(el), r = rect(el);
    return (s.position === "fixed" || s.position === "sticky") && r.top <= 1 && r.width > vw * 0.5 && r.height > 20 && r.height < 220;
  });
  const head = heads[0] || null;
  if (head) {
    const hr = rect(head);
    out.headerInfo = { h: Math.round(hr.height) };
    for (const el of all) {
      if (head.contains(el) || el.contains(head)) continue;
      if (!visible(el)) continue;
      const s = cs(el);
      if (s.position === "fixed" || s.position === "sticky") continue;
      const r = clipRectOf(el);
      if (el.children.length === 0 && (el.textContent || "").trim() && r.top < hr.bottom - 3 && r.bottom > hr.top + 3) {
        if (Math.min(r.right, hr.right) - Math.max(r.left, hr.left) < 4) continue; // yatayda kesişmiyor: başlık altında değil
        out.headerCovered.push({ ...desc(el), top: Math.round(r.top), headerBottom: Math.round(hr.bottom) });
        if (out.headerCovered.length >= 8) break;
      }
    }
  }

  // 4) Kesik metin (overflow hidden, ellipsis değil)
  out.clipped = [];
  for (const el of all) {
    if (el.children.length !== 0) continue;
    const t = (el.textContent || "").trim();
    if (!t) continue;
    if (!visible(el)) continue;
    const s = cs(el);
    const ell = s.textOverflow === "ellipsis";
    const yClip = (s.overflowY === "hidden" || s.overflowY === "clip") && el.scrollHeight > el.clientHeight + 3;
    const xClip = (s.overflowX === "hidden" || s.overflowX === "clip") && el.scrollWidth > el.clientWidth + 3;
    if (!yClip && !xClip) continue;
    out.clipped.push({ ...desc(el), ellipsis: ell, kind: yClip ? "dikey" : "yatay", over: yClip ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth, fs: s.fontSize });
    if (out.clipped.length >= 12) break;
  }

  // 5) Kırık görsel / çözülmemiş ikon
  out.brokenImg = Array.from(document.querySelectorAll("img"))
    .filter((i) => i.complete && i.naturalWidth === 0 && visible(i))
    .map((i) => ({ src: String(i.currentSrc || i.src).slice(0, 120), alt: i.alt || "", cls: String(i.className).slice(0, 60) }))
    .slice(0, 10);
  out.unresolvedIcons = document.querySelectorAll("i[data-lucide], span[data-lucide], div[data-lucide]").length;
  out.svgCount = document.querySelectorAll("svg").length;

  // 6) Küçük dokunma hedefi (mobil/tablet)
  //    Ölçülen PARMAĞIN GERÇEK İSABET ALANI, görünen kutu değil. nexus-ui.css'teki
  //    .nx-tap / .nx-tap-t sınıfları tasarımı bozmadan ::after ile dokunma kutusunu
  //    büyütüyor; getBoundingClientRect() bunu görmez, bu yüzden etrafındaki öğeleri
  //    yutmadığı sürece hedef yeterlidir. Doğrulama: merkezden dışa nokta atışı yapıp
  //    o noktada taramanın (elementFromPoint) hâlâ BU öğede kaldığını kontrol ederiz.
  //    Üstüne başka bir öğe biniyorsa taşma sayılmaz — denetim gerçek davranışı ölçür.
  //    Ayrıca hedef, eylemi KENDİSİ yapmayan bir öğe olabilir (ör. tetikleyici readonly
  //    alan, üstünde onclick olan hap kutunun içindedir): parmak hapın herhangi bir
  //    yerine bastığında eylemi ata yürütür. Bu yüzden eylemsiz öğede en yakın
  //    eylemli atayı ölçeriz — kullanıcı için dokunma bölgesi odur.
  //    İki sınır: 24px = WCAG 2.2 AA (SC 2.5.8) ZORUNLU, 32px = parmak için rahat sınır.
  out.tinyTargets = [];
  if (window.matchMedia("(pointer: coarse)").matches) {
    const DIRS = { sol: [-1, 0], sag: [1, 0], ust: [0, -1], alt: [0, 1] };
    // 1px adımla ve 0.5px içeriden bakılır: piksel sınırında isabet testi tanımsızdır,
    // yoksa tam 24px/32px olan hedef 23px/30px ölçülüp yanlış alarm üretir.
    const ownsAt = (el, x, y) => {
      const hit = document.elementFromPoint(x, y);
      return !!hit && (hit === el || el.contains(hit));
    };
    const hitBox = (el, r) => {
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // Merkez görünür alanda değilse isabet ölçülemez: görünen kutu raporlanır.
      if (cx < 1 || cy < 1 || cx > vw - 1 || cy > vh - 1) return { w: r.width, h: r.height };
      const half = { sol: r.width / 2, sag: r.width / 2, ust: r.height / 2, alt: r.height / 2 };
      for (const [k, [dx, dy]] of Object.entries(DIRS)) {
        let d = half[k];
        while (d + 1 <= 40 && ownsAt(el, cx + dx * (d + 0.5), cy + dy * (d + 0.5))) d += 1;
        half[k] = d;
      }
      return { w: half.sol + half.sag, h: half.ust + half.alt };
    };
    // Kendi dokunuşuna tepki veren öğe mi? (readonly alan yazı yazdırmaz, eylemsizdir)
    const selfAction = (el) => {
      if (el.onclick || el.getAttribute("onclick")) return true;
      if (el.getAttribute("role") === "button") return true;
      const t = el.tagName;
      if (t === "BUTTON" || t === "SELECT" || t === "TEXTAREA" || t === "PROGRESS") return !el.disabled;
      if (t === "A") return !!el.getAttribute("href");
      if (t === "INPUT") return !el.readOnly && !el.disabled && el.type !== "hidden";
      return false;
    };
    const actionAncestor = (el) => {
      let p = el.parentElement;
      while (p) {
        if (p.onclick || p.getAttribute("onclick") || p.getAttribute("role") === "button") return p;
        p = p.parentElement;
      }
      return null;
    };
    const seen = new Set();
    for (const el of document.querySelectorAll("a, button, input, select, textarea, [role='button'], [onclick]")) {
      if (!visible(el)) continue;
      const s = cs(el);
      if (s.pointerEvents === "none") continue;
      const r0 = rect(el);
      if (r0.top > vh || r0.bottom < 0) continue;            // ekran dışı (kaydırınca gelir)
      if (r0.width <= 2 && r0.height <= 2) continue;         // görsel olarak gizli switch/radio girişi (görünür hedef etikettir)
      const ctl = selfAction(el) ? el : actionAncestor(el);
      if (!ctl) continue;                                     // dokunulsa hiçbir şey olmayan öğe: hedef büyüklüğü anlamı yok
      if (seen.has(ctl)) continue;                            // aynı kabın birçok çocuğu: tek ölçüm
      seen.add(ctl);
      const r = rect(ctl);
      if (r.width <= 2 || r.height <= 2) continue;            // display:contents gibi ölçülemez kapsayıcı
      if (r.width >= 32 && r.height >= 32) continue;          // görünen kutu zaten yeterli: ek ölçüm gerekmez
      const hit = hitBox(ctl, r);
      if (hit.h >= 32 && hit.w >= 32) continue;               // ::after/ataya taşan kutu yeterli
      out.tinyTargets.push({
        ...desc(ctl),
        w: Math.round(hit.w),
        h: Math.round(hit.h),
        visW: Math.round(r.width),
        visH: Math.round(r.height),
        level: hit.w < 24 || hit.h < 24 ? "aa" : "konfor",
        via: ctl === el ? "" : `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} adına ölçüldü`,
      });
      if (out.tinyTargets.length >= 12) break;
    }
  }

  // 7) Çok küçük yazı
  out.tinyFont = [];
  for (const el of all) {
    if (el.children.length !== 0) continue;
    const t = (el.textContent || "").trim();
    if (!t || t.length < 2) continue;
    if (!visible(el)) continue;
    const r = rect(el);
    if (r.top > vh || r.bottom < 0) continue;
    const fs = parseFloat(cs(el).fontSize);
    if (fs > 0 && fs < 10.5) {
      out.tinyFont.push({ ...desc(el), fs: fs.toFixed(1) });
      if (out.tinyFont.length >= 10) break;
    }
  }

  // 8) Üst üste binen metinler (sabit/yapışkan kaplar hariç: içerik onların altından kayar, normaldir)
  const fixedAncestor = (el) => {
    let p = el;
    while (p && p !== root) {
      const s = cs(p);
      if (s.position === "fixed" || s.position === "sticky") return true;
      p = p.parentElement;
    }
    return false;
  };
  out.overlap = [];
  const leaves = [];
  window.scrollTo(0, 0);
  for (const el of all) {
    if (el.children.length !== 0) continue;
    const t = (el.textContent || "").trim();
    if (!t || t.length < 2) continue;
    if (!visible(el)) continue;
    if (fixedAncestor(el)) continue;
    const r = clipRectOf(el);
    if (r.bottom - r.top < 2 || r.right - r.left < 2) continue;
    if (r.top > vh || r.bottom < 0 || r.left > vw || r.right < 0) continue;
    if (cs(el).position === "fixed") continue;
    leaves.push({ el, r, t });
  }
  for (let i = 0; i < leaves.length; i++) {
    for (let j = i + 1; j < leaves.length; j++) {
      const a = leaves[i], b = leaves[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (ox <= 2 || oy <= 2) continue;
      const area = ox * oy;
      const smaller = Math.min((a.r.right - a.r.left) * (a.r.bottom - a.r.top), (b.r.right - b.r.left) * (b.r.bottom - b.r.top));
      if (smaller <= 0 || area / smaller < 0.35) continue;
      out.overlap.push({ a: desc(a.el), b: desc(b.el), area: Math.round(area), pct: Math.round((area / smaller) * 100) });
      if (out.overlap.length >= 8) i = leaves.length;
      if (out.overlap.length >= 8) break;
    }
  }

  // 9) CLS
  let cls = 0;
  try { for (const e of performance.getEntriesByType("layout-shift")) if (!e.hadRecentInput) cls += e.value; } catch {}
  out.cls = Number(cls.toFixed(3));

  // 10) Masaüstü kabuk ölçüsü
  if (out.isDesk) {
    const side = document.querySelector(".nx-side, aside, [data-purpose='side-nav']");
    out.sidebar = side && visible(side) ? { w: Math.round(rect(side).width) } : null;
    const main = document.querySelector("main");
    out.mainColW = main ? Math.round(rect(main).width) : null;
    out.mainLeft = main ? Math.round(rect(main).left) : null;
  }
  return out;
};

// ---------------------------------------------------------------- koşu
await mkdir(join(OUT, "shots"), { recursive: true });
const browser = await chromium.launch();

const contexts = {};
for (const pk of profileKeys) {
  for (const sk of Object.keys(STATES)) {
    const ctx = await browser.newContext({ ...PROFILES[pk] });
    ctx.setDefaultTimeout(15000);
    await ctx.addInitScript(
      ([user, seeded, devices]) => {
        try {
          localStorage.setItem("nexusCurrentUser", user);
          if (seeded) localStorage.setItem(`${user}_nexusPairedDevices`, JSON.stringify(devices));
        } catch (e) {}
      },
      [QA_USER, sk === "devices", SEEDED_DEVICES],
    );
    contexts[`${pk}|${sk}`] = ctx;
  }
}

const jobs = [];
for (const page of pages) {
  for (const pk of profileKeys) {
    for (const sk of Object.keys(STATES)) {
      // cihazlı durum yalnızca telefon + masaüstünde (hız için)
      if (sk === "devices" && pk !== "phone" && pk !== "desktop") continue;
      jobs.push({ page, pk, sk });
    }
  }
}

const results = [];
let done = 0;
const CONCURRENCY = 4;

async function runJob(job) {
  const { page, pk, sk } = job;
  const ctx = contexts[`${pk}|${sk}`];
  // Public (giriş) sayfaları oturumsuz bağlamda da denenmeli: auth guard oturumlu
  // kullanıcıyı eve yönlendirir. Bu yüzden public sayfalar için ayrıca anonim bağlam.
  const pg = await ctx.newPage();
  const consoleErrors = [], pageErrors = [], failedReqs = [];
  pg.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
  pg.on("pageerror", (e) => pageErrors.push(String(e.message).slice(0, 200)));
  pg.on("requestfailed", (r) => {
    const u = r.url();
    if (u.includes("127.0.0.1") || u.startsWith("data:")) failedReqs.push(`${u.replace(`http://127.0.0.1:${PORT}/`, "")} → ${r.failure()?.errorText}`);
  });
  pg.on("response", (r) => { if (r.status() >= 400 && r.url().includes("127.0.0.1")) failedReqs.push(`${r.url().replace(`http://127.0.0.1:${PORT}/`, "")} → HTTP ${r.status()}`); });

  const rec = { page, profile: pk, state: sk, url: `http://127.0.0.1:${PORT}/${page}` };
  try {
    const resp = await pg.goto(rec.url, { waitUntil: "domcontentloaded", timeout: 20000 });
    rec.httpStatus = resp?.status();
    await pg.waitForTimeout(1600);
    rec.landedOn = pg.url().includes(page) ? page : pg.url().split("/").pop();
    rec.metrics = await pg.evaluate(MEASURE);
    if (!NO_SHOTS) {
      const base = join(OUT, "shots", `${page.replace(/\.html$/, "")}__${pk}__${sk}`);
      try { await pg.screenshot({ path: `${base}.png` }); } catch (e) { rec.shotErr = String(e).slice(0, 90); }
      if (pk === "phone" || pk === "desktop") {
        try { await pg.screenshot({ path: `${base}-full.png`, fullPage: true }); } catch {}
      }
    }
  } catch (e) {
    rec.error = String(e).split("\n")[0].slice(0, 160);
  }
  rec.consoleErrors = [...new Set(consoleErrors)].slice(0, 8);
  rec.pageErrors = [...new Set(pageErrors)].slice(0, 8);
  rec.failedReqs = [...new Set(failedReqs)].slice(0, 12);
  await pg.close();
  done++;
  if (done % 20 === 0) console.log(`  ... ${done}/${jobs.length}`);
  results.push(rec);
}

const queue = [...jobs];
const workers = Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const j = queue.shift();
    await runJob(j);
  }
});
await Promise.all(workers);

// Public sayfaların ANONİM (oturumsuz) denemesi — gerçek ilk açılış
const anonResults = [];
for (const pk of ["phone", "desktop"]) {
  const ctx = await browser.newContext({ ...PROFILES[pk] });
  ctx.setDefaultTimeout(15000);
  for (const page of [...PUBLIC_PAGES].filter((p) => pages.includes(p))) {
    const pg = await ctx.newPage();
    const ce = [], pe = [];
    pg.on("console", (m) => { if (m.type() === "error") ce.push(m.text().slice(0, 200)); });
    pg.on("pageerror", (e) => pe.push(String(e.message).slice(0, 200)));
    const rec = { page, profile: pk, state: "anonim", url: `http://127.0.0.1:${PORT}/${page}` };
    try {
      await pg.goto(rec.url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await pg.waitForTimeout(1600);
      rec.landedOn = pg.url().split("/").pop();
      rec.metrics = await pg.evaluate(MEASURE);
      if (!NO_SHOTS) await pg.screenshot({ path: join(OUT, "shots", `${page.replace(/\.html$/, "")}__${pk}__anonim.png`) });
    } catch (e) { rec.error = String(e).split("\n")[0].slice(0, 160); }
    rec.consoleErrors = [...new Set(ce)].slice(0, 8);
    rec.pageErrors = [...new Set(pe)].slice(0, 8);
    await pg.close();
    anonResults.push(rec);
  }
  await ctx.close();
}
results.push(...anonResults);

await browser.close();
server.close();

await writeFile(join(OUT, "report.json"), JSON.stringify(results, null, 1));
console.log(`\nTAMAM: ${results.length} ölçüm → ${join(OUT, "report.json")}`);
console.log(`Ekran görüntüleri: ${join(OUT, "shots")}`);
