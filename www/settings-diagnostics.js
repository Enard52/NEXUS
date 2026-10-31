// NEXUS — Ayarlar: bulut eşitleme sıklığı + yerel hata günlüğü (nexus-settings.html).
// Satır içi script sınırı (inline-script-size.test.ts) yüzünden ayrı dosyadadır.
(function () {
  // ---------- Bulut eşitleme sıklığı ----------
  // cloud-sync.js her turda nexusSyncInterval'ı okur. Hesapsız kullanıcıda eşitleme yok;
  // satır yalnız açık bulut oturumunda görünür.
  var SYNC_INTERVAL_LABELS = { fast: 'Sık (15 sn)', normal: 'Normal (45 sn)', slow: 'Tasarruflu (5 dk)' };
  function refreshSyncInterval() {
    var el = document.getElementById('sync-interval-label');
    if (el) el.textContent = SYNC_INTERVAL_LABELS[nexusGetItem('nexusSyncInterval') || 'normal'] || SYNC_INTERVAL_LABELS.normal;
  }
  window.openSyncIntervalPicker = function () {
    var current = nexusGetItem('nexusSyncInterval') || 'normal';
    window.nexusDialog({
      title: 'Bulut eşitleme sıklığı',
      icon: 'settings',
      message: 'Uygulama açıkken diğer cihazlarınla ne sıklıkla eşitlensin. Uygulama arka plandayken düzenli eşitleme durur; değişiklikler anlık bağlantı açıksa yine gelir.',
      options: [
        { label: 'Sık (15 sn)', value: 'fast', selected: current === 'fast' },
        { label: 'Normal (45 sn)', value: 'normal', selected: current === 'normal' },
        { label: 'Tasarruflu (5 dk)', value: 'slow', selected: current === 'slow' }
      ],
      onSelect: function (value) {
        nexusSetItem('nexusSyncInterval', value);
        refreshSyncInterval();
      }
    });
  };
  if (window.nexusCloud && nexusCloud.enabled && nexusCloud.enabled() && nexusCloud.session) {
    nexusCloud.session().then(function (s) {
      if (!s) return;
      var row = document.getElementById('sync-interval-row');
      var rule = document.getElementById('sync-interval-rule');
      if (row) row.classList.remove('hidden');
      if (rule) rule.classList.remove('hidden');
      refreshSyncInterval();
    }, function () { /* oturum okunamadı: satır gizli kalır */ });
  }

  // ---------- Uzak erişim adresleri ----------
  // Yerel adres yanıt vermezse denenecek isteğe bağlı ikinci adres (lan-connectors.js remoteHosts). Yalnız bu cihazda.
  (function () {
    var list = document.getElementById('remote-hosts-list');
    if (!list) return;
    var empty = document.getElementById('remote-hosts-empty');
    var note = document.getElementById('remote-hosts-status');
    function say(text, bad) {
      note.style.color = bad ? '#e11d48' : '';
      note.textContent = text;
    }
    function paired() {
      try { var d = JSON.parse(nexusGetItem('nexusPairedDevices') || '[]'); return Array.isArray(d) ? d : []; } catch (e) { return []; }
    }
    function render() {
      var lan = window.nexusLan && window.nexusLan.remoteHosts;
      var groups = {};
      var order = [];
      paired().forEach(function (d) {
        if (!d || typeof d.host !== 'string' || !/^https?:\/\//i.test(d.host)) return;
        if (!groups[d.host]) { groups[d.host] = []; order.push(d.host); }
        groups[d.host].push(d.name || '?');
      });
      list.innerHTML = '';
      empty.classList.toggle('hidden', order.length > 0 && !!lan);
      if (!lan) { empty.textContent = nexusT('Uzak erişim adresi bu sürümde yüklenemedi.', 'Remote address could not be loaded in this version.'); return; }
      var map = lan.get();
      order.forEach(function (h) {
        var row = document.createElement('div');
        row.className = 'px-5 py-4 border-t border-gray-100';
        var title = document.createElement('p');
        title.className = 'text-sm font-semibold text-slate-800 break-words';
        title.setAttribute('data-no-i18n', '');
        title.textContent = h.replace(/^https?:\/\//i, '') + ' · ' + groups[h].slice(0, 3).join(', ') + (groups[h].length > 3 ? ' +' + (groups[h].length - 3) : '');
        var input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'url';
        input.autocomplete = 'off';
        input.className = 'mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm';
        input.placeholder = nexusT('Uzak adres (ör. 100.64.0.5:8123), boş = kapalı', 'Remote address (e.g. 100.64.0.5:8123), empty = off');
        input.setAttribute('aria-label', nexusT('Uzak adres', 'Remote address') + ' – ' + h);
        input.value = map[h] ? map[h].replace(/^http:\/\//i, '') : '';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nx-reset mt-2 text-sm font-semibold text-[#4C7DFF] cursor-pointer';
        btn.textContent = nexusT('Kaydet', 'Save');
        btn.addEventListener('click', function () {
          var v = input.value.trim();
          if (v && !lan.normalize(v)) { say(nexusT('Adres geçerli değil. Örnek: 100.64.0.5:8123', 'The address is not valid. Example: 100.64.0.5:8123'), true); return; }
          if (lan.set(h, v)) say(v ? nexusT('Uzak adres kaydedildi. Yerel adres yanıt vermezse denenir.', 'Remote address saved. It is tried when the local address does not answer.') : nexusT('Uzak adres kaldırıldı.', 'Remote address removed.'));
          else say(nexusT('Kaydedilemedi.', 'Could not save.'), true);
        });
        row.appendChild(title); row.appendChild(input); row.appendChild(btn);
        list.appendChild(row);
      });
    }
    render();
  })();

  // ---------- Hata günlüğü ----------
  var reporting = document.getElementById('toggle-error-reporting');
  if (!reporting) return;
  reporting.checked = nexusGetItem('nexusErrorReporting') !== 'off';
  reporting.addEventListener('change', function () {
    nexusSetItem('nexusErrorReporting', reporting.checked ? 'on' : 'off');
  });

  var status = document.getElementById('error-log-status');
  var api = window.nexusErrorLog;
  function entries() { return api ? api.read() : []; }
  function say(text, bad) {
    status.style.color = bad ? '#e11d48' : '';
    status.textContent = text;
  }
  function render() {
    var list = entries();
    var host = document.getElementById('error-log-list');
    host.innerHTML = '';
    // Son 5 kayıt gösterilir; kopyalanan rapor hepsini içerir.
    list.slice(-5).reverse().forEach(function (e) {
      var li = document.createElement('li');
      li.className = 'break-words';
      li.textContent = String(e.at || '').replace('T', ' ').slice(0, 16) + ' · ' + (e.page || '?') + ' — ' + (e.message || '');
      host.appendChild(li);
    });
    var has = list.length > 0;
    host.classList.toggle('hidden', !has);
    document.getElementById('error-log-actions').classList.toggle('hidden', !has);
    document.getElementById('error-log-empty').classList.toggle('hidden', has);
  }
  // GitHub hata bildirimine yapıştırmak için düz metin; kişisel veri içermez.
  function reportText(list) {
    var last = list[list.length - 1] || {};
    var lines = [
      'NEXUS error report',
      'Version: ' + (window.NEXUS_APP_VERSION || last.version || '?'),
      'Platform: ' + (last.platform || '?'),
      'Entries: ' + list.length,
      ''
    ];
    list.forEach(function (e) { lines.push('- ' + (e.at || '') + ' ' + (e.page || '?') + ' (' + (e.version || '?') + '): ' + (e.message || '')); });
    return lines.join('\n');
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      if (ok) resolve(); else reject(new Error('copy'));
    });
  }
  document.getElementById('error-log-copy').addEventListener('click', function () {
    var list = entries();
    if (!list.length) { render(); return; }
    copyText(reportText(list)).then(function () {
      say(nexusT('Rapor panoya kopyalandı: ' + list.length + ' kayıt.', 'Report copied to clipboard: ' + list.length + ' entries.'));
    }, function () {
      say('Panoya kopyalanamadı. Bu cihaz pano erişimine izin vermiyor.', true);
    });
  });
  document.getElementById('error-log-clear').addEventListener('click', function () {
    if (api) api.clear();
    say('Günlük temizlendi.');
    render();
  });
  if (!api) say('Hata günlüğü bu sürümde yüklenemedi.', true);
  render();
})();
