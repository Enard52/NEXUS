/**
 * NEXUS AI — Skill System Tests
 *
 * Full-cycle tests: pattern observation → threshold → proposal → consent →
 * auto-application on subsequent matching requests.
 */

import { describe, expect, it, beforeEach } from "vitest";
import { moduleName, skillsInfo, SkillDiscoveryService } from "./index.js";
import { SkillStore, matchesPattern, matchesSlots, __resetIdCounter } from "./skill-store.js";
import {
  SkillLearningEngine,
  SkillExecutor,
  SkillConsentManager,
  type Interaction,
} from "./learning-engine.js";

// ── Module Identity ───────────────────────────────────────────────────────────

describe("@nexus/skills module identity", () => {
  it("exposes correct module name", () => {
    expect(moduleName).toBe("skills");
  });

  it("reports itself as implemented", () => {
    expect(skillsInfo()).toEqual({ name: "skills", implemented: true });
  });
});

// ── Skill Discovery ───────────────────────────────────────────────────────────

describe("SkillDiscoveryService", () => {
  it("returns discoverable skills", () => {
    const service = new SkillDiscoveryService();
    const skills = service.getDiscoverableSkills();
    expect(skills.length).toBeGreaterThanOrEqual(4);
    expect(skills[0]!.id).toContain("skill_");
  });
});

// ── Pattern Matching ──────────────────────────────────────────────────────────

describe("matchesPattern", () => {
  it("matches exact intent names", () => {
    expect(matchesPattern("home.control", "home.control")).toBe(true);
    expect(matchesPattern("home.control", "home.rename")).toBe(false);
  });

  it("matches wildcard suffix patterns", () => {
    expect(matchesPattern("home.*", "home.control")).toBe(true);
    expect(matchesPattern("home.*", "home.rename")).toBe(true);
    expect(matchesPattern("home.*", "pc.control")).toBe(false);
  });

  it("matches prefix wildcards", () => {
    expect(matchesPattern("scene.*", "scene.movie")).toBe(true);
    expect(matchesPattern("scene.movie*", "scene.movie_night")).toBe(true);
  });
});

describe("matchesSlots", () => {
  it("returns true when all required slots are present", () => {
    expect(matchesSlots({ room: "living" }, { room: "living", device: "lamp" })).toBe(true);
  });

  it("returns false when a required slot is missing", () => {
    expect(matchesSlots({ room: "living" }, { device: "lamp" })).toBe(false);
  });

  it("returns false when slot value differs", () => {
    expect(matchesSlots({ room: "living" }, { room: "bedroom" })).toBe(false);
  });

  it("returns true for empty required slots", () => {
    expect(matchesSlots({}, { any: "value" })).toBe(true);
  });
});

// ── Skill Store ───────────────────────────────────────────────────────────────

