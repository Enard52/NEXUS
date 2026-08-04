# Desktop Shell Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the local desktop experience into one coherent, polished shell by keeping `public/desktop-home.html` as the canonical 4179 preview and making the remaining desktop HTML outputs visually consistent with it.

**Architecture:** Use the 2nd screenshot as the shell reference: cleaner desktop chrome, better sidebar/menu rhythm, stronger layout alignment, and less fragmented navigation. Use the 1st screenshot as the content reference: richer right-side context, deeper device detail, and a more product-like information hierarchy. The implementation should keep one canonical desktop entrypoint for `localhost:4179`, then align or retire the other desktop HTML outputs so the project no longer has competing desktop designs.

**Tech Stack:** Static HTML, CSS, TypeScript build scripts, existing `pnpm` build pipeline, local file preview server, browser-based manual verification.

## Global Constraints

- `public/desktop-home.html` is the canonical desktop preview for `localhost:4179`.
- `public/index.html` and `public/tr/index.html` remain the web site entrypoints and must not be repurposed for desktop.
- Desktop output must remain dependency-free and offline-safe; no new external image/CDN dependencies may be introduced.
- Preserve Turkish and English desktop variants where they already exist and are intentionally used.
- Do not introduce new runtime dependencies or framework rewrites for this task.
- Keep the desktop shell deterministic: the same local files must render the same preview after every build.
- No fake decorative filler: every visible block must represent real navigation, real content, real device context, or a real action target.
- No placeholder-only UI: if a panel, badge, chip, or chart exists, it must either reflect existing data or be removed.
- Prefer honest simplicity over ornamental complexity when there is no functional payoff.

---

### Task 1: Lock the Canonical Desktop Entry

**Files:**
- Modify: `scripts/serve-desktop-preview.mjs`
- Modify: `scripts/copy-static.mjs`
- Inspect: `public/desktop-home.html`
- Inspect: `public/desktop/windows/index.html`
- Inspect: `public/desktop/mac/index.html`

**Interfaces:**
- Consumes: current `localhost:4179` preview path, current desktop HTML copies, static copy pipeline.
- Produces: one clearly documented canonical desktop entrypoint and a clear rule for whether secondary desktop HTMLs are aliases, generated copies, or deprecated.

- [ ] **Step 1: Audit the current entrypoints**

Run:
```bash
rg --files public | rg "desktop"
rg -n "desktop-home\.html|desktop/windows/index\.html|desktop/mac/index\.html" scripts public -g "*.mjs" -g "*.html"
```

Expected: one canonical preview path is identified, and the rest are clearly categorized as generated variants or leftovers.

- [ ] **Step 2: Decide the canonical path**

Keep `public/desktop-home.html` as the 4179 target unless a stronger reason emerges to replace it. Treat any remaining `public/desktop/*` files as secondary outputs only if they still serve a real purpose.

- [ ] **Step 3: Update the preview server to match that decision**

Make `scripts/serve-desktop-preview.mjs` serve the canonical file at `/` and log the same path so the preview behavior is obvious to anyone launching it.

- [ ] **Step 4: Update the static copy pipeline**

Make `scripts/copy-static.mjs` preserve the canonical desktop file if it is meant to stay in `public/`, and make sure it does not accidentally revive older desktop layouts as the default preview.

- [ ] **Step 5: Verify the routing**

Run:
```bash
node scripts/serve-desktop-preview.mjs
```

Expected: `http://127.0.0.1:4179/` opens the canonical desktop file and not an older desktop index.

### Task 2: Merge the Two Desktop Visual Directions

**Files:**
- Modify: `public/desktop-home.html`
- Modify: `public/desktop-home.html` embedded CSS and layout markup only

**Interfaces:**
- Consumes: the 2 screenshot references, the current desktop shell markup, the current sidebar/content/detail panel structure.
- Produces: one refined desktop shell with the cleaner menu rhythm of the 2nd screenshot and the richer content density of the 1st screenshot.

- [ ] **Step 1: Preserve the better shell and menu cadence**

Keep the desktop chrome from the cleaner desktop shell: centered title bar behavior, clearer sidebar hierarchy, calmer spacing, and tighter menu alignment.

- [ ] **Step 2: Rebuild the content density**

Use the richer desktop as the content reference: keep a detailed right panel, a useful bottom device strip, and contextual status information, but reduce the number of hard-bordered mini-panels so the page feels less boxy.
All visible content in the rebuilt shell must be driven by real local data or existing build models, not decorative placeholders.

