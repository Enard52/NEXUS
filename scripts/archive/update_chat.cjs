const fs = require('fs');
let text = fs.readFileSync('stitch-chat.html', 'utf8');

// Fix body height
text = text.replace('h-screen', 'h-[100dvh]');

// Define the new interactive main content
const newMain = <!-- BEGIN: MainContent -->
<main class="flex-grow flex flex-col relative bg-nexus-gradient h-[calc(100dvh-80px)]" data-purpose="main-chat-area">
  
  <!-- Chat Messages Area (Scrollable) -->
  <div id="chat-messages" class="flex-grow overflow-y-auto px-4 py-6 space-y-4 flex flex-col justify-start">
    
    <!-- Central Greeting (Hidden when chat starts) -->
    <div id="hero-greeting" class="flex flex-col items-center justify-center text-center mt-10 mb-8 transition-opacity duration-300">
      <h1 class="text-3xl text-nexus-purple leading-tight opacity-80 mb-6" style="font-weight: 400;">
        Tekrar görüşmek güzel!<br/>Nasıl yardımcı olabilirim?
      </h1>
      <!-- Features Scrolling Pills -->
      <div class="flex flex-wrap justify-center gap-3">
        <button onclick="sendQuickMessage('Akıllı Kontrol')" class="flex items-center gap-2 px-4 py-2 bg-white/60 border border-purple-100 rounded-2xl shadow-sm text-sm font-medium text-gray-700">
          <svg class="h-4 w-4 text-nexus-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          Akıllı Kontrol
        </button>
        <button onclick="sendQuickMessage('Tüm ışıkları kapat')" class="flex items-center gap-2 px-4 py-2 bg-white/60 border border-purple-100 rounded-2xl shadow-sm text-sm font-medium text-gray-700">
          <svg class="h-4 w-4 text-nexus-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          Enerji Tasarrufu
        </button>
      </div>
    </div>
  </div>

  <!-- Input Bar -->
  <div class="px-4 pb-6 pt-2 shrink-0 bg-white/80 backdrop-blur-md" style="padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));" data-purpose="chat-input-container">
    <div class="flex items-center gap-2 bg-white rounded-[2rem] p-2 shadow-lg shadow-gray-200/50 border border-gray-100">
      <!-- Add Button -->
      <button aria-label="Ek ekle" class="bg-gray-100 p-3 rounded-2xl ml-1 transition-colors hover:bg-gray-200">
        <svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
      </button>
      <!-- Input Field -->
      <div class="flex-grow flex items-center gap-3 px-2">
        <div class="w-6 h-6 rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#22D3EE] flex items-center justify-center text-white font-bold text-xs shrink-0">N</div>
        <input id="chat-input" class="w-full border-none focus:ring-0 text-gray-700 text-base bg-transparent placeholder-gray-400" placeholder="Nasıl yardımcı olabilirim?" type="text" onkeypress="handleKeyPress(event)"/>
      </div>
      <!-- Send Button -->
      <button id="chat-send" onclick="sendMessage()" class="bg-[#7C5CFF] p-3 rounded-2xl mr-1 transition-colors hover:bg-purple-500 text-white shadow-md">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"></path></svg>
      </button>
    </div>
  </div>
</main>

<script>
  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  }

  function sendQuickMessage(text) {
    const input = document.getElementById('chat-input');
    input.value = text;
    sendMessage();
  }

  function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    
    // Hide greeting
    const greeting = document.getElementById('hero-greeting');
    if (greeting) {
      greeting.style.display = 'none';
    }

    const messages = document.getElementById('chat-messages');
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'flex justify-end mb-4 w-full';
    userMsg.innerHTML = '<div class="bg-gray-100 text-gray-800 px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] text-[15px] shadow-sm leading-relaxed">' + escapeHtml(text) + '</div>';
    messages.appendChild(userMsg);
    
    input.value = '';
    scrollToBottom();

    // Show processing
    const aiProcessing = document.createElement('div');
    aiProcessing.className = 'flex justify-start mb-4 w-full ai-msg';
    aiProcessing.innerHTML = '<div class="flex items-end gap-2 max-w-[85%]"><div class="w-6 h-6 rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#22D3EE] flex items-center justify-center text-white font-bold text-[10px] shrink-0 mb-1">N</div><div class="bg-white border border-gray-100 text-gray-500 px-5 py-3 rounded-2xl rounded-tl-sm text-[14px] shadow-sm flex gap-1 items-center"><span class="w-2 h-2 bg-purple-300 rounded-full animate-bounce"></span><span class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></span><span class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></span></div></div>';
    messages.appendChild(aiProcessing);
    scrollToBottom();

    // Simulate AI response
    setTimeout(() => {
      messages.removeChild(aiProcessing);
      
      const aiResponse = document.createElement('div');
      aiResponse.className = 'flex justify-start mb-4 w-full';
      
      let reply = "Harika bir fikir! İşlemi arka planda gerçekleştiriyorum.";
      let widgetHtml = "";
      
      const ltext = text.toLowerCase();
      if (ltext.includes('ışık') || ltext.includes('kapat') || ltext.includes('enerji')) {
        reply = "Tüm ışıklar başarıyla kapatıldı. Enerji tasarrufu modu devrede.";
        widgetHtml = '<div class="mt-3 bg-nexus-bg-light border border-purple-100 rounded-xl p-3 flex items-center gap-3"><div class="p-2 bg-white rounded-lg text-purple-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg></div><div><p class="text-sm font-semibold text-gray-800">Işıklar Kapatıldı</p><p class="text-xs text-gray-500">12 Cihaz</p></div></div>';
      } else if (ltext.includes('klima') || ltext.includes('sıcaklık')) {
        reply = "Klima 22 dereceye ayarlandı ve Akıllı Eco modu açıldı.";
        widgetHtml = '<div class="mt-3 bg-nexus-bg-light border border-blue-100 rounded-xl p-3 flex items-center gap-3"><div class="p-2 bg-white rounded-lg text-blue-500"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"></path></svg></div><div><p class="text-sm font-semibold text-gray-800">Klima: 22°C</p><p class="text-xs text-gray-500">Oturma Odası</p></div></div>';
      }

      aiResponse.innerHTML = '<div class="flex items-end gap-2 max-w-[90%]"><div class="w-6 h-6 rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#22D3EE] flex items-center justify-center text-white font-bold text-[10px] shrink-0 mb-1">N</div><div class="bg-white border border-gray-100 text-gray-800 px-5 py-3 rounded-2xl rounded-tl-sm text-[15px] shadow-sm leading-relaxed">' + reply + widgetHtml + '</div></div>';
      
      messages.appendChild(aiResponse);
      scrollToBottom();
    }, 1500);
  }

  function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }

  function scrollToBottom() {
    const messages = document.getElementById('chat-messages');
    messages.scrollTop = messages.scrollHeight;
  }
</script>
<!-- END: MainContent -->;

const mainRegex = /<!-- BEGIN: MainContent -->[\s\S]*?<!-- END: MainContent -->/;
text = text.replace(mainRegex, newMain);

fs.writeFileSync('stitch-chat.html', text, 'utf8');
