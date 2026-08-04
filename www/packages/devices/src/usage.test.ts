import { describe, expect, it } from "vitest";
import { summarizeUsage, type UsageEntry } from "./index.js";

const entries: UsageEntry[] = [
  { deviceId: "ac", name: "AC", room: "living", watts: 1200, onMinutes: 120 }, // 2400 Wh
  { deviceId: "lamp", name: "Lamp", room: "living", watts: 10, onMinutes: 300 }, // 50 Wh
  { deviceId: "tv", name: "TV", room: "living", watts: 90, onMinutes: 180 }, // 270 Wh
];

describe("@nexus/devices usage & energy summary", () => {
  it("estimates per-device energy as watts × hours", () => {
    const summary = summarizeUsage(entries);
    const ac = summary.devices.find((d) => d.deviceId === "ac")!;
    expect(ac.energyWh).toBe(2400);
    const lamp = summary.devices.find((d) => d.deviceId === "lamp")!;
    expect(lamp.energyWh).toBe(50);
  });

  it("totals on-time and energy across the home", () => {
    const summary = summarizeUsage(entries);
    expect(summary.totalOnMinutes).toBe(600);
    expect(summary.totalEnergyWh).toBe(2720);
  });

  it("identifies the top consumer and sorts highest-first", () => {
    const summary = summarizeUsage(entries);
    expect(summary.topConsumer?.deviceId).toBe("ac");
    expect(summary.devices[0].deviceId).toBe("ac");
    expect(summary.devices.at(-1)?.deviceId).toBe("lamp");
  });

  it("reports no top consumer for an idle home", () => {
    const summary = summarizeUsage([
      { deviceId: "x", name: "X", room: "a", watts: 100, onMinutes: 0 },
    ]);
    expect(summary.totalEnergyWh).toBe(0);
    expect(summary.topConsumer).toBeUndefined();
  });
});
