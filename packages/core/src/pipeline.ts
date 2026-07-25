/**
 * NEXUS AI — Core pipeline (FAZ 1)
 *
 * Implements the FAZ 1 loop with mock agents:
 *   utterance → intent extraction → agent selection → plan → result tracking
 *
 * Personalization (assistant name, how the user is addressed, tone, language)
 * is read from User Memory on *every* request, so a preference change is
 * reflected immediately in the next response (FAZ 1 Bitiş Kriteri). Risky plan
 * steps are evaluated by the Security Engine v0 and require confirmation.
 */

import type { AiProvider } from "@nexus/ai";
import type { DigitalTwin, Personalization, UserMemoryStore } from "@nexus/memory";
import { resolveLightPlan } from "@nexus/memory";
import type { RoutineEngine, SceneAction } from "@nexus/routines";
import { RiskLevel, SecurityMiddleware, type SecurityAction } from "@nexus/security";
import { DeviceManager } from "@nexus/devices";
import { VoiceEngine, type VoiceInteractionResult, type SpeakResult } from "@nexus/voice";
import { PcAgent, createPcAgent, type PcIntent } from "@nexus/platform";
import { Household, type DeviceAction as HouseholdAction, AccountHouseholdBridge, AuthenticationError } from "@nexus/accounts";
import { resolveLocale, translate, type Locale } from "@nexus/i18n";
import {
  SkillStore,
  SkillLearningEngine,
  SkillExecutor,
  SkillConsentManager,
  type SkillDefinition,
} from "@nexus/skills";
import {
  AgentRouter,
  MultiHomeAgent,
  LifeAgent,
  KnowledgeAgent,
  SecurityAgent,
  FinanceAgent,
} from "@nexus/agents";

export interface Intent {
  /** Coarse intent name, e.g. "personalization.setName", "home.control". */
  readonly name: string;
  /** Structured slots extracted from the utterance. */
  readonly slots: Record<string, string>;
}

export interface PlanStep {
  readonly summary: string;
  readonly action: SecurityAction;
}

export interface NexusResponse {
  readonly text: string;
  readonly intent: string;
  readonly agent: string;
  /** Steps that were allowed and "executed" (mock). */
  readonly executed: readonly PlanStep[];
  /** Steps awaiting user confirmation (risk >= confirm threshold). */
  readonly pending: readonly PlanStep[];
  /** Steps denied due to household access control (FAZ 12). */
  readonly denied?: readonly PlanStep[];
  /** Approval tokens for pending steps — use with approveAction/rejectAction (FAZ 11). */
  readonly approvalTokens?: readonly string[];
  /** Skills that were auto-applied to this request (FAZ 5). */
  readonly appliedSkills?: readonly SkillDefinition[];
  /** Skill proposals generated from this interaction (FAZ 5). */
  readonly proposedSkill?: SkillDefinition;
}

export interface HandleOptions {
  /** When true, steps that would need confirmation are treated as approved. */
  readonly confirm?: boolean;
}

interface AgentContext {
  readonly userId: string;
  readonly personalization: Personalization;
  readonly memory: UserMemoryStore;
  readonly provider: AiProvider;
  readonly twin?: DigitalTwin;
  readonly devices?: DeviceManager;
}

interface Agent {
  readonly name: string;
  canHandle(intent: Intent): boolean;
  plan(intent: Intent, ctx: AgentContext): Promise<{ steps: PlanStep[]; text: string }>;
}

// ── Localizer: uses @nexus/i18n catalog (FAZ 13) with personalization-aware templates ──
type TemplateKey =
  "greeting" | "nameSet" | "addressSet" | "languageSet" | "confirmNeeded" | "sceneActivated" | "deviceRenamed";

