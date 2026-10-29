import { readFileSync } from "node:fs";

const files = {
  smart: readFileSync("www/nexus-smart.html", "utf8"),
  detail: readFileSync("www/nexus-smart-app-detail.html", "utf8"),
  scene: readFileSync("www/smart-scene-page.js", "utf8"),
  movie: readFileSync("www/nexus-movie-mode.html", "utf8"),
};

const failures = [];

function expectIncludes(name, haystack, needle, message) {
  if (!haystack.includes(needle)) {
    failures.push(`${name}: ${message}`);
  }
}

expectIncludes(
  "nexus-smart.html",
  files.smart,
  "data-custom-scene-card",
  "custom click-run and automation cards should expose a tappable detail card marker.",
);
expectIncludes(
  "nexus-smart.html",
  files.smart,
  "nexus-smart-app-detail.html?source=clickrun",
  "custom click-run cards should open the shared scenario detail page.",
);
expectIncludes(
  "nexus-smart.html",
  files.smart,
  "nexus-smart-app-detail.html?source=automation",
  "custom automation rows should open the shared scenario detail page.",
);
expectIncludes(
  "nexus-smart.html",
  files.smart,
  "data-ai-helper-action",
  "shared AI helper action should be tappable on the Smart page.",
);

expectIncludes(
  "nexus-smart-app-detail.html",
  files.detail,
  "nexusCustomClickRun",
  "detail page should load user-created click-run scenarios.",
);
expectIncludes(
  "nexus-smart-app-detail.html",
  files.detail,
  "nexusCustomAutomations",
  "detail page should load user-created automations.",
);
expectIncludes(
  "nexus-smart-app-detail.html",
  files.detail,
  "Bunu gerçekleştir",
  "detail page should include the scenario action section.",
);
expectIncludes(
  "nexus-smart-app-detail.html",
  files.detail,
  "Direkt Siriye Ekle",
  "detail page should use the requested Siri shortcut label.",
);
expectIncludes(
  "nexus-smart-app-detail.html",
  files.detail,
  "shortcuts://",
  "detail page should provide an iOS Shortcuts handoff.",
);

expectIncludes(
  "smart-scene-page.js",
  files.scene,
  "window.NexusNavigation",
  "shared scene navigation helper should be exposed for consistent back behavior.",
);
expectIncludes(
  "nexus-movie-mode.html",
  files.movie,
  'data-back-href="nexus-smart.html',
  "Smart scene pages should fall back to the Smart page, not Home.",
);

if (failures.length) {
  console.error("verify-smart-detail-flow: FAIL");
  failures.forEach((failure) => console.error("- " + failure));
  process.exit(1);
}

console.log("verify-smart-detail-flow: PASS");
