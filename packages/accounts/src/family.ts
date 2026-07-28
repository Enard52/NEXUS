/**
 * NEXUS AI — Multi-User & Family System
 *
 * A household owner (admin) invites members and assigns per-member roles
 * (admin / member / guest). Access to a device is checked at two levels: the
 * role's baseline rights and any explicit per-device grant/revoke. Each member
 * keeps their own personalization independently (that lives in @nexus/memory);
 * here we own membership, invitations and device authorization.
 *
 * Dependency-free and deterministic. Reuses the Role model from the account
 * system so a household member maps directly onto an account role.
 */

import { randomBytes } from "node:crypto";
import type { Role } from "./index.js";

export type DeviceAction = "view" | "control" | "manage";

/** Baseline rights per role, before per-device overrides. */
const ROLE_RIGHTS: Record<Role, readonly DeviceAction[]> = {
  admin: ["view", "control", "manage"],
  member: ["view", "control"],
  guest: ["view"],
};

export interface Member {
  readonly userId: string;
  readonly role: Role;
}

export interface Invitation {
  readonly token: string;
  readonly email: string;
  readonly role: Role;
}

export class HouseholdError extends Error {}

export class Household {
  private readonly members = new Map<string, Member>();
  private readonly invites = new Map<string, Invitation>();
  /** userId -> deviceId -> explicit allow/deny of actions. */
  private readonly grants = new Map<string, Map<string, Set<DeviceAction>>>();
  private readonly revokes = new Map<string, Map<string, Set<DeviceAction>>>();

  constructor(adminUserId: string) {
    this.members.set(adminUserId, { userId: adminUserId, role: "admin" });
  }

  /** Only an admin may invite. Returns a single-use invitation token. */
  invite(byUserId: string, email: string, role: Role): Invitation {
    this.requireAdmin(byUserId);
    const invitation: Invitation = { token: randomBytes(12).toString("hex"), email, role };
    this.invites.set(invitation.token, invitation);
    return invitation;
  }

  /** Accept an invitation, binding it to the accepting account's userId. */
  acceptInvite(token: string, userId: string): Member {
    const invitation = this.invites.get(token);
    if (!invitation) throw new HouseholdError("Invitation is invalid or already used.");
    this.invites.delete(token);
    const member: Member = { userId, role: invitation.role };
    this.members.set(userId, member);
    return member;
  }

  listMembers(): readonly Member[] {
    return [...this.members.values()];
  }

  getRole(userId: string): Role | undefined {
    return this.members.get(userId)?.role;
  }

  /** Admin grants a specific device action to a member beyond their role. */
  grant(byUserId: string, userId: string, deviceId: string, action: DeviceAction): void {
    this.requireAdmin(byUserId);
    const perUser = this.grants.get(userId) ?? new Map<string, Set<DeviceAction>>();
    const perDevice = perUser.get(deviceId) ?? new Set<DeviceAction>();
    perDevice.add(action);
    perUser.set(deviceId, perDevice);
    this.grants.set(userId, perUser);
  }

  /** Admin revokes a specific device action from a member. */
  revoke(byUserId: string, userId: string, deviceId: string, action: DeviceAction): void {
    this.requireAdmin(byUserId);
    const perUser = this.revokes.get(userId) ?? new Map<string, Set<DeviceAction>>();
    const perDevice = perUser.get(deviceId) ?? new Set<DeviceAction>();
    perDevice.add(action);
    perUser.set(deviceId, perDevice);
    this.revokes.set(userId, perUser);
  }

  /** Effective authorization: explicit revoke wins, then grant, then role baseline. */
  canAccess(userId: string, deviceId: string, action: DeviceAction): boolean {
    const member = this.members.get(userId);
    if (!member) return false;

    if (this.revokes.get(userId)?.get(deviceId)?.has(action)) return false;
    if (this.grants.get(userId)?.get(deviceId)?.has(action)) return true;
    return ROLE_RIGHTS[member.role].includes(action);
  }

  private requireAdmin(userId: string): void {
    if (this.members.get(userId)?.role !== "admin") {
      throw new HouseholdError("Only an admin can perform this action.");
    }
  }
}
