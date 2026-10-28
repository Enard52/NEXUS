import { describe, expect, it } from "vitest";
import { AccountService } from "./index.js";
import {
  generateNonce,
  generatePkce,
  generateState,
  MockAuthProvider,
  type ExternalProfile,
} from "./oauth.js";

describe("PKCE + state helpers", () => {
  it("generatePkce produces a verifier and a distinct challenge", () => {
    const { verifier, challenge } = generatePkce();
    expect(verifier.length).toBeGreaterThan(32);
    expect(challenge.length).toBeGreaterThan(32);
    expect(verifier).not.toBe(challenge);
  });

  it("generatePkce is non-deterministic", () => {
    const a = generatePkce();
    const b = generatePkce();
    expect(a.verifier).not.toBe(b.verifier);
    expect(a.challenge).not.toBe(b.challenge);
  });

  it("generateState returns a non-empty hex string", () => {
    const s = generateState();
    expect(s.length).toBeGreaterThan(16);
    expect(/^[0-9a-f]+$/.test(s)).toBe(true);
  });

  it("generateNonce returns a non-empty hex string", () => {
    const n = generateNonce();
    expect(n.length).toBeGreaterThan(16);
    expect(/^[0-9a-f]+$/.test(n)).toBe(true);
  });
});

describe("MockAuthProvider", () => {
  it("authorizeUrl includes state and code_challenge", () => {
    const provider = new MockAuthProvider();
    const url = provider.authorizeUrl("state123", "challenge456", "nonce789");
    expect(url).toContain("state123");
    expect(url).toContain("challenge456");
  });

  it("exchange resolves with the fixed profile", async () => {
    const provider = new MockAuthProvider();
    const profile = await provider.exchange("code", "verifier");
    expect(profile.provider).toBe("mock");
    expect(profile.sub).toBe("mock_user_001");
    expect(profile.emailVerified).toBe(true);
  });
});

describe("AccountService.loginWithProvider", () => {
  function makeProfile(overrides: Partial<ExternalProfile> = {}): ExternalProfile {
    return {
      provider: "google",
      sub: "google_sub_001",
      email: "social@example.com",
      emailVerified: true,
      name: "Social User",
      ...overrides,
    };
  }

  it("creates a new account on first login", async () => {
    const svc = new AccountService();
    const provider = new MockAuthProvider();
    const profile = makeProfile();
    const session = svc.loginWithProvider(profile, provider);
    expect(session.token).toBeDefined();
    expect(session.userId).toBeTruthy();
  });

  it("returns the same account on repeated login with same sub", async () => {
    const svc = new AccountService();
    const provider = new MockAuthProvider();
    const profile = makeProfile();
    const s1 = svc.loginWithProvider(profile, provider);
    const s2 = svc.loginWithProvider(profile, provider);
    expect(s1.userId).toBe(s2.userId);
  });

  it("links provider to existing email+password account when email is verified", async () => {
    const svc = new AccountService();
    const provider = new MockAuthProvider();
    // First register with email+password
    const acct = svc.register({ email: "social@example.com", password: "Password1!" });
    // Then login with OAuth using the same verified email
    const session = svc.loginWithProvider(makeProfile(), provider);
    expect(session.userId).toBe(acct.id);
  });

  it("does NOT link when email is not verified", async () => {
    const svc = new AccountService();
    const provider = new MockAuthProvider();
    // Register an account
    const acct = svc.register({ email: "social@example.com", password: "Password1!" });
    // OAuth profile with same email but NOT verified
    const session = svc.loginWithProvider(makeProfile({ emailVerified: false }), provider);
    // Should create a separate account, not link to existing
    expect(session.userId).not.toBe(acct.id);
  });

  it("exposed identities on account include the linked provider", async () => {
    const svc = new AccountService();
    const provider = new MockAuthProvider();
    const profile = makeProfile({ email: "newuser@example.com" });
    const session = svc.loginWithProvider(profile, provider);
    const acct = svc.getAccount(session.userId);
    expect(acct?.identities?.some((i) => i.provider === "google")).toBe(true);
  });
});
