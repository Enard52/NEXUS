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
