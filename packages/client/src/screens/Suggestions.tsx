/**
 * Suggestions: the assistant's real pending suggestions with accept/dismiss
 * wired to the server endpoints (accept may create a routine server-side).
 */

import { useState } from "react";
import { api } from "../api";
import { useI18n } from "../i18n";
import { useUserData } from "../state";

export function SuggestionsScreen() {
  const { t } = useI18n();
  const { data, refresh } = useUserData();
  const [busyId, setBusyId] = useState<string | undefined>(undefined);

  const act = async (id: string, fn: (id: string) => Promise<unknown>) => {
    setBusyId(id);
    try {
      await fn(id);
      await refresh();
    } finally {
      setBusyId(undefined);
    }
  };

  return (
    <div className="stack">
      <h1 className="screen-title">{t("screen.suggestions")}</h1>
      {data.suggestions.length === 0 ? (
        <p className="card muted">{t("screen.suggestions.empty")}</p>
      ) : (
        <ul className="list">
          {data.suggestions.map((s) => (
            <li key={s.id} className="card list-row">
              <span style={{ flex: 1 }}>{s.text}</span>
              <div className="row">
                <button
                  className="btn primary"
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => void act(s.id, api.acceptSuggestion)}
                >
                  {t("suggestions.accept")}
                </button>
                <button
                  className="btn"
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => void act(s.id, api.dismissSuggestion)}
                >
                  {t("suggestions.dismiss")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
