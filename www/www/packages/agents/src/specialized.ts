/**
 * NEXUS AI — Specialized Agents
 *
 * Four domain-specific agents that provide real functionality:
 * - HomeAgent: Smart home control (wraps 4 home logic)
 *  - LifeAgent: Daily routines, wellness, reminders
 *  - KnowledgeAgent: Information queries, facts, calculations
 *  - SecurityAgent: Home security monitoring, access control
 *  - FinanceAgent: Budget tracking, expense categorization
 *
 * Each agent implements the NexusAgent protocol with proper scoring,
 * scoped permissions, and inter-agent delegation support.
 */

import type {
  NexusAgent,
  AgentPermissions,
  AgentCapability,
  AgentResult,
  MultiAgentContext,
} from "./protocol.js";

// ── Home Agent ────────────────────────────────────────────────────────────────

export class MultiHomeAgent implements NexusAgent {
  readonly id = "home";
  readonly name = "Home Assistant";
  readonly description = "Controls smart home devices, manages rooms and scenes.";
  readonly icon = "home";
  readonly status = "active" as const;

  readonly permissions: AgentPermissions = {
    scopes: ["devices", "routines", "memory"],
    canDelegate: true,
    maxRiskLevel: "medium",
  };

  readonly capabilities: readonly AgentCapability[] = [
    {
      domain: "home",
      intents: ["home.*", "device.*", "scene.*", "routine.*"],
      keywords: [
        "light",
        "lamp",
        "switch",
        "temperature",
        "thermostat",
        "blinds",
        "ışık",
        "lamba",
        "sıcaklık",
        "perde",
        "aç",
        "kapat",
        "room",
        "oda",
      ],
    },
  ];

  score(intent: string, slots: Record<string, unknown>): number {
    if (intent.startsWith("home.") || intent.startsWith("device.") || intent.startsWith("scene."))
      return 0.95;
    if (intent.startsWith("routine.")) return 0.7;
    // Keyword scan for unstructured intents
    const text = String(slots.text ?? "").toLowerCase();
    if (/\b(light|lamp|switch|temperature|ışık|lamba|sıcaklık)\b/.test(text)) return 0.6;
    return 0;
  }

  async handle(
    intent: string,
    slots: Record<string, unknown>,
    _ctx: MultiAgentContext,
  ): Promise<AgentResult> {
    const room = String(slots.room ?? "living");
    const device = String(slots.device ?? "light");
    const state = String(slots.state ?? "on");

    if (intent === "home.control" || intent.startsWith("device.")) {
      return {
        text: `${device} in ${room} set to ${state}.`,
        actions: [
          {
            kind: "device.set",
            params: { room, device, state },
            risk: "medium",
            description: `Set ${device} in ${room} to ${state}`,
          },
        ],
        confidence: 0.9,
      };
    }

    if (intent.startsWith("scene.")) {
      const sceneName = intent.replace("scene.", "");
      return {
        text: `Activating scene: ${sceneName}.`,
        actions: [
          {
            kind: "scene.activate",
            params: { scene: sceneName },
            risk: "low",
            description: `Activate scene ${sceneName}`,
          },
        ],
        confidence: 0.85,
      };
    }

    return {
      text: `Home command received for ${room}.`,
      actions: [],
      confidence: 0.5,
    };
  }
}

// ── Life Agent ────────────────────────────────────────────────────────────────

export class LifeAgent implements NexusAgent {
  readonly id = "life";
  readonly name = "Life Coach";
  readonly description = "Manages daily routines, wellness reminders, and life organization.";
  readonly icon = "heart";
  readonly status = "active" as const;

  readonly permissions: AgentPermissions = {
    scopes: ["memory", "personalization", "routines"],
    canDelegate: true,
    maxRiskLevel: "low",
  };

