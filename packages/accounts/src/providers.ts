/**
 * NEXUS AI — Concrete OAuth / OIDC providers (Section H)
 *
 * Real, production-shaped implementations of the {@link AuthProvider}
 * abstraction for Google and Apple. Both use the Authorization Code + PKCE
 * flow; secrets are supplied by the caller (read from env, never hardcoded).
 *
 *  - Google: standard OIDC. The id_token (a signed JWT) carries the verified
 *    profile; we validate iss/aud/exp/nonce before trusting it.
 *  - Apple: "Sign in with Apple". The client secret is itself an ES256-signed
 *    JWT generated from the team's .p8 private key; the callback arrives via
 *    form_post and the id_token carries the (relay) email.
 *
 * These make real HTTPS calls to the providers' token endpoints, so they only
 * work once valid credentials are configured. Unit tests exercise the parts
 * that need no network (authorize URLs, client-secret signing, claim checks).
 */

import { createPrivateKey, sign as cryptoSign } from "node:crypto";
import type { AuthProvider, ExternalProfile } from "./oauth.js";

/** Credentials shared by the standard OAuth 2.0 / OIDC providers. */
export interface OAuthCredentials {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
}

/** Apple needs a private key + identifiers to mint its client-secret JWT. */
export interface AppleCredentials {
  /** The Services ID configured in the Apple developer console. */
  readonly clientId: string;
  readonly teamId: string;
  readonly keyId: string;
  /** Contents of the .p8 private key (PKCS#8 PEM). */
  readonly privateKey: string;
  readonly redirectUri: string;
}

// ── JWT helpers (decode only — signature trust comes from TLS + PKCE + state) ──

interface IdTokenClaims {
  readonly iss?: string;
  readonly aud?: string | string[];
  readonly sub?: string;
  readonly exp?: number;
  readonly nonce?: string;
  readonly email?: string;
  readonly email_verified?: boolean | string;
  readonly name?: string;
  readonly picture?: string;
}

/** Decode a JWT payload without verifying the signature (claims are re-checked). */
function decodeJwtPayload(jwt: string): IdTokenClaims {
  const parts = jwt.split(".");
  if (parts.length !== 3) throw new Error("Malformed id_token");
  const json = Buffer.from(parts[1] ?? "", "base64url").toString("utf8");
  return JSON.parse(json) as IdTokenClaims;
}

/** Enforce the OIDC claim checks every caller relies on before trusting an id_token. */
function assertClaims(
  claims: IdTokenClaims,
  opts: { issuers: readonly string[]; audience: string; nonce?: string },
): void {
  const now = Math.floor(Date.now() / 1000);
  if (!claims.sub) throw new Error("id_token missing sub");
  if (claims.iss === undefined || !opts.issuers.includes(claims.iss)) {
    throw new Error("id_token issuer mismatch");
  }
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes(opts.audience)) throw new Error("id_token audience mismatch");
  if (typeof claims.exp === "number" && claims.exp < now) throw new Error("id_token expired");
  if (opts.nonce !== undefined && claims.nonce !== undefined && claims.nonce !== opts.nonce) {
    throw new Error("id_token nonce mismatch");
  }
}

function toBool(v: boolean | string | undefined): boolean {
  return v === true || v === "true";
}

async function postForm(url: string, form: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(form).toString(),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const detail = typeof json.error === "string" ? json.error : `HTTP ${res.status}`;
    throw new Error(`Token exchange failed: ${detail}`);
  }
  return json;
}

// ── Google ────────────────────────────────────────────────────────────────

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_ISSUERS = ["accounts.google.com", "https://accounts.google.com"] as const;

export class GoogleAuthProvider implements AuthProvider {
  readonly id = "google";
  constructor(private readonly creds: OAuthCredentials) {}

