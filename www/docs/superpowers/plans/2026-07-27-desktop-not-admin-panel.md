# Desktop Not Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the NEXUS desktop experience so it feels like a real local desktop application instead of a website-style admin panel, while keeping `public/desktop-home.html` as the canonical `localhost:4179` preview.

**Architecture:** Treat `public/desktop-home.html` and `public/desktop/windows/index.html` as the same canonical desktop surface for now because they are byte-identical today. Replace the admin-dashboard information architecture with a desktop-app shell: stronger workspace framing, fewer navigation buckets, more device/task-centric grouping, calmer content density, and honest local-app affordances. Then align any remaining generated desktop HTML outputs to the same shell so the project has one coherent desktop language.

**Tech Stack:** Static HTML, embedded CSS, local JavaScript interactions, existing `pnpm` static build pipeline, preview server on port `4179`.

## Global Constraints

- `public/desktop-home.html` remains the canonical desktop preview served at `http://127.0.0.1:4179/`.
- `public/desktop-home.html` and `public/desktop/windows/index.html` currently render the same content; changes must either preserve that alignment or intentionally replace the duplication with a clearer rule.
- The result must feel like a desktop product shell, not a web admin dashboard.
- No fake decorative filler: every visible panel must map to a real device view, a real action, a real status surface, or a real navigation destination.
- No placeholder-only widgets, fake analytics, or cosmetic cards that exist only to occupy space.
- No empty interactive surfaces: if a card, tab, drawer, chip, or button can be seen or clicked, it must reveal real content, perform a real action, or be removed.
- Preserve local/offline behavior and do not introduce new remote asset dependencies.
- Keep English and Turkish desktop outputs visually consistent if both remain in use.
- `public/index.html` and the rest of the web marketing pages must not be repurposed as desktop entrypoints.

---

### Task 1: Audit Why the Current Desktop Reads as an Admin Panel

**Files:**
- Inspect: `public/desktop-home.html`
- Inspect: `public/desktop/windows/index.html`
- Inspect: `scripts/serve-desktop-preview.mjs`
- Inspect: `packages/desktop/src/index.ts`

**Interfaces:**
- Consumes: the current desktop preview, the generated desktop renderer, and the 4179 preview entrypoint.
- Produces: a concrete list of the UI patterns that make the desktop feel like an admin panel instead of an application workspace.

- [ ] **Step 1: Confirm the current canonical files**

Run:
```bash
Get-FileHash public\desktop-home.html
Get-FileHash public\desktop\windows\index.html
```

Expected: determine whether both desktop entry files are identical or already diverging.

- [ ] **Step 2: Identify the admin-panel signals**

Inspect the desktop shell and list which of these are present:

```text
- Over-segmented sidebar with too many category buckets
- Dashboard-first “Today / stats / billing / admin” hierarchy
- Grid-of-panels reading pattern instead of task/workspace flow
- Generic admin labels like “Plan & billing”, “Admin dashboard”, “Platforms”
- Too many equally weighted cards competing for attention
```

Expected: a short diagnosis that explains why the page reads like a web backoffice.

- [ ] **Step 3: Record the canonical preview rule**

Verify that:

```bash
rg -n "desktop-home\.html|desktop/windows/index\.html" scripts public -g "*.mjs" -g "*.html"
```

Expected: `scripts/serve-desktop-preview.mjs` clearly points `4179` to `public/desktop-home.html`.

### Task 2: Redefine the Desktop Product Architecture

**Files:**
- Modify: `docs/superpowers/plans/2026-07-27-desktop-not-admin-panel.md`
- Inspect: `public/desktop-home.html`
- Inspect: `packages/desktop/src/index.ts`

**Interfaces:**
- Consumes: the current shell structure and the desired design direction.
- Produces: a target desktop information architecture that is product-centric instead of dashboard-centric.

- [ ] **Step 1: Replace dashboard-first navigation with workspace-first navigation**

Adopt this navigation model as the target:

```text
Primary:
- Home
- Rooms
- Devices
- Automations
- Assistant

Secondary:
- Household
- Settings
- Updates
- Help
```

