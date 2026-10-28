# NEXUS — contributor rules (for Claude and other developers; not user-facing)

1. **Nothing fake/demo/mock is ever added.** Devices, data, statistics, subscriptions, prices or AI replies are never fabricated.
   If a feature doesn't work (no bridge, device unreachable, quota exhausted) the UI says so honestly; it never looks "successful".
   These warnings live in code COMMENTS (e.g. the `lan-connectors.js` header); user-visible text never contains "fake/test".
2. A new connector (protocol) is written only against its real protocol documentation and ships with packet/response format tests in `packages/web/src/lan-*.test.ts`.
   If it hasn't been verified with real hardware, note it in the commit message / release notes.
3. Secrets (tokens, passwords, webhook URLs) never enter the repo, the chat, or the code. Supabase Secrets / GitHub Secrets are used.
4. Prices and plan texts come from a single source: `scripts/site-pricing.cjs`, `cloud-sync.js` (prices), Whop plans. When one changes, all are updated together.
5. Releases: push to `main` → site/web automatic (`web-deploy.yml`); `v*` tag → desktop + Android (`desktop-release.yml`, `android-release.yml`);
   `release-catchup.yml` fills in missing versions. For manual releases see the release notes and `LOCAL-BUILD.txt` rules.
6. Android signing: `~/NEXUS-signing/` (backup: private repo `nexus-signing-backup`). Keystore files never enter the repo.

7. **Every screen is tested in 3 states:** (a) new user: no account/device, (b) one device paired, (c) offline/error. No action button (Start, Run, Save…) is shown without a device, capability or data; instead show an empty state and an honest next step (e.g. "Add a device first"). Never test with a demo account full of data only.
