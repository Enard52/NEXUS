# Execution Plan — NEXUS Platform Overhaul

## Phase 1: Investigation & Test Suite Preparation
- Milestone E2E: Spawn Explorers and Workers to audit test setup, write/update requirement-driven E2E tests, verify initial baseline test results using `pnpm test`.
- Milestone R1: Explore `pages.ts`, `web/src/index.ts`, `web/src/render.ts` to identify exact code locations for navbar button, FOUC script, version strings, logos, footer links, scrollbars, etc.

## Phase 2: Core Platform Fixes (R1, R3, R4)
- Milestone R1 Execution & Verification: Dispatch Workers to fix web quick fixes, Reviewers/Challengers/Auditors to verify.
- Milestone R3 Execution & Verification: Dispatch Workers to fix installer license formatting, logos, multi-platform paths, and remove Electron brand references in installer.
- Milestone R4 Execution & Verification: Dispatch Workers to fix Desktop App main entry (`/app`), brand names, gradient icons, and glass-morphism UI.

## Phase 3: Web & Mobile Content Enrichment (R2, R5)
- Milestone R2 Execution & Verification: Dispatch Workers to build mobile showcase, pricing features, section reordering, desktop mockup animation, legal/about pages, sign-in button.
- Milestone R5 Execution & Verification: Dispatch Workers to add tab icons, billing comparison table, realistic device names, analytics cards, 11 screens polish.

## Phase 4: Cross-Platform & Final Verification (R6)
- Milestone R6 Execution & Verification: Dispatch Workers for Linux GNOME controls, Android status bar, preview store route `/preview/store`.
- Full Test Suite & Forensic Audit Gate: Run full `pnpm test` suite (300 tests), ensure zero Electron/developer tool leaks, run Forensic Auditor across all deliverables.
