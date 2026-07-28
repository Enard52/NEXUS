/**
 * NEXUS AI — Subscription & Revenue via Patreon
 *
 * Uses Patreon as the payment/subscription provider. Patreon handles all
 * PCI-DSS compliance, tax/VAT collection, and payment processing. NEXUS never
 * touches card data.
 *
 * Architecture:
 *   Custom checkout UI → user selects tier → redirects to Patreon tier page
 *   → Patreon processes payment → webhook notifies NEXUS → subscription updated
 *   → user connects Patreon via OAuth → pledge level verified
 *
 * The bundled provider is an explicit sandbox — it simulates Patreon webhook
 * events without making real API calls. Deterministic and dependency-free;
 * time is injected for testability.
 */

// ── Plan / Tier definitions ─────────────────────────────────────────────────

export type PlanId = "free" | "premium" | "family";

export interface Plan {
  readonly id: PlanId;
  readonly priceCents: number;
  readonly currency: string;
  readonly maxDevices: number;
  readonly allSkills: boolean;
  readonly familySeats: number;
  /** Patreon tier ID (set after campaign creation). */
  readonly patreonTierId?: string;
}

export const PLAN_CATALOG: Record<PlanId, Plan> = {
  free: {
    id: "free",
    priceCents: 0,
    currency: "USD",
    maxDevices: 3,
    allSkills: false,
    familySeats: 1,
  },
  premium: {
    id: "premium",
    priceCents: 999,
    currency: "USD",
    maxDevices: Infinity,
    allSkills: true,
    familySeats: 1,
    patreonTierId: "tier_premium",
  },
  family: {
    id: "family",
    priceCents: 1799,
    currency: "USD",
    maxDevices: Infinity,
    allSkills: true,
    familySeats: 6,
    patreonTierId: "tier_family",
  },
};

// ── Subscription status ─────────────────────────────────────────────────────

export type SubStatus = "trialing" | "active" | "past_due" | "canceled";

export interface Subscription {
  readonly customerId: string;
  readonly plan: PlanId;
  readonly status: SubStatus;
  readonly trialEndsAt: number | null;
  readonly failedAttempts: number;
  /** Patreon patron ID (linked after OAuth connection). */
  readonly patreonPatronId?: string;
  /** Patreon pledge ID for tracking. */
  readonly patreonPledgeId?: string;
}

// ── Patreon webhook events ──────────────────────────────────────────────────

export type PatreonWebhookType =
  "members:pledge:create" | "members:pledge:update" | "members:pledge:delete";

export interface PatreonWebhookEvent {
  readonly type: PatreonWebhookType;
  readonly patronId: string;
  readonly email?: string;
  readonly tierId: string;
  readonly amountCents: number;
  readonly currency: string;
  readonly status: "active_patron" | "declined_patron" | "former_patron";
  readonly pledgeId?: string;
}

// ── Patreon OAuth ───────────────────────────────────────────────────────────

export interface PatreonOAuthConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
  readonly campaignId: string;
}

export interface PatreonTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number;
}

export interface PatreonPatronInfo {
  readonly patronId: string;
  readonly email: string;
  readonly name?: string;
  readonly tierId?: string;
  readonly status: "active_patron" | "declined_patron" | "former_patron" | "none";
}

// ── Payment provider abstraction (kept for sandbox testing) ─────────────────

export interface ChargeResult {
  readonly ok: boolean;
  readonly chargeId?: string;
  readonly declineReason?: string;
}

export interface PaymentProvider {
  readonly sandbox: boolean;
  charge(customerId: string, amountCents: number, currency: string): ChargeResult;
}

/** Sandbox provider: deterministic, never contacts a processor, never fakes real money. */
export class SandboxPaymentProvider implements PaymentProvider {
  readonly sandbox = true;
  private seq = 0;
  constructor(private readonly declineFor: ReadonlySet<string> = new Set()) {}

  charge(customerId: string, amountCents: number): ChargeResult {
    if (amountCents <= 0) return { ok: true, chargeId: `free_${++this.seq}` };
    if (this.declineFor.has(customerId)) {
      return { ok: false, declineReason: "card_declined" };
    }
    return { ok: true, chargeId: `sbx_${++this.seq}` };
  }
}

// ── Invoice ─────────────────────────────────────────────────────────────────

export interface Invoice {
  readonly id: string;
  readonly customerId: string;
  readonly plan: PlanId;
  readonly subtotalCents: number;
  readonly taxCents: number;
  readonly totalCents: number;
  readonly currency: string;
  readonly at: string;
  readonly source: "patreon" | "sandbox";
}

// ── Promo codes ─────────────────────────────────────────────────────────────

export interface PromoCode {
  readonly code: string;
  readonly discountPercent: number;
  readonly validUntil: number;
  readonly maxUses: number;
  usedCount: number;
}

