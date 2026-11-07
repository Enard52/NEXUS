// NEXUS — Ayarlar: uzak erişim adresleri + anonim hata raporu anahtarı (nexus-settings.html).
// Satır içi script sınırı (inline-script-size.test.ts) yüzünden ayrı dosyadadır.
(function () {
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
        // Uzak adres yalnız HTTP ile konuşan cihazlarda anlamlı: Wake-on-LAN (UDP yayını) gibi UDP protokollerinde
        // yedek adres hiçbir zaman denenmez/işe yaramaz; sahte ayar göstermemek için listelenmez.
        var proto = window.nexusLan && window.nexusLan.protocolFor && window.nexusLan.protocolFor(d.protocol);
        if (d.protocol === 'wol' || (proto && proto.needsUdp)) return;
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
        btn.className = 'nx-reset mt-3 inline-flex items-center justify-center min-h-[40px] px-5 rounded-full text-sm font-bold cursor-pointer';
        // Hap düğme: açık vurgu zemin + vurgu rengi çerçeve (sayfa içi diğer eylem düğmeleriyle aynı dil)
        btn.style.cssText = 'color:var(--nx-accent,#4C7DFF);background:rgba(76,125,255,.10);border:1px solid rgba(76,125,255,.35)';
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

  // ---------- Anonim hata raporu (aç/kapa) ----------
  var reporting = document.getElementById('toggle-error-reporting');
  if (!reporting) return;
  reporting.checked = nexusGetItem('nexusErrorReporting') !== 'off';
  reporting.addEventListener('change', function () {
    nexusSetItem('nexusErrorReporting', reporting.checked ? 'on' : 'off');
  });
})();
