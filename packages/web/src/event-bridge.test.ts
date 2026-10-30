import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SOURCE = readFileSync(resolve(REPO_ROOT, "src/app/event-bridge.js"), "utf8");

type Status = { devices: number; on: number; unread: number };
type Listener = (e?: { key?: string }) => void;

// Lightest possible stand-ins for the browser APIs the bridge touches.
function run(opts: {
  store?: Record<string, string>;
  desktop?: boolean;
  readyState?: string;
  updateStatus?: (s: Status) => void;
}) {
  const store = opts.store ?? {};
  const statuses: Status[] = [];
  const winListeners: Record<string, Listener[]> = {};
  const docListeners: Record<string, Listener[]> = {};
  const intervals: { fn: () => void; ms: number }[] = [];
  const win: Record<string, unknown> = {
    addEventListener: (t: string, fn: Listener) => (winListeners[t] ??= []).push(fn),
  };
  if (opts.desktop !== false) {
    win.nexusDesktop = {
      notifyEvent: () => {
        throw new Error("notifyEvent must not be called by the status bridge");
      },
      updateStatus:
        opts.updateStatus ??
        ((s: Status) => {
          statuses.push(s);
        }),
    };
  }
  const doc = {
    readyState: opts.readyState ?? "complete",
    addEventListener: (t: string, fn: Listener) => (docListeners[t] ??= []).push(fn),
  };
  new Function("window", "document", "nexusGetItem", "sessionStorage", "setInterval", SOURCE)(
    win,
    doc,
    (k: string) => (k in store ? store[k] : null),
    { getItem: () => null, setItem: () => undefined },
    (fn: () => void, ms: number) => intervals.push({ fn, ms }),
  );
  return { statuses, winListeners, docListeners, intervals, store };
}

describe("desktop event bridge", () => {
  it("does nothing outside the desktop app", () => {
    const r = run({ desktop: false });
    expect(r.statuses).toEqual([]);
    expect(r.intervals).toEqual([]);
    expect(r.winListeners).toEqual({});
  });

  it("reports an empty state when nothing is stored (no invented counts)", () => {
    const r = run({});
    expect(r.statuses).toEqual([{ devices: 0, on: 0, unread: 0 }]);
  });

  it("counts devices, devices that are on (switch === true only) and unread events", () => {
    const r = run({
      store: {
        nexusPairedDevices: JSON.stringify([
          { id: "a", state: { switch: true } },
          { id: "b", state: { switch: false } },
          { id: "c", state: { switch: "on" } },
          { id: "d" },
          null,
          { id: "e", state: { switch: true } },
        ]),
        nexusEvents: JSON.stringify([{ id: "e1" }, { id: "e2" }, { id: "e3" }, null]),
        nexusReadNotifs: JSON.stringify(["e2"]),
      },
    });
    // null entries still count as stored devices; they are just never "on"
    expect(r.statuses).toEqual([{ devices: 6, on: 2, unread: 2 }]);
  });

  it("falls back to empty lists for corrupt or non-array storage values", () => {
    const r = run({
      store: {
        nexusPairedDevices: "{not json",
        nexusEvents: JSON.stringify({ id: "x" }),
        nexusReadNotifs: "7",
      },
    });
    expect(r.statuses).toEqual([{ devices: 0, on: 0, unread: 0 }]);
  });

  it("refreshes on relevant storage keys only, and on window focus", () => {
    const store: Record<string, string> = {};
    const r = run({ store });
    expect(r.statuses).toHaveLength(1);
    const onStorage = r.winListeners.storage[0];
    onStorage({ key: "somethingElse" });
    expect(r.statuses).toHaveLength(1);

    store.nexusPairedDevices = JSON.stringify([{ state: { switch: true } }]);
    onStorage({ key: "nexusPairedDevices" });
    expect(r.statuses.at(-1)).toEqual({ devices: 1, on: 1, unread: 0 });

    store.nexusEvents = JSON.stringify([{ id: "n1" }]);
    onStorage({ key: "nexusEvents" });
    expect(r.statuses.at(-1)).toEqual({ devices: 1, on: 1, unread: 1 });

    store.nexusReadNotifs = JSON.stringify(["n1"]);
    onStorage({ key: "nexusReadNotifs" });
    expect(r.statuses.at(-1)).toEqual({ devices: 1, on: 1, unread: 0 });

    const before = r.statuses.length;
    r.winListeners.focus[0]();
    expect(r.statuses).toHaveLength(before + 1);
  });

  it("polls every 3 seconds so same-tab writes are picked up", () => {
    const store: Record<string, string> = {};
    const r = run({ store });
    expect(r.intervals.map((i) => i.ms)).toEqual([3000]);
    store.nexusPairedDevices = JSON.stringify([{}, {}]);
    r.intervals[0].fn();
    expect(r.statuses.at(-1)).toEqual({ devices: 2, on: 0, unread: 0 });
  });

  it("waits for DOMContentLoaded while the document is still loading", () => {
    const r = run({ readyState: "loading" });
    expect(r.statuses).toEqual([]);
    r.docListeners.DOMContentLoaded[0]();
    expect(r.statuses).toHaveLength(1);
  });

  it("swallows errors thrown by the main process call (background task stays silent)", () => {
    const r = run({
      updateStatus: () => {
        throw new Error("ipc closed");
      },
    });
    expect(() => r.intervals[0].fn()).not.toThrow();
    expect(() => r.winListeners.focus[0]()).not.toThrow();
  });
});
