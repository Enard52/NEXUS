import { describe, expect, it } from "vitest";
import { LoginLockout, RateLimiter } from "./index.js";

describe("RateLimiter — sliding window", () => {
  it("allows requests within the limit", () => {
    let t = 0;
    const rl = new RateLimiter({ maxRequests: 3, windowMs: 60_000, now: () => t });
    expect(rl.check("user@a.com").allowed).toBe(true);
    expect(rl.check("user@a.com").allowed).toBe(true);
    expect(rl.check("user@a.com").allowed).toBe(true);
  });

  it("blocks after exceeding the limit", () => {
    let t = 0;
    const rl = new RateLimiter({ maxRequests: 2, windowMs: 60_000, now: () => t });
    rl.check("x");
    rl.check("x");
    const result = rl.check("x");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("allows again after the window expires", () => {
    let t = 0;
    const rl = new RateLimiter({ maxRequests: 1, windowMs: 1_000, now: () => t });
    rl.check("k");
    expect(rl.check("k").allowed).toBe(false);
    t = 1_001; // advance past window
    expect(rl.check("k").allowed).toBe(true);
  });

  it("reset clears hit history", () => {
    let t = 0;
    const rl = new RateLimiter({ maxRequests: 1, windowMs: 60_000, now: () => t });
    rl.check("k");
    expect(rl.check("k").allowed).toBe(false);
    rl.reset("k");
    expect(rl.check("k").allowed).toBe(true);
  });

  it("different keys are independent", () => {
    let t = 0;
    const rl = new RateLimiter({ maxRequests: 1, windowMs: 60_000, now: () => t });
    rl.check("a");
    expect(rl.check("a").allowed).toBe(false);
    expect(rl.check("b").allowed).toBe(true);
  });
});

describe("LoginLockout — exponential backoff", () => {
  it("does not lock before reaching maxFailures", () => {
    let t = 0;
    const lo = new LoginLockout({ maxFailures: 3, baseLockoutMs: 1_000, now: () => t });
    expect(lo.recordFailure("u").locked).toBe(false);
    expect(lo.recordFailure("u").locked).toBe(false);
  });

  it("locks after maxFailures consecutive failures", () => {
    let t = 0;
    const lo = new LoginLockout({ maxFailures: 3, baseLockoutMs: 1_000, now: () => t });
    lo.recordFailure("u");
    lo.recordFailure("u");
    const result = lo.recordFailure("u");
    expect(result.locked).toBe(true);
    expect(result.remainingMs).toBeGreaterThan(0);
  });

  it("isLocked returns true while locked", () => {
    let t = 0;
    const lo = new LoginLockout({ maxFailures: 2, baseLockoutMs: 5_000, now: () => t });
    lo.recordFailure("u");
    lo.recordFailure("u");
    expect(lo.isLocked("u").locked).toBe(true);
  });

  it("isLocked returns false after lock expires", () => {
    let t = 0;
    const lo = new LoginLockout({ maxFailures: 2, baseLockoutMs: 1_000, now: () => t });
    lo.recordFailure("u");
    lo.recordFailure("u");
    t = 2_000; // advance past lockout
    expect(lo.isLocked("u").locked).toBe(false);
  });

  it("recordSuccess clears lockout state", () => {
    let t = 0;
    const lo = new LoginLockout({ maxFailures: 2, baseLockoutMs: 30_000, now: () => t });
    lo.recordFailure("u");
    lo.recordFailure("u");
    lo.recordSuccess("u");
    expect(lo.isLocked("u").locked).toBe(false);
  });

  it("lockout duration doubles on repeated lockouts", () => {
    let t = 0;
    const lo = new LoginLockout({ maxFailures: 2, baseLockoutMs: 1_000, now: () => t });
    // First lockout
    lo.recordFailure("u");
    lo.recordFailure("u");
    const first = lo.isLocked("u");
    expect(first.locked).toBe(true);
    // Expire the first lockout
    t = 2_000;
    // Second lockout
    lo.recordFailure("u");
    lo.recordFailure("u");
    const second = lo.isLocked("u");
    expect(second.locked).toBe(true);
    expect(second.remainingMs ?? 0).toBeGreaterThan(first.remainingMs ?? 0);
  });
});
