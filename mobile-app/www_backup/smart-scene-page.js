(function () {
  function safeParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function init() {
  var body = document.body;
  if (!body) return;

  var pageId = body.getAttribute('data-scene-page') || location.pathname.split('/').pop() || 'scene-page';
  var sceneTitle = body.getAttribute('data-scene-title') || document.title.replace(/^NEXUS\s*-\s*/i, '') || 'Sahne';
  var backHref = body.getAttribute('data-back-href') || 'stitch-home.html';
  var completeHref = body.getAttribute('data-complete-href') || backHref;
  var storageKey = 'nexusSceneState:' + pageId;
  var state = safeParse(nexusGetItem(storageKey), { checks: {}, values: {} });

  function saveState() {
    nexusSetItem(storageKey, JSON.stringify(state));
  }

  function bindBackActions() {
    ['nav-back-btn', 'nav-back-link', 'btn-back', 'back-link'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', function (event) {
        event.preventDefault();
        window.history.back();
      });
    });
  }

  function bindSettingsActions() {
    ['nav-options-btn', 'header-info-btn', 'header-settings-btn', 'header-more-btn', 'btn-settings'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.href = 'stitch-settings.html';
      });
    });
  }

  function persistInputs() {
    Array.prototype.forEach.call(document.querySelectorAll('input[type="checkbox"]'), function (input, index) {
      var key = input.id || ('check-' + index);
      if (Object.prototype.hasOwnProperty.call(state.checks, key)) {
        input.checked = !!state.checks[key];
      } else {
        state.checks[key] = !!input.checked;
      }
      input.addEventListener('change', function () {
        state.checks[key] = !!input.checked;
        saveState();
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('input[type="range"]'), function (input, index) {
      var key = input.id || ('range-' + index);
      if (Object.prototype.hasOwnProperty.call(state.values, key)) {
        input.value = state.values[key];
      } else {
        state.values[key] = input.value;
      }
      input.addEventListener('input', function () {
        state.values[key] = input.value;
        saveState();
      });
    });

    saveState();
  }

  function logSceneEvent() {
    var events = safeParse(nexusGetItem('nexusEvents'), []);
    if (!Array.isArray(events)) events = [];
    events.push({
      id: 'scene-' + Date.now(),
      type: 'scene',
      title: sceneTitle,
      detail: sceneTitle + ' akisi calistirildi.',
      ts: Date.now()
    });
    nexusSetItem('nexusEvents', JSON.stringify(events));
  }

  function showToast(message) {
    var toast = document.createElement('div');
    toast.className = 'fixed left-1/2 top-6 z-[120] -translate-x-1/2 rounded-full bg-slate-950/88 px-4 py-2 text-sm font-semibold text-white shadow-lg';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, 1400);
  }

  function bindPrimaryCta() {
    var footer = document.querySelector('footer');
    if (!footer) return;
    var cta = footer.querySelector('button');
    if (!cta) return;

    cta.addEventListener('click', function () {
      cta.disabled = true;
      logSceneEvent();
      saveState();
      showToast(sceneTitle + ' hazir.');
      setTimeout(function () {
        window.location.href = completeHref;
      }, 420);
    });
  }

  function bindDeviceCount() {
    // Sabit sayi yerine sayfadaki gercek adim karti sayisini yaz
    var el = document.querySelector('[data-device-count]');
    if (!el) return;
    var count = document.querySelectorAll('.feature-card').length;
    if (count > 0) el.textContent = count + ' Cihaz Etkilenecek';
  }

  function logAction(label) {
    var events = safeParse(nexusGetItem('nexusEvents'), []);
    if (!Array.isArray(events)) events = [];
    events.push({
      id: 'action-' + Date.now(),
      type: 'scene',
      title: sceneTitle,
      detail: (label || 'Aksiyon') + ' uygulandi.',
      ts: Date.now()
    });
    nexusSetItem('nexusEvents', JSON.stringify(events));
  }

  function bindSceneActionButtons() {
    var scope = document.querySelector('main') || document.body;
    if (!scope) return;
    var reserved = { 'nav-back-btn': 1, 'nav-back-link': 1, 'btn-back': 1, 'back-link': 1, 'nav-options-btn': 1, 'header-info-btn': 1, 'header-settings-btn': 1, 'header-more-btn': 1, 'btn-settings': 1 };
    Array.prototype.forEach.call(scope.querySelectorAll('button'), function (btn) {
      if (btn.getAttribute('onclick')) return;
      if (btn.getAttribute('type') === 'submit') return;
      if (btn.id && reserved[btn.id]) return;
      if (btn.hasAttribute('data-scene-bound')) return;
      btn.setAttribute('data-scene-bound', '1');

      var parent = btn.parentElement;
      var siblingButtons = parent ? Array.prototype.filter.call(parent.children, function (c) { return c.tagName === 'BUTTON'; }) : [];
      var isSegmented = siblingButtons.length >= 2;

      btn.addEventListener('click', function (event) {
        event.preventDefault();
        var label = (btn.textContent || '').replace(/\s+/g, ' ').trim();
        if (isSegmented) {
          // Segmentli secim: secili durumu gercek olarak isaretle (tasarim sinifina dokunmadan)
          siblingButtons.forEach(function (sib) {
            sib.setAttribute('aria-pressed', sib === btn ? 'true' : 'false');
          });
          var groupKey = 'seg-' + (parent.id || label);
          state.values[groupKey] = label;
          saveState();
        }
        logAction(label);
        showToast(label ? (label + ' uygulandi.') : 'Aksiyon uygulandi.');
      });
    });
  }

  bindBackActions();
  bindSettingsActions();
  persistInputs();
  bindPrimaryCta();
  bindDeviceCount();
  bindSceneActionButtons();
  }

  // Script <head> içinde yüklendiği için body hazır olana kadar bekle
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

