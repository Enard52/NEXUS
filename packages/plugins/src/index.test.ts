import { describe, expect, it } from "vitest";
import type { UniversalDevice } from "@nexus/devices";
import { definePlugin, implemented, moduleName, PluginError, PluginRegistry } from "./index.js";

const bulb: UniversalDevice = {
  id: "lamp-1",
  name: "Corner Lamp",
  room: "living",
  capabilities: [{ kind: "switch", value: false }],
};

describe("PluginRegistry (FAZ 16)", () => {
  it("registers a plugin and exposes its manifest in the catalog", () => {
    const registry = new PluginRegistry();
    registry.register(
      definePlugin(
        {
          id: "generic-lan",
          name: "Generic LAN",
          vendor: "lan",
          version: "1.0.0",
          capabilities: ["switch"],
          premium: false,
        },
        [bulb],
      ),
    );
    expect(registry.has("generic-lan")).toBe(true);
    expect(registry.list()).toHaveLength(1);
    expect(registry.list()[0]!.vendor).toBe("lan");
  });

  it("refuses to register the same plugin id twice", () => {
    const registry = new PluginRegistry();
    const plugin = definePlugin({
      id: "dup",
      name: "Dup",
      vendor: "x",
      version: "1.0.0",
      capabilities: [],
      premium: false,
    });
    registry.register(plugin);
    expect(() => registry.register(plugin)).toThrow(PluginError);
  });

  it("instantiates a brand-agnostic Connector that discovers its seeded devices", () => {
    const registry = new PluginRegistry();
    registry.register(
      definePlugin(
        {
          id: "matter",
          name: "Matter",
          vendor: "matter",
          version: "1.0.0",
          capabilities: ["switch"],
          premium: false,
        },
        [bulb],
      ),
    );
    const connector = registry.get("matter")!.create();
    expect(connector.id).toBe("matter");
    expect(connector.discover()).toHaveLength(1);
    expect(connector.supports("lamp-1")).toBe(true);
  });
});

describe("@nexus/plugins module identity", () => {
  it("reports itself implemented", () => {
    expect(moduleName).toBe("plugins");
    expect(implemented).toBe(true);
  });
});
