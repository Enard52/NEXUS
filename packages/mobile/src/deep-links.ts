/**
 * NEXUS AI — Deep Links & Universal Links
 *
 * Handles incoming deep links (nexus:// custom scheme) and Universal Links
 * (https://nexus.ai/...) — maps URLs to NEXUS intents and navigation targets.
 *
 * URL Scheme:
 *   nexus://intent/{text}        → Process as natural language intent
 *   nexus://device/{id}/command  → Direct device command
 *   nexus://scene/{name}        → Activate a scene
 *   nexus://screen/{screenId}   → Navigate to a screen
 *   nexus://routine/{id}/run    → Execute a routine
 *   nexus://auth/callback       → OAuth callback
 *   nexus://pair/{code}         → Device pairing via QR code
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** Parsed deep link result. */
export interface DeepLinkResult {
  /** The original URL. */
  url: string;
  /** Whether the URL was successfully parsed. */
  valid: boolean;
  /** The action category. */
  action: DeepLinkAction;
  /** Extracted parameters. */
  params: Record<string, string>;
  /** Generated NEXUS intent string (if applicable). */
  intent: string | null;
  /** Target screen to navigate to (if applicable). */
  screen: string | null;
}

/** Supported deep link actions. */
export type DeepLinkAction =
  | "intent"
  | "device-command"
  | "scene"
  | "screen"
  | "routine"
  | "auth-callback"
  | "pair"
  | "unknown";

/** Deep link handler callback. */
export type DeepLinkHandler = (result: DeepLinkResult) => void;

/** Route definition for deep link matching. */
interface DeepLinkRoute {
  pattern: RegExp;
  action: DeepLinkAction;
  extract: (match: RegExpMatchArray) => {
    params: Record<string, string>;
    intent: string | null;
    screen: string | null;
  };
}

// ─── Route Definitions ───────────────────────────────────────────────────────

const ROUTES: DeepLinkRoute[] = [
  {
    pattern: /^nexus:\/\/intent\/(.+)$/,
    action: "intent",
    extract: (m) => ({
      params: { text: decodeURIComponent(m[1]) },
      intent: decodeURIComponent(m[1]),
      screen: null,
    }),
  },
  {
    pattern: /^nexus:\/\/device\/([^/]+)\/(.+)$/,
    action: "device-command",
    extract: (m) => ({
      params: { deviceId: m[1], command: m[2] },
      intent: `${m[2]} device ${m[1]}`,
      screen: "devices",
    }),
  },
  {
    pattern: /^nexus:\/\/scene\/(.+)$/,
    action: "scene",
    extract: (m) => ({
      params: { name: decodeURIComponent(m[1]) },
      intent: `activate scene ${decodeURIComponent(m[1])}`,
      screen: "home-state",
    }),
  },
  {
    pattern: /^nexus:\/\/screen\/(.+)$/,
    action: "screen",
    extract: (m) => ({
      params: { screenId: m[1] },
      intent: null,
      screen: m[1],
    }),
  },
  {
    pattern: /^nexus:\/\/routine\/([^/]+)\/run$/,
    action: "routine",
    extract: (m) => ({
      params: { routineId: m[1] },
      intent: `run routine ${m[1]}`,
      screen: null,
    }),
  },
  {
    pattern: /^nexus:\/\/auth\/callback(\?.*)?$/,
    action: "auth-callback",
    extract: (m) => {
      const searchParams = new URLSearchParams(m[1]?.replace("?", "") ?? "");
      const params: Record<string, string> = {};
      searchParams.forEach((v, k) => {
        params[k] = v;
      });
      return { params, intent: null, screen: null };
    },
  },
  {
    pattern: /^nexus:\/\/pair\/(.+)$/,
    action: "pair",
    extract: (m) => ({
      params: { code: m[1] },
      intent: `pair device ${m[1]}`,
      screen: "devices",
    }),
  },
  // Universal Links (https://nexus.ai/...)
  {
    pattern: /^https:\/\/(?:www\.)?nexus\.ai\/open\/(.+)$/,
    action: "intent",
    extract: (m) => ({
      params: { text: decodeURIComponent(m[1]) },
      intent: decodeURIComponent(m[1]),
      screen: null,
    }),
  },
  {
    pattern: /^https:\/\/(?:www\.)?nexus\.ai\/device\/([^/]+)\/(.+)$/,
    action: "device-command",
    extract: (m) => ({
      params: { deviceId: m[1], command: m[2] },
      intent: `${m[2]} device ${m[1]}`,
      screen: "devices",
    }),
  },
];

// ─── Deep Link Router ────────────────────────────────────────────────────────

/**
 * DeepLinkRouter — parses incoming URLs and routes them to the appropriate
 * NEXUS handler (intent processing, navigation, device command, etc.).
 */
export class DeepLinkRouter {
  private handlers: DeepLinkHandler[] = [];
  private history: DeepLinkResult[] = [];

  /** Subscribe to deep link events. */
  onDeepLink(handler: DeepLinkHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  /** Parse a URL into a DeepLinkResult without dispatching. */
  parse(url: string): DeepLinkResult {
    for (const route of ROUTES) {
      const match = url.match(route.pattern);
      if (match) {
        const { params, intent, screen } = route.extract(match);
        return {
          url,
          valid: true,
          action: route.action,
          params,
          intent,
          screen,
        };
      }
    }

    return {
      url,
      valid: false,
      action: "unknown",
      params: {},
      intent: null,
      screen: null,
    };
  }

  /**
   * Handle an incoming deep link URL.
   * Parses it and dispatches to all registered handlers.
   */
  handle(url: string): DeepLinkResult {
    const result = this.parse(url);
    this.history.push(result);
    this.handlers.forEach((h) => h(result));
    return result;
  }

  /** Get the deep link history. */
  getHistory(): readonly DeepLinkResult[] {
    return this.history;
  }

  /** Get the last handled deep link. */
  get lastLink(): DeepLinkResult | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  /** Clear history. */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Generate a deep link URL for a given action.
   * Useful for creating shareable links or notification payloads.
   */
  static generateUrl(action: DeepLinkAction, params: Record<string, string>): string {
    switch (action) {
      case "intent":
        return `nexus://intent/${encodeURIComponent(params.text ?? "")}`;
      case "device-command":
        return `nexus://device/${params.deviceId}/${params.command}`;
      case "scene":
        return `nexus://scene/${encodeURIComponent(params.name ?? "")}`;
      case "screen":
        return `nexus://screen/${params.screenId}`;
      case "routine":
        return `nexus://routine/${params.routineId}/run`;
      case "pair":
        return `nexus://pair/${params.code}`;
      default:
        return `nexus://unknown`;
    }
  }
}
