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