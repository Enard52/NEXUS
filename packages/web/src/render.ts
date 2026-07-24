import { type DesignTokens } from "@nexus/design-system";
import { type VersionInfoService } from "@nexus/infra";
import { CATALOGS, type Locale } from "@nexus/i18n";
import {
  type BillingModel,
  type DeviceListModel,
  type FamilyModel,
  type HomeStateModel,
  type ScreenDescriptor,
  type PersonalizationModel,
  type SkillsModel,
  type SuggestionsModel,
  type TodayModel,
  type ScreenId,
} from "@nexus/interface";

export let CURRENT_LOCALE: string = "en";

export function setLocale(locale: string): void {
  CURRENT_LOCALE = locale;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function faviconDataUri(primaryColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${primaryColor}"/><text x="16" y="22" font-size="18" font-weight="bold" text-anchor="middle" fill="white">N</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function label(key: string): string {
  const locale = (CURRENT_LOCALE in CATALOGS ? CURRENT_LOCALE : "en") as Locale;
  const catalog = CATALOGS[locale];
  return (catalog as Record<string, string>)[key] ?? key;
}

function renderStatIcon(icon: string): string {
  const icons: Record<string, string> = {
    devices: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="14" height="10" rx="1.5"/><rect x="16" y="9" width="6" height="11" rx="1.5"/></svg>`,
    energy: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    routines: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    suggestions: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.1V17h6v-1.4c0-.8.4-1.5 1-2.1A6 6 0 0 0 12 3ZM9 20h6"/></svg>`,
  };
  return icons[icon] ?? icons.devices;
}

/** An on-brand, honest empty state shown when a user genuinely has no data yet. */
function renderEmptyState(text: string): string {
  return (
    `<div class="empty-state"><span class="empty-icon">${renderStatIcon("suggestions")}</span>` +
    `<p>${escapeHtml(text)}</p></div>`
  );
}

function parseRatio(value: string): { a: number; b: number } | null {
  const m = /^(\d+)\s*\/\s*(\d+)$/.exec(value.trim());
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return b > 0 ? { a, b } : null;
}

function renderRing(pct: number, center: string): string {
  const radius = 34;
  const circ = 2 * Math.PI * radius;
  const filled = Math.max(0, Math.min(1, pct)) * circ;
  return (
    `<svg class="ring" width="96" height="96" viewBox="0 0 96 96" role="img" aria-hidden="true">` +
    `<circle cx="48" cy="48" r="${radius}" fill="none" stroke="var(--border)" stroke-width="9"/>` +
    `<circle cx="48" cy="48" r="${radius}" fill="none" stroke="var(--primary)" stroke-width="9" ` +
    `stroke-linecap="round" stroke-dasharray="${filled.toFixed(1)} ${circ.toFixed(1)}" ` +
    `transform="rotate(-90 48 48)"/>` +
    `<text x="48" y="54" text-anchor="middle" font-size="22" font-weight="700" fill="var(--text)">` +
    `${escapeHtml(center)}</text></svg>`
  );
}

function bentoTile(
  icon: string,
  title: string,
  value: string,
  extraClass = "",
): string {
  return (
    `<article class="bento-tile${extraClass ? ` ${extraClass}` : ""}">` +
    `<div class="tile-head"><span class="cardicon">${renderStatIcon(icon)}</span>` +
    `<span class="tile-title">${escapeHtml(title)}</span></div>` +
    `<div class="value">${escapeHtml(value)}</div></article>`
  );
}

export function renderTodayPanel(model: TodayModel): string {
  const byKey = (k: string): string => model.cards.find((c) => c.labelKey === k)?.value ?? "";
  const devicesVal = byKey("today.devicesOnline");
  const ratio = parseRatio(devicesVal);
  const pct = ratio ? ratio.a / ratio.b : 0;
  const offline = ratio ? ratio.b - ratio.a : 0;

  const featured =
    `<article class="bento-tile featured">` +
    `<div class="tile-head"><span class="cardicon">${renderStatIcon("devices")}</span>` +
    `<span class="tile-title">${label("today.devicesOnline")}</span></div>` +
    `<div class="ring-wrap">${renderRing(pct, devicesVal)}` +
    `<div class="ring-meta"><span class="value">${Math.round(pct * 100)}% online</span>` +
    `<span class="label">${offline > 0 ? `${offline} offline` : "All devices online"}</span>` +
    `</div></div></article>`;

  const energy = bentoTile("energy", label("today.energy"), byKey("today.energy"), "wide");
  const routines = bentoTile("routines", label("today.activeRoutines"), byKey("today.activeRoutines"));
  const suggestions = bentoTile("suggestions", label("today.suggestions"), byKey("today.suggestions"));

  const sug = model.cards.find((c) => c.labelKey === "today.suggestions")?.value ?? "0";
  const msg = model.hasNudge
    ? `${sug} suggestion${sug === "1" ? "" : "s"} ready for you.`
    : "You're all caught up.";
  const strip =
    `<div class="assistant-strip"><span class="cardicon">${renderStatIcon("suggestions")}</span>` +
    `<div><span class="who">NEXUS AI</span> <span class="msg">${msg}</span></div>` +
    `<a class="btn" href="#suggestions" data-nav="suggestions">Review</a></div>`;

  const nudge = model.hasNudge ? '<span class="nudge" aria-label="new"></span>' : "";
  return (
    `${nudge ? `<h2>${escapeHtml(label(model.titleKey))}<span class="nudge" aria-label="new"></span></h2>` : `<h2>${escapeHtml(label(model.titleKey))}</h2>`}<div class="bento">${featured}${energy}${routines}${suggestions}${strip}</div>`
  );
}

export function renderToday(model: TodayModel): string {
  const cards = model.cards.map((c) =>
    `<div class="card"><span class="cardicon">${renderStatIcon(c.labelKey.includes("energy") ? "energy" : c.labelKey.includes("Routines") ? "routines" : c.labelKey.includes("suggestions") ? "suggestions" : "devices")}</span><div class="value">${escapeHtml(c.value)}</div><div class="label">${escapeHtml(label(c.labelKey))}</div></div>`
  ).join("");
  const nudge = model.hasNudge ? '<span class="nudge" aria-label="new"></span>' : "";
  return `<h2>${escapeHtml(label(model.titleKey))}${nudge}</h2><div class="cards">${cards}</div>`;
}

export function renderHomeState(model: HomeStateModel): string {
  if (model.rooms.length === 0) {
    return `<h2>${escapeHtml(label(model.titleKey))}</h2>${renderEmptyState(label(model.emptyStateKey ?? "screen.homeState.empty"))}`;
  }
  const rooms = model.rooms.map((r) =>
    `<div class="room-card">${renderStatIcon("devices")}<div class="room-info"><div class="label">${escapeHtml(r.room)}</div><div class="value">${r.online}/${r.total} devices online</div></div></div>`
  ).join("");
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid">${rooms}</div>`;
}

export function renderDevices(model: DeviceListModel): string {
  const isTr = CURRENT_LOCALE === "tr";
  if (model.rows.length === 0) {
    return `<h2>${escapeHtml(label(model.titleKey))}</h2>${renderEmptyState(label(model.emptyStateKey ?? "screen.devices.empty"))}`;
  }
  const pills = model.rows.map((d) =>
    `<div class="device-pill"><span class="dev-icon">${renderStatIcon("devices")}</span><div class="dev-info"><div class="dev-name">${escapeHtml(d.nameKey)}</div><div class="dev-room">${d.online ? (isTr ? "Çevrimiçi" : "Online") : (isTr ? "Çevrimdışı" : "Offline")}</div></div><span class="dot ${d.online ? "on" : "off"}" title="${d.online ? "Online" : "Offline"}"></span></div>`
  ).join("");
  const meta = `${model.onlineCount}/${model.rows.length} ${isTr ? "çevrimiçi" : "online"}`;
  return `<h2>${escapeHtml(label(model.titleKey))} <span class="meta">${meta}</span></h2><div class="bento-grid">${pills}</div>`;
}

export function renderSuggestions(model: SuggestionsModel): string {
  const isTr = CURRENT_LOCALE === "tr";
  if (model.rows.length === 0) {
    return `<h2>${escapeHtml(label(model.titleKey))}</h2>${renderEmptyState(label(model.emptyStateKey ?? "screen.suggestions.empty"))}`;
  }
  const cards = model.rows.map((s) =>
    `<div class="suggest-card"><div class="value" style="font-size:14px;font-weight:600;">${escapeHtml(s.textKey)}</div><div class="meta">${s.at}</div><div class="actions"><button class="btn primary">${isTr ? "Kabul Et" : "Accept"}</button><button class="btn">${isTr ? "Reddet" : "Dismiss"}</button></div></div>`
  ).join("");
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid">${cards}</div>`;
}

export function renderSkills(model: SkillsModel): string {
  if (model.rows.length === 0) {
    return `<h2>${escapeHtml(label(model.titleKey))}</h2>${renderEmptyState(label(model.emptyStateKey ?? "screen.skills.empty"))}`;
  }
  const maxCount = model.rows.length > 0 ? Math.max(...model.rows.map((s) => s.usageCount)) : 1;
  const bars = model.rows.map((s) => {
    const pct = Math.round((s.usageCount / maxCount) * 100);
    return `<div class="skill-bar-wrap"><div class="skill-bar-header"><span>${escapeHtml(s.nameKey)}</span><span class="count">${s.usageCount}&times;</span></div><div class="skill-bar-track"><div class="skill-bar-fill" style="width: ${pct}%"></div></div></div>`;
  }).join("");
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid wide">${bars}</div>`;
}

export function renderFamily(model: FamilyModel): string {
  const cards = model.members.map((m) => {
    const initial = m.nameKey.charAt(0).toUpperCase();
    return `<div class="member-card"><span class="avatar" style="width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--tint);color:var(--primary);font-weight:700;font-size:12.8px;">${escapeHtml(initial)}</span><div><div style="font-weight:600;">${escapeHtml(m.nameKey)}</div><div class="meta">${escapeHtml(m.role)}</div></div></div>`;
  }).join("");
  return `<h2>${escapeHtml(label(model.titleKey))} <span class="meta">${model.adminCount} admin</span></h2><div class="bento-grid">${cards}</div>`;
}

export function renderBilling(model: BillingModel): string {
  const isTr = CURRENT_LOCALE === "tr";
  const planLabel = label(model.planLabelKey);
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid wide"><div class="plan-card"><div class="price">${model.plan === "free" ? "$0" : "$49"} <span>/ ${isTr ? "ay" : "mo"}</span></div><div>${escapeHtml(planLabel)}</div>${model.canUpgrade ? `<button class="btn primary">${isTr ? "Yükselt" : "Upgrade"}</button>` : `<button class="btn primary">${isTr ? "Yönet" : "Manage"}</button>`}</div></div>`;
}

export function renderPersonalization(model: PersonalizationModel): string {
  const isTr = CURRENT_LOCALE === "tr";
  const lang = model.language === "tr" ? "Türkçe (TR)" : "English (EN)";
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid wide"><div class="field-row"><span class="label">${isTr ? "Asistan Adı" : "Assistant Name"}</span><span class="value">${escapeHtml(model.assistantName)}</span></div><div class="field-row"><span class="label">${isTr ? "Size Hitap Şekli" : "Addresses You As"}</span><span class="value">${escapeHtml(model.userAddress)}</span></div><div class="field-row"><span class="label">${isTr ? "Dil" : "Language"}</span><span class="value">${escapeHtml(lang)}</span></div></div>`;
}

export function renderDownloadCenter(releases: VersionInfoService, userAgent: string, _surface?: string): string {
  const all = releases.all();
  const featured = releases.featuredFor(userAgent);
  const featureHtml = featured
    ? `<a class="dl-primary btn primary" href="${escapeHtml(featured.downloadUrl)}" download>${label("mkt.hero.actionPrimary").replace("{os}", featured.platform === "windows" ? "Windows" : featured.platform === "macos" ? "macOS" : featured.platform === "linux" ? "Linux" : featured.platform.toUpperCase()).replace("{version}", escapeHtml(featured.version))}</a>`
    : `<p>Choose your platform</p>`;

  const rows = all.map((r) =>
    `<tr><td>${escapeHtml(r.platform === "windows" ? "Windows" : r.platform === "macos" ? "macOS" : r.platform === "linux" ? "Linux" : r.platform.toUpperCase())}</td><td>${escapeHtml(r.version)}</td><td>${escapeHtml(r.minOs)}</td><td><code class="sha-code" title="SHA-256 Checksum" style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" onclick="navigator.clipboard.writeText('${escapeHtml(r.checksumSha256)}')">${escapeHtml(r.checksumSha256.substring(0, 12))}... <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></code></td></tr>`
  ).join("");

  const changelog = featured ? `<div class="changelog"><h4>${label("mkt.changelog.title").replace("{version}", escapeHtml(featured.version))}</h4><p>&bull; Initial release of the new local processing engine.<br>&bull; Improved UI performance.<br>&bull; Security patches for background sync.</p></div>` : "";

  return `<div class="download-container">${featureHtml}${changelog}<table><thead><tr><th>Platform</th><th>Version</th><th>Minimum OS</th><th>SHA-256 Checksum</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function renderLogo(_primaryColor?: string): string {
  return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="NEXUS logo" role="img">
    <rect width="32" height="32" rx="6" fill="var(--primary)"/>
    <text x="16" y="22" font-size="18" font-weight="bold" text-anchor="middle" fill="white">N</text>
  </svg>`;
}

export function renderAppIconSvg(primaryColor = "#5b8dff"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="96" fill="${primaryColor}"/>
    <text x="256" y="340" font-size="240" font-weight="bold" text-anchor="middle" fill="white" font-family="system-ui">N</text>
  </svg>`;
}

export function renderAvatar(url?: string, initial?: string): string {
  if (url) {
    return `<img class="avatar-img" src="${escapeHtml(url)}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" />`;
  }
  const ch = (initial ?? "?").charAt(0).toUpperCase();
  return `<span class="avatar" style="width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--tint);color:var(--primary);font-weight:700;font-size:12.8px;">${escapeHtml(ch)}</span>`;
}

export function renderOgImageSvg(theme: DesignTokens): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${theme.color.bg}"/>
    <text x="600" y="360" font-size="120" font-weight="bold" text-anchor="middle" fill="${theme.color.primary}" font-family="system-ui">NEXUS</text>
  </svg>`;
}

export function renderHeader(_primaryColor: string): string {
  return `<header class="site-header"><a class="skip" href="#main">Skip to content</a><div class="navbar"><div class="nav-container"><div class="nav-brand-group"><a href="#" class="nav-brand">${renderLogo()}<span class="brand">NEXUS</span></a></div></div></div></header>`;
}

export function renderHero(): string {
  const isTr = CURRENT_LOCALE === "tr";
  return `<section class="hero"><h1>${isTr ? "Evini Tanıyan Kişisel İşletim Sistemi" : "Your personal operating system for home"}</h1><p class="lede">${isTr ? "Sesinizle kontrol edin, rutinlerinizi otomatikleştirin ve evinizdeki her cihaz\u0131 tek bir yerden Yönetin." : "Control with your voice, automate your routines, and manage every device in your home from one place."}</p><div class="actions"><a class="btn btn-primary" href="#download-center">${isTr ? "Ücretsiz İndir" : "Download Free"}</a><a class="btn btn-secondary" href="#today">${isTr ? "Panele Git" : "Go to Dashboard"}</a></div><p class="trust">${isTr ? "★ 500,000+ kullanıcı · 2000+ akıllı cihaz · %100 yerel gizlilik" : "★ 500,000+ users · 2000+ smart devices · 100% local privacy"}</p></section>`;
}

export function renderNav(nav: readonly ScreenDescriptor[], activeId: ScreenId): string {
  const links = nav.map((s) =>
    `<a class="${s.id === activeId ? "active" : ""}" href="#${s.id}" data-nav="${s.id}"${s.id === activeId ? ' aria-current="page"' : ""}>${escapeHtml(label(s.titleKey))}</a>`
  ).join("");
  return `<nav class="web-nav" aria-label="Primary">${links}</nav>`;
}

export function renderFeatures(): string {
  const features = [
    { title: label("mkt.feat.1.title"), desc: label("mkt.feat.1.desc") },
    { title: label("mkt.feat.2.title"), desc: label("mkt.feat.2.desc") },
    { title: label("mkt.feat.3.title"), desc: label("mkt.feat.3.desc") },
    { title: label("mkt.feat.4.title"), desc: label("mkt.feat.4.desc") },
  ];
  const items = features.map((f) =>
    `<div class="feature-card"><span class="icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></span><h3>${escapeHtml(f.title)}</h3><p>${escapeHtml(f.desc)}</p></div>`
  ).join("");
  return `<section class="features" aria-label="${label("mkt.feat.why")}"><div class="feature-grid">${items}</div></section>`;
}

export function renderFaq(): string {
  const faqs = [
    { q: label("mkt.faq.1.q"), a: label("mkt.faq.1.a") },
    { q: label("mkt.faq.2.q"), a: label("mkt.faq.2.a") },
    { q: label("mkt.faq.3.q"), a: label("mkt.faq.3.a") },
    { q: label("mkt.faq.4.q"), a: label("mkt.faq.4.a") },
  ];
  const items = faqs.map((f) =>
    `<details class="faq-item" open><summary class="faq-q"><span>${escapeHtml(f.q)}</span><span class="faq-icon">+</span></summary><p class="faq-a">${escapeHtml(f.a)}</p></details>`
  ).join("");
  return `<section class="faq-section" aria-label="${label("mkt.faq.title")}"><h2>${label("mkt.faq.title")}</h2><div class="faq-grid">${items}</div></section>`;
}

export function renderRichFooter(_primaryColor: string): string {
  return `<footer class="footer">
  <div class="footer-container">
    <div class="footer-grid">
      <div class="footer-col">
        <div class="footer-brand">${renderLogo()}<span class="brand">NEXUS</span></div>
        <p class="footer-desc">${label("mkt.footer.desc")}</p>
        <span class="version-badge">v3.14.2</span>
      </div>
      <div class="footer-col">
        <h4>${label("mkt.footer.product")}</h4>
        <ul>
          <li><a href="#features">${label("mkt.nav.features")}</a></li>
          <li><a href="#preview">${label("mkt.nav.preview")}</a></li>
          <li><a href="#faq">${label("mkt.nav.faq")}</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>${label("mkt.nav.download")}</h4>
        <ul>
          <li><a href="#download">Windows</a></li>
          <li><a href="#download">macOS</a></li>
          <li><a href="#download">Linux</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>${label("mkt.footer.company")}</h4>
        <ul>
          <li><a href="#about">${label("mkt.footer.about")}</a></li>
          <li><a href="/privacy">${label("mkt.footer.privacy")}</a></li>
          <li><a href="/terms">${label("mkt.footer.terms")}</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div>&copy; 2026 NEXUS Technologies Inc. &middot; <span style="opacity:0.7">${label("mkt.footer.noCookies")}</span></div>
      <div class="footer-bottom-links">
        <a href="#">Twitter/X</a> &middot; <a href="#">GitHub</a> &middot; <a href="#">Discord</a>
      </div>
    </div>
  </div>
</footer>`;
}

export function renderCookieBanner(): string {
  return `<div id="cookie-banner" class="cookie-banner" role="alert" aria-live="polite">
    <div class="cb-content">
      <strong>${label("mkt.cookie.title")}</strong>
      <p>${label("mkt.cookie.desc")}</p>
    </div>
    <div class="cb-actions">
      <button class="btn secondary cb-decline">${label("mkt.cookie.decline")}</button>
      <button class="btn primary cb-accept">${label("mkt.cookie.accept")}</button>
    </div>
  </div>`;
}

export function renderPricing(): string {
  return `<section id="pricing" class="mkt-pricing mkt-anchor">
<div class="mkt-heading"><h2>${label("mkt.pricing.title")}</h2></div>
<div class="pricing-grid">
  <div class="pricing-card">
    <h3>${label("mkt.pricing.free")}</h3>
    <p>${label("mkt.pricing.freeDesc")}</p>
    <div class="price">$0<span>/mo</span></div>
    <a href="#download" class="btn primary">${label("mkt.pricing.cta")}</a>
  </div>
  <div class="pricing-card premium">
    <h3>${label("mkt.pricing.premium")}</h3>
    <p>${label("mkt.pricing.premiumDesc")}</p>
    <div class="price">$5<span>/mo</span></div>
    <a href="#download" class="btn">${label("mkt.pricing.cta")}</a>
  </div>
  <div class="pricing-card">
    <h3>${label("mkt.pricing.family")}</h3>
    <p>${label("mkt.pricing.familyDesc")}</p>
    <div class="price">$10<span>/mo</span></div>
    <a href="#download" class="btn">${label("mkt.pricing.cta")}</a>
  </div>
</div>
</section>`;
}

export function renderTestimonials(): string {
  return `<section class="mkt-testimonials">
<div class="mkt-heading"><h2>${label("mkt.testimonials.title")}</h2></div>
<div class="testimonial-card">
  <p>${label("mkt.testimonials.quote1")}</p>
  <div class="author">&mdash; Early Adopter</div>
</div>
</section>`;
}

export function renderIntegrationMarquee(): string {
  return `<section class="mkt-integrations">
<p class="integration-title">${label("mkt.integrations.title")}</p>
<div class="marquee">
  <span>Matter</span> &middot; <span>Zigbee</span> &middot; <span>Z-Wave</span> &middot; <span>HomeKit</span> &middot; <span>Philips Hue</span> &middot; <span>Sonos</span> &middot; <span>Nest</span> &middot; <span>Ring</span>
</div>
</section>`;
}

export function renderStyles(theme: DesignTokens): string {
  const t = theme;
  return `:root {
  --bg: ${t.color.bg};
  --surface: ${t.color.surface};
  --text: ${t.color.text};
  --muted: ${t.color.textMuted};
  --primary: ${t.color.primary};
  --on-primary: ${t.color.onPrimary};
  --radius: ${t.radius.md}px;
  --radius-lg: ${t.radius.lg}px;
  --font: ${t.font.family};
  --gap: ${t.space[4]}px;
  --border: color-mix(in srgb, var(--text) 10%, transparent);
  --border-strong: color-mix(in srgb, var(--text) 16%, transparent);
  --tint: color-mix(in srgb, var(--primary) 16%, transparent);
  --tint-soft: color-mix(in srgb, var(--primary) 8%, var(--surface));
  --elev: 0 1px 2px rgba(0,0,0,0.28), 0 12px 32px rgba(0,0,0,0.22);
  --ring: 0 0 0 1px color-mix(in srgb, var(--primary) 45%, transparent);
}

html { box-sizing: border-box; scroll-behavior: smooth; }
*, *:before, *:after { box-sizing: inherit; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto !important; }
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}
.wrap { max-width: 960px; margin: 0 auto; padding: 32px 24px; }
.brand { display: block; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
.tag { color: var(--muted); margin: 8px 0 32px; }
nav.web-nav {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  background: color-mix(in srgb, var(--surface) 85%, transparent);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  padding: 6px 8px; border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--border-strong) 50%, transparent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--bg) 50%, transparent);
  margin-bottom: 32px; flex-wrap: wrap;
}
nav.web-nav a {
  padding: 8px 18px; border-radius: 999px;
  background: transparent; border: 1px solid transparent;
  color: var(--muted); text-decoration: none;
  font-size: 12px; font-weight: 500;
  transition: all 0.18s ease;
}
nav.web-nav a:hover {
  color: var(--text); background: color-mix(in srgb, var(--tint) 50%, transparent);
}
nav.web-nav a.active {
  background: var(--primary); color: var(--on-primary); border-color: var(--primary);
  font-weight: 600;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 40%, transparent);
}
h2 { font-size: 18px; margin: 32px 0 16px; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: var(--gap); }
.card {
  position: relative;
  display: flex; flex-direction: column; gap: 12px;
  min-height: 132px;
  background: linear-gradient(155deg, var(--tint-soft), var(--surface) 62%);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
}
.card .cardicon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: var(--radius);
  background: var(--tint); color: var(--primary);
}
.card .value { font-size: 30px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; margin-top: auto; }
.card .label { color: var(--muted); font-size: 12px; }
.nudge { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--primary); margin-left: 8px; }
/* ── In-app control-center: bento dashboard (desktop + mobile shells) ─────────────── */
/* Equal-width tracks: minmax(0, 1fr) (not the default minmax(auto, 1fr)) so a wide
   tile value/badge can't stretch its own column and skew the whole grid. */
.bento { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-auto-rows: minmax(96px, auto); gap: var(--gap); }
.bento-tile {
  position: relative; display: flex; flex-direction: column; gap: 12px;
  background: linear-gradient(155deg, var(--tint-soft), var(--surface) 62%);
  border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px;
}
.bento-tile .tile-head { display: flex; align-items: center; gap: 12px; color: var(--muted); }
.bento-tile .tile-head .tile-title { font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
.bento-tile .value { font-size: 30px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; margin-top: auto; }
.bento-tile .label { color: var(--muted); font-size: 12px; }
.bento-tile.featured { grid-column: span 2; grid-row: span 2; justify-content: space-between; overflow: hidden; }
.bento-tile.featured::after {
  content: ""; position: absolute; right: -30px; bottom: -30px; width: 170px; height: 170px;
  background: radial-gradient(circle at center, var(--tint), transparent 70%); pointer-events: none;
}
.bento-tile.wide { grid-column: span 2; }
.ring-wrap { position: relative; display: flex; align-items: center; gap: 24px; }
.ring { flex: none; }
.ring-meta { display: flex; flex-direction: column; }
.ring-meta .value { font-size: 22px; margin-top: 0; }
.assistant-strip {
  grid-column: 1 / -1; display: flex; align-items: center; gap: 16px;
  background: linear-gradient(120deg, var(--tint), transparent 60%), var(--surface);
  border: 1px solid var(--border-strong); border-radius: var(--radius-lg);
  padding: 16px 24px;
}
.assistant-strip .cardicon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: var(--radius);
  background: var(--tint); color: var(--primary); flex: none;
}
.assistant-strip .who { font-weight: 700; }
.assistant-strip .msg { color: var(--muted); }
.assistant-strip .btn { margin-left: auto; white-space: nowrap; }
@media (max-width: 600px) {
  .bento { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bento-tile.featured { grid-column: 1 / -1; grid-row: auto; }
  .bento-tile.wide { grid-column: 1 / -1; }
  .assistant-strip { flex-wrap: wrap; }
  .assistant-strip .btn { margin-left: 0; }
}
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.row {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 16px 16px;
}
.bento-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.bento-grid.wide { grid-template-columns: 1fr; }
.room-card {
  display: flex; align-items: center; justify-content: space-between;
  background: linear-gradient(155deg, var(--tint-soft), var(--surface) 62%);
  border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px;
}
.room-card .cardicon { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: var(--radius); background: var(--tint); color: var(--primary); flex: none; }
.room-card .room-info { flex: 1; margin-left: 16px; }
.room-card .label { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
.room-card .value { color: var(--muted); font-size: 12px; }

.device-pill {
  display: flex; flex-direction: column; width: 100%; box-sizing: border-box; overflow: hidden;
  background: linear-gradient(155deg, var(--tint-soft), var(--surface) 62%);
  border: 1px solid var(--border); border-radius: var(--radius-lg);
  padding: 16px 24px;
}
.device-pill .dev-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: var(--radius);
  background: var(--tint); color: var(--primary); flex: none;
}
.device-pill .dev-info { flex: 1; min-width: 0; }
.device-pill .dev-name { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.device-pill .dev-room { color: var(--muted); font-size: 12px; margin-top: 2px; }

/* ── Dedicated AI Assistant Prompt Bar & Waveform ── */
.assistant-prompt-bar {
  background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 14%, var(--surface)), var(--surface) 85%);
  border: 1px solid color-mix(in srgb, var(--primary) 28%, var(--border));
  border-radius: var(--radius-lg);
  padding: 24px 32px; margin-bottom: 32px;
  box-shadow: 0 10px 28px color-mix(in srgb, var(--primary) 12%, transparent);
}
.prompt-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.ai-avatar {
  position: relative; width: 44px; height: 44px; border-radius: 50%;
  background: var(--primary); color: var(--on-primary);
  display: flex; align-items: center; justify-content: center; flex: none;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 40%, transparent);
}
.pulse-ring {
  position: absolute; inset: -4px; border-radius: 50%;
  border: 2px solid var(--primary); opacity: 0.6;
}
.ai-name { font-weight: 700; font-size: 14px; letter-spacing: 0.02em; }
.ai-status { color: var(--muted); font-size: 12px; margin-top: 2px; }
.audio-waveform { display: flex; align-items: center; gap: 3px; margin-left: auto; height: 18px; }
.wave-bar {
  width: 3px; height: 100%; background: var(--primary); border-radius: 999px;
  animation: wavePulse 1.2s ease-in-out infinite alternate;
}
.wave-bar:nth-child(2) { animation-delay: 0.2s; height: 70%; }
.wave-bar:nth-child(3) { animation-delay: 0.4s; height: 100%; }
.wave-bar:nth-child(4) { animation-delay: 0.1s; height: 80%; }
.wave-bar:nth-child(5) { animation-delay: 0.3s; height: 60%; }
@keyframes wavePulse {
  0% { transform: scaleY(0.3); opacity: 0.4; }
  100% { transform: scaleY(1); opacity: 1; }
}
.prompt-input-wrap { display: flex; gap: 12px; margin-bottom: 16px; }
.prompt-input {
  flex: 1; min-width: 0; background: var(--bg); border: 1px solid var(--border-strong);
  border-radius: var(--radius); padding: 12px 16px;
  color: var(--text); font-size: 12px; outline: none;
  text-overflow: ellipsis; white-space: nowrap; overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.prompt-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
}
.mic-btn { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; flex: none; }
.quick-commands-wrap { display: flex; flex-direction: column; gap: 8px; }
.cmd-label { color: var(--muted); font-size: 12px; font-weight: 600; letter-spacing: 0.02em; display: flex; align-items: center; gap: 6px; }
.quick-commands-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%;
}
.cmd-chip {
  display: flex; align-items: center; justify-content: flex-start; gap: 8px;
  font-size: 12px; font-weight: 500; padding: 8px 14px; border-radius: var(--radius);
  background: color-mix(in srgb, var(--primary) 10%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--primary) 22%, var(--border));
  color: var(--text); cursor: pointer; transition: all 0.18s ease; text-align: left;
  height: auto; white-space: normal; word-break: break-word; width: 100%; box-sizing: border-box; min-height: 36px; padding: 10px 14px;
}
.cmd-chip .chip-star {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; flex: none; color: var(--primary); font-weight: 700; font-size: 13px;
}
.cmd-chip .chip-txt { flex: 1; min-width: 0; white-space: normal; word-break: break-word; line-height: 1.4; }
.cmd-chip:hover {
  background: color-mix(in srgb, var(--primary) 22%, var(--surface));
  border-color: var(--primary); color: var(--primary);
  transform: translateY(-1px);
}
@media (max-width: 600px) {
  .quick-commands-grid { grid-template-columns: repeat(2, 1fr); }
  .prompt-input-wrap { gap: 6px; }
  .prompt-input { font-size: 12px; padding: 10px 12px; flex: 1; width: 100%; min-width: 0; }
  .mic-btn { padding: 10px 12px; border-radius: var(--radius); flex: none; }
  .mic-btn span { display: none; }
  .cmd-chip { padding: 7px 10px; font-size: 11px; }
}

/* ── Audit Log & Sparkline Card ── */
.audit-card, .sparkline-card {
  grid-column: 1 / -1; background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px 24px;
}
.audit-head, .sparkline-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.audit-title { font-weight: 700; font-size: 12px; margin-left: 8px; }
.audit-list { display: flex; flex-direction: column; gap: 8px; font-size: 12px; }
.audit-item { display: flex; align-items: center; gap: 10px; color: var(--text); }
.audit-item .time { color: var(--muted); font-weight: 600; min-width: 40px; }
.dot.green { background: #10b981; box-shadow: 0 0 6px #10b981; }
.dot.blue { background: var(--primary); box-shadow: 0 0 6px var(--primary); }
.sparkline-svg { width: 100%; height: 50px; display: block; margin: 8px 0; }
.sparkline-labels { display: flex; justify-content: space-between; color: var(--muted); font-size: 11px; font-weight: 600; }
.badge { white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; background: var(--tint); color: var(--primary); }
.badge.success { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.trend { color: #10b981; font-weight: 700; font-size: 12px; margin-left: 6px; }

/* ── FAQ Section ── */
.faq-section { margin-top: 48px; }
.faq-grid { display: grid; gap: 12px; margin-top: 16px; }
.faq-item {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
  padding: 16px 24px; transition: border-color 0.15s;
}
.faq-item[open] { border-color: var(--primary); }
.faq-q {
  font-weight: 600; font-size: 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; list-style: none;
}
.faq-q::-webkit-details-marker { display: none; }
.faq-a { color: var(--muted); font-size: 12px; margin-top: 12px; line-height: 1.6; }
.faq-icon { font-weight: 700; font-size: 18px; color: var(--primary); }

/* ── Device Control Sliders ── */
.dev-slider-wrap {
  margin-top: 8px; padding-top: 6px; border-top: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  display: flex; align-items: center; gap: 8px; width: 100%; box-sizing: border-box;
}
.dev-slider {
  flex: 1; min-width: 0; height: 4px; border-radius: 999px;
  background: linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--border) 80%, transparent));
  appearance: none; -webkit-appearance: none; outline: none; box-sizing: border-box;
}
.dev-slider::-webkit-slider-thumb {
  appearance: none; -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%;
  background: var(--primary); box-shadow: 0 0 8px var(--primary); cursor: pointer;
}
.dev-slider-val { font-size: 11px; font-weight: 600; color: var(--primary); min-width: 28px; text-align: right; flex: none; }

.suggest-card {
  display: flex; flex-direction: column; gap: 12px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px;
}
.suggest-card .actions { margin-top: auto; justify-content: flex-end; }

.skill-bar-wrap {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 8px;
}
.skill-bar-header { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
.skill-bar-header .count { color: var(--muted); }
.skill-bar-track { height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden; }
.skill-bar-fill { height: 100%; background: var(--primary); }

.member-card {
  display: flex; align-items: center; gap: 16px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px;
}

.plan-card {
  background: linear-gradient(155deg, var(--tint-soft), var(--surface) 62%);
  border: 1px solid var(--primary); border-radius: var(--radius-lg); padding: 24px;
  display: flex; flex-direction: column; gap: 16px;
}
.plan-card .price { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; }
.plan-card .price span { font-size: 12px; color: var(--muted); font-weight: normal; letter-spacing: 0; }

.field-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px; border-bottom: 1px solid var(--border);
}
.field-row:last-child { border-bottom: 0; }
.field-row .label { color: var(--muted); }
.field-row .value { font-weight: 500; }

.dot { width: 10px; height: 10px; border-radius: 50%; }
.on { background: #2ecc71; }
.off { background: var(--muted); }
.dl-primary {
  display: inline-block; background: var(--primary); color: var(--on-primary);
  padding: 16px 32px; border-radius: var(--radius); font-weight: 600;
  text-decoration: none; margin-bottom: 16px;
  box-shadow: 0 8px 22px color-mix(in srgb, var(--primary) 42%, transparent);
}
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { text-align: left; padding: 12px; border-bottom: 1px solid var(--surface); }
th { color: var(--muted); font-weight: 600; }
code { color: var(--muted); word-break: break-all; }
.badge {
  font-size: 12px; padding: 2px 8px; border-radius: 999px;
  background: var(--primary); color: var(--on-primary);
}
.badge.muted { background: var(--bg); color: var(--muted); border: 1px solid var(--surface); }
.btn {
  font-size: 12px; padding: 8px 12px;
  border-radius: var(--radius); border: 1px solid var(--primary);
  background: transparent; color: var(--primary); cursor: pointer;
}
.btn.primary { background: var(--primary); color: var(--on-primary); box-shadow: 0 6px 18px color-mix(in srgb, var(--primary) 38%, transparent); }
.actions { display: flex; gap: 8px; }
.meta { color: var(--muted); font-size: 12px; }
section { margin-bottom: 48px; }
header.site {
  display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
}
.skip {
  position: absolute; left: -9999px; top: 0; z-index: 10;
  background: var(--primary); color: var(--on-primary); padding: 8px 16px;
  border-radius: 4px; text-decoration: none;
}
.skip:focus { left: 12px; top: 12px; }
header.site .tag { margin: 4px 0 0; }
.logo { display: block; flex: none; }
footer.site {
  margin-top: 48px; padding-top: 24px;
  border-top: 1px solid var(--surface); color: var(--muted); font-size: 12px;
  display: flex; flex-wrap: wrap; gap: 8px 24px; justify-content: space-between;
}
footer.site a { color: var(--muted); text-decoration: none; }
footer.site a:hover { color: var(--text); }
/* Interactive tabs: when JS is on, show only the active screen. */
html.js-tabs section[hidden] { display: none; }
.hero {
  position: relative; overflow: hidden;
  padding: 48px 0 32px; border-bottom: 1px solid var(--surface);
  margin-bottom: 32px;
}
.hero::before {
  content: ""; position: absolute; inset: -40% 30% auto -10%; height: 320px; z-index: -1;
  background: radial-gradient(60% 60% at 30% 30%, var(--tint), transparent 70%);
  pointer-events: none;
}
.hero h1 {
  font-size: 40px; line-height: 1.1; letter-spacing: -0.03em; margin: 0 0 16px;
  max-width: 18ch;
}
.hero .lede { color: var(--muted); font-size: 18px; margin: 0 0 24px; max-width: 60ch; }
.hero .actions { flex-wrap: wrap; }
.hero .btn { font-size: 14px; padding: 12px 24px; }
.hero .trust { color: var(--muted); font-size: 12px; margin-top: 16px; }
.features { margin-top: 48px; }
.feature-grid {
  display: grid; gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
.feature {
  background: linear-gradient(155deg, var(--tint-soft), var(--surface) 62%);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 24px;
}
.feature .icon {
  display: inline-flex; width: 40px; height: 40px; border-radius: var(--radius);
  align-items: center; justify-content: center; background: var(--tint);
  color: var(--primary); margin-bottom: 12px;
}
.feature h3 { margin: 0 0 8px; font-size: 18px; }
.feature p { margin: 0; color: var(--muted); font-size: 12px; }

@media (max-width: 600px) {
  .wrap { padding: 16px 12px; }
  .row { flex-wrap: wrap; gap: 8px; }
  nav { gap: 4px; }
  .hero { padding: 24px 0 16px; }
  .hero h1 { font-size: 26px; word-break: break-word; line-height: 1.25; }
  .hero .lede { font-size: 14px; }
  .hero .actions .btn { flex: 1 1 auto; text-align:left; }
  .cards, .feature-grid { grid-template-columns: 1fr; }
  table { font-size: 11px; display: block; overflow-x: auto; white-space: nowrap; }
  th, td { padding: 8px; }
  .bento-tile, .plan-card, .skill-card-rich, .suggestion-card, .member-card, .room-card { padding: 14px !important; }
  .badge { white-space: nowrap; text-align: center; flex-shrink: 0; display: inline-flex; max-width: 100%; }
  * { word-wrap: break-word; overflow-wrap: break-word; }
}
@media (prefers-reduced-motion: no-preference) {
  nav a, .btn { transition: background 120ms ease, color 120ms ease, border-color 120ms ease; }
}
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .card, .feature { transition: transform 140ms ease, border-color 140ms ease; }
  .card:hover, .feature:hover { transform: translateY(-2px); border-color: var(--border-strong); }
}


.desktop-only { display: inline; }
.mobile-only { display: none; }
@media (max-width: 600px) {
  .suggest-title-desktop { display: none !important; }
  .suggest-title-mobile { display: block !important; }
  .desktop-only { display: none !important; }
  .mobile-only { display: inline !important; }
}

/* ── Sticky Ultra-Premium Glass Navbar ── */
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid color-mix(in srgb, var(--border-strong) 40%, transparent);
  box-shadow: 0 4px 20px color-mix(in srgb, var(--bg) 60%, transparent);
  margin-bottom: 16px; transition: all 0.2s ease;
}
.nav-container {
  max-width: 1140px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 24px; height: 60px;
}
.nav-brand-group {
  display: flex; align-items: center; gap: 12px;
}
.nav-brand {
  display: flex; align-items: center; gap: 12px;
  text-decoration: none; color: var(--text); font-weight: 800; font-size: 18px;
  letter-spacing: 0.05em;
}
.brand-title {
  background: linear-gradient(135deg, var(--text) 40%, var(--muted));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.nav-links {
  display: flex; align-items: center; gap: 28px;
  background: transparent; padding: 0; border: none;
}
.hamburger { display: none; background: transparent; border: none; color: var(--text); cursor: pointer; padding: 4px; }
.hamburger svg { width: 24px; height: 24px; }
.nav-link {
  color: var(--muted); text-decoration: none; font-size: 13px; font-weight: 500;
  padding: 6px 0; transition: all 0.18s ease; position: relative;
}
.nav-link:hover { color: var(--text); }
.nav-link::after {
  content: ""; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  background: var(--primary); border-radius: 999px; transform: scaleX(0); transition: transform 0.18s ease;
}
.nav-link:hover::after { transform: scaleX(1); }
.nav-actions { display: flex; align-items: center; gap: 14px; }
.nav-controls-pill {
  display: inline-flex; align-items: center; gap: 12px; padding: 6px 14px;
  border-radius: 999px; background: color-mix(in srgb, var(--surface) 60%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  transition: all 0.15s ease;
}
.nav-controls-pill:hover { border-color: color-mix(in srgb, var(--primary) 40%, transparent); }
.lang-switch-clean {
  text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; gap: 4px; align-items: center;
}
.lang-opt { color: var(--muted); opacity: 0.6; transition: all 0.15s; }
.lang-opt.active { color: var(--primary); opacity: 1; font-weight: 700; }
.lang-sep { color: var(--border); font-size: 10px; }
.nav-cta {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px;
  font-size: 13px; font-weight: 600; border-radius: 999px;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 35%, transparent);
  transition: all 0.18s ease;
}
.nav-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 18px color-mix(in srgb, var(--primary) 50%, transparent); }

/* ── Rich Multi-Column Footer ── */
.footer {
  margin-top: 48px;
  border-top: 1px solid var(--border);
  background: linear-gradient(180deg, var(--bg) 0%, var(--surface) 100%);
  padding: 48px 0 24px;
}
.footer-container { max-width: 960px; margin: 0 auto; padding: 0 24px; }
.footer-grid {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 32px;
  margin-bottom: 32px;
}
.footer-col h4 {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--text); margin: 0 0 16px;
}
.footer-col ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.footer-col a {
  color: var(--muted); text-decoration: none; font-size: 12px;
  transition: color 120ms;
}
.footer-col a:hover { color: var(--primary); }
.footer-brand { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 18px; }
.footer-desc { color: var(--muted); font-size: 12px; margin: 12px 0 16px; max-width: 32ch; line-height: 1.6; }
.version-badge { display: inline-block; font-size: 11px; padding: 3px 8px; border-radius: var(--radius); background: var(--tint); color: var(--primary); font-weight: 600; }
.footer-bottom {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
  padding-top: 24px; border-top: 1px solid var(--border);
  color: var(--muted); font-size: 12px;
}
.footer-bottom-links a { color: var(--muted); text-decoration: none; }
.footer-bottom-links a:hover { color: var(--text); }
@media (max-width: 768px) {
  .footer-grid { grid-template-columns: 1fr 1fr; }
  .hamburger { display: block; }
  .nav-links { display: none; flex-direction: column; position: absolute; top: 100%; left: 0; width: 100%; background: var(--surface); padding: 16px; border-bottom: 1px solid var(--border); box-shadow: 0 8px 16px color-mix(in srgb, var(--bg) 50%, transparent); }
  .nav-links.open { display: flex; }
}
@media (max-width: 480px) {
  .footer-grid { grid-template-columns: 1fr; }
}

/* recovery bridge: current markup uses .feature-card / .site-footer */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 48px 24px; text-align: center;
  background: linear-gradient(155deg, var(--tint-soft), var(--surface) 62%);
  border: 1px dashed var(--border-strong); border-radius: var(--radius-lg);
  color: var(--muted);
}
.empty-state .empty-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; border-radius: 50%;
  background: var(--tint); color: var(--primary);
}
.empty-state p { margin: 0; font-size: 13px; max-width: 40ch; }
.feature-card {
  background: linear-gradient(155deg, var(--tint-soft), var(--surface) 62%);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 24px;
}
.feature-card .icon {
  display: inline-flex; width: 40px; height: 40px; border-radius: var(--radius);
  align-items: center; justify-content: center; background: var(--tint);
  color: var(--primary); margin-bottom: 12px;
}
.feature-card h3 { margin: 0 0 8px; font-size: 18px; }
.feature-card p { margin: 0; color: var(--muted); font-size: 12px; }
.feature-card { transition: transform 140ms ease, border-color 140ms ease; }
.feature-card:hover { transform: translateY(-2px); border-color: var(--border-strong); }
.site-footer {
  margin-top: 48px; padding: 24px 2rem;
  border-top: 1px solid var(--surface); color: var(--muted); font-size: 12px;
  display: flex; flex-wrap: wrap; gap: 8px 24px; justify-content: space-between;
}
.site-footer a { color: var(--muted); text-decoration: none; }
.site-footer a:hover { color: var(--text); }
`;
}
