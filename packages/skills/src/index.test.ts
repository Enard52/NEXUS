import { describe, expect, it } from "vitest";
import {
  actionSignature,
  implemented,
  moduleName,
  SkillManager,
  type SkillAction,
} from "./index.js";

const nightMode: SkillAction = {
  kind: "device.light.set",
  params: { device: "light", state: "off", brightness: "10" },
};

describe("@nexus/skills module identity", () => {
  it("reports itself as implemented", () => {
    expect(moduleName).toBe("skills");
    expect(implemented).toBe(true);
  });
});

describe("actionSignature", () => {
  it("is stable regardless of param insertion order", () => {
    const a: SkillAction = { kind: "x", params: { b: "2", a: "1" } };
    const b: SkillAction = { kind: "x", params: { a: "1", b: "2" } };
    expect(actionSignature(a)).toBe(actionSignature(b));
  });
});

describe("SkillManager suggestion lifecycle (FAZ 5)", () => {
  it("only proposes a Skill after the repeat threshold is reached", () => {
    const mgr = new SkillManager({ suggestThreshold: 3 });
    mgr.record("u1", nightMode);
    mgr.record("u1", nightMode);
    expect(mgr.detectSuggestions("u1")).toHaveLength(0);

    mgr.record("u1", nightMode);
    const suggestions = mgr.detectSuggestions("u1");
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]!.count).toBe(3);
  });

  it("saves nothing until the user confirms, then auto-applies by trigger", () => {
    const mgr = new SkillManager({ suggestThreshold: 2 });
    mgr.record("u1", nightMode);
    mgr.record("u1", nightMode);

    // Nothing is persisted merely by detecting a pattern.
    expect(mgr.listSkills("u1")).toHaveLength(0);

    const [suggestion] = mgr.detectSuggestions("u1");
    const skill = mgr.confirmSuggestion("u1", suggestion!, "Night mode", "good night");
    expect(mgr.listSkills("u1")).toHaveLength(1);

    const matched = mgr.findByTrigger("u1", "ok NEXUS, good night");
    expect(matched?.id).toBe(skill.id);
    expect(mgr.apply(matched!)).toEqual(skill.actions);
  });

  it("does not re-suggest a pattern that was already saved", () => {
    const mgr = new SkillManager({ suggestThreshold: 2 });
    mgr.record("u1", nightMode);
    mgr.record("u1", nightMode);
    const [suggestion] = mgr.detectSuggestions("u1");
    mgr.confirmSuggestion("u1", suggestion!, "Night mode", "good night");

    mgr.record("u1", nightMode);
    expect(mgr.detectSuggestions("u1")).toHaveLength(0);
  });

  it("keeps skills isolated per user", () => {
    const mgr = new SkillManager({ suggestThreshold: 2 });
    mgr.createSkill("u1", "Focus", "focus time", [nightMode]);
    expect(mgr.listSkills("u1")).toHaveLength(1);
    expect(mgr.listSkills("u2")).toHaveLength(0);
    expect(mgr.findByTrigger("u2", "focus time")).toBeUndefined();
  });
});
