/**
 * NEXUS AI — Typed API client
 *
 * Single gateway between the React app and the real sync-server endpoints.
 * Two transports, chosen automatically:
 *   • Same-origin (web /app, desktop shell): cookie sessions, relative URLs.
 *   • Native mobile (Capacitor): the user pairs with their Local Core over the
 *     LAN; the base URL is persisted and the session rides an Authorization
 *     bearer header because cookies do not cross the native-app origin.
 */

export interface PublicUser {
  readonly id: string;
  readonly email: string;
  readonly role: "admin" | "member" | "guest";
}

export interface UserDevice {
  readonly id: string;
  readonly name: string;
  readonly room: string;
  readonly online: boolean;
}

export interface UserRoutine {
  readonly id: string;
  readonly name: string;
  readonly usageCount: number;
}

export interface UserSuggestion {
  readonly id: string;
  readonly text: string;
  readonly at: string;
}

export interface UserFamilyMember {
  readonly id: string;
  readonly name: string;
  readonly role: "admin" | "member" | "guest";
}

export interface UserData {
  readonly plan: "free" | "premium" | "family";
  readonly assistantName: string;
  readonly displayName: string;
  readonly language: string;
  readonly energyWhToday: number;
  readonly devices: readonly UserDevice[];
  readonly routines: readonly UserRoutine[];
  readonly suggestions: readonly UserSuggestion[];
  readonly family: readonly UserFamilyMember[];
}

export interface PlanStep {
  readonly action: string;
  readonly params?: Record<string, unknown>;
}

/** Mirror of the core pipeline's NexusResponse — what /api/command returns. */
export interface CommandResponse {
  readonly text: string;
  readonly intent: string;
  readonly agent: string;
  readonly executed: readonly PlanStep[];
  readonly pending: readonly PlanStep[];
  readonly denied?: readonly PlanStep[];
}

export interface StoreItem {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly installed: boolean;
  readonly locked?: boolean;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const BASE_KEY = "nexus_server_url";
const TOKEN_KEY = "nexus_session_token";

/** True when running inside the Capacitor mobile shell (build-time flag). */
export const IS_MOBILE_BUILD = import.meta.env.MODE === "mobile";

export function getServerUrl(): string {
  return localStorage.getItem(BASE_KEY) ?? "";
}

export function setServerUrl(url: string): void {
  localStorage.setItem(BASE_KEY, url.replace(/\/+$/, ""));
}

function getToken(): string | undefined {
  return localStorage.getItem(TOKEN_KEY) ?? undefined;
}

function setToken(token: string | undefined): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** The mobile build needs a paired server before anything else can work. */
export function needsServerPairing(): boolean {
  return IS_MOBILE_BUILD && !getServerUrl();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = IS_MOBILE_BUILD ? getServerUrl() : "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (IS_MOBILE_BUILD && token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(base + path, { credentials: "same-origin", ...init, headers });
  } catch {
    throw new ApiError(0, "network");
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(
      res.status,
      typeof body.error === "string" ? body.error : `HTTP ${res.status}`,
    );
  }
  return body as T;
}

function post<T>(path: string, payload?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

interface AuthResponse {
  readonly user: PublicUser;
  readonly token?: string;
}

export const api = {
  /** Verify the paired server really is a NEXUS Local Core. */
  async probe(baseUrl: string): Promise<boolean> {
    try {
      const res = await fetch(baseUrl.replace(/\/+$/, "") + "/health");
      const body = (await res.json()) as { ok?: boolean; service?: string };
      return Boolean(body.ok && body.service === "nexus-local-core");
    } catch {
      return false;
    }
  },

  async register(email: string, password: string, fullName?: string): Promise<PublicUser> {
    const out = await post<AuthResponse>("/api/register", { email, password, fullName });
    setToken(out.token);
    return out.user;
  },

  async login(email: string, password: string): Promise<PublicUser> {
    const out = await post<AuthResponse>("/api/login", { email, password });
    setToken(out.token);
    return out.user;
  },

  async loginGuest(): Promise<PublicUser> {
    const out = await post<AuthResponse>("/api/guest");
    setToken(out.token);
    return out.user;
  },

  async logout(): Promise<void> {
    await post("/api/logout");
    setToken(undefined);
  },

  async me(): Promise<PublicUser> {
    const out = await request<{ user: PublicUser }>("/api/me");
    return out.user;
  },

  async getData(): Promise<UserData> {
    const out = await request<{ data: UserData }>("/api/data");
    return out.data;
  },

  async patchData(patch: Partial<UserData>): Promise<UserData> {
    const out = await request<{ data: UserData }>("/api/data", {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return out.data;
  },

  command(utterance: string): Promise<CommandResponse> {
    return post<CommandResponse>("/api/command", { utterance });
  },

  confirmCommand(utterance: string): Promise<CommandResponse> {
    return post<CommandResponse>("/api/command/confirm", { utterance });
  },

  acceptSuggestion(id: string): Promise<{ success: boolean }> {
    return post(`/api/suggestions/${encodeURIComponent(id)}/accept`);
  },

  dismissSuggestion(id: string): Promise<{ success: boolean }> {
    return post(`/api/suggestions/${encodeURIComponent(id)}/dismiss`);
  },

  subscribe(plan: "free" | "premium" | "family"): Promise<{ ok: boolean }> {
    return post("/api/billing/subscribe", { plan });
  },

  cancelSubscription(): Promise<{ ok: boolean }> {
    return post("/api/billing/cancel");
  },

  async storeCatalog(): Promise<readonly StoreItem[]> {
    const out = await request<{ catalog: readonly StoreItem[] }>("/api/store/catalog");
    return out.catalog;
  },

  storeInstall(id: string): Promise<{ ok: boolean }> {
    return post(`/api/store/${encodeURIComponent(id)}/install`);
  },

  storeUninstall(id: string): Promise<{ ok: boolean }> {
    return post(`/api/store/${encodeURIComponent(id)}/uninstall`);
  },

  platformInfo(): Promise<Record<string, unknown>> {
    return request("/api/platform/info");
  },
};
