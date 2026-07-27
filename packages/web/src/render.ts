import { type DesignTokens, getTheme } from "@nexus/design-system";
import { type VersionInfoService } from "@nexus/infra";
import { CATALOGS, type Locale, SUPPORTED_LOCALES } from "@nexus/i18n";
import {
  type BillingModel,
  type BillingManageModel,
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

/**
 * Self-hosted brand font faces for every generated surface.
 *
 * NEXUS brand font stack (all served from /fonts/, offline-capable):
 *   - Space Grotesk  — primary display / UI         (300-700)
 *   - Inter          — body / secondary text        (400-800)
 *   - JetBrains Mono — code, checksums, monospace   (400-700)
 */
function renderFontFaces(): string {
  const latinRange =
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
  const latinExtRange = "U+0100-024F, U+1E00-1EFF, U+20A0-20AB";

  function face(
    family: string,
    weight: number,
    subset: "latin" | "latin-ext",
    range: string,
  ): string {
    return (
      `@font-face { font-family: '${family}'; font-style: normal; font-display: swap; ` +
      `font-weight: ${weight}; ` +
      `src: url('/fonts/${family.toLowerCase().replace(/\s+/g, "-")}-${subset}-${weight}-normal.woff2') format('woff2'); ` +
      `unicode-range: ${range}; }`
    );
  }

  const faces: string[] = [];

  // Space Grotesk — 300-700
  for (const w of [300, 400, 500, 600, 700]) {
    faces.push(face("Space Grotesk", w, "latin-ext", latinExtRange));
    faces.push(face("Space Grotesk", w, "latin", latinRange));
  }

  // Inter — 400-800
  for (const w of [400, 500, 600, 700, 800]) {
    faces.push(face("Inter", w, "latin-ext", latinExtRange));
    faces.push(face("Inter", w, "latin", latinRange));
  }

  // JetBrains Mono — 400-700
  for (const w of [400, 500, 600, 700]) {
    faces.push(face("JetBrains Mono", w, "latin-ext", latinExtRange));
    faces.push(face("JetBrains Mono", w, "latin", latinRange));
  }

  return faces.join("\n");
}

export function faviconDataUri(_primaryColor?: string): string {
  const svg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="nxlogo" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse"><stop stop-color="#6f9bff"/><stop offset="0.55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/></linearGradient><linearGradient id="nxsheen" x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse"><stop stop-color="#ffffff" stop-opacity="0.30"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs><rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxlogo)"/><rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxsheen)"/><rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#ffffff" stroke-opacity="0.22"/><path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function label(key: string): string {
  const locale = (CURRENT_LOCALE in CATALOGS ? CURRENT_LOCALE : "en") as Locale;
  const catalog = CATALOGS[locale] as Record<string, string>;
  // Always fall back to EN catalog for missing keys in partial catalogs
  return catalog[key] ?? (CATALOGS.en as Record<string, string>)[key] ?? key;
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

function bentoTile(icon: string, title: string, value: string, extraClass = ""): string {
  return (
    `<article class="bento-tile${extraClass ? ` ${extraClass}` : ""}">` +
    `<div class="tile-head"><span class="cardicon">${renderStatIcon(icon)}</span>` +
    `<span class="tile-title">${escapeHtml(title)}</span></div>` +
    `<div class="value">${escapeHtml(value)}</div></article>`
  );
}

export function renderTodayPanel(model: TodayModel): string {
  const isTr = CURRENT_LOCALE === "tr";
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
  const routines = bentoTile(
    "routines",
    label("today.activeRoutines"),
    byKey("today.activeRoutines"),
  );
  const suggestions = bentoTile(
    "suggestions",
    label("today.suggestions"),
    byKey("today.suggestions"),
  );

  const weeklyEnergyCard =
    `<article class="bento-tile analytics-tile">` +
    `<div class="tile-head"><span class="cardicon">${renderStatIcon("energy")}</span>` +
    `<span class="tile-title">${isTr ? "Haftalık Enerji Trendi" : "Weekly Energy Trend"}</span></div>` +
    `<div class="analytics-value" style="font-size:20px;font-weight:700;margin-top:6px;">19.4 kWh <span style="font-size:12px;color:#10b981;font-weight:600;">-12%</span></div>` +
    `<div class="sparkline-wrap" style="margin-top:8px;">` +
    `<svg class="sparkline" width="100%" height="28" viewBox="0 0 140 28" fill="none">` +
    `<path d="M0 22 L20 16 L40 20 L60 10 L80 14 L100 6 L120 12 L140 4" stroke="var(--primary)" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M0 22 L20 16 L40 20 L60 10 L80 14 L100 6 L120 12 L140 4 L140 28 L0 28 Z" fill="color-mix(in srgb, var(--primary) 15%, transparent)"/>` +
    `</svg></div></article>`;

  const uptimeCard =
    `<article class="bento-tile analytics-tile">` +
    `<div class="tile-head"><span class="cardicon">${renderStatIcon("devices")}</span>` +
    `<span class="tile-title">${isTr ? "Sistem Çalışma Süresi" : "System Uptime"}</span></div>` +
    `<div class="analytics-value" style="font-size:20px;font-weight:700;margin-top:6px;">99.98%</div>` +
    `<div class="analytics-sub" style="font-size:11px;color:var(--muted);margin-top:4px;">${isTr ? "14 gün 6 saat kesintisiz" : "14d 6h uninterrupted"}</div></article>`;

  const automationsCard =
    `<article class="bento-tile analytics-tile">` +
    `<div class="tile-head"><span class="cardicon">${renderStatIcon("routines")}</span>` +
    `<span class="tile-title">${isTr ? "Toplam Otomasyon" : "Total Automations"}</span></div>` +
    `<div class="analytics-value" style="font-size:20px;font-weight:700;margin-top:6px;">1,420</div>` +
    `<div class="analytics-sub" style="font-size:11px;color:var(--muted);margin-top:4px;">${isTr ? "Bu ay tetiklendi" : "Triggered this month"}</div></article>`;

  const activeDeviceCard =
    `<article class="bento-tile analytics-tile">` +
    `<div class="tile-head"><span class="cardicon">${renderStatIcon("devices")}</span>` +
    `<span class="tile-title">${isTr ? "En Aktif Cihaz" : "Most Active Device"}</span></div>` +
    `<div class="analytics-value" style="font-size:14px;font-weight:700;margin-top:6px;">${isTr ? 'LG C3 65" 4K OLED TV' : 'LG C3 65" 4K OLED Smart TV'}</div>` +
    `<div class="analytics-sub" style="font-size:11px;color:var(--muted);margin-top:4px;">${isTr ? "Ort. 6.2 saat/gün" : "Avg 6.2 hrs/day"}</div></article>`;

  const sug = model.cards.find((c) => c.labelKey === "today.suggestions")?.value ?? "0";
  const msg = model.hasNudge
    ? `${sug} suggestion${sug === "1" ? "" : "s"} ready for you.`
    : "You're all caught up.";
  const strip =
    `<div class="assistant-strip"><span class="cardicon">${renderStatIcon("suggestions")}</span>` +
    `<div><span class="who">NEXUS AI</span> <span class="msg">${msg}</span></div>` +
    `<a class="btn" href="#suggestions" data-nav="suggestions">Review</a></div>`;

  const nudge = model.hasNudge ? '<span class="nudge" aria-label="new"></span>' : "";
  return `${nudge ? `<h2>${escapeHtml(label(model.titleKey))}<span class="nudge" aria-label="new"></span></h2>` : `<h2>${escapeHtml(label(model.titleKey))}</h2>`}<div class="bento">${featured}${energy}${routines}${suggestions}${weeklyEnergyCard}${uptimeCard}${automationsCard}${activeDeviceCard}${strip}</div>`;
}

export function renderToday(model: TodayModel): string {
  const cards = model.cards
    .map(
      (c) =>
        `<div class="card"><span class="cardicon">${renderStatIcon(c.labelKey.includes("energy") ? "energy" : c.labelKey.includes("Routines") ? "routines" : c.labelKey.includes("suggestions") ? "suggestions" : "devices")}</span><div class="value">${escapeHtml(c.value)}</div><div class="label">${escapeHtml(label(c.labelKey))}</div></div>`,
    )
    .join("");
  const nudge = model.hasNudge ? '<span class="nudge" aria-label="new"></span>' : "";
  return `<h2>${escapeHtml(label(model.titleKey))}${nudge}</h2><div class="cards">${cards}</div>`;
}

export function renderHomeState(model: HomeStateModel): string {
  if (model.rooms.length === 0) {
    return `<h2>${escapeHtml(label(model.titleKey))}</h2>${renderEmptyState(label(model.emptyStateKey ?? "screen.homeState.empty"))}`;
  }
  const rooms = model.rooms
    .map(
      (r) =>
        `<div class="room-card">${renderStatIcon("devices")}<div class="room-info"><div class="label">${escapeHtml(r.room)}</div><div class="value">${r.online}/${r.total} devices online</div></div></div>`,
    )
    .join("");
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid">${rooms}</div>`;
}

export function renderDevices(model: DeviceListModel): string {
  const isTr = CURRENT_LOCALE === "tr";
  if (model.rows.length === 0) {
    return `<h2>${escapeHtml(label(model.titleKey))}</h2>${renderEmptyState(label(model.emptyStateKey ?? "screen.devices.empty"))}`;
  }
  const deviceDetails: Record<string, { en: string; tr: string }> = {
    lamp: { en: "Brightness: 80%", tr: "Parlaklık: %80" },
    tv: { en: "HDMI 1 (PlayStation 5)", tr: "HDMI 1 (PlayStation 5)" },
    ac: { en: "Target: 22°C", tr: "Hedef: 22°C" },
    lock: { en: "Battery: 92%", tr: "Pil: %92" },
    speaker: { en: "Volume: 45%", tr: "Ses: %45" },
    camera: { en: "Battery: 88%", tr: "Pil: %88" },
    thermostat: { en: "Humidity: 45%", tr: "Nem: %45" },
    curtain: { en: "Position: 100% Open", tr: "Konum: %100 Açık" },
  };

  const pills = model.rows
    .map((d: any) => {
      const detail = deviceDetails[d.id]
        ? isTr
          ? deviceDetails[d.id].tr
          : deviceDetails[d.id].en
        : "";
      const roomStr = d.room ? `${escapeHtml(d.room)} · ` : "";
      const statusText = d.online ? (isTr ? "Çevrimiçi" : "Online") : isTr ? "Çevrimdışı" : "Offline";
      
      const devIcons: Record<string, string> = {
        lamp: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
        tv: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>',
        ac: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 22l6-6"/><path d="M19 25l6-6"/></svg>',
        lock: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
        speaker: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
        camera: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
        thermostat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
        curtain: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>'
      };

      const devIconSvg = devIcons[d.id] || renderStatIcon("devices");
      // Real product photo when the catalog provides one; onerror removes the
      // img so the icon tile underneath never turns into an empty square.
      const photoHtml = d.imageUrl
        ? `<img src="${escapeHtml(d.imageUrl)}" alt="" loading="lazy" onerror="this.remove()" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:4px;background:#fff;"/>`
        : "";
      const iconHtml = `<span class="dev-icon" style="position:relative;overflow:hidden;width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb, var(--primary) 10%, var(--surface));color:var(--primary);border-radius:14px;box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--primary) 20%, transparent);">${devIconSvg}${photoHtml}</span>`;

      let advHtml = "";
      if (d.manufacturer || d.ipAddress || d.analytics) {
         const ip = d.ipAddress ? `<div style="overflow:hidden;text-overflow:ellipsis;"><strong>IP:</strong> ${escapeHtml(d.ipAddress)}</div>` : "";
         const mac = d.macAddress ? `<div style="overflow:hidden;text-overflow:ellipsis;"><strong>MAC:</strong> ${escapeHtml(d.macAddress)}</div>` : "";
         const fw = d.firmwareVersion ? `<div style="overflow:hidden;text-overflow:ellipsis;"><strong>Firmware:</strong> ${escapeHtml(d.firmwareVersion)} ${d.updateAvailable ? '<span style="color:#f59e0b;font-weight:700;">(Update)</span>' : ''}</div>` : "";
         const last = d.lastSeen ? `<div style="overflow:hidden;text-overflow:ellipsis;"><strong>Seen:</strong> ${new Date(d.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>` : "";
         
         let chartHtml = "";
         if (d.analytics?.dailyUsageWh && d.analytics.dailyUsageWh.length > 1) {
           const pts = d.analytics.dailyUsageWh;
           const min = Math.min(...pts) * 0.8;
           const max = Math.max(...pts, min + 1);
           const range = max - min;
           const path = pts.map((v: number, i: number) => `${(i / (pts.length-1)) * 140} ${28 - ((v - min) / range)*24}`).join(" L ");
           const total = d.analytics.weeklyUsageWh ? d.analytics.weeklyUsageWh.reduce((a:number,b:number)=>a+b,0) : pts.reduce((a:number,b:number)=>a+b,0);
           chartHtml = `<div style="margin-top:12px;font-size:11px;color:var(--muted);"><div style="margin-bottom:4px;display:flex;justify-content:space-between;"><span>${isTr ? "Haftalık Tüketim (Wh)" : "Weekly Usage (Wh)"}</span><span style="color:var(--text);font-weight:700;">${total}</span></div><svg width="100%" height="28" viewBox="0 0 140 28" fill="none" preserveAspectRatio="none"><path d="M0 28 L ${path} L 140 28 Z" fill="color-mix(in srgb, var(--primary) 15%, transparent)"/><path d="M ${path}" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round"/></svg></div>`;
         }
         
         const anomaly = d.analytics?.anomalyDetected ? `<div style="margin-top:8px;padding:6px 8px;background:color-mix(in srgb, #ef4444 15%, transparent);color:#ef4444;border-radius:6px;font-size:10px;font-weight:600;display:flex;align-items:center;gap:6px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ${isTr ? "Anormal tüketim tespit edildi!" : "Anomaly detected in usage!"}</div>` : "";

         advHtml = `<details style="margin-top:8px;"><summary style="font-size:11px;color:var(--primary);cursor:pointer;font-weight:600;outline:none;">${isTr ? "Cihaz Detayları" : "Device Details"}</summary><div style="margin-top:12px;padding:12px;background:var(--surface);border-radius:8px;border:1px solid var(--border);"><div style="font-size:10px;color:var(--muted);display:grid;grid-template-columns:1fr 1fr;gap:8px;white-space:nowrap;">${ip}${mac}${fw}${last}</div>${anomaly}${chartHtml}</div></details>`;
      }

      return `<div class="device-pill" style="flex-direction:column;align-items:stretch;padding:12px;gap:8px;"><div style="display:flex;align-items:center;gap:12px;width:100%;">${iconHtml}<div class="dev-info" style="flex:1;"><div class="dev-name" style="font-size:13px;font-weight:600;color:var(--text);">${escapeHtml(d.nameKey)}</div><div class="dev-room" style="font-size:11px;color:var(--muted);margin-top:3px;">${roomStr}${statusText}${detail ? ` · <span style="color:var(--muted);">${escapeHtml(detail)}</span>` : ""}</div></div><span class="dot ${d.online ? "on" : "off"}" title="${statusText}" style="margin:auto 0 auto auto;"></span></div>${advHtml}</div>`;
    })
    .join("");
  const meta = `${model.onlineCount}/${model.rows.length} ${isTr ? "çevrimiçi" : "online"}`;
  return `<h2>${escapeHtml(label(model.titleKey))} <span class="meta">${meta}</span></h2><div class="bento-grid">${pills}</div>`;
}

export function renderSuggestions(model: SuggestionsModel): string {
  const isTr = CURRENT_LOCALE === "tr";
  if (model.rows.length === 0) {
    return `<h2>${escapeHtml(label(model.titleKey))}</h2>${renderEmptyState(label(model.emptyStateKey ?? "screen.suggestions.empty"))}`;
  }
  const cards = model.rows
    .map(
      (s) =>
        `<div class="suggest-card" data-suggestion-id="${escapeHtml(s.id)}" style="transition: all 0.4s ease;"><div class="value" style="font-size:14px;font-weight:600;">${escapeHtml(s.textKey)}</div><div class="meta">${s.at}</div><div class="actions"><button class="btn primary" data-action="accept-suggestion" data-id="${escapeHtml(s.id)}" onclick="const card = this.closest('.suggest-card'); this.innerText='${isTr ? 'Kabul Edildi' : 'Accepted'}'; this.classList.remove('primary'); this.style.backgroundColor='rgba(16,185,129,0.15)'; this.style.color='#10b981'; this.disabled=true; this.nextElementSibling.style.display='none'; setTimeout(() => { card.style.opacity='0'; card.style.transform='scale(0.9)'; setTimeout(() => card.style.display='none', 400); }, 800);">${isTr ? "Kabul Et" : "Accept"}</button><button class="btn" data-action="dismiss-suggestion" data-id="${escapeHtml(s.id)}" onclick="const card = this.closest('.suggest-card'); card.style.opacity='0'; card.style.transform='scale(0.9)'; setTimeout(() => card.style.display='none', 400);">${isTr ? "Reddet" : "Dismiss"}</button></div></div>`,
    )
    .join("");
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid">${cards}</div>`;
}

export function renderSkills(model: SkillsModel): string {
  const isTr = CURRENT_LOCALE === "tr";
  let content = "";
  if (model.rows.length === 0) {
    content = renderEmptyState(label(model.emptyStateKey ?? "screen.skills.empty"));
  } else {
    const maxCount = model.rows.length > 0 ? Math.max(...model.rows.map((s) => s.usageCount)) : 1;
    const bars = model.rows
      .map((s) => {
        const pct = Math.round((s.usageCount / maxCount) * 100);
        return `<div class="skill-bar-wrap" style="position:relative; overflow:hidden; padding: 12px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.07)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'" onclick="this.querySelector('.play-btn').style.transform='scale(0.8)'; setTimeout(() => this.querySelector('.play-btn').style.transform='scale(1)', 150); this.querySelector('.play-icon').outerHTML='<svg class=\\'play-icon\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'#10b981\\' stroke-width=\\'3\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'20 6 9 17 4 12\\\'></polyline></svg>'; this.querySelector('.play-btn').style.background='rgba(16,185,129,0.15)'; this.querySelector('.play-btn').style.boxShadow='none'; this.querySelector('.skill-bar-fill').style.background='#10b981';"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;"><div style="display:flex; align-items:center; gap:12px;"><div class="play-btn" style="width:32px; height:32px; border-radius:50%; background:var(--primary); display:flex; align-items:center; justify-content:center; transition: all 0.2s; box-shadow: 0 4px 12px color-mix(in srgb, var(--primary) 40%, transparent);"><svg class="play-icon" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></div><span style="font-weight:600; font-size:14px; color:var(--text); letter-spacing:-0.01em;">${escapeHtml(s.nameKey)}</span></div><span class="count" style="font-size:11px; color:var(--muted); font-weight:700; background:rgba(0,0,0,0.4); padding: 4px 8px; border-radius:12px;">${s.usageCount}&times;</span></div><div class="skill-bar-track" style="height: 6px; background: rgba(0,0,0,0.4); border-radius: 3px; overflow:hidden;"><div class="skill-bar-fill" style="height:100%; width: ${pct}%; background: linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 60%, white)); border-radius:3px; transition: background 0.3s;"></div></div></div>`;
      })
      .join("");
    content = `<div class="bento-grid wide" style="margin-bottom:32px;">${bars}</div>`;
  }

  if (model.discoverable && model.discoverable.length > 0) {
    const discoverTitle = isTr ? "Keşfet" : "Discover";
    const discoverCards = model.discoverable
      .map((d) => {
        return `<div class="bento-tile" style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:var(--radius);background:var(--tint);color:var(--primary);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 3 2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5Z"/>
            </svg>
          </div>
          <div style="font-weight:700;font-size:16px;">${escapeHtml(d.nameKey)}</div>
        </div>
        <div style="font-size:13px;color:var(--muted);flex:1;">${escapeHtml(d.descriptionKey)}</div>
        <button class="btn primary" style="align-self:flex-start; transition: all 0.2s;" onclick="this.innerText='${isTr ? 'Yüklendi' : 'Installed'}'; this.classList.remove('primary'); this.style.backgroundColor='rgba(16,185,129,0.15)'; this.style.color='#10b981'; this.disabled=true;">${isTr ? "Ekle" : "Add"}</button>
      </div>`;
      })
      .join("");
    content += `<h3>${escapeHtml(discoverTitle)}</h3><div class="bento-grid">${discoverCards}</div>`;
  }

  return `<h2>${escapeHtml(label(model.titleKey))}</h2>${content}`;
}

export function renderAgents(model: import("@nexus/interface").AgentsModel): string {
  if (model.rows.length === 0) {
    return `<h2>${escapeHtml(label(model.titleKey))}</h2>${renderEmptyState(label(model.emptyStateKey ?? "screen.agents.empty"))}`;
  }
  const icons: Record<string, string> = {
    zap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14H4z"/></svg>',
    shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    thermometer: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
    clipboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>'
  };

  const cards = model.rows
    .map((a) => {
      const statusLabel =
        a.status === "active" ? "Active" : a.status === "learning" ? "Learning" : "Sleeping";
      const statusClass =
        a.status === "active" ? "on" : a.status === "learning" ? "learning" : "off";
      return `<div class="agent-card" style="display:flex; align-items:center; gap:16px; padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; transition: transform 0.2s, background 0.2s; cursor:pointer;" onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255,255,255,0.02)'; this.style.transform='translateY(0)'"><span class="avatar" style="width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb, var(--primary) 15%, transparent);color:var(--primary);box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--primary) 30%, transparent);">${icons[a.icon] || escapeHtml(a.icon)}</span><div><div style="font-weight:700; font-size:15px; margin-bottom:4px; letter-spacing:-0.01em;">${escapeHtml(label(a.nameKey))}</div><div class="meta" style="display:flex;align-items:center;gap:6px; font-size:12px; font-weight:600;"><span class="dot ${statusClass}" style="width:8px; height:8px; box-shadow:0 0 8px currentColor;"></span>${statusLabel}</div></div></div>`;
    })
    .join("");
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid">${cards}</div>`;
}

export function renderFamily(model: FamilyModel): string {
  const cards = model.members
    .map((m) => {
      const avatarHtml = m.avatarUrl
        ? `<img class="avatar" src="${escapeHtml(m.avatarUrl)}" alt="${escapeHtml(m.nameKey)}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">`
        : `<span class="avatar" style="width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--tint);color:var(--primary);font-weight:700;font-size:12.8px;">${escapeHtml(m.nameKey.charAt(0).toUpperCase())}</span>`;
      return `<div class="member-card">${avatarHtml}<div><div style="font-weight:600;">${escapeHtml(m.nameKey)}</div><div class="meta">${escapeHtml(m.role)}</div></div></div>`;
    })
    .join("");
  return `<h2>${escapeHtml(label(model.titleKey))} <span class="meta">${model.adminCount} admin</span></h2><div class="bento-grid">${cards}</div>`;
}

export function renderBilling(model: BillingModel): string {
  const isTr = CURRENT_LOCALE === "tr";
  const planLabel = label(model.planLabelKey);

  const activeChecklist = [
    isTr ? "✓ %100 Yerel Yapay Zeka Motoru" : "✓ 100% Local AI Engine",
    isTr ? "✓ Sınırsız Cihaz & Oda" : "✓ Unlimited Devices & Rooms",
    isTr ? "✓ Çapraz Oda Senaryoları" : "✓ Multi-room Routines",
    isTr ? "✓ Şifrelenmiş Bulut Yedeği Senkronizasyonu" : "✓ Encrypted Cloud Backup Sync",
  ]
    .map((item) => `<div style="font-size:12px;color:var(--text);display:flex;align-items:center;gap:6px;">${item}</div>`)
    .join("");

  const activePlanCard =
    `<div class="plan-card" style="grid-column: 1 / -1; background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, var(--surface)), var(--surface)); border: 1px solid color-mix(in srgb, var(--primary) 35%, var(--border)); padding: 20px; border-radius: var(--radius-lg);">` +
    `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">` +
    `<div>` +
    `<span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;background:var(--primary);color:#fff;text-transform:uppercase;letter-spacing:0.05em;">${isTr ? "Aktif Abonelik" : "Active Subscription"}</span>` +
    `<h3 style="margin:8px 0 2px 0;font-size:20px;font-weight:700;">${escapeHtml(planLabel)}</h3>` +
    `<div style="font-size:12px;color:var(--muted);">${isTr ? "Yenilenme: 24 Ağu 2026" : "Renews Aug 24, 2026"}</div>` +
    `</div>` +
    `<div class="price" style="font-size:24px;font-weight:800;">${model.plan === "free" ? "$0" : model.plan === "premium" ? "$5" : "$10"} <span style="font-size:12px;color:var(--muted);font-weight:400;">/ ${isTr ? "ay" : "mo"}</span></div>` +
    `</div>` +
    `<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid var(--border);">${activeChecklist}</div>` +
    `<div style="margin-top:16px;display:flex;gap:10px;">` +
    `${model.canUpgrade ? `<button class="btn primary" data-action="billing-subscribe" data-plan="premium">${isTr ? "Planı Yükselt" : "Upgrade Plan"}</button>` : `<button class="btn" data-action="billing-cancel" style="color:var(--muted);">${isTr ? "Aboneliği Yönet / İptal Et" : "Manage / Cancel Subscription"}</button>`}` +
    `</div></div>`;

  const comparisonTiers =
    `<div style="grid-column: 1 / -1; margin-top: 16px;">` +
    `<h3 style="font-size:16px;font-weight:700;margin-bottom:12px;">${isTr ? "Plan Karşılaştırma Matrisi" : "Plan Comparison Matrix"}</h3>` +
    `<div style="display:flex;overflow-x:auto;gap:14px;scroll-snap-type:x mandatory;padding-bottom:12px;margin:0 -8px;padding-left:8px;" class="tier-matrix">` +
    `<div class="bento-tile" style="padding:16px; min-width: 180px; flex: 0 0 75%; scroll-snap-align: center;">` +
    `<div style="font-weight:700;font-size:15px;">Free</div>` +
    `<div style="font-size:20px;font-weight:800;margin:6px 0;">$0 <span style="font-size:11px;color:var(--muted);">${isTr ? "/ay" : "/mo"}</span></div>` +
    `<ul style="list-style:none;padding:0;margin:12px 0;font-size:12px;display:grid;gap:6px;color:var(--muted);">` +
    `<li>✓ 1 ${isTr ? "Cihaz" : "Device"}</li>` +
    `<li>✓ ${isTr ? "Yerel Sesli Kontrol" : "Local Voice Control"}</li>` +
    `<li>✓ ${isTr ? "Temel Senaryolar" : "Basic Routines"}</li>` +
    `</ul></div>` +
    `<div class="bento-tile" style="padding:16px; min-width: 180px; flex: 0 0 75%; scroll-snap-align: center;">` +
    `<div style="font-weight:700;font-size:15px;">Premium</div>` +
    `<div style="font-size:20px;font-weight:800;margin:6px 0;">$5 <span style="font-size:11px;color:var(--muted);">${isTr ? "/ay" : "/mo"}</span></div>` +
    `<ul style="list-style:none;padding:0;margin:12px 0;font-size:12px;display:grid;gap:6px;color:var(--muted);">` +
    `<li>✓ ${isTr ? "Sınırsız Cihaz" : "Unlimited Devices"}</li>` +
    `<li>✓ ${isTr ? "Gelişmiş Otomasyonlar" : "Advanced Routines"}</li>` +
    `<li>✓ ${isTr ? "Öncelikli Yerel Yapay Zeka" : "Priority Local AI"}</li>` +
    `<li>✓ ${isTr ? "Bulut Senkronizasyon" : "Cloud Sync"}</li>` +
    `</ul></div>` +
    `<div class="bento-tile" style="padding:16px;border:1px solid var(--primary); min-width: 180px; flex: 0 0 75%; scroll-snap-align: center;">` +
    `<div style="font-weight:700;font-size:15px;color:var(--primary);">Family</div>` +
    `<div style="font-size:20px;font-weight:800;margin:6px 0;">$10 <span style="font-size:11px;color:var(--muted);">${isTr ? "/ay" : "/mo"}</span></div>` +
    `<ul style="list-style:none;padding:0;margin:12px 0;font-size:12px;display:grid;gap:6px;color:var(--muted);">` +
    `<li>✓ ${isTr ? "Premium'daki Her Şey" : "Everything in Premium"}</li>` +
    `<li>✓ ${isTr ? "Çoklu Kullanıcı Aile Paylaşımı" : "Multi-User Family Sharing"}</li>` +
    `<li>✓ ${isTr ? "Yönetici Kontrolleri" : "Admin Controls"}</li>` +
    `<li>✓ ${isTr ? "Öncelikli Destek" : "Priority Support"}</li>` +
    `</ul></div>` +
    `</div></div>`;

  const paymentHistory =
    `<div style="grid-column: 1 / -1; margin-top: 16px;">` +
    `<h3 style="font-size:16px;font-weight:700;margin-bottom:12px;">${isTr ? "Ödeme Geçmişi & Faturalar" : "Payment History & Invoices"}</h3>` +
    `<div style="overflow-x:auto; width:100%;">` +
    `<table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;" class="payment-table">` +
    `<thead><tr style="border-bottom:1px solid var(--border);color:var(--muted);">` +
    `<th style="padding:8px 12px; white-space:nowrap;">${isTr ? "Tarih" : "Date"}</th>` +
    `<th style="padding:8px 12px; min-width:180px;">${isTr ? "Açıklama" : "Description"}</th>` +
    `<th style="padding:8px 12px; white-space:nowrap;">${isTr ? "Tutar" : "Amount"}</th>` +
    `<th style="padding:8px 12px; white-space:nowrap;">${isTr ? "Durum / Fatura" : "Status / Invoice"}</th>` +
    `</tr></thead>` +
    `<tbody>` +
    `<tr style="border-bottom:1px solid color-mix(in srgb,var(--border) 50%,transparent);"><td style="padding:10px 12px; white-space:nowrap;">2026-07-01</td><td style="padding:10px 12px;">NEXUS Family Plan (Monthly)</td><td style="padding:10px 12px;">$10.00</td><td style="padding:10px 12px; white-space:nowrap;"><span style="color:#10b981;font-weight:600;">Paid (INV-2026-007)</span></td></tr>` +
    `<tr style="border-bottom:1px solid color-mix(in srgb,var(--border) 50%,transparent);"><td style="padding:10px 12px; white-space:nowrap;">2026-06-01</td><td style="padding:10px 12px;">NEXUS Family Plan (Monthly)</td><td style="padding:10px 12px;">$10.00</td><td style="padding:10px 12px; white-space:nowrap;"><span style="color:#10b981;font-weight:600;">Paid (INV-2026-006)</span></td></tr>` +
    `<tr><td style="padding:10px 12px; white-space:nowrap;">2026-05-01</td><td style="padding:10px 12px;">NEXUS Family Plan (Monthly)</td><td style="padding:10px 12px;">$10.00</td><td style="padding:10px 12px; white-space:nowrap;"><span style="color:#10b981;font-weight:600;">Paid (INV-2026-005)</span></td></tr>` +
    `</tbody></table></div></div>`;

  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid wide">${activePlanCard}${comparisonTiers}${paymentHistory}</div>`;
}

// ── Subscription management (billing-manage) ──────────────────────────────

const CHECK_MARK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;

/** Small inline card-network mark for the payment method row. */
function renderCardBrand(brand: string): string {
  return `<span class="pm-brand" style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:30px;border-radius:6px;background:linear-gradient(135deg,#1a1f71,#3949ab);color:#fff;font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(brand)}</span>`;
}

/** Full subscription-management screen: comparison, payment, renewal, invoices. */
export function renderBillingManage(model: BillingManageModel): string {
  const isTr = CURRENT_LOCALE === "tr";

  const planCards = model.plans
    .map((p) => {
      const feats = model.featureKeys
        .map((k, i) => {
          const on = p.includes[i];
          return `<li style="display:flex;align-items:center;gap:8px;color:${on ? "var(--text)" : "var(--muted)"};${on ? "" : "opacity:0.55;"}"><span style="color:${on ? "#10b981" : "var(--muted)"};display:inline-flex;">${on ? CHECK_MARK : "–"}</span>${escapeHtml(label(k))}</li>`;
        })
        .join("");
      return (
        `<div class="plan-compare-card${p.current ? " current" : ""}" style="padding:18px;border-radius:var(--radius-lg);background:${p.current ? "linear-gradient(145deg, color-mix(in srgb, var(--primary) 14%, var(--surface)), var(--surface))" : "var(--surface)"};border:1px solid ${p.current ? "var(--primary)" : "var(--border)"};">` +
        `${p.current ? `<span style=\"font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;background:var(--primary);color:#fff;text-transform:uppercase;letter-spacing:0.05em;\">${isTr ? "Mevcut Plan" : "Current Plan"}</span>` : ""}` +
        `<div style="font-weight:700;font-size:16px;margin-top:${p.current ? "8px" : "0"};">${escapeHtml(label(p.labelKey))}</div>` +
        `<div style="font-size:22px;font-weight:800;margin:6px 0;">${escapeHtml(p.price)} <span style="font-size:11px;color:var(--muted);font-weight:400;">/ ${isTr ? "ay" : "mo"}</span></div>` +
        `<ul style="list-style:none;padding:0;margin:12px 0 0;font-size:12px;display:grid;gap:7px;">${feats}</ul></div>`
      );
    })
    .join("");

  const paymentCard =
    `<div class="payment-method-card" style="grid-column:1 / -1;display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:var(--radius-lg);background:var(--surface);border:1px solid var(--border);">` +
    renderCardBrand(model.paymentMethod.brand) +
    `<div style="flex:1;"><div style="font-weight:700;font-size:14px;">•••• ${escapeHtml(model.paymentMethod.last4)}</div>` +
    `<div style="font-size:12px;color:var(--muted);">${isTr ? "Son kullanma" : "Expires"} ${escapeHtml(model.paymentMethod.expires)}</div></div>` +
    `<button class="btn" type="button" data-action="billing-change-payment">${escapeHtml(label(model.changeActionKey))}</button></div>`;

  const renewalCard = model.nextRenewal
    ? `<div class="renewal-card" style="grid-column:1 / -1;display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:var(--radius-lg);background:var(--surface);border:1px solid var(--border);">` +
      `<div style="flex:1;"><div style="font-weight:700;font-size:14px;">${isTr ? "Sonraki yenileme" : "Next renewal"}</div>` +
      `<div style="font-size:12px;color:var(--muted);">${escapeHtml(model.nextRenewal.date)} · ${escapeHtml(model.nextRenewal.amount)}</div></div>` +
      `<button class="btn" type="button" data-action="billing-cancel-renewal" onclick="return confirm('${isTr ? "Yenileme iptal edilsin mi? Dönem sonunda planınız Ücretsiz plana döner." : "Cancel renewal? Your plan reverts to Free at period end."}')" style="color:#f43f5e;border-color:color-mix(in srgb,#f43f5e 40%,var(--border));">${escapeHtml(label(model.cancelActionKey))}</button></div>`
    : "";

  const invoiceRows = model.invoices
    .map(
      (inv) =>
        `<tr style="border-bottom:1px solid color-mix(in srgb,var(--border) 50%,transparent);"><td style="padding:10px 12px;white-space:nowrap;">${escapeHtml(inv.date)}</td><td style="padding:10px 12px;">${escapeHtml(inv.amount)}</td><td style="padding:10px 12px;"><span style="color:${inv.status === "paid" ? "#10b981" : "#f59e0b"};font-weight:600;">${inv.status === "paid" ? (isTr ? "Ödendi" : "Paid") : isTr ? "Bekliyor" : "Due"}</span></td><td style="padding:10px 12px;"><a href="#" onclick="return false;" style="color:var(--primary);font-weight:600;text-decoration:none;">PDF</a></td></tr>`,
    )
    .join("");
  const invoicesCard = model.invoices.length
    ? `<div class="invoice-history" style="grid-column:1 / -1;"><h3 style="font-size:16px;font-weight:700;margin:8px 0 12px;">${isTr ? "Fatura Geçmişi" : "Invoice History"}</h3>` +
      `<div style="overflow-x:auto;width:100%;"><table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;">` +
      `<thead><tr style="border-bottom:1px solid var(--border);color:var(--muted);"><th style="padding:8px 12px;">${isTr ? "Tarih" : "Date"}</th><th style="padding:8px 12px;">${isTr ? "Tutar" : "Amount"}</th><th style="padding:8px 12px;">${isTr ? "Durum" : "Status"}</th><th style="padding:8px 12px;">${isTr ? "Fatura" : "Invoice"}</th></tr></thead>` +
      `<tbody>${invoiceRows}</tbody></table></div></div>`
    : "";

  return (
    `<h2>${escapeHtml(label(model.titleKey))}</h2>` +
    `<div class="plan-compare-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:16px;">${planCards}</div>` +
    `<div class="bento-grid wide" style="gap:14px;">${paymentCard}${renewalCard}${invoicesCard}</div>`
  );
}

// ── Device pairing (add-device) ─────────────────────────────────────────────

export interface AddDeviceBrand {
  readonly id: string;
  readonly name: string;
  /** Simple Icons slug for the brand mark (self-removing <img> on error). */
  readonly slug: string;
  readonly protocol: string;
  readonly installed: boolean;
  /** Premium connector (FAZ 16 gating) — badge only; demo plan is paid. */
  readonly premium: boolean;
}

/** Deterministic connector catalog mirroring the @nexus/plugins manifests. */
export const ADD_DEVICE_BRANDS: readonly AddDeviceBrand[] = [
  { id: "hue", name: "Philips Hue", slug: "philipshue", protocol: "Zigbee", installed: true, premium: true },
  { id: "tuya", name: "Tuya Smart", slug: "tuya", protocol: "Wi-Fi", installed: true, premium: true },
  { id: "ikea", name: "IKEA DIRIGERA", slug: "ikea", protocol: "Zigbee", installed: false, premium: false },
  { id: "xiaomi", name: "Xiaomi Mi Home", slug: "xiaomi", protocol: "Wi-Fi", installed: false, premium: false },
  { id: "sonoff", name: "Sonoff eWeLink", slug: "sonoff", protocol: "MQTT", installed: false, premium: false },
  { id: "smartthings", name: "SmartThings", slug: "samsungsmartthings", protocol: "Matter", installed: false, premium: true },
  { id: "aqara", name: "Aqara", slug: "aqara", protocol: "Zigbee", installed: false, premium: true },
  { id: "shelly", name: "Shelly", slug: "shelly", protocol: "Wi-Fi", installed: false, premium: false },
];

/** Mock LAN-scan results (LocalNetworkConnector idiom — deterministic demo). */
export const SCAN_RESULTS: readonly { name: string; detail: string }[] = [
  { name: "Shelly Plug S", detail: "192.168.1.171 · Wi-Fi" },
  { name: "Nanoleaf Shapes", detail: "192.168.1.184 · Thread" },
  { name: "Chromecast Ultra", detail: "192.168.1.190 · mDNS" },
];

/** Device pairing screen: brand catalog + manual protocols + LAN scan. */
export function renderAddDevice(): string {
  const isTr = CURRENT_LOCALE === "tr";

  const brands = ADD_DEVICE_BRANDS.map((b) => {
    const badge = b.installed
      ? `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:color-mix(in srgb,#10b981 18%,transparent);color:#10b981;">${isTr ? "Kurulu" : "Installed"}</span>`
      : b.premium
        ? `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:color-mix(in srgb,#f59e0b 18%,transparent);color:#f59e0b;">Premium</span>`
        : `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--tint);color:var(--primary);">${isTr ? "Ekle" : "Add"}</span>`;
    return (
      `<div class="brand-card" style="display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:16px;border-radius:var(--radius-lg);background:var(--surface);border:1px solid var(--border);">` +
      `<span style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;background:color-mix(in srgb,var(--primary) 12%,transparent);">` +
      `<img src="https://cdn.simpleicons.org/${b.slug}" alt="" width="24" height="24" loading="lazy" onerror="this.remove()"/></span>` +
      `<div><div style="font-weight:700;font-size:13.5px;">${escapeHtml(b.name)}</div>` +
      `<div style="font-size:11.5px;color:var(--muted);">${escapeHtml(b.protocol)}</div></div>${badge}</div>`
    );
  }).join("");

  const protocols = [
    { id: "bluetooth", label: "Bluetooth" },
    { id: "matter", label: "Matter" },
    { id: "wifi", label: "Wi-Fi" },
    { id: "other", label: isTr ? "Diğer" : "Other" },
  ]
    .map(
      (p) =>
        `<button class="btn pair-option" type="button" data-pair="${p.id}" style="flex:1;min-width:110px;">${escapeHtml(p.label)}</button>`,
    )
    .join("");

  const scanRows = SCAN_RESULTS.map(
    (r) =>
      `<div class="scan-result" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:var(--surface);border:1px solid var(--border);"><span class="dot on" style="width:8px;height:8px;"></span><div style="flex:1;"><div style="font-weight:600;font-size:13px;">${escapeHtml(r.name)}</div><div style="font-size:11.5px;color:var(--muted);">${escapeHtml(r.detail)}</div></div><button class="btn" type="button" data-action="pair-device">${isTr ? "Eşleştir" : "Pair"}</button></div>`,
  ).join("");

  return (
    `<h2>${escapeHtml(label("screen.addDevice"))}</h2>` +
    `<h3 style="font-size:15px;font-weight:700;margin:4px 0 12px;">${isTr ? "Markaya göre ekle" : "Add by brand"}</h3>` +
    `<div class="brand-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:20px;">${brands}</div>` +
    `<h3 style="font-size:15px;font-weight:700;margin:0 0 12px;">${isTr ? "Manuel eşleştirme" : "Manual pairing"}</h3>` +
    `<div class="pair-options" style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px;">${protocols}</div>` +
    `<div class="scan-card" style="padding:16px;border-radius:var(--radius-lg);background:var(--surface);border:1px solid var(--border);">` +
    `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><div style="font-weight:700;font-size:14px;">${isTr ? "Ağ taraması" : "Network scan"}</div>` +
    `<button class="btn primary" type="button" data-action="scan-network">${isTr ? "Cihazları ara" : "Scan for devices"}</button></div>` +
    `<div class="scan-results" style="display:grid;gap:8px;">${scanRows}</div></div>` +
    `<div class="pair-help" style="margin-top:16px;padding:14px 16px;border-radius:var(--radius-lg);background:color-mix(in srgb,var(--primary) 8%,var(--surface));border:1px solid color-mix(in srgb,var(--primary) 25%,var(--border));font-size:12.5px;color:var(--muted);">` +
    `💡 ${isTr ? "Yardım: Cihazını eşleştirme moduna almak için üzerindeki düğmeye 5 sn basılı tut." : "Help: Hold the button on your device for 5s to enter pairing mode."}</div>`
  );
}

export function renderPersonalization(model: PersonalizationModel): string {
  const isTr = CURRENT_LOCALE === "tr";
  const lang = model.language === "tr" ? "Türkçe (TR)" : "English (EN)";
  
  const rowStyle = `display: flex; justify-content: space-between; padding: 14px 10px; border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent); cursor: pointer; transition: background 0.2s; border-radius: 6px;`
  const hoverScript = `onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'"`;
  const clickScript = (key: string, current: string) => `onclick="const res = prompt('${isTr ? "Yeni değer girin:" : "Enter new value:"}', '${current}'); if (res) this.querySelector('.value').innerText = res;"`;
  
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid wide">` +
    `<div class="field-row" style="${rowStyle}" ${hoverScript} ${clickScript('assistantName', escapeHtml(model.assistantName))}><span class="label">${isTr ? "Asistan Adı" : "Assistant Name"}</span><span class="value" style="font-weight:600; color:var(--text);">${escapeHtml(model.assistantName)}</span></div>` +
    `<div class="field-row" style="${rowStyle}" ${hoverScript} ${clickScript('userAddress', escapeHtml(model.userAddress))}><span class="label">${isTr ? "Size Hitap Şekli" : "Addresses You As"}</span><span class="value" style="font-weight:600; color:var(--text);">${escapeHtml(model.userAddress)}</span></div>` +
    `<div class="field-row" style="${rowStyle}" ${hoverScript} ${clickScript('wakeWord', 'Hey Nexus')}><span class="label">${isTr ? "Tetikleme Kelimesi" : "Wake Word"}</span><span class="value" style="font-weight:600; color:var(--text);">Hey Nexus</span></div>` +
    `<div class="field-row" style="${rowStyle}" ${hoverScript} ${clickScript('voiceType', isTr ? 'Sakin ve Profesyonel' : 'Calm & Professional')}><span class="label">${isTr ? "Ses Tonu (TTS)" : "Voice Personality"}</span><span class="value" style="font-weight:600; color:var(--text);">${isTr ? "Sakin ve Profesyonel" : "Calm & Professional"}</span></div>` +
    `<div class="field-row" style="${rowStyle}" ${hoverScript} ${clickScript('language', escapeHtml(lang))}><span class="label">${isTr ? "Dil" : "Language"}</span><span class="value" style="font-weight:600; color:var(--text);">${escapeHtml(lang)}</span></div>` +
    `<div class="field-row" style="${rowStyle}" ${hoverScript} ${clickScript('theme', isTr ? 'Koyu' : 'Dark')}><span class="label">${isTr ? "Tema" : "Theme"}</span><span class="value" style="font-weight:600; color:var(--text);">${isTr ? "Koyu" : "Dark"}</span></div>` +
    `<div class="field-row" style="${rowStyle}" ${hoverScript} ${clickScript('location', isTr ? 'İstanbul' : 'Istanbul')}><span class="label">${isTr ? "Konum" : "Location"}</span><span class="value" style="font-weight:600; color:var(--text);">${isTr ? "İstanbul, TR" : "Istanbul, TR"}</span></div>` +
    `<div class="field-row" style="${rowStyle} border-bottom: none;" ${hoverScript} ${clickScript('privacy', isTr ? 'Maksimum' : 'Maximum')}><span class="label">${isTr ? "Güvenlik Hassasiyeti" : "Security Sensitivity"}</span><span class="value" style="font-weight:600; color:var(--text);">${isTr ? "Maksimum (Sadece Yerel)" : "Maximum (Local Only)"}</span></div>` +
    `</div>`;
}

export function renderPlatform(model: any): string {
  const isTr = CURRENT_LOCALE === "tr";
  const cards = model.platforms
    .map(
      (p: any) =>
        `<div class="bento-tile">
      <div class="tile-head"><span class="tile-title">${escapeHtml(p.name)}</span></div>
      <div class="value">${p.active ? (isTr ? "Aktif" : "Active") : isTr ? "İndir" : "Download"}</div>
      <button class="btn" style="margin-top: 12px">${p.active ? (isTr ? "Yönet" : "Manage") : isTr ? "İndir" : "Download"}</button>
    </div>`,
    )
    .join("");
  return `<h2>${escapeHtml(label(model.titleKey))}</h2><div class="bento-grid">${cards}</div>`;
}

export function renderDownloadCenter(
  releases: VersionInfoService,
  userAgent: string,
  _surface?: string,
): string {
  const all = releases.all();
  const featured = releases.featuredFor(userAgent);
  const featureHtml = featured
    ? `<a class="dl-primary btn primary" href="${escapeHtml(featured.downloadUrl)}" download>${label(
        "mkt.hero.actionPrimary",
      )
        .replace(
          "{os}",
          featured.platform === "windows"
            ? "Windows"
            : featured.platform === "macos"
              ? "macOS"
              : featured.platform === "linux"
                ? "Linux"
                : featured.platform.toUpperCase(),
        )
        .replace("{version}", escapeHtml(featured.version))}</a>`
    : `<p>Choose your platform</p>`;

  const rows = all
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.platform === "windows" ? "Windows" : r.platform === "macos" ? "macOS" : r.platform === "linux" ? "Linux" : r.platform.toUpperCase())}</td><td>${escapeHtml(r.version)}</td><td>${escapeHtml(r.minOs)}</td><td><code class="sha-code" title="SHA-256 Checksum" style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" onclick="navigator.clipboard.writeText('${escapeHtml(r.checksumSha256)}')">${escapeHtml(r.checksumSha256.substring(0, 12))}... <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></code></td></tr>`,
    )
    .join("");

  const changelog = featured
    ? `<div class="changelog"><h4>${label("mkt.changelog.title").replace("{version}", escapeHtml(featured.version))}</h4><p>&bull; Initial release of the new local processing engine.<br>&bull; Improved UI performance.<br>&bull; Security patches for background sync.</p></div>`
    : "";

  return `<div class="download-container">${featureHtml}${changelog}<table><thead><tr><th>Platform</th><th>Version</th><th>Minimum OS</th><th>SHA-256 Checksum</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function renderLogo(_primaryColor?: string): string {
  return `<svg class="brand-logo" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="NEXUS logo" role="img">
    <defs>
      <linearGradient id="nxlogo" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
        <stop stop-color="#6f9bff"/><stop offset="0.55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/>
      </linearGradient>
      <linearGradient id="nxsheen" x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" stop-opacity="0.30"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxlogo)"/>
    <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxsheen)"/>
    <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#ffffff" stroke-opacity="0.22"/>
    <path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function renderAppIconSvg(primaryColor = "#5b8dff"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="nxicon" x1="48" y1="32" x2="464" y2="480" gradientUnits="userSpaceOnUse">
        <stop stop-color="${primaryColor}"/><stop offset="1" stop-color="#8b7bff"/>
      </linearGradient>
      <linearGradient id="nxiconsheen" x1="256" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" stop-opacity="0.28"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="120" fill="url(#nxicon)"/>
    <rect width="512" height="512" rx="120" fill="url(#nxiconsheen)"/>
    <path d="M168 368V144L344 368V144" fill="none" stroke="#ffffff" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function renderAvatar(url?: string, initial?: string): string {
  if (url) {
    return `<img class="avatar-img" src="${escapeHtml(url)}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" />`;
  }
  const ch = (initial ?? "?").charAt(0).toUpperCase();
  return `<span class="avatar" style="width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--tint);color:var(--primary);font-weight:700;font-size:12.8px;">${escapeHtml(ch)}</span>`;
}

function renderLocalAuthorAvatar(name: string, hue: string): string {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return `<span class="author-avatar" aria-hidden="true" style="width:44px;height:44px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg, color-mix(in srgb, ${hue} 82%, #ffffff 18%), color-mix(in srgb, ${hue} 58%, #111827 42%));color:#fff;font-weight:800;font-size:16px;box-shadow:inset 0 0 0 1px color-mix(in srgb, #ffffff 18%, transparent), 0 8px 20px rgba(0,0,0,0.16);">${escapeHtml(initial)}</span>`;
}

export function renderOgImageSvg(theme: DesignTokens): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${theme.color.bg}"/>
    <text x="600" y="360" font-size="120" font-weight="bold" text-anchor="middle" fill="${theme.color.primary}" font-family="system-ui">NEXUS</text>
  </svg>`;
}

export function renderHeader(_primaryColor: string): string {
  return `<header class="site-header" role="banner"><a class="skip" href="#main">Skip to content</a><div class="navbar"><div class="nav-container"><div class="nav-brand-group"><a href="/" class="nav-brand">${renderLogo()}<span class="brand">NEXUS</span></a></div></div></div></header>`;
}

export function renderHero(): string {
  const isTr = CURRENT_LOCALE === "tr";
  return `<section class="hero"><h1>${isTr ? "Evini Tanıyan Kişisel İşletim Sistemi" : "Your personal operating system for home"}</h1><p class="lede">${isTr ? "Sesinizle kontrol edin, rutinlerinizi otomatikleştirin ve evinizdeki her cihaz\u0131 tek bir yerden Yönetin." : "Control with your voice, automate your routines, and manage every device in your home from one place."}</p><div class="actions"><a class="btn btn-primary" href="#download-center">${isTr ? "Ücretsiz İndir" : "Download Free"}</a><a class="btn btn-secondary" href="#today">${isTr ? "Panele Git" : "Go to Dashboard"}</a></div><p class="trust">${isTr ? "★ 500,000+ kullanıcı · 2000+ akıllı cihaz · %100 yerel gizlilik" : "★ 500,000+ users · 2000+ smart devices · 100% local privacy"}</p></section>`;
}

export function renderNav(nav: readonly ScreenDescriptor[], activeId: ScreenId): string {
  const links = nav
    .map(
      (s) =>
        `<a class="${s.id === activeId ? "active" : ""}" href="#${s.id}" data-nav="${s.id}"${s.id === activeId ? ' aria-current="page"' : ""}>${escapeHtml(label(s.titleKey))}</a>`,
    )
    .join("");
  return `<nav class="web-nav" aria-label="Primary">${links}</nav>`;
}

export function renderFeatures(): string {
  const icons = [
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`,
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1"/></svg>`,
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 2.5 2.5 0 0 1-1.32-4.24 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 7 5.06 2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 2.5 2.5 0 0 0 1.32-4.24 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 17 5.06 2.5 2.5 0 0 0 14.5 2z"/></svg>`,
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  ];
  const isTr = CURRENT_LOCALE === "tr";
  const features = [
    { title: label("mkt.feat.1.title"), desc: label("mkt.feat.1.desc") },
    { title: label("mkt.feat.2.title"), desc: label("mkt.feat.2.desc") },
    { title: label("mkt.feat.3.title"), desc: label("mkt.feat.3.desc") },
    { title: label("mkt.feat.4.title"), desc: label("mkt.feat.4.desc") },
    { title: isTr ? "Yerel İşlem Motoru" : "100% Local Engine", desc: isTr ? "Verileriniz tamamen yerel ağınızda işlenir, buluta bağımlılık yok." : "Zero cloud dependency for instant responsiveness and total privacy." },
    { title: isTr ? "Evrensel Ekosistem" : "Unified Standards", desc: isTr ? "Matter, HomeKit, Zigbee ve Philips Hue cihazlarını tek yerde yönetin." : "Connect Matter, HomeKit, Zigbee, and Philips Hue seamlessly." },
  ];
  const items = features
    .map(
      (f, i) =>
        `<div class="feature-card"><span class="icon">${icons[i] ?? icons[0]}</span><h3>${escapeHtml(f.title)}</h3><p>${escapeHtml(f.desc)}</p></div>`,
    )
    .join("");
  return `<section class="features" aria-label="${label("mkt.feat.why")}"><div class="feature-grid">${items}</div></section>`;
}

