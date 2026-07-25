/**
 * NEXUS AI — @nexus/platform
 * Platform Abstraction Layer (FAZ 3, 8).
 *
 * Provides a cross-platform adapter interface for OS-level operations:
 *  - Application control (launch, close, focus)
 *  - File/folder operations (list, create, delete, move, copy)
 *  - System control (volume, brightness, DnD, sleep, lock)
 *  - Clipboard and process management
 *
 * The PcAgent orchestrates these through the Security Engine so that
 * risky operations always require explicit user confirmation.
 */

export * from "./service.js";
export * from "./adapter.js";
export * from "./mock-adapter.js";
export * from "./macos-adapter.js";
export * from "./windows-adapter.js";
export * from "./linux-adapter.js";
export * from "./pc-agent.js";
export * from "./launch.js";

export const moduleName = "platform" as const;

/** Flipped to true once this module ships real behavior. */
export const implemented = true;

export interface ModuleInfo {
  readonly name: string;
  readonly implemented: boolean;
}

export function platformInfo(): ModuleInfo {
  return { name: moduleName, implemented };
}
