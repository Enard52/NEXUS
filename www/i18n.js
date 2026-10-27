/**
 * NEXUS — çeviri katmanı (yalnızca İngilizce seçiliyken yüklenir; theme.js ekler).
 * Sayfalar Türkçe yazılmıştır. Bu katman, sayfa oluşurken ve sonradan JavaScript ile eklenen
 * her metni lang-en.js sözlüğüne göre İngilizceye çevirir:
 *   - metin düğümleri (tam eşleşme → sayılı şablon → parçalara bölerek)
 *   - placeholder / title / aria-label / alt öznitelikleri
 *   - içinde vurgulu (b, strong, a…) kısımlar olan cümleler (HTML sözlüğü)
 *   - alert / confirm / prompt ve document.title
 * Sözlükte olmayan metin olduğu gibi kalır; geliştirici için window.__i18nMissing'e yazılır.
 */
(function () {
  if (window.__nexusI18n) return;
  window.__nexusI18n = true;
  var DICT = window.NEXUS_EN || {};
  var TEXT = DICT.text || {};
  var HTML = DICT.html || {};
  var SLOTS = DICT.slots || {}; // "Metin {0} metin" — {n}: n. iç öğe (yerinde korunur)
  var PATTERNS = (DICT.patterns || []).map(function (p) { return [new RegExp(p[0]), p[1]]; });
  var ATTRS = ["placeholder", "title", "aria-label", "alt", "data-tooltip", "label"];
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1, NOSCRIPT: 1 };
  var TR_CHARS = /[çğıöşüÇĞİÖŞÜ]/;
  var missing = window.__i18nMissing = window.__i18nMissing || {};
  var missingHtml = window.__i18nMissingHtml = window.__i18nMissingHtml || {};
  var cache = Object.create(null);
  var written = new WeakMap();
  var originals = new WeakMap(); // metin düğümü → çevrilmeden önceki (Türkçe) değer

  function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }

  // Sayıları {0}, {1}… ile değiştirerek şablon anahtarı üretir
  function templ(s) {
    var nums = [];
    var key = s.replace(/[+-]?\d+(?:[.,]\d+)*/g, function (m) { nums.push(m); return "{" + (nums.length - 1) + "}"; });
    return { key: key, nums: nums };
  }
  function fill(out, nums) {
    // "{0} devices" → "1 device" (tekil)
    out = out.replace(/\{(\d+)\}( [A-Za-z]+?)s\b/g, function (m, i, w) { return nums[+i] === "1" ? "{" + i + "}" + w : m; });
    return out.replace(/\{(\d+)\}/g, function (_, i) { return nums[+i] != null ? nums[+i] : ""; });
  }

  var SEPS = [" · ", " — ", " – ", " | ", ": ", " / ", " • ", ". ", ", "];

  function lookup(s) {
    if (Object.prototype.hasOwnProperty.call(TEXT, s)) return TEXT[s];
    var t = templ(s);
    if (t.nums.length && Object.prototype.hasOwnProperty.call(TEXT, t.key)) return fill(TEXT[t.key], t.nums);
    for (var i = 0; i < PATTERNS.length; i++) {
      var m = s.match(PATTERNS[i][0]);
      if (!m) continue;
      // {t:1} = 1. grubu çevir (yoksa olduğu gibi), $1 = olduğu gibi
      return PATTERNS[i][1].replace(/\{t:(\d)\}|\$(\d)/g, function (_, t, raw) {
        var g = m[+(t || raw)] || "";
        if (t) { var tg = translate(g, 1); return tg == null ? g : tg; }
        return g;
      });
    }
    return null;
  }

  function translate(raw, depth) {
    var s = norm(raw);
    if (!s || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(s)) return null;
    if (s in cache) return cache[s];
    var out = lookup(s);
    if (out == null && (depth || 0) < 3) {
      // Parçalara bölerek çevir (ör. "Salon Dimmer · Açık · %70")
      for (var i = 0; i < SEPS.length && out == null; i++) {
        var sep = SEPS[i];
        if (s.indexOf(sep) === -1) continue;
        var parts = s.split(sep), any = false, ok = true;
        var mapped = parts.map(function (p) {
          if (!p.trim()) return p;
          var tp = translate(p, (depth || 0) + 1);
          if (tp != null) { any = true; return tp; }
          if (TR_CHARS.test(p)) ok = false;
          return p;
        });
        if (any && ok) out = mapped.join(sep);
      }
    }
    if (out == null && !depth && /[A-Za-zÇĞİÖŞÜçğıöşü]{2}/.test(s)) missing[s] = (missing[s] || 0) + 1;
    cache[s] = out;
    return out;
  }

  function translateKeepSpace(value) {
    var out = translate(value);
    if (out == null) return null;
    var lead = value.match(/^\s*/)[0], trail = value.match(/\s*$/)[0];
    return lead + out + trail;
  }

  function doText(node) {
    var v = node.nodeValue;
    if (!v || written.get(node) === v) return;
    var p = node.parentNode;
    if (!p || SKIP[p.nodeName] || (p.closest && p.closest("[data-no-i18n],[translate=no]"))) return;
    var out = translateKeepSpace(v);
    if (out != null && out !== v) { originals.set(node, v); node.nodeValue = out; }
    written.set(node, node.nodeValue);
  }

  function doAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute || !el.hasAttribute(a)) continue;
      var v = el.getAttribute(a);
      var key = "__i18n_" + a;
      if (el[key] === v) continue;
      var out = translate(v);
      if (out != null && out !== norm(v)) el.setAttribute(a, out);
      el[key] = el.getAttribute(a);
    }
    if (el.tagName === "INPUT" && /^(button|submit|reset)$/i.test(el.type) && el.value) {
      var o = translate(el.value);
      if (o != null) el.value = o;
    }
  }

  // İçinde satır içi vurgu olan cümleler: HTML olarak eşleştir
  var INLINE = /^(B|STRONG|EM|I|A|SPAN|BR|SMALL|U|MARK|SUP|SUB)$/;
  function htmlKey(el) {
    return norm(el.innerHTML.replace(/\s+(class|style|id|data-[\w-]+|href|aria-[\w-]+|target|rel)="[^"]*"/g, ""));
  }
  function doMixed(el) {
    if (!el.firstChild || el.childNodes.length < 2 || el.__i18nHtml === el.innerHTML) return false;
    var hasText = false, inlineOnly = true;
    for (var c = el.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) { if (c.nodeValue.trim()) hasText = true; }
      else if (c.nodeType === 1) {
        if (c.tagName !== "BR" && !c.textContent.trim()) { inlineOnly = false; break; } // ikon yer tutucusu
        if (!INLINE.test(c.tagName) || c.querySelector("svg,img,input,button,select,textarea,i[data-lucide]")) { inlineOnly = false; break; }
      }
    }
    if (!hasText || !inlineOnly) return false;
    // Önce yuvalı şablon: iç öğeler (span, b, br…) olduğu gibi korunur, yalnızca etraflarındaki metin yeniden dizilir
    var kids = [], parts = [];
    for (var k0 = el.firstChild; k0; k0 = k0.nextSibling) {
      if (k0.nodeType === 1) { parts.push("{" + kids.length + "}"); kids.push(k0); }
      else if (k0.nodeType === 3) parts.push(k0.nodeValue);
    }
    var skey = norm(parts.join(""));
    if (Object.prototype.hasOwnProperty.call(SLOTS, skey)) {
      var segs = SLOTS[skey].split(/\{(\d+)\}/);
      while (el.firstChild) el.removeChild(el.firstChild);
      for (var q = 0; q < segs.length; q++) {
        if (q % 2 === 0) { if (segs[q]) { var tn = document.createTextNode(segs[q]); written.set(tn, segs[q]); el.appendChild(tn); } }
        else if (kids[+segs[q]]) { el.appendChild(kids[+segs[q]]); walk(kids[+segs[q]]); }
      }
      el.__i18nHtml = el.innerHTML;
      return true;
    }
    var key = htmlKey(el);
    if (!Object.prototype.hasOwnProperty.call(HTML, key)) {
      if (TR_CHARS.test(el.textContent)) missingHtml[skey] = 1;
      return false;
    }
    // Öznitelikleri koruyarak yalnızca metinleri sırayla değiştir
    var tpl = document.createElement("div");
    tpl.innerHTML = HTML[key];
    var src = [], dst = [];
    (function walk(n, arr) { for (var c = n.firstChild; c; c = c.nextSibling) { if (c.nodeType === 3) arr.push(c); else walk(c, arr); } })(el, src);
    (function walk(n, arr) { for (var c = n.firstChild; c; c = c.nextSibling) { if (c.nodeType === 3) arr.push(c); else walk(c, arr); } })(tpl, dst);
    var srcEls = el.querySelectorAll("*"), dstEls = tpl.querySelectorAll("*");
    if (srcEls.length === dstEls.length) {
      // Yapı aynıysa yalnızca metinleri değiştir (dinleyiciler korunur)
      var simple = src.length === dst.length;
      if (simple) { for (var i = 0; i < src.length; i++) { src[i].nodeValue = dst[i].nodeValue; written.set(src[i], src[i].nodeValue); } }
      else {
        // Metin düğümü sayısı farklıysa: aynı etiketleri koruyup içeriği yeniden kur
        for (var j = 0; j < dstEls.length; j++) {
          for (var k = 0; k < srcEls[j].attributes.length; k++) {
            var at = srcEls[j].attributes[k];
            dstEls[j].setAttribute(at.name, at.value);
          }
        }
        el.innerHTML = tpl.innerHTML;
      }
    } else {
      el.innerHTML = HTML[key];
    }
    el.__i18nHtml = el.innerHTML;
    Array.prototype.forEach.call(el.childNodes, function (c) { if (c.nodeType === 3) written.set(c, c.nodeValue); });
    return true;
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    if (root.closest && root.closest("[data-no-i18n],[translate=no]")) return;
    // TEXTAREA içeriği kullanıcının yazdığı metindir; yalnızca öznitelikleri
    // (placeholder, title, aria-label) çevrilir, değeri asla değiştirilmez.
    if (root.nodeName === "TEXTAREA") { doAttrs(root); return; }
    if (SKIP[root.nodeName]) return;
    doAttrs(root);
    if (doMixed(root)) return;
    for (var c = root.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 1) walk(c);
      else if (c.nodeType === 3) doText(c);
    }
  }

  var pending = [];
  var scheduled = false;
  function flush() {
    scheduled = false;
    var list = pending; pending = [];
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      if (n.nodeType === 3) {
        var p = n.parentNode;
        if (p && p.nodeType === 1 && doMixed(p)) continue;
        doText(n);
      } else walk(n);
    }
  }
  function queue(n) {
    pending.push(n);
    if (!scheduled) { scheduled = true; (window.queueMicrotask || function (f) { Promise.resolve().then(f); })(flush); }
  }

  var mo = new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (r.type === "childList") {
        for (var j = 0; j < r.addedNodes.length; j++) queue(r.addedNodes[j]);
        if (r.target && r.target.nodeType === 1 && r.addedNodes.length) queue(r.target);
      } else if (r.type === "characterData") {
        queue(r.target);
      } else if (r.type === "attributes") {
        queue(r.target);
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  walk(document.documentElement);

  // document.title
  var titleEl = document.querySelector("title");
  if (titleEl) { var tt = translate(titleEl.textContent); if (tt) titleEl.textContent = tt; }

  // Tarayıcı iletişim kutuları
  ["alert", "confirm", "prompt"].forEach(function (name) {
    var orig = window[name];
    if (typeof orig !== "function") return;
    window[name] = function (msg) {
      var args = Array.prototype.slice.call(arguments);
      if (typeof msg === "string") {
        args[0] = msg.split("\n").map(function (line) { var t = translate(line); return t == null ? line : t; }).join("\n");
      }
      return orig.apply(window, args);
    };
  });

  // JS içinden doğrudan kullanılabilir: nexusTr("Kaydet") → "Save"
  window.nexusTr = function (s) { var t = translate(s); return t == null ? s : t; };
  window.__i18nFlush = flush;
  // Bir öğenin özgün (Türkçe) metni — kayıt anahtarı ya da tür tanıma gibi mantıkta kullanılır.
  // Kullanıcı metni değiştirdiyse (ör. düzenlenebilir başlık) güncel değer döner.
  window.nexusSrcText = function (el) {
    if (!el) return "";
    var out = "";
    (function w(n) {
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) out += (originals.has(c) && c.nodeValue === written.get(c)) ? originals.get(c) : c.nodeValue;
        else if (c.nodeType === 1) w(c);
      }
    })(el);
    return out.replace(/\s+/g, " ").trim();
  };
})();
