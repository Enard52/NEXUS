/**
 * Billing: the real subscription state with plan switching and cancellation
 * via the billing API. No payment-method decoration — only what the local
 * billing engine actually tracks.
 */

import { useState } from "react";
import { api } from "../api";
import type { UserData } from "../api";
import type { MessageKey } from "@nexus/i18n";
import { useI18n } from "../i18n";
import { useUserData } from "../state";

type Plan = UserData["plan"];

const PLAN_KEY: Record<Plan, MessageKey> = {
  free: "plan.free",
  premium: "plan.premium",
  family: "plan.family",
};

const PLAN_ORDER: readonly Plan[] = ["free", "premium", "family"];

const PLAN_FEATURES: Record<Plan, readonly MessageKey[]> = {
  free: ["billing.feature.devices"],
  premium: ["billing.feature.devices", "billing.feature.connectors", "billing.feature.ai"],
  family: [
    "billing.feature.devices",
    "billing.feature.connectors",
    "billing.feature.ai",
    "billing.feature.family",
  ],
};

export function BillingScreen() {
  const { t } = useI18n();
  const { data, refresh } = useUserData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(undefined);
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("ui.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <h1 className="screen-title">{t("screen.billing")}</h1>
      <section className="card stack">
        <span className="muted" style={{ fontSize: 13 }}>
          {t("billing.currentPlan")}
        </span>
        <strong style={{ fontSize: 20 }}>{t(PLAN_KEY[data.plan])}</strong>
        {data.plan !== "free" && (
          <button
            className="btn"
            type="button"
            disabled={busy}
            onClick={() => void act(() => api.cancelSubscription())}
          >
            {t("billing.cancelRenewal")}
          </button>
        )}
      </section>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      <h2 style={{ margin: 0, fontSize: 16 }}>{t("billing.choosePlan")}</h2>
      <div className="stat-grid">
        {PLAN_ORDER.map((plan) => (
          <section key={plan} className="card stack" aria-label={t(PLAN_KEY[plan])}>
            <strong>{t(PLAN_KEY[plan])}</strong>
            <ul className="list" style={{ gap: 4, margin: 0, paddingInlineStart: 18 }}>
              {PLAN_FEATURES[plan].map((key) => (
                <li key={key} className="muted" style={{ fontSize: 13 }}>
                  {t(key)}
                </li>
              ))}
            </ul>
            <button
              className={plan === data.plan ? "btn" : "btn primary"}
              type="button"
              disabled={busy || plan === data.plan}
              onClick={() => void act(() => api.subscribe(plan))}
            >
              {plan === data.plan ? t("billing.currentPlan") : t("billing.manage")}
            </button>
          </section>
        ))}
      </div>
    </div>
  );
}
