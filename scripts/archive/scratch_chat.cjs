const fs = require("fs");

const file = "c:/Users/ensar/Desktop/NEXUS-main/stitch-chat.html";
let content = fs.readFileSync(file, "utf8");

// 1. Add custom CSS for chat bubbles
const styleRegex = /<\/head>/;
const newStyles = `
  <style>
    .ai-bubble {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      color: #1e293b;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.03);
    }
    html.dark .ai-bubble {
      background: rgba(30, 41, 59, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.06);
      color: #f8fafc;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    }
    
    .user-bubble {
      background: linear-gradient(135deg, #7C5CFF 0%, #6040e6 100%);
      color: #ffffff;
      box-shadow: 0 4px 16px rgba(124, 92, 255, 0.3);
    }
  </style>
</head>`;
content = content.replace(styleRegex, newStyles);

// 2. Update appendUserBubble
const userRegex =
  /userMsg\.innerHTML = '<div class="bg-gray-100 text-gray-800 px-5 py-3 rounded-2xl rounded-tr-sm max-w-\[85%\] text-\[15px\] shadow-sm leading-relaxed">' \+ escapeHtml\(text\) \+ '<\/div>';/;
const newUserMsg = `userMsg.innerHTML = '<div class="user-bubble px-5 py-3.5 rounded-3xl rounded-tr-sm max-w-[85%] text-[15px] font-medium leading-relaxed">' + escapeHtml(text) + '</div>';`;
content = content.replace(userRegex, newUserMsg);

// 3. Update appendAiBubble
const aiRegex =
  /aiResponse\.innerHTML = '<div class="flex items-end gap-2 max-w-\[90%\]"><div class="w-6 h-6 shrink-0 mb-1"><svg viewBox="0 0 32 32" fill="none" xmlns="http:\/\/www\.w3\.org\/2000\/svg" class="w-full h-full"><rect x="1" y="1" width="30" height="30" rx="9" fill="url\(#nxlogo\)"\/><rect x="1" y="1" width="30" height="30" rx="9" fill="url\(#nxsheen\)"\/><path d="M10\.5 22\.5V10\.5L21\.5 22\.5V10\.5" fill="none" stroke="#ffffff" stroke-width="2\.6" stroke-linecap="round" stroke-linejoin="round"\/><\/svg><\/div><div class="bg-white border border-gray-100 text-gray-800 px-5 py-3 rounded-2xl rounded-tl-sm text-\[15px\] shadow-sm leading-relaxed">' \+ escapeHtml\(reply\) \+ \(widgetHtml \|\| ''\) \+ '<\/div><\/div>';/;
const newAiMsg = `aiResponse.innerHTML = '<div class="flex items-end gap-2.5 max-w-[92%]"><div class="w-7 h-7 shrink-0 mb-1 shadow-sm rounded-xl overflow-hidden"><svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"><rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxlogo)"/><rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxsheen)"/><path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="ai-bubble px-5 py-3.5 rounded-3xl rounded-tl-sm text-[15px] font-medium tracking-tight">' + escapeHtml(reply) + (widgetHtml || '') + '</div></div>';`;
content = content.replace(aiRegex, newAiMsg);

fs.writeFileSync(file, content);
console.log("Chat bubbles upgraded successfully.");
