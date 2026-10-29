/**
 * NEXUS — ortak uyarı penceresi (masaüstü ve mobil). Tarayıcının alert/toast'u yerine
 * ekranın ortasında, uygulamanın görünümüyle uyumlu bir kart açar.
 * Kullanım: nexusDialog({ title, message, primary: { label, onClick }, secondary: { label, onClick } })
 */
(function () {
  if (window.nexusDialog) return;

  var SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">';
  var ICONS = {
    info: SVG + '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg>',
    language: SVG + '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/></svg>',
    temperature: SVG + '<path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0z"/></svg>',
    warning: SVG + '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    check: SVG + '<path d="M20 6 9 17l-5-5"/></svg>'
  };

  var STYLE_ID = 'nx-dialog-style';
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '.nx-dlg-back{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;' +
      'background:rgba(15,23,42,.45);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);animation:nxDlgFade .18s ease-out}' +
      '.nx-dlg{width:min(92vw,380px);border-radius:24px;padding:24px 22px 18px;background:#fff;color:#0f172a;' +
      'box-shadow:0 24px 60px -20px rgba(15,23,42,.45);animation:nxDlgPop .22s cubic-bezier(.2,.9,.3,1.2)}' +
      'html.dark .nx-dlg,html[data-theme="dark"] .nx-dlg{background:#1e293b;color:#f1f5f9}' +
      '.nx-dlg{text-align:center}' +
      '.nx-dlg-head{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 0 6px}' +
      '.nx-dlg-ico{display:inline-flex;flex:none;width:20px;height:20px;color:#4C7DFF}' +
      'html.dark .nx-dlg-ico{color:#8fb0ff}' +
      '.nx-dlg-ico svg{width:20px;height:20px}' +
      '.nx-dlg-title{font-size:18px;font-weight:800;letter-spacing:-.01em;margin:0}' +
      '.nx-dlg-msg{font-size:14.5px;line-height:1.5;color:#64748b;margin:0 0 20px}' +
      'html.dark .nx-dlg-msg{color:#94a3b8}' +
      '.nx-dlg-actions{display:flex;flex-direction:column;gap:8px}' +
      '.nx-dlg-btn{width:100%;min-height:48px;border-radius:14px;border:0;font-size:15px;font-weight:700;cursor:pointer;transition:transform .15s ease}' +
      '.nx-dlg-btn:active{transform:scale(.98)}' +
      '.nx-dlg-primary{color:#fff;background:linear-gradient(135deg,#6f9bff,#4C7DFF 60%,#8b7bff);box-shadow:0 12px 24px -12px rgba(76,125,255,.9)}' +
      '.nx-dlg-secondary{background:transparent;color:#64748b}' +
      '.nx-dlg-input{width:100%;box-sizing:border-box;min-height:48px;margin:0 0 16px;padding:0 14px;border-radius:14px;border:1px solid #e2e8f0;background:#f8fafc;color:#0f172a;font:600 15px/1.2 Inter,system-ui,sans-serif}' +
      'html.dark .nx-dlg-input,html[data-theme="dark"] .nx-dlg-input{background:#0f172a;border-color:#334155;color:#f1f5f9}' +
      '.nx-dlg-list{display:flex;flex-direction:column;gap:8px;margin:0 0 16px}' +
      '.nx-dlg-opt{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:52px;padding:0 16px;border-radius:14px;border:1px solid #e2e8f0;background:#f8fafc;color:#0f172a;font-size:15px;font-weight:600;cursor:pointer;text-align:left}' +
      'html.dark .nx-dlg-opt,html[data-theme="dark"] .nx-dlg-opt{background:#0f172a;border-color:#334155;color:#f1f5f9}' +
      '.nx-dlg-opt.is-selected{border-color:#4C7DFF;box-shadow:0 0 0 1px #4C7DFF inset;color:#3F6FFF}' +
      '.nx-dlg-opt i{font-style:normal;font-weight:800;color:#4C7DFF}' +
      '@keyframes nxDlgFade{from{opacity:0}to{opacity:1}}' +
      '@keyframes nxDlgPop{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}';
    document.head.appendChild(s);
  }

  function close(back) {
    if (back && back.parentNode) back.parentNode.removeChild(back);
    document.removeEventListener('keydown', onKey);
  }
  var current = null;
  function onKey(e) { if (e.key === 'Escape' && current) { close(current); current = null; } }

  window.nexusDialog = function (opts) {
    opts = opts || {};
    injectStyle();
    if (current) { close(current); current = null; }

    var back = document.createElement('div');
    back.className = 'nx-dlg-back';
    back.setAttribute('role', 'dialog');
    back.setAttribute('aria-modal', 'true');

    var card = document.createElement('div');
    card.className = 'nx-dlg';

    // Simge diyaloğun içeriğine göre seçilir (ör. dil, sıcaklık, uyarı); verilmezse nötr bilgi simgesi.
    // Başlık satırı: küçük, kutusuz simge + başlık. Aynı yerleşim tüm diyaloglarda geçerli.
    var head = document.createElement('div');
    head.className = 'nx-dlg-head';
    var ico = document.createElement('span');
    ico.className = 'nx-dlg-ico';
    ico.setAttribute('aria-hidden', 'true');
    ico.innerHTML = ICONS[opts.icon] || ICONS.info;
    head.appendChild(ico);

    var title = document.createElement('h2');
    title.className = 'nx-dlg-title';
    title.textContent = opts.title || 'NEXUS';
    head.appendChild(title);
    card.appendChild(head);

    if (opts.message) {
      var msg = document.createElement('p');
      msg.className = 'nx-dlg-msg';
      msg.textContent = opts.message;
      card.appendChild(msg);
    }

    var field = null;
    if (opts.input) {
      field = document.createElement('input');
      field.className = 'nx-dlg-input';
      field.type = 'text';
      field.maxLength = opts.input.maxLength || 60;
      field.placeholder = opts.input.placeholder || '';
      field.value = opts.input.value || '';
      field.setAttribute('aria-label', opts.title || 'NEXUS');
      card.appendChild(field);
    }

    var actions = document.createElement('div');
    actions.className = 'nx-dlg-actions';

    function button(cfg, cls) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'nx-dlg-btn ' + cls;
      b.textContent = cfg.label || 'Tamam';
      b.addEventListener('click', function () {
        var value = field ? field.value : undefined;
        close(back);
        current = null;
        if (typeof cfg.onClick === 'function') cfg.onClick(value);
      });
      return b;
    }
    // Seçenek listesi: her satır bir seçenek; seçilince onSelect(value) çağrılır ve pencere kapanır.
    if (Array.isArray(opts.options)) {
      var list = document.createElement('div');
      list.className = 'nx-dlg-list';
      opts.options.forEach(function (o) {
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'nx-dlg-opt' + (o.selected ? ' is-selected' : '');
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', o.selected ? 'true' : 'false');
        row.innerHTML = '<span></span><i aria-hidden="true">' + (o.selected ? '✓' : '') + '</i>';
        row.firstChild.textContent = o.label;
        row.addEventListener('click', function () {
          close(back);
          current = null;
          if (typeof opts.onSelect === 'function') opts.onSelect(o.value);
        });
        list.appendChild(row);
      });
      card.appendChild(list);
    }
    if (opts.primary) actions.appendChild(button(opts.primary, 'nx-dlg-primary'));
    if (opts.secondary) actions.appendChild(button(opts.secondary, 'nx-dlg-secondary'));
    if (Array.isArray(opts.options) && !opts.secondary) actions.appendChild(button({ label: 'Vazgeç' }, 'nx-dlg-secondary'));
    if (!opts.primary && !opts.secondary && !Array.isArray(opts.options)) actions.appendChild(button({ label: 'Tamam' }, 'nx-dlg-primary'));
    card.appendChild(actions);

    back.appendChild(card);
    back.addEventListener('click', function (e) {
      if (e.target === back) { close(back); current = null; }
    });
    document.body.appendChild(back);
    document.addEventListener('keydown', onKey);
    if (field && opts.primary) {
      field.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var primary = actions.querySelector('.nx-dlg-primary');
        if (primary) primary.click();
      });
    }
    current = back;
    if (field) { field.focus(); field.select(); }
    else { var first = actions.querySelector('button'); if (first) first.focus(); }
    return back;
  };
})();