export function renderFaq(): string {
  const faqs = [
    { q: label("mkt.faq.1.q"), a: label("mkt.faq.1.a") },
    { q: label("mkt.faq.2.q"), a: label("mkt.faq.2.a") },
    { q: label("mkt.faq.3.q"), a: label("mkt.faq.3.a") },
    { q: label("mkt.faq.4.q"), a: label("mkt.faq.4.a") },
  ];
  const items = faqs
    .map(
      (f, i) =>
        `<div class="faq-item" onclick="this.classList.toggle('open')"><div class="faq-q"><span>${escapeHtml(f.q)}</span><svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></div><div class="faq-a-wrapper"><div class="faq-a">${escapeHtml(f.a)}</div></div></div>`,
    )
    .join("");
  return `<section id="faq" class="faq-section mkt-anchor" aria-label="${label("mkt.faq.title")}">
  <div class="faq-container">
    <div class="faq-header">
      <h2>${label("mkt.faq.title")}</h2>
    </div>
    <div class="faq-grid">
      ${items}
    </div>
  </div>
<style>
.faq-section { margin: 120px 0; padding: 0 24px; }
.faq-container { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: 1fr 2fr; gap: 60px; align-items: start; }
.faq-header { position: sticky; top: 120px; text-align: left; }
.faq-header h2 { font-size: 38px; letter-spacing: -0.025em; margin: 0; color: var(--text); font-weight: 800; }
@media (max-width: 860px) {
  .faq-container { grid-template-columns: 1fr; gap: 32px; }
  .faq-header { position: static; }
  .faq-header h2 { font-size: 32px; }
}
.faq-item { background: color-mix(in srgb, var(--surface) 60%, transparent); border: 1px solid color-mix(in srgb, var(--border) 40%, transparent); border-radius: 12px; margin-bottom: 16px; cursor: pointer; transition: all 0.3s ease; }
.faq-item:hover { border-color: color-mix(in srgb, var(--primary) 30%, transparent); background: color-mix(in srgb, var(--surface) 80%, transparent); transform: translateX(4px); }
.faq-item.open { border-color: color-mix(in srgb, var(--primary) 50%, transparent); box-shadow: 0 12px 32px rgba(0,0,0,0.06); transform: translateX(4px); }
.faq-q { display: flex; justify-content: space-between; align-items: center; padding: 22px 24px; font-weight: 600; font-size: 16px; color: var(--text); }
.faq-icon { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); color: var(--muted); flex: none; margin-left: 16px; }
.faq-item.open .faq-icon { transform: rotate(180deg); color: var(--primary); }
.faq-a-wrapper { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.faq-item.open .faq-a-wrapper { grid-template-rows: 1fr; }
.faq-a { overflow: hidden; padding: 0 24px; color: var(--muted); font-size: 15px; line-height: 1.6; }
.faq-item.open .faq-a { padding: 0 24px 24px; }
</style>
</section>`;
}

