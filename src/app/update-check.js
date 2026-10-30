// "Yeni sürüm var" bandı (issue #78). Yalnızca Android/iOS kabuğunda çalışır: masaüstünde
// electron-updater, web/PWA'da zaten her açılışta güncel kod gelir.
// Sürüm bilgisi gerçek yayın akışından (GitHub releases/latest) okunur; ağ yoksa ya da yanıt
// bozuksa hiçbir şey gösterilmez. Arka planda indirme yok: bant indirme sayfasını açar.
(function () {
  var API = 'https://api.github.com/repos/Enard52/nexus-releases/releases/latest';
  var DOWNLOAD = 'https://nexus-smarthome.pages.dev/#downloads';
  var CACHE_KEY = 'nexusUpdateCheck';
  var DISMISS_KEY = 'nexusUpdateDismissed';
  var TTL = 6 * 60 * 60 * 1000;

  function parse(v) {
    var m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(v || ''));
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
  }
  // 1: a > b, -1: a < b, 0: eşit; ayrıştırılamazsa null
  function compare(a, b) {
    var x = parse(a), y = parse(b);
    if (!x || !y) return null;
    for (var i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1;
    return 0;
  }
  function newerVersion(current, latestTag) {
    return compare(latestTag, current) === 1 ? String(latestTag).replace(/^v/, '') : null;
  }

  var api = { parse: parse, compare: compare, newerVersion: newerVersion };
  if (typeof window !== 'undefined') window.nexusUpdateCheck = api;

  function isNativeShell() {
    var cap = window.Capacitor;
    return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function latestTag() {
    var cached;
    try { cached = JSON.parse(get(CACHE_KEY) || 'null'); } catch (e) { cached = null; }
    if (cached && cached.tag && Date.now() - cached.at < TTL) return Promise.resolve(cached.tag);
    return fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (j) {
        if (!j || !parse(j.tag_name)) throw new Error('tag yok');
        set(CACHE_KEY, JSON.stringify({ tag: j.tag_name, at: Date.now() }));
        return j.tag_name;
      });
  }

  function show(version) {
    if (document.getElementById('nx-update-banner')) return;
    var tr = (document.documentElement.lang || 'tr').slice(0, 2) !== 'en';
    var bar = document.createElement('div');
    bar.id = 'nx-update-banner';
    bar.setAttribute('role', 'status');
    bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 76px);z-index:60;' +
      'display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:16px;color:#fff;' +
      'background:var(--nx-accent,#4C7DFF);box-shadow:0 8px 24px rgba(0,0,0,.25);font:600 14px/1.3 Inter,system-ui,sans-serif';
    var a = document.createElement('a');
    a.href = DOWNLOAD;
    a.target = '_blank';
    a.rel = 'noopener';
    a.style.cssText = 'flex:1;color:inherit;text-decoration:none';
    a.textContent = tr ? 'Yeni sürüm var: v' + version + ' — indirmek için dokun' : 'New version available: v' + version + ' — tap to download';
    var x = document.createElement('button');
    x.type = 'button';
    x.setAttribute('aria-label', tr ? 'Kapat' : 'Dismiss');
    x.style.cssText = 'background:transparent;border:0;color:inherit;font-size:20px;line-height:1;padding:4px 8px';
    x.textContent = '×';
    x.addEventListener('click', function () { set(DISMISS_KEY, version); bar.remove(); });
    bar.appendChild(a);
    bar.appendChild(x);
    document.body.appendChild(bar);
  }

  function run() {
    if (!isNativeShell() || !window.NEXUS_APP_VERSION) return;
    latestTag().then(function (tag) {
      var v = newerVersion(window.NEXUS_APP_VERSION, tag);
      if (v && get(DISMISS_KEY) !== v) show(v);
    }).catch(function () { /* çevrimdışı ya da hız sınırı: sessizce geç, uydurma bant gösterilmez */ });
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
  }
})();
