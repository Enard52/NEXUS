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
  | "platform"
  | "agents"
  | "billing"
  | "billing-manage"
  | "add-device"
  | "download-center"
  | "admin-dashboard";

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
  { id: "platform", titleKey: "screen.platform", requiresAuth: true },
  { id: "agents", titleKey: "screen.agents", requiresAuth: true },
  { id: "billing", titleKey: "screen.billing", requiresAuth: true, roles: ["admin"] },
  {
    id: "billing-manage",
    titleKey: "screen.billingManage",
    requiresAuth: true,
    roles: ["admin"],
  },
  { id: "add-device", titleKey: "screen.addDevice", requiresAuth: true },
  {
    id: "admin-dashboard",
    titleKey: "screen.adminDashboard",
    requiresAuth: true,
    roles: ["admin"],
  },
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

/**
 * Semantic device type discriminator — drives type-specific control blocks in
 * the device-detail screen and themed tile styling. Aligned with the
 * `DEVICE_TILE_STYLE` keys used by the mobile/web renderers (lamp/tv/ac/…).
 */
export type DeviceTypeId =
  | "lamp"
  | "tv"
  | "ac"
  | "lock"
  | "speaker"
  | "camera"
  | "thermostat"
  | "curtain";

/**
 * Kinds of controllable capabilities a device exposes. Mirrors the domain
 * `CapabilityKind` in @nexus/devices (kept independent here to avoid a package
 * cycle) and extends it with TV/audio/curtain controls (volume/channel/position).
 */
export type CapabilityKind =
  | "switch"
  | "brightness"
  | "colorTemp"
  | "color"
  | "motion"
  | "temperature"
  | "humidity"
  | "power"
  | "volume"
  | "channel"
  | "source"
  | "position"
  | "mode"
  | "fanSpeed"
  | "lockState"
  | "privacyMode"
  | "quality";

/** A single controllable capability with its current value and range. */
export interface Capability {
  readonly kind: CapabilityKind;
  readonly value: boolean | number | string;
  readonly min?: number;
  readonly max?: number;
  /** For enumerated kinds (mode/source/quality) — the allowed values. */
  readonly options?: readonly string[];
}

