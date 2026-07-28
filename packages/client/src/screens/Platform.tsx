/**
 * Platform: live runtime facts from /api/platform/info — whatever the Local
 * Core actually reports, rendered as-is.
 */

import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useI18n } from "../i18n";

type ViewState =
  | { readonly kind: "loading" }
  | { readonly kind: "error" }
  | { readonly kind: "ready"; readonly info: Record<string, unknown> };

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function PlatformScreen() {
  const { t } = useI18n();
  const [state, setState] = useState<ViewState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setState({ kind: "ready", info: await api.platformInfo() });
    } catch {
      setState({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="stack">
      <h1 className="screen-title">{t("screen.platform")}</h1>
      {state.kind === "loading" && <p className="card muted">{t("ui.loading")}</p>}
      {state.kind === "error" && (
        <div className="stack">
          <p className="error-banner" role="alert">
            {t("ui.error")}
          </p>
          <button className="btn" type="button" onClick={() => void load()}>
            {t("ui.retry")}
          </button>
        </div>
      )}
      {state.kind === "ready" && (
        <dl className="card kv-list">
          {Object.entries(state.info).map(([key, value]) => (
            <div key={key} className="list-row" style={{ padding: "6px 0" }}>
              <dt className="muted" style={{ fontSize: 13 }}>
                {key}
              </dt>
              <dd style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 13 }}>
                {renderValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