  readonly capabilities: readonly AgentCapability[] = [
    {
      domain: "life",
      intents: ["life.*", "wellness.*", "reminder.*", "schedule.*"],
      keywords: [
        "reminder",
        "schedule",
        "morning",
        "evening",
        "routine",
        "sleep",
        "water",
        "exercise",
        "break",
        "hatırlatıcı",
        "sabah",
        "akşam",
        "uyku",
        "su",
        "egzersiz",
      ],
    },
  ];

  score(intent: string, slots: Record<string, unknown>): number {
    if (
      intent.startsWith("life.") ||
      intent.startsWith("wellness.") ||
      intent.startsWith("reminder.")
    )
      return 0.9;
    if (intent.startsWith("schedule.")) return 0.7;
    const text = String(slots.text ?? "").toLowerCase();
    if (
      /\b(remind|schedule|morning|routine|sleep|water|exercise|break|sabah|akşam|uyku|su)\b/.test(
        text,
      )
    )
      return 0.6;
    return 0;
  }

  async handle(
    intent: string,
    slots: Record<string, unknown>,
    ctx: MultiAgentContext,
  ): Promise<AgentResult> {
    if (intent === "life.morning_briefing" || /morning|sabah/.test(String(slots.text ?? ""))) {
      return {
        text: this.generateMorningBriefing(ctx),
        actions: [],
        confidence: 0.85,
        delegations: [
          {
            targetAgent: "home",
            intent: "scene.morning",
            payload: {},
            reason: "Activate morning scene",
          },
        ],
      };
    }

    if (intent === "life.hydration" || /water|su/.test(String(slots.text ?? ""))) {
      return {
        text: "💧 Hydration reminder set! I'll remind you to drink water every 2 hours.",
        actions: [
          {
            kind: "reminder.set",
            params: { type: "hydration", intervalMinutes: 120 },
            risk: "low",
            description: "Set hydration reminder every 2 hours",
          },
        ],
        confidence: 0.9,
      };
    }

    if (intent === "life.break" || /break|mola/.test(String(slots.text ?? ""))) {
      return {
        text: "⏰ Break reminder activated. I'll suggest a 5-minute break every 50 minutes.",
        actions: [
          {
            kind: "reminder.set",
            params: { type: "break", intervalMinutes: 50, durationMinutes: 5 },
            risk: "low",
            description: "Set break reminder every 50 minutes",
          },
        ],
        confidence: 0.85,
      };
    }

    if (intent === "life.sleep" || /sleep|uyku/.test(String(slots.text ?? ""))) {
      return {
        text: "🌙 Sleep mode preparation: I'll dim the lights, enable DnD, and remind you 30 minutes before your target bedtime.",
        actions: [
          {
            kind: "life.sleep_prep",
            params: { reminderBeforeMinutes: 30 },
            risk: "low",
            description: "Prepare for sleep mode",
          },
        ],
        confidence: 0.9,
        delegations: [
          {
            targetAgent: "home",
            intent: "scene.night",
            payload: {},
            reason: "Dim lights for sleep",
          },
        ],
      };
    }

    return {
      text: "I can help with reminders, routines, hydration tracking, and wellness goals. What would you like?",
      actions: [],
      confidence: 0.4,
    };
  }

  private generateMorningBriefing(_ctx: MultiAgentContext): string {
    return `☀️ Good morning! Here's your briefing:\n• Time to start your day\n• Weather is clear\n• No urgent reminders pending\nShall I activate your morning routine?`;
  }
}

// ── Knowledge Agent ───────────────────────────────────────────────────────────

export class KnowledgeAgent implements NexusAgent {
  readonly id = "knowledge";
  readonly name = "Knowledge Assistant";
  readonly description = "Answers questions, performs calculations, and provides information.";
  readonly icon = "book";
  readonly status = "active" as const;

  readonly permissions: AgentPermissions = {
    scopes: ["knowledge", "memory"],
    canDelegate: false,
    maxRiskLevel: "low",
  };