// ── Revenue metrics ─────────────────────────────────────────────────────────

export interface RevenueMetrics {
  /** Monthly Recurring Revenue in cents. */
  readonly mrrCents: number;
  /** Number of active paid subscribers. */
  readonly activeSubscribers: number;
  /** Number of canceled subscriptions this period. */
  readonly churned: number;
  /** Churn rate as fraction (churned / total at start). */
  readonly churnRate: number;
  /** Breakdown per plan. */
  readonly planDistribution: Record<PlanId, number>;
}

// ── Errors ──────────────────────────────────────────────────────────────────

export class BillingError extends Error {}

// ── Billing Service ─────────────────────────────────────────────────────────

export interface BillingOptions {
  readonly now?: () => number;
  readonly taxRate?: number;
  readonly maxDunningAttempts?: number;
  readonly patreon?: PatreonOAuthConfig;
}

export class BillingService {
  private readonly subs = new Map<string, Subscription>();
  private readonly invoices: Invoice[] = [];
  private readonly promoCodes = new Map<string, PromoCode>();
  /** Maps Patreon patron ID → NEXUS customer ID for webhook resolution. */
  private readonly patronToCustomer = new Map<string, string>();
  private readonly now: () => number;
  private readonly taxRate: number;
  private readonly maxDunning: number;
  private readonly patreonConfig?: PatreonOAuthConfig;
  private canceledThisPeriod = 0;
  private seq = 0;

  constructor(
    private readonly provider: PaymentProvider,
    options: BillingOptions = {},
  ) {
    this.now = options.now ?? (() => Date.now());
    this.taxRate = options.taxRate ?? 0;
    this.maxDunning = options.maxDunningAttempts ?? 3;
    this.patreonConfig = options.patreon;
  }

  // ── Patreon OAuth helpers ────────────────────────────────────────────────

