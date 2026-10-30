# Contributing

Thanks for helping NEXUS!

## Ground rules (short)

1. **No fake anything.** Devices, data, stats, prices, AI replies — never fabricated (see `CLAUDE.md`). If a feature doesn't work, the UI says so.
2. **Secrets never enter the repo.** Supabase/GitHub Secrets only.
3. **Prices and plan texts come from the single source** (`cloud-sync.js` PRICES ↔ `scripts/site-content.mjs`, enforced by tests).
4. **New device connectors** follow the real protocol docs and ship packet/response tests in `packages/web/src/lan-*.test.ts`; note if untested with real hardware.
5. **Design language stays consistent**: Inter, `#4C7DFF→#22D3EE`, rounded cards, the shared shell metrics (`--nx-header-h`, `--nx-nav-h`). User-visible strings live in the i18n dictionary — English and Turkish ship with the app; community languages are welcome (see the translation issues).

## Dev loop

```bash
pnpm install
pnpm test            # vitest (unit + guards)
node scripts/sync-www.mjs          # root → www
node desktop/scripts/prepare-app.cjs   # → desktop/app
npx cap sync android               # → android assets (APK rebuild needed)
npm run site:full                  # site screenshots + build
node scripts/measure-layout.mjs --check   # shell standard
node scripts/verify-automation-live.mjs   # automation engine live test
```

Single source of truth for screens is the repo root (`nexus-*.html`, `*.js`, `css/`). Copies in `www/`, `desktop/app/`, `android/.../public/`, `ios/App/App/public/` are generated — never edit them.

## Pull requests

- **Anyone may open a PR** — bug fixes, connectors, docs, translations. Every PR is reviewed by the maintainers before merge; nothing is auto-merged.
- Conventional Commits (`feat:`, `fix:`, `security:`, `docs:` …) — CHANGELOG is generated from them.
- PRs must keep `pnpm test` green.
- UI changes: attach a screenshot (mobile 390 px + desktop if relevant).
- New languages: add a dictionary file only (layout is language-agnostic); the 100% coverage gate applies to shipped languages.

## Credit

Your commits keep your authorship. Contributors are credited by GitHub handle in the release notes and README of the release that includes their work. Only real contributors are named; no numbers or rankings are published. (Also on the site: `/contribute`.)