Expected: the desktop reads like something you operate, not something you administer.

- [ ] **Step 2: Reframe the main content as a workspace**

Use this screen structure:

```text
- Main stage: selected room/device/scene
- Context rail: active device or room controls
- Bottom strip: quick switching between recent devices/scenes
- Utility layer: assistant input, alerts, local-processing status
```

Expected: one strong primary focus area, one contextual control area, one secondary quick-access area.

- [ ] **Step 3: Remove admin-style content priorities**

De-emphasize or relocate these surfaces away from the primary view:

```text
- Billing
- Family management
- Admin dashboard
- Platform catalog
- Generic KPI/stat cards
```

Expected: account and system-management views exist, but they no longer define the product’s first impression.

### Task 3: Rebuild the Canonical Desktop Shell

**Files:**
- Modify: `public/desktop-home.html`
- Modify: `packages/desktop/src/index.ts`
- Modify: `packages/desktop/src/utils.ts` if shared shell helpers need updates

**Interfaces:**
- Consumes: the new workspace-first architecture from Task 2.
- Produces: a desktop shell with real app framing, calmer hierarchy, and fewer website/admin cues.

- [ ] **Step 1: Rewrite the sidebar hierarchy**

Replace the current long nav grouping with fewer, stronger sections. Keep labels product-oriented and local-device oriented.

- [ ] **Step 2: Rebuild the header/titlebar behavior**

Make the top chrome feel native-app-like:

```text
- product title or current workspace
- subtle environment status
- minimal utility actions
- no marketing/web-style top navigation patterns
```

- [ ] **Step 3: Merge the central content into fewer, larger surfaces**

Reduce the “many medium cards” layout. Convert the center into a stronger stage:

```text
- hero workspace panel
- contextual detail rail
- compact bottom switcher
```

Expected: the eye lands on one main task, not a dashboard matrix.

- [ ] **Step 4: Keep only real controls and real local status**

Every retained control must map to an actual action, such as:

```text
- temperature or scene control
- quick switch between recent devices
- assistant prompt
- local processing / device connectivity status
```

Remove anything that behaves like generic admin reporting unless it lives in a dedicated management view.
Also remove or fully implement any card that currently opens to empty content, empty detail states, or non-functional placeholder shells.

- [ ] **Step 5: Normalize source text and copy**

Fix any encoding issues and rewrite labels that sound like a website/admin product. Prefer language that sounds like a household operating system.

### Task 4: Align the Generated Desktop Outputs

**Files:**
- Modify: `packages/desktop/src/index.ts`
- Modify: `packages/desktop/src/setup.ts` if setup pages inherit the desktop chrome
- Modify: `scripts/copy-static.mjs`
- Inspect/Modify: `public/desktop/windows/index.html`
- Inspect/Modify: `public/desktop/mac/index.html`

**Interfaces:**
- Consumes: the canonical shell update from Task 3 and the current desktop build pipeline.
- Produces: one consistent desktop language across the generated static outputs.

- [ ] **Step 1: Move the visual fixes into the source renderer**

Do not leave the canonical experience as a one-off hand-edited file if the generated outputs still create the older admin-shell behavior. Push the structural changes into `packages/desktop/src/index.ts`.

- [ ] **Step 2: Decide the duplicate-file rule**

Choose one of these and document it in code comments where needed:

```text
- desktop-home.html is the preview canonical, generated desktop files are downstream mirrors
- desktop-home.html is temporary and will later be replaced by generated desktop output
- generated desktop files remain platform variants, but must match the same shell language
```

Expected: no ambiguous “two desktop index files, two different design directions” state remains.

- [ ] **Step 3: Rebuild the desktop outputs**

Run:
```bash
pnpm build:static
```

Expected: regenerated desktop files reflect the new app-like shell instead of falling back to the admin-panel feel.

### Task 5: Verify the Result as a Desktop Product

**Files:**
- Inspect: `public/desktop-home.html`
- Inspect: generated `public/desktop/**` outputs
- Modify: verification scripts if a desktop-specific regression check is worth keeping