describe("SkillStore", () => {
  let store: SkillStore;

  beforeEach(() => {
    __resetIdCounter();
    store = new SkillStore();
  });

  it("proposes a skill with 'proposed' status", () => {
    const skill = store.propose({
      name: "Auto dim",
      description: "Dims lights after movie mode",
      trigger: { intentPattern: "scene.movie", slots: {} },
      actions: [{ kind: "device.brightness", params: { level: 20 } }],
    });

    expect(skill.status).toBe("proposed");
    expect(skill.proposalCount).toBe(1);
    expect(skill.source).toBe("learned");
    expect(store.size).toBe(1);
  });

  it("creates a skill directly as active", () => {
    const skill = store.create({
      name: "Manual skill",
      description: "User-created",
      trigger: { intentPattern: "home.control", slots: { room: "living" } },
      actions: [{ kind: "device.brightness", params: { level: 50 } }],
      source: "manual",
    });

    expect(skill.status).toBe("active");
    expect(skill.source).toBe("manual");
  });

  it("accepts a proposed skill", () => {
    const skill = store.propose({
      name: "Test",
      description: "Test",
      trigger: { intentPattern: "test", slots: {} },
      actions: [],
    });

    expect(store.accept(skill.id)).toBe(true);
    expect(store.get(skill.id)!.status).toBe("active");
  });

  it("rejects a proposed skill", () => {
    const skill = store.propose({
      name: "Test",
      description: "Test",
      trigger: { intentPattern: "test", slots: {} },
      actions: [],
    });

    expect(store.reject(skill.id)).toBe(true);
    expect(store.get(skill.id)!.status).toBe("rejected");
  });

  it("pauses and resumes an active skill", () => {
    const skill = store.create({
      name: "Test",
      description: "Test",
      trigger: { intentPattern: "test", slots: {} },
      actions: [],
    });

    expect(store.pause(skill.id)).toBe(true);
    expect(store.get(skill.id)!.status).toBe("paused");
    expect(store.resume(skill.id)).toBe(true);
    expect(store.get(skill.id)!.status).toBe("active");
  });

  it("deletes a skill", () => {
    const skill = store.create({
      name: "Test",
      description: "Test",
      trigger: { intentPattern: "test", slots: {} },
      actions: [],
    });

    expect(store.delete(skill.id)).toBe(true);
    expect(store.size).toBe(0);
  });

  it("finds matching skills by intent and slots", () => {
    store.create({
      name: "Movie dim",
      description: "Dim on movie",
      trigger: { intentPattern: "scene.movie", slots: {} },
      actions: [{ kind: "device.brightness", params: { level: 20 } }],
    });
    store.create({
      name: "Kitchen bright",
      description: "Bright in kitchen",
      trigger: { intentPattern: "home.control", slots: { room: "kitchen" } },
      actions: [{ kind: "device.brightness", params: { level: 100 } }],
    });

    const movieMatch = store.findMatching("scene.movie", {});
    expect(movieMatch).toHaveLength(1);
    expect(movieMatch[0]!.name).toBe("Movie dim");

    const kitchenMatch = store.findMatching("home.control", { room: "kitchen", device: "lamp" });
    expect(kitchenMatch).toHaveLength(1);
    expect(kitchenMatch[0]!.name).toBe("Kitchen bright");

    const noMatch = store.findMatching("home.control", { room: "living" });
    expect(noMatch).toHaveLength(0);
  });

  it("records activation", () => {
    const skill = store.create({
      name: "Test",
      description: "Test",
      trigger: { intentPattern: "test", slots: {} },
      actions: [],
    });

    store.recordActivation(skill.id);
    store.recordActivation(skill.id);
    expect(store.get(skill.id)!.activationCount).toBe(2);
    expect(store.get(skill.id)!.lastActivatedAt).toBeDefined();
  });

  it("emits events on lifecycle transitions", () => {
    const events: string[] = [];
    store.on((e) => events.push(e.type));

    const skill = store.propose({
      name: "Test",
      description: "Test",
      trigger: { intentPattern: "test", slots: {} },
      actions: [],
    });
    store.accept(skill.id);
    store.recordActivation(skill.id);
    store.pause(skill.id);
    store.resume(skill.id);
    store.delete(skill.id);

    expect(events).toEqual(["proposed", "accepted", "activated", "paused", "resumed", "deleted"]);
  });

  it("list filters by status", () => {
    store.create({
      name: "A",
      description: "",
      trigger: { intentPattern: "a", slots: {} },
      actions: [],
    });
    store.propose({
      name: "B",
      description: "",
      trigger: { intentPattern: "b", slots: {} },
      actions: [],
    });

    expect(store.list("active")).toHaveLength(1);
    expect(store.list("proposed")).toHaveLength(1);
    expect(store.list()).toHaveLength(2);
  });
});

// ── Skill Learning Engine ─────────────────────────────────────────────────────

