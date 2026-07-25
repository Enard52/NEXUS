/**
 * NEXUS AI — Design System (FAZ 10)
 *
 * The single source of truth for design tokens (color, spacing, typography,
 * radii) and theme resolution. Every surface — desktop, mobile and the web
 * Download Center — must consume these tokens rather than hard-coding values,
 * so the brand identity stays consistent everywhere (FAZ 10 intent).
 *
 * Includes a WCAG contrast helper so accessibility can be verified in tests
 * instead of eyeballed. Dependency-free and deterministic.
 *
 * NOTE: the rendered Download Center page, live theming in a real UI, and the
 * "≥2 languages in the interface" acceptance all require the web/mobile front
 * ends (FAZ 9). This package provides the token + a11y foundation they build on.
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
  readonly radius: { readonly sm: number; readonly md: number; readonly lg: number; readonly xl: number };
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
  /** Primary display / UI font: Space Grotesk → Inter → system fallback. */
  family: "'Space Grotesk', 'Inter', system-ui, -apple-system, sans-serif",
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
    primary: "#4f46e5", // indigo primary for a premium feel, passes AA
    onPrimary: "#ffffff",
    accent: "#0ea5e9", // vibrant sky
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
    primary: "#818cf8", // slightly softer indigo for dark mode
    onPrimary: "#09090b",
    accent: "#38bdf8",
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
