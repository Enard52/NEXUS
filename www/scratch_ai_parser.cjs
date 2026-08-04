const fs = require('fs');
const file = 'c:/Users/ensar/Desktop/NEXUS-main/stitch-chat.html';
let html = fs.readFileSync(file, 'utf8');

// Replace the buildReply and sendMessage logic with the AI tag parsing logic
const targetLogic = `    setTimeout(() => {
      messages.removeChild(aiProcessing);
      var r = buildReply(text);
      appendAiBubble(r.reply, r.widgetHtml);
      persistMessage('ai', r.reply);
      scrollToBottom();
    }, 1500);`;

const newLogic = `    setTimeout(() => {
      messages.removeChild(aiProcessing);
      var r = buildReply(text);
      var aiText = r.reply;
      
      // Parse Action Tags
      const actionRegex = /\\[ACTION:\\s*([A-Z0-9_]+)\\]/g;
      const actions = [];
      let match;
      while ((match = actionRegex.exec(aiText)) !== null) {
          actions.push(match[1]);
      }
      
      // Clean text
      const cleanText = aiText.replace(actionRegex, '').trim();
      
      // Execute actions
      var additionalWidget = '';
      actions.forEach(action => {
          if (action === 'ENABLE_DARK_MODE') {
              document.documentElement.classList.add('dark');
              localStorage.theme = 'dark';
              additionalWidget += '<div class="mt-3 bg-[#F1F7FF] dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 flex items-center gap-3"><div class="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-800 dark:text-white"><i data-lucide="moon" class="w-5 h-5"></i></div><div><p class="text-sm font-semibold text-gray-800 dark:text-white">Sistem Ayarı</p><p class="text-xs text-gray-500 dark:text-slate-400">Karanlık tema aktif edildi</p></div></div>';
          } else if (action === 'ENABLE_LIGHT_MODE') {
              document.documentElement.classList.remove('dark');
              localStorage.theme = 'light';
              additionalWidget += '<div class="mt-3 bg-[#F1F7FF] border border-slate-200 rounded-xl p-3 flex items-center gap-3"><div class="p-2 bg-white rounded-lg text-amber-500"><i data-lucide="sun" class="w-5 h-5"></i></div><div><p class="text-sm font-semibold text-gray-800">Sistem Ayarı</p><p class="text-xs text-gray-500">Açık tema aktif edildi</p></div></div>';
          } else if (action === 'ENABLE_DND') {
              localStorage.setItem('nexusDndState', 'Açık');
              additionalWidget += '<div class="mt-3 bg-[#F1F7FF] dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 flex items-center gap-3"><div class="p-2 bg-white dark:bg-slate-800 rounded-lg text-[#FF3B5C]"><i data-lucide="bell-off" class="w-5 h-5"></i></div><div><p class="text-sm font-semibold text-gray-800 dark:text-white">Sistem Ayarı</p><p class="text-xs text-gray-500 dark:text-slate-400">Rahatsız etme modu açıldı</p></div></div>';
          }
      });
      
      var finalWidget = (r.widgetHtml || '') + additionalWidget;
      
      appendAiBubble(cleanText, finalWidget);
      persistMessage('ai', cleanText); // Save clean text to history
      scrollToBottom();
      
      if (additionalWidget) {
          lucide.createIcons(); // re-init icons for the new widgets
      }
    }, 1500);`;

html = html.replace(targetLogic, newLogic);

// Add some mock conditions to buildReply so we can test the parser now
const buildReplyTarget = `    } else if (ltext.includes('klima') || ltext.includes('sıcaklık') || ltext.includes('soğut')) {`;
const buildReplyNew = `    } else if (ltext.includes('karanlık') || ltext.includes('gece modu')) {
      reply = 'Hemen karanlık temayı aktif ediyorum, gözlerin artık daha rahat edecek. [ACTION: ENABLE_DARK_MODE]';
    } else if (ltext.includes('açık tema') || ltext.includes('gündüz modu')) {
      reply = 'Açık temaya geçiş yaptım. [ACTION: ENABLE_LIGHT_MODE]';
    } else if (ltext.includes('rahatsız etme') || ltext.includes('bildirimleri kapat')) {
      reply = 'İyi dinlenmeler! Rahatsız etme modunu açtım, hiçbir bildirim seni rahatsız etmeyecek. [ACTION: ENABLE_DND]';
    } else if (ltext.includes('klima') || ltext.includes('sıcaklık') || ltext.includes('soğut')) {`;

html = html.replace(buildReplyTarget, buildReplyNew);

fs.writeFileSync(file, html, 'utf8');
console.log('Parser code added to stitch-chat.html');
