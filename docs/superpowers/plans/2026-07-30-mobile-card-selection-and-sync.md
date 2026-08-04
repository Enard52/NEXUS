# Mobile Card Selection And Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the mobile `Kart Ekle` flow so users can add or remove dashboard cards from a selection screen, keep the home dashboard synced automatically, and fix small card readability issues without sending those items to Lovable.

**Architecture:** Keep the existing static mobile HTML flow, but move card visibility into one shared localStorage-backed model consumed by both `stitch-home.html` and `stitch-cards.html`. Preserve full-page design requests in `docs/eksik-ekranlar.md`, while documenting that manual card selection and micro UI fixes are implemented in-code.

**Tech Stack:** Static HTML, Tailwind CDN classes, vanilla JavaScript, shared `data.js`, localStorage, existing preview server.

## Global Constraints

- Keep the mobile flow in static files under the workspace root and mirrored `www/` copies.
- Preserve existing Turkish copy unless a small UI improvement needs clearer wording.
- Use the existing local device sources (`nexusPairedDevices`, `nexusDashboardCards`) instead of inventing a new backend.
- Small usability fixes stay in code; only full-screen flows stay in `docs/eksik-ekranlar.md` for later Lovable design work.

---

### Task 1: Define Shared Card Catalog And Visibility Helpers

**Files:**
- Modify: `data.js`
- Modify: `www/data.js`
- Test: manual browser verification on `stitch-home.html` and `stitch-cards.html`

**Interfaces:**
- Consumes: localStorage keys `nexusHiddenCards`, `nexusPairedDevices`, `nexusDashboardCards`
- Produces: `window.NEXUS_CARD_CATALOG`, `window.getSelectedSmartHomeCards()`, `window.setSmartHomeCardSelected(id, selected)`, `window.getTapToRunCards()`

- [ ] **Step 1: Write the failing test**

Use a manual repro note:

```text
Open /stitch-cards.html.
Expected today: there is no tabbed selectable add-card list matching the new spec.
Open /stitch-home.html.
Expected today: removing or adding cards is not driven by one shared selection model.
```

- [ ] **Step 2: Run test to verify it fails**

Run: open `http://192.168.1.4:8098/stitch-cards.html`
Expected: FAIL because the page shows the old “Favoriler / Cihaz Kartları” editor, not the new add-card picker.

- [ ] **Step 3: Write minimal implementation**

Add shared helpers in both `data.js` files:

```js
window.NEXUS_CARD_CATALOG = {
  smartHome: [
    { id: "weather", title: "Hava Durumu Hizmeti", icon: "sun", homeCard: true },
    { id: "ai-protect", title: "AI Protect", icon: "shield", homeCard: false },
    { id: "energy", title: "AI Enerji Tasarrufu", icon: "bolt", homeCard: true },
    { id: "dnd", title: "Do-Not-Disturb", icon: "bell-off", homeCard: true }
  ],
  tapToRun: [
    { id: "good-morning", title: "Günaydın Rutini", icon: "play-circle" }
  ]
};

window.getSelectedSmartHomeCards = function () { ... };
window.setSmartHomeCardSelected = function (id, selected) { ... };
window.getTapToRunCards = function () { ... };
```

- [ ] **Step 4: Run test to verify it passes**

Run: reload `http://192.168.1.4:8098/stitch-cards.html`
Expected: helper globals exist in DevTools and no console errors occur.

- [ ] **Step 5: Commit**

```bash
git add data.js www/data.js
git commit -m "feat: add shared mobile card selection helpers"
```

### Task 2: Rebuild The Add Card Screen

**Files:**
- Modify: `stitch-cards.html`
- Modify: `www/stitch-cards.html`
- Test: manual browser verification on `stitch-cards.html`

**Interfaces:**
- Consumes: `window.NEXUS_CARD_CATALOG`, `window.getSelectedSmartHomeCards()`, `window.setSmartHomeCardSelected()`, `getLocalDevices()`
- Produces: tabbed add-card UI with `Smart Home`, `Devices`, `Tap-to-Run`, plus `Ekle` action that returns to home

- [ ] **Step 1: Write the failing test**

Use a manual repro note:

```text
Open /stitch-cards.html.
Expected: a top bar with İptal, Add Card, Ekle; tab strip; selectable rows; selected rows ticked.
Current: old card editor layout.
```