- [ ] **Step 3: Smooth the card language**

Merge adjacent pieces of related content into fewer, stronger containers so the page reads like a single product surface instead of a grid of unrelated boxes.
Avoid adding empty shells, fake highlights, or purely cosmetic widgets that do not serve a real user action or state.

- [ ] **Step 4: Tune typography and spacing**

Adjust heading scale, section gaps, and data-row padding so the desktop feels more premium and less compressed. Preserve the strong contrast and local-first feel, but make the layout breathe more.

- [ ] **Step 5: Fix encoding and text rendering issues**

Normalize any mojibake-looking characters in the HTML source or comments so the file is clean when opened in an editor and consistent when served locally.
Do not hide encoding issues behind CSS tricks or replacement glyphs; fix the source text or regenerate the affected markup.

- [ ] **Step 6: Validate visually**

Open `http://localhost:4179` and compare the desktop shell against the two reference screenshots. The target is: cleaner menu structure from the 2nd image plus richer content from the 1st image, without the scattered boxiness of either one.

### Task 3: Align the Remaining Desktop HTML Outputs

**Files:**
- Modify: `packages/desktop/src/index.ts`
- Modify: `packages/desktop/src/utils.ts` if shared shell helpers need it
- Modify: `packages/desktop/src/setup.ts` if setup pages inherit the same chrome
- Modify: `public/desktop/windows/index.html` and sibling desktop outputs only if they remain required
- Modify: `public/desktop/mac/index.html` and sibling desktop outputs only if they remain required

**Interfaces:**
- Consumes: the canonical desktop shell from Task 2, the current desktop build output, and the existing platform-specific desktop renderer.
- Produces: either a shared desktop look across the remaining desktop HTML files or a deliberate deprecation of the ones that are no longer needed.

- [ ] **Step 1: Map which desktop files are still genuinely used**

Decide whether the extra `public/desktop/windows/*` and `public/desktop/mac/*` files are real targets, preview-only artifacts, or stale duplicates.

- [ ] **Step 2: Extract the shared shell rules**

Move the common desktop chrome, sidebar cadence, spacing, and title-bar behavior into a shared desktop shell shape so the non-4179 outputs do not drift away from the canonical design.

- [ ] **Step 3: Update the desktop renderer**

Refactor the desktop renderer so it uses the same shell feel as `public/desktop-home.html`, even if the content body differs by platform or locale.

- [ ] **Step 4: Decide on duplicates**

If the extra desktop HTMLs add no value, remove them from the default public surface. If they are still needed, make them deliberate aliases or clearly derived variants rather than a second competing design.

- [ ] **Step 5: Build and inspect**

Run:
```bash
pnpm build:static
```

Expected: the desktop outputs rebuild cleanly and no older desktop shell becomes the accidental default again.

### Task 4: Regression Checks and Cleanup

**Files:**
- Modify: `scripts/verify-premium-static.mjs` if a desktop check belongs there
- Add: `scripts/verify-desktop-shell.mjs` if a dedicated check is clearer
- Modify: `public/desktop-home.html` only for final polish discovered during verification

**Interfaces:**
- Consumes: canonical preview route, desktop build outputs, screenshot references, existing static build artifacts.
- Produces: a repeatable verification path that catches stale desktop shells, broken routing, and obvious layout regressions.

- [ ] **Step 1: Search for stale desktop paths**

Run:
```bash
rg -n "desktop-home\.html|desktop/windows/index\.html|desktop/mac/index\.html" scripts public packages -g "*.ts" -g "*.mjs" -g "*.html"
```

Expected: only intentional references remain.

- [ ] **Step 2: Check for visual regressions**

Open the desktop preview in a browser, compare it against the approved direction, and confirm the menu/sidebar/content balance still feels coherent at the current viewport.
Also verify that every visible card or control corresponds to real app state, real navigation, or a real device/action, not a design-only ornament.

- [ ] **Step 3: Confirm build integrity**

Run:
```bash
pnpm exec vitest run packages/server/src/marketing-premium.test.ts
pnpm build:static
```

Expected: tests pass and static output regenerates without reintroducing the old desktop shell.

- [ ] **Step 4: Final cleanup**

Remove any obsolete desktop references or helper scripts that are no longer needed after the unification work is complete.
