# scripts/

Helper scripts for building, verifying and releasing NEXUS. Run everything from the repo root (`node scripts/<name>`), or through the `package.json` alias shown. "CI" says whether a GitHub workflow runs it.

> Do not commit one-off probes (`tmp-*`), logs or binaries here; `packages/core/src/repo-source.test.ts` fails on them (CLAUDE.md rule 8).

## Build & sync

| Script                                                                           | What it does                                                                                         | Run                                                            | CI                        |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------- |
| `sync-www.mjs`                                                                   | Mirrors `src/app` into `www/`, `desktop/app/` and the Android assets                                 | `pnpm sync:www`                                                | yes (android/ios release) |
| `build-server.mjs`                                                               | Bundles `packages/server`                                                                            | `pnpm --filter @nexus/server build`                            | via build                 |
| `copy-static.mjs`, `copy-fonts.mjs`, `copy-leaflet.mjs`                          | Copy static assets / fonts / Leaflet into the build output                                           | `pnpm build:static`, `pnpm copy:leaflet`                       | via build                 |
| `fix-review-avatars.mjs`                                                         | Post-build fix of review avatar assets                                                               | part of `pnpm build:static`                                    | via build                 |
| `build-accent-css.mjs`                                                           | Regenerates the accent-colour CSS                                                                    | `node scripts/build-accent-css.mjs`                            | no                        |
| `gen-mobile-icons.mjs`                                                           | Generates mobile icons, then run `sync-www`                                                          | `pnpm icons:mobile`                                            | no                        |
| `scaffold-modules.mjs`                                                           | Scaffolds module boilerplate                                                                         | `pnpm scaffold:modules`                                        | no                        |
| `ensure-cloud-config.mjs`                                                        | Writes `cloud-config.js` into release bundles from environment variables (keys never enter the repo) | `node scripts/ensure-cloud-config.mjs`                         | yes (web, android)        |
| `bump-version.mjs`                                                               | Bumps the app version everywhere                                                                     | `node scripts/bump-version.mjs <x.y.z>`                        | no                        |
| `release-manifest.mjs`                                                           | Builds the release manifest                                                                          | `pnpm release:manifest`                                        | no                        |
| `publish-mobile-artifact.mjs`, `publish-web-local.mjs`, `publish-site-local.mjs` | Manual/local publish helpers                                                                         | `pnpm release:mobile`, `pnpm publish:web`, `pnpm publish:site` | no                        |

## Marketing site

| Script                                                   | What it does                                                                                                                             | Run                                  | CI                     |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------- |
| `site-build.mjs`                                         | Builds the marketing site (uses `site-content.mjs`, `site-legal-content.mjs`, `site-seo.cjs`, `site-icons.mjs`, `site-pricing.cjs`, ...) | `pnpm site:build`                    | yes (`web-deploy.yml`) |
| `site-pricing.cjs`                                       | Single source for prices and plan texts (CLAUDE.md rule 4)                                                                               | imported                             | via site build         |
| `site-shots.mjs`, `site-icons.mjs`                       | Site screenshots / icons                                                                                                                 | `pnpm site:shots`, `pnpm site:icons` | no                     |
| `legal-content.cjs`, `legal-pdf.mjs`, `legal-pdf-en.mjs` | Legal text and PDF generation                                                                                                            | `node scripts/legal-pdf.mjs`         | no                     |
| `serve-site.mjs`, `local-dev-server.cjs`                 | Local static servers (see `docs/QA.md`)                                                                                                  | `node scripts/local-dev-server.cjs`  | no                     |

## Verification & QA

| Script                                             | What it does                                                                                                          | Run                                           | CI                                                                 |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| `verify-site.mjs`                                  | Checks the built marketing site (`--smoke` for the quick set)                                                         | `pnpm verify:site` / `pnpm verify:site:smoke` | yes (`web-deploy.yml`)                                             |
| `verify-desktop-payload.mjs`                       | Checks the desktop bundle/asar contents                                                                               | `pnpm verify:desktop`                         | yes (`desktop-release.yml`)                                        |
| `check-health.mjs`                                 | Post-release health check of the live endpoints                                                                       | `node scripts/check-health.mjs`               | yes (`post-release-smoke.yml`)                                     |
| `qa-ui-states.mjs`                                 | Renders screens in the three states (new / paired / offline) and flags a11y issues; baseline in `qa-ui-baseline.json` | `node scripts/qa-ui-states.mjs`               | yes (`ui-states.yml`)                                              |
| `verify-notify.mjs`                                | Notification pipeline check                                                                                           | `pnpm verify:notify`                          | no                                                                 |
| `ui-audit.mjs`, `ui-audit-summary.mjs`             | Playwright UI audit and its summary                                                                                   | `pnpm audit:ui`, `pnpm audit:ui:summary`      | no                                                                 |
| `i18n-sweep.mjs`                                   | Opens every app screen in English (desktop + phone, with paired devices) and fails if Turkish text survives on screen | `pnpm audit:i18n`                             | no (needs a browser)                                               |
| `i18n-coverage.mjs`                                | Dictionary coverage for HTML text, translated attributes and JS catalog strings; lists gaps, never fails by itself    | `pnpm audit:i18n:coverage`                    | yes — gated by `packages/web/src/i18n-coverage.test.ts` (`ci.yml`) |
| `compat-matrix.mjs`                                | Generates the compatibility matrix for `docs/COMPATIBILITY.md`                                                        | `node scripts/compat-matrix.mjs`              | no                                                                 |
| `measure-layout.mjs` (+ `measure-layout-live.mjs`) | Static / live (Chromium) shell layout measurement                                                                     | `node scripts/measure-layout.mjs`             | no                                                                 |
| `verify-lan-e2e.mjs`, `verify-automation-live.mjs` | Manual end-to-end checks against real LAN devices (see `docs/QA.md`, `CONTRIBUTING.md`)                               | `node scripts/verify-lan-e2e.mjs`             | no                                                                 |

## Other

Remaining files (catalog generators such as `gen-catalog-code.mjs` / `translate-catalogs.mjs` with their data files, `nexus-ai-worker.js`, `*.ps1` setup helpers, CDP/Playwright inspection helpers) are maintainer tools run by hand; check the header comment of each before use. Several have no references yet and may be pruned in a later hygiene pass.
