import { describe, expect, it } from "vitest";
import { Household, HouseholdError } from "./family.js";

const ADMIN = "u-admin";
const MEMBER = "u-member";
const GUEST = "u-guest";

describe("Household roles & invitations (FAZ 12)", () => {
  it("creates the owner as admin and invites members with roles", () => {
    const house = new Household(ADMIN);
    expect(house.getRole(ADMIN)).toBe("admin");

    const invite = house.invite(ADMIN, "member@example.com", "member");
    house.acceptInvite(invite.token, MEMBER);
    expect(house.getRole(MEMBER)).toBe("member");
    expect(house.listMembers()).toHaveLength(2);
  });

  it("blocks non-admins from inviting", () => {
    const house = new Household(ADMIN);
    house.acceptInvite(house.invite(ADMIN, "m@e.com", "member").token, MEMBER);
    expect(() => house.invite(MEMBER, "x@e.com", "guest")).toThrow(HouseholdError);
  });

  it("rejects a reused invitation token", () => {
    const house = new Household(ADMIN);
    const invite = house.invite(ADMIN, "m@e.com", "member");
    house.acceptInvite(invite.token, MEMBER);
    expect(() => house.acceptInvite(invite.token, "u-other")).toThrow(HouseholdError);
  });
});

describe("Household device authorization (FAZ 12)", () => {
  function seeded() {
    const house = new Household(ADMIN);
    house.acceptInvite(house.invite(ADMIN, "m@e.com", "member").token, MEMBER);
    house.acceptInvite(house.invite(ADMIN, "g@e.com", "guest").token, GUEST);
    return house;
  }

  it("applies role baselines: guest views, member controls, admin manages", () => {
    const house = seeded();
    expect(house.canAccess(GUEST, "dev-1", "view")).toBe(true);
    expect(house.canAccess(GUEST, "dev-1", "control")).toBe(false);
    expect(house.canAccess(MEMBER, "dev-1", "control")).toBe(true);
    expect(house.canAccess(MEMBER, "dev-1", "manage")).toBe(false);
    expect(house.canAccess(ADMIN, "dev-1", "manage")).toBe(true);
  });

  it("honors an explicit per-device grant beyond the role baseline", () => {
    const house = seeded();
    house.grant(ADMIN, GUEST, "dev-1", "control");
    expect(house.canAccess(GUEST, "dev-1", "control")).toBe(true);
    // Grant is scoped to that device only.
    expect(house.canAccess(GUEST, "dev-2", "control")).toBe(false);
  });

  it("lets an explicit revoke override the role baseline", () => {
    const house = seeded();
    house.revoke(ADMIN, MEMBER, "dev-1", "control");
    expect(house.canAccess(MEMBER, "dev-1", "control")).toBe(false);
    expect(house.canAccess(MEMBER, "dev-2", "control")).toBe(true);
  });

  it("denies unknown users entirely", () => {
    const house = seeded();
    expect(house.canAccess("stranger", "dev-1", "view")).toBe(false);
  });
});
