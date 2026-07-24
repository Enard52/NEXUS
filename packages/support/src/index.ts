/**
 * NEXUS AI — Onboarding, Support & Product Analytics (FAZ 20)
 *
 * Three code-feasible cores that get a brand-new user productive without outside
 * help:
 *   1. OnboardingWizard — an ordered first-run flow (account → language/address →
 *      connect a device → try a first skill) with progress tracking.
 *   2. SupportSystem — an FAQ plus a lightweight ticket tracker (open →
 *      in_progress → resolved) with threaded replies.
 *   3. Analytics — strictly opt-in, PII-free usage counters (crash + event
 *      counts) so we can understand usage patterns without personal data.
 *
 * Deterministic and dependency-free; time is injected for testability.
 */

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export type OnboardingStep =
  "create-account" | "language-address" | "connect-device" | "first-skill";

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  "create-account",
  "language-address",
  "connect-device",
  "first-skill",
];

export class OnboardingError extends Error {}

/** Tracks a single user's progress through the first-run flow, in order. */
export class OnboardingWizard {
  private index = 0;

  /** The step the user is currently on, or undefined once finished. */
  current(): OnboardingStep | undefined {
    return ONBOARDING_STEPS[this.index];
  }

  /** Complete the given step; it must be the current one (no skipping ahead). */
  complete(step: OnboardingStep): void {
    if (step !== this.current()) {
      throw new OnboardingError(`Expected step "${this.current()}", got "${step}".`);
    }
    this.index += 1;
  }

  isComplete(): boolean {
    return this.index >= ONBOARDING_STEPS.length;
  }

  /** Fraction complete in [0, 1] for a progress indicator. */
  progress(): number {
    return this.index / ONBOARDING_STEPS.length;
  }
}

// ---------------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------------

export interface FaqEntry {
  readonly question: string;
  readonly answer: string;
}

export type TicketStatus = "open" | "in_progress" | "resolved";

export interface TicketReply {
  readonly from: "user" | "support";
  readonly text: string;
  readonly at: string;
}

export interface Ticket {
  readonly id: string;
  readonly subject: string;
  status: TicketStatus;
  readonly replies: TicketReply[];
  readonly createdAt: string;
}

export class SupportError extends Error {}

export interface SupportOptions {
  readonly now?: () => Date;
  readonly faq?: readonly FaqEntry[];
}

/** A minimal, self-service support desk: searchable FAQ + a ticket tracker. */
export class SupportSystem {
  private readonly tickets = new Map<string, Ticket>();
  private readonly now: () => Date;
  private readonly faqEntries: readonly FaqEntry[];
  private seq = 0;

  constructor(options: SupportOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.faqEntries = options.faq ?? [];
  }

  /** Case-insensitive substring search over FAQ questions and answers. */
  searchFaq(query: string): readonly FaqEntry[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.faqEntries;
    return this.faqEntries.filter(
      (e) => e.question.toLowerCase().includes(q) || e.answer.toLowerCase().includes(q),
    );
  }

  createTicket(subject: string, body: string): Ticket {
    const at = this.now().toISOString();
    const ticket: Ticket = {
      id: `t_${++this.seq}`,
      subject,
      status: "open",
      replies: [{ from: "user", text: body, at }],
      createdAt: at,
    };
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  reply(id: string, from: "user" | "support", text: string): Ticket {
    const ticket = this.mustGet(id);
    ticket.replies.push({ from, text, at: this.now().toISOString() });
    // A support reply on an open ticket moves it into progress.
    if (from === "support" && ticket.status === "open") ticket.status = "in_progress";
    return ticket;
  }

  setStatus(id: string, status: TicketStatus): Ticket {
    const ticket = this.mustGet(id);
    ticket.status = status;
    return ticket;
  }

  listTickets(status?: TicketStatus): readonly Ticket[] {
    const all = [...this.tickets.values()];
    return status ? all.filter((t) => t.status === status) : all;
  }

  private mustGet(id: string): Ticket {
    const ticket = this.tickets.get(id);
    if (!ticket) throw new SupportError(`No ticket ${id}`);
    return ticket;
  }
}

// ---------------------------------------------------------------------------
// Analytics (opt-in, PII-free)
// ---------------------------------------------------------------------------

/**
 * Opt-in usage analytics. Nothing is recorded until the user opts in, and only
 * event names + numeric counts are kept — never personal data or free text.
 */
export class Analytics {
  private optedIn = false;
  private readonly counts = new Map<string, number>();

  optIn(): void {
    this.optedIn = true;
  }

  optOut(): void {
    this.optedIn = false;
  }

  isOptedIn(): boolean {
    return this.optedIn;
  }

  /** Record one occurrence of an event; ignored entirely while opted out. */
  track(event: string): void {
    if (!this.optedIn) return;
    this.counts.set(event, (this.counts.get(event) ?? 0) + 1);
  }

  count(event: string): number {
    return this.counts.get(event) ?? 0;
  }

  summary(): Readonly<Record<string, number>> {
    return Object.fromEntries(this.counts);
  }
}

export const moduleName = "support" as const;
export const implemented = true;
