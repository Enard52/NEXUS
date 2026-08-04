/**
 * NEXUS AI — Design System
 *
 * The single source of truth for design tokens (color, spacing, typography,
 * radii) and theme resolution. Every surface — desktop, mobile and the web
 * Download Center — must consume these tokens rather than hard-coding values,
 * so the brand identity stays consistent everywhere .
 *
 * Includes a WCAG contrast helper so accessibility can be verified in tests
 * instead of eyeballed. Dependency-free and deterministic.
 *
 * NOTE: the rendered Download Center page, live theming in a real UI, and the
 * "≥2 languages in the interface" acceptance all require the web/mobile front
 * ends . This package provides the token + a11y foundation they build on.
 */

export interface ColorScale {
  readonly bg: string;
  readonly surface: string;
  readonly text: string;
  readonly textMuted: string;
  readonly primary: string;
  readonly onPrimary: string;
  /** Accent / secondary brand color (cyan). */
  readonly accent: string;
}

export interface DesignTokens {
  readonly color: ColorScale;
  /** Spacing scale in px, indexed 0..n (4pt grid). */
  readonly space: readonly number[];
  readonly radius: {
    readonly sm: number;
    readonly md: number;
    readonly lg: number;
    readonly xl: number;
  };
  readonly font: {
    readonly family: string;
    /** Monospace font stack for code/terminal surfaces. */
    readonly familyMono: string;
    /** Type scale in px. */
    readonly size: {
      readonly sm: number;
      readonly md: number;
      readonly lg: number;
      readonly xl: number;
      readonly xxl: number;
    };
  };
  readonly shadow: {
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
    readonly xl: string;
    readonly ring: string;
  };
  readonly transition: {
    readonly fast: string;
    readonly normal: string;
    readonly slow: string;
    readonly spring: string;
  };
}

const SPACE = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128] as const;

const FONT = {
  /** Primary display / UI font: Inter → system fallback (Space Grotesk removed for licensing). */
  family: "'Inter', system-ui, -apple-system, sans-serif",
  /** Monospace font for code, checksums, and terminal output. */
  familyMono: "'JetBrains Mono', 'Courier New', monospace",
  size: { sm: 12, md: 14, lg: 18, xl: 24, xxl: 32 },
} as const;

const RADIUS = { sm: 6, md: 12, lg: 24, xl: 32 } as const;

const TRANSITIONS = {
  fast: "160ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  normal: "220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  slow: "320ms ease",
  spring: "400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)",
} as const;

export const lightTheme: DesignTokens = {
  color: {
    bg: "#fcfcfd", // softer white
    surface: "#ffffff",
    text: "#0f172a", // rich slate
    textMuted: "#64748b",
    primary: "#6f9bff", // premium blue, matches premium-body.ts
    // Dark ink keeps the primary button above WCAG AA without muting the fill.
    onPrimary: "#0f172a",
    accent: "#5b8dff", // premium sky blue, matches premium-body.ts
  },
  space: SPACE,
  radius: RADIUS,
  font: FONT,
  shadow: {
    sm: "0 2px 4px rgba(0,0,0,0.02)",
    md: "0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)",
    lg: "0 12px 32px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
    xl: "0 24px 64px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06)",
    ring: "0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent)",
  },
  transition: TRANSITIONS,
};

export const darkTheme: DesignTokens = {
  color: {
    bg: "#09090b", // deep zinc
    surface: "#111113",
    text: "#f8fafc",
    textMuted: "#94a3b8",
    primary: "#8b7bff", // premium blue for dark mode, matches premium-body.ts
    onPrimary: "#09090b",
    accent: "#6f9bff", // premium sky blue for dark mode
  },
  space: SPACE,
  radius: RADIUS,
  font: FONT,
  shadow: {
    sm: "0 2px 4px rgba(0,0,0,0.2)",
    md: "0 4px 12px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
    lg: "0 12px 32px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)",
    xl: "0 24px 64px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)",
    ring: "0 0 0 3px color-mix(in srgb, var(--primary) 25%, transparent)",
  },
  transition: TRANSITIONS,
};

export type ThemeName = "light" | "dark";

export function getTheme(name: ThemeName): DesignTokens {
  return name === "dark" ? darkTheme : lightTheme;
}

/**
 * Detect the OS color-scheme preference via `prefers-color-scheme`. Returns the
 * preferred theme when the media query is available (browsers, desktop shells, and any
 * WebView that exposes `matchMedia`), otherwise `undefined` so callers can fall
 * back to their own default. Used by the desktop shell and web app to follow the
 * system theme out of the box while keeping an explicit user choice authoritative.
 */
export function detectSystemTheme(): ThemeName | undefined {
  if (typeof (globalThis as any).matchMedia !== "function") return undefined;
  const query = (globalThis as any).matchMedia("(prefers-color-scheme: dark)");
  // Older browsers expose `matches` without the newer `media`-check helpers; the
  // `matches` boolean is all we need. Guard `media` access for safety.
  if (!query || typeof query.matches !== "boolean") return undefined;
  return query.matches ? "dark" : "light";
}

// ── Accessibility: WCAG 2.1 relative luminance + contrast ratio ──────────────

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((x) => x + x)
          .join("")
      : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colors, in the range 1..21. */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** True when the pair meets WCAG AA for normal text (>= 4.5:1). */
export function meetsAaNormalText(fg: string, bg: string): boolean {
  return contrastRatio(fg, bg) >= 4.5;
}

export const moduleName = "design-system" as const;
export const implemented = true;

/**
 * Apply a smooth theme switch on the document element using design-system
 * transition tokens. Safe to call from web, desktop, and mobile shells.
 */
export function applyThemeTransition(
  theme: "light" | "dark",
  root?: {
    style: { setProperty: (k: string, v: string) => void };
    setAttribute: (k: string, v: string) => void;
  },
  transition: string = TRANSITIONS.normal,
): void {
  const el =
    root ??
    (typeof (globalThis as any).document !== "undefined"
      ? ((globalThis as any).document.documentElement as unknown as {
          style: { setProperty: (k: string, v: string) => void };
          setAttribute: (k: string, v: string) => void;
        })
      : { style: { setProperty() {} }, setAttribute() {} });
  el.style.setProperty("transition", `background-color ${transition}, color ${transition}`);
  el.setAttribute("data-theme", theme);
}

/** RTL locales used by NEXUS. */
export const RTL_LOCALES = new Set(["ar", "he"]);

/** Set document direction from a BCP-47 language tag. */
export function applyDocumentDirection(
  lang: string,
  root?: { setAttribute: (k: string, v: string) => void },
): void {
  const el =
    root ??
    (typeof (globalThis as any).document !== "undefined"
      ? ((globalThis as any).document.documentElement as unknown as {
          setAttribute: (k: string, v: string) => void;
        })
      : { setAttribute() {} });
  const base = (lang || "en").split("-")[0].toLowerCase();
  const dir = RTL_LOCALES.has(base) ? "rtl" : "ltr";
  el.setAttribute("dir", dir);
  el.setAttribute("lang", lang);
}
