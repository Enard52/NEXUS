/**
 * NEXUS AI — Account System & Authentication (FAZ 14)
 *
 * The mandatory precondition for the subscription model (FAZ 15). Provides
 * email/password registration and login, password reset, session management,
 * multi-device pairing, the role model hook (FAZ 12), and the user's right to
 * export and delete their own data (FAZ 19 / GDPR-KVKK link).
 *
 * Passwords are salted and hashed with scrypt (never stored in clear); session
 * tokens and reset tokens are cryptographically random.
 *
 * Storage is a {@link KeyValueStore} (FAZ 18 seam): the default is in-memory
 * for dev/test, but passing a durable store (e.g. SqliteKeyValueStore) makes
 * accounts, sessions and pairings survive restarts — with no caller changes.
 */

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { type RateLimiter, type LoginLockout } from "@nexus/security";
import { isDisposableEmail } from "@nexus/security";
import { InMemoryKeyValueStore, type KeyValueStore } from "@nexus/database";
import type { AuthProvider, ExternalProfile } from "./oauth.js";

export type Role = "admin" | "member" | "guest";

export interface Account {
  readonly id: string;
  readonly email: string;
  readonly role: Role;
  readonly createdAt: string;
  /** Linked OAuth identities (empty when using email+password only). */
  readonly identities?: readonly OAuthIdentity[];
}

/** Links an external OAuth provider identity to a NEXUS account. */
export interface OAuthIdentity {
  readonly provider: string;
  readonly sub: string;
}

export interface Session {
  readonly token: string;
  readonly userId: string;
  readonly expiresAt: number;
}

interface StoredAccount extends Account {
  readonly salt: string;
  readonly hash: string;
  identities: OAuthIdentity[];
}

export class AuthError extends Error {}

const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const RESET_TTL_MS = 1000 * 60 * 30; // 30m

// Namespaced key prefixes inside the KeyValueStore.
const K_ACCOUNT = "acct:"; // acct:<id> -> StoredAccount
const K_EMAIL = "acctEmail:"; // acctEmail:<normEmail> -> id
const K_SESSION = "sess:"; // sess:<token> -> Session
const K_RESET = "reset:"; // reset:<token> -> { userId, expiresAt }
const K_DEVICES = "dev:"; // dev:<userId> -> string[]
const K_OAUTH = "oauth:"; // oauth:<provider:sub> -> userId
const K_SEQ = "meta:acctSeq"; // -> number

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface RegisterInput {
  readonly email: string;
  readonly password: string;
  readonly role?: Role;
}

export interface AccountServiceOptions {
  readonly now?: () => number;
  readonly rateLimiter?: RateLimiter;
  readonly lockout?: LoginLockout;
  readonly emailBlocklist?: boolean; // default true
  /** Persistence backend. Defaults to a transient in-memory store. */
  readonly store?: KeyValueStore;
}

export class AccountService {
  private readonly store: KeyValueStore;
  private readonly now: () => number;
  private readonly rateLimiter?: RateLimiter;
  private readonly lockout?: LoginLockout;
  private readonly useEmailBlocklist: boolean;

  constructor(opts: AccountServiceOptions | (() => number) = {}) {
    if (typeof opts === "function") {
      // Backwards-compatible: AccountService(() => customNow)
      this.now = opts;
      this.useEmailBlocklist = true;
      this.store = new InMemoryKeyValueStore();
    } else {
      this.now = opts.now ?? (() => Date.now());
      this.rateLimiter = opts.rateLimiter;
      this.lockout = opts.lockout;
      this.useEmailBlocklist = opts.emailBlocklist ?? true;
      this.store = opts.store ?? new InMemoryKeyValueStore();
    }
  }

  // ── Storage helpers ──────────────────────────────────────────────────────

  private readJson<T>(key: string): T | undefined {
    const raw = this.store.get(key);
    return raw === undefined ? undefined : (JSON.parse(raw) as T);
  }

  private accountById(id: string): StoredAccount | undefined {
    return this.readJson<StoredAccount>(K_ACCOUNT + id);
  }

  private accountByEmail(email: string): StoredAccount | undefined {
    const id = this.store.get(K_EMAIL + email);
    return id === undefined ? undefined : this.accountById(id);
  }

  private saveAccount(a: StoredAccount): void {
    this.store.set(K_ACCOUNT + a.id, JSON.stringify(a));
    this.store.set(K_EMAIL + a.email, a.id);
  }

  private nextSeq(): number {
    const current = Number(this.store.get(K_SEQ) ?? "0");
    const next = current + 1;
    this.store.set(K_SEQ, String(next));
    return next;
  }

