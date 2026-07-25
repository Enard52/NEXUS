import { describe, expect, it } from "vitest";
import {
  BillingError,
  BillingService,
  PLAN_CATALOG,
  SandboxPaymentProvider,
  implemented,
  moduleName,
  type PatreonWebhookEvent,
} from "./index.js";

describe("@nexus/billing module identity", () => {
  it("reports itself as implemented", () => {
    expect(moduleName).toBe("billing");
    expect(implemented).toBe(true);
  });
});

describe("pricing tiers (FAZ 15)", () => {
  it("defines free/premium/family limits with Patreon tier IDs", () => {
    expect(PLAN_CATALOG.free.maxDevices).toBe(3);
    expect(PLAN_CATALOG.premium.allSkills).toBe(true);
    expect(PLAN_CATALOG.family.familySeats).toBe(6);
    expect(PLAN_CATALOG.premium.patreonTierId).toBe("tier_premium");
    expect(PLAN_CATALOG.family.patreonTierId).toBe("tier_family");
    expect(PLAN_CATALOG.free.patreonTierId).toBeUndefined();
  });
});

describe("subscription lifecycle (FAZ 15)", () => {
  it("starts a trial without charging, then converts on renewal", () => {
    const billing = new BillingService(new SandboxPaymentProvider());
    const sub = billing.subscribe("c1", "premium", 14);
    expect(sub.status).toBe("trialing");
    expect(billing.invoicesFor("c1")).toHaveLength(0);

    const renewed = billing.renew("c1");
    expect(renewed.status).toBe("active");
    expect(billing.invoicesFor("c1")).toHaveLength(1);
  });

  it("charges immediately for a paid plan with no trial", () => {
    const billing = new BillingService(new SandboxPaymentProvider());
    const sub = billing.subscribe("c1", "premium");
    expect(sub.status).toBe("active");
    expect(billing.invoicesFor("c1")).toHaveLength(1);
  });

  it("adds tax to the invoice total", () => {
    const billing = new BillingService(new SandboxPaymentProvider(), { taxRate: 0.2 });
    billing.subscribe("c1", "premium");
    const [invoice] = billing.invoicesFor("c1");
    expect(invoice!.subtotalCents).toBe(999);
    expect(invoice!.taxCents).toBe(200);
    expect(invoice!.totalCents).toBe(1199);
  });

  it("allows self-service cancellation", () => {
    const billing = new BillingService(new SandboxPaymentProvider());
    billing.subscribe("c1", "premium");
    expect(billing.cancel("c1").status).toBe("canceled");
    expect(() => billing.renew("c1")).toThrow(BillingError);
  });

  it("downgrading to free stops billing without an abrupt cutoff", () => {
    const billing = new BillingService(new SandboxPaymentProvider());
    billing.subscribe("c1", "premium");
    const downgraded = billing.changePlan("c1", "free");
    expect(downgraded.plan).toBe("free");
    expect(downgraded.status).toBe("active");
  });
});

describe("dunning on failed payments (FAZ 15)", () => {
  it("marks past_due then gracefully downgrades to free after the limit", () => {
    const provider = new SandboxPaymentProvider(new Set(["c1"]));
    const billing = new BillingService(provider, { maxDunningAttempts: 3 });

    const first = billing.subscribe("c1", "premium");
    expect(first.status).toBe("past_due");
    expect(first.failedAttempts).toBe(1);

    const second = billing.renew("c1");
    expect(second.status).toBe("past_due");
    expect(second.failedAttempts).toBe(2);

    const third = billing.renew("c1");
    expect(third.plan).toBe("free");
    expect(third.status).toBe("active");
  });

  it("uses an explicit sandbox provider that never fakes real charges", () => {
    const provider = new SandboxPaymentProvider();
    expect(provider.sandbox).toBe(true);
  });
});

