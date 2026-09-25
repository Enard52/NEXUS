/**
 * NEXUS AI — Premium marketing homepage body (generated).
 *
 * Extracted verbatim from the approved premium landing design. Inline
 * onerror handlers were removed in favor of the scripted listener appended
 * at the end of the body. Dynamic parts (language menu, active language
 * code, download versions and links) are injected by the caller.
 *
 * Regenerate with: node scripts/gen-premium-body.mjs
 */

import { readFileSync } from "node:fs";

const LOCAL_LOGOS = JSON.parse(
  readFileSync(new URL("../../../logos.json", import.meta.url), "utf8"),
) as Record<string, string>;

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function renderLogoSvg(gradId = "nxlogo-sub", sheenId = "nxsheen-sub"): string {
  return `<svg class="brand-logo" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="${gradId}" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
        <stop stop-color="#6f9bff"/><stop offset="0.55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/>
      </linearGradient>
      <linearGradient id="${sheenId}" x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" stop-opacity="0.30"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#${gradId})"/>
    <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#${sheenId})"/>
    <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#ffffff" stroke-opacity="0.22"/>
    <path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

const BRAND_LOGOS = {
  apple: svgDataUri(LOCAL_LOGOS.apple),
  googlehome: svgDataUri(LOCAL_LOGOS.googleassistant),
  smartthings: svgDataUri(LOCAL_LOGOS.smartthings),
  homeassistant: svgDataUri(LOCAL_LOGOS.homeassistant),
  philipshue: svgDataUri(LOCAL_LOGOS.philips),
  sonos: svgDataUri(LOCAL_LOGOS.sonos),
  ikea: svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="IKEA"><rect width="24" height="24" rx="7" fill="#0058A3"/><circle cx="12" cy="12" r="8.3" fill="none" stroke="#FFDA1A" stroke-width="2"/><text x="12" y="15" text-anchor="middle" font-family="Arial, sans-serif" font-size="7.3" font-weight="900" letter-spacing=".08em" fill="#FFDA1A">IKEA</text></svg>`,
  ),
  zigbee: svgDataUri(LOCAL_LOGOS.zigbee),
  bose: svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="Bose"><rect width="24" height="24" rx="7" fill="#111827"/><path d="M5.8 15.2c1.9-2.6 5.6-2.6 7.5 0m-10-4.4c3.5-4.7 9.1-4.7 12.6 0m-14.9-1.7c4.5-6 11.7-6 16.2 0" fill="none" stroke="#F8FAFC" stroke-width="1.4" stroke-linecap="round"/><text x="12" y="19" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" font-weight="800" fill="#F8FAFC">BOSE</text></svg>`,
  ),
  xiaomi: svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="Xiaomi"><rect width="24" height="24" rx="7" fill="#FF6900"/><path d="M7 8.5h2.5l2.5 3.3 2.5-3.3H17v7h-2.1v-4.1l-2.4 3.2h-.1l-2.4-3.2v4.1H7z" fill="#fff"/><text x="12" y="20" text-anchor="middle" font-family="Arial, sans-serif" font-size="4.6" font-weight="800" letter-spacing=".12em" fill="#fff">mi</text></svg>`,
  ),
} as const;

/** Siyah fill kullanan logolar — dark temada beyaz görünmeleri için CSS invert uygulanır */
const DARK_INVERT_BRANDS = new Set<keyof typeof BRAND_LOGOS>(["apple", "sonos"]);

function integrationLogo(key: keyof typeof BRAND_LOGOS, label: string): string {
  const invertAttr = DARK_INVERT_BRANDS.has(key) ? ' data-dark-invert="1"' : '';
  return `<img class="integration-logo" src="${BRAND_LOGOS[key]}" alt="" loading="lazy" decoding="async" data-brand="${label}"${invertAttr} />`;
}

const AVATAR_SJ = "/images/avatars/sarah-jenkins.jpg";
const AVATAR_DC = "/images/avatars/david-chen.jpg";
const AVATAR_ET = "/images/avatars/emma-thompson.jpg";
const AVATAR_MA = "/images/avatars/mateo-alvarez.jpg";
const AVATAR_AR = "/images/avatars/aisha-rahman.jpg";
const AVATAR_NW = "/images/avatars/noah-williams.jpg";
const AVATAR_SM = "/images/avatars/sofia-martins.jpg";
const AVATAR_KS = "/images/avatars/kenji-sato.jpg";
const AVATAR_OB = "/images/avatars/olivia-brooks.jpg";
const AVATAR_LM = "/images/avatars/lucas-meyer.jpg";

export interface PremiumDynamicParts {
  /** Uppercase short code shown in the language button, e.g. "EN". */
  langCode: string;
  /** Full `<div class="language-menu" ...>` block with the active entry marked. */
  langMenu: string;
  androidVersion: string;
  iosVersion: string;
  playHref: string;
  appStoreHref: string;
  apkHref: string;
}

export function renderPremiumBody(dyn: PremiumDynamicParts): string {
  return `
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="brand-atmosphere" aria-hidden="true">
    <span class="brand-glyph brand-glyph-a">${renderLogoSvg("nxlogo-ga", "nxsheen-ga")}</span>
    <span class="brand-glyph brand-glyph-b">${renderLogoSvg("nxlogo-gb", "nxsheen-gb")}</span>
    <span class="brand-glyph brand-glyph-c">${renderLogoSvg("nxlogo-gc", "nxsheen-gc")}</span>
    <span class="brand-signal brand-signal-a"></span>
    <span class="brand-signal brand-signal-b"></span>
  </div>

  <header class="site-header">
    <div class="container">
      <div class="nav-shell" id="nav-shell">
        <a class="brand" href="/" aria-label="NEXUS home">
          <svg class="brand-logo" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="NEXUS logo" role="img">
            <defs>
              <linearGradient id="nxlogo-header" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
                <stop stop-color="#6f9bff"/><stop offset="0.55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/>
              </linearGradient>
              <linearGradient id="nxsheen-header" x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse">
                <stop stop-color="#ffffff" stop-opacity="0.30"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxlogo-header)"/>
            <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxsheen-header)"/>
            <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#ffffff" stroke-opacity="0.22"/>
            <path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>NEXUS</span>
        </a>

        <nav class="nav-links" aria-label="Primary navigation">
          <a class="nav-link" href="#features">Features</a>
          <a class="nav-link" href="#how">How it works</a>
          <a class="nav-link" href="#integrations">Integrations</a>
          <a class="nav-link" href="#pricing">Pricing</a>
          <a class="nav-link" href="#downloads">Download</a>
          <div class="mobile-nav-actions">
            <a class="mobile-nav-cta mobile-nav-login" href="#downloads">Open account</a>
            <a class="mobile-nav-cta mobile-nav-download" href="#downloads">Download NEXUS</a>
          </div>
        </nav>

        <div class="nav-actions">
          <div class="language" id="language">
            <button class="language-button" id="language-button" type="button" aria-expanded="false" aria-haspopup="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span>${dyn.langCode}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            ${dyn.langMenu}
          </div>

          <button class="icon-button" id="theme-toggle" type="button" aria-label="Toggle color theme">
            <svg class="sun" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>
            <svg class="moon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <a class="button button-primary button-small" href="#downloads">Try NEXUS</a>
          <button class="menu-button" id="menu-button" type="button" aria-label="Open menu" aria-expanded="false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </div>
    </div>
  </header>

  <main id="main">
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-content reveal">
          <div class="eyebrow"><span class="eyebrow-dot"></span> Android · iOS · local network</div>
          <h1>Your home.<span class="hero-gradient-line"><span class="hero-word">One</span> <span class="hero-word">intelligence.</span></span></h1>
          <p class="hero-copy">NEXUS is a smart home assistant that helps you manage your smart home devices.</p>
          <div class="hero-actions">
            <a class="button button-primary" href="#downloads">
              Try NEXUS free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
            <a class="button button-secondary" href="#downloads">
              Get the mobile app
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>
            </a>
          </div>
          <div class="hero-proof">
            <span class="proof-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>
              100% local processing
            </span>
            <span class="proof-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>
              No cloud dependency
            </span>
            <span class="proof-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>
              Free to start
            </span>
          </div>
        </div>

        <div class="constellation reveal" aria-label="NEXUS connected home intelligence visualization">
          <div class="map-surface">
            <div class="orbit orbit-one"></div>
            <div class="orbit orbit-two"></div>
            <div class="orbit orbit-three"></div>

            <svg class="map-lines" viewBox="0 0 600 610" aria-hidden="true">
              <path d="M300 290 C220 210 160 170 110 145"/>
              <path d="M300 290 C390 205 450 165 510 145"/>
              <path d="M300 290 C205 335 150 390 95 445"/>
              <path d="M300 290 C395 335 455 390 515 445"/>
              <path d="M300 290 C300 370 300 455 300 540"/>
            </svg>

            <div class="core">
              <svg class="brand-logo" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs>
                  <linearGradient id="nxlogo-core" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#6f9bff"/><stop offset="0.55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/>
                  </linearGradient>
                  <linearGradient id="nxsheen-core" x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#ffffff" stop-opacity="0.30"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxlogo-core)"/>
                <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxsheen-core)"/>
                <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#ffffff" stroke-opacity="0.22"/>
                <path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="node node-lights">
              <div class="node-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 22h4M8.5 14.5A6 6 0 1 1 15.5 14.5C14.5 15.3 14 16 14 17h-4c0-1-.5-1.7-1.5-2.5z"/></svg>
              </div>
              <div class="node-copy"><strong>Lighting</strong><span>12 scenes ready</span></div>
            </div>
            <div class="node node-climate">
              <div class="node-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0z"/></svg>
              </div>
              <div class="node-copy"><strong>Climate</strong><span>22° · Eco mode</span></div>
            </div>
            <div class="node node-security">
              <div class="node-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              </div>
              <div class="node-copy"><strong>Security</strong><span>All zones secured</span></div>
            </div>
            <div class="node node-audio">
              <div class="node-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M18 6a8 8 0 0 1 0 12"/></svg>
              </div>
              <div class="node-copy"><strong>Audio</strong><span>4 rooms grouped</span></div>
            </div>
            <div class="node node-energy">
              <div class="node-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h9l-1 8 10-12h-9z"/></svg>
              </div>
              <div class="node-copy"><strong>Energy</strong><span>18% below average</span></div>
            </div>

            <div class="command-stage" aria-hidden="true">
              <span class="command-stage-line"></span>
              <span class="command-stage-scan"></span>
            </div>

            <div class="command-card">
              <div class="voice-orb">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></svg>
              </div>
              <div class="command-copy">
                <span class="command-label">NEXUS understood</span>
                <span class="command-text" id="command-text">“Set the house for movie night.”</span>
              </div>
              <span class="command-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
              <span class="command-status">Running locally</span>
            </div>

            <div class="privacy-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
              No data leaves this device
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="metrics">
      <div class="container">
        <div class="metrics-grid reveal" aria-label="NEXUS platform statistics">
          <article class="metric metric-users">
            <div class="metric-top">
              <span class="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
              <span class="metric-chip"><i></i>Live network</span>
            </div>
            <strong data-count="500" data-suffix="K+">500K+</strong>
            <span class="metric-title">Active users</span>
            <p class="metric-copy">Private NEXUS environments running across homes and workspaces.</p>
            <span class="metric-visual metric-activity" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
          </article>

          <article class="metric metric-devices">
            <div class="metric-top">
              <span class="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg></span>
              <span class="metric-chip"><i></i>Synced</span>
            </div>
            <strong data-count="2000" data-suffix="+">2,000+</strong>
            <span class="metric-title">Supported devices</span>
            <p class="metric-copy">One intelligence layer across leading standards and ecosystems.</p>
            <span class="metric-visual metric-device-cloud" aria-hidden="true"><b><svg viewBox="0 0 24 24"><path fill="currentColor" d="M11.996 22.5c-2.478 0-4.63-.846-6.195-2.435L9.67 16.19c.642.593 1.455.908 2.326.908.87 0 1.684-.315 2.326-.908l3.869 3.875c-1.565 1.589-3.717 2.435-6.195 2.435zm6.544-3.151-3.873-3.878c.846-1.077 1.258-2.316 1.139-3.52l5.441-1.096c.21 2.923-.923 5.76-2.707 8.494zm-13.088 0c-1.784-2.734-2.917-5.571-2.707-8.494l5.441 1.096c-.12 1.204.293 2.443 1.139 3.52l-3.873 3.878zM5.539 7.64c2.257-2.617 5.485-3.865 8.784-3.324l-1.019 5.448c-1.127-.145-2.22.185-3.078.9l-4.687-3.024zm12.922 0-4.687 3.024c-.858-.715-1.951-1.045-3.078-.9l-1.019-5.448c3.299-.541 6.527.707 8.784 3.324z"/></svg>Matter</b><b><svg viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.79 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.34 4.5-3.74 4.25Z"/></svg>HomeKit</b><b><svg viewBox="0 0 165 165"><path fill="currentColor" d="M82.498,0C37.008,0,0,37.008,0,82.496c0,45.181,36.51,81.977,81.573,82.476V82.569l-27.002-0.002c-8.023,0-14.554,6.53-14.554,14.561c0,8.023,6.531,14.551,14.554,14.551v17.98c-17.939,0-32.534-14.595-32.534-32.531c0-17.944,14.595-32.543,32.534-32.543l27.002,0.004v-9.096c0-14.932,12.146-27.08,27.075-27.08c14.932,0,27.082,12.148,27.082,27.08c0,14.931-12.15,27.08-27.082,27.08l-9.097-0.001v80.641C136.889,155.333,165,122.14,165,82.496C165,37.008,127.99,0,82.498,0z"/><path fill="currentColor" d="M117.748,55.493c0-5.016-4.082-9.098-9.1-9.098c-5.015,0-9.097,4.082-9.097,9.098v9.097l9.097,0.001C113.666,64.591,117.748,60.51,117.748,55.493z"/></svg>Thread</b><b><svg viewBox="0 0 24 24"><path fill="currentColor" d="M11.988 0a11.85 11.85 0 00-8.617 3.696c7.02-.875 11.401-.583 13.289-.34 3.752.583 3.558 3.404 3.558 3.404L8.237 19.112c2.299.22 6.897.366 13.796-.631a11.86 11.86 0 001.912-6.469C23.945 5.374 18.595 0 11.988 0zm.232 4.31c-2.451-.014-5.772.146-9.963.723C.854 7.003.055 9.41.055 12.012.055 18.626 5.38 24 11.988 24c3.63 0 6.85-1.63 9.053-4.182-7.286.948-11.813.631-13.75.388-3.775-.56-3.557-3.404-3.557-3.404L15.691 4.474a38.635 38.635 0 00-3.471-.163Z"/></svg>Zigbee</b></span>
          </article>

          <article class="metric metric-private">
            <div class="metric-top">
              <span class="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg></span>
              <span class="metric-chip"><i></i>Local only</span>
            </div>
            <strong data-count="100" data-suffix="%">100%</strong>
            <span class="metric-title">On-device privacy</span>
            <p class="metric-copy">Commands, routines, and context stay encrypted on your hardware.</p>
            <span class="metric-visual metric-privacy-rail" aria-hidden="true"></span>
          </article>

          <article class="metric metric-rating-card">
            <div class="metric-top">
              <span class="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2Z"/></svg></span>
              <span class="metric-chip"><i></i>Verified</span>
            </div>
            <strong data-count="4.9" data-suffix="★">4.9★</strong>
            <span class="metric-title">Average rating</span>
            <p class="metric-copy">Consistently rated for speed, calm design, and reliability.</p>
            <span class="metric-visual metric-rating" aria-hidden="true"><span>★★★★★</span><small>12.8K reviews</small></span>
          </article>
        </div>
      </div>
    </div>

    <section class="section" id="features">
      <div class="container manifesto-grid">
        <div class="manifesto-sticky reveal">
          <span class="section-kicker">Designed differently</span>
          <h2 class="section-heading">A calmer way to run your connected life.</h2>
          <p class="section-copy">NEXUS replaces scattered apps, fragile cloud routines, and repetitive controls with one private intelligence layer built around you.</p>
        </div>

        <div class="principles">
          <article class="principle reveal">
            <span class="principle-index">01 / PRIVATE</span>
            <div class="principle-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
            </div>
            <h3>Everything stays home.</h3>
            <p>Your data, commands, routines, and history are processed locally. No cloud profiling. No behavioral tracking.</p>
          </article>
          <article class="principle reveal">
            <span class="principle-index">02 / NATURAL</span>
            <div class="principle-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3"/></svg>
            </div>
            <h3>Speak like a person.</h3>
            <p>Ask for outcomes, not settings. NEXUS understands context, rooms, people, devices, and the way your household works.</p>
          </article>
          <article class="principle reveal">
            <span class="principle-index">03 / UNIVERSAL</span>
            <div class="principle-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.83 2.83-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-4v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06-2.83-2.83.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3v-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06L7.04 4.3l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3h4v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06 2.83 2.83-.06.06A1.65 1.65 0 0 0 19.4 9c.12.36.18.73.18 1H21v4h-1.42c0 .35-.06.69-.18 1z"/></svg>
            </div>
            <h3>One layer, every device.</h3>
            <p>Matter, Zigbee, Z-Wave, Wi-Fi, HomeKit, and hundreds of APIs work together without locking you into one vendor.</p>
          </article>
          <article class="principle reveal">
            <span class="principle-index">04 / RESILIENT</span>
            <div class="principle-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>
            </div>
            <h3>Fast even when the internet is not.</h3>
            <p>Local execution means instant response and reliable automations, including when your connection disappears.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section capabilities" id="capabilities">
      <div class="container">
        <div class="section-head center reveal">
          <span class="section-kicker">Capabilities</span>
          <h2 class="section-heading">Powerful underneath.<br>Effortless on the surface.</h2>
          <p class="section-copy">Advanced intelligence disappears into simple moments: a sentence, a routine, a room that already knows what you need.</p>
        </div>

        <div class="bento">
          <article class="feature-card large reveal nexus-ai-card">
            <div class="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></svg>
            </div>
            <h3>Meet NEXUS AI</h3>
            <p>Your private voice assistant understands intent, coordinates devices, and completes multi-step requests without sending your voice to the cloud.</p>
            <div class="nexus-ai-console" aria-label="NEXUS AI voice assistant preview">
              <div class="nexus-ai-head">
                <span class="nexus-ai-avatar" aria-hidden="true">${renderLogoSvg("nxlogo-aiav", "nxsheen-aiav")}</span>
                <span class="nexus-ai-identity"><strong>NEXUS AI</strong><small><i></i> Listening locally</small></span>
                <span class="nexus-ai-mode">PRIVATE CORE</span>
              </div>
              <div class="nexus-ai-query">
                <span class="nexus-ai-mic" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg></span>
                <div><small>YOU SAID</small><strong>“Lock the doors, dim the lights, and start Focus.”</strong></div>
              </div>
              <div class="nexus-ai-wave" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>

            </div>
          </article>

          <article class="feature-card tall reveal">
            <div class="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3>Private by design</h3>
            <p>Every command is processed on your hardware. You can inspect what happened and why.</p>
            <div class="privacy-visual">
              <div class="data-row">
                <div class="mini-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4zM9 9h6v6H9z"/></svg></div>
                <div><strong>NEXUS AI intent</strong><small>Processed locally in 42 ms</small></div><span class="local-badge">LOCAL</span>
              </div>
              <div class="data-row">
                <div class="mini-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 12h8M12 8v8"/><circle cx="12" cy="12" r="9"/></svg></div>
                <div><strong>Device actions</strong><small>5 actions completed</small></div><span class="local-badge">LOCAL</span>
              </div>
              <div class="data-row">
                <div class="mini-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l3 3v17H6z"/><path d="M14 2v4h4"/></svg></div>
                <div><strong>Activity history</strong><small>Encrypted on device</small></div><span class="local-badge">PRIVATE</span>
              </div>
            </div>
          </article>

          <article class="feature-card third reveal">
            <div class="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>
            </div>
            <h3>Unified standards</h3>
            <p>Connect the ecosystems you already own.</p>
            <div class="protocol-console" aria-label="Supported smart-home standards">
              <div class="protocol-console-head">
                <div class="protocol-core" aria-hidden="true">${renderLogoSvg("nxlogo-pcore", "nxsheen-pcore")}</div>
                <div class="protocol-console-title">
                  <strong>Universal device fabric</strong>
                  <small>Auto-discovered · encrypted · local</small>
                </div>
                <span class="protocol-live"><i></i> 6 online</span>
              </div>

              <div class="protocol-grid">
                <div class="protocol-tile" style="--protocol-color:#f5f7ff">
                  <span class="protocol-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M11.996 22.5c-2.478 0-4.63-.846-6.195-2.435L9.67 16.19c.642.593 1.455.908 2.326.908.87 0 1.684-.315 2.326-.908l3.869 3.875c-1.565 1.589-3.717 2.435-6.195 2.435zm6.544-3.151-3.873-3.878c.846-1.077 1.258-2.316 1.139-3.52l5.441-1.096c.21 2.923-.923 5.76-2.707 8.494zm-13.088 0c-1.784-2.734-2.917-5.571-2.707-8.494l5.441 1.096c-.12 1.204.293 2.443 1.139 3.52l-3.873 3.878zM5.539 7.64c2.257-2.617 5.485-3.865 8.784-3.324l-1.019 5.448c-1.127-.145-2.22.185-3.078.9l-4.687-3.024zm12.922 0-4.687 3.024c-.858-.715-1.951-1.045-3.078-.9l-1.019-5.448c3.299-.541 6.527.707 8.784 3.324z"/></svg>
                  </span>
                  <span class="protocol-name"><strong>Matter</strong><small>Universal layer</small></span>
                  <span class="protocol-state"></span>
                </div>

                <div class="protocol-tile" style="--protocol-color:#f5f5f7">
                  <span class="protocol-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.79 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.34 4.5-3.74 4.25Z"/></svg>
                  </span>
                  <span class="protocol-name"><strong>HomeKit</strong><small>Apple ecosystem</small></span>
                  <span class="protocol-state"></span>
                </div>

                <div class="protocol-tile" style="--protocol-color:#ff7a3d">
                  <span class="protocol-mark" aria-hidden="true">
                    <svg viewBox="0 0 165 165"><path fill="currentColor" d="M82.498,0C37.008,0,0,37.008,0,82.496c0,45.181,36.51,81.977,81.573,82.476V82.569l-27.002-0.002c-8.023,0-14.554,6.53-14.554,14.561c0,8.023,6.531,14.551,14.554,14.551v17.98c-17.939,0-32.534-14.595-32.534-32.531c0-17.944,14.595-32.543,32.534-32.543l27.002,0.004v-9.096c0-14.932,12.146-27.08,27.075-27.08c14.932,0,27.082,12.148,27.082,27.08c0,14.931-12.15,27.08-27.082,27.08l-9.097-0.001v80.641C136.889,155.333,165,122.14,165,82.496C165,37.008,127.99,0,82.498,0z"/><path fill="currentColor" d="M117.748,55.493c0-5.016-4.082-9.098-9.1-9.098c-5.015,0-9.097,4.082-9.097,9.097v9.097l9.097,0.001C113.666,64.591,117.748,60.51,117.748,55.493z"/></svg>
                  </span>
                  <span class="protocol-name"><strong>Thread</strong><small>Mesh network</small></span>
                  <span class="protocol-state protocol-live"><i></i>Live</span>
                </div>

                <div class="protocol-tile" style="--protocol-color:#fb923c">
                  <span class="protocol-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M11.988 0a11.85 11.85 0 00-8.617 3.696c7.02-.875 11.401-.583 13.289-.34 3.752.583 3.558 3.404 3.558 3.404L8.237 19.112c2.299.22 6.897.366 13.796-.631a11.86 11.86 0 001.912-6.469C23.945 5.374 18.595 0 11.988 0zm.232 4.31c-2.451-.014-5.772.146-9.963.723C.854 7.003.055 9.41.055 12.012.055 18.626 5.38 24 11.988 24c3.63 0 6.85-1.63 9.053-4.182-7.286.948-11.813.631-13.75.388-3.775-.56-3.557-3.404-3.557-3.404L15.691 4.474a38.635 38.635 0 00-3.471-.163Z"/></svg>
                  </span>
                  <span class="protocol-name"><strong>Zigbee</strong><small>Device mesh</small></span>
                  <span class="protocol-state"></span>
                </div>

                <div class="protocol-tile" style="--protocol-color:#39b9f3">
                  <span class="protocol-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M3 9a14 14 0 0 1 18 0M6 12.5a9 9 0 0 1 12 0M9.5 16a4 4 0 0 1 5 0"/><circle cx="12" cy="19" r="1"/></svg>
                  </span>
                  <span class="protocol-name"><strong>Wi-Fi</strong><small>IP devices</small></span>
                  <span class="protocol-state"></span>
                </div>

                <div class="protocol-tile" style="--protocol-color:#6aa7ff">
                  <span class="protocol-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M3 13c3.2-5 6.1-5 9 0s5.8 5 9 0M3 8c3.2-5 6.1-5 9 0s5.8 5 9 0"/></svg>
                  </span>
                  <span class="protocol-name"><strong>Z-Wave</strong><small>Secure sub-GHz</small></span>
                  <span class="protocol-state"></span>
                </div>
              </div>

              <div class="protocol-console-foot">
                <span><i></i> NEXUS graph synchronized</span>
                <svg viewBox="0 0 140 24" preserveAspectRatio="none" aria-hidden="true"><path d="M1 17C17 17 19 8 34 11s19 8 32 1 20-9 33-2 23 6 40-5"/></svg>
              </div>
            </div>
          </article>

          <article class="feature-card third reveal automation-card">
            <div class="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M3 6h1M14 12h7M3 12h7M10 18h11M3 18h3"/></svg>
            </div>
            <h3>Invisible automation</h3>
            <p>NEXUS AI combines presence, time, device state, and intent into routines that feel natural instead of programmed.</p>
            <div class="automation-console" aria-label="NEXUS AI automation preview">
              <div class="automation-head"><span>ROUTINE / ARRIVAL</span><b><i></i> ACTIVE</b></div>
              <div class="automation-trigger">
                <span class="automation-trigger-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg></span>
                <span><small>WHEN</small><strong>Home arrival detected</strong></span>
                <em>18:42</em>
              </div>
              <div class="automation-context"><span>After sunset</span><span>Home occupied</span><span>Phone nearby</span></div>
              <div class="automation-logic">
                <div class="logic-node"><i>01</i><span><small>TRIGGER</small><strong>Presence verified</strong></span></div>
                <span class="logic-link"><i></i></span>
                <div class="logic-node logic-ai"><i>${renderLogoSvg("nxlogo-ctx", "nxsheen-ctx")}</i><span><small>NEXUS AI</small><strong>Context resolved</strong></span></div>
                <span class="logic-link"><i></i></span>
                <div class="logic-node"><i>03</i><span><small>ACTION</small><strong>Scene activated</strong></span></div>
              </div>
              <div class="automation-actions">
                <span><i></i> Hall lights <b>42%</b></span>
                <span><i></i> Climate <b>22°</b></span>
                <span><i></i> Living room audio <b>ON</b></span>
              </div>
              <div class="automation-foot"><span><i></i> Executed on this device</span><b>0 cloud calls</b></div>
            </div>
          </article>

          <article class="feature-card third reveal response-card">
            <div class="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>
            </div>
            <h3>Instant response</h3>
            <p>NEXUS AI interprets, decides, and acts on your local hardware before a cloud assistant could finish connecting.</p>
            <div class="response-console" aria-label="NEXUS AI local response diagnostics">
              <div class="response-head"><span>LOCAL EXECUTION TRACE</span><b><i></i> LIVE</b></div>
              <div class="response-primary">
                <div class="response-ring"><span><strong>42</strong><small>ms</small></span></div>
                <div class="response-summary"><small>P95 RESPONSE</small><strong>Instant by design</strong><p>No cloud round trip. No waiting for a remote model.</p></div>
              </div>
              <div class="response-route">
                <span><i>01</i><small>VOICE</small></span><b>→</b>
                <span class="route-ai"><i>${renderLogoSvg("nxlogo-route", "nxsheen-route")}</i><small>NEXUS AI</small></span><b>→</b>
                <span><i>03</i><small>DEVICES</small></span>
              </div>
              <div class="response-metrics">
                <span><small>Intent</small><strong>12 ms</strong></span>
                <span><small>Reasoning</small><strong>18 ms</strong></span>
                <span><small>Action</small><strong>12 ms</strong></span>
              </div>
              <div class="response-chart">
                <span>LAST 30 REQUESTS</span><b>99.98% success</b>
                <svg viewBox="0 0 300 54" preserveAspectRatio="none" aria-hidden="true"><path class="response-grid-line" d="M0 42H300M0 24H300M0 6H300"/><path class="response-area" d="M0 46 C28 45 35 40 58 41 S91 49 111 31 143 34 161 28 192 42 214 23 248 31 300 10 L300 54H0Z"/><path class="response-path" d="M0 46 C28 45 35 40 58 41 S91 49 111 31 143 34 161 28 192 42 214 23 248 31 300 10"/></svg>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="section" id="how">
      <div class="container">
        <div class="section-head reveal">
          <span class="section-kicker">How it works</span>
          <h2 class="section-heading">From download to connected in minutes.</h2>
          <p class="section-copy">NEXUS discovers your environment, keeps setup local, and guides you through each connection without technical friction.</p>
        </div>
        <div class="flow-shell flow-shell-v4 reveal">
          <div class="flow-brand-mark" aria-hidden="true">${renderLogoSvg("nxlogo-fbm", "nxsheen-fbm")}</div>
          <div class="flow-rail" aria-hidden="true"><span></span><span></span><span></span></div>
          <div class="flow">
            <article class="flow-step flow-step-v4">
              <div class="flow-topline"><span class="flow-number">01</span><span class="flow-label">Native setup</span></div>
              <div class="flow-visual flow-visual-download" aria-hidden="true">
                <span class="mini-platform mini-windows"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 5.2 10.8 4v7.2H3V5.2Zm8.8-1.4L21 2.4v8.8h-9.2V3.8ZM3 12.2h7.8V19L3 17.9v-5.7Zm8.8 0H21v9.4l-9.2-1.3v-8.1Z"/></svg></span>
                <span class="mini-platform mini-apple"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M17.1 12.6c0-2.5 2.1-3.7 2.2-3.8-1.2-1.7-3-1.9-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.3-.8-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.5 1.3-.1 1.8-.8 3.4-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.2 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.9-1.1-2.9-4.1ZM14.6 5.2c.7-.9 1.2-2.1 1.1-3.2-1.1.1-2.4.7-3.2 1.6-.7.8-1.3 2-1.1 3.1 1.2.1 2.4-.6 3.2-1.5Z"/></svg></span>
                <span class="mini-platform mini-linux"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c-2.4 0-3.8 2.1-3.8 4.7 0 1.3.4 2.3.1 3.5-.3 1.1-1.6 2.2-2.4 3.5-.9 1.4-1.5 3.1-.8 4.1.5.8 1.6.9 2.6.6.7 1.1 2.2 1.8 4.3 1.8s3.6-.7 4.3-1.8c1 .3 2.1.2 2.6-.6.7-1-.1-2.8-.9-4.1-.8-1.3-2-2.4-2.3-3.5-.3-1.2.1-2.2.1-3.5C15.8 4.1 14.4 2 12 2Zm-1.3 4.3c.5 0 .9.5.9 1.1 0 .6-.4 1.1-.9 1.1s-.9-.5-.9-1.1c0-.6.4-1.1.9-1.1Zm2.6 0c.5 0 .9.5.9 1.1 0 .6-.4 1.1-.9 1.1s-.9-.5-.9-1.1c0-.6.4-1.1.9-1.1ZM12 9c1 0 1.8.5 1.8 1.1 0 .6-.8 1.1-1.8 1.1s-1.8-.5-1.8-1.1C10.2 9.5 11 9 12 9Z"/></svg></span>
                <div class="flow-packet"><span></span><span></span><span></span></div>
              </div>
              <div class="flow-copy-v4"><h3>Install your native core</h3><p>Pick the signed build for your desktop. NEXUS configures the private local runtime automatically.</p></div>
              <div class="flow-meta"><span>≈ 2 minutes</span><span>Signed release</span></div>
            </article>
            <article class="flow-step flow-step-v4">
              <div class="flow-topline"><span class="flow-number">02</span><span class="flow-label">Private discovery</span></div>
              <div class="flow-visual flow-visual-radar" aria-hidden="true">
                <span class="radar-ring radar-ring-a"></span><span class="radar-ring radar-ring-b"></span><span class="radar-ring radar-ring-c"></span>
                <span class="radar-sweep"></span>
                <span class="radar-core">${renderLogoSvg("nxlogo-rcore", "nxsheen-rcore")}</span>
                <i class="radar-dot dot-one"></i><i class="radar-dot dot-two"></i><i class="radar-dot dot-three"></i>
              </div>
              <div class="flow-copy-v4"><h3>Discover without the cloud</h3><p>NEXUS maps compatible devices over your local network and asks before every connection.</p></div>
              <div class="flow-meta"><span>Local-only scan</span><span>Permission based</span></div>
            </article>
            <article class="flow-step flow-step-v4">
              <div class="flow-topline"><span class="flow-number">03</span><span class="flow-label">Unified intelligence</span></div>
              <div class="flow-visual flow-visual-live" aria-hidden="true">
                <div class="live-core">${renderLogoSvg("nxlogo-lcore", "nxsheen-lcore")}</div>
                <span class="live-node live-node-a"><svg viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M8.5 14.5a6 6 0 1 1 7 0c-.9.6-1.5 1.5-1.5 2.5h-4c0-1-.6-1.9-1.5-2.5Z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></span>
                <span class="live-node live-node-b"><svg viewBox="0 0 24 24"><path d="M12 3v9m0 0a5 5 0 1 0 4 2M12 12a5 5 0 0 1 4 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>
                <span class="live-node live-node-c"><svg viewBox="0 0 24 24"><path d="m12 3 8 4v5c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V7l8-4Z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></span>
                <span class="live-path path-a"></span><span class="live-path path-b"></span><span class="live-path path-c"></span>
              </div>
              <div class="flow-copy-v4"><h3>Live through one private layer</h3><p>Speak once, automate routines, and control the whole environment with one consistent interface.</p></div>
              <div class="flow-meta"><span>Voice + routines</span><span>Instant response</span></div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="section-tight" id="integrations">
      <div class="container">
        <div class="section-head center reveal">
          <span class="section-kicker">Integrations</span>
          <h2 class="section-heading">Works with what you already have.</h2>
        </div>
      </div>
      <div class="integrations-wrap reveal">
        <div class="integration-ambient integration-ambient-one" aria-hidden="true"></div>
        <div class="integration-ambient integration-ambient-two" aria-hidden="true"></div>
        <div class="integrations-track" aria-label="Supported integrations">
          <div class="integration-pill" style="--brand:#F5F5F7">
            <span class="integration-logo-wrap">
              ${integrationLogo("apple", "APPLE")}
              <span class="brand-fallback" hidden>APPLE</span>
            </span>
            <span class="integration-name"><strong>Apple Home</strong><small>Native bridge</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#4285F4">
            <span class="integration-logo-wrap">
              ${integrationLogo("googlehome", "GOOGLE")}
              <span class="brand-fallback" hidden>GOOGLE</span>
            </span>
            <span class="integration-name"><strong>Google Home</strong><small>Voice & devices</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#15BFFF">
            <span class="integration-logo-wrap">
              ${integrationLogo("smartthings", "SMARTTHINGS")}
              <span class="brand-fallback" hidden>SMARTTHINGS</span>
            </span>
            <span class="integration-name"><strong>SmartThings</strong><small>Samsung ecosystem</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#41BDF5">
            <span class="integration-logo-wrap">
              ${integrationLogo("homeassistant", "HOME ASSISTANT")}
              <span class="brand-fallback" hidden>HOME ASSISTANT</span>
            </span>
            <span class="integration-name"><strong>Home Assistant</strong><small>Local automation</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#0B78D0">
            <span class="integration-logo-wrap">
              ${integrationLogo("philipshue", "PHILIPS HUE")}
              <span class="brand-fallback" hidden>PHILIPS HUE</span>
            </span>
            <span class="integration-name"><strong>Philips Hue</strong><small>Lighting & scenes</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#F5F5F5">
            <span class="integration-logo-wrap">
              ${integrationLogo("sonos", "SONOS")}
              <span class="brand-fallback" hidden>SONOS</span>
            </span>
            <span class="integration-name"><strong>Sonos</strong><small>Whole-home audio</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#0058A3">
            <span class="integration-logo-wrap">
              ${integrationLogo("ikea", "IKEA")}
              <span class="brand-fallback" hidden>IKEA</span>
            </span>
            <span class="integration-name"><strong>IKEA Home smart</strong><small>Lights & sensors</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#EB0443">
            <span class="integration-logo-wrap">
              ${integrationLogo("zigbee", "ZIGBEE")}
              <span class="brand-fallback" hidden>ZIGBEE</span>
            </span>
            <span class="integration-name"><strong>Zigbee</strong><small>Low-power mesh</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#F5F5F5">
            <span class="integration-logo-wrap">
              ${integrationLogo("bose", "BOSE")}
              <span class="brand-fallback" hidden>BOSE</span>
            </span>
            <span class="integration-name"><strong>Bose</strong><small>Premium audio</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#FF6900">
            <span class="integration-logo-wrap">
              ${integrationLogo("xiaomi", "XIAOMI")}
              <span class="brand-fallback" hidden>XIAOMI</span>
            </span>
            <span class="integration-name"><strong>Xiaomi</strong><small>Smart devices</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#F5F5F7">
            <span class="integration-logo-wrap">
              ${integrationLogo("apple", "APPLE")}
              <span class="brand-fallback" hidden>APPLE</span>
            </span>
            <span class="integration-name"><strong>Apple Home</strong><small>Native bridge</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#4285F4">
            <span class="integration-logo-wrap">
              ${integrationLogo("googlehome", "GOOGLE")}
              <span class="brand-fallback" hidden>GOOGLE</span>
            </span>
            <span class="integration-name"><strong>Google Home</strong><small>Voice & devices</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#15BFFF">
            <span class="integration-logo-wrap">
              ${integrationLogo("smartthings", "SMARTTHINGS")}
              <span class="brand-fallback" hidden>SMARTTHINGS</span>
            </span>
            <span class="integration-name"><strong>SmartThings</strong><small>Samsung ecosystem</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#41BDF5">
            <span class="integration-logo-wrap">
              ${integrationLogo("homeassistant", "HOME ASSISTANT")}
              <span class="brand-fallback" hidden>HOME ASSISTANT</span>
            </span>
            <span class="integration-name"><strong>Home Assistant</strong><small>Local automation</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#0B78D0">
            <span class="integration-logo-wrap">
              ${integrationLogo("philipshue", "PHILIPS HUE")}
              <span class="brand-fallback" hidden>PHILIPS HUE</span>
            </span>
            <span class="integration-name"><strong>Philips Hue</strong><small>Lighting & scenes</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#F5F5F5">
            <span class="integration-logo-wrap">
              ${integrationLogo("sonos", "SONOS")}
              <span class="brand-fallback" hidden>SONOS</span>
            </span>
            <span class="integration-name"><strong>Sonos</strong><small>Whole-home audio</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#0058A3">
            <span class="integration-logo-wrap">
              ${integrationLogo("ikea", "IKEA")}
              <span class="brand-fallback" hidden>IKEA</span>
            </span>
            <span class="integration-name"><strong>IKEA Home smart</strong><small>Lights & sensors</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#EB0443">
            <span class="integration-logo-wrap">
              ${integrationLogo("zigbee", "ZIGBEE")}
              <span class="brand-fallback" hidden>ZIGBEE</span>
            </span>
            <span class="integration-name"><strong>Zigbee</strong><small>Low-power mesh</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#F5F5F5">
            <span class="integration-logo-wrap">
              ${integrationLogo("bose", "BOSE")}
              <span class="brand-fallback" hidden>BOSE</span>
            </span>
            <span class="integration-name"><strong>Bose</strong><small>Premium audio</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#FF6900">
            <span class="integration-logo-wrap">
              ${integrationLogo("xiaomi", "XIAOMI")}
              <span class="brand-fallback" hidden>XIAOMI</span>
            </span>
            <span class="integration-name"><strong>Xiaomi</strong><small>Smart devices</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="pricing">
      <div class="container">
        <div class="section-head center reveal">
          <span class="section-kicker">Pricing</span>
          <h2 class="section-heading">Start free. Expand only when you need to.</h2>
          <p class="section-copy">Core local control stays free. Premium plans add advanced intelligence, remote access, and household tools.</p>
        </div>

        <div class="pricing-grid">
          <article class="price-card price-card-free reveal" data-plan="NX / CORE-01">
            <div class="plan-glow" aria-hidden="true"></div>
            <span class="plan-code">NX / CORE-01</span>
            <div class="plan-head">
              <span class="plan-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
              </span>
              <div><span class="plan-overline">Local essentials</span><h3>Free</h3></div>
              <span class="plan-badge">Forever</span>
            </div>
            <p class="plan-description">Everything you need to build a fast, private smart home around one local core.</p>
            <div class="plan-price-row">
              <div class="price"><sup>$</sup>0<span>/ month</span></div>
              <span class="price-note">No card required</span>
            </div>
            <div class="plan-console" aria-label="Free plan capacity">
              <div class="plan-console-head"><span>Local core capacity</span><strong>05 devices</strong></div>
              <div class="plan-console-track"><i style="--capacity: 42%"></i><b></b><b></b><b></b><b></b><b></b></div>
              <div class="plan-console-meta"><span>On-device voice</span><span>Community channel</span></div>
            </div>
            <div class="plan-divider"><span></span></div>
            <span class="feature-label">Included in Free</span>
            <ul class="feature-list">
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Up to 5 devices connected</li>
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Basic voice commands and routines</li>
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>100% local processing</li>
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Community support</li>
            </ul>
            <a class="button button-secondary" href="#downloads">Start for free</a>
            <div class="plan-foot"><span class="status-dot"></span>Runs fully on your hardware</div>
          </article>

          <article class="price-card price-card-premium featured reveal" data-plan="NX / NEURAL-02">
            <div class="plan-glow" aria-hidden="true"></div>
            <span class="plan-code">NX / NEURAL-02</span>
            <div class="premium-orbit" aria-hidden="true"><i></i><i></i><i></i></div>
            <div class="plan-head">
              <span class="plan-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>
              </span>
              <div><span class="plan-overline">Adaptive intelligence</span><h3>Premium</h3></div>
              <span class="plan-badge popular">Most popular</span>
            </div>
            <p class="plan-description">Advanced AI, secure remote access, and automations that continuously adapt to your routines.</p>
            <div class="plan-price-row">
              <div class="price"><sup>$</sup>5<span>/ month</span></div>
              <span class="price-note">Cancel anytime</span>
            </div>
            <div class="plan-console plan-console-premium" aria-label="Premium plan capacity">
              <div class="plan-console-head"><span>Adaptive core capacity</span><strong>Unlimited</strong></div>
              <div class="plan-console-track"><i style="--capacity: 94%"></i><b></b><b></b><b></b><b></b><b></b></div>
              <div class="plan-console-meta"><span>Adaptive routines</span><span>Priority response</span></div>
            </div>
            <div class="plan-divider"><span></span></div>
            <span class="feature-label">Everything in Free, plus</span>
            <ul class="feature-list">
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Unlimited connected devices</li>
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Advanced AI routines and automation</li>
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Multi-room audio and scenes</li>
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Priority 24/7 support</li>
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Secure remote access</li>
            </ul>
            <a class="button button-primary" href="#downloads">Start for free</a>
            <div class="plan-foot"><span class="status-dot"></span>Best balance of power and privacy</div>
          </article>

          <article class="price-card price-card-family reveal" data-plan="NX / HOUSE-03">
            <div class="plan-glow" aria-hidden="true"></div>
            <span class="plan-code">NX / HOUSE-03</span>
            <div class="plan-head">
              <span class="plan-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </span>
              <div><span class="plan-overline">Shared household</span><h3>Family</h3></div>
              <span class="plan-badge">6 profiles</span>
            </div>
            <p class="plan-description">A shared intelligence layer with individual access, preferences, safety, and control for everyone.</p>
            <div class="plan-price-row">
              <div class="price"><sup>$</sup>10<span>/ month</span></div>
              <span class="price-note">One household</span>
            </div>
            <div class="plan-console plan-console-family" aria-label="Family plan capacity">
              <div class="plan-console-head"><span>Household identity mesh</span><strong>06 profiles</strong></div>
              <div class="plan-console-track"><i style="--capacity: 72%"></i><b></b><b></b><b></b><b></b><b></b></div>
              <div class="plan-console-meta"><span>Private preferences</span><span>Managed access</span></div>
            </div>
            <div class="plan-divider"><span></span></div>
            <span class="feature-label">Everything in Premium, plus</span>
            <ul class="feature-list">
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Everything in Premium</li>
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Up to 6 family profiles</li>
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Granular parental controls</li>
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Dedicated family dashboard</li>
            </ul>
            <a class="button button-secondary" href="#downloads">Start for free</a>
            <div class="plan-foot"><span class="status-dot"></span>Private profiles, one local core</div>
          </article>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head reveal">
          <span class="section-kicker">Apps</span>
          <h2 class="section-heading">Tüm cihazlarınızda yerel.</h2>
          <p class="section-copy">İster masaüstünde ister mobilde, NEXUS deneyimi kullandığınız platforma özel olarak uyarlandı. Uygulamalar cihazınızla tam uyumlu çalışır.</p>
        </div>

        <div class="downloads-grid" id="downloads">
          <article class="download-card download-android reveal recommended" data-platform="android">
            <div class="download-card-grid" aria-hidden="true"></div>
            <div class="platform-watermark" aria-hidden="true"><svg class="os-logo os-logo-android" viewBox="0 0 24 24"><path fill="currentColor" d="M6.2 9.1h11.6v6.7a1.9 1.9 0 0 1-1.9 1.9H8.1a1.9 1.9 0 0 1-1.9-1.9V9.1Zm-2.8.1a1.4 1.4 0 0 1 2.8 0v4.2a1.4 1.4 0 0 1-2.8 0V9.2Zm14.4 0a1.4 1.4 0 0 1 2.8 0v4.2a1.4 1.4 0 0 1-2.8 0V9.2ZM7.5 8.1C8 6.2 9.8 4.8 12 4.8s4 1.4 4.5 3.3l1.5-1.9a.4.4 0 1 0-.6-.5l-1.7 2.1A6.6 6.6 0 0 0 12.4 7V5.7a.4.4 0 1 0-.8 0V7c-1.1.1-2.1.4-3 .9L6.6 5.8a.4.4 0 1 0-.6.5l1.5 1.8Z"/></svg></div>
            <div class="platform-top">
              <div class="platform-icon platform-icon-android">
                <svg class="os-logo os-logo-android" viewBox="0 0 24 24" aria-label="Android logo" role="img"><path fill="currentColor" d="M6.2 9.1h11.6v6.7a1.9 1.9 0 0 1-1.9 1.9H8.1a1.9 1.9 0 0 1-1.9-1.9V9.1Zm-2.8.1a1.4 1.4 0 0 1 2.8 0v4.2a1.4 1.4 0 0 1-2.8 0V9.2Zm14.4 0a1.4 1.4 0 0 1 2.8 0v4.2a1.4 1.4 0 0 1-2.8 0V9.2ZM7.5 8.1C8 6.2 9.8 4.8 12 4.8s4 1.4 4.5 3.3l1.5-1.9a.4.4 0 1 0-.6-.5l-1.7 2.1A6.6 6.6 0 0 0 12.4 7V5.7a.4.4 0 1 0-.8 0V7c-1.1.1-2.1.4-3 .9L6.6 5.8a.4.4 0 1 0-.6.5l1.5 1.8Z"/></svg>
              </div>
              <span class="platform-kicker">Android phone and tablet</span>
            </div>
            <h3>Android</h3>
            <p>Install from Google Play, or download the APK directly and verify its checksum.</p>
            <span class="version">${dyn.androidVersion}</span>
            <div class="platform-specs"><span>Local control</span><span>Works offline</span><span>No hub required</span></div>
            <a class="button button-primary download-button" href="${dyn.playHref}" rel="noopener">Get it on Google Play</a>
            <a class="apk-link" href="${dyn.apkHref}" download>Download APK</a>
          </article>

          <article class="download-card download-ios reveal" data-platform="ios">
            <div class="download-card-grid" aria-hidden="true"></div>
            <div class="platform-watermark" aria-hidden="true"><svg class="os-logo os-logo-apple" viewBox="0 0 384 512"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-72.5-19.7-30.5.5-58.3 17.8-74 45.8-31.5 54.6-8 135.1 22.6 179.5 15.3 22.2 33.6 47.1 57.6 46.2 23-.9 31.7-14.8 59.5-14.8 27.8 0 35.6 14.8 59.9 14.8 24.7-.4 40.4-22.6 55.7-44.8 17.7-25.8 25-50.8 25.5-52.1-.6-.3-48.9-18.8-49.1-74.2zM260.4 117.1c12.8-15.3 21.6-36.5 19.1-57.6-18.4.7-40.8 12.9-53.7 28.2-11.6 13.4-21.7 34.9-18.8 55.4 20.5 1.6 40.6-10.4 53.4-26z"/></svg></div>
            <div class="platform-top">
              <div class="platform-icon platform-icon-macos">
                <svg class="os-logo os-logo-apple" viewBox="0 0 384 512" aria-label="Apple logo" role="img"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-72.5-19.7-30.5.5-58.3 17.8-74 45.8-31.5 54.6-8 135.1 22.6 179.5 15.3 22.2 33.6 47.1 57.6 46.2 23-.9 31.7-14.8 59.5-14.8 27.8 0 35.6 14.8 59.9 14.8 24.7-.4 40.4-22.6 55.7-44.8 17.7-25.8 25-50.8 25.5-52.1-.6-.3-48.9-18.8-49.1-74.2zM260.4 117.1c12.8-15.3 21.6-36.5 19.1-57.6-18.4.7-40.8 12.9-53.7 28.2-11.6 13.4-21.7 34.9-18.8 55.4 20.5 1.6 40.6-10.4 53.4-26z"/></svg>
              </div>
              <span class="platform-kicker">iPhone and iPad</span>
            </div>
            <h3>iOS</h3>
            <p>The same local-first home, on iPhone and iPad, published on the App Store.</p>
            <span class="version">${dyn.iosVersion}</span>
            <div class="platform-specs"><span>Face ID</span><span>Widgets</span><span>Shortcuts</span></div>
            <a class="button button-secondary download-button" href="${dyn.appStoreHref}" rel="noopener">Download on the App Store</a>
          </article>
        </div>

        <div class="mobile-companion mobile-release reveal" id="mobile-apps">
          <div class="mobile-release-copy">
            <span class="mobile-live-badge"><i></i> Available now</span>
            <h3>NEXUS, now in your pocket.</h3>
            <p>Use the iOS and Android companion apps to talk to your home, approve automations, and check every local action from anywhere.</p>
            <div class="mobile-release-points"><span>End-to-end encrypted</span><span>Face ID / biometrics</span><span>Live household status</span></div>
          </div>
          <div class="mobile-store-stack">
            <!-- Replace the placeholder store URLs with the real listing URLs after publishing. -->
            <a class="store-badge store-badge-live" href="https://apps.apple.com/app/id0000000000" target="_blank" rel="noopener">
              <svg class="store-logo store-logo-inline" viewBox="0 0 384 512" aria-hidden="true"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-72.5-19.7-30.5.5-58.3 17.8-74 45.8-31.5 54.6-8 135.1 22.6 179.5 15.3 22.2 33.6 47.1 57.6 46.2 23-.9 31.7-14.8 59.5-14.8 27.8 0 35.6 14.8 59.9 14.8 24.7-.4 40.4-22.6 55.7-44.8 17.7-25.8 25-50.8 25.5-52.1-.6-.3-48.9-18.8-49.1-74.2zM260.4 117.1c12.8-15.3 21.6-36.5 19.1-57.6-18.4.7-40.8 12.9-53.7 28.2-11.6 13.4-21.7 34.9-18.8 55.4 20.5 1.6 40.6-10.4 53.4-26z"/></svg>
              <span><small>Download on the</small><strong>App Store</strong></span><b>iOS 17+</b>
            </a>
            <a class="store-badge store-badge-live" href="https://play.google.com/store/apps/details?id=com.nexus.mobile" target="_blank" rel="noopener">
              <svg class="store-logo store-logo-inline" viewBox="0 0 48 52" aria-hidden="true"><defs><linearGradient id="gp-v4-a" x1="5" y1="4" x2="28" y2="28"><stop stop-color="#00D1FF"/><stop offset="1" stop-color="#00A5FF"/></linearGradient><linearGradient id="gp-v4-b" x1="6" y1="49" x2="29" y2="27"><stop stop-color="#00F076"/><stop offset="1" stop-color="#00C853"/></linearGradient></defs><path fill="url(#gp-v4-a)" d="M5 4.6c-.6.9-1 2.1-1 3.7v35.4c0 1.5.4 2.8 1 3.7L27.1 26 5 4.6Z"/><path fill="#FFD54F" d="m34.5 18.9-6.9 6.6L5 4.6c1.2-1.2 3.1-1.3 5.3 0l24.2 14.3Z"/><path fill="#FF5252" d="M34.5 33.1 10.3 47.4c-2.2 1.3-4.1 1.2-5.3 0l22.6-20.9 6.9 6.6Z"/><path fill="#FFB300" d="M43 24c1.8 1 1.8 3 0 4l-8.5 5.1-6.9-6.6 6.9-6.6L43 24Z"/></svg>
              <span><small>Get it on</small><strong>Google Play</strong></span><b>Android 12+</b>
            </a>
          </div>
          <div class="mobile-qr-pair">
            <!-- Placeholder QR graphics: replace each SVG with the real store QR when listings are live. -->
            <div class="qr-card"><div class="fake-qr" aria-label="Placeholder App Store QR code">
              <svg viewBox="0 0 29 29" role="img"><rect width="29" height="29" rx="2" fill="#fff"/><g fill="#09090b"><path d="M2 2h7v7H2V2Zm2 2v3h3V4H4ZM20 2h7v7h-7V2Zm2 2v3h3V4h-3ZM2 20h7v7H2v-7Zm2 2v3h3v-3H4Z" fill-rule="evenodd"/><path d="M11 2h2v2h-2zM15 2h3v2h-3zM11 6h4v2h-4zM16 5h2v5h-2zM10 10h3v3h-3zM14 11h2v2h-2zM18 10h3v2h-3zM22 11h5v2h-5zM2 11h2v5H2zM5 12h4v2H5zM6 15h3v3H6zM11 15h2v3h-2zM14 14h5v2h-5zM20 15h2v4h-2zM23 14h4v3h-4zM10 20h3v2h-3zM14 18h2v5h-2zM17 20h3v2h-3zM22 19h5v2h-5zM10 24h4v3h-4zM16 24h2v3h-2zM19 23h3v4h-3zM24 23h3v2h-3z"/></g></svg>
            </div><span>Scan for iPhone</span></div>
            <div class="qr-card"><div class="fake-qr" aria-label="Placeholder Google Play QR code">
              <svg viewBox="0 0 29 29" role="img"><rect width="29" height="29" rx="2" fill="#fff"/><g fill="#09090b"><path d="M2 2h7v7H2V2Zm2 2v3h3V4H4ZM20 2h7v7h-7V2Zm2 2v3h3V4h-3ZM2 20h7v7H2v-7Zm2 2v3h3v-3H4Z" fill-rule="evenodd"/><path d="M11 2h3v2h-3zM16 3h2v4h-2zM10 6h4v3h-4zM18 7h4v2h-4zM24 10h3v3h-3zM2 11h4v2H2zM7 10h2v5H7zM10 11h3v2h-3zM14 10h2v4h-2zM17 12h5v2h-5zM3 15h3v3H3zM9 16h4v2H9zM15 15h3v3h-3zM20 16h2v4h-2zM23 15h4v2h-4zM10 20h2v4h-2zM13 19h4v2h-4zM18 21h4v2h-4zM24 19h3v4h-3zM11 25h4v2h-4zM17 24h2v3h-2zM21 25h6v2h-6z"/></g></svg>
            </div><span>Scan for Android</span></div>
          </div>
        </div>
      </div>
    </section>


    <section class="section-tight community-section">
      <div class="container">
        <div class="section-head center reveal community-intro">
          <span class="section-kicker">Community</span>
          <h2 class="section-heading">Real homes. Different routines. One private system.</h2>
          <p class="section-copy">A continuously moving wall of community stories shows how NEXUS fits into everyday homes, technical setups, and everything between them.</p>
        </div>

        <div class="review-overview reveal" aria-label="Community rating summary">
          <div class="review-score"><strong>4.9</strong><span>/ 5</span></div>
          <div class="review-overview-copy">
            <span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
            <strong>12.8K community ratings</strong>
            <small>Across desktop and mobile NEXUS experiences</small>
          </div>
          <div class="review-avatar-stack" aria-hidden="true">
            <img src="${AVATAR_SJ}" alt="">
            <img src="${AVATAR_DC}" alt="">
            <img src="${AVATAR_ET}" alt="">
            <img src="${AVATAR_MA}" alt="">
            <span>+12K</span>
          </div>
        </div>

        <!-- DEMO CONTENT: Replace names, portraits, and quotes with customer-approved testimonials before production. -->
        <div class="review-wall reveal">
          <div class="review-lane" tabindex="0" aria-label="Animated customer review row 1">
      <div class="review-track">
        <div class="review-set"><article class="review-card" style="--review-accent:#818cf8">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>Windows</span></div>
      <blockquote>NEXUS replaced four separate home apps in one evening. Voice control feels instant, and every routine keeps working even when the internet does not.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_SJ}" alt="Portrait of Sarah Jenkins" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Sarah Jenkins</strong><span>Early adopter · United Kingdom</span></span>
        <span class="review-card-rating">5.0<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#38bdf8">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>macOS</span></div>
      <blockquote>The local response time is the difference. Lights, scenes, and locks react before I finish lowering my hand from the microphone.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_DC}" alt="Portrait of David Chen" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>David Chen</strong><span>Software engineer · Canada</span></span>
        <span class="review-card-rating">5.0<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#8b7bff">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>iOS</span></div>
      <blockquote>I built a morning routine across Matter and Zigbee without touching a config file. It is powerful without feeling technical.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_ET}" alt="Portrait of Emma Thompson" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Emma Thompson</strong><span>Smart-home enthusiast · Australia</span></span>
        <span class="review-card-rating">5.0<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#60a5fa">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>Android</span></div>
      <blockquote>The interface finally makes a complex home feel calm. Every device has context, and the activity history is genuinely useful.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_MA}" alt="Portrait of Mateo Alvarez" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Mateo Alvarez</strong><span>Product designer · Spain</span></span>
        <span class="review-card-rating">4.9<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#a78bfa">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>Linux</span></div>
      <blockquote>Local-first was the reason I tried NEXUS. The fact that it is also the fastest controller I have used was the surprise.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_AR}" alt="Portrait of Aisha Rahman" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Aisha Rahman</strong><span>Privacy advocate · UAE</span></span>
        <span class="review-card-rating">5.0<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article></div>
        <div class="review-set" aria-hidden="true"><article class="review-card" style="--review-accent:#818cf8">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>Windows</span></div>
      <blockquote>NEXUS replaced four separate home apps in one evening. Voice control feels instant, and every routine keeps working even when the internet does not.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_SJ}" alt="" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Sarah Jenkins</strong><span>Early adopter · United Kingdom</span></span>
        <span class="review-card-rating">5.0<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#38bdf8">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>macOS</span></div>
      <blockquote>The local response time is the difference. Lights, scenes, and locks react before I finish lowering my hand from the microphone.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_DC}" alt="" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>David Chen</strong><span>Software engineer · Canada</span></span>
        <span class="review-card-rating">5.0<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#8b7bff">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>iOS</span></div>
      <blockquote>I built a morning routine across Matter and Zigbee without touching a config file. It is powerful without feeling technical.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_ET}" alt="" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Emma Thompson</strong><span>Smart-home enthusiast · Australia</span></span>
        <span class="review-card-rating">5.0<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#60a5fa">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>Android</span></div>
      <blockquote>The interface finally makes a complex home feel calm. Every device has context, and the activity history is genuinely useful.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_MA}" alt="" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Mateo Alvarez</strong><span>Product designer · Spain</span></span>
        <span class="review-card-rating">4.9<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#a78bfa">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>Linux</span></div>
      <blockquote>Local-first was the reason I tried NEXUS. The fact that it is also the fastest controller I have used was the surprise.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_AR}" alt="" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Aisha Rahman</strong><span>Privacy advocate · UAE</span></span>
        <span class="review-card-rating">5.0<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article></div>
      </div>
    </div><div class="review-lane is-reverse" tabindex="0" aria-label="Animated customer review row 2">
      <div class="review-track">
        <div class="review-set"><article class="review-card" style="--review-accent:#818cf8">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>Linux</span></div>
      <blockquote>A spare mini PC became the most reliable part of my smart home. Setup was clean, discovery was accurate, and recovery is effortless.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_NW}" alt="Portrait of Noah Williams" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Noah Williams</strong><span>Home automation builder · USA</span></span>
        <span class="review-card-rating">4.9<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#38bdf8">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>iOS</span></div>
      <blockquote>My family actually uses it because the voice layer is simple. I keep the advanced controls, while everyone else just speaks naturally.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_SM}" alt="Portrait of Sofia Martins" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Sofia Martins</strong><span>Creative director · Portugal</span></span>
        <span class="review-card-rating">5.0<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#8b7bff">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>Windows</span></div>
      <blockquote>Device discovery found almost everything on the first scan. The remaining integrations were connected in minutes, not hours.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_KS}" alt="Portrait of Kenji Sato" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Kenji Sato</strong><span>Systems architect · Japan</span></span>
        <span class="review-card-rating">4.9<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#60a5fa">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>macOS</span></div>
      <blockquote>The audit trail makes automation understandable. I can see what ran, why it ran, and which device responded without sending data away.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_OB}" alt="Portrait of Olivia Brooks" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Olivia Brooks</strong><span>Researcher · Germany</span></span>
        <span class="review-card-rating">5.0<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#a78bfa">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>Android</span></div>
      <blockquote>Remote approvals are exactly what I needed. NEXUS stays local at home, but I can still help the family when I am away.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_LM}" alt="Portrait of Lucas Meyer" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Lucas Meyer</strong><span>Household admin · Netherlands</span></span>
        <span class="review-card-rating">4.9<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article></div>
        <div class="review-set" aria-hidden="true"><article class="review-card" style="--review-accent:#818cf8">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>Linux</span></div>
      <blockquote>A spare mini PC became the most reliable part of my smart home. Setup was clean, discovery was accurate, and recovery is effortless.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_NW}" alt="" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Noah Williams</strong><span>Home automation builder · USA</span></span>
        <span class="review-card-rating">4.9<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#38bdf8">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>iOS</span></div>
      <blockquote>My family actually uses it because the voice layer is simple. I keep the advanced controls, while everyone else just speaks naturally.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_SM}" alt="" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Sofia Martins</strong><span>Creative director · Portugal</span></span>
        <span class="review-card-rating">5.0<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#8b7bff">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>Windows</span></div>
      <blockquote>Device discovery found almost everything on the first scan. The remaining integrations were connected in minutes, not hours.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_KS}" alt="" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Kenji Sato</strong><span>Systems architect · Japan</span></span>
        <span class="review-card-rating">4.9<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#60a5fa">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>macOS</span></div>
      <blockquote>The audit trail makes automation understandable. I can see what ran, why it ran, and which device responded without sending data away.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_OB}" alt="" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Olivia Brooks</strong><span>Researcher · Germany</span></span>
        <span class="review-card-rating">5.0<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article>
