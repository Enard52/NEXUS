import { describe, expect, it } from "vitest";
import {
  CapabilityError,
  DeviceManager,
  InMemoryConnector,
  implemented,
  moduleName,
  type UniversalDevice,
} from "./index.js";

const lamp: UniversalDevice = {
  id: "dev-1",
  name: "Living Lamp",
  room: "living",
  capabilities: [
    { kind: "switch", value: false },
    { kind: "brightness", value: 50, min: 0, max: 100 },
  ],
};

const plug: UniversalDevice = {
  id: "dev-2",
  name: "Kitchen Plug",
  room: "kitchen",
  capabilities: [{ kind: "switch", value: false }],
};

function managerWithTwoConnectors() {
  const mgr = new DeviceManager();
  mgr.registerConnector(new InMemoryConnector("connector-a", [lamp]));
  mgr.registerConnector(new InMemoryConnector("connector-b", [plug]));
  return mgr;
}

describe("@nexus/devices module identity", () => {
  it("reports itself as implemented", () => {
    expect(moduleName).toBe("devices");
    expect(implemented).toBe(true);
  });
});

describe("DeviceManager (FAZ 4)", () => {
  it("discovers devices across multiple connectors", () => {
    const mgr = managerWithTwoConnectors();
    expect(
      mgr
        .discoverAll()
        .map((d) => d.id)
        .sort(),
    ).toEqual(["dev-1", "dev-2"]);
  });

  it("routes a command to the connector that owns the device", () => {
    const mgr = managerWithTwoConnectors();
    const result = mgr.execute({ deviceId: "dev-2", capability: "switch", value: true });
    expect(result.ok).toBe(true);
    expect(result.device.capabilities.find((c) => c.kind === "switch")!.value).toBe(true);
  });

  it("validates numeric capability ranges", () => {
    const mgr = managerWithTwoConnectors();
    const bad = mgr.execute({ deviceId: "dev-1", capability: "brightness", value: 150 });
    expect(bad.ok).toBe(false);
    expect(bad.message).toContain("out of range");
  });

  it("throws when no connector owns the target device", () => {
    const mgr = managerWithTwoConnectors();
    expect(() => mgr.execute({ deviceId: "ghost", capability: "switch", value: true })).toThrow(
      CapabilityError,
    );
  });

  it("adding a new brand connector requires no manager code change", () => {
    const mgr = managerWithTwoConnectors();
    const thermostat: UniversalDevice = {
      id: "dev-3",
      name: "Bedroom Thermostat",
      room: "bedroom",
      capabilities: [{ kind: "colorTemp", value: 2700, min: 2200, max: 6500 }],
    };
    mgr.registerConnector(new InMemoryConnector("connector-c", [thermostat]));
    expect(mgr.findByRoomCapability("bedroom", "colorTemp")?.id).toBe("dev-3");
  });
});
