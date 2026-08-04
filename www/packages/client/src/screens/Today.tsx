/**
 * Today: live stats computed from the user's real data record plus the
 * assistant command bar wired to the real /api/command pipeline (including
 * the confirm flow for guarded actions).
 */

import { useState, type FormEvent } from "react";
import { api, ApiError, type CommandResponse } from "../api";
import { useI18n } from "../i18n";
import { useUserData } from "../state";

export function TodayScreen() {
  const { t } = useI18n();
  const { data, refresh } = useUserData();

  const online = data.devices.filter((d) => d.online).length;

  return (
    <div className="stack">
      <h1 className="screen-title">{t("screen.today")}</h1>
      <div className="stat-grid">
        <StatCard
          label={t("today.devicesOnline")}
          value={t("status.onlineOfTotal", { online, total: data.devices.length })}
        />
        <StatCard label={t("today.energy")} value={`${data.energyWhToday} Wh`} />
        <StatCard label={t("today.activeRoutines")} value={String(data.routines.length)} />
        <StatCard label={t("today.suggestions")} value={String(data.suggestions.length)} />
      </div>
      <AssistantBar onExecuted={() => void refresh()} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card stat-card">
      <span className="muted" style={{ fontSize: 13 }}>
        {label}
      </span>
      <strong style={{ fontSize: 22 }}>{value}</strong>
    </div>
  );
}

function AssistantBar({ onExecuted }: { onExecuted: () => void }) {
  const { t } = useI18n();
  const [utterance, setUtterance] = useState("");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<CommandResponse | undefined>(undefined);
  const [pendingUtterance, setPendingUtterance] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const run = async (fn: () => Promise<CommandResponse>, sent: string) => {
    setBusy(true);
    setError(undefined);
    try {
      const res = await fn();
      setReply(res);
      setPendingUtterance(res.pending.length > 0 ? sent : undefined);
      if (res.executed.length > 0) onExecuted();
    } catch (err) {
      setError(err instanceof ApiError && err.message ? err.message : t("ui.error"));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = utterance.trim();
    if (!text) return;
    void run(() => api.command(text), text);
  };

  const confirm = () => {
    if (!pendingUtterance) return;
    void run(() => api.confirmCommand(pendingUtterance), pendingUtterance);
  };

  return (
    <section className="card stack" aria-label={t("assistant.title")}>
      <h2 style={{ margin: 0, fontSize: 16 }}>{t("assistant.title")}</h2>
      <form className="row" onSubmit={submit}>
        <input
          className="input"
          style={{ flex: 1 }}
          placeholder={t("assistant.placeholder")}
          value={utterance}
          onChange={(e) => setUtterance(e.target.value)}
          aria-label={t("assistant.placeholder")}
        />
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? t("ui.loading") : t("assistant.send")}
        </button>
      </form>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {reply && (
        <div className="assistant-reply" role="status">
          <p style={{ margin: 0 }}>{reply.text}</p>
          {pendingUtterance && (
            <div className="row" style={{ marginTop: 8 }}>
              <span className="muted" style={{ fontSize: 13 }}>
                {t("app.confirmNeeded")}
              </span>
              <button className="btn primary" type="button" disabled={busy} onClick={confirm}>
                {t("ui.confirm")}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