export function renderRichFooter(_primaryColor: string): string {
  return `<footer class="footer" role="contentinfo">
  <div class="footer-container">
    <div class="footer-grid">
      <div class="footer-col">
        <div class="footer-brand">${renderLogo()}<span class="brand">NEXUS</span></div>
        <p class="footer-desc">${label("mkt.footer.desc")}</p>
      </div>
      <div class="footer-col">
        <h4>${label("mkt.footer.platforms")}</h4>
        <ul>
          <li><a href="#desktop">Windows</a></li>
          <li><a href="#desktop">macOS</a></li>
          <li><a href="#desktop">Linux</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>${label("mkt.footer.company")}</h4>
        <ul>
          <li><a href="/about">${label("mkt.footer.about")}</a></li>
          <li><a href="/privacy">${label("mkt.footer.privacy")}</a></li>
          <li><a href="/terms">${label("mkt.footer.terms")}</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-bottom-text">&copy; 2026 NEXUS Technologies Inc. &middot; <span style="opacity:0.7">${label("mkt.footer.noCookies")}</span></div>
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
  const isTr = CURRENT_LOCALE === "tr";
  const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="pricing-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  return `<section id="pricing" class="mkt-pricing mkt-anchor">
<div class="mkt-heading"><h2>${label("mkt.pricing.title")}</h2></div>
<div class="pricing-grid">
  <div class="pricing-card">
    <h3>${label("mkt.pricing.free")}</h3>
    <p>${label("mkt.pricing.freeDesc")}</p>
    <div class="price">$0<span>/${isTr ? "ay" : "mo"}</span></div>
    <ul class="pricing-features">
      <li>${checkIcon} <span>${isTr ? "5 cihaza kadar bağlantı" : "Up to 5 devices connected"}</span></li>
      <li>${checkIcon} <span>${isTr ? "Temel sesli komutlar & rutinler" : "Basic voice commands & routines"}</span></li>
      <li>${checkIcon} <span>${isTr ? "%100 yerel işleme" : "100% local processing"}</span></li>
      <li>${checkIcon} <span>${isTr ? "Topluluk desteği" : "Standard community support"}</span></li>
    </ul>
    <a href="/login" class="btn secondary">${label("mkt.pricing.cta")}</a>
  </div>
  <div class="pricing-card premium">
    <span class="popular-badge">${isTr ? "En Popüler" : "Most Popular"}</span>
    <h3>${label("mkt.pricing.premium")}</h3>
    <p>${label("mkt.pricing.premiumDesc")}</p>
    <div class="price">$5<span>/${isTr ? "ay" : "mo"}</span></div>
    <ul class="pricing-features">
      <li>${checkIcon} <span>${isTr ? "Sınırsız cihaz bağlantısı" : "Unlimited devices connected"}</span></li>
      <li>${checkIcon} <span>${isTr ? "Gelişmiş YZ otomasyonu & rutinler" : "Advanced AI routines & automation"}</span></li>
      <li>${checkIcon} <span>${isTr ? "Çoklu oda ses & sahneleri" : "Multi-room audio & scenes"}</span></li>
      <li>${checkIcon} <span>${isTr ? "7/24 öncelikli destek" : "Priority 24/7 support"}</span></li>
      <li>${checkIcon} <span>${isTr ? "Güvenli uzaktan erişim" : "Secure remote access"}</span></li>
    </ul>
    <a href="/login" class="btn primary">${label("mkt.pricing.cta")}</a>
  </div>
  <div class="pricing-card">
    <h3>${label("mkt.pricing.family")}</h3>
    <p>${label("mkt.pricing.familyDesc")}</p>
    <div class="price">$10<span>/${isTr ? "ay" : "mo"}</span></div>
    <ul class="pricing-features">
      <li>${checkIcon} <span>${isTr ? "Premium'daki tüm özellikler" : "Everything in Premium"}</span></li>
      <li>${checkIcon} <span>${isTr ? "6 aile üyesi profiline kadar" : "Up to 6 family profiles"}</span></li>
      <li>${checkIcon} <span>${isTr ? "Gelişmiş ebeveyn kontrolleri" : "Granular parental controls"}</span></li>
      <li>${checkIcon} <span>${isTr ? "Özel aile paneli" : "Dedicated family dashboard"}</span></li>
    </ul>
    <a href="/login" class="btn secondary">${label("mkt.pricing.cta")}</a>
  </div>
</div>
</section>`;
}

export function renderTestimonials(): string {
  const renderStars = () => `<div class="stars">${Array(5).fill('<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>').join('')}</div>`;
  const author1 = label("mkt.testimonials.author1");
  const author2 = label("mkt.testimonials.author2");
  const author3 = label("mkt.testimonials.author3");
  
  return `<section class="mkt-testimonials">
<div class="mkt-heading"><h2>${label("mkt.testimonials.title")}</h2></div>
<div class="testimonials-grid">
  <div class="testimonial-card">
    ${renderStars()}
    <p>"${label("mkt.testimonials.quote1")}"</p>
    <div class="author-info">
      ${renderLocalAuthorAvatar(author1, "#6f9bff")}
      <div>
        <div class="author-name">${author1}</div>
        <div class="author-role">${label("mkt.testimonials.role1")}</div>
      </div>
    </div>
  </div>
  <div class="testimonial-card">
    ${renderStars()}
    <p>"${label("mkt.testimonials.quote2")}"</p>
    <div class="author-info">
      ${renderLocalAuthorAvatar(author2, "#5b8dff")}
      <div>
        <div class="author-name">${author2}</div>
        <div class="author-role">${label("mkt.testimonials.role2")}</div>
      </div>
    </div>
  </div>
  <div class="testimonial-card">
    ${renderStars()}
    <p>"${label("mkt.testimonials.quote3")}"</p>
    <div class="author-info">
      ${renderLocalAuthorAvatar(author3, "#8b7bff")}
      <div>
        <div class="author-name">${author3}</div>
        <div class="author-role">${label("mkt.testimonials.role3")}</div>
      </div>
    </div>
  </div>
</div>
</section>`;
}

export function renderIntegrationMarquee(): string {
  return `<section id="integrations" class="mkt-integrations mkt-anchor">
<p class="integration-title">${label("mkt.integrations.title")}</p>
<div class="marquee">
  <span>Matter</span> &middot; <span>Zigbee</span> &middot; <span>Z-Wave</span> &middot; <span>HomeKit</span> &middot; <span>Philips Hue</span> &middot; <span>Sonos</span> &middot; <span>Nest</span> &middot; <span>Ring</span>
</div>
</section>`;
}

export function renderStyles(theme: DesignTokens): string {
  const t = theme;
  const lightTheme = getTheme("light");
  const darkTheme = getTheme("dark");

  const renderVars = (t2: DesignTokens) => `  --bg: ${t2.color.bg};
  --surface: ${t2.color.surface};
  --text: ${t2.color.text};
  --muted: ${t2.color.textMuted};
  --primary: ${t2.color.primary};
  --on-primary: ${t2.color.onPrimary};
  --accent: ${t2.color.accent};
  --radius: ${t2.radius.md}px;
  --radius-lg: ${t2.radius.lg}px;
  --radius-xl: ${t2.radius.xl}px;
  --font: ${t2.font.family};
  --font-mono: ${t2.font.familyMono};
  --gap: ${t2.space[4]}px;
  --border: color-mix(in srgb, var(--text) 8%, transparent);
  --border-strong: color-mix(in srgb, var(--text) 14%, transparent);
  --tint: color-mix(in srgb, var(--primary) 12%, transparent);
  --tint-soft: color-mix(in srgb, var(--primary) 6%, transparent);
  --shadow-sm: ${t2.shadow.sm};
  --shadow-md: ${t2.shadow.md};
  --shadow-lg: ${t2.shadow.lg};
  --shadow-xl: ${t2.shadow.xl};
  --ring: ${t2.shadow.ring};
  --transition-fast: ${t2.transition.fast};
  --transition-normal: ${t2.transition.normal};
  --transition-slow: ${t2.transition.slow};
  --transition-spring: ${t2.transition.spring};
  --gradient: linear-gradient(135deg, var(--primary), var(--accent));`;

  return `${renderFontFaces()}

:root {
${renderVars(t)}
}

[data-theme="light"] {
${renderVars(lightTheme)}
}

[data-theme="dark"] {
${renderVars(darkTheme)}
}

* {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--primary) 40%, transparent) transparent;
}
a, button, .btn, nav, header, footer, .badge, .popular-badge, .stat, .eyebrow, img, svg, .brand,
.hero-mockup, .phone-frame, .mockup-sidebar-full, .dsk-card, .pricing-card, .testimonial-card, 
.faq-q, .how-step, .brand-logo-pill, .integration-title, .version-badge, .theme-toggle, .mouse {
  user-select: none;
  -webkit-user-select: none;
}
.testimonial-card p { user-select: text; -webkit-user-select: text; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--primary) 40%, transparent); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: var(--primary); }

.pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 48px; }
.pricing-card {
  position: relative; display: flex; flex-direction: column; gap: 20px;
  background: color-mix(in srgb, var(--surface) 80%, transparent); backdrop-filter: blur(24px);
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  border-radius: 24px; padding: 40px 32px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.1); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.4s ease, box-shadow 0.4s ease;
}
.pricing-card h3 { font-size: 24px; margin: 0; font-weight: 700; color: var(--text); }
.pricing-card p { margin: 0; color: color-mix(in srgb, var(--text) 70%, transparent); font-size: 14px; line-height: 1.5; min-height: 42px; }
.pricing-card .price { font-size: 48px; font-weight: 800; color: var(--text); display: flex; align-items: baseline; gap: 4px; margin: 8px 0; }
.pricing-card .price span { font-size: 16px; font-weight: 500; color: color-mix(in srgb, var(--text) 50%, transparent); }
.pricing-card:hover { transform: translateY(-8px); border-color: color-mix(in srgb, var(--primary) 50%, transparent); box-shadow: 0 24px 48px color-mix(in srgb, var(--primary) 15%, rgba(0,0,0,0.2)); }
.pricing-card.premium {
  border: 2px solid var(--primary);
  background: linear-gradient(165deg, color-mix(in srgb, var(--primary) 15%, var(--surface)), color-mix(in srgb, var(--surface) 90%, transparent));
  box-shadow: 0 24px 64px color-mix(in srgb, var(--primary) 25%, transparent);
  transform: scale(1.05);
  z-index: 2;
}
.pricing-card.premium:hover { transform: scale(1.05) translateY(-8px); }
.popular-badge {
  position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
  background: var(--gradient); color: #ffffff;
  font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
  padding: 6px 16px; border-radius: 999px; box-shadow: 0 8px 20px color-mix(in srgb, var(--primary) 40%, transparent);
}
.pricing-features { list-style: none; padding: 0; margin: 8px 0 24px; display: flex; flex-direction: column; gap: 16px; font-size: 14px; color: var(--text); flex: 1; }
.pricing-features li { display: flex; align-items: flex-start; gap: 12px; line-height: 1.4; color: color-mix(in srgb, var(--text) 85%, transparent); }
.pricing-features li .pricing-check { flex-shrink: 0; width: 18px; height: 18px; color: var(--primary); margin-top: 1px; }
.pricing-card .btn { margin-top: auto; padding: 14px 24px; font-size: 15px; font-weight: 600; border-radius: 12px; width: 100%; text-align: center; }
.pricing-card.premium .btn { box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 30%, transparent); }
@media (max-width: 860px) { .pricing-grid { grid-template-columns: 1fr; max-width: 420px; margin-left: auto; margin-right: auto; } }

