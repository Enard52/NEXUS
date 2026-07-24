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
import { RiskLevel, SecurityEngine, type SecurityAction } from "@nexus/security";

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
}

interface Agent {
  readonly name: string;
  canHandle(intent: Intent): boolean;
  plan(intent: Intent, ctx: AgentContext): Promise<{ steps: PlanStep[]; text: string }>;
}

// ── Minimal, dependency-free localizer for FAZ 1 (i18n proper lands in FAZ 13) ──
type TemplateKey =
  "greeting" | "nameSet" | "addressSet" | "languageSet" | "confirmNeeded" | "sceneActivated";

const TEMPLATES: Record<string, Record<TemplateKey, (p: Personalization) => string>> = {
  en: {
    greeting: (p) => `Hi ${p.userAddress}, ${p.assistantName} here. How can I help?`,
    nameSet: (p) => `Done — you can call me ${p.assistantName} from now on, ${p.userAddress}.`,
    addressSet: (p) => `Got it, I'll call you ${p.userAddress} from now on.`,
    languageSet: (p) => `Switched to English. I'm ${p.assistantName}, ${p.userAddress}.`,
    confirmNeeded: (p) => `${p.userAddress}, that action needs your confirmation.`,
    sceneActivated: (p) => `On it, ${p.userAddress} — running your scene now.`,
  },
  tr: {
    greeting: (p) => `Merhaba ${p.userAddress}, ben ${p.assistantName}. Nasıl yardımcı olabilirim?`,
    nameSet: (p) => `Tamamdır, bundan sonra bana ${p.assistantName} diyebilirsin ${p.userAddress}.`,
    addressSet: (p) => `Anlaşıldı, sana bundan sonra ${p.userAddress} diye sesleneceğim.`,
    languageSet: (p) => `Türkçeye geçtim. Ben ${p.assistantName}, ${p.userAddress}.`,
    confirmNeeded: (p) => `${p.userAddress}, bu işlem için onayın gerekiyor.`,
    sceneActivated: (p) => `Hemen ${p.userAddress}, sahneni çalıştırıyorum.`,
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
  if (/\b(light|lamp|ışık|lamba)\b/i.test(lower)) {
    const on = /\b(on|aç)\b/i.test(lower);
    const roomMatch = lower.match(
      /\b(living|bedroom|kitchen|bathroom|office|salon|yatak|mutfak)\b/i,
    );
    const slots: Record<string, string> = { device: "light", state: on ? "on" : "off" };
    if (roomMatch) slots.room = roomMatch[1]!.toLowerCase();
    return { name: "home.control", slots };
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
    return intent.name === "home.control";
  }
  async plan(intent: Intent, ctx: AgentContext) {
    const desiredOn = (intent.slots.state ?? "on") === "on";
    const room = intent.slots.room ?? "living";

    // Query the Digital Twin (FAZ 6): the same intent yields a context-aware
    // plan (dim at night, no-op if already in the desired state, etc.).
    if (ctx.twin) {
      const twinPlan = resolveLightPlan(ctx.twin, room, desiredOn);
      const steps: PlanStep[] = twinPlan.steps.map((s) => ({
        summary: s.summary,
        action: { kind: "device.light.set", risk: RiskLevel.Medium, description: s.summary },
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

export interface NexusCoreDeps {
  readonly memory: UserMemoryStore;
  readonly provider: AiProvider;
  readonly security?: SecurityEngine;
  readonly twin?: DigitalTwin;
  /** Optional user-defined Scenes & Routines checked before intent parsing. */
  readonly routines?: RoutineEngine;
}

export class NexusCore {
  private readonly memory: UserMemoryStore;
  private readonly provider: AiProvider;
  private readonly security: SecurityEngine;
  private readonly twin?: DigitalTwin;
  private readonly routines?: RoutineEngine;
  private readonly agents: Agent[];

  constructor(deps: NexusCoreDeps) {
    this.memory = deps.memory;
    this.provider = deps.provider;
    this.security = deps.security ?? new SecurityEngine();
    this.twin = deps.twin;
    this.routines = deps.routines;
    // Order matters: specific agents first, chitchat is the fallback.
    this.agents = [new PersonalizationAgent(), new HomeAgent(), new ChitchatAgent()];
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

    const intent = extractIntent(utterance);
    const agent = this.agents.find((a) => a.canHandle(intent))!;

    const { steps, text } = await agent.plan(intent, {
      userId,
      personalization: this.memory.getProfile(userId).personalization,
      memory: this.memory,
      provider: this.provider,
      twin: this.twin,
    });

    const executed: PlanStep[] = [];
    const pending: PlanStep[] = [];
    for (const step of steps) {
      const decision = this.security.evaluate(step.action).decision;
      if (decision === "deny") continue;
      if (decision === "confirm" && !options.confirm) {
        pending.push(step);
      } else {
        executed.push(step);
      }
    }

    // Re-read personalization so a change made during this turn is reflected now.
    const finalP = this.memory.getProfile(userId).personalization;
    const responseText = pending.length > 0 ? t(finalP.language, "confirmNeeded", finalP) : text;

    this.memory.remember(userId, { role: "assistant", text: responseText });

    return { text: responseText, intent: intent.name, agent: agent.name, executed, pending };
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
      const decision = this.security.evaluate(step.action).decision;
      if (decision === "deny") continue;
      if (decision === "confirm" && !options.confirm) pending.push(step);
      else executed.push(step);
    }

    const p = this.memory.getProfile(userId).personalization;
    const text =
      pending.length > 0 ? t(p.language, "confirmNeeded", p) : t(p.language, "sceneActivated", p);
    this.memory.remember(userId, { role: "assistant", text });

    return { text, intent: "routine.run", agent: "routines", executed, pending };
  }
}
