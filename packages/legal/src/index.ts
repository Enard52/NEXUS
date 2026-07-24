/**
 * NEXUS AI — Legal & Compliance (FAZ 19, code-feasible core)
 *
 * A product that sells subscriptions and processes personal data (voice, home
 * state, habits) needs Terms of Service, a Privacy Policy and a Cookie Policy,
 * an explicit consent flow for voice recording, and technically-supported data
 * rights (export/delete — the accounts system, FAZ 14, does the actual work).
 *
 * IMPORTANT: The agent only produces *drafts / structure*. It does not give
 * legal advice; every generated document carries a disclaimer that a qualified
 * lawyer must review and finalize it before publication. Deterministic and
 * dependency-free; time is injected for testability.
 */

export type LegalDocumentType = "terms" | "privacy" | "cookie";

export interface LegalSection {
  readonly heading: string;
  readonly body: string;
}

export interface LegalDraft {
  readonly type: LegalDocumentType;
  readonly title: string;
  readonly version: string;
  readonly sections: readonly LegalSection[];
  /** Always present: these are drafts pending professional legal review. */
  readonly disclaimer: string;
}

const REVIEW_DISCLAIMER =
  "DRAFT — generated for structure only. Not legal advice. A qualified lawyer " +
  "must review and finalize this document before it is published.";

function draft(
  type: LegalDocumentType,
  title: string,
  version: string,
  sections: readonly LegalSection[],
): LegalDraft {
  return { type, title, version, sections, disclaimer: REVIEW_DISCLAIMER };
}

export function draftTermsOfService(product: string, version = "0.1-draft"): LegalDraft {
  return draft("terms", `${product} — Terms of Service`, version, [
    { heading: "Acceptance", body: `By using ${product} you agree to these terms.` },
    { heading: "Subscriptions & Billing", body: "Plans, renewals, and self-service cancellation." },
    { heading: "Acceptable Use", body: "Prohibited uses and account responsibilities." },
    { heading: "Termination", body: "How either party may end the agreement." },
    { heading: "Liability", body: "Limitations of liability and warranty disclaimers." },
  ]);
}

export function draftPrivacyPolicy(product: string, version = "0.1-draft"): LegalDraft {
  return draft("privacy", `${product} — Privacy Policy`, version, [
    { heading: "Data We Process", body: "Voice input, home/device state, usage and account data." },
    { heading: "Purpose & Legal Basis", body: "Why each category is processed (GDPR/KVKK)." },
    { heading: "Retention", body: "How long each category is kept and why." },
    { heading: "Your Rights", body: "Access, export and deletion of your data (see data rights)." },
    { heading: "Payment Data", body: "Card data is handled by a PCI-DSS provider, never by us." },
  ]);
}

export function draftCookiePolicy(product: string, version = "0.1-draft"): LegalDraft {
  return draft("cookie", `${product} — Cookie Policy`, version, [
    { heading: "What Cookies We Use", body: "Strictly necessary vs. optional analytics cookies." },
    { heading: "Managing Cookies", body: "How to accept or reject optional cookies." },
  ]);
}

// ---------------------------------------------------------------------------
// Explicit consent (e.g. voice recording)
// ---------------------------------------------------------------------------

export type ConsentTopic = "voice-recording" | "analytics" | "marketing";

export interface ConsentRecord {
  readonly userId: string;
  readonly topic: ConsentTopic;
  readonly granted: boolean;
  readonly at: string;
}

export class ConsentManager {
  private readonly records = new Map<string, ConsentRecord>();
  private readonly now: () => Date;

  constructor(now: () => Date = () => new Date()) {
    this.now = now;
  }

  private key(userId: string, topic: ConsentTopic): string {
    return `${userId}:${topic}`;
  }

  set(userId: string, topic: ConsentTopic, granted: boolean): ConsentRecord {
    const record: ConsentRecord = { userId, topic, granted, at: this.now().toISOString() };
    this.records.set(this.key(userId, topic), record);
    return record;
  }

  /** Consent must be explicitly granted; the default (no record) is false. */
  hasConsent(userId: string, topic: ConsentTopic): boolean {
    return this.records.get(this.key(userId, topic))?.granted ?? false;
  }
}

// ---------------------------------------------------------------------------
// Data-subject rights (GDPR/KVKK) — tracking; fulfillment is in @nexus/accounts
// ---------------------------------------------------------------------------

export type DsarKind = "export" | "delete";
export type DsarStatus = "received" | "fulfilled";

export interface DsarRequest {
  readonly id: string;
  readonly userId: string;
  readonly kind: DsarKind;
  status: DsarStatus;
  readonly receivedAt: string;
  fulfilledAt?: string;
}

export class DataRightsRegistry {
  private readonly requests = new Map<string, DsarRequest>();
  private readonly now: () => Date;
  private seq = 0;

  constructor(now: () => Date = () => new Date()) {
    this.now = now;
  }

  submit(userId: string, kind: DsarKind): DsarRequest {
    const request: DsarRequest = {
      id: `dsar_${++this.seq}`,
      userId,
      kind,
      status: "received",
      receivedAt: this.now().toISOString(),
    };
    this.requests.set(request.id, request);
    return request;
  }

  /** Mark a request fulfilled once the accounts system has done the work. */
  markFulfilled(id: string): DsarRequest {
    const request = this.requests.get(id);
    if (!request) throw new Error(`No DSAR request ${id}`);
    request.status = "fulfilled";
    request.fulfilledAt = this.now().toISOString();
    return request;
  }

  pending(): readonly DsarRequest[] {
    return [...this.requests.values()].filter((r) => r.status === "received");
  }
}

export const moduleName = "legal" as const;
export const implemented = true;
