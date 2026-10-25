# Contributing / Katkı

Thanks for helping NEXUS! / Katkın için teşekkürler!

## Ground rules (short) / Temel kurallar

1. **No fake anything.** Devices, data, stats, prices, AI replies — never fabricated (see `CLAUDE.md`). If a feature doesn't work, the UI says so.
2. **Secrets never enter the repo.** Supabase/GitHub Secrets only.
3. **Prices and plan texts come from the single source** (`cloud-sync.js` PRICES ↔ `scripts/site-content.mjs`, enforced by tests).
4. **New device connectors** follow the real protocol docs and ship packet/response tests in `packages/web/src/lan-*.test.ts`; note if untested with real hardware.
5. **Design language stays consistent**: Inter, `#4C7DFF→#22D3EE`, rounded cards, the shared shell metrics (`--nx-header-h`, `--nx-nav-h`). User-visible strings are Turkish + English (i18n dictionary).

## Dev loop / Geliştirme

```bash
pnpm install
pnpm test            # vitest (unit + guards)
node scripts/sync-www.mjs          # kök → www
node desktop/scripts/prepare-app.cjs   # → desktop/app
npx cap sync android               # → android assets (APK rebuild needed)
npm run site:full                  # site ekran görüntüleri + derleme
node scripts/measure-layout.mjs --check   # kabuk standardı
node scripts/verify-automation-live.mjs   # otomasyon motoru canlı test
```

Single source of truth for screens is the repo root (`stitch-*.html`, `*.js`, `css/`). Copies in `www/`, `desktop/app/`, `android/.../public/` are generated — never edit them.

## Pull requests

- Conventional Commits (`feat:`, `fix:`, `security:`, `docs:` …) — CHANGELOG is generated from them.
- PRs must keep `pnpm test` green.
- UI changes: attach a screenshot (mobile 390 px + desktop if relevant).
