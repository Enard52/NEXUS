/**
 * NEXUS AI — App shells & screens (FAZ 10)
 *
 * The application shell: the catalog of main screens from FAZ 10, i18n-ready
 * (screens carry title *keys*, never literal copy — FAZ 13 resolves them), and
 * navigation that respects auth, subscription plan (FAZ 15) and role (FAZ 12).
 *
 * View-model builders turn domain data (devices, subscription, personalization)
 * into render-ready screen state. They are pure and deterministic; the actual
 * pixels are drawn by the desktop/mobile front ends (FAZ 9) using these models
 * plus the design tokens (FAZ 10). No framework here — just the contract those
 * front ends consume, so the same screen state drives every platform.
 */

import { getTheme, type DesignTokens, type ThemeName } from "@nexus/design-system";

export type PlanId = "free" | "premium" | "family";
export type Role = "admin" | "member" | "guest";

/** The main screens listed in FAZ 10. */
export type ScreenId =
  | "today"
  | "home-state"
  | "suggestions"
  | "skills"
  | "family"
  | "devices"
  | "personalization"
  | "billing"
  | "download-center";

export interface ScreenDescriptor {
  readonly id: ScreenId;
  /** i18n key, resolved by FAZ 13 — never a hard-coded label. */
  readonly titleKey: string;
  /** Screen is only reachable after sign-in. */
  readonly requiresAuth: boolean;
  /** Minimum plan required to see the screen (omitted = all plans). */
  readonly minPlan?: PlanId;
  /** Roles allowed to open the screen (omitted = all roles). */
  readonly roles?: readonly Role[];
}

const PLAN_RANK: Record<PlanId, number> = { free: 0, premium: 1, family: 2 };

/** Single source of truth for the app's navigable screens. */
export const SCREENS: readonly ScreenDescriptor[] = [
  { id: "today", titleKey: "screen.today", requiresAuth: true },
  { id: "home-state", titleKey: "screen.homeState", requiresAuth: true },
  { id: "suggestions", titleKey: "screen.suggestions", requiresAuth: true },
  { id: "skills", titleKey: "screen.skills", requiresAuth: true },
  {
    id: "family",
    titleKey: "screen.family",
    requiresAuth: true,
    minPlan: "family",
    roles: ["admin"],
  },
  { id: "devices", titleKey: "screen.devices", requiresAuth: true },
  { id: "personalization", titleKey: "screen.personalization", requiresAuth: true },
  { id: "billing", titleKey: "screen.billing", requiresAuth: true, roles: ["admin"] },
  // The Download Center is the public marketing page — no auth (FAZ 10/18).
  { id: "download-center", titleKey: "screen.downloadCenter", requiresAuth: false },
];

export interface NavContext {
  readonly authenticated: boolean;
  readonly plan: PlanId;
  readonly role: Role;
}

/** True when the given context is allowed to see the screen. */
export function canAccess(screen: ScreenDescriptor, ctx: NavContext): boolean {
  if (screen.requiresAuth && !ctx.authenticated) return false;
  if (screen.minPlan && PLAN_RANK[ctx.plan] < PLAN_RANK[screen.minPlan]) return false;
  if (screen.roles && !screen.roles.includes(ctx.role)) return false;
  return true;
}

/** The ordered list of screens a given context should see in navigation. */
export function buildNavigation(ctx: NavContext): readonly ScreenDescriptor[] {
  return SCREENS.filter((s) => canAccess(s, ctx));
}

export function getScreen(id: ScreenId): ScreenDescriptor {
  const found = SCREENS.find((s) => s.id === id);
  if (!found) throw new InterfaceError(`Unknown screen "${id}"`);
  return found;
}

// ── View-model builders (domain data → render-ready screen state) ─────────────

export interface DeviceRow {
  readonly id: string;
  readonly nameKey: string;
  readonly online: boolean;
}

export interface DeviceListModel {
  readonly titleKey: string;
  readonly rows: readonly DeviceRow[];
  readonly onlineCount: number;
  readonly emptyStateKey?: string;
}

export function buildDeviceListModel(devices: readonly DeviceRow[]): DeviceListModel {
  const onlineCount = devices.filter((d) => d.online).length;
  return {
    titleKey: getScreen("devices").titleKey,
    rows: devices,
    onlineCount,
    emptyStateKey: devices.length === 0 ? "screen.devices.empty" : undefined,
  };
}

export interface BillingModel {
  readonly titleKey: string;
  readonly plan: PlanId;
  readonly planLabelKey: string;
  readonly canUpgrade: boolean;
  readonly manageActionKey: string;
}

export function buildBillingModel(plan: PlanId): BillingModel {
  return {
    titleKey: getScreen("billing").titleKey,
    plan,
    planLabelKey: `plan.${plan}`,
    canUpgrade: plan !== "family",
    manageActionKey: "billing.manage",
  };
}

export interface PersonalizationModel {
  readonly titleKey: string;
  readonly assistantName: string;
  readonly userAddress: string;
  readonly language: string;
  readonly avatarUrl?: string;
}

