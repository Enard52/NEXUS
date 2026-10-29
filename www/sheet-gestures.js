(function () {
  if (window.NexusSheetGestures) return; // theme.js ve sayfalar aynı dosyayı yükleyebilir

  var HAS_POINTER = typeof window.PointerEvent === 'function';
  var GRAB_ZONE = 56; // sayfanın üstünden başlayan, tutamaçla birlikte sürüklemeye açık bölge (px)

  function getPointY(event) {
    if (event.touches && event.touches.length) return event.touches[0].clientY;
    if (event.changedTouches && event.changedTouches.length) return event.changedTouches[0].clientY;
    return event.clientY;
  }

  function isInteractiveTarget(target) {
    return !!(target && target.closest && target.closest('a, button, input, textarea, select, label, [data-no-swipe-close]'));
  }

  function bindVerticalSheet(config) {
    var sheet = document.getElementById(config.sheetId) || config.sheetEl;
    if (!sheet || sheet.__nxSheetBound) return;
    sheet.__nxSheetBound = true;

    var handle = config.handleId ? document.getElementById(config.handleId) : (config.handleEl || sheet);
    if (!handle) handle = sheet;
    var backdrop = config.backdropId ? document.getElementById(config.backdropId) : (config.backdropEl || null);
    var threshold = typeof config.threshold === 'number' ? config.threshold : 88;
    var direction = config.direction === 'top' ? 'top' : 'bottom';
    var dragging = false;
    var startY = 0;
    var deltaY = 0;
    var lastY = 0;
    var lastT = 0;
    var velocity = 0; // px/ms, kapatma yönünde
    var moveTargets = [window, document];

    // Tutamak fareyle de sürüklenir: imleç ve dokunmatikte tarayıcı kaydırması devralmasın
    if (handle !== sheet) {
      handle.style.touchAction = 'none';
      handle.style.cursor = 'grab';
    }

    function setBackdropOpacity(offset) {
      if (!backdrop || !config.maxOffset) return;
      var opacity = Math.max(0, 1 - Math.min(offset / config.maxOffset, 1));
      backdrop.style.opacity = String(opacity);
    }

    function setUserSelect(on) {
      try { document.body.style.userSelect = on ? '' : 'none'; document.body.style.webkitUserSelect = on ? '' : 'none'; } catch (e) {}
    }

    function resetDrag() {
      dragging = false;
      deltaY = 0;
      setUserSelect(true);
      sheet.style.transition = '';
      sheet.style.transform = '';
      if (backdrop) {
        backdrop.style.transition = '';
        backdrop.style.opacity = '';
      }
    }

    // Başlangıç: tutamağın kendisi ya da sayfanın üst bölgesi (etkileşimli öğeler hariç)
    function startAllowed(event) {
      if (typeof config.isOpen === 'function' && !config.isOpen()) return false;
      if (handle === sheet) return !isInteractiveTarget(event.target);
      if (handle.contains(event.target)) return true;
      if (!sheet.contains(event.target) || isInteractiveTarget(event.target)) return false;
      var r = sheet.getBoundingClientRect();
      var y = getPointY(event);
      return direction === 'bottom' ? (y >= r.top && y <= r.top + GRAB_ZONE) : (y <= r.bottom && y >= r.bottom - GRAB_ZONE);
    }

    function onStart(event) {
      // Dokunmatik işaretçi için dokunma olayları kullanılır; aynı hareket iki kez işlenmesin
      if (event.type === 'pointerdown' && event.pointerType === 'touch') return;
      if (event.type === 'mousedown' && HAS_POINTER) return;
      if (event.button != null && event.button > 0) return; // yalnızca ana tuş
      if (!startAllowed(event)) return;
      dragging = true;
      startY = getPointY(event);
      lastY = startY;
      lastT = Date.now();
      velocity = 0;
      deltaY = 0;
      sheet.style.transition = 'none';
      if (backdrop) backdrop.style.transition = 'none';
      if (handle !== sheet) handle.style.cursor = 'grabbing';
    }

    function onMove(event) {
      if (!dragging) return;
      if (event.type === 'pointermove' && event.pointerType === 'touch') return;
      if (event.type === 'mousemove' && HAS_POINTER) return;
      var currentY = getPointY(event);
      // Alt sayfa aşağı, üst sayfa yukarı sürüklenerek kapanır
      var rawDelta = direction === 'top' ? startY - currentY : currentY - startY;
      deltaY = rawDelta > 0 ? rawDelta : 0;
      var now = Date.now();
      if (now > lastT) {
        var step = direction === 'top' ? lastY - currentY : currentY - lastY;
        velocity = step / (now - lastT);
        lastY = currentY;
        lastT = now;
      }
      if (deltaY === 0) return;
      setUserSelect(false);
      if (event.cancelable) event.preventDefault();
      var signedDelta = direction === 'top' ? -deltaY : deltaY;
      sheet.style.transform = 'translateY(' + signedDelta + 'px)';
      setBackdropOpacity(deltaY);
    }

    function onEnd(event) {
      if (!dragging) return;
      if (event && event.type === 'pointerup' && event.pointerType === 'touch') return;
      if (event && event.type === 'pointercancel' && event.pointerType === 'touch') return;
      if (event && event.type === 'mouseup' && HAS_POINTER) return;
      var shouldClose = deltaY > threshold || (velocity > 0.6 && deltaY > 24);
      if (handle !== sheet) handle.style.cursor = 'grab';
      resetDrag();
      if (shouldClose && typeof config.close === 'function') {
        config.close();
      }
    }

    var startTypes = HAS_POINTER ? ['touchstart', 'pointerdown'] : ['touchstart', 'mousedown'];
    var moveTypes = HAS_POINTER ? ['touchmove', 'pointermove'] : ['touchmove', 'mousemove'];
    var endTypes = HAS_POINTER ? ['touchend', 'touchcancel', 'pointerup', 'pointercancel'] : ['touchend', 'touchcancel', 'mouseup'];
    var startTarget = handle === sheet ? sheet : sheet; // üst bölge için dinleyici sayfanın kendisinde
    startTypes.forEach(function (type) {
      startTarget.addEventListener(type, onStart, { passive: true });
    });
    moveTypes.forEach(function (type) {
      moveTargets.forEach(function (target) {
        target.addEventListener(type, onMove, { passive: false });
      });
    });
    endTypes.forEach(function (type) {
      moveTargets.forEach(function (target) {
        target.addEventListener(type, onEnd, { passive: true });
      });
    });
  }

  // ---------- Otomatik bağlama ----------
  // Elle bağlanmamış alt sayfalar (tutamaçlı) için: tutamağı bul, sayfayı ve kapatma öğesini çıkar.
  // Kapatma, sayfanın arka planına tıklamakla aynıdır (sayfaların kendi kapatma işlevi çalışır).
  function classString(el) {
    return typeof el.className === 'string' ? el.className : (el.getAttribute && el.getAttribute('class')) || '';
  }

  function looksLikeHandle(el) {
    if (el.classList && el.classList.contains('nx-sheet-grab')) return true;
    var c = classString(el);
    return /\brounded-full\b/.test(c) && /\bh-1(\.5)?\b/.test(c) && /\bw-(10|12|14|16)\b/.test(c) && !el.children.length;
  }

  function isFixed(el) {
    try { return getComputedStyle(el).position === 'fixed'; } catch (e) { return false; }
  }

  function isOpenSheet(sheet) {
    var r = sheet.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    var cs = getComputedStyle(sheet);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    return r.top < window.innerHeight - 8 && r.bottom > 8;
  }

  function autoBind() {
    var nodes = document.querySelectorAll('div, span');
    for (var i = 0; i < nodes.length; i++) {
      var h = nodes[i];
      if (h.__nxHandleSeen || !looksLikeHandle(h)) continue;
      h.__nxHandleSeen = true;
      // Tutamağın kendisi aranmaz (sınıfı "nx-sheet-grab" ise "-sheet" desenine uyar): üst öğeden başla
      var sheet = h.parentElement && h.parentElement.closest('[data-nx-sheet], [class*="rounded-t-"], [id*="sheet"], [class*="-sheet"]');
      if (!sheet || sheet.__nxSheetBound) continue;
      // Kapatma hedefi: sayfanın kendisini saran sabit katman, yoksa kardeş arka plan
      var parent = sheet.parentElement;
      var dismissEl = null;
      var backdropEl = null;
      // 1) Kardeş arka plan (kendi tıklama işlevi olan karartma katmanı)
      var sib = sheet.previousElementSibling;
      while (sib) {
        if (/backdrop/i.test(sib.id || '') || /backdrop|inset-0/.test(classString(sib))) { dismissEl = sib; backdropEl = sib; break; }
        sib = sib.previousElementSibling;
      }
      // 2) Yoksa sayfayı saran sabit katmanın kendisi (ör. onclick'li tam ekran karartma)
      if (!dismissEl && parent && parent !== document.body && isFixed(parent)) {
        dismissEl = parent;
        backdropEl = parent;
      }
      if (!dismissEl) continue;
      (function (sheetEl, handleEl, dismiss, backdropNode) {
        bindVerticalSheet({
          sheetEl: sheetEl,
          handleEl: handleEl,
          backdropEl: backdropNode === dismiss && backdropNode.contains(sheetEl) ? null : backdropNode,
          maxOffset: 180,
          direction: 'bottom',
          isOpen: function () { return isOpenSheet(sheetEl); },
          close: function () { dismiss.click(); }
        });
      })(sheet, h, dismissEl, backdropEl);
    }
  }

  var autoTimer = null;
  function scheduleAutoBind() {
    if (autoTimer) return;
    autoTimer = setTimeout(function () { autoTimer = null; try { autoBind(); } catch (e) {} }, 250);
  }
  function startAuto() {
    scheduleAutoBind();
    if (window.MutationObserver && document.body) {
      new MutationObserver(scheduleAutoBind).observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startAuto);
  else startAuto();

  window.NexusSheetGestures = {
    autoBind: autoBind,
    bindBottomSheet: function (config) {
      bindVerticalSheet({
        sheetId: config.sheetId,
        handleId: config.handleId,
        backdropId: config.backdropId,
        threshold: config.threshold,
        maxOffset: config.maxOffset || 180,
        isOpen: config.isOpen,
        close: config.close,
        direction: 'bottom'
      });
    },
    bindTopSheet: function (config) {
      bindVerticalSheet({
        sheetId: config.sheetId,
        handleId: config.handleId,
        backdropId: config.backdropId,
        threshold: config.threshold,
        maxOffset: config.maxOffset || 180,
        isOpen: config.isOpen,
        close: config.close,
        direction: 'top'
      });
    }
  };
})();