html { box-sizing: border-box; scroll-behavior: smooth; }
*, *:before, *:after { box-sizing: inherit; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto !important; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
body {
  margin: 0;
  background: var(--bg);
  background-image: radial-gradient(circle at top right, var(--tint), transparent 40%), radial-gradient(circle at bottom left, var(--tint-soft), transparent 40%);
  color: var(--text);
  font-family: var(--font);
  font-size: 14px;
  line-height: 1.6;
  min-height: 100vh;
}
.wrap { max-width: 1080px; margin: 0 auto; padding: 40px 24px; }
.brand { display: block; font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 800; letter-spacing: -0.03em; margin: 0; color: var(--text); }
.tag { color: var(--muted); margin: 8px 0 32px; font-weight: 500; }
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
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0,0,0,0.05);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease, border-color 0.4s ease;
}
.card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 16px 32px color-mix(in srgb, var(--primary) 15%, transparent);
  border-color: color-mix(in srgb, var(--primary) 40%, transparent);
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
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  border-radius: var(--radius-lg); padding: 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0,0,0,0.05);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease, border-color 0.4s ease;
}
.bento-tile:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 16px 32px color-mix(in srgb, var(--primary) 12%, transparent);
  border-color: color-mix(in srgb, var(--primary) 30%, transparent);
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
  background: color-mix(in srgb, var(--surface) 75%, transparent);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border: 1px solid color-mix(in srgb, var(--border-strong) 40%, transparent);
  border-radius: 999px; /* Floating capsule look */
  padding: 12px 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 12px 32px color-mix(in srgb, var(--primary) 15%, transparent);
  transition: transform 0.3s ease;
}
.assistant-strip:hover { transform: scale(1.02); }
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
.plan-card {
  background: color-mix(in srgb, var(--surface) 50%, transparent);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--primary) 40%, transparent);
  border-radius: var(--radius-lg); padding: 24px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 16px color-mix(in srgb, var(--primary) 15%, transparent);
}
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

