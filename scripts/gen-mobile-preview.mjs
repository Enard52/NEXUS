// Renders the authenticated mobile app to a standalone file for visual QA.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderMobileAppDocument } from "../packages/server/src/pages.ts";
import { defaultUserData } from "../packages/server/src/userdata.ts";

const account = { id: "u_preview", email: "ada.lovelace@example.com", role: "admin" };
const base = defaultUserData(account.email, "en");
// Populate a little real-shaped data so the phone shell shows lived-in content.
const data = {
  ...base,
  devices: [
    { id: "d1", name: "Living Room TV", room: "Living room", online: true },
    { id: "d2", name: "Kitchen Lights", room: "Kitchen", online: true },
    { id: "d3", name: "Bedroom Thermostat", room: "Bedroom", online: false },
  ],
  routines: [
    { id: "r1", name: "Good Morning", usageCount: 42 },
    { id: "r2", name: "Movie Night", usageCount: 18 },
  ],
  suggestions: [{ id: "s1", text: "Turn off the porch light at 23:00", at: "23:00" }],
  family: [{ id: "m1", name: "Ada Lovelace", role: "admin" }],
  energyWhToday: 2720,
};

const html = renderMobileAppDocument(account, data, "dark");
const out = resolve(process.cwd(), "packages/web/dist/preview-mobile-app.html");
writeFileSync(out, html, "utf8");
console.log("wrote", out, html.length, "bytes");