describe("Patreon webhook integration (FAZ 15)", () => {
  function makeBilling() {
    const billing = new BillingService(new SandboxPaymentProvider(), {
      patreon: {
        clientId: "patreon-client-id",
        clientSecret: "patreon-secret",
        redirectUri: "https://nexus.app/api/patreon/callback",
        campaignId: "campaign_123",
      },
    });
    return billing;
  }

  it("activates subscription on pledge:create webhook", () => {
    const billing = makeBilling();
    billing.linkPatron("c1", "patron_001");

    const event: PatreonWebhookEvent = {
      type: "members:pledge:create",
      patronId: "patron_001",
      email: "patron@example.com",
      tierId: "tier_premium",
      amountCents: 999,
      currency: "USD",
      status: "active_patron",
      pledgeId: "pledge_abc",
    };

    const sub = billing.handlePatreonWebhook(event);
    expect(sub?.status).toBe("active");
    expect(sub?.plan).toBe("premium");
    expect(sub?.patreonPatronId).toBe("patron_001");
    expect(billing.invoicesFor("c1")).toHaveLength(1);
    expect(billing.invoicesFor("c1")[0]!.source).toBe("patreon");
  });

  it("handles declined patron as dunning", () => {
    const billing = makeBilling();
    billing.linkPatron("c1", "patron_001");
    billing.subscribe("c1", "premium");

    const event: PatreonWebhookEvent = {
      type: "members:pledge:update",
      patronId: "patron_001",
      tierId: "tier_premium",
      amountCents: 999,
      currency: "USD",
      status: "declined_patron",
    };

    const sub = billing.handlePatreonWebhook(event);
    expect(sub?.status).toBe("past_due");
    expect(sub?.failedAttempts).toBe(1);
  });

  it("cancels subscription on pledge:delete webhook", () => {
    const billing = makeBilling();
    billing.linkPatron("c1", "patron_001");
    billing.subscribe("c1", "premium");

    const event: PatreonWebhookEvent = {
      type: "members:pledge:delete",
      patronId: "patron_001",
      tierId: "tier_premium",
      amountCents: 999,
      currency: "USD",
      status: "former_patron",
    };

    const sub = billing.handlePatreonWebhook(event);
    expect(sub?.status).toBe("canceled");
  });

  it("ignores webhooks for unlinked patrons", () => {
    const billing = makeBilling();
    const event: PatreonWebhookEvent = {
      type: "members:pledge:create",
      patronId: "unknown_patron",
      tierId: "tier_premium",
      amountCents: 999,
      currency: "USD",
      status: "active_patron",
    };
    expect(billing.handlePatreonWebhook(event)).toBeUndefined();
  });

  it("generates Patreon auth URL for account linking", () => {
    const billing = makeBilling();
    const url = billing.getPatreonAuthUrl("csrf-state-123");
    expect(url).toContain("patreon.com/oauth2/authorize");
    expect(url).toContain("patreon-client-id");
    expect(url).toContain("csrf-state-123");
    expect(url).toContain("identity");
  });

  it("generates checkout URL for a paid tier", () => {
    const billing = makeBilling();
    const url = billing.getCheckoutUrl("premium");
    expect(url).toContain("patreon.com/join/campaign_123");
    expect(url).toContain("tier_premium");
  });

  it("throws for checkout of the free plan", () => {
    const billing = makeBilling();
    expect(() => billing.getCheckoutUrl("free")).toThrow(BillingError);
  });
});

describe("promo codes (FAZ 15)", () => {
  it("creates, validates, and redeems a promo code", () => {
    const billing = new BillingService(new SandboxPaymentProvider());
    const promo = billing.addPromoCode("LAUNCH20", 20, 30);
    expect(promo.discountPercent).toBe(20);
    expect(promo.usedCount).toBe(0);

    const validated = billing.validatePromo("launch20"); // case-insensitive
    expect(validated?.code).toBe("LAUNCH20");

    const discount = billing.redeemPromo("LAUNCH20");
    expect(discount).toBe(20);
  });

  it("rejects expired or maxed-out promo codes", () => {
    let clock = 1000;
    const billing = new BillingService(new SandboxPaymentProvider(), { now: () => clock });
    billing.addPromoCode("SHORT", 10, 1, 1); // 1 day, 1 use max

    // Use it once
    billing.redeemPromo("SHORT");
    // Second use fails (maxed out)
    expect(() => billing.redeemPromo("SHORT")).toThrow(BillingError);

    // Expired code
    billing.addPromoCode("EXPIRE", 50, 1);
    clock += 2 * 86_400_000; // 2 days later
    expect(billing.validatePromo("EXPIRE")).toBeUndefined();
  });
});

describe("revenue metrics (FAZ 15)", () => {
  it("computes MRR, active subscribers, churn rate and plan distribution", () => {
    const billing = new BillingService(new SandboxPaymentProvider());
    billing.subscribe("c1", "premium");
    billing.subscribe("c2", "family");
    billing.subscribe("c3", "free");
    billing.subscribe("c4", "premium");

    const m = billing.getMetrics();
    expect(m.mrrCents).toBe(999 + 1799 + 999); // 2 premium + 1 family
    expect(m.activeSubscribers).toBe(3);
    expect(m.planDistribution.premium).toBe(2);
    expect(m.planDistribution.family).toBe(1);
    expect(m.planDistribution.free).toBe(1);
    expect(m.churnRate).toBe(0);

    // Cancel one → churn increases
    billing.cancel("c1");
    const m2 = billing.getMetrics();
    expect(m2.churned).toBe(1);
    expect(m2.churnRate).toBeGreaterThan(0);
  });

  it("resetPeriodMetrics clears the churn counter", () => {
    const billing = new BillingService(new SandboxPaymentProvider());
    billing.subscribe("c1", "premium");
    billing.cancel("c1");
    expect(billing.getMetrics().churned).toBe(1);
    billing.resetPeriodMetrics();
    expect(billing.getMetrics().churned).toBe(0);
  });
});
