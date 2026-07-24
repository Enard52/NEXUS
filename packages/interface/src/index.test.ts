import { describe, expect, it } from "vitest";
import {
  buildBillingModel,
  buildDeviceListModel,
  buildFamilyModel,
  buildHomeStateModel,
  buildNavigation,
  buildPersonalizationModel,
  buildSkillsModel,
  buildSuggestionsModel,
  buildTodayModel,
  canAccess,
  getScreen,
  InterfaceError,
  moduleName,
  themeFor,
  SCREENS,
  type NavContext,
} from "./index.js";

describe("@nexus/interface", () => {
  it("exposes its module identity", () => {
    expect(moduleName).toBe("interface");
  });

  it("catalogs every FAZ 10 main screen", () => {
    const ids = SCREENS.map((s) => s.id);
    expect(ids).toContain("today");
    expect(ids).toContain("devices");
    expect(ids).toContain("billing");
    expect(ids).toContain("family");
    expect(ids).toContain("download-center");
  });

  it("uses i18n title keys, never literal copy", () => {
    for (const s of SCREENS) expect(s.titleKey.startsWith("screen.")).toBe(true);
  });

  it("hides auth screens from anonymous visitors but keeps the download center", () => {
    const anon: NavContext = { authenticated: false, plan: "free", role: "guest" };
    const nav = buildNavigation(anon).map((s) => s.id);
    expect(nav).toEqual(["download-center"]);
  });

  it("gates the family screen behind the family plan and admin role", () => {
    const family = getScreen("family");
    expect(canAccess(family, { authenticated: true, plan: "premium", role: "admin" })).toBe(false);
    expect(canAccess(family, { authenticated: true, plan: "family", role: "member" })).toBe(false);
    expect(canAccess(family, { authenticated: true, plan: "family", role: "admin" })).toBe(true);
  });

  it("builds a device-list model with online counts and empty state", () => {
    const empty = buildDeviceListModel([]);
    expect(empty.onlineCount).toBe(0);
    expect(empty.emptyStateKey).toBe("screen.devices.empty");

    const model = buildDeviceListModel([
      { id: "a", nameKey: "device.lamp", online: true },
      { id: "b", nameKey: "device.tv", online: false },
    ]);
    expect(model.onlineCount).toBe(1);
    expect(model.emptyStateKey).toBeUndefined();
  });

  it("builds a billing model that reflects upgrade eligibility", () => {
    expect(buildBillingModel("free").canUpgrade).toBe(true);
    expect(buildBillingModel("family").canUpgrade).toBe(false);
    expect(buildBillingModel("premium").planLabelKey).toBe("plan.premium");
  });

  it("builds a personalization model from user memory data", () => {
    const model = buildPersonalizationModel({
      assistantName: "Nova",
      userAddress: "Ensar",
      language: "tr",
    });
    expect(model.assistantName).toBe("Nova");
    expect(model.language).toBe("tr");
  });

  it("resolves brand design tokens for rendering", () => {
    expect(themeFor("dark").color.bg).toBe("#0a0a0b");
    expect(themeFor("light").color.bg).toBe("#f8f9fa");
  });

  it("composes a Today model from live home signals", () => {
    const model = buildTodayModel({
      devicesOnline: 4,
      devicesTotal: 6,
      energyWhToday: 2720,
      activeRoutines: 3,
      pendingSuggestions: 2,
    });
    expect(model.titleKey).toBe("screen.today");
    const value = (key: string) => model.cards.find((c) => c.labelKey === key)?.value;
    expect(value("today.devicesOnline")).toBe("4/6");
    expect(value("today.energy")).toBe("2.72 kWh");
    expect(value("today.activeRoutines")).toBe("3");
    expect(model.hasNudge).toBe(true);
  });

  it("drops the nudge when there is nothing pending", () => {
    const model = buildTodayModel({
      devicesOnline: 0,
      devicesTotal: 0,
      energyWhToday: 0,
      activeRoutines: 0,
      pendingSuggestions: 0,
    });
    expect(model.hasNudge).toBe(false);
    expect(model.cards.find((c) => c.labelKey === "today.energy")?.value).toBe("0.00 kWh");
  });

  it("builds a suggestions model with an empty state", () => {
    expect(buildSuggestionsModel([]).emptyStateKey).toBe("screen.suggestions.empty");
    const model = buildSuggestionsModel([{ id: "s1", textKey: "Evening lights", at: "19:00" }]);
    expect(model.rows).toHaveLength(1);
    expect(model.emptyStateKey).toBeUndefined();
  });

  it("orders skills by usage, most-used first", () => {
    const model = buildSkillsModel([
      { id: "a", nameKey: "skill.a", usageCount: 2 },
      { id: "b", nameKey: "skill.b", usageCount: 9 },
    ]);
    expect(model.rows[0].id).toBe("b");
  });

  it("counts admins in the family model", () => {
    const model = buildFamilyModel([
      { id: "1", nameKey: "Ensar", role: "admin" },
      { id: "2", nameKey: "Guest", role: "guest" },
    ]);
    expect(model.adminCount).toBe(1);
    expect(model.members).toHaveLength(2);
  });

  it("groups devices by room, alphabetically, with online counts", () => {
    const model = buildHomeStateModel([
      { room: "living", online: true },
      { room: "living", online: false },
      { room: "bedroom", online: true },
    ]);
    expect(model.rooms.map((r) => r.room)).toEqual(["bedroom", "living"]);
    const living = model.rooms.find((r) => r.room === "living")!;
    expect(living.total).toBe(2);
    expect(living.online).toBe(1);
  });

  it("throws on unknown screens", () => {
    // @ts-expect-error deliberately invalid screen id
    expect(() => getScreen("does-not-exist")).toThrow(InterfaceError);
  });
});
