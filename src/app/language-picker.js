// NEXUS — tam ekran dil seçici (arama + kaydırmalı liste). Dil sayısı çok olunca
// küçük diyalog yerine sayfa gibi açılır; liste theme.js'teki dil kaydından gelir:
// Türkçe, English + COMMUNITY_LANGS. Metinler Türkçe yazılır, i18n.js çevirir.
(function () {
  var wrap = null;

  function languages() {
    var out = [
      { code: 'tr', name: 'Türkçe', en: 'Turkish' },
      { code: 'en', name: 'English', en: 'English' },
    ];
    var community = window.NEXUS_COMMUNITY_LANGS || {};
    Object.keys(community)
      .map(function (code) { return { code: code, name: community[code].name, en: community[code].en || '' }; })
      .sort(function (a, b) { return a.name.localeCompare(b.name); })
      .forEach(function (l) { out.push(l); });
    return out;
  }

  function norm(s) { return String(s || '').toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function ensureStyle() {
    if (document.getElementById('nx-lang-style')) return;
    var st = document.createElement('style');
    st.id = 'nx-lang-style';
    st.textContent =
      '.nx-lang-search{display:flex;align-items:center;gap:12px;padding:12px 16px;margin-bottom:12px;border-radius:16px;background:#fff;border:1px solid #eef0f6}' +
      '.nx-lang-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;font-size:16px;color:#1e293b}' +
      '.nx-lang-search svg{width:20px;height:20px;flex:none;color:#94a3b8}' +
      '.nx-lang-list{display:flex;flex-direction:column;padding:6px}' +
      '.nx-lang-row{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:14px 12px;border:0;border-radius:14px;background:none;text-align:start;cursor:pointer;color:#1e293b;font-size:17px;font-weight:600}' +
      '.nx-lang-row:active{background:#f1f5f9}' +
      '.nx-lang-row small{display:block;margin-top:2px;font-size:12px;font-weight:500;color:#94a3b8}' +
      '.nx-lang-row svg{width:22px;height:22px;flex:none;color:#4C7DFF}' +
      '.nx-lang-empty{padding:28px 0;text-align:center;font-size:14px;color:#94a3b8}' +
      'html.dark .nx-lang-search{background:#1e293b;border-color:#334155}' +
      'html.dark .nx-lang-search input,html.dark .nx-lang-row{color:#e2e8f0}' +
      'html.dark .nx-lang-row:active{background:#334155}';
    document.head.appendChild(st);
  }

  function row(l, current) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'nx-lang-row';
    b.setAttribute('data-no-i18n', '');
    b.setAttribute('lang', l.code);
    var left = document.createElement('span');
    left.textContent = l.name;
    if (l.en && l.en !== l.name) { var sm = document.createElement('small'); sm.textContent = l.en; left.appendChild(sm); }
    b.appendChild(left);
    if (l.code === current) {
      b.setAttribute('aria-current', 'true');
      b.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>');
    }
    b.addEventListener('click', function () {
      if (l.code === current) { close(); return; }
      if (typeof window.nexusSetLanguage === 'function') window.nexusSetLanguage(l.code);
    });
    return b;
  }

  function render(list, query, current) {
    var q = norm(query);
    list.textContent = '';
    var shown = 0;
    languages().forEach(function (l) {
      if (q && norm(l.name).indexOf(q) === -1 && norm(l.en).indexOf(q) === -1 && l.code.toLowerCase().indexOf(q) === -1) return;
      list.appendChild(row(l, current));
      shown++;
    });
    if (!shown) {
      var e = document.createElement('p');
      e.className = 'nx-lang-empty';
      e.textContent = 'Eşleşen dil bulunamadı.';
      list.appendChild(e);
    }
  }

  function close() {
    if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    wrap = null;
  }

  function open() {
    if (wrap) return;
    ensureStyle();
    var current = window.nexusUiLang || (window.nexusLang === 'en' ? 'en' : 'tr');
    wrap = document.createElement('div');
    wrap.className = 'nx-full-wrap';
    wrap.style.cssText = 'position:fixed;inset:0;z-index:60';
    wrap.innerHTML =
      '<div class="nx-full" role="dialog" aria-modal="true" aria-labelledby="nx-lang-title">' +
      '<div class="nx-full-head"><button type="button" class="nx-full-back" aria-label="Geri" onclick="nexusCloseLanguagePicker()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button><h2 id="nx-lang-title">Dil</h2></div>' +
      '<p class="nx-full-lead">Uygulama dilini seç.</p>' +
      '<label class="nx-lang-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>' +
      '<input type="search" id="nx-lang-q" placeholder="Dil ara" autocomplete="off" aria-label="Dil ara"></label>' +
      '<div class="nx-full-card nx-lang-list" id="nx-lang-list"></div></div>';
    document.body.appendChild(wrap);
    var list = wrap.querySelector('#nx-lang-list');
    var input = wrap.querySelector('#nx-lang-q');
    render(list, '', current);
    input.addEventListener('input', function () { render(list, input.value, current); });
    document.addEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape' && wrap) { close(); document.removeEventListener('keydown', onKey); }
  }

  window.nexusOpenLanguagePicker = open;
  window.nexusCloseLanguagePicker = function () { close(); document.removeEventListener('keydown', onKey); };
})();
