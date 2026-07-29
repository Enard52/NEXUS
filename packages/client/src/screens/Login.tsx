/**
 * Real sign-in / sign-up against the sync server's auth API, including the
 * guest flow. Errors come from the server already localized.
 *
 * Kayıt modunda (signup) giriş modundan farklı olarak şu ek alanlar istenir:
 *   • Ad Soyad (fullName)
 *   • Şifre Tekrar (confirmPassword)
 */

import { useState, type FormEvent } from "react";
import { api, ApiError, type PublicUser } from "../api";
import { useI18n } from "../i18n";
import { BrandLogo } from "../components/BrandLogo";

export function LoginScreen({ onSignedIn }: { onSignedIn: (user: PublicUser) => void }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && password !== confirmPassword) {
      setError("Parolalar eşleşmiyor. Lütfen kontrol edin.");
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const user =
        mode === "signin"
          ? await api.login(email, password)
          : await api.register(email, password, fullName);
      onSignedIn(user);
    } catch (err) {
      setError(err instanceof ApiError && err.message ? err.message : t("auth.genericError"));
    } finally {
      setBusy(false);
    }
  };

  const guest = async () => {
    setBusy(true);
    setError(undefined);
    try {
      onSignedIn(await api.loginGuest());
    } catch (err) {
      // Offline / static server mode fallback: login as guest locally
      onSignedIn({
        id: "guest-user",
        email: "guest@local.nexus",
        displayName: "Misafir Kullanıcı",
        role: "owner",
        createdAt: new Date().toISOString(),
      });
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(undefined);
    setFullName("");
    setConfirmPassword("");
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card stack" onSubmit={(e) => void submit(e)}>
        <h1 className="auth-brand" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <BrandLogo size={36} />
          <span>NEXUS</span>
        </h1>
        <p className="auth-tagline muted">{t("auth.tagline")}</p>
        <h2 style={{ margin: 0, fontSize: 18 }}>
          {mode === "signin" ? t("auth.signInTitle") : t("auth.signUpTitle")}
        </h2>

        {/* Ad Soyad — yalnızca kayıt modunda gösterilir */}
        {mode === "signup" && (
          <div className="field">
            <label htmlFor="auth-fullname">{t("auth.fullName")}</label>
            <input
              id="auth-fullname"
              className="input"
              type="text"
              autoComplete="name"
              placeholder={t("auth.fullNameHint")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="auth-email">{t("auth.email")}</label>
          <input
            id="auth-email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="auth-password">{t("auth.password")}</label>
          <input
            id="auth-password"
            className="input"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {mode === "signup" && (
            <span className="muted" style={{ fontSize: 12 }}>
              {t("auth.passwordHint")}
            </span>
          )}
        </div>

        {/* Şifre Tekrar — yalnızca kayıt modunda gösterilir */}
        {mode === "signup" && (
          <div className="field">
            <label htmlFor="auth-confirm-password">{t("auth.confirmPassword")}</label>
            <input
              id="auth-confirm-password"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder={t("auth.confirmPasswordHint")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
        )}

        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
        <button className="btn primary" type="submit" disabled={busy}>
          {mode === "signin" ? t("auth.signInButton") : t("auth.signUpButton")}
        </button>
        <button className="btn" type="button" disabled={busy} onClick={switchMode}>
          {mode === "signin" ? t("auth.switchToSignUp") : t("auth.switchToSignIn")}
        </button>
        <button className="btn" type="button" disabled={busy} onClick={() => void guest()}>
          {t("auth.guest")}
        </button>
        <p className="muted" style={{ fontSize: 12, textAlign: "center", margin: 0 }}>
          {t("auth.guestHint")}
        </p>
      </form>
    </div>
  );
}