  /** Build the Patreon OAuth authorization URL for account linking. */
  getPatreonAuthUrl(state: string): string {
    if (!this.patreonConfig) throw new BillingError("Patreon not configured.");
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.patreonConfig.clientId,
      redirect_uri: this.patreonConfig.redirectUri,
      scope: "identity identity[email] campaigns.members",
      state,
    });
    return `https://www.patreon.com/oauth2/authorize?${params.toString()}`;
  }

  /** Get the Patreon tier URL for direct subscription. */
  getCheckoutUrl(plan: PlanId): string {
    if (!this.patreonConfig) throw new BillingError("Patreon not configured.");
    const tier = PLAN_CATALOG[plan];
    if (!tier.patreonTierId) throw new BillingError("This plan has no Patreon tier.");
    return `https://www.patreon.com/join/${this.patreonConfig.campaignId}/checkout?rid=${tier.patreonTierId}`;
  }

  // ── Patreon webhook processing ──────────────────────────────────────────

  /**
   * Process a Patreon webhook event. This is the primary subscription driver:
   * Patreon tells us when a patron pledges, updates, or deletes their pledge.
   */
  handlePatreonWebhook(event: PatreonWebhookEvent): Subscription | undefined {
    const customerId = this.patronToCustomer.get(event.patronId);
    if (!customerId) return undefined; // Unknown patron — not linked yet

    const tierId = event.tierId;
    const plan = this.resolvePlanFromTier(tierId);

    if (event.type === "members:pledge:create") {
      // New pledge → activate subscription
      const sub: Subscription = {
        customerId,
        plan,
        status: "active",
        trialEndsAt: null,
        failedAttempts: 0,
        patreonPatronId: event.patronId,
        patreonPledgeId: event.pledgeId,
      };
      this.subs.set(customerId, sub);
      this.writeInvoice(customerId, plan, event.amountCents, event.currency, "patreon");
      return sub;
    }

    if (event.type === "members:pledge:update") {
      if (event.status === "declined_patron") {
        // Payment declined — dunning
        return this.handleDecline(customerId);
      }
      // Plan change or reactivation
      const sub: Subscription = {
        customerId,
        plan,
        status: "active",
        trialEndsAt: null,
        failedAttempts: 0,
        patreonPatronId: event.patronId,
        patreonPledgeId: event.pledgeId,
      };
      this.subs.set(customerId, sub);
      return sub;
    }

    if (event.type === "members:pledge:delete") {
      const existing = this.subs.get(customerId);
      if (existing) {
        const canceled: Subscription = { ...existing, status: "canceled" };
        this.subs.set(customerId, canceled);
        this.canceledThisPeriod++;
        return canceled;
      }
    }

    return undefined;
  }

  /** Link a NEXUS account to a Patreon patron ID (called after OAuth callback). */
  linkPatron(customerId: string, patronId: string): void {
    this.patronToCustomer.set(patronId, customerId);
    const sub = this.subs.get(customerId);
    if (sub) {
      this.subs.set(customerId, { ...sub, patreonPatronId: patronId });
    }
  }

  // ── Standard subscription lifecycle ─────────────────────────────────────

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
    if (!trialEndsAt && PLAN_CATALOG[plan].priceCents > 0) {
      return this.charge(sub);
    }
    this.subs.set(customerId, sub);
    return sub;
  }

  /** Renew at period end (or convert an expired trial). */
  renew(customerId: string): Subscription {
    const sub = this.require(customerId);
    if (sub.status === "canceled") throw new BillingError("Subscription is canceled.");
    return this.charge(sub);
  }

  /** Upgrade/downgrade. Downgrade to free stops billing gracefully. */
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
    this.canceledThisPeriod++;
    return canceled;
  }

  get(customerId: string): Subscription | undefined {
    return this.subs.get(customerId);
  }

  invoicesFor(customerId: string): readonly Invoice[] {
    return this.invoices.filter((i) => i.customerId === customerId);
  }

  // ── Promo codes ─────────────────────────────────────────────────────────

  addPromoCode(code: string, discountPercent: number, validDays: number, maxUses = 100): PromoCode {
    const promo: PromoCode = {
      code: code.toUpperCase(),
      discountPercent: Math.min(100, Math.max(0, discountPercent)),
      validUntil: this.now() + validDays * 86_400_000,
      maxUses,
      usedCount: 0,
    };
    this.promoCodes.set(promo.code, promo);
    return promo;
  }

  validatePromo(code: string): PromoCode | undefined {
    const promo = this.promoCodes.get(code.toUpperCase());
    if (!promo) return undefined;
    if (promo.validUntil < this.now()) return undefined;
    if (promo.usedCount >= promo.maxUses) return undefined;
    return promo;
  }

  redeemPromo(code: string): number {
    const promo = this.validatePromo(code);
    if (!promo) throw new BillingError("Invalid or expired promo code.");
    promo.usedCount++;
    return promo.discountPercent;
  }

  // ── Revenue metrics ─────────────────────────────────────────────────────

  getMetrics(): RevenueMetrics {
    let mrrCents = 0;
    let activeSubscribers = 0;
    const planDistribution: Record<PlanId, number> = { free: 0, premium: 0, family: 0 };

    for (const sub of this.subs.values()) {
      planDistribution[sub.plan]++;
      if (sub.status === "active" || sub.status === "trialing") {
        const price = PLAN_CATALOG[sub.plan].priceCents;
        if (price > 0) {
          mrrCents += price;
          activeSubscribers++;
        }
      }
    }

    const totalAtStart = activeSubscribers + this.canceledThisPeriod;
    const churnRate = totalAtStart > 0 ? this.canceledThisPeriod / totalAtStart : 0;

    return {
      mrrCents,
      activeSubscribers,
      churned: this.canceledThisPeriod,
      churnRate,
      planDistribution,
    };
  }

  /** Reset period metrics (called at the start of each billing period). */
  resetPeriodMetrics(): void {
    this.canceledThisPeriod = 0;
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private resolvePlanFromTier(tierId: string): PlanId {
    for (const [id, plan] of Object.entries(PLAN_CATALOG)) {
      if (plan.patreonTierId === tierId) return id as PlanId;
    }
    return "free";
  }

  private handleDecline(customerId: string): Subscription {
    const sub = this.subs.get(customerId);
    if (!sub)
      return { customerId, plan: "free", status: "active", trialEndsAt: null, failedAttempts: 0 };
    const failedAttempts = sub.failedAttempts + 1;
    if (failedAttempts >= this.maxDunning) {
      const downgraded: Subscription = {
        ...sub,
        plan: "free",
        status: "active",
        failedAttempts: 0,
      };
      this.subs.set(customerId, downgraded);
      return downgraded;
    }
    const pastDue: Subscription = { ...sub, status: "past_due", failedAttempts };
    this.subs.set(customerId, pastDue);
    return pastDue;
  }

  private charge(sub: Subscription): Subscription {
    const price = PLAN_CATALOG[sub.plan].priceCents;
    const result = this.provider.charge(sub.customerId, price, PLAN_CATALOG[sub.plan].currency);

    if (result.ok) {
      this.writeInvoice(
        sub.customerId,
        sub.plan,
        price,
        PLAN_CATALOG[sub.plan].currency,
        "sandbox",
      );
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

  private writeInvoice(
    customerId: string,
    plan: PlanId,
    subtotalCents: number,
    currency: string,
    source: "patreon" | "sandbox",
  ): void {
    const taxCents = Math.round(subtotalCents * this.taxRate);
    this.invoices.push({
      id: `inv_${++this.seq}`,
      customerId,
      plan,
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
      currency,
      at: new Date(this.now()).toISOString(),
      source,
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
