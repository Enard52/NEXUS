/**
 * Root component: pairing gate (mobile) → auth gate → the real app shell.
 */

import { useEffect, useState } from "react";
import { needsServerPairing } from "./api";
import { useAppState, AppStateProvider } from "./state";
import { useI18n } from "./i18n";
import { ConnectScreen } from "./screens/Connect";
import { LoginScreen } from "./screens/Login";
import { Shell } from "./Shell";

function Gate() {
  const { session, data, dataError, signIn, refresh } = useAppState();
  const { t } = useI18n();
  const [paired, setPaired] = useState(!needsServerPairing());

  useEffect(() => {
    document.title = "NEXUS";
  }, []);

  if (!paired) return <ConnectScreen onPaired={() => setPaired(true)} />;

  if (session.kind === "loading") {
    return (
      <div className="auth-wrap">
        <p className="muted" role="status">
          {t("ui.loading")}
        </p>
      </div>
    );
  }

  if (session.kind === "anon") return <LoginScreen onSignedIn={signIn} />;

  if (!data) {
    return (
      <div className="auth-wrap">
        {dataError ? (
          <div className="stack" style={{ alignItems: "center" }}>
            <p className="error-banner">{t("ui.error")}</p>
            <button className="btn" onClick={() => void refresh()}>
              {t("ui.retry")}
            </button>
          </div>
        ) : (
          <p className="muted" role="status">
            {t("ui.loading")}
          </p>
        )}
      </div>
    );
  }

  return <Shell />;
}

export function App() {
  return (
    <AppStateProvider>
      <Gate />
    </AppStateProvider>
  );
}
