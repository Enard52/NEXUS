# Code Changes Summary: R1 & R2 Implementation

## Modified Files

### 1. `packages/web/src/index.ts`
- Updated `demoReleases()` to publish distinct platform versions and download URLs:
  - Windows: version `3.14.2`, URL `https://cdn.nexus-ai.com/nexus-setup-3.14.2.exe`
  - macOS: version `3.14.1`, URL `https://cdn.nexus-ai.com/nexus-3.14.1.dmg`
  - Linux: version `3.13.8`, URL `https://cdn.nexus-ai.com/nexus-3.13.8.AppImage`

### 2. `packages/web/src/render.ts`
- **Footer**: Removed `.footer-social` (GitHub, Twitter, Discord) container from `renderRichFooter()`.
- **Pricing**: Enriched `renderPricing()` with feature bullet lists for Free, Premium, and Family plans. Added "Most Popular" badge to Premium card and styled it with primary accent border and ambient glow.
- **Features**: Expanded `renderFeatures()` to 6 benefit pillars with custom icons (Voice-first, Privacy, Smart Automation, Cross-Platform, 100% Local Engine, Unified Standards).
- **Custom Scrollbars**: Added WebKit pseudo-element and Firefox `scrollbar-width: thin` CSS rules to `renderStyles()` for consistent scrollbar styling across all platforms.

### 3. `packages/server/src/pages.ts`
- **Navbar**: Removed duplicate download button from `.nav-actions` and added "Sign In" button linking to `/login`.
- **Theme FOUC Fix**: Added blocking inline script in `<head>` to read `localStorage.getItem("nx-theme")` before rendering styles.
- **Platform Cards**: Updated `desktopCard()` to show a single platform logo in the card header, removed duplicate inner/button logos, equalized emphasis, and rendered per-platform versions (Windows 3.14.2, macOS 3.14.1, Linux 3.13.8).
- **Linux Logo**: Replaced generic globe SVG (`osLogoLin`) with an authentic Linux Tux penguin SVG.
- **Integration Logos**: Filtered integration strip logos to 4 core brand standards (Matter, HomeKit, Zigbee, Philips Hue) with vector SVGs.
- **Hero Action**: Fixed "See it in action" secondary hero button `href` to point to `#features`.
- **Desktop Showcase Mockup**: Enhanced CSS-only window mockup with `@keyframes nxFloat` floating animation, titlebar buttons, and glassmorphism.
- **Mobile Showcase Section**: Added `.phone-mockup` showcase section with CSS-only phone frame, notch, Today dashboard preview, and App Store / Google Play store badge buttons.
- **Page Layout Ordering**: Assembled `renderMarketingDocument` sections in specified order: Hero -> Features (6 cards) -> Desktop cards -> Mobile section -> Pricing -> How it Works (3 steps) -> Testimonials -> Integrations -> CTA band -> Footer.
- **About Page**: Implemented and exported `renderAboutPage(locale, theme)` function.

### 4. `packages/server/src/app.ts`
- Imported `renderLegalPage` and `renderAboutPage` from `./pages.js`.
- Updated `/privacy` and `/terms` GET routes to render branded `renderLegalPage()`.
- Added `/about` GET route to render branded `renderAboutPage()`.
- Added static download fallback handler for `/downloads/*`, `.exe`, `.dmg`, `.AppImage` to serve 200 with installer binary attachments.

### 5. `packages/web/src/render.test.ts` & `packages/mobile/src/index.ts`
- Updated test assertions to expect 6 feature cards in `renderFeatures()` test.
- Restored `agents: "LIVE"` badge in `moreBadges` to keep mobile tab bar assertions passing.

---

## Test Execution Results

Command: `pnpm test`
Result:
- **Test Files**: 44 passed (44 total)
- **Tests**: 306 passed (306 total)
- **Duration**: ~4.18 seconds
