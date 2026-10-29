// NEXUS arayüz denetimi özeti — ui-audit.mjs çıktısını (report.json) insan okur bulgu
// listesine çevirir. Kullanım: SERVE_DIR=www node scripts/ui-audit-summary.mjs  (pnpm audit:ui:summary)
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = `.shot-ui-audit-${process.env.SERVE_DIR || "www"}`;
const R = JSON.parse(await readFile(join(ROOT, DIR, "report.json"), "utf8"));
const AUTH_PAGES = ["nexus-login.html", "nexus-register.html", "nexus-forgot-password.html", "nexus-onboarding.html", "index.html"];

const PLABEL = { phone: "Telefon", tablet: "Tablet", desktop: "Bilgisayar", deskmin: "Electron-900" };
const SLABEL = { fresh: "cihazsız", devices: "cihazlı", anonim: "anonim" };
const key = (r) => `${r.page}`;
const byPage = new Map();
for (const r of R) {
  if (!byPage.has(key(r))) byPage.set(key(r), []);
  byPage.get(key(r)).push(r);
}

const buckets = {
  hardError: [], mode: [], overflow: [], navCover: [], headerCover: [], clipped: [],
  brokenAsset: [], icons: [], tinyTarget: [], tinyFont: [], overlap: [], empty: [],
  jsError: [], netFail: [], redirect: [], cls: [], deskWidth: [],
};

for (const r of R) {
  // Oturum açıkken public sayfalar eve yönlendirir; ölçüm home'un olur, atla.
  const isPublicPage = ["nexus-login.html", "nexus-onboarding.html", "nexus-forgot-password.html", "nexus-register.html"].includes(r.page);
  if (isPublicPage && r.state !== "anonim") continue;
  const tag = `${r.page} · ${PLABEL[r.profile]} · ${SLABEL[r.state]}`;
  const m = r.metrics || {};
  if (r.error) buckets.hardError.push(`${tag}: YÜKLENEMEDİ — ${r.error}`);
  if (r.httpStatus && r.httpStatus !== 200) buckets.hardError.push(`${tag}: HTTP ${r.httpStatus}`);
  if (r.landedOn && r.landedOn !== r.page && !r.error) {
    const isPublic = ["nexus-login.html", "nexus-onboarding.html", "nexus-forgot-password.html", "nexus-register.html"].includes(r.page);
    // Oturum açıkken public sayfadan eve yönlendirmek TASARIM gereği; anonimken yönlendirme ise hatadır.
    if (!(isPublic && r.state !== "anonim")) buckets.redirect.push(`${tag}: → ${r.landedOn}`);
  }

  // Mod beklentileri
  if (r.profile === "desktop" || r.profile === "deskmin") {
    if (r.profile === "desktop" && !m.isDesk) buckets.mode.push(`${tag}: nx-desk AÇILMADI (masaüstü düzeni yok)`);
    if (r.profile === "deskmin" && m.isDesk) buckets.mode.push(`${tag}: 900px'te nx-desk açık (beklenmiyordu)`);
  }
  if (r.profile === "tablet") {
    if (!m.isTab) buckets.mode.push(`${tag}: nx-tab açılmadı`);
    if (m.isDesk) buckets.mode.push(`${tag}: tablette nx-desk açıldı (telefon düzeni olmalıydı)`);
  }
  if (r.profile === "phone" && (m.isDesk || m.isTab)) buckets.mode.push(`${tag}: telefonda masaüstü/tablet sınıfı var`);

  if (m.hOverflowPx > 1) buckets.overflow.push(`${tag}: yatay taşma ${m.hOverflowPx}px (scrollW ${m.docScrollW} > ${m.docClientW})`);
  else if ((m.overflow || []).length) buckets.overflow.push(`${tag}: taşan öğe var ama belge kaydırmıyor → ${(m.overflow || []).map((o) => `${o.tag}${o.id ? "#" + o.id : ""}.${o.cls.split(" ")[0] || ""}(sağ ${o.right})`).slice(0, 3).join(", ")}`);

  if ((m.navCovered || []).length) buckets.navCover.push(`${tag}: alt menü içeriğin üstünde → ${(m.navCovered || []).map((c) => `${c.tag}${c.id ? "#" + c.id : ""} "${c.txt}" (${c.hidden}px gizli)`).slice(0, 3).join(" | ")}`);
  if ((m.headerCovered || []).length) buckets.headerCover.push(`${tag}: sabit başlık içeriğin üstünde → ${(m.headerCovered || []).map((c) => `${c.tag}${c.id ? "#" + c.id : ""} "${c.txt}"`).slice(0, 3).join(" | ")}`);
  if ((m.clipped || []).length) buckets.clipped.push(`${tag}: kesik metin → ${(m.clipped || []).map((c) => `"${c.txt}" ${c.kind} +${Math.round(c.over)}px${c.ellipsis ? " (ellipsis)" : ""}`).slice(0, 4).join(" | ")}`);
  if ((m.brokenImg || []).length) buckets.brokenAsset.push(`${tag}: kırık görsel → ${(m.brokenImg || []).map((b) => b.src).slice(0, 4).join(", ")}`);
  if (m.unresolvedIcons > 0) buckets.icons.push(`${tag}: ${m.unresolvedIcons} lucide ikonu çözümlenmemiş (ham <i data-lucide>)`);
  const tt = (m.tinyTargets || []).map((t) => `${t.tag}${t.id ? "#" + t.id : ""} "${t.txt}" isabet ${t.w}×${t.h}${t.visW !== t.w || t.visH !== t.h ? ` (görünen ${t.visW}×${t.visH})` : ""}${t.level === "aa" ? " [AA ALTINDA]" : ""}`);
  if (tt.length) buckets.tinyTarget.push(`${tag}: küçük dokunma hedefi → ${tt.slice(0, 4).join(" | ")}`);
  if ((m.tinyFont || []).length) buckets.tinyFont.push(`${tag}: çok küçük yazı → ${(m.tinyFont || []).map((t) => `"${t.txt}" ${t.fs}px`).slice(0, 4).join(" | ")}`);
  if ((m.overlap || []).length) buckets.overlap.push(`${tag}: üst üste binen metin → ${(m.overlap || []).map((o) => `"${o.a.txt}" × "${o.b.txt}" %${o.pct}`).slice(0, 3).join(" | ")}`);
  if (m.bodyTextLen !== undefined && m.bodyTextLen < 25) buckets.empty.push(`${tag}: sayfa neredeyse boş (${m.bodyTextLen} karakter metin)`);
  if (m.cls > 0.05) buckets.cls.push(`${tag}: CLS ${m.cls}`);
  if ((r.pageErrors || []).length) buckets.jsError.push(`${tag}: JS HATASI → ${r.pageErrors.join(" || ")}`);
  if ((r.consoleErrors || []).length) buckets.jsError.push(`${tag}: console.error → ${r.consoleErrors.slice(0, 3).join(" || ")}`);
  if ((r.failedReqs || []).length) buckets.netFail.push(`${tag}: istek başarısız → ${r.failedReqs.slice(0, 6).join(", ")}`);
  if (r.profile === "desktop" && m.isDesk && !AUTH_PAGES.includes(r.page)) {
    if (!m.sidebar) buckets.deskWidth.push(`${tag}: sol menü bulunamadı/görünmüyor`);
    if (m.mainColW && m.mainColW > 1300) buckets.deskWidth.push(`${tag}: içerik sütunu çok geniş (${m.mainColW}px)`);
  }
}

