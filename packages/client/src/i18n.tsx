/**
 * NEXUS AI — React i18n binding
 *
 * Thin React context over the shared @nexus/i18n LocaleManager: the same
 * 20-locale catalogs, the same resolution order (stored choice > URL ?lang >
 * system), plus live document dir/lang updates for RTL locales.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { LocaleManager, SUPPORTED_LOCALES, isRtl, type Locale, type MessageKey } from "@nexus/i18n";

interface I18nValue {
  readonly locale: Locale;
  readonly locales: readonly Locale[];
  readonly rtl: boolean;
  readonly t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  readonly setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue | undefined>(undefined);

/** LocaleManager storage backed by window.localStorage. */
const browserStorage = {
  get(key: string): string | null {
    return localStorage.getItem(key);
  },
  set(key: string, value: string): void {
    localStorage.setItem(key, value);
  },
};

function applyDocumentLocale(locale: Locale): void {
  document.documentElement.lang = locale;
  document.documentElement.dir = isRtl(locale) ? "rtl" : "ltr";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const manager = useMemo(() => {
    const urlLocale = new URLSearchParams(location.search).get("lang") ?? undefined;
    const mgr = new LocaleManager({
      storage: browserStorage,
      systemLocale: navigator.language,
      urlLocale,
    });
    applyDocumentLocale(mgr.locale);
    return mgr;
  }, []);
  const [locale, setLocaleState] = useState<Locale>(manager.locale);

  const setLocale = useCallback(
    (next: Locale) => {
      manager.setLocale(next);
      applyDocumentLocale(next);
      setLocaleState(next);
    },
    [manager],
  );

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => manager.t(key, vars),
    // Re-create when the locale changes so consumers re-render with new text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manager, locale],
  );

  const value = useMemo<I18nValue>(
    () => ({ locale, locales: SUPPORTED_LOCALES, rtl: isRtl(locale), t, setLocale }),
    [locale, t, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
