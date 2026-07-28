# NEXUS AI

Local-first personal operating system (TypeScript monorepo). The repo contains the web app, desktop shell, mobile phone shell, sync server, and a native installer wizard — all sharing the same design tokens and screen view-models.

## How to run

- Install dependencies: `pnpm install`
- Start the sync server: `pnpm start` (or `pnpm dev` for watch mode)
- The server runs on the port set by `PORT` (default `4178`) and reads `SESSION_SECRET` for session signing.

## Environment

- `PORT` — server port (default: `4178`)
- `NEXUS_DATA_DIR` — where SQLite files live (default: `~/.nexus`)
- `SESSION_SECRET` — session cookie secret (provided as a Replit Secret)

## Useful scripts

- `pnpm dev` — start server in watch mode
- `pnpm start` — start server
- `pnpm test` — run the full test suite
- `pnpm typecheck` — run TypeScript across the monorepo
- `pnpm build:static` — build the web + desktop + mobile demo pages
- `pnpm build:desktop` — build the Windows desktop installer

## Notes

- The project uses pnpm workspaces (`packages/*`).
- The server uses Node.js 22.5+ for the built-in `node:sqlite` module.
- Several external requirements (Stripe, Apple/Google developer accounts, code-signing certs, etc.) are documented in `EXTERNAL-REQUIREMENTS.md` and are not needed for the local demo.
