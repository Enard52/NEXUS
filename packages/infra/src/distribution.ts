/**
 * NEXUS AI — Download & Distribution Backend
 *
 * The Download Center is data-driven by this backend, never hardcoded:
 *   - detectOs(): guesses the visitor's platform from the User-Agent so the site
 *     can feature the right primary download button (manual selection always
 *     stays available, so a wrong guess is harmless).
 *   - VersionInfoService: the "version info API" — per-platform version, minimum
 *     system requirement and a real SHA-256 checksum the user can verify.
 *   - validateStoreLink(): a check-point for App Store / Google Play links.
 *
 * EXTERNAL BOUNDARIES (cannot be truly completed in code here, roadmap rule #8):
 * CDN distribution, Authenticode/Apple notarization code-signing, and real
 * Universal Links / App Links registration require real infrastructure,
 * certificates and store accounts. Those are wired when credentials exist.
 */

import { createHash } from "node:crypto";

export type DownloadPlatform = "windows" | "macos" | "linux" | "ios" | "android";

/** Guess the visitor's platform from a User-Agent; undefined ⇒ let them choose. */
export function detectOs(userAgent: string): DownloadPlatform | undefined {
  const ua = userAgent.toLowerCase();
  // Order matters: iOS/Android before desktop, since mobile UAs mention both.
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows|win64|win32/.test(ua)) return "windows";
  if (/mac os x|macintosh/.test(ua)) return "macos";
  if (/linux|x11/.test(ua)) return "linux";
  return undefined;
}

/** Compute a real SHA-256 checksum (hex) for a package's bytes/contents. */
export function computeChecksum(contents: string | Uint8Array): string {
  return createHash("sha256").update(contents).digest("hex");
}

export interface ReleaseInfo {
  readonly platform: DownloadPlatform;
  readonly version: string;
  /** Human-readable minimum requirement, e.g. "Windows 10 and later". */
  readonly minOs: string;
  /** SHA-256 hex checksum of the installer for integrity verification. */
  readonly checksumSha256: string;
  readonly downloadUrl: string;
}

export class DistributionError extends Error {}

/**
 * Serves current release metadata per platform. The site always reads from here
 * (never hardcodes versions/checksums), so a new release is a data change.
 */
export class VersionInfoService {
  private readonly releases = new Map<DownloadPlatform, ReleaseInfo>();

  publish(release: ReleaseInfo): void {
    this.releases.set(release.platform, release);
  }

  get(platform: DownloadPlatform): ReleaseInfo | undefined {
    return this.releases.get(platform);
  }

  all(): readonly ReleaseInfo[] {
    return [...this.releases.values()];
  }

  /** The release to feature for a visitor, based on their User-Agent. */
  featuredFor(userAgent: string): ReleaseInfo | undefined {
    const platform = detectOs(userAgent);
    return platform ? this.releases.get(platform) : undefined;
  }
}

/** Validate that a store link points at the real App Store / Google Play host. */
export function validateStoreLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return (
      parsed.hostname === "apps.apple.com" ||
      parsed.hostname === "play.google.com" ||
      parsed.hostname.endsWith(".apple.com")
    );
  } catch {
    return false;
  }
}
