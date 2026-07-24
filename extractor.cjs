const fs = require('fs');
const txt = fs.readFileSync('C:/Users/ensar/.gemini/antigravity/brain/f2a0d4be-b441-47c4-a125-7b52d8ad09f8/.system_generated/logs/transcript_full.jsonl', 'utf8');
const idx = txt.indexOf('174: export function renderBilling');
const start = txt.lastIndexOf('1: import', idx);
const end = txt.indexOf('"', idx);
const raw = txt.substring(start, end);

// The JSON string contains escaped \n, \r, etc.
// But if it's already in the raw text, we just need to replace literal \n with actual newlines.
// Or we can just parse the JSON line!
const lineStart = txt.lastIndexOf('{', idx);
const lineEnd = txt.indexOf('\n', idx);
const jsonLine = txt.substring(lineStart, lineEnd);
const data = JSON.parse(jsonLine);

let content = data.content;
if (!content && data.output) content = data.output;
if (!content && data.tool_calls) content = JSON.stringify(data.tool_calls);

// content has something like:
// "Showing lines 1 to 242\n1: import { type Theme }...\n2: ..."
const lines = content.split('\n');
const cleaned = lines.filter(l => /^\d+: /.test(l)).map(l => l.replace(/^\d+:\s?/, '')).join('\n');

fs.writeFileSync('packages/web/src/render.ts', cleaned, 'utf8');
console.log('Extracted lines:', cleaned.split('\n').length);
