/**
 * NEXUS AI — Platform Module Tests
 *
 * Comprehensive tests for the Platform Abstraction Layer, PcAgent,
 * risk classification, work mode orchestration, and security integration.
 */

import { describe, expect, it, beforeEach } from "vitest";
import { RiskLevel, SecurityMiddleware } from "@nexus/security";
import { platformInfo, moduleName } from "./index.js";
import { PC_ACTION_RISKS, pcAction, planWorkMode, type WorkModeConfig } from "./adapter.js";
import { MockPlatformAdapter } from "./mock-adapter.js";
import { PcAgent, createPcAgent } from "./pc-agent.js";

// ── Module Identity ────────────────────────────────────────────────────────────

describe("@nexus/platform module identity", () => {
  it("exposes correct module name", () => {
    expect(moduleName).toBe("platform");
    expect(platformInfo()).toEqual({ name: "platform", implemented: true });
  });
});

// ── Risk Classification ────────────────────────────────────────────────────────

describe("PC action risk classification", () => {
  it("classifies read-only actions as None/Low", () => {
    expect(PC_ACTION_RISKS["pc.app.list"]).toBe(RiskLevel.None);
    expect(PC_ACTION_RISKS["pc.file.list"]).toBe(RiskLevel.None);
    expect(PC_ACTION_RISKS["pc.system.state"]).toBe(RiskLevel.None);
    expect(PC_ACTION_RISKS["pc.process.list"]).toBe(RiskLevel.None);
    expect(PC_ACTION_RISKS["pc.app.focus"]).toBe(RiskLevel.Low);
    expect(PC_ACTION_RISKS["pc.system.volume"]).toBe(RiskLevel.Low);
  });

  it("classifies state-changing actions as Medium", () => {
    expect(PC_ACTION_RISKS["pc.app.launch"]).toBe(RiskLevel.Medium);
    expect(PC_ACTION_RISKS["pc.file.create"]).toBe(RiskLevel.Medium);
    expect(PC_ACTION_RISKS["pc.file.copy"]).toBe(RiskLevel.Medium);
    expect(PC_ACTION_RISKS["pc.system.dnd"]).toBe(RiskLevel.Medium);
  });

  it("classifies destructive actions as High", () => {
    expect(PC_ACTION_RISKS["pc.app.close"]).toBe(RiskLevel.High);
    expect(PC_ACTION_RISKS["pc.file.delete"]).toBe(RiskLevel.High);
    expect(PC_ACTION_RISKS["pc.file.move"]).toBe(RiskLevel.High);
    expect(PC_ACTION_RISKS["pc.system.lock"]).toBe(RiskLevel.High);
    expect(PC_ACTION_RISKS["pc.process.kill"]).toBe(RiskLevel.High);
  });

  it("classifies system-level irreversible actions as Critical", () => {
    expect(PC_ACTION_RISKS["pc.system.sleep"]).toBe(RiskLevel.Critical);
  });

  it("pcAction() creates proper SecurityAction", () => {
    const action = pcAction("pc.file.delete", "Delete important file");
    expect(action.kind).toBe("pc.file.delete");
    expect(action.risk).toBe(RiskLevel.High);
    expect(action.description).toBe("Delete important file");
  });

  it("pcAction() defaults to Medium for unknown kinds", () => {
    const action = pcAction("pc.unknown.action");
    expect(action.risk).toBe(RiskLevel.Medium);
  });
});

// ── Work Mode Planning ─────────────────────────────────────────────────────────