**Interfaces:**
- Consumes: final rebuilt desktop shell and preview route.
- Produces: verification that the result reads as a desktop application and not a dashboard.

- [ ] **Step 1: Launch the canonical preview**

Run:
```bash
node scripts/serve-desktop-preview.mjs
```

Expected: `http://127.0.0.1:4179/` serves the canonical desktop shell.

- [ ] **Step 2: Check the first-impression test**

Open the preview and answer these checks:

```text
- Does the page read as a workspace before it reads as analytics?
- Does the sidebar look like app navigation instead of admin IA?
- Is there one dominant task focus in the main stage?
- Are billing/admin/system views pushed to secondary importance?
- Do the controls feel tied to a real device or room?
- Can every visible clickable card or control open real content without landing in an empty state?
```

Expected: all answers should be “yes”.

- [ ] **Step 3: Run build regression checks**

Run:
```bash
pnpm build:static
pnpm exec vitest run packages/server/src/marketing-premium.test.ts
```

Expected: static assets rebuild cleanly and unrelated premium-page behavior remains intact.

- [ ] **Step 4: Remove stale admin-shell leftovers**

Search for obsolete labels or routes:

```bash
rg -n "Admin dashboard|Plan & billing|Platforms|Today" public packages/desktop/src -g "*.html" -g "*.ts"
```

Expected: only intentional management views keep those labels, and they no longer dominate the main desktop shell.

- [ ] **Step 5: Eliminate empty click targets**

Manually test every visible clickable card, quick action, tab, and rail item in the canonical desktop preview.

Expected: no click should land on a blank panel, dead placeholder, or decorative-only shell. Anything that fails this rule must be wired to real content or removed.

---

## Target Desktop Architecture (Task 2 Output)

> Produced by Task 2. This section is the decision-complete specification that Task 3 implements. Source of truth for the shell is `packages/desktop/src/premium-body.ts` (markup), `packages/desktop/src/premium-script.ts` (behavior + pages map), `packages/desktop/src/premium.ts` (EN/TR label pairs); the build lands in `public/desktop-home.html` and `public/desktop/windows/index.html` (byte-identical today).

### 1. Target sidebar

Replace the current 4-bucket / 12-item nav with two groups separated by a plain divider. **No bucket labels** ("Today", "Your system", "Household", "System" are all removed) — bucket labels are the single strongest admin-console cue.

```text
Primary (top group):
- Home         (view id: home)
- Rooms        (view id: rooms)      ← new view, see data rule below
- Devices      (view id: devices)
- Automations  (view id: automations) ← new view, absorbs suggestions + scenes
- Assistant    (view id: assistant)   ← new view, absorbs skills + agents + personalization

Secondary (bottom group, after divider):
- Household    (view id: household)   ← renamed from family
- Settings     (view id: settings)    ← new view, absorbs security + billing + platforms
- Updates      (view id: updates)
- Help         (view id: help)        ← renamed from support
```

Keep: the "Ask NEXUS AI" shortcut button above the nav (Ctrl K still focuses the compose bar in the current view; the **Assistant** nav item opens the dedicated full assistant view), and the sidebar-footer user menu ("Ensar Yılmaz · Owner · Family").

**Badge rule:** badges only where a real actionable count exists. Keep `Updates (1)`. Drop the `Home (6)` and `Suggestions (3)` badges — the underlying items surface inside Automations content instead of as nav decoration.

#### View-id mapping (every current view accounted for)

| Current view id | Richness (audit) | Destination | Disposition |
|---|---|---|---|
| `home` | RICH | `home` (Primary · Home) | Kept; restructured per §2, not rewritten |
| `suggestions` | MEDIUM | `automations` → "Suggestions" section | Merged: suggestion cards become the proactive feed inside Automations |
| `devices` | script-driven | `devices` (Primary · Devices) | Kept as-is (already product-centric) |
| `skills` | MEDIUM | `assistant` → "Skills" section | Merged |
| `agents` | MEDIUM | `assistant` → "Agents" section | Merged |
| `platforms` | THIN | `settings` → "Connections" section | Demoted + renamed; thin content stays thin, no filler added |
| `family` | THIN | `household` (Secondary · Household) | Renamed; keeps its member/access content as the whole view |
| `personalization` | MEDIUM | `assistant` → "Preferences" section | Merged (assistant name, wake word, tone, user memory are assistant config) |
| `security` | MEDIUM | `settings` → "Security & activity" section | Demoted |
| `billing` | THIN (3 of 4 tabs empty) | `settings` → "Plan" section | Demoted; tab bar deleted, only the populated Overview content survives (see §3) |
| `updates` | THIN | `updates` (Secondary · Updates) | Kept |
| `support` | MEDIUM | `help` (Secondary · Help) | Renamed |

