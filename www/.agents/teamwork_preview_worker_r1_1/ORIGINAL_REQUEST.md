## 2026-07-24T22:53:46Z
You are teamwork_preview_worker. Your working directory is c:\Users\ensar\Desktop\NEXUS-main\.agents\teamwork_preview_worker_r1_1.

Task:
Implement R1 (Web Site Quick Fixes) and R2 (Web Site Content Enrichment) for the NEXUS platform project.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Reference Explorer Reports:
- c:\Users\ensar\Desktop\NEXUS-main\.agents\teamwork_preview_explorer_r1_1\handoff.md
- c:\Users\ensar\Desktop\NEXUS-main\.agents\teamwork_preview_explorer_r1_1\analysis.md

Detailed Tasks to Implement:
1. R1.1: Remove excess download button from navbar (nav-actions in packages/server/src/pages.ts).
2. R1.2: Fix theme toggle FOUC with blocking inline script in <head> (packages/server/src/pages.ts).
3. R1.3: Differentiate platform versions: Windows (3.14.2), macOS (3.14.1), Linux (3.13.8) in packages/web/src/index.ts and packages/server/src/pages.ts.
4. R1.4: Reduce integration logos to 4 (Matter, HomeKit, Zigbee, Philips Hue) and improve SVGs in packages/server/src/pages.ts.
5. R1.5: Replace generic globe Linux logo with proper Tux SVG in packages/server/src/pages.ts.
6. R1.6: Simplify platform cards to show one logo in header and equalize emphasis in packages/server/src/pages.ts.
7. R1.7: Remove social links (.footer-social) from footer in packages/web/src/render.ts.
8. R1.8: Ensure download buttons point to actual/placeholder downloadable endpoints (packages/server/src/pages.ts, packages/web/src/index.ts, packages/server/src/app.ts).
9. R1.9: Add custom WebKit/Firefox scrollbar CSS rules across all platforms in packages/web/src/render.ts.
10. R1.10: Fix "See it in action" button href from #desktop to #features in packages/server/src/pages.ts.
11. R2.1: Add Mobile app showcase section with CSS-only phone mockup & store badges in packages/server/src/pages.ts.
12. R2.2: Enrich Pricing section with detailed feature lists and highlighted premium card in packages/web/src/render.ts.
13. R2.3: Order page layout: Hero, Features (expanded to 6), Desktop cards, Mobile section, Pricing, How it Works (3-step flow), Testimonials, Integrations, CTA, Footer in packages/server/src/pages.ts.
14. R2.4: Upgrade Desktop showcase to CSS-only window mockup with float animation (@keyframes nxFloat) in packages/server/src/pages.ts.
15. R2.5: Render proper Privacy, Terms, and new About pages in packages/server/src/app.ts and packages/server/src/pages.ts.
16. R2.6: Add "Sign In" button to navbar linking to /login in packages/server/src/pages.ts.

Verification Requirements:
- Run `pnpm test` using run_command in c:\Users\ensar\Desktop\NEXUS-main.
- Update any test assertions in test files if necessary to reflect new labels, versions, or section structures.
- Ensure all tests pass.
- Write changes.md and handoff.md in c:\Users\ensar\Desktop\NEXUS-main\.agents\teamwork_preview_worker_r1_1\ documenting all code changes, test command execution, and test results.
- Send a message to parent upon completion.