describe("SkillLearningEngine", () => {
  let store: SkillStore;
  let engine: SkillLearningEngine;

  beforeEach(() => {
    __resetIdCounter();
    store = new SkillStore();
    engine = new SkillLearningEngine(store, { threshold: 3 });
  });

  const movieInteraction: Interaction = {
    intentName: "scene.movie",
    slots: {},
    followUpActions: [{ kind: "device.brightness", params: { level: 20 } }],
  };

  it("does not propose until threshold is reached", () => {
    expect(engine.observe(movieInteraction)).toBeUndefined();
    expect(engine.observe(movieInteraction)).toBeUndefined();
    expect(store.list()).toHaveLength(0);
  });

  it("proposes a skill at threshold", () => {
    engine.observe(movieInteraction);
    engine.observe(movieInteraction);
    const proposed = engine.observe(movieInteraction);

    expect(proposed).toBeDefined();
    expect(proposed!.status).toBe("proposed");
    expect(proposed!.trigger.intentPattern).toBe("scene.movie");
    expect(proposed!.actions).toHaveLength(1);
    expect(proposed!.actions[0]!.kind).toBe("device.brightness");
  });

  it("does not re-propose after initial proposal", () => {
    engine.observe(movieInteraction);
    engine.observe(movieInteraction);
    engine.observe(movieInteraction); // threshold met → proposed

    // Additional observations don't re-propose
    expect(engine.observe(movieInteraction)).toBeUndefined();
    expect(engine.observe(movieInteraction)).toBeUndefined();
  });

  it("ignores interactions without follow-up actions", () => {
    const noFollowUp: Interaction = {
      intentName: "chitchat",
      slots: { text: "hello" },
    };

    expect(engine.observe(noFollowUp)).toBeUndefined();
    expect(engine.patternCount).toBe(0);
  });

  it("tracks separate patterns for different intents", () => {
    const kitchenInteraction: Interaction = {
      intentName: "home.control",
      slots: { room: "kitchen" },
      followUpActions: [{ kind: "device.brightness", params: { level: 100 } }],
    };

    engine.observe(movieInteraction);
    engine.observe(movieInteraction);
    engine.observe(kitchenInteraction);
    engine.observe(kitchenInteraction);

    expect(engine.patternCount).toBe(2);
    expect(store.list()).toHaveLength(0); // neither has hit threshold
  });

  it("provides pattern stats", () => {
    engine.observe(movieInteraction);
    engine.observe(movieInteraction);

    const patterns = engine.getPatterns();
    expect(patterns).toHaveLength(1);
    expect(patterns[0]!.count).toBe(2);
    expect(patterns[0]!.threshold).toBe(3);
  });

  it("evicts lowest-count pattern when maxPatterns is reached", () => {
    const smallEngine = new SkillLearningEngine(store, { threshold: 3, maxPatterns: 2 });

    smallEngine.observe({
      intentName: "a",
      slots: {},
      followUpActions: [{ kind: "x", params: {} }],
    });
    smallEngine.observe({
      intentName: "b",
      slots: {},
      followUpActions: [{ kind: "y", params: {} }],
    });
    smallEngine.observe({
      intentName: "b",
      slots: {},
      followUpActions: [{ kind: "y", params: {} }],
    });
    // At this point: a=1, b=2. Adding c should evict a (lowest).
    smallEngine.observe({
      intentName: "c",
      slots: {},
      followUpActions: [{ kind: "z", params: {} }],
    });

    expect(smallEngine.patternCount).toBe(2);
    const sigs = smallEngine.getPatterns().map((p) => p.signature);
    expect(sigs.some((s) => s.startsWith("a"))).toBe(false);
  });

  it("resets all patterns", () => {
    engine.observe(movieInteraction);
    engine.observe(movieInteraction);
    engine.reset();
    expect(engine.patternCount).toBe(0);
  });
});

// ── Skill Executor ────────────────────────────────────────────────────────────

