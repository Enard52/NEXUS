const fs = require("fs");
const file = "c:/Users/ensar/Desktop/NEXUS-main/stitch-feedback.html";
let html = fs.readFileSync(file, "utf8");

// Header title wrapping fix: Add whitespace-nowrap and truncate if necessary, maybe text-xl instead of text-2xl
html = html.replace(
  '<h1 class="text-2xl font-bold absolute left-1/2 -translate-x-1/2">SSS ve Geri Bildirim</h1>',
  '<h1 class="text-xl font-bold absolute left-1/2 -translate-x-1/2 whitespace-nowrap">SSS ve Geri Bildirim</h1>',
);

// Body dark mode
html = html.replace(
  '<body class="bg-gradient-custom text-slate-900 min-h-screen flex flex-col">',
  '<body class="bg-gradient-custom dark:bg-slate-900 text-slate-900 dark:text-white min-h-screen flex flex-col">',
);

// Back button dark mode
html = html.replace(
  'class="w-7 h-7 text-slate-700"',
  'class="w-7 h-7 text-slate-700 dark:text-white"',
);

// Background of cards
// Replace all instances of `bg-white` with `bg-white dark:bg-slate-800`
// EXCEPT those inside the SVG logo
html = html.replace(/bg-white(?!\/)/g, "bg-white dark:bg-slate-800");

// Text colors inside cards
html = html.replace(/text-slate-500/g, "text-slate-500 dark:text-slate-400");
html = html.replace(/text-slate-800/g, "text-slate-800 dark:text-white");
html = html.replace(/text-slate-900/g, "text-slate-900 dark:text-white");

// Dividers in FAQ
html = html.replace(/divide-slate-50/g, "divide-slate-50 dark:divide-slate-700/50");
html = html.replace(/active:bg-slate-50/g, "active:bg-slate-50 dark:active:bg-slate-700/50");
html = html.replace(/bg-slate-50/g, "bg-slate-50 dark:bg-slate-700/50");
html = html.replace(/border-slate-200/g, "border-slate-200 dark:border-slate-700");

// Icon colors
html = html.replace(/text-slate-300/g, "text-slate-300 dark:text-slate-500");
html = html.replace(/text-slate-400/g, "text-slate-400 dark:text-slate-500");

// Input fields background in dark mode
html = html.replace(
  /<select class="([^"]+)"/g,
  '<select class="$1 dark:bg-slate-900 dark:text-white"',
);
html = html.replace(
  /<textarea class="([^"]+)"/g,
  '<textarea class="$1 dark:bg-slate-900 dark:text-white"',
);
html = html.replace(
  /<input class="([^"]+)"/g,
  '<input class="$1 dark:bg-slate-900 dark:text-white"',
);

// Update theme CSS in stitch-feedback.html (if any) or it's handled by theme.js globally.
// The bg-gradient-custom in light mode is fine, but in dark mode theme.js might override it, or we should use !important.
// Wait, theme.js has logic: `body { background: #0f172a !important; }` for dark mode, but `.bg-gradient-custom` might have higher specificity if it's an ID or inline? No, it's a class.

fs.writeFileSync(file, html, "utf8");
console.log("Updated stitch-feedback.html with dark mode classes and header wrapping fix.");
