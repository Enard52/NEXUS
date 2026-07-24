/**
 * NEXUS AI — Disposable E-mail Blocklist (Section G)
 *
 * Rejects registration attempts from well-known throwaway / temp-mail
 * domains. The list is conservative — false positives (real addresses
 * blocked) are worse than false negatives (a bot slipping through).
 * FAZ 18: extend with a real-time lookup service.
 */

/** Known throwaway / disposable email domains. Keep sorted for readability. */
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "airmail.cc",
  "discard.email",
  "disposablemail.com",
  "fakeinbox.com",
  "filzmail.com",
  "getairmail.com",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.info",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "mailinator.com",
  "mailnull.com",
  "maildrop.cc",
  "mailnesia.com",
  "nada.email",
  "sharklasers.com",
  "spamgourmet.com",
  "tempinbox.com",
  "temp-mail.org",
  "throwam.com",
  "throwaway.email",
  "trashmail.at",
  "trashmail.com",
  "trashmail.me",
  "yopmail.com",
  "zwoho.com",
]);

/**
 * Returns true when the email's domain is on the disposable-address blocklist.
 * Never throws — invalid addresses return false (the caller validates format).
 */
export function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email
    .slice(at + 1)
    .toLowerCase()
    .trim();
  return DISPOSABLE_DOMAINS.has(domain);
}

/** Number of domains in the blocklist (useful for tests / admin dashboards). */
export const DISPOSABLE_DOMAIN_COUNT = DISPOSABLE_DOMAINS.size;