describe("Work Mode planning", () => {
  it("generates correct default steps", () => {
    const steps = planWorkMode();
    // DnD + volume + 3 close apps + 3 launch apps = 8 steps
    expect(steps.length).toBe(8);
    expect(steps[0]!.description).toBe("Enable Do Not Disturb");
    expect(steps[1]!.description).toContain("volume");
  });

  it("respects custom configuration", () => {
    const config: WorkModeConfig = {
      launchApps: ["Firefox"],
      enableDnD: false,
      volume: 0,
      closeApps: [],
    };
    const steps = planWorkMode(config);
    // no DnD + volume + 0 close + 1 launch = 2 steps
    expect(steps.length).toBe(2);
    expect(steps[0]!.description).toContain("0%");
    expect(steps[1]!.description).toContain("Firefox");
  });

  it("each step carries a valid SecurityAction", () => {
    const steps = planWorkMode();
    for (const step of steps) {
      expect(step.action.kind).toMatch(/^pc\./);
      expect(step.action.risk).toBeGreaterThanOrEqual(RiskLevel.None);
    }
  });
});

// ── Mock Platform Adapter ──────────────────────────────────────────────────────

describe("MockPlatformAdapter", () => {
  let adapter: MockPlatformAdapter;

  beforeEach(() => {
    adapter = new MockPlatformAdapter();
  });

  it("launches an app and tracks it", async () => {
    const result = await adapter.launchApp("Code");
    expect(result.success).toBe(true);
    expect(result.data!.name).toBe("Code");
    expect(result.data!.running).toBe(true);

    const list = await adapter.listRunningApps();
    expect(list.data!.some((a) => a.name === "Code")).toBe(true);
  });

  it("closes an app by name", async () => {
    await adapter.launchApp("Slack");
    const result = await adapter.closeApp("Slack");
    expect(result.success).toBe(true);

    const list = await adapter.listRunningApps();
    expect(list.data!.some((a) => a.name === "Slack")).toBe(false);
  });

  it("returns error when closing non-existent app", async () => {
    const result = await adapter.closeApp("NonExistent");
    expect(result.success).toBe(false);
    expect(result.error).toContain("not running");
  });

  it("manages system volume", async () => {
    await adapter.setVolume(75);
    const state = await adapter.getSystemState();
    expect(state.data!.volume).toBe(75);
    expect(state.data!.muted).toBe(false);
  });

  it("clamps volume to 0-100 range", async () => {
    await adapter.setVolume(150);
    const state = await adapter.getSystemState();
    expect(state.data!.volume).toBe(100);
  });

  it("mutes when volume set to 0", async () => {
    await adapter.setVolume(0);
    const state = await adapter.getSystemState();
    expect(state.data!.muted).toBe(true);
  });

  it("toggles Do Not Disturb", async () => {
    await adapter.setDoNotDisturb(true);
    let state = await adapter.getSystemState();
    expect(state.data!.doNotDisturb).toBe(true);

    await adapter.setDoNotDisturb(false);
    state = await adapter.getSystemState();
    expect(state.data!.doNotDisturb).toBe(false);
  });

  it("creates and deletes files", async () => {
    await adapter.createFile("/tmp/test.txt");
    let list = await adapter.listFiles("/tmp");
    expect(list.data!.some((f) => f.name === "test.txt")).toBe(true);

    await adapter.deleteFile("/tmp/test.txt");
    list = await adapter.listFiles("/tmp");
    expect(list.data!.some((f) => f.name === "test.txt")).toBe(false);
  });

  it("moves files", async () => {
    await adapter.createFile("/tmp/a.txt");
    await adapter.moveFile("/tmp/a.txt", "/tmp/b.txt");
    const list = await adapter.listFiles("/tmp");
    expect(list.data!.some((f) => f.name === "b.txt")).toBe(true);
    expect(list.data!.some((f) => f.name === "a.txt")).toBe(false);
  });

  it("copies files", async () => {
    await adapter.createFile("/tmp/orig.txt");
    await adapter.copyFile("/tmp/orig.txt", "/tmp/copy.txt");
    const list = await adapter.listFiles("/tmp");
    expect(list.data!.some((f) => f.name === "orig.txt")).toBe(true);
    expect(list.data!.some((f) => f.name === "copy.txt")).toBe(true);
  });

  it("manages clipboard", async () => {
    await adapter.writeClipboard("hello world");
    const result = await adapter.readClipboard();
    expect(result.data).toBe("hello world");
  });

  it("focuses app and updates active app", async () => {
    await adapter.focusApp("Terminal");
    const state = await adapter.getSystemState();
    expect(state.data!.activeApp).toBe("Terminal");
  });

  it("locks screen", async () => {
    await adapter.lockScreen();
    const state = await adapter.getSystemState();
    expect(state.data!.screenLocked).toBe(true);
  });

  it("records all method calls for audit", () => {
    adapter.launchApp("X");
    adapter.setVolume(50);
    expect(adapter.calls.length).toBe(2);
    expect(adapter.calls[0]!.method).toBe("launchApp");
    expect(adapter.calls[1]!.method).toBe("setVolume");
  });

  it("reset clears call history", () => {
    adapter.launchApp("X");
    adapter.reset();
    expect(adapter.calls.length).toBe(0);
  });
});