const TITLES = {
  hardError: "A) AÇILMAYAN / HATA VEREN EKRAN",
  jsError: "B) JAVASCRIPT HATALARI",
  mode: "C) YANLIŞ DÜZEN MODU (telefon/tablet/masaüstü)",
  overflow: "D) YATAY TAŞMA",
  navCover: "E) ALT MENÜ İÇERİĞİ YUTUYOR",
  headerCover: "F) SABİT BAŞLIK İÇERİĞİ YUTUYOR",
  overlap: "G) ÜST ÜSTE BİNEN METİN",
  clipped: "H) KESİK METİN",
  brokenAsset: "I) KIRIK GÖRSEL",
  icons: "J) ÇÖZÜMLENMEMİŞ İKON",
  netFail: "K) BAŞARISIZ İSTEK (yerel dosya 404 vb.)",
  tinyTarget: "L) KÜÇÜK DOKUNMA HEDEFİ (gerçek isabet alanı <32px; AA sınırı 24px)",
  tinyFont: "M) ÇOK KÜÇÜK YAZI (<10.5px)",
  empty: "N) BOŞ EKRAN",
  cls: "O) YÜKSEK CLS",
  deskWidth: "P) MASAÜSTÜ KABUK SORUNU",
  redirect: "R) BEKLENMEDİK YÖNLENDİRME",
};

let total = 0;
const lines = [];
lines.push(`TOPLAM ÖLÇÜM: ${R.length}  ·  SAYFA: ${byPage.size}`);
lines.push(`PROFİLLER: ${[...new Set(R.map((r) => r.profile))].join(", ")}`);
lines.push("");
for (const k of Object.keys(TITLES)) {
  const b = buckets[k];
  if (!b.length) continue;
  total += b.length;
  lines.push(`### ${TITLES[k]} — ${b.length} kayıt`);
  for (const x of b) lines.push(`  • ${x}`);
  lines.push("");
}
lines.push(`TOPLAM BULGU KAYDI: ${total}`);

/* KALICI KAPI — WCAG 2.2 AA (SC 2.5.8): 24px altında GERÇEK dokunma hedefi bırakılamaz.
   Ölçüm isabet alanıdır (::after taşması ve eylemi yürüten ata kapsayıcı dahil), bu
   yüzden "görünen kutu küçük" tek başına ihlal sayılmaz; 24–31px arası konfor uyarısıdır.
   AA altı kayıt varsa betik 1 ile çıkar → pnpm audit:all durur, düzeltme unutulamaz. */
const aaTargets = [];
for (const r of R) {
  for (const t of (r.metrics || {}).tinyTargets || []) {
    if (t.level !== "aa") continue;
    aaTargets.push(`${r.page} · ${PLABEL[r.profile]} · ${SLABEL[r.state]}: ${t.tag}${t.id ? "#" + t.id : ""} "${t.txt}" isabet ${t.w}×${t.h} (görünen ${t.visW}×${t.visH})`);
  }
}
const uniq = [...new Set(aaTargets.map((x) => x.split(": ")[1]))];
lines.push("");
lines.push(`AA ALTINDA DOKUNMA HEDEFİ: ${uniq.length} kontrol${uniq.length ? " → " + uniq.join(" | ") : " (yok)"}`);
if (uniq.length) process.exitCode = 1;
const out = lines.join("\n");
console.log(out);
await (await import("node:fs/promises")).writeFile(join(ROOT, DIR, "summary.txt"), out);
