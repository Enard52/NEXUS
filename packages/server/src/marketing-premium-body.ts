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
    '<svg fill="#0058A3" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>IKEA</title><path d="M0 7.2v9.6h24V7.2H0zm12.002 9.12C5.308 16.32.48 14.36.48 12s4.831-4.32 11.522-4.32c6.69 0 11.518 1.96 11.518 4.32s-4.824 4.32-11.518 4.32zm-.225-6.062h4.176v.964c-.103-.047-.203-.047-.306-.047h-1.758v.46h1.689v.732h-1.689v.457h1.758c.103 0 .203 0 .306-.05v.967h-4.176c.052-.101.052-.198.052-.299V10.56c0-.101 0-.198-.052-.302zm-7.076.302v2.881c0 .101 0 .198.052.299H2.4c.052-.101.052-.198.052-.299V10.56c0-.101 0-.198-.052-.299h2.353c-.052.101-.052.198-.052.299zm6.447 2.881c.076.107.158.208.255.299H8.805c0-.101-.1-.306-.21-.467-.11-.161-.705-1.044-.705-1.044v1.212c0 .101 0 .198.052.299H5.778c.052-.101.052-.198.052-.299V10.56c0-.101 0-.198-.052-.299h2.164c-.052.101-.052.198-.052.299v1.259s.691-.88.85-1.085c.12-.154.268-.373.268-.473h2.257c-.155.101-.327.282-.468.45l-.826.984s1.039 1.548 1.177 1.746zm10.546-3.005a.178.178 0 0 0-.175-.178h-.21v.551h.083v-.195h.12l.11.195h.093l-.12-.212a.184.184 0 0 0 .099-.161zm-.189.101h-.114v-.191h.124c.055 0 .093.047.093.101 0 .053-.048.093-.103.09zm-.021-.457h-.031a.444.444 0 0 0-.437.457c0 .007 0 .017-.003.023a.466.466 0 0 0 .482.447.464.464 0 0 0 .458-.47v-.017a.454.454 0 0 0-.469-.44zm0 .823a.372.372 0 0 1-.375-.366v-.027a.357.357 0 0 1 .375-.339c.206 0 .375.165.375.366s-.168.366-.375.366zm-.877-.339c-.038-.101-.093-.198-.065-.299h-3.017c.014.101-.024.198-.062.299l-1.07 2.881a.852.852 0 0 1-.162.299h1.785c-.014-.101.024-.198.058-.299.034-.101.072-.198.072-.198l.021-.054h1.304l.021.05c.048.118.083.198.083.198.041.101.079.198.069.299h2.263a.837.837 0 0 1-.169-.299 690.277 690.277 0 0 0-1.131-2.877zm-2.167 1.893c.155-.42.289-.772.299-.806.028-.074.048-.151.062-.228.017.077.041.154.069.228l.316.806h-.746z"/></svg>',
  ),
  zigbee: svgDataUri(LOCAL_LOGOS.zigbee),
  shelly: svgDataUri(
    '<svg fill="#4495D1" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Shelly</title><path d="M12 0C5.373 0 0 5.373 0 12a12 12 0 0 0 .033.88c1.07-.443 2.495-.679 4.322-.679h5.762c-.167.61-.548 1.087-1.142 1.436-.532.308-1.14.463-1.823.463h-.927c-.89 0-1.663.154-2.32.463-.859.403-1.286 1-1.286 1.789 0 .893.59 1.594 1.774 2.1a7.423 7.423 0 0 0 2.927.581c1.318 0 2.416-.29 3.297-.867 1.024-.664 1.535-1.616 1.535-2.857 0-.854-.325-2.08-.976-3.676-.65-1.597-.975-2.837-.975-3.723 0-2.79 2.305-4.233 6.916-4.324.641-.01 1.337-.005 1.916-.004.593 0 1.144.05 1.66.147A12 12 0 0 0 12 0zm4.758 5.691c-1.206 0-1.809.502-1.809 1.506 0 .514.356 1.665 1.067 3.451.71 1.787 1.064 3.186 1.064 4.198 0 2.166-1.202 3.791-3.607 4.875-1.794.797-3.892 1.197-6.297 1.197-1.268 0-2.442-.114-3.543-.316A12 12 0 0 0 12 24c6.627 0 12-5.373 12-12a12 12 0 0 0-.781-4.256 3.404 3.404 0 0 1-.832.77h-4.371l1.425-2.828a299.94 299.94 0 0 0-2.683.005Z"/></svg>',
  ),
  tasmota: svgDataUri(
    '<svg fill="#1FA3EC" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Tasmota</title><path d="M12 0L0 12l1.371 1.372L12 2.743l10.629 10.629L24 12 12 0zm0 8.463a7.41 7.41 0 0 0-2.64 14.334v-2.133a5.464 5.464 0 0 1 1.671-10.17V24h1.94V10.494a5.464 5.464 0 0 1 1.669 10.171v2.133A7.41 7.41 0 0 0 12 8.463z"/></svg>',
  ),
  wled: svgDataUri(
    '<svg viewBox="0 0 24 24" fill="#F59E0B" xmlns="http://www.w3.org/2000/svg"><title>WLED</title><path d="M3 5h2.5l3.5 11 3-9.5h2l3 9.5 3.5-11H23l-5 14h-2.2L13 8.8l-2.8 10.2H8L3 5z"/><circle cx="5.5" cy="4" r="1.5" fill="#EF4444"/><circle cx="12" cy="4" r="1.5" fill="#10B981"/><circle cx="18.5" cy="4" r="1.5" fill="#3B82F6"/></svg>',
  ),
  esphome: svgDataUri(
    '<svg fill="#18BCF2" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>ESPHome</title><path d="M11.999.311c-.384 0-.769.146-1.06.437l-9.878 9.88C.478 11.21 0 12.364 0 13.189v9c0 .825.675 1.5 1.5 1.5h5.899V8.755a.6.6 0 0 1 .6-.6h8a.6.6 0 0 1 .6.6v2.4a.6.6 0 0 1-.6.6h-5v1.2h5a.6.6 0 0 1 .6.6v2.4a.6.6 0 0 1-.6.6h-5v1.2h5a.6.6 0 0 1 .6.6v2.4a.6.6 0 0 1-.6.6h-5.6a.6.6 0 1 1 0-1.2h5v-1.2h-5a.6.6 0 0 1-.6-.6v-2.4a.6.6 0 0 1 .6-.6h5v-1.2h-5a.6.6 0 0 1-.6-.6v-2.4a.6.6 0 0 1 .6-.6h5v-1.2H8.6v14.334h13.9c.825 0 1.5-.675 1.5-1.5v-9c0-.825-.478-1.978-1.061-2.561l-9.88-9.88A1.5 1.5 0 0 0 12 .311"/></svg>',
  ),
  kasa: svgDataUri(
    '<svg fill="#4ACBD6" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>TP-Link Kasa</title><path d="M12 0c-.5 0-1 .25-1.5.75L7.97 3.28l8.83 8.83c1 1 1.5 2 1.5 3V24h3.3c1.6 0 2.4-.8 2.4-2.4v-8.85c0-1-.5-2-1.5-3l-9-9C13 .25 12.5 0 12 0zM6.9 4.34L2.89 8.37 9.6 15.1c1 1 1.5 2 1.5 3V24h5.7v-8.89c-.03-.83-.6-1.46-1.06-1.94L6.91 4.34zm-5.08 5.1l-.32.31c-1 1-1.5 2-1.5 3v8.85C0 23.2.8 24 2.4 24h7.2v-5.9c-.03-.8-.56-1.42-1.06-1.95Z"/></svg>',
  ),
  yeelight: svgDataUri(
    '<svg fill="#E31B23" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Yeelight</title><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.8 6.5l-2.8 4.2v4.8h-2v-4.8L8.2 8.5h2.4l1.4 2.5 1.4-2.5h2.4z"/></svg>',
  ),
  bose: svgDataUri(
    '<svg fill="#111827" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Bose</title><path d="M5.8 15.2c1.9-2.6 5.6-2.6 7.5 0m-10-4.4c3.5-4.7 9.1-4.7 12.6 0m-14.9-1.7c4.5-6 11.7-6 16.2 0" fill="none" stroke="#F8FAFC" stroke-width="1.4" stroke-linecap="round"/><path d="M5 19h14v1.8H5z" fill="#F8FAFC"/></svg>',
  ),
  xiaomi: svgDataUri(
    '<svg fill="#FF6900" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Xiaomi</title><rect width="24" height="24" rx="6"/><path d="M7 8.5h2.5l2.5 3.3 2.5-3.3H17v7h-2.1v-4.1l-2.4 3.2h-.1l-2.4-3.2v4.1H7z" fill="#fff"/></svg>',
  ),
} as const;

