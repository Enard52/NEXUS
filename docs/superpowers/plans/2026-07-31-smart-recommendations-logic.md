# Smart Recommendations Logic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add non-design smart recommendation logic, ready-prompt chat handoff, filtering, and useful AI input actions without introducing the full premium UI screens yet.

**Architecture:** Keep the new intelligence in shared browser-side helpers so `stitch-smart.html` and `stitch-chat.html` can consume the same recommendation and prompt data. Reuse the existing smart tab layout and chat flow, only adding lightweight controls and state-driven rendering.

**Tech Stack:** Static HTML, inline browser JavaScript, shared `data.js`, Playwright verification scripts, localStorage state

## Global Constraints

- Do not build the premium smart-app detail screens in this phase.
- Do not add full device control pages or fake control behavior.
- Recommendation behavior must degrade cleanly when there are no paired devices.
- The result must keep working in both the root static files and mirrored `www/` / `mobile-app/www/` copies.

---

### Task 1: Add failing verification for smart recommendation logic

**Files:**
- Create: `scripts/verify-smart-recommendations.mjs`

**Interfaces:**
- Consumes: `http://127.0.0.1:8098/stitch-smart.html`, `http://127.0.0.1:8098/stitch-chat.html`
- Produces: CLI verification for recommendation rendering, direct prompt handoff, filters, and AI helper action

- [ ] **Step 1: Write the failing verification script**
- [ ] **Step 2: Run it to confirm current behavior fails**
- [ ] **Step 3: Keep the script as the regression harness for later tasks**

### Task 2: Add shared smart recommendation and prompt helpers

**Files:**
- Modify: `data.js`

**Interfaces:**
- Consumes: existing local device state, `nexusCustomAutomations`, `nexusCustomClickRun`
- Produces: `window.NEXUS_SMART_APP_TEMPLATES`, `window.getRecommendedSmartApps(limit)`, `window.getRecommendedQuickRuns(limit)`, `window.getSmartPromptById(id)`, `window.filterSmartCollection(items, filterKey)`

- [ ] **Step 1: Add a small smart-app template catalog with prompt metadata**
- [ ] **Step 2: Add device-profile helpers that infer recommendation categories from current devices**
- [ ] **Step 3: Add lightweight filtering helpers for user/system/recommended collections**

### Task 3: Wire recommendation logic and filters into `stitch-smart.html`

**Files:**
- Modify: `stitch-smart.html`

**Interfaces:**
- Consumes: `window.getRecommendedSmartApps`, `window.getRecommendedQuickRuns`, `window.filterSmartCollection`
- Produces: dynamic recommendation list, recommended quick-run list, filter chip behavior, direct AI-create actions

- [ ] **Step 1: Replace the static three recommendation cards with dynamic rendering**
- [ ] **Step 2: Add a direct AI-create action on recommendation cards without adding the full detail-page design**
- [ ] **Step 3: Add recommended quick-run items beneath user scenarios**
- [ ] **Step 4: Add simple filters for Click-Run and Automation sections**

### Task 4: Add chat ready-prompt handoff and useful AI helper actions

**Files:**
- Modify: `stitch-chat.html`
- Modify: `stitch-home.html`
- Modify: `stitch-smart.html`

**Interfaces:**
- Consumes: query params such as `promptId`, `promptText`, `helper=ready-commands`
- Produces: chat auto-send on open, reusable helper action for currently idle AI input icon

- [ ] **Step 1: Teach chat to auto-send a prompt from query params or prompt id**
- [ ] **Step 2: Hook the Smart recommendation direct action to the chat prompt handoff**
- [ ] **Step 3: Make the idle AI input icon open a useful ready-command chat entry path**

### Task 5: Mirror files and verify end to end

**Files:**
- Modify: `www/data.js`
- Modify: `www/stitch-smart.html`
- Modify: `www/stitch-chat.html`
- Modify: `www/stitch-home.html`
- Modify: `mobile-app/www/data.js`
- Modify: `mobile-app/www/stitch-smart.html`
- Modify: `mobile-app/www/stitch-chat.html`
- Modify: `mobile-app/www/stitch-home.html`

**Interfaces:**
- Consumes: root source files
- Produces: synchronized preview copies and passing verification script

- [ ] **Step 1: Copy the updated root files into both preview directories**
- [ ] **Step 2: Run `node scripts/verify-smart-recommendations.mjs`**
- [ ] **Step 3: Do one final browser smoke test on the live preview**
