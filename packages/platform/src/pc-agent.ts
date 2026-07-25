/**
 * NEXUS AI — PC Agent (FAZ 3)
 *
 * The PC Agent is the orchestration layer that translates user intents
 * (natural-language or structured) into platform-specific operations.
 * Every operation goes through the Security Engine; risky actions require
 * explicit user confirmation before execution.
 *
 * Key responsibilities:
 *  - Intent classification (what action category + parameters)
 *  - Risk-aware execution (via SecurityMiddleware)
 *  - Work Mode orchestration (multi-step scenario)
 *  - Audit trail of all executed platform commands
 */

import { SecurityMiddleware } from "@nexus/security";
import {
  type PlatformAdapter,
  type PlatformResult,
  type WorkModeConfig,
  type WorkModeStep,
  pcAction,
  planWorkMode,
  DEFAULT_WORK_MODE,
} from "./adapter.js";

// ── Intent Types ───────────────────────────────────────────────────────────────

export type PcIntentCategory =
  | "app.launch"
  | "app.close"
  | "app.focus"
  | "app.list"
  | "file.list"
  | "file.create"
  | "file.delete"
  | "file.move"
  | "file.copy"
  | "file.open"
  | "system.state"
  | "system.volume"
  | "system.brightness"
  | "system.dnd"
  | "system.sleep"
  | "system.lock"
  | "system.notify"
  | "clipboard.read"
  | "clipboard.write"
  | "process.list"
  | "process.kill"
  | "workmode.enter"
  | "workmode.exit";

export interface PcIntent {
  readonly category: PcIntentCategory;
  readonly params: Record<string, unknown>;
  /** Optional user-readable description of what will happen. */
  readonly description?: string;
}

// ── Agent Result Types ─────────────────────────────────────────────────────────

export interface PcAgentResult {
  readonly intent: PcIntent;
  readonly executed: boolean;
  readonly requiresConfirmation: boolean;
  readonly confirmationToken?: string;
  readonly result?: PlatformResult<unknown>;
  readonly error?: string;
}

export interface WorkModeResult {
  readonly active: boolean;
  readonly stepsExecuted: number;
  readonly stepsPending: number;
  readonly results: PcAgentResult[];
}

// ── PC Agent Class ─────────────────────────────────────────────────────────────

export interface PcAgentDeps {
  readonly adapter: PlatformAdapter;
  readonly security?: SecurityMiddleware;
  readonly workModeConfig?: WorkModeConfig;
}

export class PcAgent {
  private readonly adapter: PlatformAdapter;
  private readonly security: SecurityMiddleware;
  private readonly workModeConfig: WorkModeConfig;
  private workModeActive = false;

  constructor(deps: PcAgentDeps) {
    this.adapter = deps.adapter;
    this.security = deps.security ?? new SecurityMiddleware();
    this.workModeConfig = deps.workModeConfig ?? DEFAULT_WORK_MODE;
  }

  /** Get the underlying platform adapter ID (darwin/win32/linux/mock). */
  get platformId() {
    return this.adapter.id;
  }

  /** Whether work mode is currently active. */
  get isWorkModeActive() {
    return this.workModeActive;
  }

  // ── Intent Execution ───────────────────────────────────────────────────────

  /**
   * Execute a PC intent through the security pipeline.
   * Returns immediately if the action is allowed; returns a confirmation
   * token if the action is risky and requires user approval.
   */
  async execute(intent: PcIntent): Promise<PcAgentResult> {
    const actionKind = `pc.${intent.category}`;
    const action = pcAction(actionKind, intent.description);

    // Use guard with a no-op to get the security decision, then dispatch if allowed.
    const guardResult = this.security.guard(action, () => "__allowed__");

    if (guardResult.status === "executed") {
      // Action was allowed — now dispatch the real async platform call
      const result = await this.dispatch(intent);
      return {
        intent,
        executed: true,
        requiresConfirmation: false,
        result,
      };
    }

    if (guardResult.status === "pending") {
      return {
        intent,
        executed: false,
        requiresConfirmation: true,
        confirmationToken: guardResult.approval!.token,
      };
    }

    // denied
    return {
      intent,
      executed: false,
      requiresConfirmation: false,
      error: `Action denied: ${guardResult.reason}`,
    };
  }

