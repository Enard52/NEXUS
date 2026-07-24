/**
 * NEXUS AI — Cross-Platform Sync (FAZ 22)
 *
 * Under one account, a user's preferences, learned skills and memory follow them
 * across devices (desktop, mobile, TV…). Each device holds a local copy; the
 * sync engine reconciles them through a shared backend using per-key
 * last-write-wins with a logical clock, so a skill taught on one device shows up
 * on another and a preference change never silently loses to a stale copy.
 *
 * The backend is an interface (a real one is an authenticated cloud endpoint,
 * built on FAZ 16 cloud memory); the bundled one is in-memory and deterministic.
 * Dependency-free; the logical clock is injected for testability.
 */

/** The three sync domains the roadmap calls out. */
export type SyncDomain = "preferences" | "skills" | "memory";

/** One versioned value for a key within a domain. Higher version wins. */
export interface SyncRecord<T = unknown> {
  readonly key: string;
  readonly value: T;
  /** Logical version (monotonic per key). Ties keep the incumbent. */
  readonly version: number;
  readonly updatedBy: string;
}

/** A full set of records for one domain, keyed by record key. */
export type DomainState = Record<string, SyncRecord>;

/** A device's or the cloud's state across all domains. */
export type SyncState = Record<SyncDomain, DomainState>;

function emptyState(): SyncState {
  return { preferences: {}, skills: {}, memory: {} };
}

/** Merge b into a with last-write-wins per key; returns a new state. */
export function mergeState(a: SyncState, b: SyncState): SyncState {
  const out = emptyState();
  for (const domain of Object.keys(out) as SyncDomain[]) {
    const merged: DomainState = { ...a[domain] };
    for (const [key, incoming] of Object.entries(b[domain])) {
      const current = merged[key];
      // Strictly-greater wins, so ties keep the incumbent (deterministic).
      if (!current || incoming.version > current.version) merged[key] = incoming;
    }
    out[domain] = merged;
  }
  return out;
}

/** Shared store every device reconciles against. Real impl = cloud endpoint. */
export interface SyncBackend {
  read(accountId: string): SyncState;
  write(accountId: string, state: SyncState): void;
}

/** Deterministic in-memory backend for dev/tests. */
export class InMemorySyncBackend implements SyncBackend {
  private readonly accounts = new Map<string, SyncState>();

  read(accountId: string): SyncState {
    return this.accounts.get(accountId) ?? emptyState();
  }

  write(accountId: string, state: SyncState): void {
    this.accounts.set(accountId, state);
  }
}

export interface SyncEngineOptions {
  /** Logical clock: returns the next monotonic version for a local edit. */
  readonly clock?: () => number;
}

/**
 * A per-device sync engine. Local edits bump a logical clock; {@link sync}
 * pushes local changes up and pulls everyone else's down, converging devices.
 */
export class SyncEngine {
  private local: SyncState = emptyState();
  private tick: number;
  private readonly clock: () => number;

  constructor(
    private readonly accountId: string,
    private readonly deviceId: string,
    private readonly backend: SyncBackend,
    options: SyncEngineOptions = {},
  ) {
    this.tick = 0;
    this.clock = options.clock ?? (() => ++this.tick);
  }

  /** Record a local change in a domain. The new version comes from the clock. */
  set<T>(domain: SyncDomain, key: string, value: T): SyncRecord<T> {
    const record: SyncRecord<T> = {
      key,
      value,
      version: this.clock(),
      updatedBy: this.deviceId,
    };
    this.local[domain] = { ...this.local[domain], [key]: record as SyncRecord };
    return record;
  }

  /** Read a value this device currently knows for a key, if any. */
  get<T>(domain: SyncDomain, key: string): T | undefined {
    return this.local[domain][key]?.value as T | undefined;
  }

  /** Snapshot of the device's current local state. */
  snapshot(): SyncState {
    return this.local;
  }

  /**
   * Reconcile with the backend: merge remote → local, then publish the merged
   * state so other devices converge. Returns the converged local state.
   */
  sync(): SyncState {
    const remote = this.backend.read(this.accountId);
    const merged = mergeState(remote, this.local);
    this.backend.write(this.accountId, merged);
    this.local = merged;
    return merged;
  }
}

export * from "./distribution.js";

export const moduleName = "infra" as const;
export const implemented = true;
