const fs = require("fs");
let html = fs.readFileSync("stitch-plus.html", "utf8");

const trueLogoSvg = (
  <div class="w-16 h-16 mx-auto mb-4">
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="NEXUS logo"
      role="img"
      class="w-full h-full"
    >
      <defs>
        <linearGradient id="nxlogo" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
          <stop stop-color="#6f9bff" />
          <stop offset="0.55" stop-color="#5b8dff" />
          <stop offset="1" stop-color="#8b7bff" />
        </linearGradient>
        <linearGradient id="nxsheen" x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ffffff" stop-opacity="0.30" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxlogo)" />
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxsheen)" />
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="8.5"
        fill="none"
        stroke="#ffffff"
        stroke-opacity="0.22"
      />
      <path
        d="M10.5 22.5V10.5L21.5 22.5V10.5"
        fill="none"
        stroke="#ffffff"
        stroke-width="2.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
);

// Add logo above NEXUS AI Plus
html = html.replace(
  '<h1 class="text-5xl font-extrabold text-black dark:text-white dark:text-white mb-2">NEXUS AI Plus</h1>',
  trueLogoSvg +
    '\n<h1 class="text-5xl font-extrabold text-black dark:text-white dark:text-white mb-2">NEXUS AI Plus</h1>',
);
html = html.replace(
  '<h1 class="text-5xl font-extrabold text-black dark:text-white dark:text-white dark:text-white mb-2">NEXUS AI Plus</h1>',
  trueLogoSvg +
    '\n<h1 class="text-5xl font-extrabold text-black dark:text-white dark:text-white dark:text-white mb-2">NEXUS AI Plus</h1>',
);

// Fix the list icons
html = html.replace(
  /<div class="bg-nexus-purple rounded-full p-1">/g,
  '<div class="bg-nexus-purple rounded-full w-6 h-6 flex items-center justify-center shrink-0">',
);
html = html.replace(/viewbox/g, "viewBox");

fs.writeFileSync("stitch-plus.html", html, "utf8");
