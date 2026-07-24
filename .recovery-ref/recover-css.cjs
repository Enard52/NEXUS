// Authentic renderStyles recovery.
// Source of truth: packages/mobile/dist/index.html <style> block, which was built
// from the pre-corruption web renderStyles (Gen B, matches current markup classes:
// .navbar/.web-nav/.faq-item/.bento-tile/.card/.hero/.lede/.trust ...).
// We keep the current token-based :root (so light+dark theming still works) and
// replace the corrupted component CSS with the recovered authentic rules.
// Read/write done in Node (utf8) to avoid PowerShell console mojibake round-trips.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const mobileHtmlPath = path.join(ROOT, "packages", "mobile", "dist", "index.html");
const renderPath = path.join(ROOT, "packages", "web", "src", "render.ts");

// 1) Extract web renderStyles CSS from mobile dist (everything before `body.mobile`).
const html = fs.readFileSync(mobileHtmlPath, "utf8");
const sStart = html.indexOf("<style>") + "<style>".length;
const sEnd = html.indexOf("</style>", sStart);
const fullCss = html.slice(sStart, sEnd);
const boundary = fullCss.indexOf("body.mobile");
if (boundary < 0) throw new Error("body.mobile boundary not found");
const webCss = fullCss.slice(0, boundary);

// 2) Drop the recovered dark-only :root; keep the rest (component rules, var()-based).
const rootClose = webCss.indexOf("}"); // first '}' closes :root
let comp = webCss.slice(rootClose + 1).replace(/\s+$/, "");

// 3) Bridge the two class-name divergences between recovered CSS and current markup:
//    markup uses `.feature-card` (CSS styles `.feature`) and `.site-footer` (CSS styles `footer.site`).
// Clone every rule whose selector starts with a standalone `.feature` into `.feature-card`.
const featureRuleRe = /\.feature(?=[\s{.:,])[^{}]*\{[^}]*\}/g;
const featureClones = (comp.match(featureRuleRe) || [])
  .map((rule) => rule.replace(/\.feature(?=[\s{.:,])/g, ".feature-card"))
  .join("\n");

const footerBridge = [
  ".site-footer {",
  "  margin-top: 48px; padding: 24px 2rem;",
  "  border-top: 1px solid var(--surface); color: var(--muted); font-size: 12px;",
  "  display: flex; flex-wrap: wrap; gap: 8px 24px; justify-content: space-between;",
  "}",
  ".site-footer a { color: var(--muted); text-decoration: none; }",
  ".site-footer a:hover { color: var(--text); }",
].join("\n");

const bridges =
  "\n/* recovery bridge: current markup uses .feature-card / .site-footer */\n" +
  featureClones +
  "\n" +
  footerBridge +
  "\n";

// 4) Rebuild render.ts: keep lines 1..312 (fn head + token :root) and the final `}`.
const src = fs.readFileSync(renderPath, "utf8");
const lines = src.split(/\r?\n/);
const head = lines.slice(0, 312); // lines 1..312 inclusive (token-based :root)
const tail = lines.slice(426); // line 427 onward: function close `}`

const rebuilt = head.join("\n") + "\n" + comp + "\n" + bridges + "`;\n" + tail.join("\n");
fs.writeFileSync(renderPath, rebuilt, "utf8");

console.log("recovered component CSS chars:", comp.length);
console.log("feature-card clones:", (comp.match(featureRuleRe) || []).length);
console.log("render.ts new length (chars):", rebuilt.length);
console.log("done");