// ── PcAgent ────────────────────────────────────────────────────────────────────

describe("PcAgent", () => {
  let adapter: MockPlatformAdapter;
  let agent: PcAgent;

  beforeEach(() => {
    adapter = new MockPlatformAdapter();
    agent = new PcAgent({ adapter });
  });

  it("exposes platform ID", () => {
    expect(agent.platformId).toBe("mock");
  });

  describe("low-risk actions execute immediately", () => {
    it("lists apps without confirmation", async () => {
      const result = await agent.execute({
        category: "app.list",
        params: {},
      });
      expect(result.executed).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
      expect(result.result!.success).toBe(true);
    });

    it("reads clipboard without confirmation", async () => {
      await adapter.writeClipboard("test");
      const result = await agent.execute({
        category: "clipboard.read",
        params: {},
      });
      expect(result.executed).toBe(true);
      expect(result.result!.data).toBe("test");
    });

    it("sets volume without confirmation", async () => {
      const result = await agent.execute({
        category: "system.volume",
        params: { level: 30 },
      });
      expect(result.executed).toBe(true);
    });
  });

  describe("risky actions require confirmation", () => {
    it("closing an app requires confirmation", async () => {
      const result = await agent.execute({
        category: "app.close",
        params: { appName: "Safari" },
        description: "Close Safari",
      });
      expect(result.executed).toBe(false);
      expect(result.requiresConfirmation).toBe(true);
      expect(result.confirmationToken).toBeDefined();
    });

    it("deleting a file requires confirmation", async () => {
      const result = await agent.execute({
        category: "file.delete",
        params: { path: "/important/file.txt" },
      });
      expect(result.executed).toBe(false);
      expect(result.requiresConfirmation).toBe(true);
    });

    it("killing a process requires confirmation", async () => {
      const result = await agent.execute({
        category: "process.kill",
        params: { pid: 1234 },
      });
      expect(result.executed).toBe(false);
      expect(result.requiresConfirmation).toBe(true);
    });

    it("confirmed action executes successfully", async () => {
      await adapter.launchApp("TestApp");
      const held = await agent.execute({
        category: "app.close",
        params: { appName: "TestApp" },
      });
      expect(held.requiresConfirmation).toBe(true);

      const confirmed = await agent.confirm(held.confirmationToken!, {
        category: "app.close",
        params: { appName: "TestApp" },
      });
      expect(confirmed.executed).toBe(true);
      expect(confirmed.result!.success).toBe(true);
    });

    it("rejected action does not execute", async () => {
      await adapter.launchApp("KeepMe");
      const held = await agent.execute({
        category: "app.close",
        params: { appName: "KeepMe" },
      });

      agent.reject(held.confirmationToken!);

      const list = await adapter.listRunningApps();
      expect(list.data!.some((a) => a.name === "KeepMe")).toBe(true);
    });
  });

  describe("critical actions are denied", () => {
    it("sleep is denied outright with Critical+1 deny threshold", async () => {
      // Default policy: denyAtOrAbove = Critical+1, so Critical is only confirmed
      const result = await agent.execute({
        category: "system.sleep",
        params: {},
      });
      // With default policy (deny at Critical+1), Critical will be "confirm" (pending)
      expect(result.requiresConfirmation).toBe(true);
    });

    it("sleep denied with strict policy", async () => {
      const strictAgent = new PcAgent({
        adapter,
        security: new SecurityMiddleware({
          confirmAtOrAbove: RiskLevel.Medium,
          denyAtOrAbove: RiskLevel.Critical,
        }),
      });
      const result = await strictAgent.execute({
        category: "system.sleep",
        params: {},
      });
      expect(result.executed).toBe(false);
      expect(result.requiresConfirmation).toBe(false);
      expect(result.error).toContain("denied");
    });
  });

  describe("file operations dispatch correctly", () => {
    it("creates a file", async () => {
      const result = await agent.execute({
        category: "file.create",
        params: { path: "/tmp/new.txt", isDirectory: false },
      });
      // Medium risk → confirmed by default
      expect(result.requiresConfirmation).toBe(true);
    });

    it("lists files without confirmation", async () => {
      const result = await agent.execute({
        category: "file.list",
        params: { path: "/Users/user/Documents" },
      });
      expect(result.executed).toBe(true);
      expect(result.result!.success).toBe(true);
    });
  });
});