export interface DeviceRow {
  readonly id: string;
  readonly nameKey: string;
  readonly online: boolean;
  readonly room?: string;
  readonly manufacturer?: string;
  readonly model?: string;
  /** Semantic device type — powers type-specific detail controls + tile styling. */
  readonly type?: DeviceTypeId;
  /** Locally-vendored product photo (e.g. "/img/devices/lamp.webp"); falls back to the gradient tile. */
  readonly imageUrl?: string;
  readonly firmwareVersion?: string;
  readonly ipAddress?: string;
  readonly macAddress?: string;
  readonly connectionStatus?: "online" | "offline" | "error";
  readonly lastSeen?: string;
  readonly updateAvailable?: boolean;
  readonly analytics?: {
    readonly dailyUsageWh?: number[];
    readonly weeklyUsageWh?: number[];
    readonly anomalyDetected?: boolean;
  };
  /** Type-specific controllable capabilities (brightness, temperature, volume…). */
  readonly capabilities?: readonly Capability[];
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

export interface PlatformModel {
  readonly titleKey: string;
  readonly platforms: readonly {
    readonly id: string;
    readonly name: string;
    readonly active: boolean;
  }[];
}

export function buildPlatformModel(): PlatformModel {
  return {
    titleKey: "screen.platform",
    platforms: [
      { id: "web", name: "Web App", active: true },
      { id: "desktop", name: "Desktop", active: false },
      { id: "mobile", name: "Mobile", active: false },
    ],
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

// ── Billing management (subscription screen) ─────────────────────────────────

/** One plan column in the comparison grid (current plan is highlighted). */
export interface PlanCompareRow {
  readonly plan: PlanId;
  readonly labelKey: string;
  /** Monthly price, display-formatted (demo currency). */
  readonly price: string;
  /** Which comparison features this plan includes (parallel to featureKeys). */
  readonly includes: readonly boolean[];
  readonly current: boolean;
}

export interface InvoiceRow {
  readonly id: string;
  /** ISO date of the invoice (YYYY-MM-DD). */
  readonly date: string;
  readonly amount: string;
  readonly status: "paid" | "due";
}

/**
 * Render-ready state for the subscription-management screen: plan comparison,
 * payment method on file, next renewal and the invoice history. Deterministic
 * demo data — a production build would hydrate this from the billing service.
 */
export interface BillingManageModel {
  readonly titleKey: string;
  readonly plan: PlanId;
  readonly planLabelKey: string;
  /** Feature rows of the comparison grid (i18n keys). */
  readonly featureKeys: readonly string[];
  readonly plans: readonly PlanCompareRow[];
  readonly paymentMethod: {
    readonly brand: "visa" | "mastercard" | "amex";
    readonly last4: string;
    readonly expires: string;
  };
  /** Next renewal — absent on the free plan (nothing renews). */
  readonly nextRenewal?: {
    readonly date: string;
    readonly amount: string;
  };
  readonly invoices: readonly InvoiceRow[];
  readonly changeActionKey: string;
  readonly cancelActionKey: string;
}

const PLAN_PRICES: Record<PlanId, string> = {
  free: "$0",
  premium: "$9.99",
  family: "$14.99",
};

/** Feature inclusion matrix, parallel to `featureKeys` below. */
const PLAN_FEATURES: Record<PlanId, readonly boolean[]> = {
  free: [true, false, false, false],
  premium: [true, true, true, false],
  family: [true, true, true, true],
};

export function buildBillingManageModel(plan: PlanId): BillingManageModel {
  const plans: PlanCompareRow[] = (Object.keys(PLAN_RANK) as PlanId[]).map((p) => ({
    plan: p,
    labelKey: `plan.${p}`,
    price: PLAN_PRICES[p],
    includes: PLAN_FEATURES[p],
    current: p === plan,
  }));
  const paying = plan !== "free";
  return {
    titleKey: getScreen("billing-manage").titleKey,
    plan,
    planLabelKey: `plan.${plan}`,
    featureKeys: [
      "billing.feature.devices",
      "billing.feature.connectors",
      "billing.feature.ai",
      "billing.feature.family",
    ],
    plans,
    paymentMethod: { brand: "visa", last4: "4242", expires: "12/27" },
    nextRenewal: paying ? { date: "2026-08-15", amount: PLAN_PRICES[plan] } : undefined,
    invoices: paying
      ? [
          { id: "inv-2026-07", date: "2026-07-15", amount: PLAN_PRICES[plan], status: "paid" },
          { id: "inv-2026-06", date: "2026-06-15", amount: PLAN_PRICES[plan], status: "paid" },
          { id: "inv-2026-05", date: "2026-05-15", amount: PLAN_PRICES[plan], status: "paid" },
        ]
      : [],
    changeActionKey: "billing.changePayment",
    cancelActionKey: "billing.cancelRenewal",
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

export interface DemoScreens {
  readonly nav: readonly ScreenDescriptor[];
  readonly today: TodayModel;
  readonly home: HomeStateModel;
  readonly devices: DeviceListModel;
  readonly releases: any;
  readonly suggestions: SuggestionsModel;
  readonly skills: SkillsModel;
  readonly family: FamilyModel;
  readonly personalization: PersonalizationModel;
  readonly platform: PlatformModel;
  readonly agents: AgentsModel;
  readonly billing: BillingModel;
  readonly billingManage: BillingManageModel;
  readonly adminDashboard: AdminDashboardModel;
}

export interface AdminDashboardModel {
  readonly id: "admin-dashboard";
  readonly titleKey: string;
  readonly totalUsers: number;
  readonly activeDevices: number;
  readonly revenue: string;
  readonly recentLogs: readonly { readonly time: string; readonly event: string }[];
}

export function buildAdminDashboardModel(): AdminDashboardModel {
  return {
    id: "admin-dashboard",
    titleKey: getScreen("admin-dashboard").titleKey,
    totalUsers: 14502,
    activeDevices: 45290,
    revenue: "$32,500",
    recentLogs: [
      { time: "12:04", event: "User registration (us-east)" },
      { time: "11:59", event: "Device sync (hue-bridge)" },
      { time: "11:58", event: "Payment success (sub_123)" },
    ],
  };
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

export interface DiscoverableSkillRow {
  readonly id: string;
  readonly nameKey: string;
  readonly descriptionKey: string;
  readonly icon: string;
  readonly tags: readonly string[];
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
  readonly discoverable: readonly DiscoverableSkillRow[];
  readonly emptyStateKey?: string;
}

export function buildSkillsModel(
  rows: readonly SkillRow[],
  discoverable: readonly DiscoverableSkillRow[] = [],
): SkillsModel {
  const sorted = [...rows].sort((a, b) => b.usageCount - a.usageCount);
  return {
    titleKey: getScreen("skills").titleKey,
    rows: sorted,
    discoverable,
    emptyStateKey: sorted.length === 0 ? "screen.skills.empty" : undefined,
  };
}

export interface AgentRow {
  readonly id: string;
  readonly nameKey: string;
  readonly icon: string;
  readonly status: "active" | "sleeping" | "learning";
}

export interface AgentsModel {
  readonly titleKey: string;
  readonly rows: readonly AgentRow[];
  readonly emptyStateKey?: string;
}

export function buildAgentsModel(rows: readonly AgentRow[]): AgentsModel {
  return {
    titleKey: getScreen("agents").titleKey,
    rows,
    emptyStateKey: rows.length === 0 ? "screen.agents.empty" : undefined,
  };
}

export interface FamilyMemberRow {
  readonly id: string;
  readonly nameKey: string;
  readonly role: Role;
  readonly avatarUrl?: string;
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
