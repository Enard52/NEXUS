const fs = require("fs");
const readline = require("readline");

async function processLineByLine() {
  const fileStream = fs.createReadStream(
    "C:/Users/ensar/.gemini/antigravity/brain/f2a0d4be-b441-47c4-a125-7b52d8ad09f8/.system_generated/logs/transcript_full.jsonl",
  );

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const j = JSON.parse(line);
      const c = j.content || j.output || "";

      if (
        c.includes("export function renderBilling") &&
        c.length > 5000 &&
        !c.includes("// 1. Remove raw crown emoji")
      ) {
        console.log("Found line with length: ", c.length);
        const lines = c.split("\n");
        const cleaned = lines
          .filter((l) => /^\d+:/.test(l))
          .map((l) => l.replace(/^\d+:\s?/, ""))
          .join("\n");

        if (cleaned.length > 5000) {
          fs.writeFileSync("packages/web/src/render.ts", cleaned, "utf8");
          console.log("SUCCESSFULLY RECOVERED render.ts! Length:", cleaned.length);
          return;
        } else {
          console.log("Cleaned length was: ", cleaned.length);
        }
      }
    } catch (e) {
      // Ignore
    }
  }
}

processLineByLine();