  readonly capabilities: readonly AgentCapability[] = [
    {
      domain: "knowledge",
      intents: ["knowledge.*", "calculate.*", "define.*", "explain.*"],
      keywords: [
        "what",
        "how",
        "why",
        "when",
        "calculate",
        "define",
        "explain",
        "ne",
        "nasıl",
        "neden",
        "ne zaman",
        "hesapla",
        "tanımla",
        "açıkla",
        "kaç",
      ],
    },
  ];

  score(intent: string, slots: Record<string, unknown>): number {
    if (
      intent.startsWith("knowledge.") ||
      intent.startsWith("calculate.") ||
      intent.startsWith("explain.")
    )
      return 0.9;
    const text = String(slots.text ?? "").toLowerCase();
    // Math expression detection (highest priority for unstructured)
    if (/[\d]+\s*[+\-*/^]\s*[\d]+/.test(text)) return 0.8;
    if (/\b(what|how|why|when|calculate|ne\s|nasıl|neden|kaç|hesapla)\b/.test(text)) return 0.5;
    return 0;
  }

  async handle(
    intent: string,
    slots: Record<string, unknown>,
    _ctx: MultiAgentContext,
  ): Promise<AgentResult> {
    const text = String(slots.text ?? slots.query ?? "");
    const mathMatch = text.match(/([\d.]+)\s*([+\-*/^])\s*([\d.]+)/);
    if (mathMatch || intent === "calculate.math") {
      const result = this.evaluateMath(text);
      if (result !== undefined) {
        return {
          text: `The result is: ${result}`,
          actions: [],
          confidence: 0.95,
          metadata: { type: "calculation", expression: text, result },
        };
      }
    }

    // Unit conversion
    if (/\b(convert|to|celsius|fahrenheit|km|mile|kg|pound|çevir)\b/i.test(text)) {
      const conversion = this.tryConversion(text);
      if (conversion) {
        return { text: conversion, actions: [], confidence: 0.9 };
      }
    }

    // Time/date queries
    if (/\b(time|date|day|today|saat|tarih|gün|bugün)\b/i.test(text)) {
      return {
        text: `Current time: ${new Date().toLocaleString()}`,
        actions: [],
        confidence: 0.8,
      };
    }

    // General knowledge — would connect to AI provider in production
    return {
      text: `I'd look that up for you. Query: "${text}"`,
      actions: [],
      confidence: 0.4,
      metadata: { type: "general_query", query: text },
    };
  }

  private evaluateMath(expr: string): number | undefined {
    const match = expr.match(/([\d.]+)\s*([+\-*/^])\s*([\d.]+)/);
    if (!match) return undefined;
    const a = parseFloat(match[1]!);
    const op = match[2]!;
    const b = parseFloat(match[3]!);
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b !== 0 ? a / b : undefined;
      case "^":
        return Math.pow(a, b);
      default:
        return undefined;
    }
  }

  private tryConversion(text: string): string | undefined {
    const celToFah = text.match(/([\d.]+)\s*(?:°?C|celsius)\s*(?:to|in)\s*(?:°?F|fahrenheit)/i);
    if (celToFah) {
      const c = parseFloat(celToFah[1]!);
      return `${c}°C = ${((c * 9) / 5 + 32).toFixed(1)}°F`;
    }
    const fahToCel = text.match(/([\d.]+)\s*(?:°?F|fahrenheit)\s*(?:to|in)\s*(?:°?C|celsius)/i);
    if (fahToCel) {
      const f = parseFloat(fahToCel[1]!);
      return `${f}°F = ${(((f - 32) * 5) / 9).toFixed(1)}°C`;
    }
    const kmToMile = text.match(/([\d.]+)\s*km\s*(?:to|in)\s*mile/i);
    if (kmToMile) {
      const km = parseFloat(kmToMile[1]!);
      return `${km} km = ${(km * 0.621371).toFixed(2)} miles`;
    }
    return undefined;
  }
}