/* ── Component Kit B (Form, Select, Table, Modal) ── */
.nx-form { display: flex; flex-direction: column; gap: 16px; width: 100%; }
.nx-form-group { display: flex; flex-direction: column; gap: 6px; }
.nx-label { font-size: 13px; font-weight: 600; color: var(--muted); }
.nx-input, .nx-select {
  padding: 10px 14px; background: var(--bg); border: 1px solid var(--border-strong);
  border-radius: var(--radius); color: var(--text); font-family: var(--font); font-size: 14px;
  outline: none; transition: all 0.2s ease;
}
.nx-input:focus, .nx-select:focus { border-color: var(--primary); box-shadow: var(--ring); }
.nx-select { appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 16px; padding-right: 36px; }
.nx-table-wrap { width: 100%; overflow-x: auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); }
.nx-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
.nx-table th, .nx-table td { padding: 12px 16px; border-bottom: 1px solid var(--border); }
.nx-table th { font-weight: 600; color: var(--muted); background: color-mix(in srgb, var(--bg) 50%, transparent); }
.nx-table tr:last-child td { border-bottom: none; }
.nx-table tr:hover td { background: color-mix(in srgb, var(--tint) 20%, transparent); }
.nx-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
  opacity: 0; pointer-events: none; transition: opacity 0.2s ease;
}
.nx-modal-overlay.open { opacity: 1; pointer-events: auto; }
.nx-modal {
  background: var(--surface); border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg); padding: 24px; width: 100%; max-width: 480px;
  box-shadow: var(--elev); transform: translateY(10px) scale(0.98); transition: all 0.2s ease;
}
.nx-modal-overlay.open .nx-modal { transform: translateY(0) scale(1); }
.nx-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.nx-modal-title { font-size: 18px; font-weight: 700; margin: 0; }
.nx-modal-close { background: none; border: none; color: var(--muted); font-size: 20px; cursor: pointer; padding: 4px; display: inline-flex; }
.nx-modal-close:hover { color: var(--text); }
.nx-modal-body { color: var(--muted); font-size: 14px; margin-bottom: 24px; }
.nx-modal-footer { display: flex; justify-content: flex-end; gap: 12px; }

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
  background: color-mix(in srgb, var(--surface) 50%, transparent);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  border-radius: var(--radius-lg); padding: 16px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0,0,0,0.05);
}
.suggest-card .actions { margin-top: auto; justify-content: flex-end; }

