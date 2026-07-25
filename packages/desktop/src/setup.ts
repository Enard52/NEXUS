/**
 * NEXUS AI — Desktop Setup Wizard
 *
 * Renders a fully branded, 5-step installer window as a standalone HTML
 * document.  Steps are navigated by an inline script; the progress bar on
 * the "Installing" step animates from 0 → 100% via a CSS keyframe.
 *
 * Pure data → HTML string: no runtime dependencies, fully unit-testable.
 */

import { getTheme, type ThemeName } from "@nexus/design-system";
import { escapeHtml, label, renderLogo, renderStyles, setLocale, CURRENT_LOCALE } from "@nexus/web";
import { type Locale } from "@nexus/i18n";
import { renderWindowControls } from "./utils.js";

// ── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "license", label: "License" },
  { id: "location", label: "Location" },
  { id: "installing", label: "Installing" },
  { id: "finish", label: "Finish" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// ── CSS ──────────────────────────────────────────────────────────────────────

function renderSetupStyles(themeName: ThemeName): string {
  const t = getTheme(themeName);
  const base = renderStyles(t);

  const extra = `
/* ── Setup window shell ─────────────────────────────────────────────────── */
body.setup {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--bg);
  font-family: ${t.font.family};
  color: var(--text);
  margin: 0;
}
.setup-window {
  width: 720px;
  height: 520px;
  display: flex;
  flex-direction: column;
  border: 1px solid color-mix(in srgb, var(--border-strong) 50%, transparent);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  background: var(--surface);
}
/* title bar */
.setup-window .titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${t.space[3]}px ${t.space[4]}px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}
.setup-window .title {
  font-size: ${t.font.size.sm}px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.04em;
}
/* two-pane body */
.setup-body {
  display: flex;
  flex: 1;
  min-height: 0;
}
/* ── Left rail ──────────────────────────────────────────────────────────── */
.setup-rail {
  width: 220px;
  flex: none;
  display: flex;
  flex-direction: column;
  padding: ${t.space[6]}px ${t.space[5]}px;
  border-right: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  background: linear-gradient(160deg, color-mix(in srgb, var(--tint) 20%, transparent), transparent);
  gap: ${t.space[6]}px;
}
.setup-brand {
  display: flex;
  align-items: center;
  gap: ${t.space[3]}px;
}
.setup-brand .brand-name {
  font-size: ${t.font.size.md}px;
  font-weight: 700;
  letter-spacing: 0.06em;
}
/* stepper */
.steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${t.space[2]}px;
}
.steps li {
  display: flex;
  align-items: center;
  gap: ${t.space[3]}px;
  padding: ${t.space[2]}px ${t.space[3]}px;
  border-radius: var(--radius);
  font-size: ${t.font.size.sm}px;
  font-weight: 500;
  color: var(--muted);
  transition: background 0.18s, color 0.18s;
}
.steps li .step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid var(--border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex: none;
  transition: background 0.18s, border-color 0.18s, color 0.18s;
}
.steps li.active {
  color: var(--text);
  background: var(--tint);
}
.steps li.active .step-num {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--on-primary);
}
.steps li.done .step-num {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--on-primary);
  font-size: 0;
  box-shadow: 0 0 8px color-mix(in srgb, var(--primary) 40%, transparent);
  position: relative;
}
.steps li.done .step-num::after {
  content: "✓";
  font-size: 12px;
}
/* ── Right content area ─────────────────────────────────────────────────── */
.setup-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.step {
  display: none;
  flex-direction: column;
  gap: ${t.space[4]}px;
  padding: ${t.space[6]}px;
  flex: 1;
  overflow-y: auto;
}
.step.active {
  display: flex;
}
.step h2 {
  margin: 0;
  font-size: ${t.font.size.xl}px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.step p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}
/* welcome bullet list */
.setup-bullets {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${t.space[3]}px;
}
.setup-bullets li {
  display: flex;
  align-items: flex-start;
  gap: ${t.space[3]}px;
  font-size: ${t.font.size.md}px;
}
.setup-bullets li::before {
  content: "✦";
  color: var(--primary);
  flex: none;
  margin-top: 1px;
}
/* license box */
.license-box {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  padding: ${t.space[4]}px;
  font-size: ${t.font.size.sm}px;
  line-height: 1.7;
  color: var(--muted);
}
/* checkbox row */
.check-row {
  display: flex;
  align-items: center;
  gap: ${t.space[2]}px;
  font-size: ${t.font.size.md}px;
  cursor: pointer;
}
.check-row input[type="checkbox"] {
  accent-color: var(--primary);
  width: 16px;
  height: 16px;
  cursor: pointer;
}
/* location field */
.field {
  display: flex;
  gap: ${t.space[2]}px;
}
.field input[type="text"] {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  padding: ${t.space[3]}px ${t.space[4]}px;
  font-size: ${t.font.size.md}px;
  color: var(--text);
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field input[type="text"]:focus {
  border-color: var(--primary);
  box-shadow: var(--ring);
}
.field .btn-browse {
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  padding: ${t.space[3]}px ${t.space[4]}px;
  font-size: ${t.font.size.sm}px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: background 0.15s;
}
.field .btn-browse:hover { background: var(--tint); }
.disk-info {
  font-size: ${t.font.size.sm}px;
  color: var(--muted);
}
/* progress */
.progress {
  height: 8px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--primary);
  width: 0%;
  box-shadow: 0 0 8px color-mix(in srgb, var(--primary) 55%, transparent);
}
@keyframes nx-install {
  0%   { width: 0%; }
  18%  { width: 24%; }
  45%  { width: 55%; }
  70%  { width: 78%; }
  90%  { width: 92%; }
  100% { width: 100%; }
}
.progress-fill.running {
  animation: nx-install 4.2s var(--transition-spring) forwards;
}
.status-line {
  font-size: ${t.font.size.sm}px;
  color: var(--muted);
}
/* finish checkmark */
.finish-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--tint);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
/* footer */
.setup-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${t.space[4]}px ${t.space[6]}px;
  border-top: 1px solid var(--border);
  background: var(--bg);
}
.footer-right {
  display: flex;
  gap: ${t.space[3]}px;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${t.space[2]}px;
  padding: ${t.space[3]}px ${t.space[5]}px;
  border-radius: var(--radius);
  font-size: ${t.font.size.md}px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  border: none;
  transition: opacity 0.15s, box-shadow 0.15s;
}
.btn-ghost {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
}
.btn-ghost:hover { background: var(--surface); color: var(--text); }
.btn-primary {
  background: var(--primary);
  color: var(--on-primary);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 38%, transparent);
}
.btn-primary:hover { opacity: 0.88; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
`;

  return `${base}\n${extra}`;
}

// ── Step content renderers ────────────────────────────────────────────────────

function stepWelcome(logoSvg: string): string {
  return (
    `<div class="setup-brand">${logoSvg}<span class="brand-name">NEXUS</span></div>` +
    `<h2>${label("setup.welcomeTitle")}</h2>` +
    `<p>${label("setup.welcomeDesc")}</p>` +
    `<ul class="setup-bullets">` +
    `<li>${label("setup.bullet1")}</li>` +
    `<li>${label("setup.bullet2")}</li>` +
    `<li>${label("setup.bullet3")}</li>` +
    `</ul>` +
    `<p>${label("setup.continueHint")}</p>`
  );
}

function stepLicense(): string {
  return (
    `<h2>${label("setup.licenseTitle")}</h2>` +
    `<p>${label("setup.licenseHint")}</p>` +
    `<div class="license-box"><pre style="margin:0;white-space:pre-wrap;font-family:var(--font-mono, 'JetBrains Mono', monospace);font-size:12px;">${escapeHtml(label("setup.licenseText"))}</pre></div>` +
    `<label class="check-row" id="license-check-label">` +
    `<input type="checkbox" id="license-accept" onchange="window.__nx_licenseChanged(this)"> ` +
    `${label("setup.accept")}` +
    `</label>`
  );
}

function stepLocation(os: "windows" | "mac" = "windows"): string {
  const defaultPath = os === "mac" ? "/Applications/NEXUS.app" : "C:\\Program Files\\NEXUS";
  return (
    `<h2>${label("setup.locationTitle")}</h2>` +
    `<p>${label(os === "mac" ? "setup.locationDescMac" : "setup.locationDesc")}</p>` +
    `<div class="field">` +
    `<input type="text" id="install-path" value="${escapeHtml(defaultPath)}" aria-label="Installation path">` +
    `<button class="btn-browse btn" onclick="window.__nx_browse()" type="button">${label("setup.browse")}</button>` +
    `</div>` +
    `<p class="disk-info">${label("setup.spaceInfo")}</p>`
  );
}

function stepInstalling(): string {
  return (
    `<h2>${label("setup.installingTitle")}</h2>` +
    `<p>${label("setup.installingDesc")}</p>` +
    `<div class="progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Installation progress">` +
    `<div class="progress-fill" id="install-progress"></div>` +
    `</div>` +
    `<p class="status-line" id="install-status">${label("setup.installingStatus")}</p>`
  );
}

function stepFinish(): string {
  return (
    `<div class="finish-icon" aria-hidden="true">\u2713</div>` +
    `<h2>${label("setup.finishTitle")}</h2>` +
    `<p>${label("setup.finishDesc")}</p>` +
    `<label class="check-row">` +
    `<input type="checkbox" id="launch-now" checked> ` +
    `${label("setup.launchNow")}` +
    `</label>`
  );
}

// ── Inline script (generated in renderSetupDocument) ──────────────────────

// ── Document renderer ─────────────────────────────────────────────────────────

/** Options for the setup document. */
export interface SetupDocumentOptions {
  readonly theme: ThemeName;
  readonly os?: "windows" | "mac";
  readonly locale?: Locale | string;
}

/**
 * Renders the NEXUS desktop setup wizard as a standalone HTML document.
 * Both dark and light themes are supported.
 */
export function renderSetupDocument({ theme, os = "windows", locale }: SetupDocumentOptions): string {
  const t = getTheme(theme);
  const logoSvg = renderLogo(t.color.primary);
  if (locale) setLocale(locale);
  const stepLabels = [
    label("setup.welcome"), label("setup.license"), label("setup.location"),
    label("setup.installing"), label("setup.finish"),
  ];

  const txtInstall = label("setup.installBtn");
  const txtFinish = label("setup.finish");
  const txtContinue = label("setup.continue");
  const setupScript = /* js */ `
(function () {
  var steps = ${JSON.stringify(STEPS.map((s) => s.id))};
  var current = 0;
  var licenseAccepted = false;

  window.__nx_goToStep = function (idx) {
    if (window.__nx_iv) clearInterval(window.__nx_iv);
    current = Math.max(0, Math.min(steps.length - 1, idx));
    update();
  };

  function update() {
    steps.forEach(function (id, i) {
      var el = document.getElementById('step-' + id);
      if (el) {
        if (i === current) {
          el.classList.add('active');
          el.style.display = 'flex';
        } else {
          el.classList.remove('active');
          el.style.display = 'none';
        }
      }
    });
    var liEls = document.querySelectorAll('.steps li');
    liEls.forEach(function (li, i) {
      if (i === current) {
        li.classList.add('active');
        li.classList.remove('done');
      } else if (i < current) {
        li.classList.remove('active');
        li.classList.add('done');
      } else {
        li.classList.remove('active');
        li.classList.remove('done');
      }
    });
    var btnNext = document.getElementById('btn-next');
    var btnBack = document.getElementById('btn-back');
    if (btnNext) {
      if (current === steps.length - 2) { btnNext.textContent = ${JSON.stringify(txtInstall)}; }
      else if (current === steps.length - 1) { btnNext.textContent = ${JSON.stringify(txtFinish)}; }
      else { btnNext.textContent = ${JSON.stringify(txtContinue)}; }
      btnNext.disabled = (current === 1 && !licenseAccepted);
    }
    if (btnBack) btnBack.style.visibility = current === 0 ? 'hidden' : 'visible';
    if (current === 3) {
      var fill = document.getElementById('install-progress');
      if (fill) fill.style.width = '65%';
    }
  }

  window.__nx_licenseChanged = function (cb) {
    licenseAccepted = cb.checked;
    update();
  };

  window.__nx_browse = function () {
    alert(${JSON.stringify(label("setup.browseHint"))});
  };

  document.getElementById('btn-next').addEventListener('click', function () {
    if (current < steps.length - 1) { current++; update(); }
    else {
      alert(${JSON.stringify(label("setup.completeAlert"))});
    }
  });
  document.getElementById('btn-back').addEventListener('click', function () {
    if (current > 0) { current--; update(); }
  });
  document.getElementById('btn-cancel').addEventListener('click', function () {
    if (confirm(${JSON.stringify(label("setup.cancelConfirm"))})) window.close();
  });

  update();
}());
`;

  // Build stepper rail items
  const stepperItems = STEPS.map(
    (s, i) =>
      `<li data-step="${escapeHtml(s.id)}">` +
      `<span class="step-num">${i + 1}</span>` +
      `<span>${escapeHtml(stepLabels[i])}</span>` +
      `</li>`,
  ).join("\n      ");

  // Build step panels
  const stepPanels: Record<StepId, string> = {
    welcome: stepWelcome(logoSvg),
    license: stepLicense(),
    location: stepLocation(os),
    installing: stepInstalling(),
    finish: stepFinish(),
  };

  const panels = STEPS.map(
    (s, i) =>
      `<section class="step${s.id === "welcome" ? " active" : ""}" id="step-${escapeHtml(s.id)}" aria-label="${escapeHtml(stepLabels[i])} step">` +
      `\n${stepPanels[s.id]}\n` +
      `</section>`,
  ).join("\n");

  return (
    `<!doctype html>\n` +
    `<html lang="${CURRENT_LOCALE}" data-theme="${escapeHtml(theme)}">\n` +
    `<head>\n` +
    `<meta charset="utf-8">\n` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">\n` +
    `<title>${label("setup.windowTitle")}</title>\n` +
    `<style>${renderSetupStyles(theme)}</style>\n` +
    `</head>\n` +
    `<body class="setup">\n` +
    `<div class="setup-window">\n` +
    `  <!-- Title bar -->\n` +
    `  <div class="titlebar">\n` +
    `    <span class="title">${label("setup.titlebarText")}</span>\n` +
    `    ${renderWindowControls(os)}\n` +
    `  </div>\n` +
    `  <!-- Two-pane body -->\n` +
    `  <div class="setup-body">\n` +
    `    <!-- Left rail: stepper -->\n` +
    `    <aside class="setup-rail">\n` +
    `      <div class="setup-brand">${logoSvg}<span class="brand-name">NEXUS</span></div>\n` +
    `      <ol class="steps">\n      ${stepperItems}\n      </ol>\n` +
    `    </aside>\n` +
    `    <!-- Right: step content -->\n` +
    `    <div class="setup-main">\n` +
    `${panels}\n` +
    `      <!-- Footer -->\n` +
    `      <div class="setup-footer">\n` +
    `        <button class="btn btn-ghost" id="btn-cancel" type="button">${label("setup.cancel")}</button>\n` +
    `        <div class="footer-right">\n` +
    `          <button class="btn btn-ghost" id="btn-back" type="button" style="visibility:hidden">${label("setup.back")}</button>\n` +
    `          <button class="btn btn-primary" id="btn-next" type="button">${label("setup.continue")}</button>\n` +
    `        </div>\n` +
    `      </div>\n` +
    `    </div>\n` +
    `  </div>\n` +
    `</div>\n` +
    `<script>${setupScript}</script>\n` +
    `</body>\n` +
    `</html>`
  );
}
