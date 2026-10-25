const fs = require("fs");

const homeFile = "c:/Users/ensar/Desktop/NEXUS-main/stitch-home.html";
const smartFile = "c:/Users/ensar/Desktop/NEXUS-main/stitch-smart.html";
const scanFile = "c:/Users/ensar/Desktop/NEXUS-main/stitch-scan.html";
const chatFile = "c:/Users/ensar/Desktop/NEXUS-main/stitch-chat.html";

let homeContent = fs.readFileSync(homeFile, "utf8");
let smartContent = fs.readFileSync(smartFile, "utf8");
let scanContent = fs.readFileSync(scanFile, "utf8");
let chatContent = fs.readFileSync(chatFile, "utf8");

// 1. Remove 'Manuel Ekle'
const manualStr = `<a class="flex items-center space-x-4 p-3 rounded-2xl active:bg-slate-50 transition-colors" data-purpose="action-item" href="stitch-integrations.html">
<div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
<i class="w-6 h-6 text-slate-800 stroke-[1.5]" data-lucide="keyboard"></i>
</div>
<span class="text-xl font-semibold text-slate-800">Manuel Ekle</span>
</a>`;

homeContent = homeContent.replace(manualStr, "");
smartContent = smartContent.replace(manualStr, "");

fs.writeFileSync(homeFile, homeContent);
fs.writeFileSync(smartFile, smartContent);
console.log("Removed manual ekle from home and smart.");

// 2. Scan file button
const scanLinkStr = `<a class="mx-auto flex items-center gap-1 text-white/70 font-medium" href="stitch-integrations.html">
    QR kod bulunamadı, manuel ekleyin
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewbox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"></path></svg>
</a>`;

const newScanBtn = `<a class="mx-auto flex items-center justify-center gap-2 bg-[#7C5CFF]/20 text-[#7C5CFF] hover:bg-[#7C5CFF]/30 transition-colors font-semibold px-6 py-3 rounded-xl w-full max-w-[280px] border border-[#7C5CFF]/30" href="stitch-integrations.html">
    Manuel Cihaz Ekle
    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round"></path></svg>
</a>`;

scanContent = scanContent.replace(scanLinkStr, newScanBtn);
fs.writeFileSync(scanFile, scanContent);
console.log("Updated scan file button.");

// 3. Update chat input
const oldChatInputStr = `<div class="px-4 pb-6 pt-2 shrink-0 bg-white/80 backdrop-blur-md" style="padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));" data-purpose="chat-input-container">
    <div class="flex items-center gap-2 bg-white rounded-[2rem] p-2 shadow-lg shadow-gray-200/50 border border-gray-100">
      <!-- Add Button -->
      <button aria-label="Ek ekle" class="bg-gray-100 p-3 rounded-2xl ml-1 transition-colors hover:bg-gray-200">
        <svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
      </button>
      <!-- Input Field -->
      <div class="flex-grow flex items-center px-1">
        <input id="chat-input" class="w-full border-none focus:ring-0 text-gray-700 text-[16px] bg-transparent placeholder-gray-400" placeholder="Nasıl yardımcı olabilirim?" type="text" onkeypress="handleKeyPress(event)"/>
      </div>
      <!-- Send Button -->
      <button id="chat-send" onclick="sendMessage()" class="bg-[#7C5CFF] p-3 rounded-2xl mr-1 transition-colors hover:bg-purple-500 text-white shadow-md">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"></path></svg>
      </button>
    </div>
  </div>`;

const newChatInputStr = `<div class="px-4 pb-6 pt-2 shrink-0 bg-white/80 backdrop-blur-md" style="padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));" data-purpose="chat-input-container">
    <div class="custom-gradient-border px-4 py-3 flex items-center shadow-sm">
      <!-- NEXUS N leading mark -->
      <button aria-label="Ek ekle" class="w-8 h-8 flex shrink-0 mr-3 opacity-80 hover:opacity-100 transition-opacity">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="NEXUS logo" role="img" class="w-full h-full">
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
        </svg>
      </button>
      
      <input id="chat-input" class="flex-grow border-none focus:ring-0 text-sm font-medium text-gray-700 bg-transparent placeholder-gray-500" placeholder="Nasıl yardımcı olabilirim?" type="text" onkeypress="handleKeyPress(event)"/>
      
      <div class="flex items-center space-x-4 pr-1">
        <!-- Mic Icon -->
        <button class="text-gray-600 hover:text-gray-800 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
        </button>
        <!-- Send Button -->
        <button id="chat-send" onclick="sendMessage()" class="text-[#7C5CFF] hover:text-purple-600 transition-colors disabled:opacity-40">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"></path></svg>
        </button>
      </div>
    </div>
  </div>`;

// Add custom-gradient-border CSS if not present
if (!chatContent.includes(".custom-gradient-border")) {
  const cssStyle = `
  <style data-purpose="custom-gradient-border">
    .custom-gradient-border {
      position: relative;
      background: white;
      background-clip: padding-box;
      border: 2px solid transparent;
      border-radius: 9999px;
    }
    .custom-gradient-border::before {
      content: '';
      position: absolute;
      top: -2px; right: -2px; bottom: -2px; left: -2px;
      z-index: -1;
      border-radius: 9999px;
      background: linear-gradient(135deg, #7C5CFF 0%, #22D3EE 100%);
    }
    html.dark .custom-gradient-border {
      background: #1e293b;
      background-clip: padding-box;
    }
  </style>
</head>`;
  chatContent = chatContent.replace("</head>", cssStyle);
}

chatContent = chatContent.replace(oldChatInputStr, newChatInputStr);
fs.writeFileSync(chatFile, chatContent);
console.log("Updated chat input.");