const TEMPLATES: Record<string, Record<TemplateKey, (p: Personalization) => string>> = {
  en: {
    greeting: (p) => translate("en", "app.greeting", { name: p.userAddress }),
    nameSet: (p) => `Done — you can call me ${p.assistantName} from now on, ${p.userAddress}.`,
    addressSet: (p) => `Got it, I'll call you ${p.userAddress} from now on.`,
    languageSet: (p) => `Switched to English. I'm ${p.assistantName}, ${p.userAddress}.`,
    confirmNeeded: (p) => translate("en", "app.confirmNeeded", { name: p.userAddress }),
    sceneActivated: (p) => `On it, ${p.userAddress} — running your scene now.`,
    deviceRenamed: (_p) => `Done — device renamed successfully.`,
  },
  tr: {
    greeting: (p) => translate("tr", "app.greeting", { name: p.userAddress }),
    nameSet: (p) => `Tamamdır, bundan sonra bana ${p.assistantName} diyebilirsin ${p.userAddress}.`,
    addressSet: (p) => `Anlaşıldı, sana bundan sonra ${p.userAddress} diye sesleneceğim.`,
    languageSet: (p) => `Türkçeye geçtim. Ben ${p.assistantName}, ${p.userAddress}.`,
    confirmNeeded: (p) => translate("tr", "app.confirmNeeded", { name: p.userAddress }),
    sceneActivated: (p) => `Hemen ${p.userAddress}, sahneni çalıştırıyorum.`,
    deviceRenamed: (_p) => `Tamam, cihaz başarıyla yeniden adlandırıldı.`,
  },
};

/**
 * Map a routine/scene action to a Security risk level so every routine step is
 * gated by the same middleware as everything else (FAZ 11). Conservative: any
 * destructive or access-control action escalates; ordinary device toggles are
 * Medium.
 */
export function sceneActionRisk(kind: string): RiskLevel {
  const k = kind.toLowerCase();
  if (/(delete|remove|wipe|reset)/.test(k)) return RiskLevel.Critical;
  if (/(lock|unlock|door|garage|security|disarm|arm)/.test(k)) return RiskLevel.High;
  return RiskLevel.Medium;
}

function sceneStep(action: SceneAction): PlanStep {
  const detail = Object.entries(action.params)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");
  const summary = detail ? `${action.kind} (${detail})` : action.kind;
  return {
    summary,
    action: { kind: action.kind, risk: sceneActionRisk(action.kind), description: summary },
  };
}

function t(lang: string, key: TemplateKey, p: Personalization): string {
  const base = lang.split("-")[0]!;
  return (TEMPLATES[base] ?? TEMPLATES.en!)[key](p);
}

