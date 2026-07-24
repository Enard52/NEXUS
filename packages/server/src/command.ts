import type { IncomingMessage, ServerResponse } from "node:http";
import type { NexusCore } from "@nexus/core";
import type { RoutineSuggestionEngine } from "@nexus/routines";
import type { UserDataStore } from "./userdata.js";

const MAX_BODY = 64 * 1024;

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return await new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  if (!res.headersSent) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  }
  res.end(text);
}

export async function handleCommandApi(
  req: IncomingMessage,
  res: ServerResponse,
  core: NexusCore,
  userId: string,
  confirm: boolean,
  suggestionEngine?: RoutineSuggestionEngine,
  userDataStore?: UserDataStore
): Promise<void> {
  const body = await readJsonBody(req);
  const utterance = String(body.utterance ?? "");
  const response = await core.handle(userId, utterance, { confirm });

  if (suggestionEngine && userDataStore) {
    const data = userDataStore.get(userId);
    if (data) {
      // Simulate real time or use a mock time if provided via headers/body for testing
      const testTime = Array.isArray(req.headers["x-test-time"]) 
        ? req.headers["x-test-time"][0] 
        : req.headers["x-test-time"];
      let at = testTime;
      if (!at) {
        const now = new Date();
        at = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      }
      
      for (const step of response.executed) {
        suggestionEngine.observe({ action: step.action as any, at });
      }
      
      const newSuggestions = suggestionEngine.suggest();
      let changed = false;
      let suggestions = [...data.suggestions];
      for (const s of newSuggestions) {
        // Only add if not already suggested and not already a routine
        if (!suggestions.some(ex => ex.id === s.signature) && !data.routines.some(r => r.name === s.proposal.name)) {
          suggestions.push({
            id: s.signature,
            text: s.proposal.name,
            at: s.at,
          });
          changed = true;
        }
      }
      if (changed) {
        userDataStore.set(userId, { ...data, suggestions });
      }
    }
  }

  sendJson(res, 200, response);
}
