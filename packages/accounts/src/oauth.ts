/**
 * NEXUS AI — OAuth / Federated Identity Abstraction (Section H)
 *
 * Defines the provider-agnostic interface for social/federated login.
 * Concrete providers (Google, Apple, Microsoft, GitHub) implement AuthProvider;
 * tests use MockAuthProvider which never makes real network calls.
 *
 * Security requirements (enforced by callers, not this file):
 *  - Authorization Code + PKCE flow only; implicit flow forbidden.
 *  - state parameter for CSRF protection.
 *  - nonce for OIDC replay protection.
 *  - id_token signature + iss/aud/exp must be validated by concrete providers.
 *  - Client secrets are read from @nexus/config env — never hardcoded.
 */

import { randomBytes, createHash } from "node:crypto";

// ── External profile ─────────────────────────────────────────────────────────

/** Normalised user identity returned by any OAuth/OIDC provider. */
export interface ExternalProfile {
  /** Provider identifier, e.g. "google" | "apple" | "microsoft" | "github". */
  readonly provider: string;
  /** Stable, provider-assigned user ID ("sub" in OIDC). */
  readonly sub: string;
  readonly email?: string;
  /** True when the provider has verified the email address. */
  readonly emailVerified?: boolean;
  readonly name?: string;
  /** CDN URL of the user's profile picture (directly usable as avatarUrl). */
  readonly avatarUrl?: string;
}

// ── Provider interface ───────────────────────────────────────────────────────

/**
 * Abstraction over any OAuth 2.0 / OIDC identity provider.
 * Implementations must:
 *  - Use Authorization Code + PKCE.
 *  - Validate id_token signature and claims before returning ExternalProfile.
 *  - Never expose client secrets outside this layer.
 */
export interface AuthProvider {
  /** Stable provider identifier used in OAuthIdentity records. */
  readonly id: string;

  /**
   * Builds the authorization URL the user must visit.
   * @param state  Opaque CSRF token (caller generates via generateState()).
   * @param pkceChallenge  Base64url SHA-256 of the PKCE verifier.
   * @param nonce  OIDC nonce for replay protection.
   */
  authorizeUrl(state: string, pkceChallenge: string, nonce: string): string;

  /**
   * Exchanges an authorization code for an ExternalProfile.
   * Validates id_token claims (iss, aud, exp, nonce) internally.
   * @param code  Authorization code from the provider callback.
   * @param pkceVerifier  Raw PKCE verifier (paired with the challenge in authorizeUrl).
   */
  exchange(code: string, pkceVerifier: string): Promise<ExternalProfile>;
}

// ── PKCE helpers ─────────────────────────────────────────────────────────────

/** Generates a cryptographically random PKCE verifier and its S256 challenge. */
export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/** Generates a cryptographically random CSRF state token (128 bits, hex). */
export function generateState(): string {
  return randomBytes(16).toString("hex");
}

/** Generates a cryptographically random OIDC nonce (128 bits, hex). */
export function generateNonce(): string {
  return randomBytes(16).toString("hex");
}

// ── Mock provider (dev / test only) ─────────────────────────────────────────

/**
 * Deterministic mock provider for development and unit testing.
 * Returns a fixed ExternalProfile without making any network requests.
 */
export class MockAuthProvider implements AuthProvider {
  readonly id: string;
  private readonly profile: ExternalProfile;

  constructor(
    id = "mock",
    profile: ExternalProfile = {
      provider: "mock",
      sub: "mock_user_001",
      email: "mockuser@example.com",
      emailVerified: true,
      name: "Mock User",
      avatarUrl: undefined,
    },
  ) {
    this.id = id;
    this.profile = profile;
  }

  authorizeUrl(state: string, pkceChallenge: string, _nonce: string): string {
    return `https://mock.example.com/oauth/auth?state=${state}&code_challenge=${pkceChallenge}&response_type=code`;
  }

  /** Always resolves immediately with the fixed profile — no network call. */
  async exchange(_code: string, _pkceVerifier: string): Promise<ExternalProfile> {
    return { ...this.profile };
  }
}
