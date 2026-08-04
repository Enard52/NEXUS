/**
 * NEXUS AI — Per-user application data
 *
 * Every signed-in user owns a private, durable record: their devices, routines,
 * suggestions, household and personalization. It is stored in the same
 * {@link KeyValueStore} that backs accounts, so it survives restarts and syncs
 * across every surface (web, desktop, mobile) that talks to this server.
 *
 * A brand-new account starts *empty* on purpose — there is no decorative or
 * fake data. The dashboard renders exactly what the user actually has, using
 * the interface builders' first-class empty states.
 */

import type { KeyValueStore } from "@nexus/database";
import type { PlanId, Role } from "@nexus/interface";

/** A device the user has actually added to their home. */
export interface UserDevice {
  readonly id: string;
  readonly name: string;
  readonly room: string;
  readonly online: boolean;
}

/** A routine/skill the user has created, with real usage counts. */
export interface UserRoutine {
  readonly id: string;
  readonly name: string;
  readonly usageCount: number;
}

/** A pending proactive suggestion awaiting the user's decision. */
export interface UserSuggestion {
  readonly id: string;
  readonly text: string;
  readonly at: string;
}

/** A household member the user has invited. */
export interface UserFamilyMember {
  readonly id: string;
  readonly name: string;
  readonly role: Role;
}

/** The complete, private state for one signed-in user. */
export interface UserData {
  readonly plan: PlanId;
  readonly assistantName: string;
  /** How the assistant addresses the user (display name). */
  readonly displayName: string;
  readonly language: string;
  readonly energyWhToday: number;
  readonly devices: readonly UserDevice[];
  readonly routines: readonly UserRoutine[];
  readonly suggestions: readonly UserSuggestion[];
  readonly family: readonly UserFamilyMember[];
}

const K_USERDATA = "udata:"; // udata:<userId> -> UserData (JSON)

/** Derive a friendly display name from an email local-part (e.g. "ada.lovelace" → "Ada Lovelace"). */
export function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  const words = local
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return words.join(" ") || email;
}

/** The honest starting point for a new account: a real, empty home. */
export function defaultUserData(email: string, language: string, displayName?: string): UserData {
  return {
    plan: "free",
    assistantName: "NEXUS",
    displayName: displayName?.trim() || displayNameFromEmail(email),
    language,
    energyWhToday: 0,
    devices: [],
    routines: [],
    suggestions: [],
    family: [],
  };
}


/**
 * Durable per-user data, layered over the shared {@link KeyValueStore}. No
 * business rules here beyond persistence — the server composes view-models from
 * this via the @nexus/interface builders.
 */
export class UserDataStore {
  constructor(private readonly store: KeyValueStore) {}

  /** Read a user's data, or `undefined` if they have never been initialized. */
  get(userId: string): UserData | undefined {
    const raw = this.store.get(K_USERDATA + userId);
    return raw === undefined ? undefined : (JSON.parse(raw) as UserData);
  }

  /** Read a user's data, creating and persisting the empty default on first access. */
  ensure(userId: string, email: string, language: string, displayName?: string): UserData {
    const existing = this.get(userId);
    if (existing) return existing;
    const seeded = defaultUserData(email, language, displayName);
    this.set(userId, seeded);
    return seeded;
  }


  set(userId: string, data: UserData): void {
    this.store.set(K_USERDATA + userId, JSON.stringify(data));
  }

  /** Apply a partial patch to the user's data and persist the result. */
  patch(userId: string, email: string, language: string, patch: Partial<UserData>): UserData {
    const current = this.ensure(userId, email, language);
    const next: UserData = { ...current, ...patch };
    this.set(userId, next);
    return next;
  }

  delete(userId: string): void {
    this.store.delete(K_USERDATA + userId);
  }
}