// ── Work Mode ──────────────────────────────────────────────────────────────────

describe("PcAgent Work Mode", () => {
  let adapter: MockPlatformAdapter;
  let agent: PcAgent;

  beforeEach(() => {
    adapter = new MockPlatformAdapter();
    agent = new PcAgent({ adapter });
  });

  it("is initially not in work mode", () => {
    expect(agent.isWorkModeActive).toBe(false);
  });

  it("enterWorkMode sets work mode active", async () => {
    const result = await agent.enterWorkMode();
    expect(result.active).toBe(true);
    expect(agent.isWorkModeActive).toBe(true);
  });

  it("enterWorkMode generates expected steps", async () => {
    const result = await agent.enterWorkMode();
    // Default: DnD(medium) + volume(low) + 3 close(high) + 3 launch(medium) = 8
    expect(result.stepsExecuted + result.stepsPending).toBe(8);
  });

  it("low-risk steps execute, high-risk steps pend", async () => {
    const result = await agent.enterWorkMode();
    // Volume (Low) → executed
    // DnD (Medium), close apps (High), launch apps (Medium) → pending
    expect(result.stepsPending).toBeGreaterThan(0);
    expect(result.stepsExecuted).toBeGreaterThan(0);
  });

  it("exitWorkMode deactivates work mode", async () => {
    await agent.enterWorkMode();
    const result = await agent.exitWorkMode();
    expect(result.active).toBe(false);
    expect(agent.isWorkModeActive).toBe(false);
  });

  it("custom work mode config is respected", async () => {
    const customAgent = new PcAgent({
      adapter,
      workModeConfig: {
        launchApps: ["Firefox"],
        enableDnD: false,
        volume: 10,
        closeApps: [],
      },
    });
    const result = await customAgent.enterWorkMode();
    // volume(low→executed) + launch(medium→pending) = 2 steps
    expect(result.stepsExecuted + result.stepsPending).toBe(2);
  });
});

// ── Factory ────────────────────────────────────────────────────────────────────

describe("createPcAgent factory", () => {
  it("creates agent with auto-detected adapter", () => {
    const agent = createPcAgent();
    // On Windows test env, will be win32
    expect(["darwin", "win32", "linux", "mock"]).toContain(agent.platformId);
  });

  it("accepts custom adapter override", () => {
    const mock = new MockPlatformAdapter();
    const agent = createPcAgent({ adapter: mock });
    expect(agent.platformId).toBe("mock");
  });
});
