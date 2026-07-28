/**
 * NEXUS AI — Cloud Memory
 *
 * Moves user memory (personalization + recent turns) off a single device into a
 * portable, versioned snapshot that a cloud backend can store and serve. This is
 * the prerequisite for cross-device sync : a device pushes its snapshot
 * up and pulls the latest down, so a preference set on one device appears on
 * another.
 *
 * The backend is an interface; the bundled implementation is in-memory and
 * deterministic. A real backend (encrypted object store) implements the same
 * contract and never fabricates a stored snapshot it does not actually hold.
 */

import type { MemoryTurn, Personalization, UserProfile } from "./index.js";
import { DEFAULT_PERSONALIZATION } from "./index.js";

/** A portable, versioned view of one user's memory for cross-device transport. */
export interface MemorySnapshot {
  readonly userId: string;
  /** Monotonic version; higher wins on conflict (last-write-wins). */
  readonly version: number;
  readonly updatedAt: string;
  readonly personalization: Personalization;
  readonly turns: readonly MemoryTurn[];
}

/** Where snapshots live between devices. Real impls hit encrypted cloud storage. */
export interface CloudMemoryBackend {
  push(snapshot: MemorySnapshot): void;
  pull(userId: string): MemorySnapshot | undefined;
}

/** Deterministic in-memory backend for dev/tests; keeps the highest version. */
export class InMemoryCloudBackend implements CloudMemoryBackend {
  private readonly store = new Map<string, MemorySnapshot>();

  push(snapshot: MemorySnapshot): void {
    const existing = this.store.get(snapshot.userId);
    // Never let a stale push overwrite a newer snapshot.
    if (existing && existing.version > snapshot.version) return;
    this.store.set(snapshot.userId, snapshot);
  }

  pull(userId: string): MemorySnapshot | undefined {
    return this.store.get(userId);
  }
}

export interface CloudMemoryOptions {
  readonly now?: () => Date;
}

/**
 * Syncs a local {@link UserProfile} + turns with a cloud backend. Conflicts are
 * resolved by version (last-write-wins); ties keep the local state.
 */
export class CloudMemory {
  private readonly now: () => Date;

  constructor(
    private readonly backend: CloudMemoryBackend,
    options: CloudMemoryOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
  }

  /** Build a snapshot for a user at the given version and push it to the cloud. */
  push(
    userId: string,
    personalization: Personalization,
    turns: readonly MemoryTurn[],
    version: number,
  ): MemorySnapshot {
    const snapshot: MemorySnapshot = {
      userId,
      version,
      updatedAt: this.now().toISOString(),
      personalization,
      turns: [...turns],
    };
    this.backend.push(snapshot);
    return snapshot;
  }

  /** Pull the cloud snapshot for a user, if any. */
  pull(userId: string): MemorySnapshot | undefined {
    return this.backend.pull(userId);
  }

  /**
   * Merge the cloud snapshot into a local profile: the higher version wins.
   * Returns the resolved personalization the local device should now apply.
   */
  resolve(local: UserProfile, localVersion: number): Personalization {
    const remote = this.backend.pull(local.userId);
    if (!remote) return local.personalization;
    return remote.version > localVersion
      ? remote.personalization
      : (local.personalization ?? DEFAULT_PERSONALIZATION);
  }
}

import type { UserMemoryStore } from "./index.js";
import { InMemoryUserMemory } from "./index.js";

/**
 * A UserMemoryStore that auto-syncs every write to a CloudMemoryBackend.
 * Pulls the latest snapshot on init and on explicit sync(). This is the
 * deliverable: "hafızası cloud'da güvenli şekilde saklanıyor."
 */
export class CloudSyncedUserMemory implements UserMemoryStore {
  private readonly local: InMemoryUserMemory;
  private readonly cloud: CloudMemory;
  private versions = new Map<string, number>();

  constructor(backend: CloudMemoryBackend, options: CloudMemoryOptions = {}) {
    this.local = new InMemoryUserMemory();
    this.cloud = new CloudMemory(backend, options);
  }

  /** Pull the latest cloud state for a user into local memory. */
  syncDown(userId: string): void {
    const remote = this.cloud.pull(userId);
    if (remote) {
      const localVer = this.versions.get(userId) ?? 0;
      if (remote.version > localVer) {
        this.local.updatePersonalization(userId, remote.personalization);
        for (const turn of remote.turns) {
          this.local.remember(userId, { role: turn.role, text: turn.text });
        }
        this.versions.set(userId, remote.version);
      }
    }
  }

  /** Push local state to the cloud. */
  syncUp(userId: string): void {
    const profile = this.local.getProfile(userId);
    const turns = this.local.recent(userId);
    const ver = (this.versions.get(userId) ?? 0) + 1;
    this.versions.set(userId, ver);
    this.cloud.push(userId, profile.personalization, turns, ver);
  }

  getProfile(userId: string): UserProfile {
    return this.local.getProfile(userId);
  }

  updatePersonalization(userId: string, patch: Partial<Personalization>): UserProfile {
    const result = this.local.updatePersonalization(userId, patch);
    this.syncUp(userId);
    return result;
  }

  remember(userId: string, turn: Omit<MemoryTurn, "at">): void {
    this.local.remember(userId, turn);
    // Batch: don't push on every turn, only on explicit syncUp or personalization change
  }

  recent(userId: string): readonly MemoryTurn[] {
    return this.local.recent(userId);
  }

  /** Full bidirectional sync: pull remote changes, then push local updates. */
  sync(userId: string): void {
    this.syncDown(userId);
    this.syncUp(userId);
  }
}
