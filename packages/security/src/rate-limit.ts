/**
 * NEXUS AI — Rate Limiting & Login Lockout (Section G)
 *
 * Sliding-window rate limiter and exponential-backoff lockout for login/register
 * endpoints. Dev: in-memory Map. FAZ 18: swap to Redis without changing callers.
 * Both classes accept a `now` clock injection for deterministic unit tests.
 */

export interface RateLimitOptions {
  /** Max allowed calls within the window. */
  readonly maxRequests: number;
  /** Window duration in milliseconds. */
  readonly windowMs: number;
  /** Clock injection for tests. Defaults to Date.now. */
  readonly now?: () => number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  /** ms until the oldest entry expires and a slot opens (only when !allowed). */
  readonly retryAfterMs?: number;
}

/**
 * Sliding-window rate limiter keyed by an arbitrary string (e.g. IP or email).
 * Each call to `check` records a hit; calls outside the window are discarded.
 */
export class RateLimiter {
  private readonly opts: Required<RateLimitOptions>;
  // key → sorted array of hit timestamps
  private readonly hits = new Map<string, number[]>();

  constructor(opts: RateLimitOptions) {
    this.opts = { now: Date.now, ...opts };
  }

  check(key: string): RateLimitResult {
    const now = this.opts.now();
    const cutoff = now - this.opts.windowMs;
    const history = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    history.push(now);
    this.hits.set(key, history);

    if (history.length > this.opts.maxRequests) {
      // oldest entry in window
      const oldest = history[0];
      const retryAfterMs = oldest + this.opts.windowMs - now;
      return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
    }
    return { allowed: true };
  }

  /** Remove all recorded hits for a key (e.g. after successful login). */
  reset(key: string): void {
    this.hits.delete(key);
  }
}

export interface LockoutOptions {
  /** Number of consecutive failures before the first lockout. Default 5. */
  readonly maxFailures?: number;
  /** Base lockout duration in ms. Doubles on each subsequent lockout. Default 30_000 (30s). */
  readonly baseLockoutMs?: number;
  /** Maximum lockout duration cap in ms. Default 3_600_000 (1h). */
  readonly maxLockoutMs?: number;
  readonly now?: () => number;
}

export interface LockoutResult {
  /** True when the account/IP is currently locked and the action must be rejected. */
  readonly locked: boolean;
  /** ms remaining in the current lockout (only when locked). */
  readonly remainingMs?: number;
}

interface LockoutState {
  failures: number;
  lockedUntil?: number;
  lockoutCount: number;
}

/**
 * Per-key exponential-backoff lockout. After `maxFailures` consecutive
 * failures the key is locked for `baseLockoutMs * 2^lockoutCount`.
 * A successful login resets the counter.
 */
export class LoginLockout {
  private readonly maxFailures: number;
  private readonly baseLockoutMs: number;
  private readonly maxLockoutMs: number;
  private readonly now: () => number;
  private readonly state = new Map<string, LockoutState>();

  constructor(opts: LockoutOptions = {}) {
    this.maxFailures = opts.maxFailures ?? 5;
    this.baseLockoutMs = opts.baseLockoutMs ?? 30_000;
    this.maxLockoutMs = opts.maxLockoutMs ?? 3_600_000;
    this.now = opts.now ?? Date.now;
  }

  /** Call on every failed login attempt. Returns lockout info if now locked. */
  recordFailure(key: string): LockoutResult {
    const s = this.state.get(key) ?? { failures: 0, lockoutCount: 0 };
    s.failures += 1;
    if (s.failures >= this.maxFailures) {
      const duration = Math.min(
        this.baseLockoutMs * Math.pow(2, s.lockoutCount),
        this.maxLockoutMs,
      );
      s.lockedUntil = this.now() + duration;
      s.lockoutCount += 1;
      s.failures = 0; // reset for next window
      this.state.set(key, s);
      return { locked: true, remainingMs: duration };
    }
    this.state.set(key, s);
    return { locked: false };
  }

  /** Call on successful login to clear failure history. */
  recordSuccess(key: string): void {
    this.state.delete(key);
  }

  /** Check whether a key is currently locked without recording a hit. */
  isLocked(key: string): LockoutResult {
    const s = this.state.get(key);
    if (!s?.lockedUntil) return { locked: false };
    const remaining = s.lockedUntil - this.now();
    if (remaining <= 0) {
      // Lock expired — clean up
      s.lockedUntil = undefined;
      return { locked: false };
    }
    return { locked: true, remainingMs: remaining };
  }
}
