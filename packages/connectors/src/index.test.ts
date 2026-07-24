import { describe, expect, it } from "vitest";
import { DeviceManager, type UniversalDevice } from "@nexus/devices";
import { definePlugin, PluginRegistry } from "@nexus/plugins";
import { ConnectorStore, implemented, moduleName, StoreError } from "./index.js";

const freeDevice: UniversalDevice = {
  id: "free-lamp",
  name: "Basic Lamp",
  room: "living",
  capabilities: [{ kind: "switch", value: false }],
};

const premiumDevice: UniversalDevice = {
  id: "pro-thermostat",
  name: "Pro Thermostat",
  room: "living",
  capabilities: [{ kind: "brightness", value: 50, min: 0, max: 100 }],
};

function seededStore() {
  const registry = new PluginRegistry();
  registry.register(
    definePlugin(
      {
        id: "basic",
        name: "Basic",
        vendor: "lan",
        version: "1.0.0",
        capabilities: ["switch"],
        premium: false,
      },
      [freeDevice],
    ),
  );
  registry.register(
    definePlugin(
      {
        id: "pro",
        name: "Pro",
        vendor: "cloud",
        version: "1.0.0",
        capabilities: ["brightness"],
        premium: true,
      },
      [premiumDevice],
    ),
  );
  const devices = new DeviceManager();
  return { store: new ConnectorStore(registry, devices), devices };
}

describe("ConnectorStore install/uninstall (FAZ 16)", () => {
  it("installs a free connector and wires its devices into the manager", () => {
    const { store, devices } = seededStore();
    store.install("basic", "free");
    expect(store.isInstalled("basic")).toBe(true);
    expect(devices.discoverAll().map((d) => d.id)).toContain("free-lamp");
  });

  it("uninstalls a connector and removes its devices", () => {
    const { store, devices } = seededStore();
    store.install("basic", "free");
    expect(store.uninstall("basic")).toBe(true);
    expect(store.isInstalled("basic")).toBe(false);
    expect(devices.discoverAll()).toHaveLength(0);
  });

  it("is idempotent on repeated install and no-op on unknown uninstall", () => {
    const { store } = seededStore();
    store.install("basic", "free");
    store.install("basic", "free");
    expect(store.listInstalled()).toEqual(["basic"]);
    expect(store.uninstall("nope")).toBe(false);
  });

  it("throws for an unknown connector id", () => {
    const { store } = seededStore();
    expect(() => store.install("ghost", "premium")).toThrow(StoreError);
  });
});

describe("premium entitlement gating (FAZ 15 x 16)", () => {
  it("blocks a premium connector on the Free plan", () => {
    const { store } = seededStore();
    expect(() => store.install("pro", "free")).toThrow(StoreError);
    expect(store.isInstalled("pro")).toBe(false);
  });

  it("allows a premium connector on paid plans", () => {
    const { store } = seededStore();
    store.install("pro", "premium");
    expect(store.isInstalled("pro")).toBe(true);
  });

  it("marks premium entries locked in the Free catalog but not on family", () => {
    const { store } = seededStore();
    const free = store.catalog("free");
    expect(free.find((e) => e.manifest.id === "pro")!.locked).toBe(true);
    expect(free.find((e) => e.manifest.id === "basic")!.locked).toBe(false);

    const family = store.catalog("family");
    expect(family.find((e) => e.manifest.id === "pro")!.locked).toBe(false);
  });
});

describe("@nexus/connectors module identity", () => {
  it("reports itself implemented", () => {
    expect(moduleName).toBe("connectors");
    expect(implemented).toBe(true);
  });
});