/** Siyah fill kullanan logolar — dark temada beyaz görünmeleri için CSS invert uygulanır */
const DARK_INVERT_BRANDS = new Set<keyof typeof BRAND_LOGOS>(["apple", "sonos"]);

function integrationLogo(key: keyof typeof BRAND_LOGOS, label: string): string {
  const invertAttr = DARK_INVERT_BRANDS.has(key) ? ' data-dark-invert="1"' : "";
  return `<img class="integration-logo" src="${BRAND_LOGOS[key]}" alt="" loading="lazy" decoding="async" data-brand="${label}"${invertAttr} />`;
}

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
  /** e.g. "Version 1.0.0" — shown on the desktop download cards. */
  desktopVersion?: string;
}

/** Public, releases-only repository (the source repository is private). */
export const RELEASES_REPO = "https://github.com/Enard52/nexus-releases";
const RELEASES = `${RELEASES_REPO}/releases/latest/download/`;
const RELEASES_PAGE = `${RELEASES_REPO}/releases/latest`;

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
          <div class="eyebrow"><span class="eyebrow-dot"></span> Windows · macOS · Linux · local network</div>
          <h1>Your home.<span class="hero-gradient-line"><span class="hero-word">One</span> <span class="hero-word">intelligence.</span></span></h1>
          <p class="hero-copy">NEXUS is a smart home assistant that helps you manage your smart home devices.</p>
          <div class="hero-actions">
            <a class="button button-primary" href="#downloads">
              Try NEXUS free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
            <a class="button button-secondary" href="#integrations">
              Supported devices
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          </div>
          <div class="hero-proof">
            <span class="proof-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>
              100% local processing
            </span>
            <span class="proof-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>
              No hub or cloud fee
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
              <span class="metric-chip"><i></i>Desktop</span>
            </div>
            <strong data-count="3" data-suffix="">3</strong>
            <span class="metric-title">Desktop platforms</span>
            <p class="metric-copy">Windows, macOS and Linux apps you can download today. Mobile apps are coming soon.</p>
            <span class="metric-visual metric-activity" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
          </article>

          <article class="metric metric-devices">
            <div class="metric-top">
              <span class="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg></span>
              <span class="metric-chip"><i></i>Local API</span>
            </div>
            <strong data-count="7" data-suffix="">7</strong>
            <span class="metric-title">Device ecosystems</span>
            <p class="metric-copy">Philips Hue, Shelly, Tasmota, WLED, ESPHome, TP-Link Kasa and Yeelight.</p>
            <span class="metric-visual metric-device-cloud" aria-hidden="true"><b>Hue</b><b>Shelly</b><b>WLED</b><b>ESPHome</b></span>
          </article>

          <article class="metric metric-private">
            <div class="metric-top">
              <span class="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg></span>
              <span class="metric-chip"><i></i>Local only</span>
            </div>
            <strong data-count="100" data-suffix="%">100%</strong>
            <span class="metric-title">On-device privacy</span>
            <p class="metric-copy">Device commands go straight from the app to your devices. Nothing is routed through our servers.</p>
            <span class="metric-visual metric-privacy-rail" aria-hidden="true"></span>
          </article>

          <article class="metric metric-rating-card">
            <div class="metric-top">
              <span class="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2Z"/></svg></span>
              <span class="metric-chip"><i></i>Free</span>
            </div>
            <strong data-count="0" data-suffix="">0</strong>
            <span class="metric-title">Hub, cloud or account fees</span>
            <p class="metric-copy">Devices are paired and controlled directly on your own network. No paid bridge or subscription is needed.</p>
            <span class="metric-visual metric-privacy-rail" aria-hidden="true"></span>
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
            <p>Hue, Shelly, Tasmota, WLED and ESPHome work side by side through their own local APIs, so you are never locked into one vendor.</p>
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
            <p>Connect the Wi-Fi devices you already own, without a paid hub.</p>
            <div class="protocol-console" aria-label="Supported smart-home standards">
              <div class="protocol-console-head">
                <div class="protocol-core" aria-hidden="true">${renderLogoSvg("nxlogo-pcore", "nxsheen-pcore")}</div>
                <div class="protocol-console-title">
                  <strong>Universal device fabric</strong>
                  <small>Discovered on your network · local</small>
                </div>
                <span class="protocol-live"><i></i> Live · 6 online</span>
              </div>

              <div class="protocol-grid">
                <div class="protocol-tile" style="--protocol-color:#f5b301">
                  <span class="protocol-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.672 9.6c-2.043 0-3.505 1.386-3.682 3.416h-.664c-.247 0-.395.144-.395.384 0 .24.148.384.395.384h.661c.152 2.09 1.652 3.423 3.915 3.423.944 0 1.685-.144 2.332-.453.158-.075.337-.217.292-.471a.334.334 0 0 0-.15-.242c-.104-.065-.25-.072-.422-.02a7.93 7.93 0 0 0-.352.12c-.414.146-.771.273-1.599.273-1.75 0-2.908-1.023-2.952-2.605v-.025h5.444c.313 0 .492-.164.505-.463v-.058C23.994 9.865 21.452 9.6 20.672 9.6zm2.376 3.416h-5l.004-.035c.121-1.58 1.161-2.601 2.649-2.601 1.134 0 2.347.685 2.347 2.606zM9.542 10.221c0-.335-.195-.534-.52-.534s-.52.2-.52.534v2.795h1.04zm4.29 3.817c0 1.324-.948 2.361-2.16 2.361-1.433 0-2.13-.763-2.13-2.333v-.282h-1.04v.34c0 2.046.965 3.083 2.868 3.083 1.12 0 1.943-.486 2.443-1.445l.02-.036v.861c0 .334.193.534.519.534.325 0 .52-.2.52-.534v-2.803h-1.04zm.52-4.351c-.326 0-.52.2-.52.534v2.795h1.04v-2.795c0-.335-.195-.534-.52-.534zM3.645 9.6c-1.66 0-2.31 1.072-2.471 1.4l-.135.278V7.355c0-.347-.199-.562-.52-.562-.32 0-.519.215-.519.562v5.661h1.039v-.015c0-1.249.72-2.592 2.304-2.592 1.29 0 2.001.828 2.001 2.332v.275h1.04v-.246c0-2.044-.973-3.17-2.739-3.17zM0 16.558c0 .347.199.563.52.563.32 0 .519-.216.519-.563v-2.774H0zm5.344 0c0 .347.2.563.52.563s.52-.216.52-.563v-2.774h-1.04z"/></svg>
                  </span>
                  <span class="protocol-name"><strong>Philips Hue</strong><small>Local bridge</small></span>
                  <span class="protocol-state"></span>
                </div>
                <div class="protocol-tile" style="--protocol-color:#3b8fe0">
                  <span class="protocol-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12a12 12 0 0 0 .033.88c1.07-.443 2.495-.679 4.322-.679h5.762c-.167.61-.548 1.087-1.142 1.436-.532.308-1.14.463-1.823.463h-.927c-.89 0-1.663.154-2.32.463-.859.403-1.286 1-1.286 1.789 0 .893.59 1.594 1.774 2.1a7.423 7.423 0 0 0 2.927.581c1.318 0 2.416-.29 3.297-.867 1.024-.664 1.535-1.616 1.535-2.857 0-.854-.325-2.08-.976-3.676-.65-1.597-.975-2.837-.975-3.723 0-2.79 2.305-4.233 6.916-4.324.641-.01 1.337-.005 1.916-.004.593 0 1.144.05 1.66.147A12 12 0 0 0 12 0zm4.758 5.691c-1.206 0-1.809.502-1.809 1.506 0 .514.356 1.665 1.067 3.451.71 1.787 1.064 3.186 1.064 4.198 0 2.166-1.202 3.791-3.607 4.875-1.794.797-3.892 1.197-6.297 1.197-1.268 0-2.442-.114-3.543-.316A12 12 0 0 0 12 24c6.627 0 12-5.373 12-12a12 12 0 0 0-.781-4.256 3.404 3.404 0 0 1-.832.77h-4.371l1.425-2.828a299.94 299.94 0 0 0-2.683.005Z"/></svg>
                  </span>
                  <span class="protocol-name"><strong>Shelly</strong><small>Gen1 · Plus · Pro</small></span>
                  <span class="protocol-state"></span>
                </div>
                <div class="protocol-tile" style="--protocol-color:#1fa3ec">
                  <span class="protocol-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L0 12l1.371 1.372L12 2.743l10.629 10.629L24 12 12 0zm0 8.463a7.41 7.41 0 0 0-2.64 14.334v-2.133a5.464 5.464 0 0 1 1.671-10.17V24h1.94V10.494a5.464 5.464 0 0 1 1.669 10.171v2.133A7.41 7.41 0 0 0 12 8.463z"/></svg>
                  </span>
                  <span class="protocol-name"><strong>Tasmota</strong><small>Open firmware</small></span>
                  <span class="protocol-state"></span>
                </div>
                <div class="protocol-tile" style="--protocol-color:#f59e0b">
                  <span class="protocol-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h2.5l3.5 11 3-9.5h2l3 9.5 3.5-11H23l-5 14h-2.2L13 8.8l-2.8 10.2H8L3 5z"/><circle cx="5.5" cy="4" r="1.5"/><circle cx="12" cy="4" r="1.5"/><circle cx="18.5" cy="4" r="1.5"/></svg>
                  </span>
                  <span class="protocol-name"><strong>WLED</strong><small>LED strips</small></span>
                  <span class="protocol-state"></span>
                </div>
                <div class="protocol-tile" style="--protocol-color:#9ca3af">
                  <span class="protocol-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.999.311c-.384 0-.769.146-1.06.437l-9.878 9.88C.478 11.21 0 12.364 0 13.189v9c0 .825.675 1.5 1.5 1.5h5.899V8.755a.6.6 0 0 1 .6-.6h8a.6.6 0 0 1 .6.6v2.4a.6.6 0 0 1-.6.6h-5v1.2h5a.6.6 0 0 1 .6.6v2.4a.6.6 0 0 1-.6.6h-5v1.2h5a.6.6 0 0 1 .6.6v2.4a.6.6 0 0 1-.6.6h-5.6a.6.6 0 1 1 0-1.2h5v-1.2h-5a.6.6 0 0 1-.6-.6v-2.4a.6.6 0 0 1 .6-.6h5v-1.2h-5a.6.6 0 0 1-.6-.6v-2.4a.6.6 0 0 1 .6-.6h5v-1.2H8.6v14.334h13.9c.825 0 1.5-.675 1.5-1.5v-9c0-.825-.478-1.978-1.061-2.561l-9.88-9.88A1.5 1.5 0 0 0 12 .311"/></svg>
                  </span>
                  <span class="protocol-name"><strong>ESPHome</strong><small>DIY devices</small></span>
                  <span class="protocol-state"></span>
                </div>
                <div class="protocol-tile" style="--protocol-color:#00a79d">
                  <span class="protocol-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-.5 0-1 .25-1.5.75L7.97 3.28l8.83 8.83c1 1 1.5 2 1.5 3V24h3.3c1.6 0 2.4-.8 2.4-2.4v-8.85c0-1-.5-2-1.5-3l-9-9C13 .25 12.5 0 12 0zM6.9 4.34L2.89 8.37 9.6 15.1c1 1 1.5 2 1.5 3V24h5.7v-8.89c-.03-.83-.6-1.46-1.06-1.94L6.91 4.34zm-5.08 5.1l-.32.31c-1 1-1.5 2-1.5 3v8.85C0 23.2.8 24 2.4 24h7.2v-5.9c-.03-.8-.56-1.42-1.06-1.95Z"/></svg>
                  </span>
                  <span class="protocol-name"><strong>Kasa · Yeelight</strong><small>Desktop app</small></span>
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
              <div class="flow-copy-v4"><h3>Install your native core</h3><p>Download the installer for Windows, macOS or Linux. Every release lists SHA-256 checksums you can verify.</p></div>
              <div class="flow-meta"><span>≈ 2 minutes</span><span>Checksums published</span></div>
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
          <p class="section-copy">Paired directly over your local network — no paid hub, cloud account or subscription. Matter and Zigbee connect through your Home Assistant bridge.</p>
        </div>
      </div>
      <div class="integrations-wrap reveal">
        <div class="integration-ambient integration-ambient-one" aria-hidden="true"></div>
        <div class="integration-ambient integration-ambient-two" aria-hidden="true"></div>
        <div class="integrations-track" aria-label="Supported integrations">
          <div class="integration-pill" style="--brand:#F5B301">
            <span class="integration-logo-wrap">
              ${integrationLogo("philipshue", "PHILIPS HUE")}
              <span class="brand-fallback" hidden>PHILIPS HUE</span>
            </span>
            <span class="integration-name"><strong>Philips Hue</strong><small>Bridge · link button</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#2B7FD3">
            <span class="integration-logo-wrap">
              ${integrationLogo("shelly", "SHELLY")}
              <span class="brand-fallback" hidden>SHELLY</span>
            </span>
            <span class="integration-name"><strong>Shelly</strong><small>Gen1 · Plus · Pro</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#1FA3EC">
            <span class="integration-logo-wrap">
              ${integrationLogo("tasmota", "TASMOTA")}
              <span class="brand-fallback" hidden>TASMOTA</span>
            </span>
            <span class="integration-name"><strong>Tasmota</strong><small>Open firmware</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#F59E0B">
            <span class="integration-logo-wrap">
              ${integrationLogo("wled", "WLED")}
              <span class="brand-fallback" hidden>WLED</span>
            </span>
            <span class="integration-name"><strong>WLED</strong><small>LED strips</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#9CA3AF">
            <span class="integration-logo-wrap">
              ${integrationLogo("esphome", "ESPHOME")}
              <span class="brand-fallback" hidden>ESPHOME</span>
            </span>
            <span class="integration-name"><strong>ESPHome</strong><small>DIY devices</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#00A79D">
            <span class="integration-logo-wrap">
              ${integrationLogo("kasa", "TP-LINK KASA")}
              <span class="brand-fallback" hidden>TP-LINK KASA</span>
            </span>
            <span class="integration-name"><strong>TP-Link Kasa</strong><small>Desktop app</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#8FA3BF">
            <span class="integration-logo-wrap">
              ${integrationLogo("yeelight", "YEELIGHT")}
              <span class="brand-fallback" hidden>YEELIGHT</span>
            </span>
            <span class="integration-name"><strong>Yeelight</strong><small>Desktop app · LAN mode</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#F5B301">
            <span class="integration-logo-wrap">
              ${integrationLogo("philipshue", "PHILIPS HUE")}
              <span class="brand-fallback" hidden>PHILIPS HUE</span>
            </span>
            <span class="integration-name"><strong>Philips Hue</strong><small>Bridge · link button</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#2B7FD3">
            <span class="integration-logo-wrap">
              ${integrationLogo("shelly", "SHELLY")}
              <span class="brand-fallback" hidden>SHELLY</span>
            </span>
            <span class="integration-name"><strong>Shelly</strong><small>Gen1 · Plus · Pro</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#1FA3EC">
            <span class="integration-logo-wrap">
              ${integrationLogo("tasmota", "TASMOTA")}
              <span class="brand-fallback" hidden>TASMOTA</span>
            </span>
            <span class="integration-name"><strong>Tasmota</strong><small>Open firmware</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#F59E0B">
            <span class="integration-logo-wrap">
              ${integrationLogo("wled", "WLED")}
              <span class="brand-fallback" hidden>WLED</span>
            </span>
            <span class="integration-name"><strong>WLED</strong><small>LED strips</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#9CA3AF">
            <span class="integration-logo-wrap">
              ${integrationLogo("esphome", "ESPHOME")}
              <span class="brand-fallback" hidden>ESPHOME</span>
            </span>
            <span class="integration-name"><strong>ESPHome</strong><small>DIY devices</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#00A79D">
            <span class="integration-logo-wrap">
              ${integrationLogo("kasa", "TP-LINK KASA")}
              <span class="brand-fallback" hidden>TP-LINK KASA</span>
            </span>
            <span class="integration-name"><strong>TP-Link Kasa</strong><small>Desktop app</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
          <div class="integration-pill" style="--brand:#8FA3BF">
            <span class="integration-logo-wrap">
              ${integrationLogo("yeelight", "YEELIGHT")}
              <span class="brand-fallback" hidden>YEELIGHT</span>
            </span>
            <span class="integration-name"><strong>Yeelight</strong><small>Desktop app · LAN mode</small></span>
            <span class="integration-status" aria-hidden="true"></span>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="pricing">
      <div class="container">
        <div class="section-head center reveal">
          <span class="section-kicker">Pricing</span>
          <h2 class="section-heading">Free today. Premium when it is ready.</h2>
          <p class="section-copy">Everything NEXUS does today is free, with no device limit and no account fee. Premium and Family plans are on the way.</p>
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
              <div class="plan-console-head"><span>Device capacity</span><strong>No limit</strong></div>
              <div class="plan-console-track"><i style="--capacity: 42%"></i><b></b><b></b><b></b><b></b><b></b></div>
              <div class="plan-console-meta"><span>Local control</span><span>Scenes and NEXUS AI</span></div>
            </div>
            <div class="plan-divider"><span></span></div>
            <span class="feature-label">Included in Free</span>
            <ul class="feature-list">
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Unlimited connected devices</li>
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Scenes, automations and NEXUS AI chat</li>
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>100% local processing</li>
              <li><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>Windows, macOS and Linux apps</li>
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
              <span class="plan-badge popular">Coming soon</span>
            </div>
            <p class="plan-description">Advanced AI, secure remote access, and automations that continuously adapt to your routines.</p>
            <div class="plan-price-row">
              <div class="price price-soon">Soon</div>
              <span class="price-note">Not on sale yet</span>
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
            <span class="button button-primary is-disabled" aria-disabled="true">Coming soon</span>
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
              <div class="price price-soon">Soon</div>
              <span class="price-note">Not on sale yet</span>
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
            <span class="button button-secondary is-disabled" aria-disabled="true">Coming soon</span>
            <div class="plan-foot"><span class="status-dot"></span>Private profiles, one local core</div>
          </article>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head reveal">
          <span class="section-kicker">Apps</span>
          <h2 class="section-heading">Native on every desktop.</h2>
          <p class="section-copy">Download NEXUS for Windows, macOS or Linux today. The Android and iOS apps are on their way to the stores.</p>
        </div>

        <div class="downloads-grid" id="downloads">
          <article class="download-card download-windows reveal" data-platform="windows">
            <div class="download-card-grid" aria-hidden="true"></div>
            <div class="platform-watermark" aria-hidden="true"><svg class="os-logo os-logo-windows" viewBox="0 0 24 24"><path fill="currentColor" d="M3 5.1 10.4 4v7.2H3V5.1Zm8.4-1.2L21 2.5v8.7h-9.6V3.9ZM3 12.8h7.4V20L3 18.9v-6.1Zm8.4 0H21v8.7l-9.6-1.4v-7.3Z"/></svg></div>
            <div class="platform-top">
              <div class="platform-icon platform-icon-windows">
                <svg class="os-logo os-logo-windows" viewBox="0 0 24 24" aria-label="Windows logo" role="img"><path fill="currentColor" d="M3 5.1 10.4 4v7.2H3V5.1Zm8.4-1.2L21 2.5v8.7h-9.6V3.9ZM3 12.8h7.4V20L3 18.9v-6.1Zm8.4 0H21v8.7l-9.6-1.4v-7.3Z"/></svg>
              </div>
              <span class="platform-kicker">Windows 10 and 11</span>
            </div>
            <h3>Windows</h3>
            <p>One installer for Intel/AMD and ARM PCs. Includes automatic updates.</p>
            <span class="version">${dyn.desktopVersion} · x64 + ARM64</span>
            <div class="platform-specs"><span>Local control</span><span>Auto-update</span><span>No hub required</span></div>
            <a class="button button-secondary download-button" href="${RELEASES}NEXUS-Setup.exe" rel="noopener">Download for Windows</a>
            <span class="download-note">First launch: if SmartScreen appears, choose “More info” → “Run anyway”.</span>
          </article>

          <article class="download-card download-macos reveal" data-platform="macos">
            <div class="download-card-grid" aria-hidden="true"></div>
            <div class="platform-watermark" aria-hidden="true"><svg class="os-logo os-logo-apple" viewBox="0 0 384 512"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-72.5-19.7-30.5.5-58.3 17.8-74 45.8-31.5 54.6-8 135.1 22.6 179.5 15.3 22.2 33.6 47.1 57.6 46.2 23-.9 31.7-14.8 59.5-14.8 27.8 0 35.6 14.8 59.9 14.8 24.7-.4 40.4-22.6 55.7-44.8 17.7-25.8 25-50.8 25.5-52.1-.6-.3-48.9-18.8-49.1-74.2zM260.4 117.1c12.8-15.3 21.6-36.5 19.1-57.6-18.4.7-40.8 12.9-53.7 28.2-11.6 13.4-21.7 34.9-18.8 55.4 20.5 1.6 40.6-10.4 53.4-26z"/></svg></div>
            <div class="platform-top">
              <div class="platform-icon platform-icon-macos">
                <svg class="os-logo os-logo-apple" viewBox="0 0 384 512" aria-label="Apple logo" role="img"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-72.5-19.7-30.5.5-58.3 17.8-74 45.8-31.5 54.6-8 135.1 22.6 179.5 15.3 22.2 33.6 47.1 57.6 46.2 23-.9 31.7-14.8 59.5-14.8 27.8 0 35.6 14.8 59.9 14.8 24.7-.4 40.4-22.6 55.7-44.8 17.7-25.8 25-50.8 25.5-52.1-.6-.3-48.9-18.8-49.1-74.2zM260.4 117.1c12.8-15.3 21.6-36.5 19.1-57.6-18.4.7-40.8 12.9-53.7 28.2-11.6 13.4-21.7 34.9-18.8 55.4 20.5 1.6 40.6-10.4 53.4-26z"/></svg>
              </div>
              <span class="platform-kicker">Apple silicon and Intel Macs</span>
            </div>
            <h3>macOS</h3>
            <p>A universal app for every Mac on macOS 11 Big Sur or later.</p>
            <span class="version">${dyn.desktopVersion} · Universal</span>
            <div class="platform-specs"><span>Local control</span><span>Auto-update</span><span>No hub required</span></div>
            <a class="button button-secondary download-button" href="${RELEASES}NEXUS-mac.dmg" rel="noopener">Download for macOS</a>
            <span class="download-note">First launch: right-click NEXUS in Applications and choose “Open”.</span>
          </article>

          <article class="download-card download-linux reveal" data-platform="linux">
            <div class="download-card-grid" aria-hidden="true"></div>
            <div class="platform-watermark" aria-hidden="true"><svg class="os-logo os-logo-linux" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" d="M4 5.5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Zm3 4 3 2.5-3 2.5m5 .5h5"/></svg></div>
            <div class="platform-top">
              <div class="platform-icon platform-icon-linux">
                <svg class="os-logo os-logo-linux" viewBox="0 0 24 24" aria-label="Linux" role="img"><path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" d="M4 5.5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Zm3 4 3 2.5-3 2.5m5 .5h5"/></svg>
              </div>
              <span class="platform-kicker">Ubuntu, Debian, Fedora and more</span>
            </div>
            <h3>Linux</h3>
            <p>A portable AppImage for any distribution, plus a .deb package.</p>
            <span class="version">${dyn.desktopVersion} · x64</span>
            <div class="platform-specs"><span>Local control</span><span>Auto-update</span><span>No hub required</span></div>
            <a class="button button-secondary download-button" href="${RELEASES}NEXUS-linux.AppImage" rel="noopener">Download AppImage</a>
            <a class="apk-link" href="${RELEASES}NEXUS-linux.deb" rel="noopener">Download .deb package</a>
          </article>
        </div>
        <p class="downloads-meta reveal"><a href="${RELEASES_PAGE}" rel="noopener">All releases, release notes and SHA-256 checksums</a></p>

        <div class="downloads-grid downloads-mobile" id="mobile-apps">
          <article class="download-card download-android is-soon reveal" data-platform="android">
            <div class="download-card-grid" aria-hidden="true"></div>
            <div class="platform-watermark" aria-hidden="true"><svg class="os-logo os-logo-android" viewBox="0 0 24 24"><path fill="currentColor" d="M6.2 9.1h11.6v6.7a1.9 1.9 0 0 1-1.9 1.9H8.1a1.9 1.9 0 0 1-1.9-1.9V9.1Zm-2.8.1a1.4 1.4 0 0 1 2.8 0v4.2a1.4 1.4 0 0 1-2.8 0V9.2Zm14.4 0a1.4 1.4 0 0 1 2.8 0v4.2a1.4 1.4 0 0 1-2.8 0V9.2ZM7.5 8.1C8 6.2 9.8 4.8 12 4.8s4 1.4 4.5 3.3l1.5-1.9a.4.4 0 1 0-.6-.5l-1.7 2.1A6.6 6.6 0 0 0 12.4 7V5.7a.4.4 0 1 0-.8 0V7c-1.1.1-2.1.4-3 .9L6.6 5.8a.4.4 0 1 0-.6.5l1.5 1.8Z"/></svg></div>
            <div class="platform-top">
              <div class="platform-icon platform-icon-android">
                <svg class="os-logo os-logo-android" viewBox="0 0 24 24" aria-label="Android logo" role="img"><path fill="currentColor" d="M6.2 9.1h11.6v6.7a1.9 1.9 0 0 1-1.9 1.9H8.1a1.9 1.9 0 0 1-1.9-1.9V9.1Zm-2.8.1a1.4 1.4 0 0 1 2.8 0v4.2a1.4 1.4 0 0 1-2.8 0V9.2Zm14.4 0a1.4 1.4 0 0 1 2.8 0v4.2a1.4 1.4 0 0 1-2.8 0V9.2ZM7.5 8.1C8 6.2 9.8 4.8 12 4.8s4 1.4 4.5 3.3l1.5-1.9a.4.4 0 1 0-.6-.5l-1.7 2.1A6.6 6.6 0 0 0 12.4 7V5.7a.4.4 0 1 0-.8 0V7c-1.1.1-2.1.4-3 .9L6.6 5.8a.4.4 0 1 0-.6.5l1.5 1.8Z"/></svg>
              </div>
              <span class="platform-kicker">Android phone and tablet</span>
            </div>
            <h3>Android</h3>
            <p>The same local-first home on Android. It will be published on Google Play.</p>
            <span class="version">Coming soon · Android 7+</span>
            <div class="platform-specs"><span>Local control</span><span>Works offline</span><span>No hub required</span></div>
            <span class="button button-secondary download-button is-disabled" aria-disabled="true">Coming soon to Google Play</span>
          </article>

          <article class="download-card download-ios is-soon reveal" data-platform="ios">
            <div class="download-card-grid" aria-hidden="true"></div>
            <div class="platform-watermark" aria-hidden="true"><svg class="os-logo os-logo-apple" viewBox="0 0 384 512"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-72.5-19.7-30.5.5-58.3 17.8-74 45.8-31.5 54.6-8 135.1 22.6 179.5 15.3 22.2 33.6 47.1 57.6 46.2 23-.9 31.7-14.8 59.5-14.8 27.8 0 35.6 14.8 59.9 14.8 24.7-.4 40.4-22.6 55.7-44.8 17.7-25.8 25-50.8 25.5-52.1-.6-.3-48.9-18.8-49.1-74.2zM260.4 117.1c12.8-15.3 21.6-36.5 19.1-57.6-18.4.7-40.8 12.9-53.7 28.2-11.6 13.4-21.7 34.9-18.8 55.4 20.5 1.6 40.6-10.4 53.4-26z"/></svg></div>
            <div class="platform-top">
              <div class="platform-icon platform-icon-macos">
                <svg class="os-logo os-logo-apple" viewBox="0 0 384 512" aria-label="Apple logo" role="img"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-72.5-19.7-30.5.5-58.3 17.8-74 45.8-31.5 54.6-8 135.1 22.6 179.5 15.3 22.2 33.6 47.1 57.6 46.2 23-.9 31.7-14.8 59.5-14.8 27.8 0 35.6 14.8 59.9 14.8 24.7-.4 40.4-22.6 55.7-44.8 17.7-25.8 25-50.8 25.5-52.1-.6-.3-48.9-18.8-49.1-74.2zM260.4 117.1c12.8-15.3 21.6-36.5 19.1-57.6-18.4.7-40.8 12.9-53.7 28.2-11.6 13.4-21.7 34.9-18.8 55.4 20.5 1.6 40.6-10.4 53.4-26z"/></svg>
              </div>
              <span class="platform-kicker">iPhone and iPad</span>
            </div>
            <h3>iOS</h3>
            <p>The same local-first home on iPhone and iPad. It will be published on the App Store.</p>
            <span class="version">Coming soon · iOS 15+</span>
            <div class="platform-specs"><span>Local control</span><span>Face ID</span><span>No hub required</span></div>
            <span class="button button-secondary download-button is-disabled" aria-disabled="true">Coming soon to the App Store</span>
          </article>
        </div>
      </div>
    </section>


    <section class="section-tight community-section" id="early-access">
      <div class="container">
        <div class="section-head center reveal community-intro">
          <span class="section-kicker">Early access</span>
          <h2 class="section-heading">New, honest, and shaped by its first homes.</h2>
          <p class="section-copy">NEXUS is in early access, so there are no ratings or reviews to show yet — we would rather earn them. Tell us which device you want supported next and we will prioritise it.</p>

        </div>
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
            <div class="faq-answer">Yes. Pairing and controlling devices on your local network, scenes, automations and NEXUS AI are free, with no device limit, hub, cloud account or subscription. Paid Premium and Family plans will come later; nothing you use today will be taken away.</div>
          </div>
          <div class="faq-card">
            <div class="faq-question">Which devices are supported?</div>
            <div class="faq-answer">Philips Hue, Shelly (Gen1, Plus and Pro), Tasmota, WLED, ESPHome, TP-Link Tapo, Sonoff and Tuya devices are controlled directly over your local network. TP-Link Kasa, Yeelight, WiZ, LIFX and Govee work in the desktop app. Matter and Zigbee connect through Home Assistant.</div>
          </div>
          <div class="faq-card">
            <div class="faq-question">Does it work without a cloud connection?</div>
            <div class="faq-answer">Yes. NEXUS communicates with devices over your local network, so core controls and automations continue working when the internet goes down.</div>
          </div>
          <div class="faq-card">
            <div class="faq-question">Can I control my home while I am away?</div>
            <div class="faq-answer">NEXUS talks to your devices on your home network. To control them while away, connect to your home through your own VPN (for example WireGuard on your router). A built-in remote option is planned.</div>
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
          <a href="#mobile-apps">Android & iOS (soon)</a>
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
