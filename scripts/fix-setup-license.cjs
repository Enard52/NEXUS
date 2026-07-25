const fs = require("fs");
let c = fs.readFileSync("packages/desktop/src/setup.ts", "utf-8");

const start = c.indexOf("function stepLicense()");
const end = c.indexOf("function stepLocation", start);

const newFn = `function stepLicense(): string {
  return (
    \`<h2>\${label("setup.licenseTitle")}</h2>\` +
    \`<p>\${label("setup.licenseHint")}</p>\` +
    \`<div class="license-box"><pre style="margin:0;white-space:pre-wrap;font-family:var(--font-mono, 'JetBrains Mono', monospace);font-size:12px;">\${escapeHtml(label("setup.licenseText"))}</pre></div>\` +
    \`<label class="check-row" id="license-check-label">\` +
    \`<input type="checkbox" id="license-accept" onchange="window.__nx_licenseChanged(this)"> \` +
    \`\${label("setup.accept")}\` +
    \`</label>\`
  );
}

`;

c = c.slice(0, start) + newFn + c.slice(end);
fs.writeFileSync("packages/desktop/src/setup.ts", c, "utf-8");
console.log("stepLicense replaced successfully");
