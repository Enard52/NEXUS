import { describe, expect, it } from "vitest";
import { darkTheme } from "@nexus/design-system";
import { buildBillingModel, buildTodayModel } from "@nexus/interface";
import {
  renderWindowControls,
  renderDesktopDocument,
  renderDesktopStyles,
} from "../../desktop/src/index.js";
import {
  renderStatusBar,
  renderTabIcon,
  renderMobileDocument,
  renderMobileStyles,
} from "../../mobile/src/index.js";
import {
  renderBilling,
  renderTodayPanel,
  renderStyles,
  setLocale,
} from "./index.js";

describe("Empirical Challenger — UI Components & Cross-Platform Layout Verification", () => {
  describe("1. GNOME Linux Window Controls", () => {
    it("renders GNOME Linux circular window controls with .wctl-gnome and .gnome-btn", () => {
      const linuxControls = renderWindowControls("linux");
      expect(linuxControls).toContain('class="wctl wctl-gnome"');
      expect(linuxControls).toContain("gnome-btn min");
      expect(linuxControls).toContain("gnome-btn max");
      expect(linuxControls).toContain("gnome-btn close");
      expect(linuxControls).toContain('<path d="M2 6h8"/>'); // min icon
      expect(linuxControls).toContain('<rect x="2" y="2" width="8" height="8" rx="1.5"/>'); // max icon
      expect(linuxControls).toContain('<path d="M3 3l6 6M9 3l-6 6"/>'); // close icon
    });

    it("handles macOS and Windows controls correctly", () => {
      const macControls = renderWindowControls("mac");
      expect(macControls).toContain('fill="#ff5f56"');
      expect(macControls).toContain('fill="#ffbd2e"');
      expect(macControls).toContain('fill="#27c93f"');

      const winControls = renderWindowControls("windows");
      expect(winControls).toContain('<div class="wctl"');
      expect(winControls).not.toContain("wctl-gnome");

      // Default fallback
      const defaultControls = renderWindowControls();
      expect(defaultControls).toBe(winControls);

      // Unknown OS fallback
      const fallbackControls = renderWindowControls("unknown" as any);
      expect(fallbackControls).toContain('<div class="wctl"');
      expect(fallbackControls).not.toContain("wctl-gnome");
    });

    it("integrates Linux controls into Desktop document rendering", () => {
      const linuxDoc = renderDesktopDocument({ theme: "dark", os: "linux" });
      expect(linuxDoc).toContain("wctl-gnome");
      expect(linuxDoc).toContain("gnome-btn");

      const macDoc = renderDesktopDocument({ theme: "dark", os: "mac" });
      expect(macDoc).toContain('fill="#ff5f56"');

      const winDoc = renderDesktopDocument({ theme: "dark", os: "windows" });
      expect(winDoc).not.toContain("wctl-gnome");
    });

    it("includes Linux control CSS styles in renderDesktopStyles", () => {
      const css = renderDesktopStyles(darkTheme);
      expect(css).toContain(".wctl-btn");
      expect(css).toContain(".gnome-btn");
      expect(css).toContain("border-radius: 50%");
    });
  });

  describe("2. Android Status Bar Variant", () => {
    it("renders Android status bar layout with punch-hole camera, 10:00 time, and 5G badge", () => {
      const androidBar = renderStatusBar("android");
      expect(androidBar).toContain("statusbar-android");
      expect(androidBar).toContain('<span class="time">10:00</span>');
      expect(androidBar).toContain('<span class="punch-hole" aria-hidden="true"></span>');
      expect(androidBar).toContain(">5G</span>");
      expect(androidBar).toContain('<rect x="0" y="7" width="3" height="5" rx="1"/>'); // signal bars
    });

    it("renders iOS status bar layout with dynamic island and 9:41 time", () => {
      const iosBar = renderStatusBar("ios");
      expect(iosBar).toContain("statusbar-ios");
      expect(iosBar).toContain('<span class="time">9:41</span>');
      expect(iosBar).toContain('<span class="dynamic-island" aria-hidden="true"></span>');
      expect(iosBar).not.toContain("punch-hole");

      // Default fallback
      const defaultBar = renderStatusBar();
      expect(defaultBar).toBe(iosBar);

      // Unknown platform fallback
      const fallbackBar = renderStatusBar("unknown" as any);
      expect(fallbackBar).toContain("statusbar-ios");
    });

    it("integrates Android status bar into Mobile document rendering", () => {
      const androidDoc = renderMobileDocument({ theme: "dark", platform: "android" });
      expect(androidDoc).toContain("statusbar-android");
      expect(androidDoc).toContain("punch-hole");

      const iosDoc = renderMobileDocument({ theme: "dark", platform: "ios" });
      expect(iosDoc).toContain("statusbar-ios");
      expect(iosDoc).toContain("dynamic-island");
    });

    it("includes Android status bar CSS styles in renderMobileStyles", () => {
      const css = renderMobileStyles(darkTheme);
      expect(css).toContain(".statusbar-android");
      expect(css).toContain(".statusbar .punch-hole");
      expect(css).toContain("border-radius: 50%");
    });
  });

  describe("3. Mobile Tab Icons", () => {
    it("renders valid SVG icons for platform, agents, and admin-dashboard", () => {
      const platformIcon = renderTabIcon("platform");
      expect(platformIcon).toContain("<svg");
      expect(platformIcon).toContain('<rect x="2" y="3" width="20" height="14" rx="2"/>');
      expect(platformIcon).toContain('line x1="8" y1="21" x2="16" y2="21"');

      const agentsIcon = renderTabIcon("agents");
      expect(agentsIcon).toContain("<svg");
      expect(agentsIcon).toContain('<rect x="3" y="11" width="18" height="10" rx="2"/>');
      expect(agentsIcon).toContain('<circle cx="12" cy="5" r="2"/>');

      const adminIcon = renderTabIcon("admin-dashboard");
      expect(adminIcon).toContain("<svg");
      expect(adminIcon).toContain('<rect x="3" y="3" width="7" height="7"/>');
      expect(adminIcon).toContain('<rect x="14" y="14" width="7" height="7"/>');
    });

    it("renders valid SVG icons for all supported TabIcon types", () => {
      const icons = [
        "today",
        "home",
        "devices",
        "family",
        "more",
        "suggestions",
        "skills",
        "personalization",
        "billing",
        "download-center",
        "platform",
        "agents",
        "admin-dashboard",
      ] as const;

      for (const icon of icons) {
        const svg = renderTabIcon(icon);
        expect(svg).toContain('<svg width="22" height="22" viewBox="0 0 24 24"');
        expect(svg).toContain('stroke="currentColor"');
      }
    });

    it("handles unknown tab icon gracefully without throwing", () => {
      const unknownSvg = renderTabIcon("unknown" as any);
      expect(unknownSvg).toContain('<svg width="22" height="22" viewBox="0 0 24 24"');
      expect(unknownSvg.endsWith("></svg>")).toBe(true);
    });

    it("keeps agents on mobile but omits web-only platform/admin surfaces", () => {
      const authedDoc = renderMobileDocument({ theme: "dark", authenticated: true });
      expect(authedDoc).toContain('data-nav="agents"');
      // User feedback: platform hub and admin panel are web-only surfaces.
      expect(authedDoc).not.toContain('data-nav="platform"');
      expect(authedDoc).not.toContain('data-nav="admin-dashboard"');
    });
  });

  describe("4. Enriched Billing View Comparison Tables", () => {
    it("renders plan comparison matrix cards and payment history invoice table (English)", () => {
      setLocale("en");
      const model = buildBillingModel({ plan: "family", invoiceCount: 3 });
      const html = renderBilling(model);

      // Plan Comparison Matrix
      expect(html).toContain("Plan Comparison Matrix");
      expect(html).toContain("Free");
      expect(html).toContain("$0");
      expect(html).toContain("Premium");
      expect(html).toContain("$5");
      expect(html).toContain("Family");
      expect(html).toContain("$10");
      expect(html).toContain("✓ Unlimited Devices");
      expect(html).toContain("✓ Multi-User Family Sharing");

      // Payment History & Invoices Table
      expect(html).toContain("Payment History & Invoices");
      expect(html).toContain('<table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;" class="payment-table">');
      expect(html).toContain(">Date</th>");
      expect(html).toContain(">Description</th>");
      expect(html).toContain(">Amount</th>");
      expect(html).toContain(">Status / Invoice</th>");
      expect(html).toContain("INV-2026-007");
      expect(html).toContain("INV-2026-006");
      expect(html).toContain("INV-2026-005");
      expect(html).toContain('Paid (INV-2026-007)');
    });

    it("renders plan comparison matrix cards and payment history invoice table (Turkish)", () => {
      setLocale("tr");
      const model = buildBillingModel({ plan: "family", invoiceCount: 3 });
      const html = renderBilling(model);

      expect(html).toContain("Plan Karşılaştırma Matrisi");
      expect(html).toContain("/ay");
      expect(html).toContain("✓ Sınırsız Cihaz");
      expect(html).toContain("Ödeme Geçmişi & Faturalar");
      expect(html).toContain(">Tarih</th>");
      expect(html).toContain(">Açıklama</th>");
      expect(html).toContain(">Tutar</th>");
      expect(html).toContain(">Durum / Fatura</th>");
      setLocale("en"); // reset
    });
  });

  describe("5. Today Panel Analytics Cards", () => {
    it("renders all 4 analytics cards in English locale", () => {
      setLocale("en");
      const model = buildTodayModel({
        devicesOnline: 3,
        devicesTotal: 4,
        energyWhToday: 1500,
        activeRoutines: 5,
        pendingSuggestions: 1,
      });
      const html = renderTodayPanel(model);

      // Card 1: Weekly Energy Trend
      expect(html).toContain("Weekly Energy Trend");
      expect(html).toContain("19.4 kWh");
      expect(html).toContain("-12%");
      expect(html).toContain('<svg class="sparkline"');

      // Card 2: System Uptime
      expect(html).toContain("System Uptime");
      expect(html).toContain("99.98%");
      expect(html).toContain("14d 6h uninterrupted");

      // Card 3: Total Automations
      expect(html).toContain("Total Automations");
      expect(html).toContain("1,420");
      expect(html).toContain("Triggered this month");

      // Card 4: Most Active Device
      expect(html).toContain("Most Active Device");
      expect(html).toContain('LG C3 65" 4K OLED Smart TV');
      expect(html).toContain("Avg 6.2 hrs/day");
    });

    it("renders all 4 analytics cards in Turkish locale", () => {
      setLocale("tr");
      const model = buildTodayModel({
        devicesOnline: 3,
        devicesTotal: 4,
        energyWhToday: 1500,
        activeRoutines: 5,
        pendingSuggestions: 1,
      });
      const html = renderTodayPanel(model);

      expect(html).toContain("Haftalık Enerji Trendi");
      expect(html).toContain("Sistem Çalışma Süresi");
      expect(html).toContain("14 gün 6 saat kesintisiz");
      expect(html).toContain("Toplam Otomasyon");
      expect(html).toContain("Bu ay tetiklendi");
      expect(html).toContain("En Aktif Cihaz");
      expect(html).toContain('LG C3 65" 4K OLED TV');
      expect(html).toContain("Ort. 6.2 saat/gün");
      setLocale("en"); // reset
    });

    it("verifies analytics cards have bento-tile and analytics-tile classes", () => {
      const model = buildTodayModel({
        devicesOnline: 3,
        devicesTotal: 4,
        energyWhToday: 1500,
        activeRoutines: 5,
        pendingSuggestions: 1,
      });
      const html = renderTodayPanel(model);
      const matches = html.match(/class="bento-tile analytics-tile"/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(4);
    });
  });

  describe("6. Responsive CSS, Glassmorphism Filters & CSS Mockup Animations", () => {
    it("verifies glassmorphism backdrop-filters across Web, Mobile, and Desktop styles", () => {
      const webCss = renderStyles(darkTheme);
      expect(webCss).toContain("backdrop-filter: blur(");

      const mobileCss = renderMobileStyles(darkTheme);
      expect(mobileCss).toContain("backdrop-filter: blur(20px) saturate(180%)");

      const desktopCss = renderDesktopStyles(darkTheme);
      expect(desktopCss).toContain("backdrop-filter: blur(20px)");
    });

    it("verifies CSS mockup animations keyframes across Web, Mobile, and Desktop", () => {
      const webCss = renderStyles(darkTheme);
      expect(webCss).toContain("@keyframes wavePulse");
      expect(webCss).toContain("@keyframes nxAurora");
      expect(webCss).toContain("@keyframes nxRise");

      const mobileCss = renderMobileStyles(darkTheme);
      expect(mobileCss).toContain("@keyframes screen-slide-in");
      expect(mobileCss).toContain("@keyframes more-row-in");
      expect(mobileCss).toContain("@keyframes status-pulse");
      expect(mobileCss).toContain("@keyframes mic-pulse");

      const desktopCss = renderDesktopStyles(darkTheme);
      expect(desktopCss).toContain("@keyframes win-open");
      expect(desktopCss).toContain("@keyframes sidebar-pulse");
      expect(desktopCss).toContain("@keyframes content-slide");
    });

    it("verifies responsive media queries for mobile, tablet, desktop, and accessibility", () => {
      const webCss = renderStyles(darkTheme);
      expect(webCss).toContain("@media (max-width: 768px)");
      expect(webCss).toContain(".nx-table-wrap");

      const mobileCss = renderMobileStyles(darkTheme);
      expect(mobileCss).toContain("@media (max-width: 480px)");
      expect(mobileCss).toContain("@media (prefers-reduced-motion: reduce)");

      // Check small screen mobile container collapse rule
      expect(mobileCss).toContain("width: 100%; max-width: 100%; height: 100vh;");
    });
  });
});
