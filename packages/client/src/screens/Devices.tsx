/**
 * Devices: the user's real device list with add / remove / online-toggle,
 * all persisted through PUT /api/data.
 */

import { useState, type FormEvent } from "react";
import { type UserDevice } from "../api";
import { useI18n } from "../i18n";
import { useUserData } from "../state";

export function DevicesScreen() {
  const { t } = useI18n();
  const { data, patch } = useUserData();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");

  const mutate = async (devices: readonly UserDevice[]) => {
    setBusy(true);
    try {
      await patch({ devices });
    } finally {
      setBusy(false);
    }
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedRoom = room.trim();
    if (!trimmedName || !trimmedRoom) return;
    const device: UserDevice = {
      id: `dev-${Date.now().toString(36)}`,
      name: trimmedName,
      room: trimmedRoom,
      online: true,
    };
    await mutate([...data.devices, device]);
    setName("");
    setRoom("");
  };

  const toggle = (id: string) =>
    mutate(data.devices.map((d) => (d.id === id ? { ...d, online: !d.online } : d)));

  const remove = (id: string) => mutate(data.devices.filter((d) => d.id !== id));

  return (
    <div className="stack">
      <h1 className="screen-title">{t("screen.devices")}</h1>
      {data.devices.length === 0 ? (
        <p className="card muted">{t("screen.devices.empty")}</p>
      ) : (
        <ul className="list">
          {data.devices.map((d) => (
            <li key={d.id} className="card list-row">
              <div className="stack" style={{ gap: 2 }}>
                <strong>{d.name}</strong>
                <span className="muted" style={{ fontSize: 13 }}>
                  {d.room}
                </span>
              </div>
              <div className="row">
                <button
                  className="btn"
                  type="button"
                  disabled={busy}
                  aria-pressed={d.online}
                  onClick={() => void toggle(d.id)}
                >
                  {d.online ? t("mobile.online") : t("mobile.offline")}
                </button>
                <button
                  className="btn"
                  type="button"
                  disabled={busy}
                  onClick={() => void remove(d.id)}
                >
                  {t("ui.remove")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form className="card stack" onSubmit={(e) => void add(e)}>
        <h2 style={{ margin: 0, fontSize: 16 }}>{t("devices.addTitle")}</h2>
        <div className="field">
          <label htmlFor="device-name">{t("devices.nameLabel")}</label>
          <input
            id="device-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="device-room">{t("devices.roomLabel")}</label>
          <input
            id="device-room"
            className="input"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
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
