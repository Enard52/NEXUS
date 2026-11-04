# Translating NEXUS

NEXUS ships in 68 languages across the application and the marketing website. A new or updated language is added with **one dictionary file**
plus one registry line. No paid tool or account is needed, and a language you cannot verify yourself should
not be added.

## How it works

- The application uses runtime localization overlays (`src/app/lang-<code>.js`) supporting 68 languages.
- The marketing website and legal pages are pre-rendered for all 68 languages in `scripts/site-content.<kod>.mjs` and `scripts/legal-translations/<kod>.json`.
- When any string is missing, it safely falls back to English without breaking layout or showing blanks.
- Payment plans and the AI assistant follow local currency and language preferences.

## Add a language

1. Pick the code (`de`, `es`, `pt-BR`, `ar`, ...).
2. Generate the skeleton (values empty, English reference in `// EN:` comments):

   ```bash
   node scripts/lang-tool.mjs new de
   ```

3. Fill in the values of `text`, `html`, `slots` and `patterns` (keep `{0}`, `{name}`, `$1` and HTML tags exactly
   as in the English reference). `text` also contains the messages the app builds in code (notifications, dialogs).
   The assistant answers in your language automatically once the language is registered.
4. Check it:

   ```bash
   node scripts/lang-tool.mjs check de
   ```

   It reports the coverage and any broken placeholder or unknown key.
5. Register the language in `src/app/theme.js`, in `COMMUNITY_LANGS` (one line, for example
   `de: { name: 'Deutsch', locale: 'de-DE' }`; add `rtl: true` for Arabic/Hebrew).
6. Sync the mirrors (never edit `www/` by hand) and run the gates:

   ```bash
   node scripts/sync-www.mjs
   npx vitest run packages/web/src/community-language.test.ts
   ```

7. Open a PR. Say who verified the text (native speaker or not) in the PR body. Machine-translated text must
   be reviewed by a person before it is merged.

The language then appears in Settings, Language, and is chosen automatically for devices set to it.

## Localization scope

The application and marketing site support 68 languages out of the box:

- The desktop app, web app and mobile app share the 68 community language dictionaries.
- Legal documents (privacy, terms, refund) and marketing pages are pre-rendered across all 68 languages.
- The language picker in Settings offers full-text search across all 68 languages.

Dates and numbers follow the `locale` you register. The language picker is a searchable full-screen list, so it
scales to many languages.
