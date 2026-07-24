/**
 * NEXUS AI — Web render helpers (FAZ 9/10/18)
 *
 * Pure HTML-rendering functions used by the web, desktop and mobile front ends.
 * Every function is a deterministic `data -> string` transformation so it can
 * be unit tested without a DOM or browser.
 */

import { type Theme } from "@nexus/design-system";
import { type VersionInfoService } from "@nexus/infra";
import {
  type BillingModel,
  type DeviceListModel,
  type FamilyModel,
  type HomeStateModel,
  type NavItem,
  type PersonalizationModel,
  type SkillsModel,
  type SuggestionsModel,
  type TodayModel,
  type ScreenId,
} from "@nexus/interface";

// ── Locale ────────────────────────────────────────────────────────────────

export let CURRENT_LOCALE: string = "en";

export function setLocale(locale: string): void {
  CURRENT_LOCALE = locale;
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """)
    .replace(/'/g, "&#39;");
}

export function faviconDataUri(primaryColor: string): string {
