import { describe, expect, it, vi } from "vitest";
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

describe("RateLimiter — exact boundaries", () => {
  it("allows exactly maxRequests hits and rejects the next one", () => {
    const rl = new RateLimiter({ maxRequests: 3, windowMs: 1_000, now: () => 0 });
    expect([1, 2, 3].map(() => rl.check("k").allowed)).toEqual([true, true, true]);
    expect(rl.check("k").allowed).toBe(false);
  });

  it("reports retryAfterMs as time until the oldest hit leaves the window", () => {
    let t = 1_000;
    const rl = new RateLimiter({ maxRequests: 2, windowMs: 10_000, now: () => t });
    rl.check("k"); // t=1000
    t = 4_000;
    rl.check("k");
    t = 6_000;
    // oldest (1000) expires at 11000 → 5000ms from now
    expect(rl.check("k")).toEqual({ allowed: false, retryAfterMs: 5_000 });
  });

  it("a hit exactly windowMs old is already outside the window", () => {
    let t = 0;
    const rl = new RateLimiter({ maxRequests: 1, windowMs: 1_000, now: () => t });
    expect(rl.check("k").allowed).toBe(true);
    t = 1_000;
    expect(rl.check("k").allowed).toBe(true);
  });

  it("slides: only hits that aged out free a slot", () => {
    let t = 0;
    const rl = new RateLimiter({ maxRequests: 2, windowMs: 1_000, now: () => t });
    rl.check("k"); // 0
    t = 600;
    rl.check("k"); // 600
    t = 1_100; // hit at 0 aged out, hit at 600 still counts
    expect(rl.check("k").allowed).toBe(true);
    t = 1_200;
    expect(rl.check("k").allowed).toBe(false);
  });

  it("reset only affects the given key and tolerates unknown keys", () => {
    const rl = new RateLimiter({ maxRequests: 1, windowMs: 1_000, now: () => 0 });
    rl.check("a");
    rl.check("b");
    expect(() => rl.reset("never-seen")).not.toThrow();
    rl.reset("a");
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("b").allowed).toBe(false);
  });

  it("falls back to Date.now when no clock is injected", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(0);
      const rl = new RateLimiter({ maxRequests: 1, windowMs: 1_000 });
      rl.check("k");
      expect(rl.check("k").allowed).toBe(false);
      vi.setSystemTime(1_001);
      expect(rl.check("k").allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("treats keys as exact strings (case and whitespace sensitive)", () => {
    const rl = new RateLimiter({ maxRequests: 1, windowMs: 1_000, now: () => 0 });
    rl.check("User@a.com");
    expect(rl.check("user@a.com").allowed).toBe(true);
    expect(rl.check("").allowed).toBe(true);
    expect(rl.check("").allowed).toBe(false);
  });

  it("maxRequests 0 rejects everything", () => {
    const rl = new RateLimiter({ maxRequests: 0, windowMs: 1_000, now: () => 0 });
    expect(rl.check("k").allowed).toBe(false);
  });
});

describe("LoginLockout — details", () => {
  it("uses defaults of 5 failures and 30s lockout", () => {
    const lo = new LoginLockout({ now: () => 0 });
    for (let i = 0; i < 4; i++) expect(lo.recordFailure("u").locked).toBe(false);
    expect(lo.recordFailure("u")).toEqual({ locked: true, remainingMs: 30_000 });
  });

  it("remainingMs counts down with the clock and unlocks exactly at lockedUntil", () => {
    let t = 0;
    const lo = new LoginLockout({ maxFailures: 1, baseLockoutMs: 1_000, now: () => t });
    lo.recordFailure("u");
    t = 400;
    expect(lo.isLocked("u")).toEqual({ locked: true, remainingMs: 600 });
    t = 1_000;
    expect(lo.isLocked("u")).toEqual({ locked: false });
  });

  it("doubles the duration per lockout: 1s, 2s, 4s", () => {
    let t = 0;
    const lo = new LoginLockout({ maxFailures: 1, baseLockoutMs: 1_000, now: () => t });
    const durations = [0, 1, 2].map(() => {
      const r = lo.recordFailure("u");
      t += 1_000_000; // let the lock expire
      return r.remainingMs;
    });
    expect(durations).toEqual([1_000, 2_000, 4_000]);
  });

  it("caps the duration at maxLockoutMs", () => {
    let t = 0;
    const lo = new LoginLockout({
      maxFailures: 1,
      baseLockoutMs: 1_000,
      maxLockoutMs: 3_000,
      now: () => t,
    });
    const durations = [0, 1, 2, 3].map(() => {
      const r = lo.recordFailure("u");
      t += 1_000_000;
      return r.remainingMs;
    });
    expect(durations).toEqual([1_000, 2_000, 3_000, 3_000]);
  });

  it("failures counted after a lockout start from zero again", () => {
    let t = 0;
    const lo = new LoginLockout({ maxFailures: 3, baseLockoutMs: 1_000, now: () => t });
    for (let i = 0; i < 3; i++) lo.recordFailure("u");
    t = 5_000;
    expect(lo.recordFailure("u").locked).toBe(false);
    expect(lo.recordFailure("u").locked).toBe(false);
    expect(lo.recordFailure("u").locked).toBe(true);
  });

  it("recordSuccess resets both the failure count and the backoff level", () => {
    let t = 0;
    const lo = new LoginLockout({ maxFailures: 2, baseLockoutMs: 1_000, now: () => t });
    lo.recordFailure("u");
    lo.recordFailure("u"); // lockout #1
    t = 10_000;
    lo.recordFailure("u"); // 1 pending failure
    lo.recordSuccess("u");
    expect(lo.recordFailure("u").locked).toBe(false); // pending failure was cleared
    expect(lo.recordFailure("u")).toEqual({ locked: true, remainingMs: 1_000 }); // level reset
  });

  it("isLocked does not record anything and ignores unknown keys", () => {
    const lo = new LoginLockout({ maxFailures: 2, now: () => 0 });
    for (let i = 0; i < 10; i++) expect(lo.isLocked("u").locked).toBe(false);
    expect(lo.recordFailure("u").locked).toBe(false);
  });

  it("keys are isolated", () => {
    const lo = new LoginLockout({ maxFailures: 1, now: () => 0 });
    lo.recordFailure("a");
    expect(lo.isLocked("a").locked).toBe(true);
    expect(lo.isLocked("b").locked).toBe(false);
    lo.recordSuccess("b");
    expect(lo.isLocked("a").locked).toBe(true);
  });
});
