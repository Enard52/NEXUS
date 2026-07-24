const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:/Users/ensar/.gemini/antigravity/brain/f2a0d4be-b441-47c4-a125-7b52d8ad09f8/.system_generated/logs/transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const j = JSON.parse(line);
      const c = j.content || j.output || '';
      
      // Look for the specific view_file or command output that contains the FULL render.ts
      if (c.includes('export function renderBilling') && c.includes('1: import { type Theme }')) {
         console.log("Found line with length: ", c.length);
         // Extract lines
         const lines = c.split('\n');
         const cleaned = lines
            .filter(l => /^\d+:/.test(l))
            .map(l => l.replace(/^\d+:\s?/, ''))
            .join('\n');
         
         if (cleaned.length > 5000) {
            fs.writeFileSync('packages/web/src/render.ts', cleaned, 'utf8');
            console.log("SUCCESSFULLY RECOVERED render.ts!");
            return;
         }
      }
    } catch (e) {
      // Ignore
    }
  }
}

processLineByLine();
