# Writing a device connector

A connector teaches NEXUS to talk to one family of devices **over your own network**. No vendor cloud, no fees, and
no pretending: if something does not work, the connector says so.

Read [CONTRIBUTING.md](../CONTRIBUTING.md) and [GOVERNANCE.md](../GOVERNANCE.md) first. Two rules matter most here:

1. **Only write against the real protocol documentation.** Link the documentation in your pull request.
2. **Never fake a success.** An unreachable device, a missing bridge or an unsupported capability must produce an
   error or an "unsupported" result, never a made-up state. If you could not try it on real hardware, say so in the
   pull request; do not call it verified.

## Where connectors live

All connectors are in [`src/app/lan-connectors.js`](../src/app/lan-connectors.js), one object per protocol, collected
in the `protocols` array. The file is a browser IIFE that exposes `window.nexusLan`. Transport is chosen for you:

| Environment | Transport |
|---|---|
| Desktop app (Electron) | `window.nexusDesktop.http`, no CORS limits; also UDP/TCP bridges |
| Phone (Capacitor) | the native HTTP plugin |
| Browser | `fetch` (only devices that allow CORS; development use) |

Use the helpers the file already provides instead of calling `fetch` yourself: `getJson(url)`, `sendJson(url,
method, body)`, `baseUrl(device)`, `hostOnly(device)`. They enforce a **LAN-only address check** (`lanAddressError`),
so a connector can never be pointed at a public host.

## The connector contract

A connector is a plain object:

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | short protocol id stored on the device (`"tasmota"`) |
| `label` | yes | name shown to people (`"Tasmota"`) |
| `caps` | yes | capabilities it can have: `switch`, `brightness`, `color`, `colorTemp`, `position`, ... |
| `probe(device)` | yes | resolves with `{ protocol, model, name, kind, caps? }` if the host speaks this protocol, **rejects** otherwise |
| `read(device)` | yes | resolves with the current state, for example `{ switch: true, brightness: 80 }`; use `null` for unknown values |
| `write(device, capability, value)` | yes | sends one command; call `unsupported(id, capability)` for anything it cannot do |
| `needsUdp`, `needsTcp`, `needsBinHttp`, `needsTcpSession` | no | set when the protocol needs a desktop bridge; the connector then stays inactive where the bridge is missing |
| `discoverable: false` | no | skip automatic probing (for example protocols that need pairing first) |

`kind` is one of the device kinds the app already knows (`light`, `switch`, `plug`, `cover`, `sensor`, ...). Report
only capabilities the device really has: `probe` may narrow `caps` per device.

## Starter template

Copy this into `lan-connectors.js` next to the other connectors, then replace every `ACME` placeholder with the real
protocol from the vendor documentation. The endpoints below are placeholders and do not describe a real device.

```js
// --- ACME (local HTTP API) — replace with the documented protocol ------------------------
var acme = {
  id: "acme",
  label: "ACME",
  caps: ["switch", "brightness"],
  probe: function (device) {
    // Ask for something only this device family answers. Reject when it is not one.
    return getJson(baseUrl(device) + "/api/info").then(function (info) {
      if (!info || info.vendor !== "acme") throw new Error("acme: kimlik yok");
      return { protocol: "acme", model: info.model, name: info.name || "ACME", kind: "light" };
    });
  },
  read: function (device) {
    return getJson(baseUrl(device) + "/api/state").then(function (s) {
      return {
        switch: typeof s.on === "boolean" ? s.on : null,
        brightness: typeof s.level === "number" ? s.level : null,
      };
    });
  },
  write: function (device, capability, value) {
    if (capability === "switch")
      return sendJson(baseUrl(device) + "/api/state", "POST", { on: !!value });
    if (capability === "brightness")
      return sendJson(baseUrl(device) + "/api/state", "POST", {
        level: Math.max(0, Math.min(100, Math.round(Number(value)))),
      });
    return unsupported("acme", capability);
  },
};
```

Then:

1. Add `acme` to the `protocols` array (order matters: more specific protocols first, generic ones last).
2. List the device in [`src/app/supported-devices.js`](../src/app/supported-devices.js) with `protocol: "acme"` so it
   shows up in the app's supported list.
3. Never put keys, tokens or passwords in the code. If the protocol needs pairing, store the secret per device with
   `nexusLan.secrets`.

## Tests are required

Every connector ships with packet and response format tests in `packages/web/src/lan-*.test.ts`. The browser file is
loaded with a fake `window` and a fake `fetch`, so no real device is needed. Use this as the starting point:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/lan-connectors.js"), "utf8");

type Fetch = (url: string, init?: any) => Promise<{ status: number; text: () => Promise<string> }>;

function load(fetchImpl: Fetch) {
  const win: Record<string, unknown> = {};
  new Function("window", "fetch", SOURCE)(win, fetchImpl);
  return (win as { nexusLan: any }).nexusLan;
}

const ok = (body: unknown) => ({ status: 200, text: () => Promise.resolve(JSON.stringify(body)) });
const notFound = { status: 404, text: () => Promise.resolve("") };

describe("ACME connector", () => {
  it("recognises the device and builds its profile", async () => {
    const lan = load((url) =>
      Promise.resolve(url.endsWith("/api/info") ? ok({ vendor: "acme", model: "A1", name: "Lamp" }) : notFound),
    );
    const found = await lan.identify("192.168.1.30");
    expect(found.protocol).toBe("acme");
    expect(found.kind).toBe("light");
  });

  it("rejects a host that is not an ACME device", async () => {
    const lan = load(() => Promise.resolve(notFound));
    await expect(lan.identify("192.168.1.31")).rejects.toThrow();
  });

  it("sends the documented command body", async () => {
    const sent: any[] = [];
    const lan = load((url, init) => {
      sent.push({ url, body: init?.body });
      return Promise.resolve(ok({}));
    });
    await lan.write({ host: "192.168.1.30", protocol: "acme" }, "brightness", 140);
    expect(JSON.parse(sent[0].body)).toEqual({ level: 100 }); // clamped to the documented range
  });

  it("reports unsupported capabilities instead of pretending", async () => {
    const lan = load(() => Promise.resolve(ok({})));
    await expect(
      lan.write({ host: "192.168.1.30", protocol: "acme" }, "color", "#ff0000"),
    ).rejects.toThrow();
  });
});
```

Adjust the assertions to what the real protocol requires, and cover the edge cases of that protocol (value ranges,
error responses, encodings). See the existing `lan-connectors.test.ts` and `lan-sensors.test.ts` for more examples.

## Before you open the pull request

- `pnpm test` and `pnpm typecheck` pass.
- The protocol documentation is linked, and the pull request states whether you tried a real device.
- `src/app/` is the only place you edit; `www/`, `desktop/app/` and the mobile assets are generated mirrors (run
  `node scripts/sync-www.mjs`, see [ARCHITECTURE.md](ARCHITECTURE.md)).
- The screen for the new device shows an honest state when the device is offline or the bridge is missing.