// ── Security Agent ────────────────────────────────────────────────────────────

export class SecurityAgent implements NexusAgent {
  readonly id = "security";
  readonly name = "Security Monitor";
  readonly description = "Monitors home security, manages access control and alerts.";
  readonly icon = "shield";
  readonly status = "active" as const;

  readonly permissions: AgentPermissions = {
    scopes: ["security", "devices", "memory"],
    canDelegate: true,
    maxRiskLevel: "high",
  };

  readonly capabilities: readonly AgentCapability[] = [
    {
      domain: "security",
      intents: ["security.*", "alarm.*", "access.*", "lock.*"],
      keywords: [
        "security",
        "alarm",
        "lock",
        "unlock",
        "camera",
        "door",
        "motion",
        "güvenlik",
        "alarm",
        "kilit",
        "kapı",
        "kamera",
        "hareket",
      ],
    },
  ];

  private armed = false;
  private readonly accessLog: Array<{ action: string; at: string }> = [];

  score(intent: string, slots: Record<string, unknown>): number {
    if (intent.startsWith("security.") || intent.startsWith("alarm.") || intent.startsWith("lock."))
      return 0.95;
    const text = String(slots.text ?? "").toLowerCase();
    if (/\b(security|alarm|lock|unlock|camera|door|güvenlik|kilit|kapı|kamera)\b/.test(text))
      return 0.7;
    return 0;
  }

  async handle(
    intent: string,
    slots: Record<string, unknown>,
    _ctx: MultiAgentContext,
  ): Promise<AgentResult> {
    if (intent === "security.arm" || /arm|kur/.test(String(slots.text ?? ""))) {
      this.armed = true;
      this.log("armed");
      return {
        text: "🔒 Security system armed. All sensors active. I'll alert you to any unusual activity.",
        actions: [
          {
            kind: "security.arm",
            params: { mode: "full" },
            risk: "medium",
            description: "Arm security system",
          },
        ],
        confidence: 0.95,
      };
    }

    if (intent === "security.disarm" || /disarm|devre dışı/.test(String(slots.text ?? ""))) {
      this.armed = false;
      this.log("disarmed");
      return {
        text: "🔓 Security system disarmed.",
        actions: [
          {
            kind: "security.disarm",
            params: {},
            risk: "high",
            description: "Disarm security system",
          },
        ],
        confidence: 0.95,
      };
    }

    if (intent === "security.status" || /status|durum/.test(String(slots.text ?? ""))) {
      return {
        text: `Security status: ${this.armed ? "🔒 ARMED" : "🔓 Disarmed"}. No alerts. Last ${this.accessLog.length} events logged.`,
        actions: [],
        confidence: 0.9,
        metadata: { armed: this.armed, logCount: this.accessLog.length },
      };
    }

    if (intent === "security.lock" || intent === "lock.door") {
      const target = String(slots.target ?? slots.door ?? "front door");
      this.log(`locked:${target}`);
      return {
        text: `🔐 ${target} locked.`,
        actions: [
          {
            kind: "lock.set",
            params: { target, locked: true },
            risk: "medium",
            description: `Lock ${target}`,
          },
        ],
        confidence: 0.9,
      };
    }

    return {
      text: `Security agent ready. System is ${this.armed ? "armed" : "disarmed"}.`,
      actions: [],
      confidence: 0.4,
    };
  }

  /** Check if system is currently armed. */
  isArmed(): boolean {
    return this.armed;
  }

  private log(action: string): void {
    this.accessLog.push({ action, at: new Date().toISOString() });
  }
}

// ── Finance Agent ─────────────────────────────────────────────────────────────

interface Expense {
  readonly amount: number;
  readonly category: string;
  readonly description: string;
  readonly at: string;
}

export class FinanceAgent implements NexusAgent {
  readonly id = "finance";
  readonly name = "Finance Tracker";
  readonly description = "Tracks expenses, manages budgets, and provides spending insights.";
  readonly icon = "wallet";
  readonly status = "active" as const;

