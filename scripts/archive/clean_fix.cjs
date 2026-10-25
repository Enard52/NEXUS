const fs = require("fs");
const files = fs.readdirSync(".").filter((f) => f.endsWith(".html"));
const metaTags =
  '\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="default">\n<meta name="theme-color" content="#ffffff">\n';
for (let f of files) {
  let c = fs.readFileSync(f, "utf8");
  c = c.replace(
    /<meta content="width=device-width, initial-scale=1.0" name="viewport"\s*\/>/g,
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>',
  );
  if (!c.includes("apple-mobile-web-app-capable")) c = c.replace("<title>", metaTags + "<title>");
  if (!["stitch-login.html", "stitch-onboarding.html"].includes(f)) {
    if (!c.includes('src="theme.js"'))
      c = c.replace("</head>", '<script src="theme.js"></script>\n</head>');
    if (!c.includes('src="ai-fab.js"'))
      c = c.replace("</head>", '<script src="ai-fab.js"></script>\n</head>');
  }

  // Dark mode fixes for discover
  if (f === "stitch-discover.html") {
    c = c.replace(
      '<body class="bg-light-blue-gradient min-h-screen flex flex-col">',
      '<body class="bg-light-blue-gradient min-h-screen flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-300">',
    );
    c = c.replace(".bg-light-blue-gradient {", ".bg-light-blue-gradient {\n    ");
    c = c.replace(
      /background: linear-gradient\(180deg, #E4E0FB 0%, #F2F0FF 100%\);\s*\}/,
      "background: linear-gradient(180deg, #E4E0FB 0%, #F2F0FF 100%);\n    }\n    html.dark .bg-light-blue-gradient {\n      background: linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%);\n    }",
    );
    c = c.replace(/bg-white/g, "bg-white dark:bg-slate-800");
    c = c.replace(/text-gray-800/g, "text-gray-800 dark:text-white");
    c = c.replace(/text-gray-900/g, "text-gray-900 dark:text-white");
    c = c.replace(/text-black/g, "text-black dark:text-white");
    c = c.replace(/text-gray-400/g, "text-gray-400 dark:text-gray-300");
    c = c.replace(/bg-white\/90/g, "bg-white/90 dark:bg-slate-900/90");
    c = c.replace(/border-slate-100/g, "border-slate-100 dark:border-slate-800");
  }

  // Dark mode fixes for plus
  if (f === "stitch-plus.html") {
    c = c.replace(
      '<body class="flex flex-col items-center p-6">',
      '<body class="flex flex-col items-center p-6 text-slate-900 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-300">',
    );
    c = c.replace(/bg-white/g, "bg-white dark:bg-slate-800");
    c = c.replace(/text-gray-500/g, "text-gray-500 dark:text-gray-300");
    c = c.replace(/text-gray-600/g, "text-gray-600 dark:text-gray-300");
    c = c.replace(/text-gray-800/g, "text-gray-800 dark:text-white");
    c = c.replace(/text-gray-900/g, "text-gray-900 dark:text-white");
    c = c.replace(/text-black/g, "text-black dark:text-white");
  }

  fs.writeFileSync(f, c, "utf8");
}
console.log("Clean fixes applied!");
