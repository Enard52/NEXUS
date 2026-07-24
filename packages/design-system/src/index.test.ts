import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  darkTheme,
  getTheme,
  implemented,
  lightTheme,
  meetsAaNormalText,
  moduleName,
} from "./index.js";

describe("@nexus/design-system module identity", () => {
  it("reports itself as implemented", () => {
    expect(moduleName).toBe("design-system");
    expect(implemented).toBe(true);
  });
});

describe("design tokens (FAZ 10)", () => {
  it("resolves themes by name", () => {
    expect(getTheme("light")).toBe(lightTheme);
    expect(getTheme("dark")).toBe(darkTheme);
  });

  it("keeps non-color tokens identical across themes (single source of truth)", () => {
    expect(darkTheme.space).toEqual(lightTheme.space);
    expect(darkTheme.radius).toEqual(lightTheme.radius);
    expect(darkTheme.font).toEqual(lightTheme.font);
  });
});

describe("accessibility contrast (FAZ 10)", () => {
  it("computes black-on-white at the maximum 21:1 ratio", () => {
    expect(Math.round(contrastRatio("#000000", "#ffffff"))).toBe(21);
  });

  it("verifies primary text meets WCAG AA on its background in both themes", () => {
    expect(meetsAaNormalText(lightTheme.color.text, lightTheme.color.bg)).toBe(true);
    expect(meetsAaNormalText(darkTheme.color.text, darkTheme.color.bg)).toBe(true);
  });

  it("verifies the primary button label contrasts with the primary fill", () => {
    expect(meetsAaNormalText(lightTheme.color.onPrimary, lightTheme.color.primary)).toBe(true);
  });
});