- [ ] **Step 2: Run test to verify it fails**

Run: open `http://192.168.1.4:8098/stitch-cards.html`
Expected: FAIL because the current screen does not match the requested flow.

- [ ] **Step 3: Write minimal implementation**

Replace the old content with:

```html
<header>İptal | Add Card | Ekle</header>
<nav>Smart Home / Devices / Tap-to-Run</nav>
<section id="card-picker-list"></section>
```

and render rows from JS:

```js
function renderPickerTab(tab) {
  // Smart Home -> shared catalog rows
  // Devices -> paired devices list with selected state
  // Tap-to-Run -> routine shortcuts
}

function commitSelection() {
  localStorage.setItem("nexusHiddenCards", JSON.stringify(nextHidden));
  location.href = "stitch-home.html";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: reload `http://192.168.1.4:8098/stitch-cards.html`
Expected: screen visually matches the requested iPhone picker structure and `Ekle` returns to home.

- [ ] **Step 5: Commit**

```bash
git add stitch-cards.html www/stitch-cards.html
git commit -m "feat: rebuild mobile add-card picker"
```

### Task 3: Sync Home Cards And Improve Card Readability

**Files:**
- Modify: `stitch-home.html`
- Modify: `www/stitch-home.html`
- Modify: `data.js`
- Modify: `www/data.js`
- Test: manual browser verification on `stitch-home.html`

**Interfaces:**
- Consumes: `nexusHiddenCards`, shared card helpers, local weather text, local devices
- Produces: synced card visibility and improved two-line weather/status presentation

- [ ] **Step 1: Write the failing test**

Use a manual repro note:

```text
Open /stitch-home.html.
Expected: weather and DND card info should remain readable when long.
Current: weather text is truncated into one line and selection changes from add-card do not use a richer synced presentation.
```

- [ ] **Step 2: Run test to verify it fails**

Run: open `http://192.168.1.4:8098/stitch-home.html`
Expected: FAIL because weather uses a single `truncate` line and card visibility feels brittle.

- [ ] **Step 3: Write minimal implementation**

Update the weather and DND card text blocks:

```html
<p class="text-slate-500 text-sm font-medium leading-5 min-h-[2.5rem]" id="weather-location">...</p>
```

and update sync logic:

```js
function getSelectedSmartHomeCardIds() { ... }
function syncHomeStaticCards() { ... }
```

- [ ] **Step 4: Run test to verify it passes**

Run: reload `http://192.168.1.4:8098/stitch-home.html`
Expected: weather copy wraps cleanly, DND remains readable, and toggling cards in add-card screen updates home after returning.

- [ ] **Step 5: Commit**

```bash
git add stitch-home.html www/stitch-home.html data.js www/data.js
git commit -m "fix: sync home cards and improve card readability"
```

### Task 4: Update Missing Screens Documentation

**Files:**
- Modify: `docs/eksik-ekranlar.md`
- Test: manual markdown review

**Interfaces:**
- Consumes: approved scope from the user
- Produces: updated doc that keeps only full-page design requests plus note for implemented manual card flow and micro fixes

- [ ] **Step 1: Write the failing test**

Use a manual repro note:

```text
Open docs/eksik-ekranlar.md.
Expected: document should mention that manual add-card flow and small card readability fixes are implemented in code and do not need Lovable.
Current: that note does not exist.
```

- [ ] **Step 2: Run test to verify it fails**

Run: read `docs/eksik-ekranlar.md`
Expected: FAIL because the document only lists missing full-page screens.

- [ ] **Step 3: Write minimal implementation**

Add a short section like:

```md
## Tasarım gerektirmeyen uygulanan akışlar

- Kart Ekle: manuel seçim, sekmeler, anasayfa senkronu kod ile uygulandı.
- Hava durumu / Rahatsız Etme kartı okunabilirlik iyileştirmeleri kod ile çözüldü.
```

- [ ] **Step 4: Run test to verify it passes**

Run: read `docs/eksik-ekranlar.md`
Expected: section exists and clearly separates code-fixed micro flows from full-page design work.

- [ ] **Step 5: Commit**

```bash
git add docs/eksik-ekranlar.md
git commit -m "docs: clarify implemented mobile card flows"
```