export function buildPersonalizationModel(input: {
  readonly assistantName: string;
  readonly userAddress: string;
  readonly language: string;
  readonly avatarUrl?: string;
}): PersonalizationModel {
  return {
    titleKey: getScreen("personalization").titleKey,
    assistantName: input.assistantName,
    userAddress: input.userAddress,
    language: input.language,
    avatarUrl: input.avatarUrl,
  };
}

export interface TodayInput {
  readonly devicesOnline: number;
  readonly devicesTotal: number;
  /** Whole-home energy today, watt-hours (from devices' summarizeUsage). */
  readonly energyWhToday: number;
  readonly activeRoutines: number;
  /** Proactive routine suggestions awaiting the user's decision. */
  readonly pendingSuggestions: number;
}

export interface TodayCard {
  readonly labelKey: string;
  readonly value: string;
}

export interface TodayModel {
  readonly titleKey: string;
  readonly cards: readonly TodayCard[];
  /** True when there is something the user should look at (a nudge dot). */
  readonly hasNudge: boolean;
}

/**
 * Compose the "Bugün" (Today) summary from live signals: device presence,
 * energy use, active routines and any proactive suggestions. Values are
 * formatted minimally here; full locale formatting is FAZ 13's job.
 */
export function buildTodayModel(input: TodayInput): TodayModel {
  const kwh = (input.energyWhToday / 1000).toFixed(2);
  return {
    titleKey: getScreen("today").titleKey,
    cards: [
      { labelKey: "today.devicesOnline", value: `${input.devicesOnline}/${input.devicesTotal}` },
      { labelKey: "today.energy", value: `${kwh} kWh` },
      { labelKey: "today.activeRoutines", value: String(input.activeRoutines) },
      { labelKey: "today.suggestions", value: String(input.pendingSuggestions) },
    ],
    hasNudge: input.pendingSuggestions > 0,
  };
}

export interface SuggestionRow {
  readonly id: string;
  /** i18n key or demo text describing the proposed automation. */
  readonly textKey: string;
  /** When the suggested routine would run, HH:MM. */
  readonly at: string;
}

export interface SuggestionsModel {
  readonly titleKey: string;
  readonly rows: readonly SuggestionRow[];
  readonly emptyStateKey?: string;
}

/** Pending proactive routine suggestions the user can accept or dismiss. */
export function buildSuggestionsModel(rows: readonly SuggestionRow[]): SuggestionsModel {
  return {
    titleKey: getScreen("suggestions").titleKey,
    rows,
    emptyStateKey: rows.length === 0 ? "screen.suggestions.empty" : undefined,
  };
}

export interface SkillRow {
  readonly id: string;
  readonly nameKey: string;
  /** How many times the skill has been used (drives ordering). */
  readonly usageCount: number;
}

export interface SkillsModel {
  readonly titleKey: string;
  /** Most-used skills first. */
  readonly rows: readonly SkillRow[];
  readonly emptyStateKey?: string;
}

export function buildSkillsModel(rows: readonly SkillRow[]): SkillsModel {
  const sorted = [...rows].sort((a, b) => b.usageCount - a.usageCount);
  return {
    titleKey: getScreen("skills").titleKey,
    rows: sorted,
    emptyStateKey: rows.length === 0 ? "screen.skills.empty" : undefined,
  };
}

export interface FamilyMemberRow {
  readonly id: string;
  readonly nameKey: string;
  readonly role: Role;
}

export interface FamilyModel {
  readonly titleKey: string;
  readonly members: readonly FamilyMemberRow[];
  readonly adminCount: number;
}

/** Household members and their roles (FAZ 12). Admins are surfaced for count. */
export function buildFamilyModel(members: readonly FamilyMemberRow[]): FamilyModel {
  return {
    titleKey: getScreen("family").titleKey,
    members,
    adminCount: members.filter((m) => m.role === "admin").length,
  };
}

export interface HomeDeviceInput {
  readonly room: string;
  readonly online: boolean;
}

export interface RoomSummary {
  readonly room: string;
  readonly total: number;
  readonly online: number;
}

export interface HomeStateModel {
  readonly titleKey: string;
  /** Rooms in alphabetical order, each with device presence counts. */
  readonly rooms: readonly RoomSummary[];
  readonly emptyStateKey?: string;
}

/** Group devices by room for the "Home" overview (FAZ 4/10). Deterministic. */
export function buildHomeStateModel(devices: readonly HomeDeviceInput[]): HomeStateModel {
  const byRoom = new Map<string, { total: number; online: number }>();
  for (const d of devices) {
    const entry = byRoom.get(d.room) ?? { total: 0, online: 0 };
    entry.total += 1;
    if (d.online) entry.online += 1;
    byRoom.set(d.room, entry);
  }
  const rooms: RoomSummary[] = [...byRoom.entries()]
    .map(([room, c]) => ({ room, total: c.total, online: c.online }))
    .sort((a, b) => a.room.localeCompare(b.room));
  return {
    titleKey: getScreen("home-state").titleKey,
    rooms,
    emptyStateKey: rooms.length === 0 ? "screen.homeState.empty" : undefined,
  };
}

/** Resolves the active design tokens for a screen render (brand consistency). */
export function themeFor(name: ThemeName): DesignTokens {
  return getTheme(name);
}

export class InterfaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InterfaceError";
  }
}

export const moduleName = "interface" as const;
export const implemented = true;
