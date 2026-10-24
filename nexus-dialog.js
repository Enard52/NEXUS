/**
 * NEXUS — ortak uyarı penceresi (masaüstü ve mobil). Tarayıcının alert/toast'u yerine
 * ekranın ortasında, uygulamanın görünümüyle uyumlu bir kart açar.
 * Kullanım: nexusDialog({ title, message, primary: { label, onClick }, secondary: { label, onClick } })
 */
(function () {
  if (window.nexusDialog) return;

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
      '.nx-dlg-ico{margin-left:auto;margin-right:auto;width:48px;height:48px;border-radius:16px;display:flex;align-items:center;justify-content:center;' +
      'background:linear-gradient(135deg,#6f9bff,#4C7DFF 60%,#8b7bff);color:#fff;box-shadow:0 10px 22px -10px rgba(76,125,255,.9);margin-bottom:14px}' +
      '.nx-dlg-ico svg{width:24px;height:24px}' +
      '.nx-dlg-title{font-size:18px;font-weight:800;letter-spacing:-.01em;margin:0 0 6px}' +
      '.nx-dlg-msg{font-size:14.5px;line-height:1.5;color:#64748b;margin:0 0 20px}' +
      'html.dark .nx-dlg-msg{color:#94a3b8}' +
      '.nx-dlg-actions{display:flex;flex-direction:column;gap:8px}' +
      '.nx-dlg-btn{width:100%;min-height:48px;border-radius:14px;border:0;font-size:15px;font-weight:700;cursor:pointer;transition:transform .15s ease}' +
      '.nx-dlg-btn:active{transform:scale(.98)}' +
      '.nx-dlg-primary{color:#fff;background:linear-gradient(135deg,#6f9bff,#4C7DFF 60%,#8b7bff);box-shadow:0 12px 24px -12px rgba(76,125,255,.9)}' +
      '.nx-dlg-secondary{background:transparent;color:#64748b}' +
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

    var ico = document.createElement('div');
    ico.className = 'nx-dlg-ico';
    ico.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>';
    card.appendChild(ico);

    var title = document.createElement('h2');
    title.className = 'nx-dlg-title';
    title.textContent = opts.title || 'NEXUS';
    card.appendChild(title);

    if (opts.message) {
      var msg = document.createElement('p');
      msg.className = 'nx-dlg-msg';
      msg.textContent = opts.message;
      card.appendChild(msg);
    }

    var actions = document.createElement('div');
    actions.className = 'nx-dlg-actions';

    function button(cfg, cls) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'nx-dlg-btn ' + cls;
      b.textContent = cfg.label || 'Tamam';
      b.addEventListener('click', function () {
        close(back);
        current = null;
        if (typeof cfg.onClick === 'function') cfg.onClick();
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
    current = back;
    var first = actions.querySelector('button');
    if (first) first.focus();
    return back;
  };
})();
