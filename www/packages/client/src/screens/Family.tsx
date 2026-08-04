/**
 * Family: household members from the real data record with add/remove.
 * Navigation gating (family plan only) is enforced by buildNavigation, and
 * the server re-validates every write.
 */

import { useState, type FormEvent } from "react";
import { type UserFamilyMember } from "../api";
import { useI18n } from "../i18n";
import { useUserData } from "../state";
import type { MessageKey } from "@nexus/i18n";

const ROLE_KEY: Record<UserFamilyMember["role"], MessageKey> = {
  admin: "role.admin",
  member: "role.member",
  guest: "role.guest",
};

export function FamilyScreen() {
  const { t } = useI18n();
  const { data, patch } = useUserData();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserFamilyMember["role"]>("member");

  const mutate = async (family: readonly UserFamilyMember[]) => {
    setBusy(true);
    try {
      await patch({ family });
    } finally {
      setBusy(false);
    }
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const member: UserFamilyMember = {
      id: `fam-${Date.now().toString(36)}`,
      name: trimmed,
      role,
    };
    await mutate([...data.family, member]);
    setName("");
    setRole("member");
  };

  const remove = (id: string) => mutate(data.family.filter((m) => m.id !== id));

  return (
    <div className="stack">
      <h1 className="screen-title">{t("screen.family")}</h1>
      {data.family.length === 0 ? (
        <p className="card muted">{t("family.empty")}</p>
      ) : (
        <ul className="list">
          {data.family.map((m) => (
            <li key={m.id} className="card list-row">
              <div className="stack" style={{ gap: 2 }}>
                <strong>{m.name}</strong>
                <span className="muted" style={{ fontSize: 13 }}>
                  {t(ROLE_KEY[m.role])}
                </span>
              </div>
              <button
                className="btn"
                type="button"
                disabled={busy}
                onClick={() => void remove(m.id)}
              >
                {t("ui.remove")}
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="card stack" onSubmit={(e) => void add(e)}>
        <h2 style={{ margin: 0, fontSize: 16 }}>{t("family.addTitle")}</h2>
        <div className="field">
          <label htmlFor="family-name">{t("family.nameLabel")}</label>
          <input
            id="family-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="family-role">{t("family.roleLabel")}</label>
          <select
            id="family-role"
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as UserFamilyMember["role"])}
          >
            <option value="admin">{t("role.admin")}</option>
            <option value="member">{t("role.member")}</option>
            <option value="guest">{t("role.guest")}</option>
          </select>
        </div>
        <button className="btn primary" type="submit" disabled={busy}>
          {t("ui.add")}
        </button>
      </form>
    </div>
  );
}
