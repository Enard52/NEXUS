/**
 * NEXUS — alt çekmece (.sheet / .qa-sheet) klavye erişilebilirliği (#75).
 * Çekmece "open" sınıfını alınca: role=dialog + aria-modal verilir, odak içeri taşınır,
 * Tab içeride döner; kapanınca odak çekmeceyi açan öğeye döner. Escape kapatmayı
 * theme.js'in genel geri davranışı yapar. nexusDialog kendi odak yönetimini yapar.
 */
(function () {
  if (window.NexusSheetFocus) return;

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  // Tab sırasında bir sonraki odak indeksi. current: şu an odaklı öğenin indeksi (-1: çekmece dışı/yok).
  // Döndürür: yeni indeks ya da null (tarayıcının doğal Tab'ı bırakılsın).
  function nextFocusIndex(current, count, shift) {
    if (count <= 0) return null;
    if (current < 0) return shift ? count - 1 : 0;
    if (shift && current === 0) return count - 1;
    if (!shift && current === count - 1) return 0;
    return null;
  }

  function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || (el.getClientRects && el.getClientRects().length));
  }

  function focusables(sheet) {
    return Array.prototype.filter.call(sheet.querySelectorAll(FOCUSABLE), isVisible);
  }

  var active = null; // şu an odağı tutan çekmece
  var returnTo = null;

  function onOpen(sheet) {
    if (active === sheet) return;
    active = sheet;
    returnTo = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    if (!sheet.getAttribute('role')) sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    var items = focusables(sheet);
    var target = items[0];
    if (!target) {
      if (!sheet.hasAttribute('tabindex')) sheet.setAttribute('tabindex', '-1');
      target = sheet;
    }
    try { target.focus({ preventScroll: true }); } catch (e) {}
  }

  function onClose(sheet) {
    if (active !== sheet) return;
    active = null;
    var back = returnTo;
    returnTo = null;
    try {
      if (back && document.contains(back) && typeof back.focus === 'function') back.focus({ preventScroll: true });
    } catch (e) {}
  }

  function isOpen(el) { return el.classList.contains('open'); }

  function sync(el) {
    if (!el.matches || !el.matches('.sheet, .qa-sheet')) return;
    if (isOpen(el)) onOpen(el); else onClose(el);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !active) return;
    var items = focusables(active);
    var idx = items.indexOf(document.activeElement);
    var next = nextFocusIndex(idx, items.length, e.shiftKey);
    if (next === null) {
      if (!items.length) e.preventDefault();
      return;
    }
    e.preventDefault();
    items[next].focus();
  }, true);

  function start() {
    var mo = new MutationObserver(function (list) {
      list.forEach(function (m) { if (m.target && m.target.nodeType === 1) sync(m.target); });
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
    var pre = document.querySelectorAll('.sheet.open, .qa-sheet.open');
    for (var i = 0; i < pre.length; i++) sync(pre[i]);
  }
  if (typeof MutationObserver === 'function' && document.body) start();
  else if (typeof MutationObserver === 'function') document.addEventListener('DOMContentLoaded', start);

  window.NexusSheetFocus = { nextFocusIndex: nextFocusIndex };
})();
