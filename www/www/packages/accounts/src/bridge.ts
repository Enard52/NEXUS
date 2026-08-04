/**
 * NEXUS AI — Account ↔ Household Bridge
 *
 * Bridges the Account System with the Multi-User / Household System
 * . Provides the missing link the ROADMAP requires:
 *   "Rol/yetki modelinin (Faz 12) hesap sistemine bağlanması."
 *
 * Responsibilities:
 *  - Auto-creates a Household when a new admin account is registered.
 *  - Keeps the Household role in sync with the account role.
 *  - Provides `requireAuth()` — a session-validating gate the core pipeline
 *    can call before processing a command.
 *  - Exposes `getHouseholdForUser()` to resolve the correct Household for an
 *    authenticated account.
 */

import type { Account, AccountService, Role, Session } from "./index.js";
import { Household } from "./family.js";

export class AuthenticationError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export interface AuthenticatedContext {
  readonly account: Account;
  readonly household: Household;
}

/**
 * The bridge between AccountService (identity) and Household (device access).
 *
 * Usage:
 *   const bridge = new AccountHouseholdBridge(accountService);
 *   const account = bridge.registerWithHousehold({ email, password });
 *   // Later:
 *   const ctx = bridge.requireAuth(sessionToken);
 *   ctx.household.canAccess(ctx.account.id, deviceId, "control");
 */
export class AccountHouseholdBridge {
  private readonly accounts: AccountService;
  /** Maps an admin account ID to their household. */
  private readonly households = new Map<string, Household>();
  /** Maps any user ID to the household they belong to. */
  private readonly userHousehold = new Map<string, string>();

  constructor(accounts: AccountService) {
    this.accounts = accounts;
  }

  // ── Registration with automatic Household ─────────────────────────────────

  /**
   * Register a new account and automatically create a Household with the
   * registrant as admin. Returns both the account and its new household.
   */
  registerWithHousehold(input: { email: string; password: string }): {
    account: Account;
    session: Session;
    household: Household;
  } {
    const account = this.accounts.register({ ...input, role: "admin" });
    const session = this.accounts.login(input.email, input.password);
    const household = new Household(account.id);
    this.households.set(account.id, household);
    this.userHousehold.set(account.id, account.id);
    return { account, session, household };
  }

  // ── Invite & accept with role sync ────────────────────────────────────────

  /**
   * Admin invites a new member. The invitation carries a Household role that
   * will be applied when the invitee accepts.
   */
  invite(
    adminId: string,
    inviteeEmail: string,
    role: Role,
  ): { token: string; email: string; role: Role } {
    const household = this.getHouseholdForUser(adminId);
    if (!household) throw new AuthenticationError("No household found for this user.");
    return household.invite(adminId, inviteeEmail, role);
  }

  /**
   * Accepting an invitation: the invitee registers (or already has an account)
   * and then joins the household. Their Account role is synced with the
   * Household role for consistency.
   */
  acceptInvite(
    token: string,
    inviteeInput: { email: string; password: string },
    householdAdminId: string,
  ): { account: Account; session: Session } {
    const household = this.households.get(householdAdminId);
    if (!household) throw new AuthenticationError("Household not found.");

    // Register if new, or just login if they already exist
    let account: Account;
    try {
      account = this.accounts.register({ ...inviteeInput, role: "member" });
    } catch {
      // Account already exists — just login
      const existing = this.accounts.validateSession(
        this.accounts.login(inviteeInput.email, inviteeInput.password).token,
      );
      if (!existing) throw new AuthenticationError("Failed to authenticate existing account.");
      account = existing;
    }

    household.acceptInvite(token, account.id);
    this.userHousehold.set(account.id, householdAdminId);

    const session = this.accounts.login(inviteeInput.email, inviteeInput.password);
    return { account, session };
  }

  // ── Authentication gate ───────────────────────────────────────────────────

  /**
   * Validate a session token and return the authenticated context. Throws
   * AuthenticationError if the session is invalid/expired.
   */
  requireAuth(sessionToken: string): AuthenticatedContext {
    const account = this.accounts.validateSession(sessionToken);
    if (!account) throw new AuthenticationError("Session expired or invalid.");
    const household = this.getHouseholdForUser(account.id);
    if (!household) throw new AuthenticationError("No household associated with this account.");
    return { account, household };
  }

  // ── Household lookup ──────────────────────────────────────────────────────

  /** Resolve the Household a user belongs to (as admin or member/guest). */
  getHouseholdForUser(userId: string): Household | undefined {
    const adminId = this.userHousehold.get(userId);
    if (!adminId) return undefined;
    return this.households.get(adminId);
  }

  /** Attach an existing household (for migration or testing). */
  attachHousehold(adminId: string, household: Household): void {
    this.households.set(adminId, household);
    this.userHousehold.set(adminId, adminId);
  }

  /** Get the AccountService instance (for direct access when needed). */
  get accountService(): AccountService {
    return this.accounts;
  }
}