  register(input: RegisterInput): Account {
    const email = normalizeEmail(input.email);
    if (!email.includes("@")) throw new AuthError("A valid email is required.");
    if (this.useEmailBlocklist && isDisposableEmail(email)) {
      throw new AuthError("This email domain is not accepted.");
    }
    if (input.password.length < 8) throw new AuthError("Password must be at least 8 characters.");
    if (this.accountByEmail(email))
      throw new AuthError("An account with this email already exists.");

    const salt = randomBytes(16).toString("hex");
    const stored: StoredAccount = {
      id: `acct_${this.nextSeq()}`,
      email,
      role: input.role ?? "member",
      createdAt: new Date(this.now()).toISOString(),
      salt,
      hash: hashPassword(input.password, salt),
      identities: [],
    };
    this.saveAccount(stored);
    return this.publicView(stored);
  }

  /** Verify credentials and open a new session. */
  login(email: string, password: string): Session {
    const normalEmail = normalizeEmail(email);
    // Check lockout first (before any DB lookup to avoid timing info)
    if (this.lockout) {
      const lock = this.lockout.isLocked(normalEmail);
      if (lock.locked) {
        throw new AuthError(
          `Account temporarily locked. Try again in ${Math.ceil((lock.remainingMs ?? 0) / 1000)}s.`,
        );
      }
    }
    if (this.rateLimiter) {
      const rl = this.rateLimiter.check(normalEmail);
      if (!rl.allowed) {
        throw new AuthError(
          `Too many login attempts. Try again in ${Math.ceil((rl.retryAfterMs ?? 0) / 1000)}s.`,
        );
      }
    }

    const stored = this.accountByEmail(normalEmail);
    // Compare against a dummy hash when the account is missing to avoid timing leaks.
    const salt = stored?.salt ?? "00";
    const candidate = hashPassword(password, salt);
    if (!stored || !safeEqualHex(candidate, stored.hash)) {
      if (this.lockout) this.lockout.recordFailure(normalEmail);
      throw new AuthError("Invalid email or password.");
    }

    if (this.lockout) this.lockout.recordSuccess(normalEmail);
    if (this.rateLimiter) this.rateLimiter.reset(normalEmail);
    return this.createSession(stored.id);
  }

  /**
   * Open a session for a fresh anonymous guest. Creates a real account with the
   * `guest` role and a synthetic, unguessable password hash (so it can never be
   * signed into with a password) — this gives the visitor durable per-user data
   * through the exact same path as a full account, with no credentials required.
   */
  loginAsGuest(): Session {
    const id = `acct_${this.nextSeq()}`;
    const salt = randomBytes(16).toString("hex");
    const stored: StoredAccount = {
      id,
      email: `guest.${id}@guest.nexus.internal`,
      role: "guest",
      createdAt: new Date(this.now()).toISOString(),
      salt,
      // Random unguessable hash — a guest account cannot be used with password login.
      hash: randomBytes(64).toString("hex"),
      identities: [],
    };
    this.saveAccount(stored);
    return this.createSession(id);
  }

  private createSession(userId: string): Session {
    const session: Session = {
      token: randomBytes(24).toString("hex"),
      userId,
      expiresAt: this.now() + SESSION_TTL_MS,
    };
    this.store.set(K_SESSION + session.token, JSON.stringify(session));
    return session;
  }

  /** Return the account for a live session, or undefined if invalid/expired. */
  validateSession(token: string): Account | undefined {
    const session = this.readJson<Session>(K_SESSION + token);
    if (!session) return undefined;
    if (session.expiresAt <= this.now()) {
      this.store.delete(K_SESSION + token);
      return undefined;
    }
    const stored = this.accountById(session.userId);
    return stored ? this.publicView(stored) : undefined;
  }

  logout(token: string): void {
    this.store.delete(K_SESSION + token);
  }

  /** Issue a single-use reset token (delivered out-of-band in a real system). */
  requestPasswordReset(email: string): string | undefined {
    const stored = this.accountByEmail(normalizeEmail(email));
    if (!stored) return undefined; // Do not reveal whether the email exists.
    const token = randomBytes(24).toString("hex");
    this.store.set(
      K_RESET + token,
      JSON.stringify({ userId: stored.id, expiresAt: this.now() + RESET_TTL_MS }),
    );
    return token;
  }

