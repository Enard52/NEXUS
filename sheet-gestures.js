(function () {
  function getPointY(event) {
    if (event.touches && event.touches.length) return event.touches[0].clientY;
    if (event.changedTouches && event.changedTouches.length) return event.changedTouches[0].clientY;
    return event.clientY;
  }

  function isInteractiveTarget(target) {
    return !!target.closest('a, button, input, textarea, select, label, [data-no-swipe-close]');
  }

  function bindVerticalSheet(config) {
    var sheet = document.getElementById(config.sheetId);
    if (!sheet) return;

    var handle = config.handleId ? document.getElementById(config.handleId) : sheet;
    var backdrop = config.backdropId ? document.getElementById(config.backdropId) : null;
    var threshold = typeof config.threshold === 'number' ? config.threshold : 88;
    var direction = config.direction === 'top' ? 'top' : 'bottom';
    var dragging = false;
    var startY = 0;
    var deltaY = 0;
    var moveTargets = [window, document];

    function setBackdropOpacity(offset) {
      if (!backdrop || !config.maxOffset) return;
      var opacity = Math.max(0, 1 - Math.min(offset / config.maxOffset, 1));
      backdrop.style.opacity = String(opacity);
    }

    function resetDrag() {
      dragging = false;
      deltaY = 0;
      sheet.style.transition = '';
      sheet.style.transform = '';
      if (backdrop) {
        backdrop.style.transition = '';
        backdrop.style.opacity = '';
      }
    }

    function onStart(event) {
      if (typeof config.isOpen === 'function' && !config.isOpen()) return;
      if (handle === sheet && isInteractiveTarget(event.target)) return;
      dragging = true;
      startY = getPointY(event);
      deltaY = 0;
      sheet.style.transition = 'none';
      if (backdrop) {
        backdrop.style.transition = 'none';
      }
    }

    function onMove(event) {
      if (!dragging) return;
      var currentY = getPointY(event);
      var rawDelta = currentY - startY;
      deltaY = rawDelta > 0 ? rawDelta : 0;
      if (deltaY === 0) return;
      event.preventDefault();
      var signedDelta = direction === 'top' ? -deltaY : deltaY;
      sheet.style.transform = 'translateY(' + signedDelta + 'px)';
      setBackdropOpacity(deltaY);
    }

    function onEnd() {
      if (!dragging) return;
      var shouldClose = deltaY > threshold;
      resetDrag();
      if (shouldClose && typeof config.close === 'function') {
        config.close();
      }
    }

    ['touchstart', 'pointerdown', 'mousedown'].forEach(function (type) {
      handle.addEventListener(type, onStart, { passive: true });
    });
    ['touchmove', 'pointermove', 'mousemove'].forEach(function (type) {
      moveTargets.forEach(function (target) {
        target.addEventListener(type, onMove, { passive: false });
      });
    });
    ['touchend', 'touchcancel', 'pointerup', 'pointercancel', 'mouseup'].forEach(function (type) {
      moveTargets.forEach(function (target) {
        target.addEventListener(type, onEnd, { passive: true });
      });
    });
  }

  window.NexusSheetGestures = {
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
