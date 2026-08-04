import { describe, expect, it } from "vitest";
import { AccountService, AccountHouseholdBridge, AuthenticationError } from "./index.js";

const ADMIN_CRED = { email: "admin@example.com", password: "SuperSecret1!" };
const MEMBER_CRED = { email: "member@example.com", password: "MemberPass1!" };
const GUEST_CRED = { email: "guest@example.com", password: "GuestPass12!" };

describe("AccountHouseholdBridge (FAZ 14 ↔ FAZ 12)", () => {
  function makeBridge() {
    const accounts = new AccountService();
    return new AccountHouseholdBridge(accounts);
  }

  it("registerWithHousehold creates an admin account + household in one step", () => {
    const bridge = makeBridge();
    const { account, session, household } = bridge.registerWithHousehold(ADMIN_CRED);

    expect(account.email).toBe(ADMIN_CRED.email);
    expect(account.role).toBe("admin");
    expect(session.token).toBeTruthy();
    expect(household.getRole(account.id)).toBe("admin");
    expect(household.listMembers()).toHaveLength(1);
  });

  it("requireAuth returns the authenticated context with the correct household", () => {
    const bridge = makeBridge();
    const { session, account } = bridge.registerWithHousehold(ADMIN_CRED);

    const ctx = bridge.requireAuth(session.token);
    expect(ctx.account.id).toBe(account.id);
    expect(ctx.household.getRole(account.id)).toBe("admin");
  });

  it("requireAuth throws AuthenticationError for invalid session", () => {
    const bridge = makeBridge();
    expect(() => bridge.requireAuth("bogus-token")).toThrow(AuthenticationError);
  });

  it("invite + acceptInvite registers a member and joins the household", () => {
    const bridge = makeBridge();
    const { account: admin } = bridge.registerWithHousehold(ADMIN_CRED);

    const invitation = bridge.invite(admin.id, MEMBER_CRED.email, "member");
    expect(invitation.role).toBe("member");

    const { account: member, session } = bridge.acceptInvite(
      invitation.token,
      MEMBER_CRED,
      admin.id,
    );

    expect(member.email).toBe(MEMBER_CRED.email);
    expect(member.role).toBe("member");

    // The member is now in the household
    const ctx = bridge.requireAuth(session.token);
    expect(ctx.household.getRole(member.id)).toBe("member");
    expect(ctx.household.listMembers()).toHaveLength(2);
  });

  it("full flow: admin registers → invites member & guest → device access gated correctly", () => {
    const bridge = makeBridge();
    const { account: admin } = bridge.registerWithHousehold(ADMIN_CRED);

    // Invite a member
    const memberInvite = bridge.invite(admin.id, MEMBER_CRED.email, "member");
    const { account: member } = bridge.acceptInvite(memberInvite.token, MEMBER_CRED, admin.id);

    // Invite a guest
    const guestInvite = bridge.invite(admin.id, GUEST_CRED.email, "guest");
    const { account: guest } = bridge.acceptInvite(guestInvite.token, GUEST_CRED, admin.id);

    const household = bridge.getHouseholdForUser(admin.id)!;
    expect(household.listMembers()).toHaveLength(3);

    // Admin can manage devices
    expect(household.canAccess(admin.id, "dev-1", "manage")).toBe(true);
    // Member can control but not manage
    expect(household.canAccess(member.id, "dev-1", "control")).toBe(true);
    expect(household.canAccess(member.id, "dev-1", "manage")).toBe(false);
    // Guest can only view
    expect(household.canAccess(guest.id, "dev-1", "view")).toBe(true);
    expect(household.canAccess(guest.id, "dev-1", "control")).toBe(false);
  });

  it("multi-device login: same admin can authenticate from multiple sessions", () => {
    const bridge = makeBridge();
    const { account } = bridge.registerWithHousehold(ADMIN_CRED);

    // Login from a second device
    const s2 = bridge.accountService.login(ADMIN_CRED.email, ADMIN_CRED.password);
    const s3 = bridge.accountService.login(ADMIN_CRED.email, ADMIN_CRED.password);

    // Both sessions resolve to the same account and household
    const ctx2 = bridge.requireAuth(s2.token);
    const ctx3 = bridge.requireAuth(s3.token);
    expect(ctx2.account.id).toBe(account.id);
    expect(ctx3.account.id).toBe(account.id);
    expect(ctx2.household.getRole(account.id)).toBe("admin");
  });

  it("account deletion removes access from the household bridge", () => {
    const bridge = makeBridge();
    const { account, session } = bridge.registerWithHousehold(ADMIN_CRED);

    // Delete the account via AccountService
    bridge.accountService.deleteAccount(account.id);

    // Session is no longer valid → requireAuth fails
    expect(() => bridge.requireAuth(session.token)).toThrow(AuthenticationError);
  });
});