describe("SkillExecutor", () => {
  let store: SkillStore;
  let executor: SkillExecutor;

  beforeEach(() => {
    __resetIdCounter();
    store = new SkillStore();
    executor = new SkillExecutor(store);
  });

  it("returns no actions when no skills match", () => {
    const result = executor.execute("unknown.intent", {});
    expect(result.applied).toBe(false);
    expect(result.actions).toHaveLength(0);
  });

  it("auto-applies matching active skill", () => {
    store.create({
      name: "Movie dim",
      description: "Dim on movie",
      trigger: { intentPattern: "scene.movie", slots: {} },
      actions: [{ kind: "device.brightness", params: { level: 20 } }],
    });

    const result = executor.execute("scene.movie", {});
    expect(result.applied).toBe(true);
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]!.kind).toBe("device.brightness");
    expect(result.actions[0]!.params).toEqual({ level: 20 });
    expect(result.skills).toHaveLength(1);
  });

  it("does not apply paused skills", () => {
    const skill = store.create({
      name: "Test",
      description: "Test",
      trigger: { intentPattern: "test", slots: {} },
      actions: [{ kind: "x", params: {} }],
    });
    store.pause(skill.id);

    const result = executor.execute("test", {});
    expect(result.applied).toBe(false);
  });

  it("applies multiple matching skills", () => {
    store.create({
      name: "Skill A",
      description: "",
      trigger: { intentPattern: "scene.movie", slots: {} },
      actions: [{ kind: "a", params: {} }],
    });
    store.create({
      name: "Skill B",
      description: "",
      trigger: { intentPattern: "scene.*", slots: {} },
      actions: [{ kind: "b", params: {} }],
    });

    const result = executor.execute("scene.movie", {});
    expect(result.applied).toBe(true);
    expect(result.actions).toHaveLength(2);
  });

  it("records activation count", () => {
    const skill = store.create({
      name: "Test",
      description: "",
      trigger: { intentPattern: "test", slots: {} },
      actions: [{ kind: "x", params: {} }],
    });

    executor.execute("test", {});
    executor.execute("test", {});
    expect(store.get(skill.id)!.activationCount).toBe(2);
  });

  it("preview shows matching skills without activating", () => {
    store.create({
      name: "Test",
      description: "",
      trigger: { intentPattern: "test", slots: {} },
      actions: [{ kind: "x", params: {} }],
    });

    const preview = executor.preview("test", {});
    expect(preview).toHaveLength(1);
    expect(store.get(preview[0]!.id)!.activationCount).toBe(0);
  });
});

// ── Skill Consent Manager ─────────────────────────────────────────────────────

describe("SkillConsentManager", () => {
  let store: SkillStore;
  let consent: SkillConsentManager;

  beforeEach(() => {
    __resetIdCounter();
    store = new SkillStore();
    consent = new SkillConsentManager(store);
  });

  it("reports no pending proposals initially", () => {
    expect(consent.hasPending).toBe(false);
    expect(consent.pendingCount).toBe(0);
  });

  it("lists pending proposals", () => {
    store.propose({
      name: "Test",
      description: "Test",
      trigger: { intentPattern: "test", slots: {} },
      actions: [],
    });

    expect(consent.hasPending).toBe(true);
    expect(consent.pendingCount).toBe(1);
    expect(consent.getPendingProposals()).toHaveLength(1);
  });

  it("accepts a proposal → becomes active", () => {
    const skill = store.propose({
      name: "Test",
      description: "Test",
      trigger: { intentPattern: "test", slots: {} },
      actions: [],
    });

    expect(consent.accept(skill.id)).toBe(true);
    expect(store.get(skill.id)!.status).toBe("active");
    expect(consent.hasPending).toBe(false);
  });

  it("rejects a proposal", () => {
    const skill = store.propose({
      name: "Test",
      description: "Test",
      trigger: { intentPattern: "test", slots: {} },
      actions: [],
    });

    expect(consent.reject(skill.id)).toBe(true);
    expect(store.get(skill.id)!.status).toBe("rejected");
  });

  it("dismisses all pending proposals", () => {
    store.propose({
      name: "A",
      description: "",
      trigger: { intentPattern: "a", slots: {} },
      actions: [],
    });
    store.propose({
      name: "B",
      description: "",
      trigger: { intentPattern: "b", slots: {} },
      actions: [],
    });

    const dismissed = consent.dismissAll();
    expect(dismissed).toBe(2);
    expect(consent.pendingCount).toBe(0);
  });
});

