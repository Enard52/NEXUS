/**
 * NEXUS AI — Server OAuth registry (Section H wiring)
 *
 * Turns environment configuration into ready-to-use {@link AuthProvider}
 * instances and tells the login page which social buttons to show. Providers
 * are only *active* when their credentials are present; the buttons always
 * render (so the option is discoverable) but the /start endpoint reports
 * honestly when a provider hasn't been configured yet.
 *
 * Redirect URIs are derived from a single base URL so they always match the
 * `/api/oauth/:provider/callback` route below and whatever is registered with
 * the provider console.
 */

import { AppleAuthProvider, GoogleAuthProvider, type AuthProvider } from "@nexus/accounts";

/** Display metadata for a social sign-in option (drives the login buttons). */
export interface OAuthProviderMeta {
  readonly id: "google" | "apple";
  /** i18n key for the button label. */
  readonly labelKey: string;
}

/** The providers this build offers, in display order. */
export const OAUTH_PROVIDERS: readonly OAuthProviderMeta[] = [
  { id: "google", labelKey: "auth.social.google" },
  { id: "apple", labelKey: "auth.social.apple" },
];

export interface OAuthRegistry {
  /** The configured provider, or undefined when credentials are missing. */
  get(id: string): AuthProvider | undefined;
  /** Whether a provider is fully configured and clickable. */
  isConfigured(id: string): boolean;
}

type Env = Record<string, string | undefined>;

function trimmed(v: string | undefined): string {
  return (v ?? "").trim();
}

/** Base URL used to build provider callback URIs (must be publicly reachable in prod). */
function resolveBaseUrl(env: Env): string {
  const explicit = trimmed(env.OAUTH_BASE_URL);
  if (explicit) return explicit.replace(/\/+$/, "");
  const port = trimmed(env.PORT) || "4178";
  return `http://localhost:${port}`;
}

/**
 * Build the provider registry from environment variables:
 *   Google — GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   Apple  — APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY
 * Apple's private key may contain literal "\n" escapes (env-friendly) — those
 * are normalised back into real newlines so the PKCS#8 PEM parses.
 */
export function buildOAuthRegistry(env: Env = process.env): OAuthRegistry {
  const baseUrl = resolveBaseUrl(env);
  const providers = new Map<string, AuthProvider>();

  const googleId = trimmed(env.GOOGLE_CLIENT_ID);
  const googleSecret = trimmed(env.GOOGLE_CLIENT_SECRET);
  if (googleId && googleSecret) {
    providers.set(
      "google",
      new GoogleAuthProvider({
        clientId: googleId,
        clientSecret: googleSecret,
        redirectUri: `${baseUrl}/api/oauth/google/callback`,
      }),
    );
  }

  const appleId = trimmed(env.APPLE_CLIENT_ID);
  const appleTeam = trimmed(env.APPLE_TEAM_ID);
  const appleKeyId = trimmed(env.APPLE_KEY_ID);
  const applePrivateKey = trimmed(env.APPLE_PRIVATE_KEY).replace(/\\n/g, "\n");
  if (appleId && appleTeam && appleKeyId && applePrivateKey) {
    providers.set(
      "apple",
      new AppleAuthProvider({
        clientId: appleId,
        teamId: appleTeam,
        keyId: appleKeyId,
        privateKey: applePrivateKey,
        redirectUri: `${baseUrl}/api/oauth/apple/callback`,
      }),
    );
  }

  return {
    get: (id) => providers.get(id),
    isConfigured: (id) => providers.has(id),
  };
}
