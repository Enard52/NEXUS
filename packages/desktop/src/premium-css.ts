/**
 * NEXUS AI — Premium desktop shell (stylesheet).
 *
 * Extracted verbatim from the approved "Windows · Home Studio" premium design
 * so renderDesktopPremiumDocument() reproduces the exact visual identity.
 * Do not hand-edit generated blocks casually; keep changes small and
 * screenshot-verified.
 *
 * Regenerate with: node scripts/gen-desktop-premium.mjs
 */

export function desktopPremiumCss(): string {
  return PREMIUM_CSS;
}

const PREMIUM_CSS = `
      :root {
        color-scheme: dark;
        --bg: #08090c;
        --sidebar: #0b0c10;
        --surface: #101116;
        --surface-2: #15171d;
        --surface-3: #1a1c24;
        --text: #f7f8fc;
        --muted: #9aa3b7;
        --faint: #7b849a;
        --line: rgba(255, 255, 255, 0.075);
        --line-2: rgba(255, 255, 255, 0.13);
        --primary: #818cf8;
        --primary-2: #6676f6;
        --blue: #38bdf8;
        --green: #46d7a7;
        --amber: #f3c665;
        --red: #fb7185;
        --gradient: linear-gradient(
          135deg,
          #75a2ff 0%,
          #6575f6 52%,
          #8b7bff 100%
        );
        --font:
          "Space Grotesk", "Segoe UI Variable Display", "Segoe UI", system-ui,
          sans-serif;
        --body:
          Inter, "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
        --mono: "Cascadia Code", "SFMono-Regular", Consolas, monospace;
        --titlebar: 38px;
        --sidebar-w: 218px;
        --topbar: 70px;
        --ease: 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      [data-theme="light"] {
        color-scheme: light;
        --bg: #f5f6f9;
        --sidebar: #f0f2f6;
        --surface: #fff;
        --surface-2: #f5f6fa;
        --surface-3: #eceff5;
        --text: #10131b;
        --muted: #667085;
        --faint: #606a7e;
        --line: rgba(15, 23, 42, 0.08);
        --line-2: rgba(15, 23, 42, 0.14);
        --primary: #5d5ce7;
        --primary-2: #4f46e5;
        --blue: #0284c7;
        --green: #069669;
        --amber: #b7791f;
        --red: #e11d48;
      }
      * {
        box-sizing: border-box;
      }
      html,
      body {
        width: 100%;
        height: 100%;
        margin: 0;
      }
      body {
        overflow: hidden;
        background: var(--bg);
        color: var(--text);
        font: 12px/1.45 var(--body);
        -webkit-font-smoothing: antialiased;
      }
      button,
      input,
      select,
      textarea {
        font: inherit;
        color: inherit;
      }
      button {
        cursor: pointer;
      }
      img,
      svg {
        display: block;
      }
      img {
        max-width: 100%;
      }
      a {
        color: inherit;
      }
      .hidden {
        display: none !important;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      :focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }
      ::selection {
        background: rgba(129, 140, 248, 0.28);
      }
      ::-webkit-scrollbar {
        width: 7px;
        height: 7px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(129, 140, 248, 0.22);
        border-radius: 99px;
      }
      .sprite {
        position: absolute;
        width: 0;
        height: 0;
        overflow: hidden;
      }
      .icon {
        width: 18px;
        height: 18px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .icon.sm {
        width: 14px;
        height: 14px;
      }
      .icon.lg {
        width: 22px;
        height: 22px;
      }

      .titlebar {
        height: var(--titlebar);
        display: flex;
        align-items: center;
        border-bottom: 1px solid var(--line);
        background: #090a0d;
        position: relative;
        z-index: 80;
        -webkit-app-region: drag;
      }
      [data-theme="light"] .titlebar {
        background: #f8f9fb;
      }
      .titlebar-brand {
        height: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
        padding-left: 12px;
        font: 700 10px var(--font);
        letter-spacing: 0.02em;
      }
      .app-mark {
        width: 20px;
        height: 20px;
        display: grid;
        place-items: center;
        border-radius: 6px;
        color: white;
        background: var(--gradient);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.24);
      }
      .titlebar-context {
        margin-left: 8px;
        color: var(--faint);
        font: 500 8px var(--mono);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .window-controls {
        height: 100%;
        display: flex;
        margin-left: auto;
        -webkit-app-region: no-drag;
      }
      .window-control {
        width: 46px;
        height: 100%;
        display: grid;
        place-items: center;
        border: 0;
        background: transparent;
        color: var(--muted);
      }
      .window-control:hover {
        background: var(--surface-3);
        color: var(--text);
      }
      .window-control.close:hover {
        background: #c42b1c;
        color: white;
      }
      .window-control .icon {
        width: 11px;
        height: 11px;
      }

      .app-shell {
        height: calc(100% - var(--titlebar));
        display: flex;
        min-width: 0;
      }
      .sidebar {
        width: var(--sidebar-w);
        flex: none;
        display: flex;
        flex-direction: column;
        min-height: 0;
        padding: 18px 12px 12px;
        border-right: 1px solid var(--line);
        background: var(--sidebar);
      }
      .brand-lockup {
        height: 46px;
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 0 8px;
        margin-bottom: 13px;
      }
      .brand-mark {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        color: white;
        background: var(--gradient);
        box-shadow:
          0 10px 28px rgba(102, 118, 246, 0.22),
          inset 0 0 0 1px rgba(255, 255, 255, 0.24);
      }
      .brand-lockup strong {
        display: block;
        font: 700 14px var(--font);
        letter-spacing: -0.03em;
      }
      .brand-lockup span {
        display: block;
        color: var(--faint);
        font: 500 7px var(--mono);
        letter-spacing: 0.09em;
        text-transform: uppercase;
      }
      .assistant-shortcut {
        width: 100%;
        height: 43px;
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 0 11px;
        margin-bottom: 16px;
        border: 1px solid rgba(129, 140, 248, 0.19);
        border-radius: 11px;
        background: linear-gradient(
          135deg,
          rgba(129, 140, 248, 0.11),
          rgba(56, 189, 248, 0.035)
        );
        text-align: left;
      }
      .assistant-shortcut .spark-orb {
        width: 24px;
        height: 24px;
        display: grid;
        place-items: center;
        flex: none;
        border-radius: 8px;
        background: var(--gradient);
        color: white;
      }
      .assistant-shortcut strong {
        display: block;
        font: 600 9px var(--font);
      }
      .assistant-shortcut small {
        display: block;
        color: var(--faint);
        font-size: 7px;
      }
      .shortcut-key {
        margin-left: auto;
        padding: 3px 5px;
        border: 1px solid var(--line);
        border-radius: 5px;
        color: var(--faint);
        font: 500 7px var(--mono);
      }
      .nav-scroll {
        min-height: 0;
        overflow: auto;
        margin: 0 -4px;
        padding: 0 4px 15px;
      }
      .nav-group {
        margin-top: 15px;
      }
      .nav-group:first-child {
        margin-top: 0;
      }
      .nav-divider {
        margin: 15px 9px 0;
        border-top: 1px solid var(--line);
      }
      .nav-label {
        padding: 0 9px 6px;
        color: var(--faint);
        font: 600 7px var(--mono);
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }
      .nav-link {
        width: 100%;
        height: 35px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 10px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--muted);
        text-decoration: none;
        font-size: 9px;
        transition:
          background var(--ease),
          color var(--ease);
      }
      .nav-link .icon {
        width: 15px;
        height: 15px;
        color: var(--faint);
      }
      .nav-link:hover {
        background: var(--surface-2);
        color: var(--text);
      }
      .nav-link[aria-current="page"] {
        background: rgba(129, 140, 248, 0.11);
        color: var(--text);
      }
      .nav-link[aria-current="page"] .icon {
        color: var(--primary);
      }
      .nav-badge {
        margin-left: auto;
        min-width: 17px;
        height: 17px;
        display: grid;
        place-items: center;
        padding: 0 4px;
        border-radius: 99px;
        background: rgba(129, 140, 248, 0.13);
        color: var(--primary);
        font: 600 7px var(--mono);
      }
      .sidebar-footer {
        padding: 11px 7px 1px;
        border-top: 1px solid var(--line);
      }
      .user-menu {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 9px;
        border: 0;
        background: transparent;
        text-align: left;
      }
      .avatar {
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        flex: none;
        border: 1px solid rgba(129, 140, 248, 0.24);
        border-radius: 10px;
        background: rgba(129, 140, 248, 0.1);
        font: 700 8px var(--font);
      }
      .user-menu strong {
        display: block;
        font: 600 9px var(--font);
      }
      .user-menu small {
        display: block;
        color: var(--faint);
        font-size: 7px;
      }
      .user-menu .icon {
        margin-left: auto;
        color: var(--faint);
      }

      .main {
        min-width: 0;
        min-height: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .topbar {
        height: var(--topbar);
        flex: none;
        display: flex;
        align-items: center;
        padding: 0 24px;
        border-bottom: 1px solid var(--line);
        background: rgba(8, 9, 12, 0.86);
        backdrop-filter: blur(18px);
        position: relative;
        z-index: 30;
      }
      [data-theme="light"] .topbar {
        background: rgba(245, 246, 249, 0.88);
      }
      .page-copy {
        min-width: 0;
      }
      .eyebrow {
        color: var(--primary);
        font: 600 7px var(--mono);
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }
      .page-copy h1 {
        margin: 3px 0 0;
        font: 700 20px/1 var(--font);
        letter-spacing: -0.04em;
      }
      .topbar-center {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .core-state {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--muted);
        font-size: 8px;
      }
      .pulse {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--green);
        box-shadow: 0 0 12px var(--green);
      }
      .quick-search {
        width: 218px;
        height: 34px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 10px;
        border: 1px solid var(--line);
        border-radius: 9px;
        background: var(--surface);
        color: var(--faint);
      }
      .quick-search input {
        min-width: 0;
        flex: 1;
        border: 0;
        outline: 0;
        background: transparent;
        font-size: 8px;
      }
      .top-actions {
        display: flex;
        gap: 6px;
        margin-left: 12px;
      }
      .icon-button,
      .button {
        border: 1px solid var(--line);
        background: var(--surface);
        color: var(--muted);
        transition:
          background var(--ease),
          color var(--ease),
          border-color var(--ease),
          transform var(--ease);
      }
      .icon-button {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 9px;
      }
      .icon-button:hover,
      .button:hover {
        background: var(--surface-2);
        color: var(--text);
        border-color: var(--line-2);
      }
      .button:active,
      .icon-button:active {
        transform: translateY(1px);
      }
      .button {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 0 12px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 8px;
      }
      .button.primary {
        border-color: rgba(129, 140, 248, 0.35);
        background: var(--gradient);
        color: white;
      }
      .button.ghost {
        background: transparent;
      }
      .button.danger {
        color: var(--red);
      }

      .viewport {
        min-height: 0;
        flex: 1;
        position: relative;
      }
      .view {
        display: none;
        width: 100%;
        height: 100%;
      }
      .view.active {
        display: block;
      }

      /* DEVICE-CENTERED HOME */
      .home-layout {
        height: 100%;
        display: flex;
        min-width: 0;
      }
      .device-index {
        width: 216px;
        flex: none;
        display: flex;
        flex-direction: column;
        min-height: 0;
        border-right: 1px solid var(--line);
        background: #0a0b0e;
      }
      [data-theme="light"] .device-index {
        background: #f4f5f8;
      }
      .device-index-head {
        padding: 18px 16px 10px;
      }
      .device-index-head strong {
        display: block;
        font: 600 10px var(--font);
      }
      .device-index-head span {
        display: block;
        margin-top: 3px;
        color: var(--faint);
        font-size: 7px;
      }
      .semantic-switch {
        display: flex;
        margin: 0 12px 9px;
        padding: 3px;
        border: 1px solid var(--line);
        border-radius: 9px;
        background: var(--surface);
      }
      .semantic-switch button {
        height: 25px;
        min-width: 0;
        flex: 1;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--faint);
        font-size: 6px;
      }
      .semantic-switch button.active {
        background: var(--surface-3);
        color: var(--text);
        box-shadow: inset 0 0 0 1px var(--line);
      }
      .semantic-panel {
        display: none;
        min-height: 0;
        flex: 1;
        overflow: auto;
      }
      .semantic-panel.active {
        display: flex;
        flex-direction: column;
      }
      .room-tabs {
        display: flex;
        gap: 5px;
        padding: 0 12px 10px;
        overflow: auto;
      }
      .room-tab {
        min-width: max-content;
        height: 25px;
        padding: 0 8px;
        border: 1px solid transparent;
        border-radius: 7px;
        background: transparent;
        color: var(--faint);
        font-size: 7px;
      }
      .room-tab.active {
        border-color: var(--line);
        background: var(--surface-2);
        color: var(--text);
      }
      .device-list {
        min-height: 0;
        overflow: auto;
        padding: 3px 8px 14px;
      }
      .device-list-title {
        padding: 9px 8px 5px;
        color: var(--faint);
        font: 600 6px var(--mono);
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }
      .device-row {
        width: 100%;
        height: 67px;
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 7px;
        border: 1px solid transparent;
        border-radius: 10px;
        background: transparent;
        text-align: left;
      }
      .device-row:hover {
        background: var(--surface);
      }
      .device-row.active {
        border-color: rgba(129, 140, 248, 0.2);
        background: rgba(129, 140, 248, 0.085);
      }
      .device-photo {
        width: 51px;
        height: 51px;
        flex: none;
        overflow: hidden;
        border-radius: 9px;
        background: linear-gradient(145deg, #f1f2f4, #b8bcc4);
      }
      .device-photo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .device-row-copy {
        min-width: 0;
        flex: 1;
      }
      .device-row strong {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font: 600 8px var(--font);
      }
      .device-row small {
        display: block;
        margin-top: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--faint);
        font-size: 7px;
      }
      .row-state {
        width: 6px;
        height: 6px;
        flex: none;
        border-radius: 50%;
        background: var(--green);
      }
      .row-state.warn {
        background: var(--amber);
      }
      .add-device {
        margin: 0 12px 13px;
        height: 34px;
        flex: none;
        border: 1px dashed var(--line-2);
        border-radius: 9px;
        background: transparent;
        color: var(--muted);
        font-size: 8px;
      }
      .semantic-list {
        padding: 4px 9px 14px;
      }
      .semantic-row {
        width: 100%;
        min-height: 58px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        border: 0;
        border-bottom: 1px solid var(--line);
        background: transparent;
        text-align: left;
      }
      .semantic-row:hover {
        background: var(--surface);
      }
      .semantic-row:first-child {
        border-top: 1px solid var(--line);
      }
      .semantic-row-icon {
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        flex: none;
        border-radius: 9px;
        background: rgba(129, 140, 248, 0.075);
        color: var(--primary);
      }
      .semantic-row-copy {
        min-width: 0;
        flex: 1;
      }
      .semantic-row strong {
        display: block;
        font: 600 8px var(--font);
      }
      .semantic-row small {
        display: block;
        margin-top: 2px;
        color: var(--faint);
        font-size: 6px;
      }
      .semantic-summary {
        color: var(--muted);
        font: 600 6px var(--mono);
        white-space: nowrap;
      }

      .device-canvas {
        min-width: 330px;
        min-height: 0;
        flex: 1;
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(
            circle at 50% 35%,
            rgba(129, 140, 248, 0.16),
            transparent 31%
          ),
          radial-gradient(
            circle at 72% 74%,
            rgba(56, 189, 248, 0.06),
            transparent 24%
          ),
          var(--bg);
      }
      .device-canvas::before {
        content: "";
        position: absolute;
        inset: 0;
        opacity: 0.28;
        background-image:
          linear-gradient(rgba(129, 140, 248, 0.035) 1px, transparent 1px),
          linear-gradient(
            90deg,
            rgba(129, 140, 248, 0.035) 1px,
            transparent 1px
          );
        background-size: 45px 45px;
        mask-image: linear-gradient(to bottom, black, transparent 86%);
        pointer-events: none;
      }
      .canvas-toolbar {
        height: 50px;
        display: flex;
        align-items: center;
        padding: 0 19px;
        position: relative;
        z-index: 4;
      }
      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 7px;
        color: var(--faint);
        font-size: 7px;
      }
      .breadcrumb strong {
        color: var(--muted);
        font-weight: 600;
      }
      .canvas-actions {
        display: flex;
        gap: 6px;
        margin-left: auto;
      }
      .scene-button {
        height: 27px;
        padding: 0 9px;
        border: 1px solid var(--line);
        border-radius: 7px;
        background: rgba(16, 17, 22, 0.66);
        color: var(--muted);
        font-size: 7px;
      }
      .scene-button:hover {
        color: var(--text);
        border-color: rgba(129, 140, 248, 0.28);
      }
      .context-banner {
        height: 35px;
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 0 19px;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        background: linear-gradient(
          90deg,
          rgba(129, 140, 248, 0.07),
          transparent
        );
        position: relative;
        z-index: 4;
      }
      .context-banner .icon {
        width: 13px;
        height: 13px;
        color: var(--primary);
      }
      .context-banner strong {
        font: 600 7px var(--font);
      }
      .context-banner span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--muted);
        font-size: 7px;
      }
      .context-banner button {
        margin-left: auto;
        border: 0;
        background: transparent;
        color: var(--primary);
        font: 600 7px var(--body);
      }
      .product-space {
        height: calc(100% - 85px);
        display: flex;
        flex-direction: column;
        position: relative;
        z-index: 2;
        padding: 0 28px 134px;
      }
      .product-visual {
        min-height: 0;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .product-glow {
        position: absolute;
        width: min(42vw, 460px);
        height: min(42vw, 460px);
        border-radius: 50%;
        background: radial-gradient(
          circle,
          rgba(129, 140, 248, 0.13),
          rgba(129, 140, 248, 0.025) 48%,
          transparent 70%
        );
        border: 1px solid rgba(129, 140, 248, 0.08);
      }
      .product-glow::before,
      .product-glow::after {
        content: "";
        position: absolute;
        border: 1px solid rgba(129, 140, 248, 0.08);
        border-radius: 50%;
      }
      .product-glow::before {
        inset: 13%;
      }
      .product-glow::after {
        inset: 29%;
        border-style: dashed;
      }
      .product-image {
        width: min(66%, 480px);
        height: min(74%, 390px);
        position: relative;
        z-index: 2;
        object-fit: contain;
        border-radius: 20px;
        filter: saturate(0.9) contrast(1.04);
        transition:
          opacity var(--ease),
          transform var(--ease);
      }
      .product-shadow {
        position: absolute;
        z-index: 1;
        width: min(36vw, 360px);
        height: 38px;
        bottom: 10%;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.42);
        filter: blur(20px);
      }
      .product-heading {
        display: flex;
        align-items: flex-end;
        gap: 18px;
        position: relative;
        z-index: 3;
      }
      .product-heading-copy {
        min-width: 0;
        flex: 1;
      }
      .product-brand {
        color: var(--primary);
        font: 600 7px var(--mono);
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      .product-heading h2 {
        margin: 5px 0 3px;
        font: 700 clamp(24px, 2.7vw, 38px) / 1 var(--font);
        letter-spacing: -0.055em;
      }
      .product-heading p {
        margin: 0;
        color: var(--muted);
        font-size: 8px;
      }
      .online-badge {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 7px 9px;
        border: 1px solid rgba(70, 215, 167, 0.16);
        border-radius: 99px;
        background: rgba(70, 215, 167, 0.055);
        color: var(--green);
        font: 600 7px var(--mono);
        white-space: nowrap;
      }

      .assistant-console {
        position: absolute;
        z-index: 12;
        left: 24px;
        right: 24px;
        bottom: 18px;
        min-height: 102px;
        padding: 10px 12px;
        border: 1px solid rgba(129, 140, 248, 0.23);
        border-radius: 15px;
        background: rgba(14, 15, 20, 0.92);
        backdrop-filter: blur(24px);
        box-shadow: 0 22px 70px rgba(0, 0, 0, 0.42);
      }
      [data-theme="light"] .assistant-console {
        background: rgba(255, 255, 255, 0.92);
      }
      .assistant-line {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .assistant-orb {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        flex: none;
        border-radius: 11px;
        background: var(--gradient);
        color: white;
        box-shadow: 0 9px 24px rgba(102, 118, 246, 0.25);
      }
      .assistant-identity {
        width: 105px;
        flex: none;
      }
      .assistant-identity strong {
        display: block;
        font: 700 9px var(--font);
      }
      .assistant-identity span {
        display: block;
        color: var(--faint);
        font-size: 6px;
      }
      .assistant-mode {
        height: 29px;
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 0 7px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: transparent;
        color: var(--muted);
        font: 600 6px var(--mono);
        text-transform: uppercase;
      }
      .assistant-mode .pulse {
        width: 5px;
        height: 5px;
      }
      .assistant-mode[data-ai-mode="controlled"] {
        color: var(--blue);
      }
      .assistant-mode[data-ai-mode="agent"] {
        color: var(--amber);
      }
      .assistant-form {
        min-width: 0;
        flex: 1;
        height: 39px;
        display: flex;
        align-items: center;
        padding: 0 4px 0 11px;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.025);
      }
      .assistant-form input {
        min-width: 0;
        flex: 1;
        border: 0;
        outline: 0;
        background: transparent;
        font-size: 8px;
      }
      .assistant-form input::placeholder {
        color: var(--faint);
      }
      .mic-button {
        width: 31px;
        height: 31px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 8px;
        background: var(--gradient);
        color: white;
      }
      .assistant-suggestions {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 8px 0 0 151px;
        overflow: hidden;
      }
      .assistant-suggestions span {
        color: var(--faint);
        font: 600 6px var(--mono);
        letter-spacing: 0.09em;
        text-transform: uppercase;
      }
      .suggestion-chip {
        height: 22px;
        min-width: max-content;
        padding: 0 8px;
        border: 1px solid var(--line);
        border-radius: 99px;
        background: transparent;
        color: var(--muted);
        font-size: 6px;
      }
      .suggestion-chip:hover {
        border-color: rgba(129, 140, 248, 0.28);
        color: var(--text);
      }
      .assistant-trace {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 7px 0 0 151px;
        color: var(--faint);
        font-size: 6px;
      }
      .assistant-trace .trace-step {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .assistant-trace .trace-step::before {
        content: "";
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--green);
      }
      .assistant-trace .trace-arrow {
        color: rgba(129, 140, 248, 0.55);
      }
      .assistant-trace strong {
        margin-left: auto;
        color: var(--green);
        font: 600 6px var(--mono);
        text-transform: uppercase;
      }

      .inspector {
        width: 296px;
        flex: none;
        min-height: 0;
        overflow: auto;
        border-left: 1px solid var(--line);
        background: var(--sidebar);
      }
      .inspector-head {
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 17px;
        border-bottom: 1px solid var(--line);
      }
      .inspector-head strong {
        font: 600 9px var(--font);
      }
      .local-tag {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--green);
        font: 600 6px var(--mono);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .inspector-tabs {
        height: 39px;
        display: flex;
        align-items: flex-end;
        padding: 0 10px;
        border-bottom: 1px solid var(--line);
      }
      .inspector-tab {
        height: 38px;
        min-width: 0;
        flex: 1;
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: var(--faint);
        font-size: 6px;
      }
      .inspector-tab.active {
        border-color: var(--primary);
        color: var(--text);
      }
      .inspector-panel {
        display: none;
      }
      .inspector-panel.active {
        display: block;
      }
      .control-section {
        padding: 17px;
        border-bottom: 1px solid var(--line);
      }
      .section-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--faint);
        font: 600 6px var(--mono);
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }
      .master-control {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 13px;
      }
      .master-copy {
        min-width: 0;
        flex: 1;
      }
      .master-copy strong {
        display: block;
        font: 600 10px var(--font);
      }
      .master-copy span {
        display: block;
        margin-top: 2px;
        color: var(--faint);
        font-size: 7px;
      }
      .switch {
        width: 40px;
        height: 22px;
        position: relative;
        flex: none;
        border: 1px solid rgba(70, 215, 167, 0.25);
        border-radius: 99px;
        background: rgba(70, 215, 167, 0.11);
      }
      .switch::after {
        content: "";
        position: absolute;
        width: 16px;
        height: 16px;
        right: 2px;
        top: 2px;
        border-radius: 50%;
        background: var(--green);
        transition:
          transform var(--ease),
          background var(--ease);
      }
      .switch[aria-pressed="false"] {
        border-color: var(--line);
        background: var(--surface-3);
      }
      .switch[aria-pressed="false"]::after {
        transform: translateX(-18px);
        background: var(--faint);
      }
      .level-readout {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-top: 18px;
      }
      .level-readout strong {
        font: 700 30px/1 var(--font);
        letter-spacing: -0.05em;
      }
      .level-readout span {
        color: var(--muted);
        font-size: 7px;
      }
      input[type="range"] {
        width: 100%;
        height: 4px;
        margin: 14px 0 0;
        appearance: none;
        border-radius: 99px;
        background: linear-gradient(
          90deg,
          var(--primary) 0 78%,
          var(--surface-3) 78%
        );
        outline: 0;
      }
      input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 15px;
        height: 15px;
        border: 3px solid var(--sidebar);
        border-radius: 50%;
        background: var(--primary);
        box-shadow: 0 0 0 1px var(--primary);
      }
      .preset-row {
        display: flex;
        gap: 8px;
        margin-top: 14px;
      }
      .preset {
        width: 25px;
        height: 25px;
        border: 2px solid transparent;
        border-radius: 50%;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14);
      }
      .preset.active {
        border-color: var(--text);
      }
      .detail-grid {
        margin-top: 8px;
      }
      .detail {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        min-height: 31px;
        border-bottom: 1px solid var(--line);
        font-size: 7px;
      }
      .detail:last-child {
        border: 0;
      }
      .detail span {
        color: var(--faint);
      }
      .detail strong {
        text-align: right;
        font-weight: 600;
      }
      .activity {
        display: flex;
        gap: 9px;
        padding: 8px 0;
      }
      .activity + .activity {
        border-top: 1px solid var(--line);
      }
      .activity .icon {
        width: 13px;
        height: 13px;
        margin-top: 2px;
        color: var(--primary);
      }
      .activity-copy {
        min-width: 0;
        flex: 1;
      }
      .activity strong {
        display: block;
        font-size: 7px;
      }
      .activity small {
        display: block;
        margin-top: 1px;
        color: var(--faint);
        font-size: 6px;
      }
      .activity time {
        color: var(--faint);
        font: 500 6px var(--mono);
      }
      .related-row {
        display: flex;
        align-items: center;
        gap: 9px;
        min-height: 51px;
        padding: 8px 0;
        border-bottom: 1px solid var(--line);
      }
      .related-row:last-child {
        border: 0;
      }
      .related-row .row-icon {
        width: 31px;
        height: 31px;
      }
      .related-row-copy {
        min-width: 0;
        flex: 1;
      }
      .related-row strong {
        display: block;
        font-size: 7px;
      }
      .related-row span {
        display: block;
        margin-top: 2px;
        color: var(--faint);
        font-size: 6px;
      }
      .related-row > .icon {
        width: 12px;
        height: 12px;
        color: var(--faint);
      }
      .timeline {
        position: relative;
        margin-top: 9px;
        padding-left: 18px;
      }
      .timeline::before {
        content: "";
        position: absolute;
        left: 5px;
        top: 5px;
        bottom: 5px;
        width: 1px;
        background: var(--line-2);
      }
      .timeline-item {
        position: relative;
        padding: 0 0 16px;
      }
      .timeline-item:last-child {
        padding-bottom: 0;
      }
      .timeline-item::before {
        content: "";
        position: absolute;
        left: -16px;
        top: 3px;
        width: 6px;
        height: 6px;
        border: 2px solid var(--sidebar);
        border-radius: 50%;
        background: var(--primary);
      }
      .timeline-item strong {
        display: block;
        font-size: 7px;
      }
      .timeline-item span {
        display: block;
        margin-top: 2px;
        color: var(--muted);
        font-size: 6px;
      }
      .timeline-item time {
        display: block;
        margin-top: 3px;
        color: var(--faint);
        font: 500 6px var(--mono);
      }

      /* PRODUCT WORKSPACES — FLAT, NOT CARD GRIDS */
      .workspace-page {
        height: 100%;
        overflow: auto;
        padding: 28px 31px 44px;
      }
      .workspace-wrap {
        max-width: 1180px;
        margin: 0 auto;
      }
      .workspace-head {
        display: flex;
        align-items: flex-start;
        gap: 22px;
        margin-bottom: 24px;
      }
      .workspace-head-copy {
        min-width: 0;
        flex: 1;
      }
      .workspace-head h2 {
        margin: 0;
        font: 700 28px/1 var(--font);
        letter-spacing: -0.05em;
      }
      .workspace-head p {
        max-width: 660px;
        margin: 9px 0 0;
        color: var(--muted);
        font-size: 9px;
      }
      .workspace-actions {
        display: flex;
        gap: 7px;
      }
      .content-split {
        display: flex;
        min-height: 460px;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
      }
      .content-nav {
        width: 210px;
        flex: none;
        padding: 17px 18px 17px 0;
        border-right: 1px solid var(--line);
      }
      .content-nav button {
        width: 100%;
        height: 34px;
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 0 10px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--muted);
        text-align: left;
        font-size: 8px;
      }
      .content-nav button.active,
      .content-nav button:hover {
        background: var(--surface-2);
        color: var(--text);
      }
      .content-main {
        min-width: 0;
        flex: 1;
        padding: 4px 0 4px 28px;
      }
      .section-block {
        padding: 18px 0;
      }
      .section-block + .section-block {
        border-top: 1px solid var(--line);
      }
      .section-block-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 8px;
      }
      .section-anchor {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin: 26px 0 8px;
      }
      .section-anchor:first-child {
        margin-top: 0;
      }
      .section-anchor h3 {
        margin: 0;
        font: 600 12px var(--font);
      }
      .section-anchor p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 8px;
      }
      .section-block h3 {
        margin: 0;
        font: 600 12px var(--font);
      }
      .section-block-head p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 8px;
      }
      .data-row {
        min-height: 59px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 9px 0;
        border-top: 1px solid var(--line);
      }
      .data-row:first-of-type {
        border-top: 0;
      }
      .row-icon {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        flex: none;
        border: 1px solid rgba(129, 140, 248, 0.17);
        border-radius: 9px;
        background: rgba(129, 140, 248, 0.065);
        color: var(--primary);
      }
      .row-body {
        min-width: 0;
        flex: 1;
      }
      .row-body strong {
        display: block;
        font: 600 8px var(--font);
      }
      .row-body span {
        display: block;
        margin-top: 3px;
        color: var(--muted);
        font-size: 7px;
      }
      .row-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--faint);
        font: 500 7px var(--mono);
        text-align: right;
      }
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        min-height: 21px;
        padding: 0 7px;
        border: 1px solid var(--line);
        border-radius: 99px;
        color: var(--muted);
        font: 600 6px var(--mono);
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .status-pill.good {
        border-color: rgba(70, 215, 167, 0.15);
        color: var(--green);
        background: rgba(70, 215, 167, 0.04);
      }
      .status-pill.warn {
        border-color: rgba(243, 198, 101, 0.15);
        color: var(--amber);
      }
      .mini-device {
        width: 44px;
        height: 44px;
        overflow: hidden;
        flex: none;
        border-radius: 9px;
        background: #d8dbe1;
      }
      .mini-device img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .table-wrap {
        overflow: auto;
        border-top: 1px solid var(--line);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 700px;
        text-align: left;
      }
      th {
        padding: 10px;
        color: var(--faint);
        font: 600 6px var(--mono);
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      td {
        padding: 11px 10px;
        border-top: 1px solid var(--line);
        font-size: 7px;
      }
      td:first-child {
        font-weight: 600;
      }
      .metric-line {
        display: flex;
        align-items: center;
        gap: 26px;
        padding: 17px 0;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
      }
      .metric strong {
        display: block;
        font: 700 21px var(--font);
        letter-spacing: -0.04em;
      }
      .metric span {
        display: block;
        color: var(--faint);
        font-size: 6px;
      }
      .metric-divider {
        width: 1px;
        height: 27px;
        background: var(--line);
      }
      .permission {
        display: flex;
        align-items: center;
        gap: 7px;
        color: var(--muted);
        font-size: 7px;
      }
      .permission .dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--green);
      }
      .setting-row {
        width: 100%;
        min-height: 58px;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 10px 0;
        border: 0;
        border-top: 1px solid var(--line);
        background: transparent;
        text-align: left;
      }
      .setting-row:first-of-type {
        border-top: 0;
      }
      .setting-row:hover .setting-value {
        color: var(--text);
      }
      .setting-copy {
        min-width: 0;
        flex: 1;
      }
      .setting-copy strong {
        display: block;
        font-size: 8px;
      }
      .setting-copy span {
        display: block;
        margin-top: 3px;
        color: var(--muted);
        font-size: 7px;
      }
      .setting-value {
        color: var(--muted);
        font-size: 7px;
      }
      .setting-row .icon {
        color: var(--faint);
      }
      .agent-route {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 13px 0;
      }
      .agent-node {
        min-width: 120px;
        min-height: 68px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 10px 12px;
        border-left: 2px solid var(--primary);
        background: linear-gradient(
          90deg,
          rgba(129, 140, 248, 0.08),
          transparent
        );
      }
      .agent-node strong {
        font: 600 8px var(--font);
      }
      .agent-node span {
        margin-top: 4px;
        color: var(--faint);
        font-size: 6px;
      }
      .route-arrow {
        color: var(--primary);
      }
      .plan-hero {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 20px 0;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
      }
      .plan-hero-copy {
        min-width: 0;
        flex: 1;
      }
      .plan-hero h3 {
        margin: 0;
        font: 700 21px var(--font);
      }
      .plan-hero p {
        margin: 5px 0 0;
        color: var(--muted);
        font-size: 8px;
      }
      .plan-price {
        font: 700 28px var(--font);
      }
      .plan-price small {
        color: var(--faint);
        font: 400 7px var(--body);
      }
      .progress {
        height: 4px;
        margin-top: 9px;
        border-radius: 99px;
        background: var(--surface-3);
        overflow: hidden;
      }
      .progress span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--gradient);
      }
      .audit-hash {
        font: 500 6px var(--mono);
        color: var(--faint);
      }
      .support-search {
        height: 45px;
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 0 13px;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: var(--surface);
      }
      .support-search input {
        min-width: 0;
        flex: 1;
        border: 0;
        outline: 0;
        background: transparent;
        font-size: 8px;
      }

      dialog {
        width: min(430px, calc(100% - 28px));
        padding: 0;
        border: 1px solid var(--line-2);
        border-radius: 14px;
        background: var(--surface);
        color: var(--text);
        box-shadow: 0 35px 100px rgba(0, 0, 0, 0.55);
      }
      dialog::backdrop {
        background: rgba(0, 0, 0, 0.62);
        backdrop-filter: blur(4px);
      }
      .dialog-head {
        padding: 17px;
        border-bottom: 1px solid var(--line);
      }
      .dialog-head h2 {
        margin: 0;
        font: 600 13px var(--font);
      }
      .dialog-head p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 7px;
      }
      .dialog-body {
        padding: 17px;
      }
      .field label {
        display: block;
        margin-bottom: 6px;
        color: var(--muted);
        font-size: 7px;
      }
      .field input,
      .field select {
        width: 100%;
        height: 37px;
        padding: 0 10px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface-2);
        outline: 0;
      }
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 7px;
        padding: 0 17px 17px;
      }
      .toast-region {
        position: fixed;
        right: 17px;
        bottom: 17px;
        z-index: 120;
        display: flex;
        flex-direction: column;
        gap: 7px;
        pointer-events: none;
      }
      .toast {
        min-width: 255px;
        padding: 11px 12px;
        border: 1px solid var(--line-2);
        border-radius: 10px;
        background: var(--surface-2);
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.38);
      }
      .toast strong {
        display: block;
        font-size: 8px;
      }
      .toast span {
        display: block;
        margin-top: 2px;
        color: var(--muted);
        font-size: 7px;
      }

      /* HOME STUDIO BASE — A CONTINUOUS DESKTOP SURFACE */
      :root {
        --sidebar-w: 190px;
        --topbar: 64px;
      }
      .assistant-shortcut {
        display: none;
      }
      .sidebar {
        padding: 16px 10px 11px;
      }
      .brand-lockup {
        margin-bottom: 19px;
      }
      .nav-group {
        margin-top: 12px;
      }
      .nav-link {
        height: 32px;
        border-radius: 0;
        position: relative;
      }
      .nav-link[aria-current="page"] {
        background: transparent;
      }
      .nav-link[aria-current="page"]::before {
        content: "";
        position: absolute;
        left: 0;
        top: 7px;
        bottom: 7px;
        width: 2px;
        border-radius: 2px;
        background: var(--primary);
      }
      .nav-badge {
        background: transparent;
        border: 1px solid var(--line);
        color: var(--muted);
      }
      .quick-search {
        border: 0;
        border-bottom: 1px solid var(--line);
        border-radius: 0;
        background: transparent;
      }
      .top-actions .icon-button {
        border: 0;
        background: transparent;
      }
      .topbar {
        padding: 0 20px;
        background: var(--bg);
        backdrop-filter: none;
      }

      .studio-layout {
        width: 100%;
        height: 100%;
        display: flex;
        min-width: 0;
        background: var(--bg);
      }
      .studio-stage {
        min-width: 0;
        min-height: 0;
        flex: 1;
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(
            circle at 67% 38%,
            rgba(98, 111, 244, 0.145),
            transparent 28%
          ),
          radial-gradient(
            circle at 46% 76%,
            rgba(56, 189, 248, 0.045),
            transparent 30%
          ),
          linear-gradient(140deg, #090a0e 0%, #08090c 55%, #090b11 100%);
      }
      [data-theme="light"] .studio-stage {
        background:
          radial-gradient(
            circle at 67% 38%,
            rgba(98, 111, 244, 0.12),
            transparent 30%
          ),
          linear-gradient(140deg, #f7f8fb, #eef1f7);
      }
      .studio-stage::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.34;
        background-image:
          linear-gradient(rgba(129, 140, 248, 0.025) 1px, transparent 1px),
          linear-gradient(
            90deg,
            rgba(129, 140, 248, 0.025) 1px,
            transparent 1px
          );
        background-size: 52px 52px;
        mask-image: linear-gradient(to bottom, black, transparent 82%);
      }
      .studio-heading {
        height: 82px;
        display: flex;
        align-items: center;
        gap: 28px;
        padding: 0 28px;
        position: relative;
        z-index: 8;
      }
      .studio-room {
        min-width: 195px;
      }
      .studio-kicker {
        display: block;
        color: var(--primary);
        font: 600 6px var(--mono);
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .studio-room h2 {
        margin: 5px 0 2px;
        font: 700 20px/1 var(--font);
        letter-spacing: -0.04em;
      }
      .studio-room p {
        margin: 0;
        color: var(--faint);
        font-size: 7px;
      }
      .studio-modes {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .studio-modes button,
      .studio-scenes button {
        padding: 0 0 4px;
        border: 0;
        border-bottom: 1px solid transparent;
        background: transparent;
        color: var(--faint);
        font-size: 7px;
      }
      .studio-modes button.active {
        border-color: var(--primary);
        color: var(--text);
      }
      .studio-scenes {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-left: auto;
      }
      .studio-scenes button:hover {
        color: var(--text);
      }
      .studio-insight {
        height: 34px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 28px;
        position: relative;
        z-index: 8;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        background: linear-gradient(
          90deg,
          rgba(129, 140, 248, 0.05),
          transparent 60%
        );
      }
      .studio-insight .icon {
        width: 12px;
        height: 12px;
        color: var(--primary);
      }
      .studio-insight strong {
        font-size: 7px;
      }
      .studio-insight span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--muted);
        font-size: 7px;
      }
      .studio-insight button {
        margin-left: auto;
        border: 0;
        background: transparent;
        color: var(--primary);
        font: 600 7px var(--body);
      }
      .studio-visual {
        height: calc(100% - 292px);
        min-height: 280px;
        display: flex;
        position: relative;
        z-index: 2;
      }
      .device-story {
        width: 39%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 5px 0 24px 36px;
        position: relative;
        z-index: 5;
      }
      .device-story .product-brand {
        font-size: 7px;
      }
      .device-story h2 {
        max-width: 410px;
        margin: 8px 0 7px;
        font: 700 clamp(28px, 3.5vw, 48px) / 0.98 var(--font);
        letter-spacing: -0.06em;
      }
      .device-story > p {
        max-width: 360px;
        margin: 0;
        color: var(--muted);
        font-size: 8px;
      }
      .story-state {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-top: 16px;
        color: var(--green);
        font: 600 6px var(--mono);
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .story-facts {
        display: flex;
        gap: 26px;
        margin: 27px 0 0;
      }
      .story-facts div {
        min-width: 72px;
      }
      .story-facts dt {
        color: var(--faint);
        font: 600 6px var(--mono);
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }
      .story-facts dd {
        margin: 5px 0 0;
        font: 600 8px var(--body);
      }
      .studio-product {
        width: 61%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }
      .studio-product::after {
        content: "";
        position: absolute;
        width: 52%;
        height: 26px;
        left: 25%;
        bottom: 12%;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.44);
        filter: blur(19px);
      }
      .studio-orbit {
        position: absolute;
        border: 1px solid rgba(129, 140, 248, 0.1);
        border-radius: 50%;
      }
      .orbit-one {
        width: min(46vw, 590px);
        height: min(46vw, 590px);
      }
      .orbit-two {
        width: min(30vw, 380px);
        height: min(30vw, 380px);
        border-style: dashed;
      }
      .studio-product .product-image {
        width: 92%;
        height: 88%;
        position: relative;
        z-index: 2;
        object-fit: cover;
        border-radius: 0;
        opacity: 0.88;
        filter: saturate(0.68) contrast(1.08) brightness(0.78);
        mix-blend-mode: luminosity;
        -webkit-mask-image: radial-gradient(
          ellipse 70% 70% at 50% 50%,
          black 34%,
          rgba(0, 0, 0, 0.94) 52%,
          transparent 80%
        );
        mask-image: radial-gradient(
          ellipse 70% 70% at 50% 50%,
          black 34%,
          rgba(0, 0, 0, 0.94) 52%,
          transparent 80%
        );
      }
      [data-theme="light"] .studio-product .product-image {
        mix-blend-mode: multiply;
        filter: saturate(0.78) contrast(1.04);
        opacity: 0.76;
      }
      .device-ribbon {
        height: 86px;
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 0 24px;
        position: absolute;
        left: 0;
        right: 0;
        bottom: 78px;
        z-index: 10;
        border-top: 1px solid var(--line);
        background: linear-gradient(
          90deg,
          rgba(9, 10, 14, 0.8),
          rgba(9, 10, 14, 0.52)
        );
        backdrop-filter: blur(16px);
      }
      [data-theme="light"] .device-ribbon {
        background: rgba(247, 248, 251, 0.78);
      }
      .ribbon-label {
        width: 75px;
        flex: none;
        color: var(--faint);
        font: 600 6px var(--mono);
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }
      .device-ribbon-item {
        height: 58px;
        min-width: 0;
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 8px;
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        text-align: left;
        color: var(--muted);
      }
      .device-ribbon-item:hover {
        color: var(--text);
      }
      .device-ribbon-item.active {
        border-color: var(--primary);
        color: var(--text);
      }
      .device-ribbon-item img {
        width: 40px;
        height: 40px;
        flex: none;
        object-fit: cover;
        border-radius: 50%;
        filter: saturate(0.72);
      }
      .device-ribbon-item span {
        min-width: 0;
      }
      .device-ribbon-item strong {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font: 600 7px var(--font);
      }
      .device-ribbon-item small {
        display: block;
        margin-top: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--faint);
        font-size: 6px;
      }
      .ribbon-add {
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: none;
        border: 0;
        border-radius: 50%;
        background: rgba(129, 140, 248, 0.1);
        color: var(--primary);
      }
      .nexus-compose {
        height: 78px;
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 0 22px;
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 11;
        background: var(--bg);
      }
      .compose-mark {
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: none;
        border-radius: 50%;
        background: var(--gradient);
        color: white;
        box-shadow: 0 0 28px rgba(102, 118, 246, 0.2);
      }
      .compose-copy {
        width: 86px;
        flex: none;
      }
      .compose-copy strong {
        display: block;
        font: 700 8px var(--font);
      }
      .compose-copy span {
        display: block;
        margin-top: 2px;
        color: var(--faint);
        font-size: 6px;
      }
      .nexus-compose .assistant-mode {
        border: 0;
        border-radius: 0;
        border-bottom: 1px solid var(--line);
        padding: 0 4px;
      }
      .compose-form {
        height: 40px;
        min-width: 180px;
        flex: 1;
        display: flex;
        align-items: center;
        border-bottom: 1px solid rgba(129, 140, 248, 0.28);
      }
      .compose-form input {
        min-width: 0;
        flex: 1;
        border: 0;
        outline: 0;
        background: transparent;
        font-size: 8px;
      }
      .compose-form input::placeholder {
        color: var(--faint);
      }
      .compose-form .mic-button {
        width: 32px;
        height: 32px;
        border-radius: 50%;
      }
      .compose-prompts {
        display: flex;
        gap: 11px;
      }
      .compose-prompts button {
        padding: 0;
        border: 0;
        border-bottom: 1px solid transparent;
        background: transparent;
        color: var(--faint);
        font-size: 6px;
      }
      .compose-prompts button:hover {
        border-color: var(--primary);
        color: var(--text);
      }

      .context-drawer {
        width: 314px;
        flex: none;
        min-height: 0;
        overflow: auto;
        position: relative;
        border-left: 1px solid var(--line);
        background: linear-gradient(180deg, #0d0e12, #0a0b0f);
      }
      [data-theme="light"] .context-drawer {
        background: linear-gradient(180deg, #fff, #f4f6fa);
      }
      .drawer-heading {
        min-height: 85px;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 19px;
      }
      .drawer-heading > div {
        min-width: 0;
        flex: 1;
      }
      .drawer-heading span {
        display: block;
        color: var(--primary);
        font: 600 6px var(--mono);
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }
      .drawer-heading strong {
        display: block;
        margin-top: 5px;
        font: 600 12px var(--font);
      }
      .drawer-heading small {
        display: block;
        margin-top: 3px;
        color: var(--muted);
        font-size: 7px;
      }
      .drawer-tabs {
        height: 38px;
        display: flex;
        padding: 0 15px;
        border-bottom: 1px solid var(--line);
      }
      .drawer-tabs button {
        height: 38px;
        min-width: 0;
        flex: 1;
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: var(--faint);
        font-size: 6px;
      }
      .drawer-tabs button.active {
        border-color: var(--primary);
        color: var(--text);
      }
      .drawer-panel {
        display: none;
      }
      .drawer-panel.active {
        display: block;
      }
      .drawer-section {
        padding: 20px 19px;
      }
      .drawer-section + .drawer-section {
        border-top: 1px solid var(--line);
      }
      .drawer-label {
        display: block;
        margin-bottom: 10px;
        color: var(--faint);
        font: 600 6px var(--mono);
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .level-control .level-readout {
        margin-top: 0;
      }
      .level-control .level-readout strong {
        font-size: 38px;
      }
      .level-control input[type="range"] {
        margin-top: 19px;
      }
      .drawer-action {
        width: 100%;
        min-height: 57px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 7px 0;
        border: 0;
        border-bottom: 1px solid var(--line);
        background: transparent;
        text-align: left;
      }
      .drawer-action:last-child {
        border-bottom: 0;
      }
      .drawer-action > .icon:first-child {
        color: var(--primary);
      }
      .drawer-action > .icon:last-child {
        width: 12px;
        height: 12px;
        color: var(--faint);
      }
      .drawer-action > span {
        min-width: 0;
        flex: 1;
      }
      .drawer-action strong {
        display: block;
        font-size: 7px;
      }
      .drawer-action small {
        display: block;
        margin-top: 3px;
        color: var(--faint);
        font-size: 6px;
      }
      .drawer-details {
        margin: 0;
      }
      .drawer-details div {
        min-height: 38px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid var(--line);
      }
      .drawer-details dt {
        color: var(--faint);
        font-size: 7px;
      }
      .drawer-details dd {
        margin: 0;
        text-align: right;
        font: 600 7px var(--body);
      }
      .diagnostics-line {
        display: flex;
        gap: 18px;
      }
      .diagnostics-line div {
        min-width: 0;
        flex: 1;
      }
      .diagnostics-line strong {
        display: block;
        font: 700 14px var(--font);
      }
      .diagnostics-line span {
        display: block;
        margin-top: 3px;
        color: var(--faint);
        font-size: 6px;
      }

      @media (max-width: 1180px) {
        :root {
          --sidebar-w: 176px;
        }
        .context-drawer {
          width: 284px;
        }
        .device-story {
          width: 42%;
          padding-left: 25px;
        }
        .studio-product {
          width: 58%;
        }
        .device-ribbon-item:nth-of-type(5) {
          display: none;
        }
        .compose-prompts button:nth-child(3) {
          display: none;
        }
        .topbar {
          padding: 0 18px;
        }
      }
      @media (max-width: 980px) {
        :root {
          --sidebar-w: 72px;
        }
        .sidebar {
          align-items: center;
          padding-left: 9px;
          padding-right: 9px;
        }
        .brand-lockup {
          padding: 0;
        }
        .brand-lockup > div:last-child,
        .nav-label,
        .nav-link span,
        .nav-badge,
        .user-menu > span,
        .user-menu > .icon {
          display: none;
        }
        .nav-scroll {
          width: 100%;
        }
        .nav-link {
          justify-content: center;
          padding: 0;
        }
        .sidebar-footer {
          width: 100%;
        }
        .user-menu {
          justify-content: center;
        }
        .topbar-center .quick-search {
          display: none;
        }
        .context-drawer {
          position: absolute;
          z-index: 25;
          right: 0;
          top: 0;
          bottom: 0;
          transform: translateX(102%);
          box-shadow: -25px 0 60px rgba(0, 0, 0, 0.4);
          transition: transform var(--ease);
        }
        body.inspector-open .context-drawer {
          transform: none;
        }
        .studio-heading {
          padding: 0 20px;
        }
        .studio-modes {
          display: none;
        }
        .device-story {
          width: 45%;
        }
        .studio-product {
          width: 55%;
        }
        .device-ribbon-item:nth-of-type(4) {
          display: none;
        }
        .compose-prompts {
          display: none;
        }
        .workspace-page {
          padding: 25px 22px;
        }
        .content-nav {
          width: 178px;
        }
      }
      @media (max-width: 720px) {
        :root {
          --sidebar-w: 56px;
        }
        .sidebar {
          padding-left: 5px;
          padding-right: 5px;
        }
        .brand-mark {
          width: 35px;
          height: 35px;
        }
        .topbar {
          height: 60px;
          padding: 0 12px;
        }
        .page-copy h1 {
          font-size: 17px;
        }
        .core-state {
          display: none;
        }
        .studio-heading {
          height: 70px;
        }
        .studio-room {
          min-width: 0;
        }
        .studio-scenes {
          display: none;
        }
        .studio-insight {
          padding: 0 15px;
        }
        .studio-visual {
          height: calc(100% - 280px);
        }
        .device-story {
          width: 100%;
          justify-content: flex-end;
          padding: 0 20px 34px;
          background: linear-gradient(to top, var(--bg), transparent 72%);
        }
        .device-story h2 {
          max-width: 310px;
          font-size: 30px;
        }
        .story-facts {
          display: none;
        }
        .studio-product {
          position: absolute;
          inset: 0;
          width: 100%;
          opacity: 0.54;
        }
        .device-ribbon {
          padding: 0 11px;
        }
        .ribbon-label {
          display: none;
        }
        .device-ribbon-item:nth-of-type(n + 4) {
          display: none;
        }
        .nexus-compose {
          padding: 0 12px;
        }
        .compose-copy,
        .nexus-compose .assistant-mode {
          display: none;
        }
        .context-drawer {
          width: min(310px, calc(100% - 15px));
        }
        .workspace-page {
          padding: 20px 15px 34px;
        }
        .workspace-head {
          flex-direction: column;
        }
        .content-split {
          display: block;
        }
        .content-nav {
          width: 100%;
          display: flex;
          overflow: auto;
          padding: 10px 0;
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }
        .content-nav button {
          min-width: max-content;
          width: auto;
        }
        .content-main {
          padding-left: 0;
        }
        .metric-line {
          gap: 14px;
          overflow: auto;
        }
        .topbar .top-actions .icon-button:first-child {
          display: none;
        }
      }

      /* V6 PRODUCTION PASS — READABLE, BALANCED, DEVICE-FIRST */
      :root {
        --sidebar-w: 220px;
        --topbar: 76px;
      }
      body {
        font-size: 14px;
        line-height: 1.5;
      }

      /* Windows shell */
      .titlebar-brand {
        gap: 9px;
        font-size: 11px;
      }
      .titlebar-context {
        font-size: 9px;
      }
      .sidebar {
        padding: 19px 14px 14px;
      }
      .brand-lockup {
        height: 52px;
        gap: 12px;
        margin-bottom: 18px;
        padding: 0 7px;
      }
      .brand-mark {
        width: 40px;
        height: 40px;
      }
      .brand-lockup strong {
        font-size: 16px;
      }
      .brand-lockup span {
        margin-top: 2px;
        font-size: 9px;
      }
      .nav-scroll {
        padding-bottom: 18px;
      }
      .nav-group {
        margin-top: 17px;
      }
      .nav-label {
        padding: 0 9px 7px;
        font-size: 9px;
      }
      .nav-link {
        height: 38px;
        gap: 11px;
        padding: 0 10px;
        font-size: 12px;
      }
      .nav-link .icon {
        width: 17px;
        height: 17px;
      }
      .nav-link[aria-current="page"]::before {
        top: 8px;
        bottom: 8px;
        width: 3px;
      }
      .nav-badge {
        min-width: 19px;
        height: 19px;
        font-size: 9px;
      }
      .sidebar-footer {
        padding: 14px 7px 2px;
      }
      .avatar {
        width: 34px;
        height: 34px;
        font-size: 10px;
      }
      .user-menu strong {
        font-size: 12px;
      }
      .user-menu small {
        font-size: 9px;
      }

      .topbar {
        min-height: var(--topbar);
        padding: 0 28px;
      }
      .page-copy {
        min-width: 210px;
      }
      .eyebrow {
        font-size: 9px;
      }
      .page-copy h1 {
        margin-top: 4px;
        font-size: 24px;
        white-space: nowrap;
      }
      .topbar-center {
        gap: 20px;
      }
      .core-state {
        gap: 9px;
        font-size: 11px;
      }
      .quick-search {
        width: 260px;
        height: 39px;
        gap: 10px;
      }
      .quick-search input {
        font-size: 12px;
      }
      .icon-button {
        width: 38px;
        height: 38px;
      }
      .button {
        min-height: 38px;
        padding: 0 14px;
        font-size: 12px;
        white-space: nowrap;
      }

      /* Home Studio uses rows instead of overlapping absolute layers. */
      .studio-stage {
        display: grid;
        grid-template-rows: 92px 44px minmax(300px, 1fr) 106px 94px;
        background:
          radial-gradient(
            circle at 71% 39%,
            rgba(92, 108, 244, 0.16),
            transparent 32%
          ),
          radial-gradient(
            circle at 46% 78%,
            rgba(56, 189, 248, 0.055),
            transparent 28%
          ),
          linear-gradient(145deg, #08090d 0%, #090a0f 58%, #0a0d14 100%);
      }
      .studio-heading {
        height: auto;
        gap: 34px;
        padding: 0 34px;
      }
      .studio-room {
        min-width: 225px;
      }
      .studio-kicker {
        font-size: 9px;
      }
      .studio-room h2 {
        margin: 7px 0 4px;
        font-size: 25px;
      }
      .studio-room p {
        font-size: 11px;
      }
      .studio-modes {
        gap: 26px;
      }
      .studio-modes button,
      .studio-scenes button {
        padding-bottom: 7px;
        font-size: 11px;
      }
      .studio-scenes {
        gap: 19px;
      }
      .studio-insight {
        height: auto;
        gap: 10px;
        padding: 0 34px;
      }
      .studio-insight .icon {
        width: 16px;
        height: 16px;
      }
      .studio-insight strong,
      .studio-insight span,
      .studio-insight button {
        font-size: 11px;
      }
      .studio-insight strong {
        white-space: nowrap;
      }
      .studio-visual {
        height: auto;
        min-height: 0;
        overflow: hidden;
      }
      .device-story {
        width: 43%;
        justify-content: center;
        padding: 26px 20px 32px 46px;
      }
      .device-story .product-brand {
        font-size: 10px;
        letter-spacing: 0.12em;
      }
      .device-story h2 {
        max-width: 470px;
        margin: 11px 0 11px;
        font-size: clamp(36px, 3.4vw, 52px);
        line-height: 0.98;
      }
      .device-story > p {
        max-width: 430px;
        font-size: 13px;
        line-height: 1.55;
      }
      .story-state {
        gap: 9px;
        margin-top: 20px;
        font-size: 9px;
      }
      .story-state .pulse {
        width: 7px;
        height: 7px;
      }
      .story-facts {
        gap: 34px;
        margin-top: 29px;
      }
      .story-facts div {
        min-width: 88px;
      }
      .story-facts dt {
        font-size: 9px;
      }
      .story-facts dd {
        margin-top: 7px;
        font-size: 12px;
      }

      .studio-product {
        width: 57%;
        margin: 18px 24px 18px 0;
        isolation: isolate;
      }
      .studio-product::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 3;
        pointer-events: none;
        background:
          linear-gradient(
            90deg,
            #090a0e 0%,
            transparent 23%,
            transparent 78%,
            #090b10 100%
          ),
          linear-gradient(
            0deg,
            #090b10 0%,
            transparent 24%,
            transparent 78%,
            #090a0e 100%
          );
      }
      [data-theme="light"] .studio-product::before {
        background:
          linear-gradient(
            90deg,
            #f6f7fa 0%,
            transparent 23%,
            transparent 78%,
            #eef1f7 100%
          ),
          linear-gradient(
            0deg,
            #eef1f7 0%,
            transparent 24%,
            transparent 78%,
            #f6f7fa 100%
          );
      }
      .studio-product::after {
        width: 46%;
        height: 22px;
        left: 27%;
        bottom: 9%;
        filter: blur(22px);
      }
      .studio-product .product-image {
        width: 100%;
        height: 100%;
        border-radius: 28px;
        opacity: 0.94;
        filter: saturate(0.78) contrast(1.06) brightness(0.82);
        mix-blend-mode: normal;
        mask-image: none;
        -webkit-mask-image: none;
        transition:
          opacity 180ms ease,
          transform 220ms ease,
          filter 220ms ease;
      }
      .studio-product:hover .product-image {
        filter: saturate(0.88) contrast(1.07) brightness(0.88);
      }
      [data-theme="light"] .studio-product:hover .product-image {
        filter: saturate(0.86) contrast(1.04) brightness(1);
      }
      .orbit-one {
        width: min(44vw, 620px);
        height: min(44vw, 620px);
      }
      .orbit-two {
        width: min(29vw, 410px);
        height: min(29vw, 410px);
      }

      /* Connected devices: one continuous dock, no card grid. */
      .device-ribbon {
        height: auto;
        min-width: 0;
        gap: 4px;
        padding: 0 26px;
        position: relative;
        left: auto;
        right: auto;
        bottom: auto;
        overflow-x: auto;
        overflow-y: hidden;
        background: linear-gradient(
          90deg,
          rgba(10, 11, 16, 0.96),
          rgba(10, 12, 18, 0.84)
        );
        scrollbar-width: none;
      }
      .device-ribbon::-webkit-scrollbar {
        display: none;
      }
      .ribbon-label {
        width: 104px;
        font-size: 9px;
      }
      .device-ribbon-item {
        height: 84px;
        width: 190px;
        min-width: 174px;
        max-width: 205px;
        flex: 0 0 190px;
        gap: 11px;
        padding: 8px 12px;
      }
      .device-ribbon-item:nth-of-type(4),
      .device-ribbon-item:nth-of-type(5) {
        display: flex;
      }
      .device-ribbon-item[hidden] {
        display: none !important;
      }
      .device-ribbon-item img {
        width: 52px;
        height: 52px;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
      }
      .device-ribbon-item strong {
        font-size: 12px;
      }
      .device-ribbon-item small {
        margin-top: 5px;
        font-size: 10px;
      }
      .ribbon-add {
        width: 40px;
        height: 40px;
        margin-left: 8px;
      }

      /* NEXUS AI is the primary action, not another dashboard card. */
      .nexus-compose {
        height: auto;
        min-width: 0;
        gap: 14px;
        padding: 13px 24px;
        position: relative;
        left: auto;
        right: auto;
        bottom: auto;
        border-top: 1px solid var(--line);
        background:
          linear-gradient(
            90deg,
            rgba(129, 140, 248, 0.055),
            transparent 26%
          ),
          #090a0e;
      }
      [data-theme="light"] .nexus-compose {
        background:
          linear-gradient(
            90deg,
            rgba(93, 92, 231, 0.08),
            transparent 26%
          ),
          #f5f6f9;
      }
      .compose-mark {
        width: 44px;
        height: 44px;
      }
      .compose-mark .icon {
        width: 21px;
        height: 21px;
      }
      .compose-copy {
        width: 132px;
      }
      .compose-copy strong {
        font-size: 12px;
      }
      .compose-copy span {
        margin-top: 3px;
        font-size: 9px;
      }
      .nexus-compose .assistant-mode {
        min-height: 34px;
        gap: 7px;
        padding: 0 8px;
        font-size: 10px;
      }
      .compose-form {
        height: 50px;
        min-width: 240px;
        padding: 0 6px 0 16px;
        border: 1px solid rgba(129, 140, 248, 0.22);
        border-radius: 15px;
        background: rgba(255, 255, 255, 0.025);
      }
      .compose-form:focus-within {
        border-color: rgba(129, 140, 248, 0.58);
        box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.09);
      }
      .compose-form input {
        font-size: 13px;
      }
      .compose-form .mic-button {
        width: 38px;
        height: 38px;
      }
      .compose-prompts {
        max-width: 255px;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 7px 14px;
      }
      .compose-prompts button {
        padding-bottom: 3px;
        font-size: 10px;
      }

      /* Device context: flat inspector with readable controls. */
      .context-drawer {
        width: 336px;
        display: grid;
        grid-template-rows: auto auto minmax(0, 1fr);
        overflow: hidden;
      }
      .drawer-heading {
        min-height: 104px;
        gap: 15px;
        padding: 20px 22px;
      }
      .drawer-heading span {
        font-size: 9px;
      }
      .drawer-heading strong {
        margin-top: 7px;
        font-size: 16px;
      }
      .drawer-heading small {
        margin-top: 4px;
        font-size: 11px;
      }
      .drawer-close {
        display: none;
        width: 34px;
        height: 34px;
        align-items: center;
        justify-content: center;
        flex: none;
        border: 0;
        border-radius: 9px;
        background: transparent;
        color: var(--muted);
      }
      .drawer-tabs {
        height: 47px;
        padding: 0 17px;
      }
      .drawer-tabs button {
        height: 47px;
        font-size: 10px;
      }
      .drawer-panel.active {
        min-height: 0;
        overflow: auto;
      }
      .drawer-section {
        padding: 23px 22px;
      }
      .drawer-label {
        margin-bottom: 12px;
        font-size: 9px;
      }
      .level-control .level-readout strong {
        font-size: 48px;
      }
      .level-readout span {
        font-size: 11px;
      }
      .level-control input[type="range"] {
        margin-top: 22px;
      }
      .drawer-action {
        min-height: 67px;
        display: grid;
        grid-template-columns: 20px minmax(0, 1fr) 14px;
        gap: 12px;
        padding: 10px 0;
      }
      .drawer-action strong {
        font-size: 12px;
      }
      .drawer-action small {
        margin-top: 4px;
        font-size: 10px;
      }
      .drawer-details div {
        min-height: 47px;
      }
      .drawer-details dt,
      .drawer-details dd {
        font-size: 11px;
      }
      .diagnostics-line strong {
        font-size: 18px;
      }
      .diagnostics-line span {
        font-size: 9px;
      }
      .timeline-item strong {
        font-size: 12px;
      }
      .timeline-item span,
      .timeline-item time {
        font-size: 10px;
      }

      /* Secondary workspaces: readable and line-based. */
      .workspace-page {
        padding: 38px 44px 60px;
      }
      .workspace-head {
        gap: 28px;
        margin-bottom: 30px;
      }
      .workspace-head h2 {
        font-size: 34px;
      }
      .workspace-head p {
        max-width: 720px;
        margin-top: 12px;
        font-size: 13px;
        line-height: 1.6;
      }
      .content-split {
        min-height: 510px;
      }
      .content-nav {
        width: 220px;
        padding: 20px 22px 20px 0;
      }
      .content-nav button {
        height: 41px;
        border-radius: 0;
        font-size: 12px;
      }
      .content-nav button.active,
      .content-nav button:hover {
        background: linear-gradient(
          90deg,
          rgba(129, 140, 248, 0.1),
          transparent
        );
      }
      .content-nav button.active {
        border-left: 2px solid var(--primary);
      }
      .content-main {
        padding: 6px 0 6px 34px;
      }
      .section-block {
        padding: 24px 0;
      }
      .section-block-head {
        margin-bottom: 12px;
      }
      .section-anchor {
        margin: 34px 0 12px;
      }
      .section-anchor h3 {
        font-size: 17px;
      }
      .section-anchor p {
        margin-top: 6px;
        font-size: 12px;
      }
      .section-block h3 {
        font-size: 17px;
      }
      .section-block-head p {
        margin-top: 6px;
        font-size: 12px;
      }
      .data-row {
        min-height: 72px;
        gap: 14px;
        padding: 12px 0;
      }
      .row-icon {
        width: 40px;
        height: 40px;
      }
      .row-body strong {
        font-size: 13px;
      }
      .row-body span {
        margin-top: 4px;
        font-size: 11px;
      }
      .row-meta {
        font-size: 10px;
      }
      .status-pill {
        min-height: 25px;
        padding: 0 9px;
        font-size: 9px;
      }
      th {
        padding: 13px 11px;
        font-size: 9px;
      }
      td {
        padding: 14px 11px;
        font-size: 11px;
      }
      .metric-line {
        gap: 32px;
        padding: 22px 0;
      }
      .metric strong {
        font-size: 27px;
      }
      .metric span {
        margin-top: 3px;
        font-size: 10px;
      }
      .permission {
        font-size: 11px;
      }
      .setting-row {
        min-height: 70px;
      }
      .setting-copy strong {
        font-size: 13px;
      }
      .setting-copy span,
      .setting-value {
        font-size: 11px;
      }
      .agent-node strong {
        font-size: 12px;
      }
      .agent-node span {
        font-size: 10px;
      }
      .plan-hero h3 {
        font-size: 26px;
      }
      .plan-hero p {
        font-size: 12px;
      }
      .plan-price {
        font-size: 34px;
      }
      .plan-price small {
        font-size: 10px;
      }
      .audit-hash {
        font-size: 9px;
      }
      .support-search {
        height: 51px;
      }
      .support-search input {
        font-size: 12px;
      }
      .dialog-head h2 {
        font-size: 17px;
      }
      .dialog-head p,
      .field label {
        font-size: 11px;
      }
      .field input,
      .field select {
        height: 44px;
        padding: 0 12px;
        font-size: 13px;
      }
      .toast {
        min-width: 300px;
        padding: 14px 15px;
      }
      .toast strong {
        font-size: 12px;
      }
      .toast span {
        margin-top: 4px;
        font-size: 11px;
      }

      @media (max-width: 1320px) {
        .compose-prompts {
          display: none;
        }
        .context-drawer {
          width: 320px;
        }
      }

      @media (max-width: 1260px) {
        :root {
          --sidebar-w: 188px;
        }
        .context-drawer {
          width: 305px;
        }
        .studio-heading,
        .studio-insight {
          padding-left: 25px;
          padding-right: 25px;
        }
        .device-story {
          padding-left: 30px;
        }
        .device-story h2 {
          font-size: clamp(34px, 3.8vw, 52px);
        }
        .studio-scenes button:nth-child(2) {
          display: none;
        }
        .device-ribbon-item {
          flex-basis: 190px;
        }
        .compose-prompts button:nth-child(3) {
          display: none;
        }
      }

      @media (max-width: 1080px) {
        :root {
          --sidebar-w: 74px;
        }
        .sidebar {
          align-items: center;
          padding-left: 9px;
          padding-right: 9px;
        }
        .brand-lockup {
          justify-content: center;
          padding: 0;
        }
        .brand-lockup > div:last-child,
        .nav-label,
        .nav-link span,
        .nav-badge,
        .user-menu > span,
        .user-menu > .icon {
          display: none;
        }
        .nav-scroll,
        .sidebar-footer {
          width: 100%;
        }
        .nav-link,
        .user-menu {
          justify-content: center;
          padding-left: 0;
          padding-right: 0;
        }
        .nav-link[aria-current="page"]::before {
          left: -1px;
        }
        .topbar-center .quick-search {
          display: none;
        }
        .context-drawer {
          width: 334px;
          position: absolute;
          z-index: 40;
          top: 0;
          right: 0;
          bottom: 0;
          transform: translateX(102%);
          box-shadow: -26px 0 70px rgba(0, 0, 0, 0.56);
          transition: transform var(--ease);
        }
        body.inspector-open .context-drawer {
          transform: none;
        }
        .drawer-close {
          display: flex;
        }
        .studio-stage {
          grid-template-rows: 86px 42px minmax(285px, 1fr) 102px 90px;
        }
        .studio-modes {
          display: none;
        }
        .studio-scenes {
          gap: 16px;
        }
        .device-story {
          width: 45%;
        }
        .studio-product {
          width: 55%;
        }
        .compose-prompts {
          display: none;
        }
        .workspace-page {
          padding: 32px 28px 48px;
        }
      }

      @media (max-width: 780px) {
        :root {
          --sidebar-w: 58px;
          --topbar: 64px;
        }
        .sidebar {
          padding-left: 5px;
          padding-right: 5px;
        }
        .brand-mark {
          width: 36px;
          height: 36px;
        }
        .topbar {
          min-height: var(--topbar);
          height: var(--topbar);
          padding: 0 16px;
        }
        .page-copy {
          min-width: 0;
        }
        .page-copy h1 {
          font-size: 20px;
        }
        .core-state {
          display: none;
        }
        .studio-stage {
          grid-template-rows: 76px 42px minmax(260px, 1fr) 96px 84px;
        }
        .studio-heading {
          padding: 0 18px;
        }
        .studio-room {
          min-width: 0;
        }
        .studio-room h2 {
          font-size: 22px;
        }
        .studio-room p {
          font-size: 10px;
        }
        .studio-scenes button:not(:last-child) {
          display: none;
        }
        .studio-insight {
          padding: 0 18px;
        }
        .studio-insight span {
          max-width: 42vw;
        }
        .device-story {
          width: 62%;
          padding: 24px 16px 28px 24px;
          background: linear-gradient(
            90deg,
            #090a0e 0%,
            rgba(9, 10, 14, 0.88) 67%,
            transparent 100%
          );
        }
        [data-theme="light"] .device-story {
          background: linear-gradient(
            90deg,
            #f5f6f9 0%,
            rgba(245, 246, 249, 0.9) 67%,
            transparent 100%
          );
        }
        .device-story h2 {
          max-width: 360px;
          font-size: clamp(32px, 7vw, 46px);
        }
        .studio-product {
          width: 61%;
          position: absolute;
          inset: 0 0 0 auto;
          margin: 0;
          opacity: 0.72;
        }
        .story-facts {
          gap: 18px;
        }
        .story-facts div:nth-child(3) {
          display: none;
        }
        .device-ribbon {
          padding: 0 14px;
        }
        .ribbon-label {
          display: none;
        }
        .device-ribbon-item {
          min-width: 164px;
          flex-basis: 164px;
        }
        .device-ribbon-item:nth-of-type(n + 4) {
          display: flex;
        }
        .nexus-compose {
          padding: 11px 14px;
        }
        .compose-copy {
          display: none;
        }
        .nexus-compose .assistant-mode {
          display: none;
        }
        .compose-form {
          min-width: 0;
        }
        .context-drawer {
          width: min(336px, calc(100% - 12px));
        }
        .workspace-page {
          padding: 26px 18px 40px;
        }
        .workspace-head {
          flex-direction: column;
        }
        .workspace-head h2 {
          font-size: 29px;
        }
        .content-split {
          display: block;
        }
        .content-nav {
          width: 100%;
          display: flex;
          overflow: auto;
          padding: 10px 0;
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }
        .content-nav button {
          width: auto;
          min-width: max-content;
        }
        .content-main {
          padding-left: 0;
        }
        .metric-line {
          overflow: auto;
        }
      }

      @media (max-height: 760px) and (min-width: 781px) {
        :root {
          --topbar: 64px;
        }
        .topbar {
          min-height: var(--topbar);
          height: var(--topbar);
        }
        .studio-stage {
          grid-template-rows: 74px 38px minmax(245px, 1fr) 88px 78px;
        }
        .studio-room h2 {
          font-size: 21px;
        }
        .device-story {
          padding-top: 18px;
          padding-bottom: 22px;
        }
        .device-story h2 {
          font-size: clamp(32px, 3.6vw, 48px);
        }
        .story-facts {
          margin-top: 21px;
        }
        .device-ribbon-item {
          height: 72px;
        }
        .device-ribbon-item img {
          width: 44px;
          height: 44px;
        }
        .compose-mark {
          width: 38px;
          height: 38px;
        }
        .compose-form {
          height: 44px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          transition: none !important;
          animation: none !important;
        }
      }

      /* V7 identity polish — renderer-safe brand mark and account footer */
      .app-mark,
      .brand-mark,
      .compose-mark {
        position: relative;
        isolation: isolate;
        overflow: hidden;
      }
      .app-mark::before,
      .brand-mark::before,
      .compose-mark::before {
        content: "";
        position: absolute;
        z-index: -1;
        inset: 1px;
        border-radius: inherit;
        background: linear-gradient(
          145deg,
          rgba(255, 255, 255, 0.24),
          transparent 44%
        );
        pointer-events: none;
      }
      .brand-glyph {
        display: block;
        width: 58%;
        height: 58%;
        overflow: visible;
        fill: none;
        stroke: #fff;
        stroke-width: 2.25;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(0 1px 3px rgba(255, 255, 255, 0.18));
      }
      .app-mark .brand-glyph {
        width: 13px;
        height: 13px;
      }
      .brand-mark .brand-glyph {
        width: 24px;
        height: 24px;
      }
      .compose-mark .brand-glyph {
        width: 24px;
        height: 24px;
      }
      .brand-lockup > div:last-child {
        width: 116px;
        min-width: 0;
        flex: none;
        overflow: hidden;
      }
      .brand-lockup > div:last-child strong,
      .brand-lockup > div:last-child span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .sidebar-footer {
        padding: 12px 3px 1px;
      }
      .user-menu {
        min-width: 0;
        min-height: 52px;
        gap: 10px;
        padding: 7px;
        border-radius: 12px;
        color: var(--text);
        transition:
          background var(--ease),
          box-shadow var(--ease);
      }
      .user-menu:hover,
      .user-menu:focus-visible {
        background: rgba(129, 140, 248, 0.075);
        box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.09);
      }
      .user-menu .avatar {
        position: relative;
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        flex: none;
        border: 1px solid rgba(174, 182, 255, 0.34);
        border-radius: 50%;
        background:
          radial-gradient(
            circle at 30% 25%,
            rgba(255, 255, 255, 0.2),
            transparent 34%
          ),
          linear-gradient(145deg, #242a50, #171a2f);
        color: #eef0ff;
        font: 700 10px var(--font);
        letter-spacing: 0.02em;
        box-shadow: 0 7px 18px rgba(0, 0, 0, 0.22);
      }
      .profile-presence {
        position: absolute;
        right: -1px;
        bottom: 0;
        width: 9px;
        height: 9px;
        display: block;
        border: 2px solid var(--sidebar);
        border-radius: 50%;
        background: var(--green);
        box-shadow: 0 0 8px rgba(52, 211, 153, 0.42);
      }
      .user-copy {
        min-width: 0;
        width: 100px;
        flex: none;
        overflow: hidden;
      }
      .user-menu .user-copy strong,
      .user-menu .user-copy small {
        display: block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .user-menu .user-copy strong {
        color: var(--text);
        font: 650 11px var(--font);
        letter-spacing: -0.01em;
      }
      .user-menu .user-copy small {
        margin-top: 2px;
        color: var(--faint);
        font: 500 8px var(--font);
      }
      .user-menu > .icon {
        width: 14px;
        height: 14px;
        flex: none;
        margin-left: 0;
      }

      @media (max-width: 1080px) {
        .user-menu > .avatar {
          display: grid;
        }
        .profile-presence {
          display: block;
        }
        .user-menu > .user-copy,
        .user-menu > .icon {
          display: none;
        }
        .sidebar-footer {
          padding-left: 0;
          padding-right: 0;
        }
        .user-menu {
          min-height: 50px;
          padding-left: 0;
          padding-right: 0;
        }
      }

      /* V8 brand parity and home-header consolidation */
      .titlebar-brand {
        min-width: 0;
      }
      .titlebar-context {
        flex: none;
        max-width: 280px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .app-mark,
      .brand-mark,
      .compose-mark {
        display: block;
        flex: none;
        overflow: visible;
        border-radius: 0;
        background: none;
        box-shadow: none;
      }
      .app-mark {
        min-width: 20px;
        flex-basis: 20px;
      }
      .app-mark::before,
      .brand-mark::before,
      .compose-mark::before {
        display: none;
      }
      .brand-logo-svg {
        width: 100%;
        height: 100%;
        display: block;
      }

      .avatar,
      .user-menu .avatar {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        text-align: center;
        line-height: 1;
      }
      .avatar-fallback {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        line-height: 1;
      }
      .avatar > img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
      }

      body[data-current-view="home"] .topbar {
        display: none;
      }
      .studio-room p strong {
        color: var(--muted);
        font-weight: 650;
      }
      .studio-scenes .studio-icon-action {
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        flex: none;
        padding: 0;
        border: 1px solid var(--line);
        border-radius: 50%;
        background: rgba(129, 140, 248, 0.045);
        color: var(--muted);
      }
      .studio-scenes .studio-icon-action:hover {
        border-color: var(--line-2);
        background: rgba(129, 140, 248, 0.1);
        color: var(--text);
      }
      .studio-scenes .studio-icon-action .icon {
        width: 14px;
        height: 14px;
      }

      @media (max-width: 1080px) {
        .user-menu > .avatar {
          display: inline-flex;
        }
      }
      @media (max-width: 780px) {
        .studio-scenes button {
          display: none;
        }
        .studio-scenes button[data-inspector] {
          display: inline-flex;
          align-items: center;
        }
        .studio-scenes button[data-theme-toggle] {
          display: grid;
        }
      }
      @media (max-width: 720px) {
        .titlebar-context {
          display: none;
        }
      }

      /* V9 release polish: stable header, assistant, inspector and profile */
      .studio-heading {
        display: grid;
        grid-template-columns: minmax(225px, 1fr) auto auto;
        gap: 24px;
        padding-inline: 34px;
      }
      .studio-room,
      .studio-modes,
      .studio-scenes {
        min-width: 0;
      }
      .studio-modes {
        justify-content: center;
      }
      .studio-scenes {
        margin-left: 0;
        justify-content: flex-end;
        gap: 12px;
        white-space: nowrap;
      }
      .studio-scenes button:not(.studio-icon-action) {
        flex: none;
      }

      .nexus-compose {
        display: grid;
        grid-template-columns: 44px 132px max-content minmax(240px, 1fr);
        align-items: center;
        gap: 14px;
        padding-inline: 24px;
      }
      .compose-copy {
        width: auto;
        min-width: 0;
      }
      .compose-form {
        width: 100%;
        min-width: 0;
      }
      .compose-prompts {
        display: none;
      }
      .compose-form .mic-button {
        width: 34px;
        height: 34px;
        min-width: 34px;
        display: grid;
        place-items: center;
        flex: none;
        color: var(--primary);
      }
      .compose-form .mic-button .icon,
      .ribbon-add .icon {
        color: var(--primary);
      }

      .drawer-tabs {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        padding-inline: 8px;
      }
      .drawer-tabs button {
        width: 100%;
        min-width: 0;
        overflow: hidden;
        padding-inline: 2px;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 7px;
      }
      .drawer-live-context {
        padding-top: 16px;
        padding-bottom: 16px;
      }
      .live-context-list {
        margin: 0;
      }
      .live-context-list > div {
        min-height: 35px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        border-top: 1px solid var(--line);
      }
      .live-context-list > div:last-child {
        border-bottom: 1px solid var(--line);
      }
      .live-context-list dt {
        color: var(--faint);
        font-size: 7px;
      }
      .live-context-list dd {
        margin: 0;
        max-width: 58%;
        overflow: hidden;
        color: var(--muted);
        text-align: right;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 7px;
      }

      .user-menu .user-copy strong {
        font-size: 11.5px;
      }
      .user-menu .user-copy small {
        color: var(--muted);
        font-size: 9px;
      }

      @media (max-width: 1260px) {
        .studio-heading {
          grid-template-columns: minmax(220px, 1fr) auto auto;
          gap: 17px;
          padding-inline: 28px;
        }
        .studio-modes {
          gap: 14px;
        }
      }
      @media (max-width: 1080px) {
        .studio-heading {
          grid-template-columns: minmax(220px, 1fr) auto;
        }
      }
      @media (max-width: 780px) {
        .studio-heading {
          grid-template-columns: minmax(0, 1fr) auto;
          padding-inline: 20px;
        }
        .nexus-compose {
          grid-template-columns: 44px minmax(0, 1fr);
          gap: 14px;
          padding-inline: 18px;
        }
      }

      /* V10 — production states, readable density and Windows scaling */
      .compose-copy span {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .drawer-tabs button {
        font-size: 9px;
      }
      .live-context-list dt,
      .live-context-list dd {
        font-size: 10px;
      }
      .live-context-list > div {
        min-height: 39px;
      }
      .context-drawer button:disabled,
      .context-drawer input:disabled {
        cursor: not-allowed;
        opacity: 0.42;
      }

      /* Assistant state is visible without adding another dashboard card. */
      .nexus-compose {
        --assistant-state: var(--primary);
      }
      .compose-mark {
        position: relative;
        isolation: isolate;
      }
      .compose-mark::after {
        content: "";
        position: absolute;
        inset: -5px;
        z-index: -1;
        pointer-events: none;
        border: 1px solid var(--assistant-state);
        border-radius: 14px;
        opacity: 0;
        transform: scale(0.9);
        transition:
          opacity 180ms ease,
          transform 180ms ease,
          border-color 180ms ease;
      }
      .nexus-compose[data-assistant-state="listening"] {
        --assistant-state: var(--blue);
      }
      .nexus-compose[data-assistant-state="thinking"] {
        --assistant-state: var(--primary);
      }
      .nexus-compose[data-assistant-state="success"] {
        --assistant-state: var(--green);
      }
      .nexus-compose[data-assistant-state="error"] {
        --assistant-state: #fb7185;
      }
      .nexus-compose[data-assistant-state="listening"] .compose-mark::after,
      .nexus-compose[data-assistant-state="thinking"] .compose-mark::after,
      .nexus-compose[data-assistant-state="success"] .compose-mark::after,
      .nexus-compose[data-assistant-state="error"] .compose-mark::after {
        opacity: 1;
        transform: scale(1);
      }
      .nexus-compose[data-assistant-state="listening"] .compose-mark::after,
      .nexus-compose[data-assistant-state="thinking"] .compose-mark::after {
        animation: assistant-state-ring 1.35s ease-in-out infinite;
      }
      .nexus-compose[data-assistant-state="listening"] .mic-button {
        background: linear-gradient(145deg, #38bdf8, #6676f6);
        box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.1);
      }
      .nexus-compose[data-assistant-state="thinking"] .compose-form {
        border-color: rgba(129, 140, 248, 0.52);
      }
      .nexus-compose[data-assistant-state="success"] .compose-form {
        border-color: rgba(52, 211, 153, 0.4);
      }
      .nexus-compose[data-assistant-state="error"] .compose-form {
        border-color: rgba(251, 113, 133, 0.46);
      }
      .nexus-compose[data-assistant-state="success"] #trace-status {
        color: var(--green);
      }
      .nexus-compose[data-assistant-state="error"] #trace-status {
        color: #fb7185;
      }
      @keyframes assistant-state-ring {
        0%,
        100% {
          opacity: 0.42;
          transform: scale(0.94);
        }
        50% {
          opacity: 1;
          transform: scale(1.08);
        }
      }

      /* One reusable, host-driven surface covers loading and failure states. */
      .studio-visual {
        position: relative;
      }
      .device-state-panel {
        position: absolute;
        inset: 0;
        z-index: 12;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        padding: clamp(32px, 6vw, 82px);
        background:
          radial-gradient(
            circle at 68% 45%,
            rgba(129, 140, 248, 0.12),
            transparent 34%
          ),
          linear-gradient(90deg, #08090d, #0a0c12);
      }
      [data-theme="light"] .device-state-panel {
        background:
          radial-gradient(
            circle at 68% 45%,
            rgba(93, 92, 231, 0.1),
            transparent 34%
          ),
          linear-gradient(90deg, #f7f8fb, #f1f3f8);
      }
      .device-state-panel[hidden] {
        display: none;
      }
      .device-state-icon {
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        margin-bottom: 22px;
        border: 1px solid rgba(129, 140, 248, 0.3);
        border-radius: 15px;
        background: rgba(129, 140, 248, 0.09);
        color: var(--primary);
      }
      .device-state-icon .icon {
        width: 21px;
        height: 21px;
      }
      .device-state-kicker {
        color: var(--primary);
        font: 600 9px var(--mono);
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }
      .device-state-panel h2 {
        width: 100%;
        max-width: 620px;
        margin: 10px 0 0;
        font: 700 clamp(30px, 4vw, 48px) / 1 var(--font);
        letter-spacing: -0.045em;
      }
      .device-state-panel p {
        max-width: 560px;
        margin: 14px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.65;
      }
      .device-state-actions {
        display: flex;
        gap: 9px;
        margin-top: 25px;
      }
      .studio-stage[data-device-ui-state="loading"] .device-state-icon {
        animation: state-icon-pulse 1.2s ease-in-out infinite;
      }
      @keyframes state-icon-pulse {
        50% {
          transform: scale(1.08);
          box-shadow: 0 0 0 8px rgba(129, 140, 248, 0.07);
        }
      }

      /* Fill tall inspectors with useful trust context, not extra cards. */
      #panel-control.active {
        display: flex;
        flex-direction: column;
      }
      .drawer-trust-footer {
        margin-top: auto;
        padding: 20px 22px 22px;
        border-top: 1px solid var(--line);
        background: linear-gradient(
          180deg,
          transparent,
          rgba(129, 140, 248, 0.035)
        );
      }
      .drawer-trust-footer > span {
        display: block;
        color: var(--faint);
        font: 600 9px var(--mono);
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .trust-route {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 13px;
        color: var(--muted);
        font-size: 10px;
      }
      .trust-route i {
        width: 14px;
        height: 1px;
        flex: none;
        background: rgba(129, 140, 248, 0.42);
      }
      .drawer-trust-footer strong {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 15px;
        font-size: 11px;
      }
      .drawer-trust-footer strong .icon {
        width: 14px;
        height: 14px;
        color: var(--green);
      }
      .drawer-trust-footer small {
        display: block;
        margin-top: 5px;
        color: var(--faint);
        font-size: 9px;
        line-height: 1.45;
      }

      /* Secondary workspaces share one quieter product language. */
      body:not([data-current-view="home"]) .viewport {
        background:
          radial-gradient(
            circle at 78% 2%,
            rgba(129, 140, 248, 0.055),
            transparent 30%
          ),
          var(--bg);
      }
      .workspace-wrap {
        width: 100%;
      }
      .workspace-head {
        padding-bottom: 26px;
        border-bottom: 1px solid var(--line);
      }
      .workspace-head + .content-split,
      .workspace-head + .metric-line {
        margin-top: -1px;
      }
      .content-split {
        border-top-color: transparent;
      }
      .content-nav {
        position: sticky;
        top: 0;
        align-self: flex-start;
      }
      .content-nav button {
        min-height: 42px;
      }
      .content-main {
        padding-bottom: 28px;
      }
      .data-row,
      .setting-row {
        transition:
          background 160ms ease,
          padding 160ms ease;
      }
      .data-row:hover,
      .setting-row:hover {
        padding-left: 10px;
        padding-right: 10px;
        background: linear-gradient(
          90deg,
          rgba(129, 140, 248, 0.055),
          transparent 72%
        );
      }
      .table-wrap {
        border-bottom: 1px solid var(--line);
      }
      tbody tr {
        transition: background 150ms ease;
      }
      tbody tr:hover {
        background: rgba(129, 140, 248, 0.045);
      }

      /* 125–150% Windows display scaling: preserve breathing room. */
      @media (max-width: 1180px) {
        .studio-layout {
          position: relative;
        }
        .context-drawer {
          width: min(360px, calc(100% - 20px));
          position: absolute;
          z-index: 50;
          top: 0;
          right: 0;
          bottom: 0;
          transform: translateX(102%);
          box-shadow: -26px 0 70px rgba(0, 0, 0, 0.5);
          transition: transform var(--ease);
        }
        body.inspector-open .context-drawer {
          transform: none;
        }
        .drawer-close {
          display: flex;
        }
        .studio-heading {
          grid-template-columns: minmax(220px, 1fr) auto auto;
        }
        .studio-modes {
          gap: 16px;
        }
        .workspace-page {
          padding: 32px 30px 48px;
        }
        .workspace-head {
          gap: 20px;
        }
        .content-nav {
          width: 196px;
        }
        .content-main {
          padding-left: 28px;
        }
      }
      @media (max-width: 980px) {
        .studio-heading {
          grid-template-columns: minmax(0, 1fr) auto;
        }
        .studio-modes {
          display: none;
        }
        .workspace-head {
          flex-direction: column;
        }
        .workspace-actions {
          flex-wrap: wrap;
        }
        .content-split {
          display: block;
        }
        .content-nav {
          width: 100%;
          display: flex;
          position: static;
          overflow-x: auto;
          padding: 9px 0;
          border-right: 0;
          border-bottom: 1px solid var(--line);
          scrollbar-width: none;
        }
        .content-nav::-webkit-scrollbar {
          display: none;
        }
        .content-nav button {
          width: auto;
          min-width: max-content;
          padding-inline: 14px;
        }
        .content-main {
          padding-left: 0;
        }
        .metric-line {
          overflow-x: auto;
        }
      }
      @media (max-width: 780px) {
        .device-state-panel {
          padding: 30px 24px;
        }
        .device-state-panel h2 {
          font-size: 31px;
        }
        .device-state-panel p {
          font-size: 12px;
        }
        .device-state-actions {
          flex-wrap: wrap;
        }
      }
    `;
