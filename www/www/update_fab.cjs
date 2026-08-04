const fs = require('fs');

// 1. Fix ai-fab.js
let fab = fs.readFileSync('ai-fab.js', 'utf8');

// The true NEXUS logo SVG to be used anywhere
const trueLogoSvg = <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="NEXUS logo" role="img" class="w-full h-full">
  <defs>
    <linearGradient id="nxlogo" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
      <stop stop-color="#6f9bff"/><stop offset="0.55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/>
    </linearGradient>
    <linearGradient id="nxsheen" x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" stop-opacity="0.30"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxlogo)"/>
  <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxsheen)"/>
  <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#ffffff" stroke-opacity="0.22"/>
  <path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>;

const fabSvgPattern = /<svg width="26" height="26"[\s\S]*?<\/svg>/;
const newFabInner = <div style="width: 28px; height: 28px;"> + trueLogoSvg + </div>;
fab = fab.replace(fabSvgPattern, newFabInner);

// Remove the hardcoded purple gradient background on the fab itself to let the logo shine, 
// or keep a subtle glass background.
fab = fab.replace('background: linear-gradient(135deg, #7C5CFF 0%, #22D3EE 100%);', 'background: rgba(255,255,255,0.9); backdrop-filter: blur(10px);');

fs.writeFileSync('ai-fab.js', fab, 'utf8');
console.log('ai-fab.js updated.');
