/**
 * NEXUS AI — Cloud Memory (FAZ 16)
 *
 * Moves user memory (personalization + recent turns) off a single device into a
 * portable, versioned snapshot that a cloud backend can store and serve. This is
 * the prerequisite for cross-device sync (FAZ 22): a device pushes its snapshot
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
