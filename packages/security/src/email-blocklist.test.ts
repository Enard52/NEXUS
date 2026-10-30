import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DISPOSABLE_DOMAIN_COUNT, isDisposableEmail } from "./index.js";

describe("isDisposableEmail — disposable address blocklist", () => {
  it("identifies well-known throwaway domains", () => {
    expect(isDisposableEmail("tester@mailinator.com")).toBe(true);
    expect(isDisposableEmail("anon@guerrillamail.com")).toBe(true);
    expect(isDisposableEmail("tmp@yopmail.com")).toBe(true);
    expect(isDisposableEmail("x@10minutemail.com")).toBe(true);
    expect(isDisposableEmail("a@trashmail.com")).toBe(true);
  });

  it("allows legitimate domains", () => {
    expect(isDisposableEmail("user@gmail.com")).toBe(false);
    expect(isDisposableEmail("user@outlook.com")).toBe(false);
    expect(isDisposableEmail("user@company.io")).toBe(false);
    expect(isDisposableEmail("user@nexus-ai.example.com")).toBe(false);
  });

  it("is case-insensitive on the domain part", () => {
    expect(isDisposableEmail("x@MAILINATOR.COM")).toBe(true);
    expect(isDisposableEmail("x@Guerrillamail.Com")).toBe(true);
  });

  it("returns false for malformed addresses (no @)", () => {
    expect(isDisposableEmail("notanemail")).toBe(false);
    expect(isDisposableEmail("")).toBe(false);
  });

  it("exports the domain count for observability", () => {
    expect(DISPOSABLE_DOMAIN_COUNT).toBeGreaterThan(20);
  });
});

describe("isDisposableEmail — matching edge cases", () => {
  it("ignores the local part, including plus-addressing and dots", () => {
    expect(isDisposableEmail("user+newsletter@mailinator.com")).toBe(true);
    expect(isDisposableEmail("first.last@yopmail.com")).toBe(true);
    expect(isDisposableEmail("mailinator.com@gmail.com")).toBe(false);
    expect(isDisposableEmail("user+mailinator.com@gmail.com")).toBe(false);
  });

  it("trims whitespace around the domain", () => {
    expect(isDisposableEmail("x@mailinator.com ")).toBe(true);
    expect(isDisposableEmail("x@ mailinator.com")).toBe(true);
    expect(isDisposableEmail("x@\tYOPMAIL.com\n")).toBe(true);
  });

  it("judges by the part after the last @", () => {
    expect(isDisposableEmail('"a@b"@mailinator.com')).toBe(true);
    expect(isDisposableEmail("x@mailinator.com@gmail.com")).toBe(false);
  });

  it("requires an exact domain match, not a substring", () => {
    expect(isDisposableEmail("x@notmailinator.com")).toBe(false);
    expect(isDisposableEmail("x@mailinator.com.evil.org")).toBe(false);
    expect(isDisposableEmail("x@mailinator.co")).toBe(false);
    expect(isDisposableEmail("x@mailinator")).toBe(false);
  });

  it("returns false for empty or missing domains without throwing", () => {
    expect(isDisposableEmail("x@")).toBe(false);
    expect(isDisposableEmail("@")).toBe(false);
    expect(isDisposableEmail("@mailinator")).toBe(false);
    expect(isDisposableEmail("   ")).toBe(false);
  });
});

describe("disposable domain list integrity", () => {
  const source = readFileSync(new URL("./email-blocklist.ts", import.meta.url), "utf8");
  const block = /new Set\(\[([\s\S]*?)\]\)/.exec(source)?.[1] ?? "";
  const domains = [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1] as string);

  it("parses the list from the source", () => {
    expect(domains.length).toBeGreaterThan(0);
  });

  it("matches the exported DISPOSABLE_DOMAIN_COUNT (no duplicates)", () => {
    expect(new Set(domains).size).toBe(domains.length);
    expect(DISPOSABLE_DOMAIN_COUNT).toBe(domains.length);
  });

  it("contains only lowercase, trimmed, well-formed domains", () => {
    for (const d of domains) {
      expect(d, d).toBe(d.trim().toLowerCase());
      expect(d, d).toMatch(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/);
    }
  });

  it("flags every listed domain", () => {
    for (const d of domains) expect(isDisposableEmail(`user@${d}`), d).toBe(true);
  });
});
