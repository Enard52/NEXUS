// Seçim kutuları (<select>): tarayıcının/işletim sisteminin gri açılır listesi yerine uygulamanın kendi
// tasarımı gösterilir. Yerel <select> DOM'da kalır (değer, form, "change" olayı ve sayfa kodu aynen çalışır);
// yalnızca görünmez olur, yerine aynı sınıfları taşıyan bir düğme + özel liste gelir.
// Sonradan eklenen (innerHTML ile üretilen) kutular da otomatik yakalanır. Vazgeçmek için: data-native.
(function () {
  if (window.nexusSelectInit) return;
  window.nexusSelectInit = true;

  var CHEVRON = '<svg class="nx-sel-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>';
  var CHECK = '<svg class="nx-sel-check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';
  var valueDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  var indexDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
  var open = null; // { sel, btn, panel, items, active }
  var typed = '';
  var typedTimer = 0;

  function eligible(sel) {
    return sel.nodeType === 1 && sel.tagName === 'SELECT' && !sel.multiple && !(sel.size > 1) && !sel.hasAttribute('data-native') && !sel.__nxSel;
  }

  function enhance(sel) {
    if (!eligible(sel)) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    sel.__nxSel = btn;
    btn.__nxFor = sel;

    function sync() {
      var base = (sel.getAttribute('data-nx-class') !== null ? sel.getAttribute('data-nx-class') : sel.className) || '';
      btn.className = base + ' nx-sel-btn';
      btn.disabled = sel.disabled;
      var label = sel.getAttribute('aria-label');
      if (label) btn.setAttribute('aria-label', label);
      var opt = sel.options[sel.selectedIndex];
      var text = opt ? opt.text : '';
      btn.innerHTML = '<span class="nx-sel-label' + (!opt || opt.value === '' ? ' is-placeholder' : '') + '"></span>' + CHEVRON;
      btn.firstChild.textContent = text || ' ';
    }
    btn.__nxSync = sync;

    sel.style.display = 'none';
    sel.setAttribute('tabindex', '-1');
    sel.setAttribute('aria-hidden', 'true');
    // Sayfa kodu sınıfları (hidden, genişlik…) seçim kutusu üzerinden değiştirir: düğme bunları izler.
    sel.setAttribute('data-nx-class', sel.className);
    sel.insertAdjacentElement('afterend', btn);
    sync();

    // Programla değer değişimi (select.value = …) de düğmeye yansısın.
    if (valueDesc && valueDesc.set) {
      Object.defineProperty(sel, 'value', { configurable: true, get: function () { return valueDesc.get.call(sel); }, set: function (v) { valueDesc.set.call(sel, v); sync(); } });
    }
    if (indexDesc && indexDesc.set) {
      Object.defineProperty(sel, 'selectedIndex', { configurable: true, get: function () { return indexDesc.get.call(sel); }, set: function (v) { indexDesc.set.call(sel, v); sync(); } });
    }
    sel.addEventListener('change', sync);
    new MutationObserver(function (list) {
      // Kendi yazdığımız öznitelikleri yok say; yalnızca sayfanın değişiklikleri sınıfı günceller.
      var changed = list.some(function (m) { return m.type !== 'attributes' || m.attributeName !== 'class' || sel.className !== sel.getAttribute('data-nx-class'); });
      if (!changed) return;
      sel.setAttribute('data-nx-class', sel.className);
      sync();
    }).observe(sel, { attributes: true, attributeFilter: ['class', 'disabled', 'aria-label'], childList: true, subtree: true, characterData: true });

    btn.addEventListener('click', function () { if (open && open.sel === sel) closeList(); else openList(sel, btn); });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openList(sel, btn); }
    });
  }

  function enabledItems(list) {
    return list.filter(function (it) { return !it.disabled; });
  }

  function openList(sel, btn) {
    closeList();
    if (btn.disabled) return;
    var panel = document.createElement('div');
    panel.className = 'nx-sel-panel';
    panel.setAttribute('role', 'listbox');
    if (sel.getAttribute('aria-label')) panel.setAttribute('aria-label', sel.getAttribute('aria-label'));
    var items = [];
    function addOption(o, parent) {
      var li = document.createElement('div');
      li.className = 'nx-sel-opt' + (o.selected ? ' is-on' : '') + (o.disabled || (parent && parent.disabled) ? ' is-disabled' : '') + (o.value === '' ? ' is-placeholder' : '');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', o.selected ? 'true' : 'false');
      li.innerHTML = '<span class="nx-sel-txt"></span>' + CHECK;
      li.firstChild.textContent = o.text;
      var rec = { el: li, opt: o, disabled: !!(o.disabled || (parent && parent.disabled)), text: o.text.toLowerCase() };
      items.push(rec);
      li.addEventListener('mousemove', function () { if (!rec.disabled) setActive(rec); });
      li.addEventListener('click', function (e) { e.stopPropagation(); if (!rec.disabled) choose(rec); });
      panel.appendChild(li);
    }
    Array.prototype.forEach.call(sel.children, function (c) {
      if (c.tagName === 'OPTGROUP') {
        var h = document.createElement('div');
        h.className = 'nx-sel-group';
        h.textContent = c.label;
        panel.appendChild(h);
        Array.prototype.forEach.call(c.children, function (o) { addOption(o, c); });
      } else if (c.tagName === 'OPTION') addOption(c, null);
    });
    if (!items.length) return;
    document.body.appendChild(panel);
    open = { sel: sel, btn: btn, panel: panel, items: items, active: null };
    btn.setAttribute('aria-expanded', 'true');
    btn.classList.add('is-open');
    place();
    var cur = items.filter(function (it) { return it.opt.selected; })[0] || enabledItems(items)[0];
    setActive(cur, true);
    requestAnimationFrame(function () { if (open && open.panel === panel) panel.classList.add('is-in'); });
  }

  function place() {
    if (!open) return;
    var r = open.btn.getBoundingClientRect();
    var p = open.panel;
    var vw = window.innerWidth, vh = window.innerHeight, gap = 6, edge = 10;
    p.style.minWidth = Math.min(r.width, vw - edge * 2) + 'px';
    p.style.maxHeight = '';
    var natural = Math.min(p.scrollHeight + 2, 320);
    var below = vh - r.bottom - gap - edge;
    var above = r.top - gap - edge;
    var up = below < Math.min(natural, 180) && above > below;
    var h = Math.min(natural, up ? above : below);
    p.style.maxHeight = Math.max(h, 96) + 'px';
    var w = p.offsetWidth;
    var left = Math.max(edge, Math.min(r.left, vw - w - edge));
    p.style.left = left + 'px';
    p.style.top = up ? Math.max(edge, r.top - gap - p.offsetHeight) + 'px' : (r.bottom + gap) + 'px';
    p.classList.toggle('is-up', up);
  }

  function setActive(rec, scroll) {
    if (!open || !rec) return;
    if (open.active) open.active.el.classList.remove('is-active');
    open.active = rec;
    rec.el.classList.add('is-active');
    if (scroll !== false) {
      var p = open.panel, el = rec.el;
      if (el.offsetTop < p.scrollTop + 6) p.scrollTop = Math.max(0, el.offsetTop - 6);
      else if (el.offsetTop + el.offsetHeight > p.scrollTop + p.clientHeight - 6) p.scrollTop = el.offsetTop + el.offsetHeight - p.clientHeight + 6;
    }
  }

  function choose(rec) {
    if (!open) return;
    var sel = open.sel, btn = open.btn;
    var changed = !rec.opt.selected;
    sel.selectedIndex = rec.opt.index;
    closeList();
    if (changed) {
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    btn.focus();
  }

  function closeList() {
    if (!open) return;
    var o = open;
    open = null;
    o.btn.setAttribute('aria-expanded', 'false');
    o.btn.classList.remove('is-open');
    if (o.panel.parentNode) o.panel.parentNode.removeChild(o.panel);
  }

  function move(step) {
    if (!open) return;
    var list = enabledItems(open.items);
    if (!list.length) return;
    var i = list.indexOf(open.active);
    i = i < 0 ? 0 : Math.max(0, Math.min(list.length - 1, i + step));
    setActive(list[i]);
  }

  document.addEventListener('keydown', function (e) {
    if (!open) return;
    var k = e.key;
    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); var b = open.btn; closeList(); b.focus(); }
    else if (k === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (k === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (k === 'Home') { e.preventDefault(); move(-999); }
    else if (k === 'End') { e.preventDefault(); move(999); }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); if (open.active) choose(open.active); }
    else if (k === 'Tab') closeList();
    else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      typed += k.toLowerCase();
      clearTimeout(typedTimer);
      typedTimer = setTimeout(function () { typed = ''; }, 700);
      var hit = enabledItems(open.items).filter(function (it) { return it.text.indexOf(typed) === 0; })[0];
      if (hit) setActive(hit);
    }
  }, true);
  document.addEventListener('mousedown', function (e) {
    if (open && !open.panel.contains(e.target) && !open.btn.contains(e.target)) closeList();
  }, true);
  document.addEventListener('touchstart', function (e) {
    if (open && !open.panel.contains(e.target) && !open.btn.contains(e.target)) closeList();
  }, { capture: true, passive: true });
  window.addEventListener('scroll', function (e) { if (open && !open.panel.contains(e.target)) closeList(); }, true);
  window.addEventListener('resize', closeList);
  window.addEventListener('blur', closeList);

  function scan(root) {
    if (!root) return;
    if (root.nodeType === 1 && root.tagName === 'SELECT') { enhance(root); return; }
    if (root.querySelectorAll) Array.prototype.forEach.call(root.querySelectorAll('select'), enhance);
  }
  function start() {
    scan(document.body);
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, scan);
        // Kaldırılan seçim kutusunun düğmesi de gitsin.
        Array.prototype.forEach.call(m.removedNodes, function (n) {
          if (n.nodeType !== 1) return;
          var all = n.tagName === 'SELECT' ? [n] : Array.prototype.slice.call(n.querySelectorAll ? n.querySelectorAll('select') : []);
          all.forEach(function (s) { if (s.__nxSel && s.__nxSel.parentNode && !document.contains(s)) s.__nxSel.parentNode.removeChild(s.__nxSel); });
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);

  window.nexusSelect = { enhance: enhance, close: closeList };
})();