  /**
   * Confirm a previously held action and execute it.
   */
  async confirm(token: string, intent: PcIntent): Promise<PcAgentResult> {
    try {
      this.security.approve(token, () => {});
      const result = await this.dispatch(intent);
      return {
        intent,
        executed: true,
        requiresConfirmation: false,
        result,
      };
    } catch (err: unknown) {
      return {
        intent,
        executed: false,
        requiresConfirmation: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Reject a pending confirmation.
   */
  reject(token: string): void {
    this.security.reject(token);
  }

  // ── Work Mode ──────────────────────────────────────────────────────────────

  /**
   * Enter work mode: execute a sequence of platform actions to set up
   * a focused work environment. Risky steps still require confirmation.
   */
  async enterWorkMode(config?: WorkModeConfig): Promise<WorkModeResult> {
    const steps = planWorkMode(config ?? this.workModeConfig);
    const results: PcAgentResult[] = [];
    let pending = 0;

    for (const step of steps) {
      const intent = this.stepToIntent(step);
      const result = await this.execute(intent);
      results.push(result);
      if (result.requiresConfirmation) pending++;
    }

    this.workModeActive = true;

    return {
      active: true,
      stepsExecuted: results.filter((r) => r.executed).length,
      stepsPending: pending,
      results,
    };
  }

  /**
   * Exit work mode: restore normal settings.
   */
  async exitWorkMode(): Promise<WorkModeResult> {
    const results: PcAgentResult[] = [];

    // Disable DnD
    const dndResult = await this.execute({
      category: "system.dnd",
      params: { enabled: false },
      description: "Disable Do Not Disturb (exit work mode)",
    });
    results.push(dndResult);

    // Restore volume
    const volResult = await this.execute({
      category: "system.volume",
      params: { level: 50 },
      description: "Restore volume to 50% (exit work mode)",
    });
    results.push(volResult);

    this.workModeActive = false;

    return {
      active: false,
      stepsExecuted: results.filter((r) => r.executed).length,
      stepsPending: results.filter((r) => r.requiresConfirmation).length,
      results,
    };
  }

  // ── Internal Dispatch ──────────────────────────────────────────────────────

  private async dispatch(intent: PcIntent): Promise<PlatformResult<unknown>> {
    const p = intent.params;
    switch (intent.category) {
      // App
      case "app.launch":
        return this.adapter.launchApp(p.appName as string);
      case "app.close":
        return this.adapter.closeApp(p.appName as string);
      case "app.focus":
        return this.adapter.focusApp(p.appName as string);
      case "app.list":
        return this.adapter.listRunningApps();

      // File
      case "file.list":
        return this.adapter.listFiles(p.path as string);
      case "file.create":
        return this.adapter.createFile(p.path as string, p.isDirectory as boolean | undefined);
      case "file.delete":
        return this.adapter.deleteFile(p.path as string);
      case "file.move":
        return this.adapter.moveFile(p.source as string, p.destination as string);
      case "file.copy":
        return this.adapter.copyFile(p.source as string, p.destination as string);
      case "file.open":
        return this.adapter.openFile(p.path as string);

      // System
      case "system.state":
        return this.adapter.getSystemState();
      case "system.volume":
        return this.adapter.setVolume(p.level as number);
      case "system.brightness":
        return this.adapter.setBrightness(p.level as number);
      case "system.dnd":
        return this.adapter.setDoNotDisturb(p.enabled as boolean);
      case "system.sleep":
        return this.adapter.sleep();
      case "system.lock":
        return this.adapter.lockScreen();
      case "system.notify":
        return this.adapter.showNotification(p.title as string, p.body as string);

      // Clipboard
      case "clipboard.read":
        return this.adapter.readClipboard();
      case "clipboard.write":
        return this.adapter.writeClipboard(p.text as string);

      // Process
      case "process.list":
        return this.adapter.listProcesses();
      case "process.kill":
        return this.adapter.killProcess(p.pid as number);

      // Work mode (handled separately)
      case "workmode.enter":
        return { success: true };
      case "workmode.exit":
        return { success: true };

      default:
        return { success: false, error: `Unknown intent category: ${intent.category}` };
    }
  }

  private stepToIntent(step: WorkModeStep): PcIntent {
    const kind = step.action.kind; // e.g. "pc.app.launch"
    const category = kind.replace("pc.", "") as PcIntentCategory;

    // Infer params from the step description
    const params: Record<string, unknown> = {};
    if (category === "app.launch" || category === "app.close") {
      // Extract app name from description
      const match = step.description.match(/(Launch|Close)\s+(.+)/);
      if (match) params.appName = match[2];
    } else if (category === "system.volume") {
      const match = step.description.match(/(\d+)%/);
      if (match) params.level = parseInt(match[1]!, 10);
    } else if (category === "system.dnd") {
      params.enabled = step.description.toLowerCase().includes("enable");
    }

    return { category, params, description: step.description };
  }
}

// ── Factory ────────────────────────────────────────────────────────────────────

import * as os from "node:os";
import { MockPlatformAdapter } from "./mock-adapter.js";
import { MacosPlatformAdapter } from "./macos-adapter.js";
import { WindowsPlatformAdapter } from "./windows-adapter.js";
import { LinuxPlatformAdapter } from "./linux-adapter.js";

/** Auto-detect the current platform and create the appropriate adapter. */
export function createPlatformAdapter(): PlatformAdapter {
  switch (os.platform()) {
    case "darwin":
      return new MacosPlatformAdapter();
    case "win32":
      return new WindowsPlatformAdapter();
    case "linux":
      return new LinuxPlatformAdapter();
    default:
      return new MockPlatformAdapter();
  }
}

/** Create a PcAgent with auto-detected platform adapter. */
export function createPcAgent(deps?: Partial<PcAgentDeps>): PcAgent {
  return new PcAgent({
    adapter: deps?.adapter ?? createPlatformAdapter(),
    security: deps?.security,
    workModeConfig: deps?.workModeConfig,
  });
}
