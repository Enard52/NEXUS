/**
 * The signed-in application shell: desktop titlebar (frameless Electron),
 * side navigation (wide) or bottom tabs (narrow), and the active screen.
 * Navigation comes from the shared @nexus/interface ScreenDescriptor registry
 * filtered by the real plan/role — no hardcoded menus.
 */

import { useEffect, useMemo, useState } from "react";
import { buildNavigation, type NavContext } from "@nexus/interface";
import { useI18n } from "./i18n";
import { useUserData, useAppState } from "./state";
import { CLIENT_SCREENS, STORE_SCREEN, findScreen } from "./screens/registry";
import { BrandLogo } from "./components/BrandLogo";

declare global {
  interface Window {
    nexusDesktop?: {
      window: { minimize: () => void; toggleMaximize: () => void; close: () => void };
    };
  }
}

function currentHashScreen(): string {
  return location.hash.replace(/^#\/?/, "") || "today";
}

export function Shell() {
  const { t } = useI18n();
  const { user, data } = useUserData();
  const { signOut } = useAppState();
  const [active, setActive] = useState<string>(currentHashScreen());

  useEffect(() => {
    const onHash = () => setActive(currentHashScreen());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const nav = useMemo(() => {
    const ctx: NavContext = { authenticated: true, plan: data.plan, role: user.role };
    const allowed = buildNavigation(ctx).map((s) => s.id as string);
    return CLIENT_SCREENS.filter((s) => allowed.includes(s.id));
  }, [data.plan, user.role]);

  const items: readonly { id: string; icon: string; label: string }[] = useMemo(
    () => [
      ...nav.map((s) => ({ id: s.id, icon: s.icon, label: t(s.titleKey) })),
      // The connector store is a real API-backed surface (catalog/install).
      { id: STORE_SCREEN.id, icon: STORE_SCREEN.icon, label: t(STORE_SCREEN.titleKey) },
    ],
    [nav, t],
  );

  const go = (id: string) => {
    location.hash = `#/${id}`;
  };

  const isDesktopShell = Boolean(window.nexusDesktop);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t("ui.skipToContent")}
      </a>
      {isDesktopShell && (
        <header className="titlebar">
          <span className="brand" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <BrandLogo size={22} />
            <span>NEXUS</span>
          </span>
          <div className="wctl">
            <button
              className="wctl-btn"
              aria-label={t("desktop.windowAction", { action: "minimize" })}
              onClick={() => window.nexusDesktop?.window.minimize()}
            >
              –
            </button>
            <button
              className="wctl-btn"
              aria-label={t("desktop.windowAction", { action: "maximize" })}
              onClick={() => window.nexusDesktop?.window.toggleMaximize()}
            >
              ▢
            </button>
            <button
              className="wctl-btn close"
              aria-label={t("desktop.windowAction", { action: "close" })}
              onClick={() => window.nexusDesktop?.window.close()}
            >
              ✕
            </button>
          </div>
        </header>
      )}
      <div className="app-main">
        <nav className="sidenav" aria-label={t("nav.primary")}>
          <div
            className="nav-brand"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px 16px 12px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <BrandLogo size={28} />
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>NEXUS</span>
          </div>
          {items.map((item) => (
            <button
              key={item.id}
              className="nav-item"
              aria-current={active === item.id ? "page" : undefined}
              onClick={() => go(item.id)}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div className="nav-profile">
            <div className="avatar">
              {((user as any).displayName || user.email || "?")[0].toUpperCase()}
            </div>
            <div className="nav-profile-info">
              <span className="nav-profile-name">{(user as any).displayName || "User"}</span>
              <span className="nav-profile-email">{user.email}</span>
            </div>
          </div>
          <button className="nav-item" onClick={() => void signOut()}>
            <span aria-hidden="true">↩</span>
            {t("auth.logout")}
          </button>
        </nav>
        <main id="main-content" className="app-content" tabIndex={-1}>
          <ActiveScreen id={active} known={items.map((i) => i.id)} />
        </main>
      </div>
      <nav className="tabbar" aria-label={t("nav.primary")}>
        {items.slice(0, 4).map((item) => (
          <button
            key={item.id}
            className="nav-item"
            aria-current={active === item.id ? "page" : undefined}
            onClick={() => go(item.id)}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        ))}
        <button
          className="nav-item"
          aria-current={
            active === "personalization" || !items.slice(0, 4).some((i) => i.id === active)
              ? "page"
              : undefined
          }
          onClick={() => go("personalization")}
        >
          <span aria-hidden="true">{findScreen("personalization")?.icon}</span>
          {t("mobile.more")}
        </button>
      </nav>
    </div>
  );
}

function ActiveScreen({ id, known }: { id: string; known: readonly string[] }) {
  const target = known.includes(id) ? id : "today";
  const screen = findScreen(target) ?? CLIENT_SCREENS[0];
  const Component = screen.component;
  return <Component />;
}
