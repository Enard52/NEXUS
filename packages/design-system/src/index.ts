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
  readonly radius: { readonly sm: number; readonly md: number; readonly lg: number };
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
    };
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

export const lightTheme: DesignTokens = {
  color: {
    bg: "#f8f9fa",
    surface: "#ffffff",
    text: "#12141a",
    textMuted: "#64748b",
    primary: "#6C4FE8",
    onPrimary: "#ffffff",
    accent: "#0EA5C9",
  },
  space: SPACE,
  radius: RADIUS,
  font: FONT,
};

export const darkTheme: DesignTokens = {
  color: {
    bg: "#0a0a0b",
    surface: "#111113",
    text: "#f8fafc",
    textMuted: "#94a3b8",
    primary: "#7C5CFF",
    onPrimary: "#0f0a1e",
    accent: "#22D3EE",
  },
  space: SPACE,
  radius: RADIUS,
  font: FONT,
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
