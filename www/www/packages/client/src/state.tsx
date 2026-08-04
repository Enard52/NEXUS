/**
 * Session + user-data state. One provider owns the signed-in account and the
 * durable per-user data record; every screen reads/patches through it so the
 * whole app always reflects the real server state.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, type PublicUser, type UserData } from "./api";

export type SessionState =
  | { readonly kind: "loading" }
  | { readonly kind: "anon" }
  | { readonly kind: "authed"; readonly user: PublicUser };

interface AppState {
  readonly session: SessionState;
  readonly data: UserData | undefined;
  readonly dataError: string | undefined;
  readonly signIn: (user: PublicUser) => void;
  readonly signOut: () => Promise<void>;
  readonly refresh: () => Promise<void>;
  readonly patch: (patch: Partial<UserData>) => Promise<void>;
}

const StateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ kind: "loading" });
  const [data, setData] = useState<UserData | undefined>(undefined);
  const [dataError, setDataError] = useState<string | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      setData(await api.getData());
      setDataError(undefined);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setSession({ kind: "anon" });
        setData(undefined);
      } else {
        setDataError(err instanceof Error ? err.message : String(err));
      }
    }
  }, []);

  // Restore an existing session on startup.
  useEffect(() => {
    let cancelled = false;
    void api
      .me()
      .then((user) => {
        if (cancelled) return;
        setSession({ kind: "authed", user });
      })
      .catch(() => {
        if (!cancelled) setSession({ kind: "anon" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the user's data whenever a session becomes active.
  useEffect(() => {
    if (session.kind === "authed") void refresh();
  }, [session, refresh]);

  const signIn = useCallback((user: PublicUser) => {
    setSession({ kind: "authed", user });
  }, []);

  const signOut = useCallback(async () => {
    await api.logout().catch(() => {});
    setSession({ kind: "anon" });
    setData(undefined);
  }, []);

  const patch = useCallback(async (p: Partial<UserData>) => {
    const next = await api.patchData(p);
    setData(next);
  }, []);

  const value = useMemo<AppState>(
    () => ({ session, data, dataError, signIn, signOut, refresh, patch }),
    [session, data, dataError, signIn, signOut, refresh, patch],
  );

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error("useAppState must be used inside <AppStateProvider>");
  return ctx;
}

/** Convenience for screens that are only rendered once data exists. */
export function useUserData(): {
  readonly user: PublicUser;
  readonly data: UserData;
  readonly patch: AppState["patch"];
  readonly refresh: AppState["refresh"];
} {
  const { session, data, patch, refresh } = useAppState();
  if (session.kind !== "authed" || !data) throw new Error("Screen rendered without data");
  return { user: session.user, data, patch, refresh };
}
