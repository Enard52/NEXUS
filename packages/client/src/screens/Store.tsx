/**
 * Store: the real connector catalog from /api/store/catalog with
 * install/uninstall. Locked entries reflect the server's plan gating.
 */

import { useCallback, useEffect, useState } from "react";
import { api, type StoreItem } from "../api";
import { useI18n } from "../i18n";

type ViewState =
  | { readonly kind: "loading" }
  | { readonly kind: "error" }
  | { readonly kind: "ready"; readonly items: readonly StoreItem[] };

export function StoreScreen() {
  const { t } = useI18n();
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [busyId, setBusyId] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setState({ kind: "ready", items: await api.storeCatalog() });
    } catch {
      setState({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: string, fn: (id: string) => Promise<unknown>) => {
    setBusyId(id);
    try {
      await fn(id);
      await load();
    } finally {
      setBusyId(undefined);
    }
  };

  if (state.kind === "loading") {
    return <p className="card muted">{t("ui.loading")}</p>;
  }
  if (state.kind === "error") {
    return (
      <div className="stack">
        <p className="error-banner" role="alert">
          {t("ui.error")}
        </p>
        <button className="btn" type="button" onClick={() => void load()}>
          {t("ui.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="stack">
      <h1 className="screen-title">{t("store.title")}</h1>
      <ul className="list">
        {state.items.map((item) => (
          <li key={item.id} className="card list-row">
            <div className="stack" style={{ gap: 2, flex: 1 }}>
              <strong>{item.name}</strong>
              {item.description && (
                <span className="muted" style={{ fontSize: 13 }}>
                  {item.description}
                </span>
              )}
              {item.locked && (
                <span className="pill" style={{ alignSelf: "flex-start" }}>
                  {t("store.premiumOnly")}
                </span>
              )}
            </div>
            {item.installed ? (
              <div className="row">
                <span className="pill ok">{t("store.installed")}</span>
                <button
                  className="btn"
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void act(item.id, api.storeUninstall)}
                >
                  {t("store.uninstall")}
                </button>
              </div>
            ) : (
              <button
                className="btn primary"
                type="button"
                disabled={busyId === item.id || item.locked}
                onClick={() => void act(item.id, api.storeInstall)}
              >
                {t("store.install")}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
