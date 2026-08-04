/**
 * Settings (personalization): assistant name, display name, language and
 * theme. Text fields persist via PUT /api/data; language persists both
 * locally (LocaleManager) and in the user record so other surfaces follow.
 */

import { useState, type FormEvent } from "react";
import type { Locale } from "@nexus/i18n";
import type { ThemeName } from "@nexus/design-system";
import { useI18n } from "../i18n";
import { useUserData } from "../state";
import { currentTheme, setTheme } from "../theme";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  tr: "Türkçe",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  cs: "Čeština",
  ru: "Русский",
  uk: "Українська",
  ar: "العربية",
  he: "עברית",
  hi: "हिन्दी",
  ja: "日本語",
  ko: "한국어",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
  vi: "Tiếng Việt",
};

export function SettingsScreen() {
  const { t, locale, locales, setLocale } = useI18n();
  const { data, patch } = useUserData();
  const [assistantName, setAssistantName] = useState(data.assistantName);
  const [displayName, setDisplayName] = useState(data.displayName);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [theme, setThemeState] = useState<ThemeName>(currentTheme());

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      await patch({ assistantName: assistantName.trim(), displayName: displayName.trim() });
      setSaved(true);
    } finally {
      setBusy(false);
    }
  };

  const changeLocale = (next: Locale) => {
    setLocale(next);
    // Keep the server-side record in sync so every surface renders alike.
    void patch({ language: next }).catch(() => {});
  };

  const changeTheme = (next: ThemeName) => {
    setTheme(next);
    setThemeState(next);
  };

  return (
    <div className="stack">
      <h1 className="screen-title">{t("screen.personalization")}</h1>
      <form className="card stack" onSubmit={(e) => void save(e)}>
        <div className="field">
          <label htmlFor="set-assistant">{t("settings.assistantName")}</label>
          <input
            id="set-assistant"
            className="input"
            value={assistantName}
            onChange={(e) => setAssistantName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="set-display">{t("settings.displayName")}</label>
          <input
            id="set-display"
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="row">
          <button className="btn primary" type="submit" disabled={busy}>
            {t("ui.save")}
          </button>
          {saved && (
            <span className="muted" role="status">
              {t("ui.saved")}
            </span>
          )}
        </div>
      </form>
      <section className="card stack">
        <div className="field">
          <label htmlFor="set-language">{t("ui.language")}</label>
          <select
            id="set-language"
            className="input"
            value={locale}
            onChange={(e) => changeLocale(e.target.value as Locale)}
          >
            {locales.map((l) => (
              <option key={l} value={l}>
                {LOCALE_LABELS[l] ?? l}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <span id="theme-label">{t("ui.theme")}</span>
          <div className="row" role="group" aria-labelledby="theme-label">
            <button
              className={theme === "dark" ? "btn primary" : "btn"}
              type="button"
              aria-pressed={theme === "dark"}
              onClick={() => changeTheme("dark")}
            >
              {t("ui.themeDark")}
            </button>
            <button
              className={theme === "light" ? "btn primary" : "btn"}
              type="button"
              aria-pressed={theme === "light"}
              onClick={() => changeTheme("light")}
            >
              {t("ui.themeLight")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
