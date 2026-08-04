import { describe, expect, it } from "vitest";
import { renderSetupDocument } from "./index.js";

describe("renderSetupDocument — desktop setup wizard", () => {
  const dark = renderSetupDocument({ theme: "dark" });
  const light = renderSetupDocument({ theme: "light" });

  it("renders a valid HTML document with setup-window", () => {
    expect(dark.startsWith("<!doctype html>")).toBe(true);
    expect(dark).toContain('class="setup-window"');
  });

  it("renders the vertical stepper with all 5 steps", () => {
    expect(dark).toContain('class="steps"');
    expect(dark).toContain("Welcome");
    expect(dark).toContain("License");
    expect(dark).toContain("Location");
    expect(dark).toContain("Installing");
    expect(dark).toContain("Finish");
  });

  it("renders the license acceptance checkbox", () => {
    expect(dark).toContain("I accept the license agreement");
    expect(dark).toContain('id="license-accept"');
  });

  it("renders the determinate progress bar", () => {
    expect(dark).toContain('class="progress"');
    expect(dark).toContain('class="progress-fill"');
  });

  it("renders the NEXUS logo with aria-label", () => {
    expect(dark).toContain('aria-label="NEXUS logo"');
  });

  it("renders premium monochrome window controls", () => {
    expect(dark).toContain('class="wctl"');
    // Must NOT contain old-style coloured traffic-light classes
    expect(dark).not.toContain("tl red");
    expect(dark).not.toContain("tl-red");
  });

  it("renders the Cancel, Back and Continue/Install/Finish buttons", () => {
    expect(dark).toContain('id="btn-cancel"');
    expect(dark).toContain('id="btn-back"');
    expect(dark).toContain('id="btn-next"');
  });

  it("renders the inline navigation script", () => {
    expect(dark).toContain("__nx_licenseChanged");
    expect(dark).toContain("nx-install");
  });

  it("renders the installation path field and Browse button", () => {
    expect(dark).toContain('id="install-path"');
    expect(dark).toContain("Program Files");
    expect(dark).toContain("Space required");

    const macSetup = renderSetupDocument({ theme: "dark", os: "mac" });
    expect(macSetup).toContain("/Applications/NEXUS.app");
  });

  it("renders the Finish step with NEXUS is ready message", () => {
    expect(dark).toContain("NEXUS is ready");
    expect(dark).toContain('id="launch-now"');
  });

  it("drives styles from design tokens (no hardcoded brand colors)", () => {
    // Both themes must reference their own primary via CSS variable
    expect(dark).toContain("--primary:");
    expect(light).toContain("--primary:");
    // Themes should differ in their bg value
    expect(dark).not.toContain("background: #ffffff");
  });

  it("renders data-theme attribute for both themes", () => {
    expect(dark).toContain('data-theme="dark"');
    expect(light).toContain('data-theme="light"');
  });
});