<article class="review-card" style="--review-accent:#a78bfa">
      <div class="review-card-top"><span class="review-stars"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span><span class="review-platform"><i></i>Android</span></div>
      <blockquote>Remote approvals are exactly what I needed. NEXUS stays local at home, but I can still help the family when I am away.</blockquote>
      <div class="review-author">
        <span class="review-author-photo"><img src="${AVATAR_LM}" alt="" loading="lazy" decoding="async"></span>
        <span class="review-author-copy"><strong>Lucas Meyer</strong><span>Household admin · Netherlands</span></span>
        <span class="review-card-rating">4.9<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.5 2 4 4.5.7-3.2 3.1.8 4.4L8 11.6l-4.1 2.1.8-4.4-3.2-3.1L6 5.5Z"/></svg></span>
      </div>
    </article></div>
      </div>
    </div>
        </div>
        <div class="review-footnote reveal">Hover or focus the review wall to pause</div>
      </div>
    </section>

    <section class="section" id="faq">
      <div class="container faq-layout">
        <div class="reveal">
          <span class="section-kicker">FAQ</span>
          <h2 class="section-heading">The important questions, answered.</h2>
          <p class="section-copy">NEXUS is built to stay transparent — about pricing, privacy, compatibility, and how your home runs.</p>
        </div>
        <div class="faq-list reveal">
          <div class="faq-card">
            <div class="faq-question">Is NEXUS completely free?</div>
            <div class="faq-answer">Yes. The core operating system and local control features are entirely free. Premium plans add advanced AI, secure remote access, and household management tools.</div>
          </div>
          <div class="faq-card">
            <div class="faq-question">Which devices are supported?</div>
            <div class="faq-answer">NEXUS supports Matter, Zigbee, Z-Wave, Wi-Fi devices, and more than 500 API-based ecosystems.</div>
          </div>
          <div class="faq-card">
            <div class="faq-question">Does it work without a cloud connection?</div>
            <div class="faq-answer">Yes. NEXUS communicates with devices over your local network, so core controls and automations continue working when the internet goes down.</div>
          </div>
          <div class="faq-card">
            <div class="faq-question">How is remote access provided?</div>
            <div class="faq-answer">Premium users can connect through a secure end-to-end encrypted tunnel. You can also use your own VPN configuration.</div>
          </div>
        </div>
      </div>
    </section>

    <section class="cta">
      <div class="container">
        <div class="cta-shell reveal">
          <div class="cta-content">
            <span class="section-kicker">Your home, your rules</span>
            <h2>One system.<br><span class="gradient-text">Entirely yours.</span></h2>
            <p>Download NEXUS and replace fragmented controls with one fast, private intelligence layer.</p>
            <a class="button button-primary" href="#downloads">
              Download NEXUS free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <div class="footer-main">
        <div class="footer-brand">
          <a class="brand" href="/">
            <svg class="brand-logo" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="nxlogo-footer" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#6f9bff"/><stop offset="0.55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/>
                </linearGradient>
                <linearGradient id="nxsheen-footer" x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#ffffff" stop-opacity="0.30"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxlogo-footer)"/>
              <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxsheen-footer)"/>
              <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#ffffff" stroke-opacity="0.22"/>
              <path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>NEXUS</span>
          </a>
          <p>Your voice-first personal home operating system. Completely local, entirely yours.</p>
        </div>
        <div class="footer-column">
          <h3>Platforms</h3>
          <a href="#downloads">Windows</a>
          <a href="#downloads">macOS</a>
          <a href="#downloads">Linux</a>
        </div>
        <div class="footer-column">
          <h3>Company & legal</h3>
          <a href="/about">About us</a>
          <a href="/privacy">Privacy policy</a>
          <a href="/terms">Terms of service</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 NEXUS Technologies Inc.</span>
        <span class="footer-status">All systems operational · Zero cookies</span>
      </div>
    </div>
  </footer>

  <script>
    (function () {
      "use strict";

      var root = document.documentElement;
      var themeToggle = document.getElementById("theme-toggle");
      var navShell = document.getElementById("nav-shell");
      var menuButton = document.getElementById("menu-button");
      var language = document.getElementById("language");
      var languageButton = document.getElementById("language-button");
      var commandText = document.getElementById("command-text");

      if (themeToggle) {
        themeToggle.addEventListener("click", function () {
          var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
          root.setAttribute("data-theme", next);
          localStorage.setItem("nx-theme", next);
        });
      }

      if (menuButton && navShell) {
        menuButton.addEventListener("click", function () {
          var open = navShell.classList.toggle("menu-open");
          menuButton.setAttribute("aria-expanded", String(open));
        });

        navShell.querySelectorAll(".nav-link").forEach(function (link) {
          link.addEventListener("click", function () {
            navShell.classList.remove("menu-open");
            menuButton.setAttribute("aria-expanded", "false");
          });
        });
      }

      if (language && languageButton) {
        languageButton.addEventListener("click", function (event) {
          event.stopPropagation();
          var open = language.classList.toggle("open");
          languageButton.setAttribute("aria-expanded", String(open));
        });
        document.addEventListener("click", function () {
          language.classList.remove("open");
          languageButton.setAttribute("aria-expanded", "false");
        });
      }

      var commands = [
        "“Set the house for movie night.”",
        "“Make downstairs comfortable.”",
        "“Lock up and switch everything off.”",
        "“Start my focus routine.”"
      ];
      var commandIndex = 0;
      if (commandText && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.setInterval(function () {
          commandIndex = (commandIndex + 1) % commands.length;
          commandText.animate(
            [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-5px)" }],
            { duration: 180, easing: "ease", fill: "forwards" }
          ).finished.then(function () {
            commandText.textContent = commands[commandIndex];
            commandText.animate(
              [{ opacity: 0, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }],
              { duration: 220, easing: "ease", fill: "forwards" }
            );
          });
        }, 3400);
      }

      var revealItems = document.querySelectorAll(".reveal");
      if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        var revealObserver = new IntersectionObserver(function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

        revealItems.forEach(function (item) { revealObserver.observe(item); });
      } else {
        revealItems.forEach(function (item) { item.classList.add("visible"); });
      }

      var ua = navigator.userAgent.toLowerCase();
      var platform = ua.indexOf("win") !== -1 ? "windows" :
                     ua.indexOf("mac") !== -1 ? "macos" :
                     ua.indexOf("linux") !== -1 ? "linux" : "";
      if (platform) {
        var recommended = document.querySelector('[data-platform="' + platform + '"]');
        if (recommended) {
          recommended.classList.add("recommended");
          var recommendedButton = recommended.querySelector(".download-button");
          if (recommendedButton) {
            recommendedButton.classList.remove("button-secondary");
            recommendedButton.classList.add("button-primary");
          }
        }
      }

      document.querySelectorAll("details").forEach(function (detail) {
        detail.addEventListener("toggle", function () {
          if (!detail.open) return;
          document.querySelectorAll("details[open]").forEach(function (other) {
            if (other !== detail) other.removeAttribute("open");
          });
        });
      });
    })();
  </script>

  <script>
    (function () {
      document.querySelectorAll(".integration-logo").forEach(function (img) {
        function fail() {
          img.hidden = true;
          var fb = img.nextElementSibling;
          if (fb) fb.hidden = false;
        }
        img.addEventListener("error", fail);
        if (img.complete && img.naturalWidth === 0) fail();
      });
    })();
  </script>
`;
}
