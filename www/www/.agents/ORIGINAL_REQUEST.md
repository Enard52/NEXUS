# Original User Request

## Initial Request — 2026-07-24T19:52:08Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Execute a comprehensive overhaul of the NEXUS platform (web, installer, desktop, and mobile apps) to resolve 41 issues while maintaining the existing SSR-to-static architecture. The end result must be a premium, production-ready experience with no visible developer tool names (e.g., Electron).

Working directory: c:\Users\ensar\Desktop\NEXUS-main
Integrity mode: development

## Requirements

### R1. Phase 1: Web Site — Quick Fixes
- Remove excess download button from navbar (pages.ts).
- Fix theme toggle FOUC with a blocking script in <head> (pages.ts).
- Differentiate platform versions: Windows (3.14.2), macOS (3.14.1), Linux (3.13.8) (web/src/index.ts).
- Reduce integration logos to 4 (Matter, HomeKit, Zigbee, Philips Hue) and improve SVGs (pages.ts).
- Fix Linux logo with a proper Tux SVG (pages.ts).
- Simplify platform cards to show only one logo in the header and equalize their emphasis (pages.ts).
- Remove social links from the footer (web/src/render.ts).
- Ensure download buttons point to actual/placeholder files (pages.ts, web/src/index.ts).
- Implement a custom scrollbar via CSS across all platforms (web/src/render.ts).
- Fix the "See it in action" button to scroll to `#features` (pages.ts).

### R2. Phase 2: Web Site — Content Enrichment
- Add a Mobile app showcase section with a CSS-only phone mockup and store badges (pages.ts).
- Enrich the Pricing section with detailed feature lists and a highlighted premium card (web/src/render.ts).
- Ensure the page layout follows the structured order: Hero, Features (expanded to 6), Desktop cards, Mobile section, Pricing, How it Works (new 3-step flow), Testimonials, Integrations, CTA, Footer (pages.ts).
- Upgrade the Desktop showcase to a CSS-only window mockup with float animation (pages.ts).
- Render proper Privacy, Terms, and new About pages (app.ts, pages.ts).
- Add a "Sign In" button to the navbar linking to `/login` (pages.ts).

### R3. Phase 3: Installer Fixes
- Format the license text with proper spacing and bold headers (installer/wizard.html).
- Update the installer logo to match the web site's gradient logo (installer/wizard.html).
- Implement multi-platform installer paths and descriptions (desktop/src/setup.ts).
- Hide the "Electron" name in the installer by updating `app.setName` and `app.setAppUserModelId` (installer/main.js, installer/package.json).

### R4. Phase 4: Desktop App
- Fix the root URL to point to `/app` instead of `/` so the desktop app loads instead of the marketing page (desktop-app/main.cjs).
- Ensure login redirection works correctly (already active via R4).
- Update the app icons using the gradient N logo (assets, scripts/gen-icons.cjs).
- Enrich the Desktop UI with premium touches: gradients, glass-morphism, animations, and Space Grotesk typography (desktop/src/index.ts, desktop/src/utils.ts).
- Ensure the brand name "NEXUS" appears everywhere instead of "Electron" or "Node.js" (desktop-app/main.cjs, desktop-app/package.json).

### R5. Phase 5: Mobile App
- Fix missing tab icons (platforms, agents, admin-dashboard) in the mobile view (mobile/src/index.ts).
- Enhance the billing/pricing view with feature checklists, comparison tables, and mock payment history (web/src/render.ts).
- Replace generic device names with realistic brands and add detailed status indicators (web/src/index.ts).
- Add user analytics cards to the "Today" panel (weekly energy, uptime, automation count, active device) (web/src/render.ts).
- Apply premium CSS touches to the mobile interface (glass-morphism, animations) (mobile/src/index.ts, web/src/render.ts).
- Ensure all 11 screens look rich, realistic, and premium.

### R6. Phase 6: Cross-Platform & Sync
- Add Linux window controls (GNOME style) to the desktop view (desktop/src/utils.ts).
- Add an Android status bar variant to the mobile view (mobile/src/index.ts).
- Create a mock App Store/Play Store listing route `/preview/store`.
- Ensure all platforms correctly share the same renderer and display consistent data.

## Acceptance Criteria

### Verification Checklist
- [ ] Website: Navbar has only one download button. Theme toggle works without flash. Platform versions are unique.
- [ ] Website: Platform cards show one logo. Linux logo is Tux. 4 integration logos are displayed.
- [ ] Website: Mobile section, Pricing, and Testimonials are visible. Custom scrollbar is applied.
- [ ] Website: Download buttons point to files (at least Windows works).
- [ ] Website: Footer has no social links. Legal/About pages are branded.
- [ ] Installer: Uses new gradient logo, readable formatted license text, and primary color #7C5CFF.
- [ ] Desktop App: Opens to `/app` (not marketing), requires login, shows sidebar.
- [ ] Desktop App: Taskbar and processes show "NEXUS", absolutely no mention of "Electron".
- [ ] Desktop App: Uses the new brand icon.
- [ ] Mobile App: All tab icons are visible. Premium design applied. Devices have realistic names and data.
- [ ] Mobile App: Pricing is detailed. Analytics cards are present.
- [ ] Cross-platform: macOS/Linux desktop previews work. Store listing mockup is available.
- [ ] Tests: `pnpm test` passes with all 300 tests (including updated assertions).
