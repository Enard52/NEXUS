# NEXUS Design Refinement Implementation Plan

> This plan is for agentic implementation workers. Before editing code, use `superpowers:using-superpowers`, `superpowers:brainstorming`, and `codex-engineering-guardrails:code-work`. Before declaring completion, use `superpowers:verification-before-completion`.

## Goal

Refine NEXUS into a production-ready experience without losing the current product identity:

- Web site: keep the premium homepage / download-center direction, but make it cleaner, more trustworthy, and more responsive.
- Desktop app: keep the current desktop shell and operational layout, but tighten spacing, state handling, navigation, and setup flow.
- Mobile app: redesign from scratch into a real mobile-first control experience that does not feel like a web page inside a phone frame.
- Shared surfaces: keep visual language, language coverage, and launcher/download behavior consistent across all platforms.

## Architecture

The repo already splits the product into three rendering surfaces plus a server/static layer:

- `packages/web` owns the marketing / site HTML and related SEO and verification tests.
- `packages/desktop` owns the desktop shell, setup flow, and desktop-specific rendering.
- `packages/mobile` owns the mobile shell and native-bridge behaviors.
- `packages/server` serves the runtime surfaces and download / showcase pages.
- `scripts/copy-static.mjs` copies built web/desktop/mobile assets into `public/`.

The plan is to keep those boundaries intact:

- Web and desktop are refinement passes on existing renderers, not rebuilds.
- Mobile is a new IA and visual system built on the current package boundary.
- Shared tokens, icons, and state patterns should be aligned where the repo already exposes a reusable API.

## Tech Stack

- TypeScript for all app surfaces.
- Existing HTML renderer pattern in `packages/web/src`, `packages/desktop/src`, and `packages/mobile/src`.
- Electron / desktop shell code in `desktop-app/`.
- Vitest-based tests for renderers, setup, and server routing.
- Static asset copy flow via `scripts/copy-static.mjs`.
- Playwright or browser-based visual QA through the in-app browser / local ports already used in the repo.

## Global Constraints

- Preserve the current launch identity on web and desktop; do not replace them with a brand-new design system.
- Treat mobile as a redesign-only surface; it can change substantially as long as it stays consistent with NEXUS branding and product intent.
- Keep translations and locale routing intact; language coverage should not regress when markup changes.
- Do not introduce unsafe inline event handlers on web surfaces if the current code can use scripted listeners instead.
- Keep desktop setup, trusted sender, and local-core constraints intact.
- Prefer small, reviewable edits over broad rewrites.
- Every visual change must be backed by a screenshot or at least one render/test assertion before the work is considered done.
- If a change touches shared output, update the source renderer first, then regenerate or copy the built HTML.

## Task 1: Baseline inventory and surface map

**Files:** `packages/web/src/index.ts`, `packages/desktop/src/index.ts`, `packages/mobile/src/index.ts`, `packages/server/src/app.ts`, `packages/server/src/pages.ts`, `scripts/copy-static.mjs`

**Interfaces:** consumes the current renderer exports and server routes; produces a stable map of which source file owns which visible surface.

- [ ] Read the renderer entry points and confirm which functions produce the final HTML for web, desktop, and mobile.
- [ ] Trace the server routes so we know which pages are runtime-served and which pages are static outputs.
- [ ] Record the build/copy path from source renderer to `public/` so later edits do not update the wrong layer.
- [ ] Make a short inventory of the high-value screens that must be visually checked: homepage, download center, desktop shell, desktop setup, mobile shell, privacy, terms, and 404.
- [ ] Confirm which tests already cover each surface so we extend the right test files instead of adding duplicates.

## Task 2: Web site refinement without resetting the premium direction

**Files:** `packages/web/src/render.ts`, `packages/web/src/seo.ts`, `packages/web/src/index.ts`, `packages/web/src/render.test.ts`, `packages/web/src/empirical-ui-verification.test.ts`, `packages/server/src/pages.ts`, `public/index.html`, `public/light.html`, `public/privacy.html`, `public/terms.html`, `public/404.html`

**Interfaces:** consumes the current premium homepage structure and SEO helpers; produces improved landing, download, legal, and fallback pages with the same product identity.

- [ ] Review the homepage hero, download block, feature sections, and footer for spacing, hierarchy, and scanability issues.
- [ ] Keep the premium visual language, but remove anything that reads as cramped, over-branded, or inconsistent across breakpoints.
- [ ] Make sure the download center clearly shows platform, version, and trust cues without adding visual noise.
- [ ] Standardize legal and 404 pages so they feel like part of the same site system instead of separate one-off documents.
- [ ] Replace or remove any unsafe inline UI event attributes on the web surface if scripted listeners can achieve the same behavior cleanly.
- [ ] Update or extend render tests so the key page copy, structure, and important links still appear after the polish pass.
- [ ] Regenerate the static outputs that land in `public/` after the source renderer changes are validated.

## Task 3: Desktop app refinement and setup hardening

**Files:** `packages/desktop/src/index.ts`, `packages/desktop/src/setup.ts`, `packages/desktop/src/utils.ts`, `packages/desktop/src/render.test.ts`, `packages/desktop/src/setup.test.ts`, `desktop-app/main.cjs`, `desktop-app/preload.cjs`, `public/desktop/index.html` or the desktop preview output path used by the build

**Interfaces:** consumes the current desktop shell, setup flow, and Electron bridge; produces a cleaner operational desktop experience with the same core layout.

