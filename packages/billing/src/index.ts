/**
 * NEXUS AI — Subscription & Revenue (FAZ 15)
 *
 * Pricing tiers, subscription lifecycle (trial → active → renewal, upgrade /
 * downgrade, self-service cancel), tax-aware invoicing and a dunning state
 * machine for failed payments (retry, then graceful downgrade — never an abrupt
 * cutoff). Card data is NEVER handled here: charges go through a PaymentProvider
 * abstraction that stands in for a PCI-DSS compliant processor (Stripe, Iyzico).
 *
 * The bundled provider is an explicit sandbox — it does not contact any real
 * processor and never fabricates a real-money success (roadmap rule #8).
 * Deterministic and dependency-free; time is injected for testability.
 */

export type PlanId = "free" | "premium" | "family";

export interface Plan {
  readonly id: PlanId;
  readonly priceCents: number;
  readonly maxDevices: number;
  readonly allSkills: boolean;
  readonly familySeats: number;
}

export const PLAN_CATALOG: Record<PlanId, Plan> = {
  free: { id: "free", priceCents: 0, maxDevices: 3, allSkills: false, familySeats: 1 },
  premium: {
    id: "premium",
    priceCents: 999,
    maxDevices: Infinity,
    allSkills: true,
    familySeats: 1,
  },
  family: { id: "family", priceCents: 1799, maxDevices: Infinity, allSkills: true, familySeats: 6 },
};

export type SubStatus = "trialing" | "active" | "past_due" | "canceled";

export interface ChargeResult {
  readonly ok: boolean;
  readonly chargeId?: string;
  readonly declineReason?: string;
}

/** Stands in for a PCI-DSS compliant processor. Real impls call the processor. */
export interface PaymentProvider {
  readonly sandbox: boolean;
  charge(customerId: string, amountCents: number, currency: string): ChargeResult;
}

/** Sandbox provider: deterministic, never contacts a processor, never fakes real money. */
export class SandboxPaymentProvider implements PaymentProvider {
  readonly sandbox = true;
  private seq = 0;
  /** Customer ids in this set will have their charges declined (for dunning tests). */
  constructor(private readonly declineFor: ReadonlySet<string> = new Set()) {}

  charge(customerId: string, amountCents: number): ChargeResult {
    if (amountCents <= 0) return { ok: true, chargeId: `free_${++this.seq}` };
    if (this.declineFor.has(customerId)) {
      return { ok: false, declineReason: "card_declined" };
    }
    return { ok: true, chargeId: `sbx_${++this.seq}` };
  }
}

export interface Invoice {
  readonly id: string;
  readonly customerId: string;
  readonly plan: PlanId;
  readonly subtotalCents: number;
  readonly taxCents: number;
  readonly totalCents: number;
  readonly at: string;
}

export interface Subscription {
  readonly customerId: string;
  readonly plan: PlanId;
  readonly status: SubStatus;
  readonly trialEndsAt: number | null;
  readonly failedAttempts: number;
}

export class BillingError extends Error {}

export interface BillingOptions {
  readonly now?: () => number;
  /** VAT/sales tax rate as a fraction, e.g. 0.20 for 20%. */
  readonly taxRate?: number;
  /** Failed charges tolerated before downgrading to free (dunning). */
  readonly maxDunningAttempts?: number;
}

export class BillingService {
  private readonly subs = new Map<string, Subscription>();
  private readonly invoices: Invoice[] = [];
  private readonly now: () => number;
  private readonly taxRate: number;
  private readonly maxDunning: number;
  private seq = 0;

  constructor(
    private readonly provider: PaymentProvider,
    options: BillingOptions = {},
  ) {
    this.now = options.now ?? (() => Date.now());
    this.taxRate = options.taxRate ?? 0;
    this.maxDunning = options.maxDunningAttempts ?? 3;
  }

  /** Start a subscription, optionally with a free trial. */
  subscribe(customerId: string, plan: PlanId, trialDays = 0): Subscription {
    if (this.subs.has(customerId)) throw new BillingError("Customer already has a subscription.");
    const trialEndsAt = trialDays > 0 ? this.now() + trialDays * 86_400_000 : null;
    const sub: Subscription = {
      customerId,
      plan,
      status: trialEndsAt ? "trialing" : "active",
      trialEndsAt,
      failedAttempts: 0,
    };
    // A paid plan with no trial is charged immediately.
    if (!trialEndsAt && PLAN_CATALOG[plan].priceCents > 0) {
      return this.charge(sub);
    }
    this.subs.set(customerId, sub);
    return sub;
  }

  /** Renew at period end (or convert an expired trial). Drives dunning on failure. */
  renew(customerId: string): Subscription {
    const sub = this.require(customerId);
    if (sub.status === "canceled") throw new BillingError("Subscription is canceled.");
    return this.charge(sub);
  }

  /** Upgrade/downgrade. A downgrade to free stops billing without cutting access abruptly. */
  changePlan(customerId: string, plan: PlanId): Subscription {
    const sub = this.require(customerId);
    const updated: Subscription = { ...sub, plan };
    if (PLAN_CATALOG[plan].priceCents === 0) {
      const settled: Subscription = { ...updated, status: "active", failedAttempts: 0 };
      this.subs.set(customerId, settled);
      return settled;
    }
    return this.charge(updated);
  }

  /** Self-service cancellation — no hidden barriers. */
  cancel(customerId: string): Subscription {
    const sub = this.require(customerId);
    const canceled: Subscription = { ...sub, status: "canceled" };
    this.subs.set(customerId, canceled);
    return canceled;
  }

  get(customerId: string): Subscription | undefined {
    return this.subs.get(customerId);
  }

  invoicesFor(customerId: string): readonly Invoice[] {
    return this.invoices.filter((i) => i.customerId === customerId);
  }

  private charge(sub: Subscription): Subscription {
    const price = PLAN_CATALOG[sub.plan].priceCents;
    const result = this.provider.charge(sub.customerId, price, "USD");

    if (result.ok) {
      this.writeInvoice(sub.customerId, sub.plan, price);
      const settled: Subscription = {
        ...sub,
        status: "active",
        trialEndsAt: null,
        failedAttempts: 0,
      };
      this.subs.set(sub.customerId, settled);
      return settled;
    }

    // Dunning: count the failure; after the limit, gracefully downgrade to free.
    const failedAttempts = sub.failedAttempts + 1;
    if (failedAttempts >= this.maxDunning) {
      const downgraded: Subscription = {
        ...sub,
        plan: "free",
        status: "active",
        failedAttempts: 0,
      };
      this.subs.set(sub.customerId, downgraded);
      return downgraded;
    }
    const pastDue: Subscription = { ...sub, status: "past_due", failedAttempts };
    this.subs.set(sub.customerId, pastDue);
    return pastDue;
  }

  private writeInvoice(customerId: string, plan: PlanId, subtotalCents: number): void {
    const taxCents = Math.round(subtotalCents * this.taxRate);
    this.invoices.push({
      id: `inv_${++this.seq}`,
      customerId,
      plan,
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
      at: new Date(this.now()).toISOString(),
    });
  }

  private require(customerId: string): Subscription {
    const sub = this.subs.get(customerId);
    if (!sub) throw new BillingError("No subscription for this customer.");
    return sub;
  }
}

export const moduleName = "billing" as const;
export const implemented = true;
