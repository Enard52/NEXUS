# Operations: free-tier limits and health check

NEXUS runs on free tiers: Supabase (accounts, Family, sync, push token storage), Firebase Cloud Messaging (push),
Cloudflare Pages and Workers (site, AI proxy) and GitHub (code, CI, releases). These are the limits that matter and
what the app does when one is hit. Plan limits change; check the provider's pricing page for current numbers.

| Service | Limit that matters | What happens | What the app shows |
|---|---|---|---|
| Supabase (free) | Database size, monthly active users, Edge Function invocations, e-mail sending rate | Requests fail or are rate limited | Account, Family, sync and invite screens report the failure; nothing is shown as saved when it was not |
| Supabase (free) | Project is **paused after about a week without activity** | Every request fails until it is restored in the dashboard | Cloud features say the server is unreachable; local features (devices, automations, tray) keep working |
| FCM | Per-project quotas are generous | Push delivery can fail | The push section shows "not configured" or the error; nothing says "on" unless the token reached the server |
| Cloudflare Pages / Workers | Daily Worker requests | AI replies fail | The assistant says it could not reply instead of inventing an answer |
| GitHub Actions | Free minutes for private use; public repos are free | Builds queue or stop | Releases are late; existing downloads keep working |

Local-first rule: device control and automations never depend on any of these services.

## Keep the project alive

- Open the Supabase project at least weekly, or let the daily Discord dashboard do it (it calls the project).
- The dashboard warns when the database passes 70% of the free size.

## Health check

```bash
node scripts/check-health.mjs
```

It prints whether the site, the AI worker, Supabase and the latest release assets answer, and exits non-zero if any
check fails. The same checks run hourly in the `daily-stats` Edge Function, which posts to Discord only on problems.
## Rollback plan

- **Web / site** (`web-deploy.yml`): revert the faulty commit on `main` (`git revert <sha>`); the push redeploys. Service-worker cache name (`CACHE` in `src/app/sw.js`) is bumped on every shell change, so clients pick up the revert on next load.
- **Desktop / Android**: do not delete a published release. Fix forward with a new patch tag (`vX.Y.Z+1`); users on the broken build are moved by the in-app update check. If a build is dangerous, mark the release as pre-release in `Enard52/nexus-releases` so it stops being offered as "latest".
- **Database (Supabase)**: schema changes go through migrations only; never edit production by hand. Restore from the latest export (see below) if data is damaged.
- **Secrets leaked**: rotate first (Supabase/GitHub Secrets), then clean history. Rotation is the owner's task.

## Incident response (small team, zero budget)

1. Confirm and note the time, the affected platform and version.
2. Stop the bleeding: revert or disable the feature (see Rollback plan); say so honestly in the app (status/ announcements) rather than hiding it.
3. Fix forward with a tested patch release.
4. Write a short public note (what happened, who was affected, what changed) in the release notes.
5. Add a regression test so it cannot return.

## Free-tier guardrails

- Everything in CI and hosting uses free tiers; no paid service is required to run NEXUS.
- Optional upgrades when a budget exists (not needed now): paid code-signing certificate (removes SmartScreen warning), Apple Developer account (signed iOS builds), larger Supabase plan, error-reporting service. Each is prepared in the docs but intentionally not enabled.

## Backup and restore

The free Supabase plan has no backups, so `.github/workflows/supabase-backup.yml` exports the `public` schema weekly, encrypts it
with a passphrase and pushes it to a **private** repository (`nexus-backups`; the main repo is public, so the dump is never an
Actions artifact). It stays skipped until the owner adds the secrets `SUPABASE_DB_URL`, `BACKUP_PASSPHRASE` and `BACKUP_REPO_TOKEN`.

Restore drill (try it once on an empty Supabase project, never on production):

```bash
gpg --decrypt nexus-YYYY-MM-DD.sql.gz.gpg | gunzip | psql "$TARGET_DB_URL"
```
