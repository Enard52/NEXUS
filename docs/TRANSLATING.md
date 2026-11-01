# Translating NEXUS

NEXUS ships in Turkish and English. Any other language is added by the community with **one dictionary file**
plus one registry line. No paid tool or account is needed, and a language you cannot verify yourself should
not be added.

## How it works

- The screens are written in Turkish. English is a dictionary (`src/app/lang-en.js`) applied at runtime.
- A community language is an **overlay** on top of English: `src/app/lang-<code>.js`.
  Every value you fill in replaces the English text; every value you leave `""` stays English.
  So a half-finished language is safe to ship; it never shows Turkish or blanks.
- Payment plans and the AI assistant follow the English base for every community language.

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

## Not covered yet (tracked as issues)

These surfaces are still fixed to Turkish/English; a language file alone does not translate them:

- The marketing site and the legal pages/PDFs (`scripts/site-build.mjs`, `scripts/site-content.mjs`,
  `scripts/legal-content.cjs`, `scripts/legal-pdf*.mjs`).
- The desktop menu and tray (`desktop/main.cjs`), push notification text sent from servers, and voice input
  (the speech-to-text worker accepts `tr`/`en` only).
- Messages assembled from several variables in code (not literal pairs) and the assistant's built-in local replies.
- Store listings and the checkout page (maintained in each store/Whop console by the owner).

Dates and numbers follow the `locale` you register. The language picker is a searchable full-screen list, so it
scales to many languages.