  confirmPasswordReset(token: string, newPassword: string): void {
    const entry = this.readJson<{ userId: string; expiresAt: number }>(K_RESET + token);
    if (!entry || entry.expiresAt <= this.now())
      throw new AuthError("Reset token is invalid or expired.");
    if (newPassword.length < 8) throw new AuthError("Password must be at least 8 characters.");
    const stored = this.accountById(entry.userId)!;
    const salt = randomBytes(16).toString("hex");
    const updated: StoredAccount = { ...stored, salt, hash: hashPassword(newPassword, salt) };
    this.saveAccount(updated);
    this.store.delete(K_RESET + token);
    // Reset invalidates existing sessions.
    this.deleteSessionsFor(stored.id);
  }

  private deleteSessionsFor(userId: string): void {
    for (const key of this.store.keys(K_SESSION)) {
      const s = this.readJson<Session>(key);
      if (s && s.userId === userId) this.store.delete(key);
    }
  }

  /** Pair an additional device to the account (multi-device login, FAZ 14). */
  pairDevice(userId: string, deviceId: string): void {
    const list = this.readJson<string[]>(K_DEVICES + userId) ?? [];
    if (!list.includes(deviceId)) list.push(deviceId);
    this.store.set(K_DEVICES + userId, JSON.stringify(list));
  }

  listDevices(userId: string): readonly string[] {
    return this.readJson<string[]>(K_DEVICES + userId) ?? [];
  }

  /** GDPR/KVKK data export — the user's own data, minus secrets. */
  exportData(userId: string): { account: Account; devices: readonly string[] } | undefined {
    const stored = this.accountById(userId);
    if (!stored) return undefined;
    return { account: this.publicView(stored), devices: this.listDevices(userId) };
  }

  /** Right to erasure — remove the account and everything attached to it. */
  deleteAccount(userId: string): boolean {
    const stored = this.accountById(userId);
    if (!stored) return false;
    this.store.delete(K_ACCOUNT + userId);
    this.store.delete(K_EMAIL + stored.email);
    this.store.delete(K_DEVICES + userId);
    this.deleteSessionsFor(userId);
    for (const key of this.store.keys(K_RESET)) {
      const r = this.readJson<{ userId: string }>(key);
      if (r && r.userId === userId) this.store.delete(key);
    }
    for (const identity of stored.identities) {
      this.store.delete(K_OAUTH + `${identity.provider}:${identity.sub}`);
    }
    return true;
  }

  getAccount(id: string): Account | undefined {
    const stored = this.accountById(id);
    return stored ? this.publicView(stored) : undefined;
  }

  /**
   * Authenticates via an external OAuth provider and returns a session.
   *
   * Resolution order:
   *  1. Match by provider + sub (returning user).
   *  2. Match by verified email (link provider to existing account).
   *  3. Create a new account with a random unguessable password hash.
   */
  loginWithProvider(
    profile: ExternalProfile,
    // The provider param is kept for future rate-limiting / audit purposes
    _provider: AuthProvider,
  ): Session {
    const key = `${profile.provider}:${profile.sub}`;

    // 1. Returning user — matched by provider + sub
    const existingId = this.store.get(K_OAUTH + key);
    if (existingId) {
      const acct = this.accountById(existingId);
      if (acct) return this.createSession(acct.id);
    }

    // 2. Email linking — only when email is verified
    if (profile.email && profile.emailVerified) {
      const norm = profile.email.trim().toLowerCase();
      const existing = this.accountByEmail(norm);
      if (existing) {
        // Link the new provider to the existing account
        existing.identities.push({ provider: profile.provider, sub: profile.sub });
        this.saveAccount(existing);
        this.store.set(K_OAUTH + key, existing.id);
        return this.createSession(existing.id);
      }
    }

    // 3. New account — derive email or use a synthetic placeholder
    const email =
      profile.email?.trim().toLowerCase() ??
      `${profile.provider}.${profile.sub}@oauth.nexus.internal`;
    const salt = randomBytes(16).toString("hex");
    // Random unguessable hash — this account cannot be used with password login
    const hash = randomBytes(64).toString("hex");
    const stored: StoredAccount = {
      id: `acct_${this.nextSeq()}`,
      email,
      role: "member",
      createdAt: new Date(this.now()).toISOString(),
      salt,
      hash,
      identities: [{ provider: profile.provider, sub: profile.sub }],
    };
    this.saveAccount(stored);
    this.store.set(K_OAUTH + key, stored.id);
    return this.createSession(stored.id);
  }

  private publicView(a: StoredAccount): Account {
    return {
      id: a.id,
      email: a.email,
      role: a.role,
      createdAt: a.createdAt,
      identities: [...a.identities],
    };
  }
}

export * from "./family.js";
export * from "./oauth.js";
export * from "./providers.js";
export * from "./bridge.js";

export const moduleName = "accounts" as const;
export const implemented = true;