New view ids introduced: `rooms`, `automations`, `assistant`, `household`, `settings`, `help`. Retired view ids: `suggestions`, `skills`, `agents`, `platforms`, `family`, `personalization`, `security`, `billing`, `support`.

**Sync rule (mandatory):** view switching is `data-view`-attribute based; the `pages` map in `premium-script.ts` (currently L163–L176) maps view id → `[eyebrow, title]`. Task 3 must keep three things in lockstep for every view: sidebar `data-view` attr ↔ `pages` map key ↔ `<section class="view" id="…">` id. Target `pages` map:

```text
home:        ["Good evening, Ensar", "Your home"]
rooms:       ["Your home, by space", "Rooms"]
devices:     ["Everything connected, locally", "Devices"]
automations: ["Scenes, routines & suggestions", "Automations"]
assistant:   ["NEXUS AI · runs on this device", "Assistant"]
household:   ["People & access", "Household"]
settings:    ["Security, plan & connections", "Settings"]
updates:     ["Windows distribution", "Updates"]
help:        ["Onboarding & diagnostics", "Help"]
```

**Merged-view structure rule:** `assistant` and `settings` are single scrollable views with anchored section headers — **not** tab bars. This guarantees every visible section is populated (no empty-tab regression). If Task 3 adds a segmented control anyway, every segment must render populated content, else use plain sections.

**Rooms data rule (no fake filler):** the `rooms` view is generated strictly from the existing device metadata already in `premium-script.ts` (the `devices` object, L32: hue, nest, sonos, nuki, roborock — each carries a `room` field; the "Living room · 3 local devices" context string lives in the stage markup at `premium-body.ts` L477). Rooms shown = only rooms that actual devices belong to. If the data yields a single room today, the view shows that one room honestly plus its device grid — do **not** invent bedrooms/kitchens. The room switcher reuses the existing `studio-modes` grouping logic (Living room / All devices / By capability).

### 2. Workspace screen structure (Home view)

The home view already contains the right building blocks (audit: L466–L1137 of `premium-body.ts`). Task 3 is a **restructure of existing components, not a rewrite**:

| Target layer | Existing component to reuse | Role |
|---|---|---|
| Main stage | `studio-stage` (greeting, "Living room · 82°F · 3 local devices", `device-story` w/ Nest thermostat) | Single dominant focus: the selected room/device/scene. `studio-modes` tabs become the stage's room/scope switcher |
| Context rail | `context-drawer` aside (level-control, live context, diagnostics) | Controls for whatever the stage has selected; stays contextual, never a stats panel |
| Bottom strip | `device-ribbon` (hue, nest, sonos, nuki, roborock — local base64 webp thumbnails) + `studio-scenes` chips | Quick switching between recent devices and scenes |
| Utility layer | `nexus-compose` bar + `compose-prompts` ("Lock up", "Explain energy", "Create routine") + topbar `core-state` ("Local Core ready · 6 of 8 devices online") + notifications icon-button | Assistant input, alerts, local-processing status |

Hierarchy rule: exactly one primary focus (stage), one contextual control area (rail), one secondary quick-access area (strip). Nothing in the home view may be a generic KPI/stat card; numbers appear only attached to a device, room, or action (e.g. temperature on the stage, device counts in `core-state`).

### 3. Admin de-emphasis rules