  authorizeUrl(state: string, pkceChallenge: string, nonce: string): string {
    const q = new URLSearchParams({
      client_id: this.creds.clientId,
      redirect_uri: this.creds.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: pkceChallenge,
      code_challenge_method: "S256",
      access_type: "online",
      prompt: "select_account",
    });
    return `${GOOGLE_AUTH}?${q.toString()}`;
  }

  async exchange(code: string, pkceVerifier: string, expectedNonce?: string): Promise<ExternalProfile> {
    const tokens = await postForm(GOOGLE_TOKEN, {
      grant_type: "authorization_code",
      code,
      client_id: this.creds.clientId,
      client_secret: this.creds.clientSecret,
      redirect_uri: this.creds.redirectUri,
      code_verifier: pkceVerifier,
    });
    const idToken = tokens.id_token;
    if (typeof idToken !== "string") throw new Error("Google response missing id_token");
    const claims = decodeJwtPayload(idToken);
    assertClaims(claims, { issuers: GOOGLE_ISSUERS, audience: this.creds.clientId, nonce: expectedNonce });
    return {
      provider: "google",
      sub: claims.sub as string,
      email: claims.email,
      emailVerified: toBool(claims.email_verified),
      name: claims.name,
      avatarUrl: claims.picture,
    };
  }
}

// ── Apple ─────────────────────────────────────────────────────────────────

const APPLE_AUTH = "https://appleid.apple.com/auth/authorize";
const APPLE_TOKEN = "https://appleid.apple.com/auth/token";
const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_AUD = "https://appleid.apple.com";

/**
 * Mint the ES256-signed JWT Apple accepts as the OAuth client secret.
 * Signed in JOSE (raw R||S) form, not DER, via the ieee-p1363 encoding.
 */
export function createAppleClientSecret(creds: AppleCredentials, now: number = Math.floor(Date.now() / 1000)): string {
  const header = { alg: "ES256", kid: creds.keyId, typ: "JWT" };
  const payload = {
    iss: creds.teamId,
    iat: now,
    exp: now + 15777000, // ~6 months — Apple's maximum client-secret lifetime.
    aud: APPLE_AUD,
    sub: creds.clientId,
  };
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const signingInput = `${b64(header)}.${b64(payload)}`;
  const key = createPrivateKey(creds.privateKey);
  const sig = cryptoSign("sha256", Buffer.from(signingInput), { key, dsaEncoding: "ieee-p1363" });
  return `${signingInput}.${sig.toString("base64url")}`;
}

export class AppleAuthProvider implements AuthProvider {
  readonly id = "apple";
  constructor(private readonly creds: AppleCredentials) {}

  authorizeUrl(state: string, pkceChallenge: string, nonce: string): string {
    const q = new URLSearchParams({
      client_id: this.creds.clientId,
      redirect_uri: this.creds.redirectUri,
      response_type: "code",
      response_mode: "form_post", // Apple returns the code via POST when scopes are requested.
      scope: "name email",
      state,
      nonce,
      code_challenge: pkceChallenge,
      code_challenge_method: "S256",
    });
    return `${APPLE_AUTH}?${q.toString()}`;
  }

  async exchange(code: string, pkceVerifier: string, expectedNonce?: string): Promise<ExternalProfile> {
    const tokens = await postForm(APPLE_TOKEN, {
      grant_type: "authorization_code",
      code,
      client_id: this.creds.clientId,
      client_secret: createAppleClientSecret(this.creds),
      redirect_uri: this.creds.redirectUri,
      code_verifier: pkceVerifier,
    });
    const idToken = tokens.id_token;
    if (typeof idToken !== "string") throw new Error("Apple response missing id_token");
    const claims = decodeJwtPayload(idToken);
    assertClaims(claims, { issuers: [APPLE_ISSUER], audience: this.creds.clientId, nonce: expectedNonce });
    return {
      provider: "apple",
      sub: claims.sub as string,
      email: claims.email,
      emailVerified: toBool(claims.email_verified),
      // Apple only sends the display name (via form_post) on the very first consent.
      name: undefined,
    };
  }
}
