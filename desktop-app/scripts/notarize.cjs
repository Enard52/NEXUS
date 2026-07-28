// NEXUS AI - electron-builder afterSign hook (macOS notarization)
//
// Runs after the app is signed but before the DMG is finalized. Notarizes the
// app with Apple's notarization service when the required secrets are present,
// and no-ops otherwise so unsigned/local builds keep working.
//
// Required env vars (set in CI secrets to enable):
//   APPLE_ID            — Apple Developer account email
//   APPLE_APP_SPECIFIC_PASSWORD — app-specific password for notarytool
//   APPLE_TEAM_ID       — Developer Team ID
//
// When any of these is missing the hook resolves without error, leaving the
// build unsigned-but-complete for local/dev use. electron-builder's own
// `notarize` config (teamId) is env-driven too, so it stays inert without the
// same secrets.

const { notarize } = require("@electron/notarizer");

exports.default = async function notarizeApp(context) {
  const { appOutDir, electronPlatformName, packager } = context;

  // Only notarize macOS builds.
  if (electronPlatformName !== "darwin") return;

  const appleId = process.env.APPLE_ID;
  const applePassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  // No secrets configured → skip notarization (unsigned build still succeeds).
  if (!appleId || !applePassword || !teamId) {
    console.log("[nexus] notarize: skipping (APPLE_* secrets not set) — unsigned build.");
    return;
  }

  const appBundleId = packager.appInfo.id;
  const appPath = `${appOutDir}/${packager.appInfo.productFilename}.app`;

  console.log(`[nexus] notarize: submitting ${appBundleId} to Apple…`);
  await notarize({
    tool: "notarytool",
    appBundleId,
    appPath,
    appleId,
    appleIdPassword: applePassword,
    teamId,
  });
  console.log("[nexus] notarize: done.");
};
