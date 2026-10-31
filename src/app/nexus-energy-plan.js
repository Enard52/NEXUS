/* NEXUS — Enerji İzleme Planı (nexus-energy.html)
   Kullanıcı kararlı plan: cihazlar (mevcut enerji cihazı seçimi) + aylık hedef
   (kWh ya da tarife fiyatıyla TL) + dikkat saatleri. Plan kaydedilir; ilerleme
   YALNIZCA gerçek güç örneklerinden (nexusEnergyHistory) hesaplanır — uydurma
   tahmin yok. "Asistana gönder" mevcut sohbet prompt hattını kullanır. */
(function () {
  "use strict";
  var KEY = "nexusEnergyPlan";
  var HIST = "nexusEnergyHistory";
  var TARIFF = "nexusEnergyTariff";
  var DEVICES = "nexusEnergySelectedDevices";

  // İki dilli metin: sohbet sayfası ses modülüyle aynı desen (nxVoiceIsTr) —
  // dinamik kurulu cümleler kataloğa giremez, ikisi de burada taşınır.
  function tr(s, en) {
    var isTr = (document.documentElement.lang || "tr").slice(0, 2) === "tr";
    return isTr ? s : (en || s);
  }
  function get(k, fb) { try { var v = JSON.parse(nexusGetItem(k) || "null"); return v == null ? fb : v; } catch (e) { return fb; } }
  function load() { return get(KEY, null); }
  function save(p) { nexusSetItem(KEY, JSON.stringify(p)); }
  function clearPlan() { try { nexusSetItem(KEY, ""); } catch (e) {} }

  function fmt(n) { return (n < 10 ? n.toFixed(2) : n.toFixed(1)).replace(".", ","); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function monthStart(now) { var d = new Date(now); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); }
  function daysInMonth(now) { var d = new Date(now); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }

  // Tarife fiyatı (TL/kWh); yoksa null — TL hedefi o zaman dürüstçe hesaplanamaz.
  function tariffPrice() { var t = get(TARIFF, {}); return t && typeof t.price === "number" && isFinite(t.price) && t.price >= 0 ? t.price : null; }

  // Planın ilerlemesi: bu ayki GERÇEK örneklerden kWh + (tarife varsa) maliyet.
  function progress() {
    var p = load();
    if (!p) return null;
    var now = Date.now();
    var samples = get(HIST, []);
    var r = (typeof ehIntegrate === "function")
      ? ehIntegrate(samples, monthStart(now), now)
      : { kwh: 0, coveredMs: 0 };
    var kwh = r.kwh || 0;
    var price = tariffPrice();
    var spent = p.unit === "cur" ? (price != null ? kwh * price : null) : kwh;
    var budget = typeof p.budget === "number" ? p.budget : null;
    var dayCap = budget != null ? budget / daysInMonth(now) : null; // kWh veya TL (aynı birim)
    var pct = (budget != null && budget > 0 && spent != null) ? Math.min(999, Math.round((spent / budget) * 100)) : null;
    return { plan: p, kwh: kwh, price: price, spent: spent, budget: budget, dayCap: dayCap, pct: pct };
  }

  // Dünkü gerçek tüketim (kWh) — günlük dikkat eşiğiyle karşılaştırılır.
  function yesterdayKwh(now) {
    var samples = get(HIST, []);
    if (typeof ehDaily !== "function") return null;
    var d = ehDaily(samples, now || Date.now(), 2);
    return d && d[0] ? d[0].kwh : null;
  }

  function budgetUnitLabel(p) { return p.unit === "cur" ? (get(TARIFF, {}).currency || tr("TL", "currency")) : "kWh"; }

  // ---------- Kart ----------
  function renderCard() {
    var card = document.getElementById("plan-card");
    if (!card) return;
    var p = load();
    var body = document.getElementById("plan-card-body");
    if (!p) {
      body.innerHTML =
        '<p class="text-sm font-medium text-slate-500 dark:text-slate-300">' + tr("Aylık hedef koy, aşımı gör. Kontroller gerçek ölçümlerden yapılır.", "Set a monthly goal and see overruns. Checks use real meter readings.") + "</p>" +
        '<button type="button" onclick="window.nexusEnergyPlan.openSheet()" class="mt-3 w-full py-3 rounded-xl bg-[#4C7DFF] text-white font-bold text-sm active:scale-[0.98] transition-transform">' + tr("İzleme Planı Kur", "Create a Monitoring Plan") + "</button>";
    } else {
      var pr = progress();
      var unit = budgetUnitLabel(p);
      var spentTxt = pr.spent == null ? "—" : fmt(pr.spent);
      var pctTxt = pr.pct == null ? "" : " · %" + pr.pct;
      var yKwh = yesterdayKwh();
      var dayTxt = "";
      if (p.unit === "kwh" && pr.dayCap != null && yKwh != null) {
        var over = yKwh > pr.dayCap;
        dayTxt = '<p class="mt-1 text-xs font-medium ' + (over ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400") + '">' +
          (over ? tr("Dün hedefi aştın: ", "Yesterday was over: ") : tr("Dün hedef içinde: ", "Yesterday within goal: ")) + fmt(yKwh) + " / " + fmt(pr.dayCap) + " kWh</p>";
      }
      var bar = pr.pct == null ? "" :
        '<div class="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div class="h-full rounded-full ' + (pr.pct > 100 ? "bg-rose-500" : "bg-[#4C7DFF]") + '" style="width:' + Math.min(100, pr.pct) + '%"></div></div>';
      body.innerHTML =
        '<div class="flex items-center justify-between gap-3">' +
          '<div class="min-w-0"><p class="text-sm font-bold text-slate-800 dark:text-slate-100">' + tr("Hedef", "Goal") + ": " + esc(String(p.budget).replace(".", ",")) + " " + esc(unit) + pctTxt + "</p>" +
          '<p class="text-xs font-medium text-slate-400 mt-0.5">' + (p.devices && p.devices.length ? p.devices.length + " " + tr("cihaz izleniyor", "devices watched") : tr("cihaz seçilmedi", "no devices selected")) +
          " · " + tr("dikkat", "attention") + " " + pad2(p.hours.from) + ":00–" + pad2(p.hours.to) + ":00" +
          (p.unit === "cur" && pr.price == null ? " · " + tr("tarife fiyatı yok, kWh gösterilir", "no tariff price, showing kWh") : "") + "</p>" +
          '<p class="text-xs font-medium text-slate-500 dark:text-slate-300 mt-1">' + tr("Bu ay:", "This month:") + " " + spentTxt + " " + esc(unit) + "</p>" +
          dayTxt + "</div>" +
        "</div>" + bar +
        '<div class="mt-3 flex gap-2">' +
          '<button type="button" onclick="window.nexusEnergyPlan.openSheet()" class="flex-1 py-2.5 rounded-xl bg-[#4C7DFF]/10 text-[#4C7DFF] font-bold text-xs active:scale-[0.98] transition-transform">' + tr("Düzenle", "Edit") + "</button>" +
          '<button type="button" onclick="window.nexusEnergyPlan.sendToChat()" class="flex-1 py-2.5 rounded-xl bg-[#4C7DFF]/10 text-[#4C7DFF] font-bold text-xs active:scale-[0.98] transition-transform">' + tr("Asistana Gönder", "Send to Assistant") + "</button>" +
          '<button type="button" onclick="window.nexusEnergyPlan.remove()" class="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-bold text-xs active:scale-[0.98] transition-transform">' + tr("Sil", "Delete") + "</button>" +
        "</div>";
    }
    if (window.lucide) window.lucide.createIcons();
  }

  // ---------- Sheet (3 adım) ----------
  var step = 1;
  function showStep(n) {
    step = n;
    [1, 2, 3].forEach(function (i) {
      var el = document.getElementById("plan-step-" + i);
      if (el) el.classList.toggle("hidden", i !== n);
      var dot = document.getElementById("plan-dot-" + i);
      if (dot) dot.className = "h-1.5 rounded-full transition-all " + (i === n ? "w-6 bg-[#4C7DFF]" : "w-1.5 bg-slate-300 dark:bg-slate-600");
    });
    var back = document.getElementById("plan-back");
    if (back) back.classList.toggle("hidden", n === 1);
    var next = document.getElementById("plan-next");
    if (next) next.textContent = n === 3 ? tr("Kaydet", "Save") : tr("İleri", "Next");
    if (n === 3) fillSummary();
  }

  function planDevices() { return get(DEVICES, []); }

  function fillSummary() {
    var box = document.getElementById("plan-summary");
    if (!box) return;
    var budget = parseFloat(document.getElementById("plan-budget").value.replace(",", "."));
    var unit = document.getElementById("plan-unit").value;
    var from = parseInt(document.getElementById("plan-from").value, 10);
    var to = parseInt(document.getElementById("plan-to").value, 10);
    var devs = planDevices();
    var unitLabel = unit === "cur" ? (get(TARIFF, {}).currency || tr("TL", "currency")) : "kWh";
    var warns = [];
    if (!(budget > 0)) warns.push(tr("Hedef sayı olmalı.", "The goal must be a number."));
    if (unit === "cur" && tariffPrice() == null) warns.push(tr("Tarife fiyatı girilmediği için TL hedefi ölçümlerle karşılaştırılamaz; yine de kaydedilebilir.", "No tariff price set, so a currency goal cannot be compared with readings; you can still save it."));
    if (!devs.length) warns.push(tr("Cihaz seçilmedi; plan yalnızca genel tüketimi izler.", "No devices selected; the plan watches overall usage only."));
    var lines = [
      "<b>" + tr("Cihazlar", "Devices") + ":</b> " + (devs.length ? esc(devs.join(", ")) : tr("—", "—")) +
        ' <button type="button" onclick="window.nexusEnergyPlan.pickDevices()" class="ml-1 text-[#4C7DFF] font-bold underline">' + tr("düzenle", "edit") + "</button> ",
      "<b>" + tr("Aylık hedef", "Monthly goal") + ":</b> " + (budget > 0 ? esc(String(budget).replace(".", ",")) + " " + esc(unitLabel) : "—"),
      "<b>" + tr("Dikkat saatleri", "Attention hours") + ":</b> " + pad2(from) + ":00–" + pad2(to) + ":00"
    ];
    box.innerHTML = lines.map(function (l) { return '<p class="text-sm font-medium text-slate-700 dark:text-slate-200 py-1">' + l + "</p>"; }).join("") +
      warns.map(function (w) { return '<p class="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">⚠ ' + esc(w) + "</p>"; }).join("") +
      '<p class="mt-2 text-xs text-slate-400 leading-relaxed">' + tr("Plan kaydedilir; ilerleme yalnızca gerçek ölçümlerden hesaplanır. Onay senin: kaydetmeden hiçbir şey değişmez.", "The plan is saved; progress is computed from real readings only. Your call: nothing changes until you save.") + "</p>";
  }

  function readForm() {
    return {
      budget: parseFloat(String(document.getElementById("plan-budget").value).replace(",", ".")),
      unit: document.getElementById("plan-unit").value,
      hours: { from: parseInt(document.getElementById("plan-from").value, 10) || 0, to: parseInt(document.getElementById("plan-to").value, 10) || 0 },
      devices: planDevices(),
      createdAt: Date.now(), updatedAt: Date.now(),
    };
  }

  function doSave(thenChat) {
    var p = readForm();
    if (!(p.budget > 0)) { fillSummary(); return; }
    var prev = load();
    if (prev) p.createdAt = prev.createdAt;
    save(p);
    if (typeof window.openSheet === "function") window.closeSheets();
    renderCard();
    if (window.nexusToast) window.nexusToast(tr("Plan kaydedildi.", "Plan saved."), { type: "success", duration: 2200, key: "plan" });
    if (thenChat) sendToChat();
  }

  function summaryText() {
    var p = load();
    if (!p) return "";
    var unit = budgetUnitLabel(p);
    return tr(
      "Enerji izleme planım: " + (p.devices && p.devices.length ? p.devices.length + " cihaz (" + p.devices.join(", ") + ")" : "genel tüketim") +
      ", aylık hedef " + p.budget + " " + unit + ", dikkat saatleri " + pad2(p.hours.from) + ":00–" + pad2(p.hours.to) + ":00. Bu planı benimle takip et; hedefi aşarsam neyi azaltmam gerektiğini söyle.",
      "My energy monitoring plan: " + (p.devices && p.devices.length ? p.devices.length + " devices (" + p.devices.join(", ") + ")" : "overall usage") +
      ", monthly goal " + p.budget + " " + unit + ", attention hours " + pad2(p.hours.from) + ":00–" + pad2(p.hours.to) + ":00. Track this plan with me and tell me what to cut when I go over."
    );
  }

  function sendToChat() {
    var p = load();
    if (!p) return;
    var text = summaryText();
    location.href = "nexus-chat.html?promptText=" + encodeURIComponent(text);
  }

  function pickDevices() { location.href = "nexus-energy-devices.html"; }

  function remove() {
    clearPlan();
    renderCard();
    if (window.nexusToast) window.nexusToast(tr("Plan silindi.", "Plan deleted."), { type: "info", duration: 2200, key: "plan" });
  }

  // Form açılışında mevcut planla doldur
  function openSheet() {
    [document.getElementById("plan-from"), document.getElementById("plan-to")].forEach(function (sel) {
      if (!sel || sel.options.length) return;
      for (var h = 0; h < 24; h++) {
        var o = document.createElement("option");
        o.value = h; o.textContent = pad2(h) + ":00";
        sel.appendChild(o);
      }
    });
    var p = load();
    var budget = document.getElementById("plan-budget");
    var unit = document.getElementById("plan-unit");
    var from = document.getElementById("plan-from");
    var to = document.getElementById("plan-to");
    if (p) {
      budget.value = String(p.budget).replace(".", ",");
      unit.value = p.unit;
      from.value = p.hours.from; to.value = p.hours.to;
    } else {
      budget.value = ""; unit.value = "kwh"; from.value = 23; to.value = 7;
    }
    var devs = planDevices();
    var chipBox = document.getElementById("plan-devices");
    if (chipBox) chipBox.innerHTML = devs.length
      ? devs.map(function (d) { return '<span class="px-3 py-1.5 rounded-full bg-[#4C7DFF]/10 text-[#4C7DFF] text-xs font-bold">' + esc(d) + "</span>"; }).join("")
      : '<span class="text-xs font-medium text-slate-400">' + tr("Henüz cihaz seçilmedi.", "No devices selected yet.") + "</span>";
    showStep(1);
    if (typeof window.openSheet === "function") window.openSheet("plan");
  }

  function next() {
    if (step === 1) { showStep(2); return; }
    if (step === 2) { fillSummary(); showStep(3); return; }
    doSave(false);
  }
  function back() { if (step > 1) showStep(step - 1); }

  // Bildirim köprüsü: günlük aşım ilk görüldüğünde uygulama içi uyarı (sayfa açıkken).
  function maybeDailyAlert() {
    var p = load();
    if (!p || p.unit !== "kwh") return;
    var y = yesterdayKwh();
    var cap = typeof p.budget === "number" ? p.budget / daysInMonth(Date.now()) : null;
    if (y == null || cap == null || !(y > cap)) return;
    var today = new Date().toDateString();
    var mark = "nexusEnergyPlanAlert:" + today;
    if (nexusGetItem(mark) === "1") return;
    nexusSetItem(mark, "1");
    if (window.nexusToast) window.nexusToast(tr("Dikkat: dün günlük hedefi aştın (" + fmt(y) + " kWh).", "Heads-up: yesterday exceeded the daily goal (" + fmt(y) + " kWh)."), { type: "warning", duration: 4200, key: "plan" });
  }

  window.nexusEnergyPlan = {
    openSheet: openSheet, next: next, back: back, doSave: doSave,
    sendToChat: sendToChat, pickDevices: pickDevices, remove: remove, renderCard: renderCard,
  };

  function boot() {
    renderCard();
    maybeDailyAlert();
    document.addEventListener("visibilitychange", function () { if (!document.hidden) { renderCard(); maybeDailyAlert(); } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
