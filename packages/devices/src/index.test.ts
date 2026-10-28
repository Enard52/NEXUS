import { describe, expect, it } from "vitest";
import {
  CapabilityError,
  DeviceManager,
  DeviceNameRegistry,
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

describe("DeviceNameRegistry", () => {
  it("rename sets a name and resolve returns the deviceId", () => {
    const reg = new DeviceNameRegistry();
    reg.rename("dev-1", "Aurora");
    expect(reg.resolve("Aurora")).toBe("dev-1");
  });

  it("resolve is case-insensitive", () => {
    const reg = new DeviceNameRegistry();
    reg.rename("dev-1", "Aurora");
    expect(reg.resolve("aurora")).toBe("dev-1");
    expect(reg.resolve("AURORA")).toBe("dev-1");
  });

  it("addAlias supports multiple aliases for the same device", () => {
    const reg = new DeviceNameRegistry();
    reg.rename("dev-1", "Aurora");
    reg.addAlias("dev-1", "My Lamp");
    expect(reg.resolve("aurora")).toBe("dev-1");
    expect(reg.resolve("my lamp")).toBe("dev-1");
    expect(reg.getAliases("dev-1")).toContain("aurora");
    expect(reg.getAliases("dev-1")).toContain("my lamp");
  });

  it("throws when assigning an alias already taken by another device", () => {
    const reg = new DeviceNameRegistry();
    reg.rename("dev-1", "Aurora");
    expect(() => reg.rename("dev-2", "Aurora")).toThrow(CapabilityError);
  });

  it("removeAlias removes the alias and returns true", () => {
    const reg = new DeviceNameRegistry();
    reg.rename("dev-1", "Aurora");
    expect(reg.removeAlias("Aurora")).toBe(true);
    expect(reg.resolve("Aurora")).toBeUndefined();
  });

  it("removeAlias returns false for non-existent alias", () => {
    const reg = new DeviceNameRegistry();
    expect(reg.removeAlias("ghost")).toBe(false);
  });

  it("allNames returns all registered mappings", () => {
    const reg = new DeviceNameRegistry();
    reg.rename("dev-1", "Aurora");
    reg.addAlias("dev-2", "Star");
    const all = reg.allNames();
    expect(all.size).toBe(2);
    expect(all.get("aurora")).toBe("dev-1");
    expect(all.get("star")).toBe("dev-2");
  });
});

describe("DeviceManager.findByName", () => {
  it("resolves a device by its registered alias", () => {
    const mgr = managerWithTwoConnectors();
    mgr.names.rename("dev-1", "Aurora");
    const found = mgr.findByName("aurora");
    expect(found).toBeDefined();
    expect(found!.id).toBe("dev-1");
  });

  it("returns undefined for unknown names", () => {
    const mgr = managerWithTwoConnectors();
    expect(mgr.findByName("ghost")).toBeUndefined();
  });
});