- **Billing:** lives only as the "Plan" section inside `settings`. The current tab nav ("Overview / Invoices / Payment method / Usage") is **deleted**; only the populated Overview content (plan-hero: "NEXUS Family / $24/month / Manage plan") is kept as a single flat section. Rule: collapse to one populated view — zero empty tabs survive. Invoices/Payment/Usage return only if and when real content exists for them (out of scope for this plan).
- **Family management:** exists as `household` in the Secondary group; never appears in the Primary group or on the home stage.
- **Platform catalog:** current `platforms` view is thin; it becomes the "Connections" section inside `settings`, framed as "which ecosystems this home talks to", not a marketplace grid.
- **Admin dashboard:** the string does not exist anywhere in the codebase (verified in Task 1); nothing to remove, and Task 3 must not introduce one.
- **Generic KPI/stat cards:** banned from `home` and `rooms`. Where sub-views currently use uniform flat data-row admin listings (audit finding d), Task 3 reworks them into grouped, purpose-labeled sections — but only using content that already exists.
- Secondary views keep full functionality; de-emphasis is about position and framing, not deletion.

### 4. Label & copy direction

Voice: a household operating system you operate, not a SaaS backoffice you administer. Every renamed or new label needs an **EN + TR pair in `premium.ts`** (existing pattern, e.g. `["Plan & billing", "Plan ve faturalama"]`). Specific renames:

| Current EN | New EN | New TR |
|---|---|---|
| Home | Home | Ev |
| — (new) | Rooms | Odalar |
| Devices | Devices | Cihazlar |
| — (new) | Automations | Otomasyonlar |
| — (new) | Assistant | Asistan |
| Family & access | Household | Ev halkı |
| — (new) | Settings | Ayarlar |
| Updates | Updates | Güncellemeler |
| Help & support | Help | Yardım |
| Plan & billing | Plan (section in Settings) | Plan |
| Household subscription (billing eyebrow) | Your NEXUS plan | NEXUS planınız |
| Platforms | Connections (section in Settings) | Bağlantılar |
| Security & activity | Security & activity (section in Settings) | Güvenlik ve etkinlik |
| Suggestions | Suggestions (section in Automations) | Öneriler |
| Skills | Skills (section in Assistant) | Yetenekler |
| Agents | Agents (section in Assistant) | Ajanlar |
| Personalization | Preferences (section in Assistant) | Tercihler |

Eyebrow strings introduced or renamed by the target `pages` map (§1) also need EN + TR pairs:

| View | New EN eyebrow | New TR eyebrow |
|---|---|---|
| rooms | Your home, by space | Eviniz, alanlara göre |
| devices (renamed from "Universal Capability Fabric") | Everything connected, locally | Her şey bağlı, yerel olarak |
| automations | Scenes, routines & suggestions | Sahneler, rutinler ve öneriler |
| assistant | NEXUS AI · runs on this device | NEXUS AI · bu cihazda çalışır |
| household | People & access | Kişiler ve erişim |
| settings | Security, plan & connections | Güvenlik, plan ve bağlantılar |

`home`, `updates`, and `help` keep their existing eyebrow pairs (help inherits support's current pair).

Nav group labels "Today" / "Your system" / "Household" / "System": removed entirely (both EN and TR variants). Task 3 must sweep `premium.ts` so retired labels don't linger as dead pairs, and both language outputs stay visually consistent (global constraint).

### 5. Constraints restated (binding on Task 3)

- `public/desktop-home.html` stays the canonical preview at `http://127.0.0.1:4179/` (`scripts/serve-desktop-preview.mjs` maps `/` → `/desktop-home.html`); `scripts/copy-static.mjs` copies `packages/desktop/dist/windows/index.html` → `public/desktop-home.html`, so all changes go into `packages/desktop/src`, never hand-edited into `public/`.
- No empty interactive surfaces: every nav item, section, chip, and button lands on populated, real content — the billing tab collapse in §3 is the model.
- No fake filler: merged sections carry over existing content only; thin views are demoted, never padded.
- Offline/local only: no new remote assets; keep the existing local base64 device imagery.
- EN/TR pairs for every visible string, per §4.
- `public/index.html` and web marketing pages remain untouched.
