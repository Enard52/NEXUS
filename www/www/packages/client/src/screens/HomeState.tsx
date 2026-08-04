/**
 * Home State: the user's devices grouped by room, computed live from the
 * real data record.
 */

import { useMemo } from "react";
import { type UserDevice } from "../api";
import { useI18n } from "../i18n";
import { useUserData } from "../state";

export function HomeStateScreen() {
  const { t } = useI18n();
  const { data } = useUserData();

  const rooms = useMemo(() => {
    const map = new Map<string, UserDevice[]>();
    for (const device of data.devices) {
      const list = map.get(device.room) ?? [];
      list.push(device);
      map.set(device.room, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data.devices]);

  return (
    <div className="stack">
      <h1 className="screen-title">{t("screen.homeState")}</h1>
      {rooms.length === 0 ? (
        <p className="card muted">{t("screen.homeState.empty")}</p>
      ) : (
        rooms.map(([room, devices]) => {
          const online = devices.filter((d) => d.online).length;
          return (
            <section key={room} className="card stack" aria-label={room}>
              <div className="list-row">
                <h2 style={{ margin: 0, fontSize: 16 }}>{room}</h2>
                <span className="muted" style={{ fontSize: 13 }}>
                  {t("status.onlineOfTotal", { online, total: devices.length })}
                </span>
              </div>
              <ul className="list" style={{ gap: 4 }}>
                {devices.map((d) => (
                  <li key={d.id} className="list-row" style={{ padding: "4px 0" }}>
                    <span>{d.name}</span>
                    <span
                      className={d.online ? "pill ok" : "pill"}
                      aria-label={d.online ? t("mobile.online") : t("mobile.offline")}
                    >
                      {d.online ? t("mobile.online") : t("mobile.offline")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