  readonly permissions: AgentPermissions = {
    scopes: ["finance", "memory"],
    canDelegate: false,
    maxRiskLevel: "low",
  };

  readonly capabilities: readonly AgentCapability[] = [
    {
      domain: "finance",
      intents: ["finance.*", "budget.*", "expense.*"],
      keywords: [
        "budget",
        "expense",
        "spend",
        "money",
        "cost",
        "save",
        "bütçe",
        "harcama",
        "para",
        "maliyet",
        "tasarruf",
        "fiyat",
      ],
    },
  ];

  private readonly expenses: Expense[] = [];
  private budget = 0;

  score(intent: string, slots: Record<string, unknown>): number {
    if (
      intent.startsWith("finance.") ||
      intent.startsWith("budget.") ||
      intent.startsWith("expense.")
    )
      return 0.9;
    const text = String(slots.text ?? "").toLowerCase();
    if (/\b(budget|expense|spend|money|cost|save|bütçe|harcama|para|fiyat)\b/.test(text))
      return 0.65;
    // Amount pattern (e.g. "$50", "50 TL")
    if (/\$?\d+(?:\.\d{2})?\s*(?:TL|USD|EUR|\$|₺)?/.test(text)) return 0.4;
    return 0;
  }

  async handle(
    intent: string,
    slots: Record<string, unknown>,
    _ctx: MultiAgentContext,
  ): Promise<AgentResult> {
    if (intent === "finance.add_expense" || intent === "expense.add") {
      const amount = Number(slots.amount ?? 0);
      const category = String(slots.category ?? "general");
      const desc = String(slots.description ?? slots.text ?? "");

      if (amount > 0) {
        this.expenses.push({ amount, category, description: desc, at: new Date().toISOString() });
        const total = this.getTotalSpending();
        return {
          text: `💰 Expense recorded: ${amount} for "${desc}" (${category}). Total spending: ${total}.`,
          actions: [
            {
              kind: "finance.record",
              params: { amount, category, description: desc },
              risk: "low",
              description: `Record expense: ${amount}`,
            },
          ],
          confidence: 0.9,
        };
      }
    }

    if (intent === "finance.set_budget" || intent === "budget.set") {
      const amount = Number(slots.amount ?? 0);
      if (amount > 0) {
        this.budget = amount;
        return {
          text: `📊 Monthly budget set to ${amount}. I'll track your spending against this.`,
          actions: [
            {
              kind: "finance.set_budget",
              params: { amount },
              risk: "low",
              description: `Set budget to ${amount}`,
            },
          ],
          confidence: 0.9,
        };
      }
    }

    if (
      intent === "finance.summary" ||
      intent === "budget.status" ||
      /summary|özet|durum/.test(String(slots.text ?? ""))
    ) {
      const total = this.getTotalSpending();
      const remaining = this.budget > 0 ? this.budget - total : undefined;
      const categories = this.getCategoryBreakdown();

      let text = `📊 Spending summary: ${total} total`;
      if (remaining !== undefined) {
        text += ` | Budget: ${this.budget} | Remaining: ${remaining}`;
      }
      if (categories.length > 0) {
        text += `\n${categories.map(([cat, amt]) => `  • ${cat}: ${amt}`).join("\n")}`;
      }

      return {
        text,
        actions: [],
        confidence: 0.85,
        metadata: { total, budget: this.budget, remaining, expenses: this.expenses.length },
      };
    }

    return {
      text: "I can track expenses, set budgets, and provide spending summaries. Try: 'add expense 50 for groceries'.",
      actions: [],
      confidence: 0.3,
    };
  }

  private getTotalSpending(): number {
    return this.expenses.reduce((sum, e) => sum + e.amount, 0);
  }

  private getCategoryBreakdown(): [string, number][] {
    const map = new Map<string, number>();
    for (const e of this.expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }
}
