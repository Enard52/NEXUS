/**
 * Unit tests for the concrete OAuth providers. These cover everything that
 * needs no network round-trip: the authorization URLs (shape + PKCE/state/
 * nonce wiring) and Apple's ES256 client-secret JWT.
 */

import { describe, expect, it } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { AppleAuthProvider, GoogleAuthProvider, createAppleClientSecret } from "./providers.js";

function decodeSegment(seg: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(seg, "base64url").toString("utf8")) as Record<string, unknown>;
}

describe("GoogleAuthProvider", () => {
  const google = new GoogleAuthProvider({
    clientId: "google-client-123",
    clientSecret: "secret",
    redirectUri: "https://app.example/api/oauth/google/callback",
  });

  it("builds an OIDC authorization URL with PKCE, state and nonce", () => {
    const url = new URL(google.authorizeUrl("state-abc", "challenge-xyz", "nonce-1"));
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    const p = url.searchParams;
    expect(p.get("client_id")).toBe("google-client-123");
    expect(p.get("redirect_uri")).toBe("https://app.example/api/oauth/google/callback");
    expect(p.get("response_type")).toBe("code");
    expect(p.get("scope")).toBe("openid email profile");
    expect(p.get("state")).toBe("state-abc");
    expect(p.get("nonce")).toBe("nonce-1");
    expect(p.get("code_challenge")).toBe("challenge-xyz");
    expect(p.get("code_challenge_method")).toBe("S256");
  });
});

describe("AppleAuthProvider", () => {
  // A throwaway P-256 key is enough to prove the JWT is well-formed and signed.
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const creds = {
    clientId: "com.nexus.app",
    teamId: "TEAM123456",
    keyId: "KEY1234567",
    privateKey: pem,
    redirectUri: "https://app.example/api/oauth/apple/callback",
  };

  it("builds an authorization URL that uses form_post response mode", () => {
    const url = new URL(new AppleAuthProvider(creds).authorizeUrl("s", "c", "n"));
    expect(url.origin + url.pathname).toBe("https://appleid.apple.com/auth/authorize");
    expect(url.searchParams.get("response_mode")).toBe("form_post");
    expect(url.searchParams.get("scope")).toBe("name email");
    expect(url.searchParams.get("state")).toBe("s");
  });

  it("mints an ES256 client-secret JWT with the required claims", () => {
    const now = 1_700_000_000;
    const jwt = createAppleClientSecret(creds, now);
    const [h, pl, sig] = jwt.split(".");
    expect(sig).toBeTruthy();
    const header = decodeSegment(h!);
    const payload = decodeSegment(pl!);
    expect(header.alg).toBe("ES256");
    expect(header.kid).toBe("KEY1234567");
    expect(payload.iss).toBe("TEAM123456");
    expect(payload.sub).toBe("com.nexus.app");
    expect(payload.aud).toBe("https://appleid.apple.com");
    expect(payload.iat).toBe(now);
    expect(payload.exp).toBeGreaterThan(now);
  });
});