.skill-bar-wrap {
  background: color-mix(in srgb, var(--surface) 50%, transparent);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0,0,0,0.05);
}
.skill-bar-header { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
.skill-bar-header .count { color: var(--muted); }
.skill-bar-track { height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden; }
.skill-bar-fill { height: 100%; background: var(--primary); }

.member-card {
  display: flex; align-items: center; gap: 16px;
  background: color-mix(in srgb, var(--surface) 50%, transparent);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  border-radius: var(--radius-lg); padding: 16px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0,0,0,0.05);
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
/* Scoped to .dot — a bare .off/.on rule would paint grey blocks over any
 * other element (e.g. the mobile plan-compare feature rows) using the class. */
.dot.on { background: #2ecc71; }
.dot.off { background: var(--muted); }
.dl-primary {
  display: inline-block; background: var(--primary); color: var(--on-primary);
  padding: 16px 32px; border-radius: var(--radius); font-weight: 600;
  text-decoration: none; margin-bottom: 16px;
  box-shadow: 0 8px 22px color-mix(in srgb, var(--primary) 42%, transparent);
}
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { text-align: left; padding: 12px; border-bottom: 1px solid var(--surface); }
th { color: var(--muted); font-weight: 600; }
code { color: var(--muted); word-break: break-all; font-family: var(--font-mono); font-size: 0.88em; }
.badge {
  font-size: 12px; padding: 2px 8px; border-radius: 999px;
  background: var(--primary); color: var(--on-primary);
}
.badge.muted { background: var(--bg); color: var(--muted); border: 1px solid var(--surface); }
.btn {
  font-size: 13px; font-weight: 600; padding: 10px 18px;
  border-radius: 999px; border: 1px solid color-mix(in srgb, var(--primary) 40%, transparent);
  background: color-mix(in srgb, var(--primary) 8%, transparent); color: var(--primary); cursor: pointer;
  text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  backdrop-filter: blur(8px);
  transition: var(--transition-fast);
}
.btn.primary { background: var(--gradient); color: #ffffff; border-color: transparent; box-shadow: var(--shadow-md); }
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
  padding: 64px 0 48px; border-bottom: 1px solid var(--border);
  margin-bottom: 48px;
}
.hero::before {
  content: ""; position: absolute; inset: -50% 20% auto -20%; height: 480px; z-index: -1;
  background: radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 70%);
  pointer-events: none;
}
.hero h1 {
  font-size: 48px; line-height: 1.05; letter-spacing: -0.04em; margin: 0 0 20px;
  max-width: 18ch; font-weight: 800;
}
.hero .lede { color: var(--muted); font-size: 18px; margin: 0 0 24px; max-width: 60ch; }
.hero .actions { flex-wrap: wrap; }
.hero .btn { font-size: 14px; padding: 12px 24px; }
.hero .trust { color: var(--muted); font-size: 12px; margin-top: 16px; }
.features { margin-top: 48px; }
.feature-grid {
  display: grid; gap: 16px;
  grid-template-columns: repeat(3, 1fr);
}
.feature {
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  border-radius: var(--radius-lg); padding: 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), var(--shadow-sm);
}
.feature .icon {
  display: inline-flex; width: 40px; height: 40px; border-radius: var(--radius);
  align-items: center; justify-content: center; background: var(--tint);
  color: var(--primary); margin-bottom: 12px;
}
.feature h3 { margin: 0 0 8px; font-size: 18px; }
.feature p { margin: 0; color: var(--muted); font-size: 12px; }

