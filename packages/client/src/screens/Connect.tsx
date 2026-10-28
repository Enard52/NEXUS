/**
 * Mobile-only pairing screen: the native app must connect to the user's real
 * NEXUS Local Core over the network before anything else works. The address is
 * verified against /health (service identity check), then persisted.
 */

import { useState, type FormEvent } from "react";
import { api, getServerUrl, setServerUrl } from "../api";
import { useI18n } from "../i18n";

export function ConnectScreen({ onPaired }: { onPaired: () => void }) {
  const { t } = useI18n();
  const [url, setUrl] = useState(getServerUrl() || "http://");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFailed(false);
    const ok = await api.probe(url);
    setBusy(false);
    if (!ok) {
      setFailed(true);
      return;
    }
    setServerUrl(url);
    onPaired();
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card stack" onSubmit={(e) => void submit(e)}>
        <h1 className="auth-brand">NEXUS</h1>
        <h2 style={{ margin: 0, fontSize: 18 }}>{t("connect.title")}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {t("connect.desc")}
        </p>
        <div className="field">
          <label htmlFor="server-url">URL</label>
          <input
            id="server-url"
            className="input"
            type="url"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            placeholder={t("connect.placeholder")}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        {failed && (
          <p className="error-banner" role="alert">
            {t("connect.error")}
          </p>
        )}
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? t("ui.loading") : t("connect.button")}
        </button>
      </form>
    </div>
  );
}