// ── Intent extraction (rule-based mock for FAZ 1) ──
export function extractIntent(utterance: string): Intent {
  const u = utterance.trim();
  const lower = u.toLowerCase();

  let m: RegExpMatchArray | null;
  if ((m = u.match(/(?:your name is|call yourself|ad(?:ın)? )\s*([\p{L}][\p{L}\d]*)/iu))) {
    return { name: "personalization.setName", slots: { name: m[1]! } };
  }
  if ((m = u.match(/(?:call me|bana)\s+([\p{L}][\p{L}\d]*)\s*(?:de|diye)?/iu))) {
    return { name: "personalization.setAddress", slots: { address: m[1]! } };
  }
  if (/(?:speak|switch to)\s+turkish|türkçe(?:ye)?\s*(?:geç|konuş)?/i.test(lower)) {
    return { name: "personalization.setLanguage", slots: { language: "tr" } };
  }
  if (/(?:speak|switch to)\s+english|ingilizce(?:ye)?/i.test(lower)) {
    return { name: "personalization.setLanguage", slots: { language: "en" } };
  }

  // ── PC Agent intents ─────────────────────────────────────────────────────
  if ((m = u.match(/(?:open|launch|start|aç|başlat)\s+(.+)/i))) {
    return { name: "pc.app.launch", slots: { appName: m[1]! } };
  }
  if ((m = u.match(/(?:close|quit|kapat)\s+(.+)/i))) {
    return { name: "pc.app.close", slots: { appName: m[1]! } };
  }
  if (/(?:work mode|çalışma modu)/i.test(lower)) {
    return { name: "pc.workmode.enter", slots: {} };
  }
  if (/(?:exit work mode|çalışma modundan çık)/i.test(lower)) {
    return { name: "pc.workmode.exit", slots: {} };
  }
  if ((m = u.match(/(?:set volume|ses(?:i)?|volume)\s*(?:to\s+)?(\d+)/i))) {
    return { name: "pc.system.volume", slots: { level: m[1]! } };
  }
  if (/(?:lock screen|ekranı kilitle|kilitle)/i.test(lower)) {
    return { name: "pc.system.lock", slots: {} };
  }
  if (/(?:sleep|uyku|uyut)/i.test(lower)) {
    return { name: "pc.system.sleep", slots: {} };
  }
  if ((m = u.match(/(?:delete file|dosya sil|sil)\s+(.+)/i))) {
    return { name: "pc.file.delete", slots: { path: m[1]! } };
  }
  if ((m = u.match(/(?:create file|dosya oluştur|oluştur)\s+(.+)/i))) {
    return { name: "pc.file.create", slots: { path: m[1]! } };
  }
  if (/\b(light|lamp|ışık|lamba)\b/i.test(lower)) {
    const on = /\b(on|aç)\b/i.test(lower);
    const roomMatch = lower.match(
      /\b(living|bedroom|kitchen|bathroom|office|salon|yatak|mutfak)\b/i,
    );
    const slots: Record<string, string> = { device: "light", state: on ? "on" : "off" };
    if (roomMatch) slots.room = roomMatch[1]!.toLowerCase();
    return { name: "home.control", slots };
  }
  // Rename device: "rename X to Y" / "X'in adını Y koy" / "X'a Y de"
  if ((m = u.match(/rename\s+(.+?)\s+to\s+(\S+)/i))) {
    return { name: "home.rename", slots: { deviceRef: m[1]!, newName: m[2]! } };
  }
  if ((m = u.match(/(.+?)'(?:in|ın|nin|nın)\s+ad(?:ı|ın)(?:ı|nı)?\s+([\p{L}\d]+)\s+(?:koy|yap)/iu))) {
    return { name: "home.rename", slots: { deviceRef: m[1]!, newName: m[2]! } };
  }
  if ((m = u.match(/(.+?)'(?:a|e|ya|ye)\s+([\p{L}\d]+)\s+de/iu))) {
    return { name: "home.rename", slots: { deviceRef: m[1]!, newName: m[2]! } };
  }
  return { name: "chitchat", slots: { text: u } };
}

class PersonalizationAgent implements Agent {
  readonly name = "personalization";
  canHandle(intent: Intent): boolean {
    return intent.name.startsWith("personalization.");
  }
  async plan(intent: Intent, ctx: AgentContext) {
    let patch: Partial<Personalization> = {};
    let key: TemplateKey = "greeting";
    if (intent.name === "personalization.setName") {
      patch = { assistantName: intent.slots.name! };
      key = "nameSet";
    } else if (intent.name === "personalization.setAddress") {
      patch = { userAddress: intent.slots.address! };
      key = "addressSet";
    } else if (intent.name === "personalization.setLanguage") {
      patch = { language: intent.slots.language! };
      key = "languageSet";
    }
    const updated = ctx.memory.updatePersonalization(ctx.userId, patch);
    return {
      steps: [] as PlanStep[],
      text: t(updated.personalization.language, key, updated.personalization),
    };
  }
}

class HomeAgent implements Agent {
  readonly name = "home";
  canHandle(intent: Intent): boolean {
    return intent.name === "home.control" || intent.name === "home.controlByName" || intent.name === "home.rename";
  }
  async plan(intent: Intent, ctx: AgentContext) {
    // Handle device rename
    if (intent.name === "home.rename") {
      const deviceRef = intent.slots.deviceRef!;
      const newName = intent.slots.newName!;
      if (ctx.devices) {
        // Try to find the device by existing alias first, then by original name scan
        const device = ctx.devices.findByName(deviceRef)
          ?? ctx.devices.discoverAll().find(
            (d) => d.name.toLowerCase() === deviceRef.toLowerCase() || d.id === deviceRef,
          );
        if (device) {
          ctx.devices.names.rename(device.id, newName);
          // Keep old name as alias
          ctx.devices.names.addAlias(device.id, device.name);
        }
      }
      return {
        steps: [] as PlanStep[],
        text: t(ctx.personalization.language, "deviceRenamed", ctx.personalization),
      };
    }

    // Handle name-based device control
    if (intent.name === "home.controlByName" && ctx.devices) {
      const deviceName = intent.slots.deviceName!;
      const desiredOn = (intent.slots.state ?? "on") === "on";
      const device = ctx.devices.findByName(deviceName);

      if (!device) {
        return { steps: [] as PlanStep[], text: `No device found with name "${deviceName}".` };
      }

      // If twin available, resolve via twin using device's room
      if (ctx.twin) {
        const twinPlan = resolveLightPlan(ctx.twin, device.room, desiredOn, ctx.userId);
        const steps: PlanStep[] = twinPlan.steps.map((s) => ({
          summary: s.summary,
          action: { kind: "device.light.set", risk: RiskLevel.Medium, description: `${s.summary} id=${s.params.id}` },
        }));
        return { steps, text: twinPlan.rationale };
      }

      const state = desiredOn ? "on" : "off";
      const step: PlanStep = {
        summary: `Turn ${state} ${deviceName}`,
        action: { kind: "device.light.set", risk: RiskLevel.Medium, description: state },
      };
      return {
        steps: [step],
        text: t(ctx.personalization.language, "greeting", ctx.personalization),
      };
    }

    // Original home.control logic
    const desiredOn = (intent.slots.state ?? "on") === "on";
    const room = intent.slots.room ?? "living";

    // Query the Digital Twin (FAZ 6): the same intent yields a context-aware
    // plan (dim at night, no-op if already in the desired state, etc.).
    if (ctx.twin) {
      const twinPlan = resolveLightPlan(ctx.twin, room, desiredOn, ctx.userId);
      const steps: PlanStep[] = twinPlan.steps.map((s) => ({
        summary: s.summary,
        action: { kind: "device.light.set", risk: RiskLevel.Medium, description: `${s.summary} id=${s.params.id}` },
      }));
      return { steps, text: twinPlan.rationale };
    }

    const state = intent.slots.state ?? "on";
    const step: PlanStep = {
      summary: `Turn ${state} the ${intent.slots.device}`,
      action: { kind: "device.light.set", risk: RiskLevel.Medium, description: state },
    };
    return {
      steps: [step],
      text: t(ctx.personalization.language, "greeting", ctx.personalization),
    };
  }
}

class PcCommandAgent implements Agent {
  readonly name = "pc";
  private readonly pcAgent: PcAgent;

  constructor(pcAgent: PcAgent) {
    this.pcAgent = pcAgent;
  }

  canHandle(intent: Intent): boolean {
    return intent.name.startsWith("pc.");
  }

  async plan(intent: Intent, ctx: AgentContext) {
    const category = intent.name.replace("pc.", "") as import("@nexus/platform").PcIntentCategory;
    const params: Record<string, unknown> = { ...intent.slots };

    // Convert level string to number for volume/brightness
    if (params.level && typeof params.level === "string") {
      params.level = parseInt(params.level, 10);
    }

    // Handle work mode as a special case
    if (category === "workmode.enter") {
      const result = await this.pcAgent.enterWorkMode();
      const pendingSteps = result.results
        .filter((r) => r.requiresConfirmation)
        .map((r) => ({
          summary: r.intent.description ?? r.intent.category,
          action: { kind: `pc.${r.intent.category}`, risk: RiskLevel.High, description: r.intent.description ?? "" },
        }));
      const executedSteps = result.results
        .filter((r) => r.executed)
        .map((r) => ({
          summary: r.intent.description ?? r.intent.category,
          action: { kind: `pc.${r.intent.category}`, risk: RiskLevel.Low, description: r.intent.description ?? "" },
        }));
      const text = result.stepsPending > 0
        ? `Work mode activated. ${result.stepsExecuted} steps executed, ${result.stepsPending} awaiting confirmation.`
        : `Work mode fully activated. ${result.stepsExecuted} steps executed.`;
      return { steps: [...executedSteps, ...pendingSteps], text };
    }

    if (category === "workmode.exit") {
      await this.pcAgent.exitWorkMode();
      return { steps: [] as PlanStep[], text: "Work mode deactivated." };
    }

    // Generic PC intent execution
    const pcIntent: PcIntent = {
      category,
      params,
      description: intent.slots.appName
        ? `${category} ${intent.slots.appName}`
        : intent.slots.path
          ? `${category} ${intent.slots.path}`
          : category,
    };

    const result = await this.pcAgent.execute(pcIntent);

    if (result.requiresConfirmation) {
      const step: PlanStep = {
        summary: pcIntent.description ?? category,
        action: { kind: `pc.${category}`, risk: RiskLevel.High, description: pcIntent.description ?? "" },
      };
      return {
        steps: [step],
        text: t(ctx.personalization.language, "confirmNeeded", ctx.personalization),
      };
    }

    if (result.error) {
      return { steps: [] as PlanStep[], text: result.error };
    }

    return {
      steps: [] as PlanStep[],
      text: `Done: ${pcIntent.description ?? category}`,
    };
  }
}

class ChitchatAgent implements Agent {
  readonly name = "chitchat";
  canHandle(): boolean {
    return true; // fallback
  }
  async plan(intent: Intent, ctx: AgentContext) {
    const completion = await ctx.provider.complete({
      messages: [
        {
          role: "system",
          content: `You are ${ctx.personalization.assistantName}. Address the user as ${ctx.personalization.userAddress}. Tone: ${ctx.personalization.tone}. Language: ${ctx.personalization.language}.`,
        },
        { role: "user", content: intent.slots.text ?? "" },
      ],
    });
    return { steps: [] as PlanStep[], text: completion.text };
  }
}

export interface VoiceConfig {
  readonly apiKey?: string;
  readonly sttProvider?: "whisper" | "mock";
  readonly ttsProvider?: "openai" | "mock";
}

export interface PlatformConfig {
  /** Override the auto-detected platform adapter. */
  readonly adapter?: import("@nexus/platform").PlatformAdapter;
  /** Work mode configuration. */
  readonly workMode?: import("@nexus/platform").WorkModeConfig;
}

export interface SkillsConfig {
  /** Observation threshold before proposing a skill (default 3). */
  readonly threshold?: number;
  /** Maximum patterns to track (default 100). */
  readonly maxPatterns?: number;
}

export interface NexusCoreDeps {
  readonly memory: UserMemoryStore;
  readonly provider: AiProvider;
  readonly security?: SecurityMiddleware;
  readonly twin?: DigitalTwin;
  /** Optional user-defined Scenes & Routines checked before intent parsing. */
  readonly routines?: RoutineEngine;
  readonly devices?: DeviceManager;
  /** Voice engine configuration. Omit for text-only mode. */
  readonly voice?: VoiceConfig;
  /** PC Agent / platform configuration (FAZ 3). */
  readonly platform?: PlatformConfig;
  /** Skill system configuration (FAZ 5). */
  readonly skills?: SkillsConfig;
  /** Multi-agent router configuration (FAZ 7). */
  readonly agentRouter?: AgentRouter;
  /** Household access control (FAZ 12). When set, device actions are gated. */
  readonly household?: Household;
  /** Account ↔ Household bridge (FAZ 14). Enables session-based authentication. */
  readonly authBridge?: AccountHouseholdBridge;
}

export class NexusCore {
  private readonly memory: UserMemoryStore;
  private readonly provider: AiProvider;
  private readonly security: SecurityMiddleware;
  private readonly twin?: DigitalTwin;
  private readonly routines?: RoutineEngine;
  private readonly household?: Household;
  readonly authBridge?: AccountHouseholdBridge;
  readonly devices: DeviceManager;
  readonly voice: VoiceEngine;
  readonly pc: PcAgent;
  readonly skillStore: SkillStore;
  readonly skillLearning: SkillLearningEngine;
  readonly skillExecutor: SkillExecutor;
  readonly skillConsent: SkillConsentManager;
  readonly agentRouter: AgentRouter;
  private readonly agents: Agent[];

  constructor(deps: NexusCoreDeps) {
    this.memory = deps.memory;
    this.provider = deps.provider;
    this.security = deps.security ?? new SecurityMiddleware();
    this.twin = deps.twin;
    this.routines = deps.routines;
    this.household = deps.household;
    this.authBridge = deps.authBridge;
    this.devices = deps.devices ?? new DeviceManager();
    this.voice = new VoiceEngine({
      apiKey: deps.voice?.apiKey,
      sttProvider: deps.voice?.sttProvider,
      ttsProvider: deps.voice?.ttsProvider,
      wakePhrase: this.memory.getProfile("default").personalization.assistantName,
    });
    this.pc = createPcAgent({
      adapter: deps.platform?.adapter,
      workModeConfig: deps.platform?.workMode,
    });
    // Skill system (FAZ 5)
    this.skillStore = new SkillStore();
    this.skillLearning = new SkillLearningEngine(this.skillStore, {
      threshold: deps.skills?.threshold,
      maxPatterns: deps.skills?.maxPatterns,
    });
    this.skillExecutor = new SkillExecutor(this.skillStore);
    this.skillConsent = new SkillConsentManager(this.skillStore);
    // Multi-agent router (FAZ 7)
    this.agentRouter = deps.agentRouter ?? this.createDefaultRouter();
    // Order matters: specific agents first, chitchat is the fallback.
    this.agents = [new PersonalizationAgent(), new PcCommandAgent(this.pc), new HomeAgent(), new ChitchatAgent()];
  }

  /** Create a default AgentRouter with all specialized agents registered. */
  private createDefaultRouter(): AgentRouter {
    const router = new AgentRouter();
    router.register(new MultiHomeAgent());
    router.register(new LifeAgent());
    router.register(new KnowledgeAgent());
    router.register(new SecurityAgent());
    router.register(new FinanceAgent());
    return router;
  }

  /**
   * Authenticated handle: validates a session token before processing.
   * Throws AuthenticationError if the token is invalid or expired (FAZ 14).
   */
  async handleAuthenticated(
    sessionToken: string,
    utterance: string,
    options: HandleOptions = {},
  ): Promise<NexusResponse> {
    if (!this.authBridge) throw new Error("authBridge is required for handleAuthenticated");
    const ctx = this.authBridge.requireAuth(sessionToken);
    return this.handle(ctx.account.id, utterance, options);
  }

  async handle(
    userId: string,
    utterance: string,
    options: HandleOptions = {},
  ): Promise<NexusResponse> {
    this.memory.remember(userId, { role: "user", text: utterance });

    // A user-defined Scene/Routine wins over generic intent parsing: saying
    // "film izleyeceğim" fires the whole movie-night scene, each step still
    // gated by Security. The most specific matching routine is chosen.
    const routineResponse = this.tryRoutine(userId, utterance, options);
    if (routineResponse) return routineResponse;

    let intent = extractIntent(utterance);

    // Second-pass: if generic extraction fell through to chitchat, try name-based device match
    if (intent.name === "chitchat") {
      const named = this.resolveNamedDevice(utterance);
      if (named) intent = named;
    }

    const agent = this.agents.find((a) => a.canHandle(intent))!;

    const { steps, text } = await agent.plan(intent, {
      userId,
      personalization: this.memory.getProfile(userId).personalization,
      memory: this.memory,
      provider: this.provider,
      twin: this.twin,
      devices: this.devices,
    });

    const executed: PlanStep[] = [];
    const pending: PlanStep[] = [];
    const denied: PlanStep[] = [];
    const approvalTokens: string[] = [];
    for (const step of steps) {
      // FAZ 12: Household access control gate — device actions require "control" permission
      if (this.household && this.isDeviceAction(step.action.kind)) {
        const deviceId = this.extractDeviceId(step);
        const requiredAction = this.mapToHouseholdAction(step.action.kind);
        if (deviceId && !this.household.canAccess(userId, deviceId, requiredAction)) {
          denied.push(step);
          continue;
        }
      }
      const result = this.security.guard(step.action, () => step);
      if (result.status === "denied") continue;
      if (result.status === "pending") {
        if (options.confirm) {
          this.security.approve(result.approval!.token, () => {/* auto-confirmed */});
          executed.push(step);
        } else {
          approvalTokens.push(result.approval!.token);
          pending.push(step);
        }
      } else {
        executed.push(step);
      }
    }

    // Re-read personalization so a change made during this turn is reflected now.
    const finalP = this.memory.getProfile(userId).personalization;
    const responseText = pending.length > 0 ? t(finalP.language, "confirmNeeded", finalP) : text;

    this.memory.remember(userId, { role: "assistant", text: responseText });

    // Sync voice engine with personalization changes (wake phrase, language, tone)
    this.voice.setWakePhrase(finalP.assistantName);
    this.voice.setLanguage(finalP.language);
    this.voice.setTone(finalP.tone);

    // FAZ 5: Auto-apply matching skills to this intent
    const skillResult = this.skillExecutor.execute(intent.name, intent.slots);

    return {
      text: responseText,
      intent: intent.name,
      agent: agent.name,
      executed,
      pending,
      denied: denied.length > 0 ? denied : undefined,
      approvalTokens: approvalTokens.length > 0 ? approvalTokens : undefined,
      appliedSkills: skillResult.applied ? skillResult.skills : undefined,
    };
  }

  /**
   * Process incoming voice audio through the full pipeline:
   * Audio → STT → Wake Word → Speaker ID → handle() → TTS → Audio Response
   */
  async handleVoice(
    audio: ArrayBuffer,
    options: HandleOptions = {},
  ): Promise<{ response: NexusResponse; voiceInput: VoiceInteractionResult; voiceOutput?: SpeakResult }> {
    const voiceInput = await this.voice.listen(audio);

    if (!voiceInput.wakeDetected) {
      // No wake word — return early with just the transcription info
      return {
        response: { text: "", intent: "none", agent: "none", executed: [], pending: [] },
        voiceInput,
      };
    }

    // Use identified speaker's userId, or fall back to "default"
    const userId = voiceInput.speaker.identified
      ? voiceInput.speaker.userId!
      : "default";

    // Process the command (portion after wake word)
    const command = voiceInput.command ?? voiceInput.transcript;
    const response = await this.handle(userId, command, options);

    // Synthesize the response to audio
    const voiceOutput = await this.voice.speak(response.text);

    return { response, voiceInput, voiceOutput };
  }

  /**
   * FAZ 5: Observe a follow-up action after a completed request.
   * When the user adjusts something after a command (e.g. dimming lights
   * after "movie mode"), this records the pattern. After enough repetitions,
   * the system proposes a Skill.
   */
  observeFollowUp(
    lastIntent: string,
    lastSlots: Record<string, unknown>,
    followUpActions: Array<{ kind: string; params: Record<string, unknown> }>,
  ): SkillDefinition | undefined {
    return this.skillLearning.observe({
      intentName: lastIntent,
      slots: lastSlots,
      followUpActions,
    });
  }

  // ── FAZ 11: SecurityMiddleware public API ─────────────────────────────────

  /** Read-only view of the hash-chained, tamper-evident audit trail. */
  auditLog() {
    return this.security.auditLog();
  }

  /** Recompute the full hash chain to confirm no entry was altered. */
  verifyAuditIntegrity(): boolean {
    return this.security.verifyAuditIntegrity();
  }

  /** Approve a held action by its token (from NexusResponse.approvalTokens). */
  approveAction<T>(token: string, execute: () => T): T {
    return this.security.approve(token, execute);
  }

  /** Reject a held action by its token. */
  rejectAction(token: string): void {
    this.security.reject(token);
  }

  /** Number of actions currently awaiting approval. */
  pendingApprovals(): number {
    return this.security.pendingCount();
  }

  // ── FAZ 12: Household access helpers ──────────────────────────────────────

  /** Determine if a step's action kind targets a device. */
  private isDeviceAction(kind: string): boolean {
    return /^device\.|^light\.|^thermostat\.|^lock\.|^door\./i.test(kind);
  }

  /** Extract device ID from a plan step's params (encoded in summary or action). */
  private extractDeviceId(step: PlanStep): string | undefined {
    const idMatch = step.summary.match(/id=(\S+)/)
      ?? step.action.description?.match(/id=(\S+)/);
    if (idMatch) return idMatch[1];
    // Fallback: look for device id pattern in summary
    const devMatch = step.summary.match(/\b(dev-\w+|[a-z]\d+)\b/);
    return devMatch?.[1];
  }

  /** Map action kind to the household permission level required. */
  private mapToHouseholdAction(kind: string): HouseholdAction {
    if (/manage|config|reset|delete/i.test(kind)) return "manage";
    if (/view|status|get|read/i.test(kind)) return "view";
    return "control";
  }

  /** Match a Scene/Routine to the utterance and gate its steps. */
  private tryRoutine(
    userId: string,
    utterance: string,
    options: HandleOptions,
  ): NexusResponse | undefined {
    if (!this.routines) return undefined;
    const matched = this.routines.matchVoice(utterance);
    if (matched.length === 0) return undefined;

    const routine = matched[0]!;
    const executed: PlanStep[] = [];
    const pending: PlanStep[] = [];
    for (const action of this.routines.plan(routine)) {
      const step = sceneStep(action);
      const result = this.security.guard(step.action, () => step);
      if (result.status === "denied") continue;
      if (result.status === "pending") {
        if (options.confirm) {
          this.security.approve(result.approval!.token, () => {});
          executed.push(step);
        } else {
          pending.push(step);
        }
      } else {
        executed.push(step);
      }
    }

    const p = this.memory.getProfile(userId).personalization;
    const text =
      pending.length > 0 ? t(p.language, "confirmNeeded", p) : t(p.language, "sceneActivated", p);
    this.memory.remember(userId, { role: "assistant", text });

    return { text, intent: "routine.run", agent: "routines", executed, pending };
  }

  /**
   * Second-pass name-based intent resolver. Scans the utterance for any known
   * device alias and produces a home.controlByName intent if found.
   */
  private resolveNamedDevice(utterance: string): Intent | null {
    const lower = utterance.toLowerCase();
    const names = this.devices.names.allNames();
    if (names.size === 0) return null;

    // Sort by name length descending to match longest alias first
    const sorted = [...names.keys()].sort((a, b) => b.length - a.length);

    for (const alias of sorted) {
      if (!lower.includes(alias)) continue;

      // Determine on/off state from the utterance
      const on = /(?:^|\s|'|\b)(on|aç|yak|başlat)(?:\s|$|\b)/i.test(lower);
      const off = /(?:^|\s|'|\b)(off|kapat|söndür|durdur)(?:\s|$|\b)/i.test(lower);
      const state = off ? "off" : "on";

      // Only match if there's a clear action word
      if (!on && !off) continue;

      return { name: "home.controlByName", slots: { deviceName: alias, state } };
    }

    return null;
  }
}
