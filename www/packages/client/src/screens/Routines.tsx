/**
 * Routines (the "skills" screen): the user's real routines with create and
 * remove, persisted through PUT /api/data.
 */

import { useState, type FormEvent } from "react";
import { type UserRoutine } from "../api";
import { useI18n } from "../i18n";
import { useUserData } from "../state";

export function RoutinesScreen() {
  const { t } = useI18n();
  const { data, patch } = useUserData();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");

  const mutate = async (routines: readonly UserRoutine[]) => {
    setBusy(true);
    try {
      await patch({ routines });
    } finally {
      setBusy(false);
    }
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const routine: UserRoutine = {
      id: `rt-${Date.now().toString(36)}`,
      name: trimmed,
      usageCount: 0,
    };
    await mutate([...data.routines, routine]);
    setName("");
  };

  const remove = (id: string) => mutate(data.routines.filter((r) => r.id !== id));

  return (
    <div className="stack">
      <h1 className="screen-title">{t("screen.skills")}</h1>
      {data.routines.length === 0 ? (
        <p className="card muted">{t("screen.skills.empty")}</p>
      ) : (
        <ul className="list">
          {data.routines.map((r) => (
            <li key={r.id} className="card list-row">
              <div className="stack" style={{ gap: 2 }}>
                <strong>{r.name}</strong>
                <span className="muted" style={{ fontSize: 13 }}>
                  {t("routines.usageCount", { count: r.usageCount })}
                </span>
              </div>
              <button
                className="btn"
                type="button"
                disabled={busy}
                onClick={() => void remove(r.id)}
              >
                {t("ui.remove")}
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="card stack" onSubmit={(e) => void add(e)}>
        <h2 style={{ margin: 0, fontSize: 16 }}>{t("routines.addTitle")}</h2>
        <div className="field">
          <label htmlFor="routine-name">{t("routines.nameLabel")}</label>
          <input
            id="routine-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <button className="btn primary" type="submit" disabled={busy}>
          {t("ui.add")}
        </button>
      </form>
    </div>
  );
}