- [ ] Tighten the desktop shell hierarchy so the sidebar, main panel, and right rail read faster on large screens.
- [ ] Preserve the current desktop identity, but rebalance spacing, typography, and card density where the UI feels too tight or too empty.
- [ ] Harden setup flow states only where needed: browse, complete, start local core, launch, rollback, health failure, and retry.
- [ ] Review the setup wizard as an already-strong flow first, then only touch it if a specific step looks inconsistent, confusing, or visually weaker than the rest of desktop.
- [ ] Check that setup still clearly explains what happens next, what is safe to retry, and when the user is expected to wait versus act.
- [ ] Verify setup visuals for loading, offline, failure, first-run, resumed-run, and recovery states so the wizard never feels frozen or ambiguous.
- [ ] Keep the existing stepper rhythm, spacing, and CTA hierarchy unless a concrete regression is found during screenshot review.
- [ ] Ensure the setup wizard visually matches the refined desktop shell instead of looking like a separate app fragment.
- [ ] Capture screenshot evidence for the wizard's best path and its error/rollback path before closing the task.
- [ ] Verify the Electron preload exposure stays limited to the setup/window APIs the shell actually needs.
- [ ] Confirm trusted sender and navigation allowlist behavior still protects the app from unintended navigation.
- [ ] Keep the desktop build outputs aligned with the source renderer so the visible HTML always matches the latest desktop source, not an old snapshot.
- [ ] Extend desktop tests around setup and shell output to catch regressions in state copy, window controls, and layout-dependent content.

## Task 4: Mobile app redesign from scratch

**Files:** `packages/mobile/src/index.ts`, `packages/mobile/src/render.test.ts`, `packages/mobile/src/native-bridge.test.ts`, `public/mobile/index.html`

**Interfaces:** consumes the mobile package boundary and native bridge contract; produces a new mobile-first shell, information architecture, and interaction model.

- [ ] Define a mobile IA that feels like a true control center: Today, Home, Devices, Automations, and More.
- [ ] Replace the phone-frame/web-shell feel with a native-feeling layout built for one-handed use and fast actions.
- [ ] Design the core states first: onboarding, permissions, local core connect, dashboard, detail, assistant sheet, offline, settings, and error.
- [ ] Use platform-aware status bar and bottom navigation behavior so Android and iOS do not inherit the same chrome by accident.
- [ ] Align the icon set and action hierarchy with the web/desktop brand language while letting the mobile layout evolve independently.
- [ ] Add or update tests for the mobile renderer and native bridge so the redesigned shell still renders the expected states and labels.
- [ ] Validate the mobile output on a real narrow viewport and on the Android emulator path if available.

## Task 5: Responsive consistency, visual QA, and release gates

**Files:** `packages/web/src/empirical-ui-verification.test.ts`, `packages/web/src/render.test.ts`, `packages/desktop/src/render.test.ts`, `packages/mobile/src/render.test.ts`, `packages/server/src/app.test.ts`, `scripts/copy-static.mjs`

**Interfaces:** consumes the refined source renderers and tests; produces verified responsive behavior and a predictable static build.

- [ ] Check desktop, tablet, and phone breakpoints for layout breakage, overflow, cropped content, and unreadable hierarchy.
- [ ] Verify focus-visible states, keyboard navigation, and touch-target sizing on the main interactive surfaces.
- [ ] Confirm the generated static outputs in `public/` still match the source renderers after copying.
- [ ] Run the existing test suite for web, desktop, mobile, and server routes before and after the visual work.
- [ ] Capture screenshots for the final web homepage, desktop shell, desktop setup, mobile shell, privacy, terms, and 404 pages.
- [ ] Reject any state that looks blank, loading, misaligned, clipped, or visually inconsistent across the three surfaces.
- [ ] Only after the above is green, treat the design work as ready for the next implementation pass or code review.

## Task 6: Post-design i18n pass for the 20-language surface

**Files:** `packages/i18n/src/index.ts`, `packages/i18n/src/index.test.ts`, `packages/web/src/index.ts`, `packages/web/src/build.ts`, `packages/web/src/seo.ts`, `packages/server/src/app.ts`, `packages/server/src/pages.ts`, `packages/desktop/src/index.ts`, `packages/mobile/src/index.ts`, `scripts/verify-static.mjs`

**Interfaces:** consumes the design-frozen web/desktop/mobile outputs; produces locale resolution, hreflang coverage, language selectors, and static pages that consistently expose all supported languages.

- [ ] Do not start this phase until the design changes are settled and visually approved.
- [ ] Verify the full supported locale set is exposed in every relevant language selector on web, desktop, mobile, and auth/setup surfaces.
- [ ] Confirm locale resolution handles exact tags and real-world variants without collapsing supported languages into the wrong fallback.
- [ ] Regenerate web static outputs so every supported locale gets the right page set, alternates, and canonical links.
- [ ] Check that the server-rendered pages and download center still advertise the same locale set as the static pages.
- [ ] Validate RTL behavior, long translated labels, and overflow in the translated surfaces after the design freeze.
- [ ] Extend or update i18n tests so future refactors cannot silently drop a supported language or break locale detection.
- [ ] Keep translation corrections separate from visual redesign work so design review and language review can be signed off independently.

## Suggested Execution Order

1. Baseline inventory and surface map.
2. Web site refinement.
3. Desktop app refinement.
4. Mobile redesign.
5. Responsive QA and release gates.
6. Post-design i18n pass for the 20-language surface.

## Expected Outcome

- The web site keeps the premium homepage direction but becomes clearer, more consistent, and more responsive.
- The desktop app keeps the current shell but feels more deliberate and reliable.
- The mobile app becomes a purpose-built control experience rather than a web page in a frame.
- The repo ends with source, tests, and static outputs that agree with one another.
- The 20-language surface is validated after design freeze, not mixed into the visual pass.
