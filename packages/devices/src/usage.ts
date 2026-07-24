/**
 * NEXUS AI — Device usage & energy summary
 *
 * Inspired by the energy dashboards in Samsung SmartThings and Home Assistant:
 * turn raw device on-time into a per-device and whole-home energy picture the
 * "Today" screen (FAZ 10) can surface. Brand-agnostic — it works off Universal
 * Capability devices, not any vendor's cloud.
 *
 * Deterministic and dependency-free: on-durations and power ratings are inputs,
 * so no clock or live meter is needed to test it. Energy is a transparent
 * estimate (watts × hours); a real smart plug meter can replace the estimate
 * later without changing this shape.
 */

export interface UsageEntry {
  readonly deviceId: string;
  readonly name: string;
  readonly room: string;
  /** Nominal power draw while on, in watts. */
  readonly watts: number;
  /** Minutes the device was on over the period. */
  readonly onMinutes: number;
}

export interface DeviceUsage {
  readonly deviceId: string;
  readonly name: string;
  readonly room: string;
  readonly onMinutes: number;
  /** Estimated energy in watt-hours, rounded to a whole number. */
  readonly energyWh: number;
}

export interface UsageSummary {
  readonly devices: readonly DeviceUsage[];
  readonly totalOnMinutes: number;
  readonly totalEnergyWh: number;
  /** The single biggest energy consumer, when there is any usage. */
  readonly topConsumer?: DeviceUsage;
}

function energyWh(watts: number, onMinutes: number): number {
  return Math.round((Math.max(0, watts) * Math.max(0, onMinutes)) / 60);
}

/** Aggregate raw usage entries into a per-device + whole-home energy summary. */
export function summarizeUsage(entries: readonly UsageEntry[]): UsageSummary {
  const devices: DeviceUsage[] = entries.map((e) => ({
    deviceId: e.deviceId,
    name: e.name,
    room: e.room,
    onMinutes: Math.max(0, e.onMinutes),
    energyWh: energyWh(e.watts, e.onMinutes),
  }));

  const totalOnMinutes = devices.reduce((sum, d) => sum + d.onMinutes, 0);
  const totalEnergyWh = devices.reduce((sum, d) => sum + d.energyWh, 0);

  let topConsumer: DeviceUsage | undefined;
  for (const d of devices) {
    if (d.energyWh > 0 && (!topConsumer || d.energyWh > topConsumer.energyWh)) {
      topConsumer = d;
    }
  }

  // Present highest-consuming devices first for the dashboard.
  const sorted = [...devices].sort((a, b) => b.energyWh - a.energyWh);
  return { devices: sorted, totalOnMinutes, totalEnergyWh, topConsumer };
}
