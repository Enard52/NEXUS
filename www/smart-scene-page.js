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
  var backHref = body.getAttribute('data-back-href') || 'nexus-home.html';
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
        // Önceki sayfaya dön; geçmiş yoksa (doğrudan açılmış sayfa) ekranın ana sayfasına git.
        if (window.history.length > 1) window.history.back();
        else window.location.href = backHref;
      });
    });
  }

  function bindSettingsActions() {
    ['nav-options-btn', 'header-info-btn', 'header-settings-btn', 'header-more-btn', 'btn-settings'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.href = 'nexus-settings.html';
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

  function logSceneEvent(detailText) {
    var events = safeParse(nexusGetItem('nexusEvents'), []);
    if (!Array.isArray(events)) events = [];
    events.push({
      id: 'scene-' + Date.now(),
      type: 'scene',
      title: sceneTitle,
      detail: detailText || (sceneTitle + ' çalıştırıldı.'),
      ts: Date.now()
    });
    // Liste sınırsız büyüyerek her 2 sn'lik okumayı ve bulut senkronunu yoruyordu; son 300 olay yeter.
    if (events.length > 300) events = events.slice(-300);
    nexusSetItem('nexusEvents', JSON.stringify(events));
  }

  function showToast(message, ms) {
    var toast = document.createElement('div');
    toast.className = 'fixed left-1/2 top-6 z-[120] -translate-x-1/2 rounded-2xl bg-slate-950/90 px-4 py-2.5 text-sm font-semibold text-white shadow-lg text-center';
    toast.style.maxWidth = 'min(92vw, 420px)';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    // Giriş/solma animasyonu + süre (nexus-feedback.js; yoksa eski düz görünüm)
    if (window.nexusFeedback) window.nexusFeedback.toastIn(toast, ms || 1600);
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, ms || 1600);
  }

  function checkRequiredDevices() {
    var devices = safeParse(nexusGetItem('nexusPairedDevices'), []);
    return Array.isArray(devices) && devices.length > 0;
  }

  // Senaryo motoru (device-controls.js) bu sayfada yoksa yüklenir
  function ensureEngine(cb) {
    if (window.NX && window.NX.runScene) return cb();
    var files = ['supported-devices.js', 'lan-connectors.js', 'device-controls.js'].filter(function (f) {
      return !document.querySelector('script[src="' + f + '"]');
    });
    (function next() {
      if (!files.length) return cb();
      var el = document.createElement('script');
      el.src = files.shift();
      el.onload = next;
      el.onerror = next;
      document.head.appendChild(el);
    })();
  }

  // Ev sağlığı: yerel ağ cihazlarına gerçekten ulaşılıp ulaşılamadığını kontrol eder
  function runHealthCheck(done) {
    var devices = safeParse(nexusGetItem('nexusPairedDevices'), []);
    var lanIdx = [];
    devices.forEach(function (d, i) { if (window.NX && NX.isLan(d)) lanIdx.push(i); });
    if (!lanIdx.length) return done(devices.length + ' cihaz kayıtlı · yerel ağ cihazı yok, çevrimiçi kontrolü yapılamadı.');
    Promise.all(lanIdx.map(function (i) { return NX.refreshFromDevice(i); })).then(function (res) {
      var ok = res.filter(Boolean).length;
      done(lanIdx.length + ' yerel ağ cihazı kontrol edildi · ' + ok + ' çevrimiçi' + (ok < lanIdx.length ? ', ' + (lanIdx.length - ok) + ' ulaşılamıyor' : '') + '.');
    });
  }

  var running = false;
  function runThisScene(navigateAfter, button) {
    if (running) return;
    if (!checkRequiredDevices()) {
      // Cihaz yoksa kullanıcıya seçim bırak: cihaz ekle ya da vazgeç (kendiliğinden yönlendirme yok).
      var dialogOpts = {
        title: 'Cihaz gerekli',
        icon: 'warning',
        message: 'Bu senaryoyu kullanmak için uyumlu bir cihaz eklemelisin.',
        primary: { label: 'Cihaz ekle', onClick: function () { window.location.href = 'nexus-pair.html'; } },
        secondary: { label: 'Vazgeç' }
      };
      if (window.nexusDialog) window.nexusDialog(dialogOpts);
      else showToast(dialogOpts.message);
      return;
    }
    running = true;
    if (button) button.disabled = true;
    ensureEngine(function () {
      var finish = function (message) {
        logSceneEvent(message);
        saveState();
        showToast(message, 2600);
        // Sahne tamamlandı: tek yumuşak arpej (cihaz başına ses çıkmaz)
        if (window.nexusFeedback) window.nexusFeedback.play('scene');
        running = false;
        if (button) button.disabled = false;
        if (navigateAfter) setTimeout(function () { window.location.href = completeHref; }, 1600);
      };
      if (pageId === 'home-health') return runHealthCheck(finish);
      if (!window.NX || !NX.runScene) return finish(sceneTitle + ' kaydedildi.');
      finish(NX.sceneSummary(NX.runScene(pageId)));
    });
  }

  function primaryFooterButton(footer) {
    return footer.querySelector('#footer-done-btn') ||
      footer.querySelector('button[class*="bg-[#4C7DFF]"]') ||
      Array.prototype.slice.call(footer.querySelectorAll('button')).pop();
  }

  function bindPrimaryCta() {
    var footer = document.querySelector('footer');
    if (!footer) return;
    var cta = primaryFooterButton(footer);
    if (!cta || cta.getAttribute('onclick')) return;
    cta.setAttribute('data-scene-bound', '1');
    // Cihaz yokken "Başlat" gibi yanıltıcı bir düğme gösterme: dürüst eylem "Önce cihaz ekle".
    if (!checkRequiredDevices()) {
      // Sayfanın içeriğinde zaten görünür bir "cihaz ekle" aksiyonu varsa (boş durum
      // kartındaki "+ Cihaz ekle" gibi) alt çubuk aynı istemi tekrarlar: gizlenir.
      var inPageAdd = null;
      try {
        inPageAdd = Array.prototype.slice.call(document.querySelectorAll('a[href*="nexus-pair"], button'))
          .find(function (el) {
            if (footer.contains(el)) return false;
            var t = ((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '')).toLowerCase();
            var isAddLink = (el.getAttribute('href') || '').indexOf('nexus-pair') !== -1;
            if (!isAddLink && t.indexOf('cihaz ekle') === -1) return false;
            var r = el.getBoundingClientRect();
            var cs = getComputedStyle(el);
            return r.width > 40 && r.height > 24 && r.top < innerHeight * 0.85 &&
              cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
          });
      } catch (e) { inPageAdd = null; }
      if (inPageAdd) {
        footer.classList.add('hidden');
        return;
      }
      var label = cta.querySelector('span') || cta;
      label.textContent = window.nexusT ? window.nexusT('Önce cihaz ekle', 'Add a device first') : 'Önce cihaz ekle';
      cta.setAttribute('data-no-device', '1');
    }
    // Cihaz var ama bu senaryo için uygun tür yoksa (ör. süpürge yokken Temizlik) dürüst etiket göster.
    if (cta.getAttribute('data-no-device') !== '1' && pageId !== 'home-health') {
      ensureEngine(function () {
        if (window.NX && NX.sceneAffected && NX.sceneAffected(pageId) === 0) {
          var lbl = cta.querySelector('span') || cta;
          lbl.textContent = window.nexusT ? window.nexusT('Uyumlu cihaz yok', 'No compatible device') : 'Uyumlu cihaz yok';
          cta.setAttribute('data-no-compatible', '1');
        }
      });
    }
    cta.addEventListener('click', function (event) {
      event.preventDefault();
      if (cta.getAttribute('data-no-device') === '1') { window.location.href = 'nexus-pair.html'; return; }
      if (cta.getAttribute('data-no-compatible') === '1') {
        var opts = {
          title: 'Uyumlu cihaz yok',
          icon: 'warning',
          message: 'Bu senaryo mevcut cihazlarını etkilemiyor. Senaryonun çalışması için uygun bir cihaz (ör. ışık, perde, süpürge) eklemelisin.',
          primary: { label: 'Cihaz ekle', onClick: function () { window.location.href = 'nexus-pair.html'; } },
          secondary: { label: 'Vazgeç' }
        };
        if (window.nexusDialog) window.nexusDialog(opts); else showToast(opts.message);
        return;
      }
      runThisScene(true, cta);
    });
    var cancel = footer.querySelector('#footer-cancel-btn');
    if (cancel) {
      cancel.setAttribute('data-scene-bound', '1');
      cancel.addEventListener('click', function (event) { event.preventDefault(); window.history.back(); });
    }
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
      detail: (label || 'Aksiyon') + ' uygulandı.',
      ts: Date.now()
    });
    // Son 300 olay (bkz. logSceneEvent)
    if (events.length > 300) events = events.slice(-300);
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

      // Cihaz yokken "Çalıştır" gösterme: dürüst eylem "Önce cihaz ekle" (tıklayınca diyalog zaten cihaz ekletir).
      var initialLabel = ((btn.textContent || '').replace(/\s+/g, ' ').trim());
      if (!checkRequiredDevices() && /^(çalıştır|senaryoyu (başlat|çalıştır)|run|run scenario|start scenario)$/i.test(initialLabel)) {
        btn.textContent = window.nexusT ? window.nexusT('Önce cihaz ekle', 'Add a device first') : 'Önce cihaz ekle';
      }

      var parent = btn.parentElement;
      var siblingButtons = parent ? Array.prototype.filter.call(parent.children, function (c) { return c.tagName === 'BUTTON'; }) : [];
      var isSegmented = siblingButtons.length >= 2;

      btn.addEventListener('click', function (event) {
        event.preventDefault();
        // İlk satır = düğmenin başlığı (alt yazı eklenmesin)
        var label = ((btn.innerText || btn.textContent || '').split('\n')[0] || '').replace(/\s+/g, ' ').trim();
        if (isSegmented) {
          // Segmentli secim: secili durumu gercek olarak isaretle (tasarim sinifina dokunmadan)
          siblingButtons.forEach(function (sib) {
            sib.setAttribute('aria-pressed', sib === btn ? 'true' : 'false');
          });
          var groupKey = 'seg-' + (parent.id || label);
          state.values[groupKey] = label;
          saveState();
        }
        if (/^(çalıştır|senaryoyu (başlat|çalıştır)|evet, uygula|run|run scenario|start scenario|yes, apply)$/i.test(label)) {
          runThisScene(false, btn);
          return;
        }
        logAction(label);
        if (isSegmented) showToast(label + ' seçildi.');
      });
    });
  }

  // Senaryo önizlemesi: sayfadaki sabit (örnek) adımlar yerine, senaryonun GERÇEKTEN uygulayacağı
  // eşleşmiş cihazlar listelenir. Uygun cihaz yoksa dürüst bir boş durum gösterilir.
  function describeAct(a) {
    var f = a[0], v = a[1];
    switch (f) {
      case 'switch': return v ? 'Açılır' : 'Kapanır';
      case 'brightness': return 'Parlaklık %' + v;
      case 'tone': return v === 'warm' ? 'Sıcak ışık' : 'Işık tonu ayarlanır';
      case 'coverAction': return v === 'open' ? 'Açılır' : 'Kapanır';
      case 'target': return 'Hedef ' + v + '°';
      case 'profile': return v === 'eco' ? 'Eko modu' : 'Konfor modu';
      case 'locked': return 'Kilitlenir';
      case 'notify': return 'Bildirimler açılır';
      case 'privacy': return v ? 'Gizlilik modu açılır' : 'Gizlilik modu kapanır';
      case 'mode': return v === 'docked' ? 'Şarj istasyonuna döner' : 'Temizliğe başlar';
      case 'fan': return 'Fan otomatik';
      case 'sleep': return 'Uyku modu';
      default: return null;
    }
  }

  function renderRealSceneSteps() {
    if (pageId !== 'movie-mode' && pageId !== 'welcome-home') return;
    ensureEngine(function () {
      if (!window.NX || !NX.readDevices || !NX.sceneActsOf) return;
      var rows = [];
      NX.readDevices().forEach(function (d) {
        var acts = NX.sceneActsOf(pageId, d);
        if (!acts.length) return;
        var parts = [];
        acts.forEach(function (a) { var t = describeAct(a); if (t && parts.indexOf(t) === -1) parts.push(t); });
        rows.push({ d: d, text: parts.join(' · ') });
      });
      var card = function (r) {
        return '<div class="feature-card bg-white dark:bg-slate-800 rounded-3xl p-4 flex items-center gap-4">' +
          '<img src="' + NX.imageUrl(r.d) + '" alt="" class="w-12 h-12 object-contain" onerror="this.style.visibility=\'hidden\'">' +
          '<div class="flex-1 min-w-0"><h4 class="text-[15px] font-bold text-slate-900 dark:text-white truncate">' + NX.escapeHtml(r.d.name) + '</h4>' +
          '<p class="text-xs text-slate-500 dark:text-slate-400 font-medium">' + NX.escapeHtml(r.text) + '</p></div></div>';
      };
      var empty = '<div class="bg-white dark:bg-slate-800 rounded-3xl p-5 text-center">' +
        '<p class="text-sm font-bold text-slate-900 dark:text-white">Bu senaryoyu uygulayacak uygun cihaz yok</p>' +
        '<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Işık, perde, klima veya kilit gibi uyumlu bir cihaz eklediğinde burada listelenir.</p></div>';
      var html = rows.length ? rows.map(card).join('') : empty;
      var main = document.querySelector('main');
      if (!main) return;
      var count = main.querySelector('[data-device-count]');
      var grid = pageId === 'movie-mode'
        ? main.querySelector('section.space-y-4 .grid')
        : main.querySelector('section.space-y-6 .grid');
      if (grid) grid.innerHTML = html;
      if (count) count.textContent = rows.length + ' cihaz etkilenecek';
      // Sabit örnek içerikler (uydurma AI önerisi, örnek cihaz şeridi, "Tümünü Düzenle") kaldırılır.
      var fake = main.querySelector('section[class*="bg-[#4C7DFF]/5"]');
      if (fake) fake.remove();
      Array.prototype.slice.call(main.querySelectorAll('section')).forEach(function (s) {
        var h = s.querySelector('h3');
        if (h && /Etkilenecek Cihazlar/i.test(h.textContent)) s.remove();
      });
      Array.prototype.slice.call(main.querySelectorAll('span')).forEach(function (s) {
        if (/^Tümünü Düzenle$/i.test((s.textContent || '').trim())) s.remove();
      });
      var badge = Array.prototype.slice.call(main.querySelectorAll('span')).filter(function (s) { return /^(Hazır bekliyor|Önerilen)$/i.test((s.textContent || '').trim()); })[0];
      if (badge) badge.textContent = rows.length ? 'Hazır' : 'Uygun cihaz yok';
    });
  }

  bindBackActions();
  bindSettingsActions();
  persistInputs();
  bindPrimaryCta();
  bindDeviceCount();
  renderRealSceneSteps();
  bindSceneActionButtons();
  }

  // Script <head> içinde yüklendiği için body hazır olana kadar bekle
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

