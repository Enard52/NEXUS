import http from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SqliteKeyValueStore } from "../../packages/database/src/index.ts";
import { SqliteUserMemoryStore } from "../../packages/memory/src/index.ts";
import { createNexusApp, startServer } from "../../packages/server/src/index.ts";
import {
  renderAppDocument,
  renderLoginDocument,
  renderMarketingDocument,
  renderMobileAppDocument,
  renderDesktopAppDocument,
  renderLegalPage,
  renderAboutPage,
  renderStoreDocument,
} from "../../packages/server/src/pages.ts";
import { renderMobileDocument } from "../../packages/mobile/src/index.ts";
import { renderDesktopDocument, renderSetupDocument } from "../../packages/desktop/src/index.ts";

async function main() {
  console.log("=== STARTING EMPIRICAL VERIFICATION HARNESS ===");
  const results = {
    testPassedCount: 0,
    testFailedCount: 0,
    endpoints: [],
    stressTests: [],
  };

  const tmp = mkdtempSync(join(tmpdir(), "nexus-empirical-"));
  const dbFile = join(tmp, "empirical.db");
  const store = new SqliteKeyValueStore(dbFile);
  const memory = new SqliteUserMemoryStore(dbFile + ".memory");
  const app = createNexusApp({ store, memory });
  const { server, port } = await startServer(app, 0);
  const base = `http://127.0.0.1:${port}`;

  console.log(`Server started on port ${port}`);

  try {
    // 1. Register a user and capture cookie
    const regRes = await fetch(`${base}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "tester@example.com", password: "password123" }),
    });
    const setCookie = regRes.headers.getSetCookie();
    const sessionCookie = setCookie.find((c) => c.startsWith("nx_session="))?.split(";")[0] ?? "";

    // 2. Test Server Endpoints
    const endpointsToTest = [
      { path: "/", expectedStatus: 200, name: "Public Marketing Landing" },
      { path: "/privacy", expectedStatus: 200, name: "Privacy Policy" },
      { path: "/privacy?lang=tr", expectedStatus: 200, name: "Privacy Policy (TR)" },
      { path: "/terms", expectedStatus: 200, name: "Terms of Service" },
      { path: "/terms?lang=tr", expectedStatus: 200, name: "Terms of Service (TR)" },
      { path: "/about", expectedStatus: 200, name: "About Page" },
      { path: "/about?lang=tr", expectedStatus: 200, name: "About Page (TR)" },
      { path: "/preview/store", expectedStatus: 200, name: "Store Preview" },
      { path: "/preview/store?lang=tr", expectedStatus: 200, name: "Store Preview (TR)" },
      { path: "/store", expectedStatus: 200, name: "Store Route" },
      { path: "/login", expectedStatus: 200, name: "Login Page (Unauthenticated)" },
      { path: "/login", headers: { cookie: sessionCookie }, redirectManual: true, expectedStatus: 302, expectedLocation: "/app", name: "Login Page (Authenticated -> /app)" },
      { path: "/app", redirectManual: true, expectedStatus: 302, expectedLocation: "/login", name: "App Page (Unauthenticated -> /login)" },
      { path: "/app", headers: { cookie: sessionCookie }, expectedStatus: 200, name: "App Page (Authenticated Desktop Web)" },
      { path: "/app", headers: { cookie: sessionCookie, "user-agent": "iPhone OS 17_0" }, expectedStatus: 200, name: "App Page (Authenticated Mobile User-Agent)" },
      { path: "/app", headers: { cookie: sessionCookie, "user-agent": "Electron/30.0.0 NexusDesktop" }, expectedStatus: 200, name: "App Page (Authenticated Desktop Shell User-Agent)" },
      { path: "/downloads/nexus-setup-3.14.2.exe", expectedStatus: 200, expectedHeader: { "content-type": "application/octet-stream", "content-disposition": 'attachment; filename="nexus-setup-3.14.2.exe"' }, name: "Download Windows Installer Binary" },
      { path: "/downloads/nexus-3.14.1.dmg", expectedStatus: 200, expectedHeader: { "content-type": "application/octet-stream", "content-disposition": 'attachment; filename="nexus-3.14.1.dmg"' }, name: "Download macOS Installer Binary" },
      { path: "/downloads/nexus-3.13.8.AppImage", expectedStatus: 200, expectedHeader: { "content-type": "application/octet-stream", "content-disposition": 'attachment; filename="nexus-3.13.8.AppImage"' }, name: "Download Linux Installer Binary" },
      { path: "/mobile", expectedStatus: 200, name: "Mobile Visual QA" },
      { path: "/mobile/light", expectedStatus: 200, name: "Mobile Light Visual QA" },
      { path: "/desktop", expectedStatus: 200, name: "Desktop Visual QA" },
      { path: "/desktop/light", expectedStatus: 200, name: "Desktop Light Visual QA" },
      { path: "/installer", expectedStatus: 200, name: "Installer Visual QA" },
      { path: "/installer/light", expectedStatus: 200, name: "Installer Light Visual QA" },
    ];

    for (const item of endpointsToTest) {
      try {
        const init = {
          headers: item.headers || {},
          redirect: item.redirectManual ? "manual" : "follow",
        };
        const res = await fetch(`${base}${item.path}`, init);
        const status = res.status;
        const text = await res.text();

        let pass = status === item.expectedStatus;
        if (item.expectedLocation) {
          const loc = res.headers.get("location");
          if (loc !== item.expectedLocation) pass = false;
        }
        if (item.expectedHeader) {
          for (const [hk, hv] of Object.entries(item.expectedHeader)) {
            const actualHeader = res.headers.get(hk);
            if (!actualHeader || !actualHeader.includes(hv)) {
              console.error(`Header mismatch for ${item.name}: expected ${hk}=${hv}, got ${actualHeader}`);
              pass = false;
            }
          }
        }

        if (pass) {
          results.testPassedCount++;
          results.endpoints.push({ name: item.name, path: item.path, status, pass: true, bodyLen: text.length });
        } else {
          results.testFailedCount++;
          results.endpoints.push({ name: item.name, path: item.path, status, pass: false, error: `Expected status ${item.expectedStatus}, got ${status}` });
        }
      } catch (err) {
        results.testFailedCount++;
        results.endpoints.push({ name: item.name, path: item.path, pass: false, error: String(err) });
      }
    }

    // 3. Stress Test Page Markup Renderers
    console.log("=== RUNNING STRESS TESTS ON PAGE MARKUP GENERATION ===");
    const stressScenarios = [
      {
        name: "renderMarketingDocument with hostile inputs",
        fn: () => renderMarketingDocument("<script>alert(1)</script>", "<svg/onload=alert(1)>", "light"),
      },
      {
        name: "renderLoginDocument with malicious options",
        fn: () => renderLoginDocument("tr", { notice: "error", providers: [{ id: "google", labelKey: "auth.google" }], theme: "light" }),
      },
      {
        name: "renderLegalPage privacy (tr)",
        fn: () => renderLegalPage("tr", "dark", "privacy"),
      },
      {
        name: "renderLegalPage terms (en)",
        fn: () => renderLegalPage("en", "light", "terms"),
      },
      {
        name: "renderAboutPage (tr)",
        fn: () => renderAboutPage("tr", "dark"),
      },
      {
        name: "renderStoreDocument (tr & light)",
        fn: () => renderStoreDocument({ theme: "light", locale: "tr" }),
      },
      {
        name: "renderAppDocument with XSS payload in user data",
        fn: () =>
          renderAppDocument(
            { id: "u1", email: "user<script>@test.com", role: "admin" },
            {
              id: "u1",
              email: "user<script>@test.com",
              displayName: "<b>Hacker</b>",
              assistantName: "<img src=x onerror=alert(1)>",
              language: "en",
              plan: "premium",
              energyWhToday: 9999999,
              devices: [
                { id: "d1", name: "<script>alert('device')</script>", room: "Living Room", online: true },
              ],
              routines: [{ id: "r1", name: "Routine <>&\"'", usageCount: 42 }],
              suggestions: [{ id: "s1", text: "Suggestion <tag>", at: "12:00" }],
              family: [{ id: "f1", name: "Member <X>", role: "member" }],
            },
            "Mozilla/5.0 Chrome/120.0.0.0"
          ),
      },
      {
        name: "renderMobileAppDocument with dark theme",
        fn: () =>
          renderMobileAppDocument(
            { id: "u1", email: "mobile@test.com", role: "user" },
            {
              id: "u1",
              email: "mobile@test.com",
              displayName: "Mobile User",
              assistantName: "Nexus",
              language: "tr",
              plan: "free",
              energyWhToday: 1200,
              devices: [],
              routines: [],
              suggestions: [],
              family: [],
            },
            "dark"
          ),
      },
      {
        name: "renderDesktopAppDocument with light theme",
        fn: () =>
          renderDesktopAppDocument(
            { id: "u1", email: "desktop@test.com", role: "admin" },
            {
              id: "u1",
              email: "desktop@test.com",
              displayName: "Desktop User",
              assistantName: "Nexus",
              language: "en",
              plan: "family",
              energyWhToday: 5400,
              devices: [],
              routines: [],
              suggestions: [],
              family: [],
            },
            "light"
          ),
      },
      {
        name: "renderMobileDocument across all themes and locales",
        fn: () => {
          renderMobileDocument({ theme: "dark", locale: "en" });
          renderMobileDocument({ theme: "light", locale: "tr" });
        },
      },
      {
        name: "renderDesktopDocument across all themes and locales",
        fn: () => {
          renderDesktopDocument({ theme: "dark", locale: "tr" });
          renderDesktopDocument({ theme: "light", locale: "en" });
        },
      },
      {
        name: "renderSetupDocument across all themes and locales",
        fn: () => {
          renderSetupDocument({ theme: "dark", locale: "en" });
          renderSetupDocument({ theme: "light", locale: "tr" });
        },
      },
    ];

    for (const sc of stressScenarios) {
      try {
        const html = sc.fn();
        if (typeof html === "undefined" || html === null) {
          // fn returns void for multiple renders
          results.testPassedCount++;
          results.stressTests.push({ name: sc.name, pass: true });
        } else if (typeof html === "string" && html.length > 50) {
          results.testPassedCount++;
          results.stressTests.push({ name: sc.name, pass: true, htmlLength: html.length });
        } else {
          results.testFailedCount++;
          results.stressTests.push({ name: sc.name, pass: false, error: "Output not a valid HTML string or too short" });
        }
      } catch (err) {
        results.testFailedCount++;
        results.stressTests.push({ name: sc.name, pass: false, error: String(err) });
      }
    }

  } finally {
    server.close();
    store.close();
    memory.close();
    try { rmSync(tmp, { recursive: true, force: true }); } catch {}
  }

  console.log("=== EMPIRICAL RESULTS SUMMARY ===");
  console.log(`Passed: ${results.testPassedCount}, Failed: ${results.testFailedCount}`);
  console.log(JSON.stringify(results, null, 2));

  if (results.testFailedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("FATAL ERROR IN HARNESS:", err);
  process.exit(1);
});
