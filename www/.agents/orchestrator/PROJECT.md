# Project: NEXUS Platform Overhaul

## Architecture
- Tech Stack: TypeScript, Node.js, HTML/CSS (SSR-to-static rendering architecture), Custom Desktop/Mobile wrappers, Installer wizard
- Entry points: `packages/web/src/index.ts`, `packages/server/src/pages.ts`, `packages/web/src/render.ts`, `packages/server/src/app.ts`, `installer/wizard.html`, `packages/desktop/src/setup.ts`, `desktop-app/main.cjs`, `packages/mobile/src/index.ts`
- Shared Renderer: All platforms share web renderer components while presenting platform-specific customizations.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Suite | Requirements-driven E2E tests (Tiers 1-4) & infrastructure | none | DONE |
| R1 | Web Quick Fixes | Navbar download button, FOUC theme toggle script, platform versions, integration logos, Linux Tux logo, platform cards, footer social links, download file targets, custom CSS scrollbar, smooth scroll `#features` | none | DONE |
| R2 | Web Content Enrichment | Mobile app showcase section, Pricing section enrichment, section ordering, Desktop CSS mockup animation, Privacy/Terms/About pages, Sign In navbar link | R1 | DONE |
| R3 | Installer Fixes | Formatted license text, web gradient logo, multi-platform installer paths/descriptions, rename/hide Electron in main/package | none | DONE |
| R4 | Desktop App Overhaul | Root URL `/app`, login redirect, gradient N icons, desktop UI styling (glass-morphism, Space Grotesk), branding replacement (NEXUS vs Electron/Node) | R1, R3 | DONE |
| R5 | Mobile App Overhaul | Tab icons (platforms, agents, admin-dashboard), billing/pricing view, realistic device names/status, analytics cards, mobile UI glass-morphism/animations, 11 screens polish | R2 | DONE |
| R6 | Cross-Platform & Sync | GNOME style Linux window controls, Android status bar variant, `/preview/store` route, final E2E test verification (`pnpm test` pass 306 tests) | R4, R5 | DONE |

## Interface Contracts
### Web ↔ Desktop / Mobile
- Shared routes: `/`, `/app`, `/login`, `/preview/store`, `/about`, `/terms`, `/privacy`, `/downloads/*`
- Shared CSS theme and render components from `packages/web/src/render.ts` and `packages/server/src/pages.ts`.

## Verification Gate Summary
- **Reviewer 1**: PASS (Code quality & vitest suite execution verified)
- **Reviewer 2**: PASS (Branding consistency & zero developer tool leaks verified)
- **Challenger 1**: PASS (25 route assertions & 12 stress scenarios verified)
- **Challenger 2**: PASS (20 empirical UI/cross-platform tests verified)
- **Forensic Auditor 1**: **CLEAN** (Zero integrity violations, zero facade mocks)
- **Test Result**: 44/44 test files passed, 306/306 tests passed.

## Code Layout
- Web: `packages/web/src/`, `packages/server/src/pages.ts`, `packages/server/src/app.ts`
- Desktop: `packages/desktop/src/`, `desktop-app/`
- Mobile: `packages/mobile/src/`
- Installer: `installer/`
- Assets & Scripts: `assets/`, `scripts/`