@media (max-width: 900px) {
  .feature-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .wrap { padding: env(safe-area-inset-top, 16px) env(safe-area-inset-right, 12px) env(safe-area-inset-bottom, 16px) env(safe-area-inset-left, 12px); }
  .row { flex-wrap: wrap; gap: 8px; }
  nav { gap: 4px; }
  .hero { padding: 48px 0 32px; }
  .hero h1 { font-size: 32px; word-break: break-word; line-height: 1.15; }
  .hero .lede { font-size: 15px; }
  .hero .actions .btn { flex: 1 1 auto; text-align:center; min-height: 44px; }
  .btn, .nav-link, .nav-cta, .lang-picker-btn { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
  .cards, .feature-grid { grid-template-columns: 1fr; }
  table { font-size: 11px; display: block; overflow-x: auto; white-space: nowrap; }
  th, td { padding: 8px; }
  .bento-tile, .plan-card, .skill-card-rich, .suggestion-card, .member-card, .room-card { padding: 16px !important; }
  .badge { white-space: nowrap; text-align: center; flex-shrink: 0; display: inline-flex; max-width: 100%; }
  * { word-wrap: break-word; overflow-wrap: break-word; }
}
/* ── Premium motion & interaction layer ─────────────────────────────── */
@media (prefers-reduced-motion: no-preference) {
  nav a { transition: background 160ms ease, color 160ms ease, border-color 160ms ease; }
  /* Ambient drifting aurora behind everything (subtle; never harms text contrast) */
  body::before {
    content: ""; position: fixed; inset: -25vmax; z-index: -2; pointer-events: none;
    background:
      radial-gradient(38vmax 38vmax at 18% 14%, color-mix(in srgb, var(--primary) 16%, transparent), transparent 60%),
      radial-gradient(30vmax 30vmax at 84% 82%, color-mix(in srgb, var(--primary) 10%, transparent), transparent 62%);
    animation: nxAurora 28s ease-in-out infinite alternate;
  }
  .hero h1 { animation: nxRise 0.7s cubic-bezier(.2,.8,.2,1) both; }
  .hero .lede { animation: nxRise 0.7s cubic-bezier(.2,.8,.2,1) 0.08s both; }
  .hero .actions { animation: nxRise 0.7s cubic-bezier(.2,.8,.2,1) 0.16s both; }
  .hero .trust { animation: nxRise 0.7s cubic-bezier(.2,.8,.2,1) 0.24s both; }
}
@keyframes nxAurora {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(2%, -1.5%, 0) scale(1.06); }
  100% { transform: translate3d(-2%, 1.5%, 0) scale(1.03); }
}
@keyframes nxRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }

/* Buttons: tactile lift + press */
.btn { transition: transform 160ms cubic-bezier(.2,.8,.2,1), box-shadow 160ms ease, background 160ms ease, color 160ms ease, border-color 160ms ease; }
.btn:hover { transform: translateY(-2px); }
.btn:active { transform: translateY(0) scale(0.98); }
.btn.primary:hover { box-shadow: 0 10px 26px color-mix(in srgb, var(--primary) 52%, transparent); }
.dl-primary { transition: transform 160ms cubic-bezier(.2,.8,.2,1), box-shadow 160ms ease; }
.dl-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 30px color-mix(in srgb, var(--primary) 55%, transparent); }

/* Card-like surfaces: unified premium hover (lift, glow border, deeper shadow) */
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .card, .feature, .bento-tile, .room-card, .device-pill, .plan-card,
  .suggest-card, .member-card, .skill-bar-wrap, .audit-card, .sparkline-card {
    transition: transform 220ms cubic-bezier(.2,.8,.2,1), border-color 220ms ease, box-shadow 220ms ease;
  }
  .card:hover, .feature:hover, .bento-tile:hover, .room-card:hover, .device-pill:hover,
  .plan-card:hover, .suggest-card:hover, .member-card:hover, .skill-bar-wrap:hover,
  .audit-card:hover, .sparkline-card:hover {
    transform: translateY(-4px);
    border-color: color-mix(in srgb, var(--primary) 42%, var(--border));
    box-shadow: 0 18px 42px color-mix(in srgb, var(--primary) 14%, transparent);
  }
  .cardicon, .feature .icon, .dev-icon, .room-card .cardicon { transition: transform 220ms cubic-bezier(.2,.8,.2,1); }
  .card:hover .cardicon, .feature:hover .icon, .room-card:hover .cardicon,
  .device-pill:hover .dev-icon { transform: scale(1.08) rotate(-3deg); }
}

/* Consistent, accessible focus ring */
a:focus-visible, button:focus-visible, .btn:focus-visible, summary:focus-visible,
input:focus-visible, select:focus-visible { outline: none; box-shadow: var(--ring); }


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
  color: var(--text);
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
/* ── Custom language picker dropdown ── */
.lang-picker { position: relative; z-index: 200; }
.lang-picker-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
  border-radius: 999px; border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  backdrop-filter: blur(8px); color: var(--text); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.15s ease; white-space: nowrap;
}
.lang-picker-btn:hover { border-color: var(--primary); color: var(--primary); }
.lang-picker-btn[aria-expanded="true"] { border-color: var(--primary); }
.lang-picker-btn[aria-expanded="true"] .ld-caret { transform: rotate(180deg); }
.ld-caret { transition: transform 0.2s ease; }
.ld-menu {
  display: none; position: absolute; top: calc(100% + 6px); right: 0;
  min-width: 160px; max-height: 320px; overflow-y: auto;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; padding: 6px; box-shadow: 0 12px 40px rgba(0,0,0,0.35);
  flex-direction: column; gap: 2px;
}
.ld-menu.open { display: flex; animation: ld-fade 0.15s ease; }
@keyframes ld-fade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
.ld-item {
  display: block; padding: 8px 12px; border-radius: 8px; font-size: 13px;
  font-weight: 500; color: var(--text); text-decoration: none; transition: background 0.1s;
}
.ld-item:hover { background: var(--tint); color: var(--primary); }
.ld-item.active { color: var(--primary); font-weight: 700; background: color-mix(in srgb, var(--primary) 10%, transparent); }
.ld-menu::-webkit-scrollbar { width: 4px; }
.ld-menu::-webkit-scrollbar-track { background: transparent; }
.ld-menu::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
/* ── RTL support ── */
[dir="rtl"] { direction: rtl; }
[dir="rtl"] .nav-links { direction: ltr; }
[dir="rtl"] .hero-inner { direction: rtl; }
[dir="rtl"] .feature-card, [dir="rtl"] .how-step, [dir="rtl"] .pricing-card { text-align: right; }
[dir="rtl"] .footer-grid { direction: rtl; }
[dir="rtl"] .ld-menu { right: auto; left: 0; }
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
  display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 16px;
  padding-top: 24px; border-top: 1px solid var(--border);
  color: var(--muted); font-size: 12px; text-align: center;
}
.footer-bottom-text { width: 100%; text-align: center; }
.footer-social { display: flex; gap: 12px; margin-top: 16px; }
.footer-social .social-link { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: var(--tint); color: var(--muted); transition: color 0.2s, background 0.2s; }
.footer-social .social-link:hover { color: var(--primary); background: color-mix(in srgb, var(--primary) 15%, transparent); }
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
.feature-card { transition: transform 220ms cubic-bezier(.2,.8,.2,1), border-color 220ms ease, box-shadow 220ms ease; }
.feature-card:hover { transform: translateY(-4px); border-color: color-mix(in srgb, var(--primary) 42%, var(--border)); box-shadow: 0 18px 42px color-mix(in srgb, var(--primary) 14%, transparent); }
.feature-card .icon { transition: transform 220ms cubic-bezier(.2,.8,.2,1); }
.feature-card:hover .icon { transform: scale(1.08) rotate(-3deg); }
.site-footer {
  margin-top: 48px; padding: 24px 2rem;
  border-top: 1px solid var(--surface); color: var(--muted); font-size: 12px;
  display: flex; flex-wrap: wrap; gap: 8px 24px; justify-content: space-between;
}
.site-footer a { color: var(--muted); text-decoration: none; }
.site-footer a:hover { color: var(--text); }
`;
}

export function renderAdminDashboard(
  model: import("@nexus/interface").AdminDashboardModel,
): string {
  return `
<div class="wrap">
  <h2>${label(model.titleKey)}</h2>
  <div class="bento-grid">
    <div class="bento-tile" style="transition: transform 0.2s, background 0.2s; cursor: pointer;" onmouseover="this.style.transform='translateY(-2px)'; this.style.background='var(--surface)'" onmouseout="this.style.transform='translateY(0)'; this.style.background=''">
      <div class="tile-head">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        <span class="tile-title">Total Users</span>
      </div>
      <div class="value">${model.totalUsers}</div>
    </div>
    <div class="bento-tile" style="transition: transform 0.2s, background 0.2s; cursor: pointer;" onmouseover="this.style.transform='translateY(-2px)'; this.style.background='var(--surface)'" onmouseout="this.style.transform='translateY(0)'; this.style.background=''">
      <div class="tile-head">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
        <span class="tile-title">Active Devices</span>
      </div>
      <div class="value">${model.activeDevices}</div>
    </div>
    <div class="bento-tile" style="transition: transform 0.2s, background 0.2s; cursor: pointer;" onmouseover="this.style.transform='translateY(-2px)'; this.style.background='var(--surface)'" onmouseout="this.style.transform='translateY(0)'; this.style.background=''">
      <div class="tile-head">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        <span class="tile-title">Revenue (MRR)</span>
      </div>
      <div class="value">${model.revenue}</div>
    </div>
  </div>

  <h2 style="margin-top: 32px;">System Logs</h2>
  <div class="nx-table-wrap">
    <table class="nx-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Event</th>
        </tr>
      </thead>
      <tbody>
        ${model.recentLogs.map((l) => `<tr style="transition: background 0.2s; cursor: pointer;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''"><td>${l.time}</td><td>${l.event}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>
</div>
`;
}
