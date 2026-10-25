const fs = require("fs");

const homeHtml = fs.readFileSync("stitch-home.html", "utf8");
let smartHtml = fs.readFileSync("stitch-smart.html", "utf8");

// Extract the <header> block from stitch-home.html
const headerMatch = homeHtml.match(
  /<header class="pt-12 pb-4 flex items-center justify-between px-5" data-purpose="main-header">[\s\S]*?<\/header>/,
);

if (headerMatch) {
  let headerHtml = headerMatch[0];

  // Replace the "Plus" pill with the "Günlükler" icon
  headerHtml = headerHtml.replace(
    /<a href="stitch-plus.html" class="bg-\[#7C5CFF\] text-white px-5 py-1\.5 rounded-full font-medium text-sm flex items-center shadow-sm">\s*Plus\s*<\/a>/,
    `<button aria-label="Günlükler" class="text-slate-600 p-1 hover:text-slate-900 active:scale-95 transition-transform" onclick="window.location.href='stitch-logs.html'">
            <i class="w-7 h-7" data-lucide="file-text"></i>
         </button>`,
  );

  // Make the + button in stitch-smart point to stitch-plus instead of toggleQuickAdd,
  // unless toggleQuickAdd modal is also added. Actually, let's just make it go to stitch-plus as it did before.
  headerHtml = headerHtml.replace(
    'onclick="toggleQuickAdd()"',
    "onclick=\"window.location.href='stitch-plus.html'\"",
  );

  // Replace the old <section data-purpose="main-header"> in stitch-smart.html
  const oldHeaderRegex =
    /<section class="px-5 pt-12 pb-2 flex justify-between items-center" data-purpose="main-header">[\s\S]*?<\/section>/;
  smartHtml = smartHtml.replace(oldHeaderRegex, headerHtml);

  fs.writeFileSync("stitch-smart.html", smartHtml, "utf8");
  console.log("Fixed header in stitch-smart.html to match stitch-home.html perfectly");
} else {
  console.log("Could not find header in stitch-home.html");
}