// ── Full Cycle Integration ────────────────────────────────────────────────────

describe("FAZ 5 Full Cycle: observe → propose → accept → auto-apply", () => {
  let store: SkillStore;
  let learning: SkillLearningEngine;
  let executor: SkillExecutor;
  let consent: SkillConsentManager;

  beforeEach(() => {
    __resetIdCounter();
    store = new SkillStore();
    learning = new SkillLearningEngine(store, { threshold: 3 });
    executor = new SkillExecutor(store);
    consent = new SkillConsentManager(store);
  });

  it("complete lifecycle: repeated pattern → proposal → acceptance → auto-apply", () => {
    const interaction: Interaction = {
      intentName: "scene.movie",
      slots: {},
      followUpActions: [
        { kind: "device.brightness", params: { level: 20 } },
        { kind: "device.mute_notifications", params: {} },
      ],
    };

    // Phase 1: Observe pattern (not yet threshold)
    learning.observe(interaction);
    learning.observe(interaction);
    expect(consent.hasPending).toBe(false);

    // Phase 2: Threshold reached → proposal
    const proposed = learning.observe(interaction);
    expect(proposed).toBeDefined();
    expect(proposed!.status).toBe("proposed");
    expect(consent.hasPending).toBe(true);

    // Phase 3: Before acceptance → executor does not fire
    const beforeAccept = executor.execute("scene.movie", {});
    expect(beforeAccept.applied).toBe(false);

    // Phase 4: User accepts the proposal
    consent.accept(proposed!.id);
    expect(store.get(proposed!.id)!.status).toBe("active");

    // Phase 5: Next matching request → skill auto-applies
    const afterAccept = executor.execute("scene.movie", {});
    expect(afterAccept.applied).toBe(true);
    expect(afterAccept.actions).toHaveLength(2);
    expect(afterAccept.actions[0]!.kind).toBe("device.brightness");
    expect(afterAccept.actions[1]!.kind).toBe("device.mute_notifications");
    expect(store.get(proposed!.id)!.activationCount).toBe(1);

    // Phase 6: Another activation
    const second = executor.execute("scene.movie", {});
    expect(second.applied).toBe(true);
    expect(store.get(proposed!.id)!.activationCount).toBe(2);
  });

  it("rejected skill does not auto-apply", () => {
    const interaction: Interaction = {
      intentName: "home.control",
      slots: { room: "bedroom" },
      followUpActions: [{ kind: "device.brightness", params: { level: 10 } }],
    };

    learning.observe(interaction);
    learning.observe(interaction);
    const proposed = learning.observe(interaction)!;

    // Reject
    consent.reject(proposed.id);

    // Should not apply
    const result = executor.execute("home.control", { room: "bedroom" });
    expect(result.applied).toBe(false);
  });

  it("pausing a skill stops auto-apply, resuming re-enables it", () => {
    const skill = store.create({
      name: "Night mode",
      description: "Dim at night",
      trigger: { intentPattern: "home.control", slots: { room: "bedroom" } },
      actions: [{ kind: "device.brightness", params: { level: 5 } }],
    });

    // Active → applies
    expect(executor.execute("home.control", { room: "bedroom" }).applied).toBe(true);

    // Pause → does not apply
    store.pause(skill.id);
    expect(executor.execute("home.control", { room: "bedroom" }).applied).toBe(false);

    // Resume → applies again
    store.resume(skill.id);
    expect(executor.execute("home.control", { room: "bedroom" }).applied).toBe(true);
  });
});
