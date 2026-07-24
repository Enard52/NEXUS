import { describe, expect, it } from "vitest";
import {
  BillingError,
  BillingService,
  PLAN_CATALOG,
  SandboxPaymentProvider,
  implemented,
  moduleName,
} from "./index.js";

describe("@nexus/billing module identity", () => {
  it("reports itself as implemented", () => {
    expect(moduleName).toBe("billing");
    expect(implemented).toBe(true);
  });
});

describe("pricing tiers (FAZ 15)", () => {
  it("defines free/premium/family limits", () => {
    expect(PLAN_CATALOG.free.maxDevices).toBe(3);
    expect(PLAN_CATALOG.premium.allSkills).toBe(true);
    expect(PLAN_CATALOG.family.familySeats).toBe(6);
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

    // First attempt fails: subscription is created past_due (not cut off).
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
