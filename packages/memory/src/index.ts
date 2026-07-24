/**
 * NEXUS AI — Memory (FAZ 1)
 *
 * Two concerns in FAZ 1:
 *  1. User Memory — durable personalization: what the user wants to be called,
 *     how the system should address them, tone and language. This is the single
 *     source of truth that every response reads from (Bitiş Kriteri: a change
 *     here is reflected immediately, everywhere).
 *  2. Short-term memory — a bounded, in-process ring buffer of recent turns.
 *
 * FAZ 6 deepens this (Digital Twin); FAZ 16 moves it to the cloud. The store is
 * an interface so those phases can swap the backend without touching callers.
 */

export type Tone = "formal" | "friendly" | "playful" | "concise";

/** How the system addresses the user and speaks back. */
export interface Personalization {
  /** What the user calls the system (wake name / nickname), e.g. "Nova". */
  readonly assistantName: string;
  /** How the system addresses the user, e.g. "Ensar" or "Captain". */
  readonly userAddress: string;
  readonly tone: Tone;
  /** BCP-47 language tag, e.g. "tr", "en-US". Drives i18n (FAZ 13) + TTS (FAZ 2). */
  readonly language: string;
}

export const DEFAULT_PERSONALIZATION: Personalization = {
  assistantName: "NEXUS",
  userAddress: "there",
  tone: "friendly",
  language: "en",
};

export interface UserProfile {
  readonly userId: string;
  readonly personalization: Personalization;
}

/** A single remembered interaction turn. */
export interface MemoryTurn {
  readonly role: "user" | "assistant";
  readonly text: string;
  readonly at: string;
}

export interface UserMemoryStore {
  getProfile(userId: string): UserProfile;
  /** Merge a partial personalization patch and return the updated profile. */
  updatePersonalization(userId: string, patch: Partial<Personalization>): UserProfile;
  remember(userId: string, turn: Omit<MemoryTurn, "at">): void;
  /** Most recent turns, newest last, capped by the store's window. */
  recent(userId: string): readonly MemoryTurn[];
}

/**
 * In-memory implementation for FAZ 1 dev mode. Deterministic and dependency-free.
 * Short-term memory is a per-user ring buffer of `windowSize` turns.
 */
export class InMemoryUserMemory implements UserMemoryStore {
  private readonly profiles = new Map<string, UserProfile>();
  private readonly turns = new Map<string, MemoryTurn[]>();
  private readonly windowSize: number;

  constructor(windowSize = 20) {
    this.windowSize = Math.max(1, windowSize);
  }

  getProfile(userId: string): UserProfile {
    let profile = this.profiles.get(userId);
    if (!profile) {
      profile = { userId, personalization: { ...DEFAULT_PERSONALIZATION } };
      this.profiles.set(userId, profile);
    }
    return profile;
  }

  updatePersonalization(userId: string, patch: Partial<Personalization>): UserProfile {
    const current = this.getProfile(userId);
    const updated: UserProfile = {
      userId,
      personalization: { ...current.personalization, ...patch },
    };
    this.profiles.set(userId, updated);
    return updated;
  }

  remember(userId: string, turn: Omit<MemoryTurn, "at">): void {
    const list = this.turns.get(userId) ?? [];
    list.push({ ...turn, at: new Date().toISOString() });
    while (list.length > this.windowSize) list.shift();
    this.turns.set(userId, list);
  }

  recent(userId: string): readonly MemoryTurn[] {
    return [...(this.turns.get(userId) ?? [])];
  }
}

export * from "./digital-twin.js";
export * from "./cloud.js";
export * from "./sqlite.js";

export const moduleName = "memory" as const;
export const implemented = true;
