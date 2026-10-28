/**
 * Client-side screen registry: the single source of truth mapping each
 * ScreenDescriptor id (from @nexus/interface) to its icon, i18n title key
 * and React component. Shell renders purely from this table — adding a
 * screen means adding one entry here, nothing else.
 */

import type { ComponentType } from "react";
import type { MessageKey } from "@nexus/i18n";
import { TodayScreen } from "./Today";
import { DevicesScreen } from "./Devices";
import { HomeStateScreen } from "./HomeState";
import { SuggestionsScreen } from "./Suggestions";
import { RoutinesScreen } from "./Routines";
import { FamilyScreen } from "./Family";
import { SettingsScreen } from "./Settings";
import { BillingScreen } from "./Billing";
import { StoreScreen } from "./Store";
import { PlatformScreen } from "./Platform";

export interface ClientScreen {
  readonly id: string;
  readonly titleKey: MessageKey;
  readonly icon: string;
  readonly component: ComponentType;
}

/** Screens the SPA implements today, in nav order. Registry stays authoritative. */
export const CLIENT_SCREENS: readonly ClientScreen[] = [
  { id: "today", titleKey: "screen.today", icon: "☀️", component: TodayScreen },
  { id: "devices", titleKey: "screen.devices", icon: "💡", component: DevicesScreen },
  { id: "home-state", titleKey: "screen.homeState", icon: "🏠", component: HomeStateScreen },
  { id: "suggestions", titleKey: "screen.suggestions", icon: "✨", component: SuggestionsScreen },
  { id: "skills", titleKey: "screen.skills", icon: "⚡", component: RoutinesScreen },
  { id: "family", titleKey: "screen.family", icon: "👪", component: FamilyScreen },
  { id: "billing", titleKey: "screen.billing", icon: "💳", component: BillingScreen },
  { id: "platform", titleKey: "screen.platform", icon: "🖥️", component: PlatformScreen },
  {
    id: "personalization",
    titleKey: "screen.personalization",
    icon: "⚙️",
    component: SettingsScreen,
  },
];

/**
 * The connector store is a real API-backed surface (catalog/install) that is
 * always available to signed-in users, so it sits outside plan/role gating.
 */
export const STORE_SCREEN: ClientScreen = {
  id: "store",
  titleKey: "store.title",
  icon: "🧩",
  component: StoreScreen,
};

export function findScreen(id: string): ClientScreen | undefined {
  if (id === STORE_SCREEN.id) return STORE_SCREEN;
  return CLIENT_SCREENS.find((s) => s.id === id);
}
