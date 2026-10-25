const fs = require("fs");

let html = fs.readFileSync("stitch-integrations.html", "utf8");

// Replace the onclick for the "Kurulum Kodu Gir" button
html = html.replace(
  /<article class="bg-white rounded-2xl menu-container-shadow p-4 flex items-center justify-between gap-3 border border-slate-50 active:bg-slate-50 transition-colors" onclick="simulateConnection\(this\)">\s*<div class="flex items-center gap-4 min-w-0">\s*<div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">\s*<i class="w-6 h-6" data-lucide="hash"><\/i>\s*<\/div>\s*<div class="min-w-0">\s*<h2 class="font-bold leading-tight text-slate-800">Kurulum Kodu Gir<\/h2>/,
  '<article class="bg-white rounded-2xl menu-container-shadow p-4 flex items-center justify-between gap-3 border border-slate-50 active:bg-slate-50 transition-colors" onclick="openCodeModal()">\n          <div class="flex items-center gap-4 min-w-0">\n            <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">\n              <i class="w-6 h-6" data-lucide="hash"></i>\n            </div>\n            <div class="min-w-0">\n              <h2 class="font-bold leading-tight text-slate-800">Kurulum Kodu Gir</h2>',
);

// Add the Modal HTML just above the Loading Overlay
const modalHtml = `
  <!-- Code Entry Modal -->
  <div id="code-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] hidden flex flex-col items-center justify-center px-6">
    <div class="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl relative overflow-hidden transform scale-95 transition-transform" id="code-modal-content">
      <div class="text-center mb-6 mt-2">
        <div class="w-16 h-16 bg-slate-100 text-[#7C5CFF] rounded-full mx-auto flex items-center justify-center mb-4">
          <i class="w-8 h-8" data-lucide="hash"></i>
        </div>
        <h2 class="text-2xl font-bold text-slate-800">Kurulum Kodu</h2>
        <p class="text-sm text-slate-500 mt-2">Cihazınızın üzerindeki veya kutusundaki 8 haneli Matter/HomeKit kodunu girin.</p>
      </div>
      <div class="mb-6">
        <input type="text" id="setup-code-input" class="w-full text-center text-3xl tracking-[0.2em] font-bold text-slate-800 border-none bg-slate-50 rounded-2xl py-4 focus:ring-2 focus:ring-[#7C5CFF]" placeholder="00000000" maxlength="8" autocomplete="off" />
      </div>
      <div class="flex gap-3">
        <button class="flex-1 py-3.5 rounded-2xl font-bold text-slate-600 bg-slate-100 active:bg-slate-200 transition-colors" onclick="closeCodeModal()">İptal</button>
        <button class="flex-1 py-3.5 rounded-2xl font-bold text-white bg-[#7C5CFF] active:bg-[#6b4ae8] transition-colors shadow-md shadow-[#7C5CFF]/30" onclick="submitCode()">Bağlan</button>
      </div>
    </div>
  </div>
`;

html = html.replace("<!-- Loading Overlay -->", modalHtml + "\n  <!-- Loading Overlay -->");

// Add the JS logic
const scriptLogic = `
    function openCodeModal() {
      const modal = document.getElementById('code-modal');
      const content = document.getElementById('code-modal-content');
      modal.classList.remove('hidden');
      setTimeout(() => {
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
        document.getElementById('setup-code-input').focus();
      }, 10);
    }
    
    function closeCodeModal() {
      const modal = document.getElementById('code-modal');
      const content = document.getElementById('code-modal-content');
      content.classList.remove('scale-100');
      content.classList.add('scale-95');
      setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('setup-code-input').value = '';
      }, 200);
    }

    function submitCode() {
      const input = document.getElementById('setup-code-input').value;
      if (input.length < 4) {
        // Just a simple validation
        alert('Lütfen geçerli bir kod girin.');
        return;
      }
      closeCodeModal();
      setTimeout(() => {
        simulateConnection(null, input);
      }, 300);
    }
`;

html = html.replace(
  "function simulateConnection(el) {",
  scriptLogic + "\n    function simulateConnection(el, code) {",
);

fs.writeFileSync("stitch-integrations.html", html, "utf8");
console.log("Fixed stitch-integrations.html to show a setup code modal");
