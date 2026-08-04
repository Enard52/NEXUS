# NEXUS Layouts

Bu projede paylaşılan düzen yapısı tekrar eden HTML blokları üzerinden ilerliyor. Aşağıdaki dosyalar mevcut mobil dilin ana iskeletini oluşturuyor.

## `stitch-home.html`
- Rol: ana shell, home selector, AI input, bottom nav, quick add sheet

```html
<header class="pt-12 pb-4 flex items-center justify-between px-5" data-purpose="main-header">
  <div class="flex items-center">
    <button onclick="toggleHomeSelector()" class="flex items-center gap-2.5 bg-white/60 backdrop-blur-md border border-slate-200/60 pl-2 pr-4 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform" data-purpose="home-selector">
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#6344E6] flex items-center justify-center text-white shadow-inner flex-shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
      </div>
      <div class="flex flex-col justify-center">
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">Mevcut Ev</span>
        <span class="text-sm font-bold text-slate-800 leading-none" data-bind="householdName">Evim</span>
      </div>
      <svg class="w-4 h-4 text-slate-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
    </button>
  </div>
  <div class="flex items-center gap-4">
    <a href="stitch-plus.html" class="bg-[#7C5CFF] text-white px-5 py-1.5 rounded-full font-medium text-sm flex items-center shadow-sm">Plus</a>
    <button aria-label="Hızlı ekle" class="text-[#7C5CFF]" onclick="toggleQuickAdd()">
      <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
    </button>
  </div>
</header>

<section class="px-5 pb-2" data-purpose="ai-search-container">
  <a href="stitch-chat.html" class="block">
    <div class="custom-gradient-border px-4 py-3 flex items-center shadow-sm">
      <div class="h-8 w-8 flex shrink-0 mr-3"></div>
      <input class="flex-grow border-none focus:ring-0 text-sm font-medium text-gray-700 bg-transparent placeholder-gray-500" placeholder="Nasıl yardımcı olabilirim?" type="text"/>
      <div class="flex items-center space-x-4 pr-1">
        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>
        <button type="button" data-ai-helper-action class="text-gray-600 hover:text-gray-800 transition-colors"></button>
      </div>
    </div>
  </a>
</section>

<nav class="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 h-20 flex items-center justify-around px-2 pb-2 z-50" data-purpose="bottom-nav">
  <a href="stitch-home.html" class="flex flex-col items-center gap-1 text-[#7C5CFF]"><i class="w-6 h-6 stroke-[1.5]" data-lucide="home"></i><span class="text-xs font-bold">Ev</span></a>
  <a href="stitch-smart.html" class="flex flex-col items-center gap-1 text-slate-400"><i class="w-6 h-6 stroke-[1.5]" data-lucide="layout-grid"></i><span class="text-xs font-medium">Akıllı</span></a>
  <a href="stitch-discover.html" class="flex flex-col items-center gap-1 text-slate-400 relative"><i class="w-6 h-6 stroke-[1.5]" data-lucide="compass"></i><span class="text-xs font-medium">Keşfet</span></a>
  <a href="stitch-profile.html" class="flex flex-col items-center gap-1 text-slate-400"><i class="w-6 h-6 stroke-[1.5]" data-lucide="user"></i><span class="text-xs font-medium">Profil</span></a>
</nav>
```

## `stitch-smart.html`
- Rol: home selector + AI input + segmented tab shell + recommendation cards

```html
<nav class="flex border-b border-gray-200" data-purpose="tabs">
  <button onclick="switchTab('tab-smart', this)" class="flex-1 py-3 text-sm font-bold text-gray-900 relative tab-active" id="btn-tab-smart">Akıllı Uygulama</button>
  <button onclick="switchTab('tab-clickrun', this)" class="flex-1 py-3 text-center text-sm font-semibold text-gray-500 block transition-colors" id="btn-tab-clickrun">Tıkla ve çalıştır</button>
  <button onclick="switchTab('tab-automation', this)" class="flex-1 py-3 text-center text-sm font-semibold text-gray-500 block transition-colors" id="btn-tab-automation">Otomasyon</button>
</nav>

<main class="flex-grow px-5 pt-6 pb-28" data-purpose="main-content">
  <div id="tab-smart" class="block">
    <div class="bg-white rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-50 mb-8" data-purpose="empty-state-card">
      <h2 class="text-xl font-bold text-gray-900 mb-2">Akıllı Uygulama Oluştur</h2>
      <p class="text-gray-500 font-medium mb-8">Akıllı Uygulamanı Özelleştir</p>
      <button class="bg-[#7C5CFF] text-white px-10 py-3 rounded-full font-bold text-sm">Oluştur</button>
    </div>
    <section data-purpose="recommendations">
      <div class="mb-4">
        <h3 class="text-xl font-bold text-gray-900">Önerilen</h3>
        <p class="text-sm text-slate-500 mt-1">Eklenen cihazlarına göre şekillenen akıllı uygulama fikirleri.</p>
      </div>
      <div class="space-y-4" id="smart-recommendations-list"></div>
    </section>
  </div>
</main>
```

## `stitch-settings.html`
- Rol: stacked settings cards, toggle rows, sticky top bar

```html
<header class="bg-white border-b border-gray-100 px-4 pt-12 pb-4 flex items-center justify-between sticky top-0 z-10">
  <a href="javascript:void(0)" aria-label="Geri" class="p-1"><svg class="h-8 w-8" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"></svg></a>
  <h1 class="whitespace-nowrap text-2xl font-bold text-gray-900 absolute left-1/2 -translate-x-1/2">Ayarlar</h1>
  <div class="w-8"></div>
</header>
<main class="flex-grow px-4 pt-6 pb-8 space-y-4 overflow-y-auto">
  <section class="bg-white rounded-3xl overflow-hidden shadow-sm" data-purpose="settings-card"></section>
  <section class="bg-white rounded-3xl overflow-hidden shadow-sm" data-purpose="settings-card"></section>
</main>
```
