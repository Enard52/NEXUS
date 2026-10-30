    lucide.createIcons();

    var HC = window.nexusHouseholdCloud;
    var listEl = document.getElementById("messages");
    var composer = document.getElementById("composer");
    var input = document.getElementById("composer-input");
    var sendBtn = document.getElementById("send-btn");
    var banner = document.getElementById("state-banner");
    var select = document.getElementById("home-select");
    var homeId = "";
    var me = "";
    var shown = {}; // id -> true (çift çizimi önler)
    var lastIso = "";
    var pollTimer = null;

    function esc(value) {
      return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
    function qs(name) {
      var m = new RegExp("[?&]" + name + "=([^&]*)").exec(location.search);
      return m ? decodeURIComponent(m[1]) : "";
    }
    function dayLabel(iso) {
      var d = new Date(iso);
      var today = new Date();
      var y = new Date(today.getTime() - 86400000);
      if (d.toDateString() === today.toDateString()) return "Bugün";
      if (d.toDateString() === y.toDateString()) return "Dün";
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    }
    function timeLabel(iso) {
      return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    }

    // Gönderen ve içerik textContent/esc ile basılır: mesaj gövdesi HTML olarak YORUMLANMAZ.
    // Her mesajın sahibi görünür: avatar + ad (kendi mesajlarında "Sen"). Üye önbelleğinden
    // (avatar + görünen ad) çözülür; eski mesajlarda sender_name yalnız yedektir.
    var activeHome = null;
    var msgById = {};   // id -> satır (tepkiler/yanıtlar yerinde güncellenir)
    var replyTo = "";   // yanıtılan mesaj kimliği (gönderince sıfırlanır)
    function senderOf(m) {
      var member = activeHome && activeHome.members
        ? activeHome.members.filter(function (x) { return x.userId === m.sender_id; })[0]
        : null;
      return {
        member: member,
        name: member && member.name ? member.name : (m.sender_name || "Üye"),
      };
    }
    function chatAvatar(member, name, mine) {
      var letter = esc(String(name || "?").charAt(0).toUpperCase());
      var inner = member && member.avatar
        ? '<img src="' + esc(member.avatar) + '" alt="" class="h-8 w-8 rounded-full object-cover" onerror="this.outerHTML=this.dataset.fallback" data-fallback="<div class=&quot;flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4C7DFF] to-[#22D3EE] text-sm font-bold text-white&quot;>' + letter + '</div>"/>'
        : '<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4C7DFF] to-[#22D3EE] text-sm font-bold text-white">' + letter + '</div>';
      var p = member && member.lastSeenAt && HC && HC.presenceOf ? HC.presenceOf(member) : null;
      var dot = p
        ? '<span class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ' + (p.key === "online" ? "bg-emerald-500" : p.key === "recent" ? "bg-amber-400" : "bg-slate-300 dark:bg-slate-600") + '" title="' + esc(p.label) + '"></span>'
        : "";
      return '<span class="relative inline-flex shrink-0 ' + (mine ? "order-2" : "") + '" data-avatar-of="' + esc(member ? member.userId : "") + '">' + inner + dot + "</span>";
    }
    // Yanıt baloncuğu: yanıtlanan mesajın sahibi + kısa gövdesi (tek satır kesilir).
    function replyQuoteHtml(m) {
      if (!m.reply_to || !m.parent) return "";
      var who = m.parent.sender_id === me ? "Sen" : (m.parent.sender_name || "Üye");
      var body = String(m.parent.body || "");
      if (body.length > 90) body = body.slice(0, 89) + "…";
      return '<button type="button" class="mb-1 block max-w-full rounded-lg border-l-4 border-current/40 bg-black/5 px-2.5 py-1.5 text-left opacity-80 dark:bg-white/10" data-jump="' + esc(m.reply_to) + '">' +
        '<span class="block text-[11px] font-bold">' + esc(who) + '</span>' +
        '<span class="block max-w-[15rem] truncate text-[11px]">' + esc(body) + '</span></button>';
    }
    // Tepki çipleri: kim tepki verdi sayı ile görünür; kendi tepkin dolgun stildedir.
    function reactionsHtml(m) {
      var rx = m.reactions && typeof m.reactions === "object" ? m.reactions : {};
      var keys = Object.keys(rx).filter(function (k) { return Array.isArray(rx[k]) && rx[k].length; });
      if (!keys.length) return "";
      var meId = me;
      return '<div class="mt-1 flex flex-wrap items-center gap-1">' + keys.map(function (e) {
        var mineToo = rx[e].indexOf(meId) !== -1;
        var names = rx[e].map(function (uid) {
          var mem = activeHome && activeHome.members ? activeHome.members.filter(function (x) { return x.userId === uid; })[0] : null;
          return mem && mem.name ? mem.name : "Üye";
        }).join(", ");
        return '<button type="button" data-react="' + esc(e) + '" data-id="' + esc(m.id) + '" title="' + esc(names) + '"' +
          ' class="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold transition-colors ' +
          (mineToo ? "bg-[#4C7DFF] text-white" : "bg-white text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700") + '">' +
          esc(e) + " " + rx[e].length + "</button>";
      }).join("") + "</div>";
    }
    // Okundu işareti: kendi mesajının altında ✓ Gönderildi / ✓✓ Okundu (N kişi).
    function readMarkHtml(m) {
      if (m.sender_id !== me || !HC || !HC.readersOf || !activeHome) return "";
      var others = activeHome.members.filter(function (x) { return x.userId !== me; });
      var readers = HC.readersOf(m, activeHome);
      if (!others.length) return "";
      var all = readers.length >= others.length;
      return '<span data-read="' + esc(m.id) + '" title="' + esc(readers.map(function (r) { return r.name; }).join(", ") || "Henüz okunmadı") + '" class="text-[10px] font-bold ' + (all ? "text-[#4C7DFF]" : "text-slate-400") + '">' + (all ? "✓✓ Okundu" : "✓ Gönderildi") + '</span>';
    }
    // Dokunma eylemleri: baloncuğa dokununca altında küçük eylem sırası (yanıtla/tepki/sil).
    function actionsHtml(m) {
      var del = m.sender_id === me
        ? '<button type="button" data-act="del" data-id="' + esc(m.id) + '" class="rounded-full px-2 py-1 text-[11px] font-bold text-red-500 active:scale-95 transition-transform">Sil</button>' : "";
      var emojis = (HC && HC.REACTION_EMOJIS ? HC.REACTION_EMOJIS : ["👍", "❤️", "🎉"]);
      return '<div class="msg-actions mt-1 hidden flex-wrap items-center gap-1">' +
        '<button type="button" data-act="reply" data-id="' + esc(m.id) + '" class="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 border border-slate-200 active:scale-95 transition-transform dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">Yanıtla</button>' +
        emojis.map(function (e) {
          return '<button type="button" data-act="react" data-emoji="' + esc(e) + '" data-id="' + esc(m.id) + '" class="rounded-full bg-white px-1.5 py-1 text-sm border border-slate-200 active:scale-90 transition-transform dark:bg-slate-800 dark:border-slate-700">' + esc(e) + '</button>';
        }).join("") + del + "</div>";
    }
    function messageHtml(m) {
      var mine = m.sender_id === me;
      var sender = senderOf(m);
      var shownName = mine ? "Sen" : sender.name;
      var name = '<p class="mb-0.5 px-1 text-xs font-bold text-slate-400">' + esc(shownName) + '</p>';
      return '<div class="mb-3 flex items-start gap-2 ' + (mine ? "flex-row-reverse" : "") + '" data-id="' + esc(m.id) + '" data-day="' + esc(new Date(m.created_at).toDateString()) + '">' +
        chatAvatar(sender.member, shownName, mine) +
        '<div class="msg-col flex min-w-0 flex-col ' + (mine ? "items-end" : "items-start") + '">' +
        name +
        replyQuoteHtml(m) +
        '<button type="button" data-bubble="' + esc(m.id) + '" class="bubble px-4 py-2.5 text-left text-[15px] font-medium leading-snug ' + (mine ? "bubble-me" : "bubble-other") + '">' + esc(m.body) + '</button>' +
        reactionsHtml(m) +
        actionsHtml(m) +
        '<div class="flex items-center gap-2"><span class="px-1 text-[11px] font-medium text-slate-400">' + esc(timeLabel(m.created_at)) + '</span>' + readMarkHtml(m) + '</div></div></div>';
    }
    function dayDivider(iso) {
      return '<p class="mb-3 mt-1 text-center text-xs font-bold uppercase tracking-wide text-slate-400" data-day-label="' + esc(new Date(iso).toDateString()) + '">' + esc(dayLabel(iso)) + '</p>';
    }

    function emptyState(title, body, actionHtml) {
      listEl.innerHTML = '<div class="mx-auto mt-10 max-w-xs text-center"><div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4C7DFF]/10 text-[#4C7DFF]"><i class="w-7 h-7" data-lucide="message-circle"></i></div>' +
        '<p class="text-lg font-bold">' + esc(title) + '</p><p class="mt-1 text-sm text-slate-500 dark:text-slate-400">' + esc(body) + '</p>' + (actionHtml || "") + '</div>';
      lucide.createIcons();
      composer.classList.add("hidden");
      composer.classList.remove("flex");
    }
    // Kalıcı uyarı (üye yok / sunucuya ulaşılamadı) ile geçici hata ayrı tutulur: yoklama her turda
    // setBanner("") çağırır; kalıcı uyarı sönüp geri gelmesin, geçici hata birkaç sn sonra kalksın.
    var baseBanner = "", bannerTimer = 0;
    function showBanner(text) {
      if (!text) { banner.classList.add("hidden"); banner.textContent = ""; return; }
      banner.textContent = text;
      banner.classList.remove("hidden");
    }
    function setBanner(text, sticky) {
      clearTimeout(bannerTimer);
      if (sticky) { baseBanner = text || ""; showBanner(baseBanner); return; }
      if (!text) { showBanner(baseBanner); return; }
      showBanner(text);
      bannerTimer = setTimeout(function () { showBanner(baseBanner); }, 5000);
    }
    function setComposerEnabled(on) {
      input.disabled = !on;
      sendBtn.disabled = !on;
    }
    function nearBottom() {
      return listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 120;
    }
    function scrollBottom() { listEl.scrollTop = listEl.scrollHeight; }

    function appendMessages(rows) {
      var stick = nearBottom();
      var fresh = rows.filter(function (m) { return !shown[m.id]; });
      if (!fresh.length) return;
      if (listEl.querySelector("[data-empty]")) listEl.innerHTML = "";
      var all = listEl.querySelectorAll("[data-id]");
      var lastDay = all.length ? all[all.length - 1].getAttribute("data-day") : "";
      var html = "";
      fresh.forEach(function (m) {
        shown[m.id] = true;
        msgById[m.id] = m;
        var day = new Date(m.created_at).toDateString();
        if (day !== lastDay) { html += dayDivider(m.created_at); lastDay = day; }
        html += messageHtml(m);
        if (!lastIso || m.created_at > lastIso) lastIso = m.created_at;
      });
      listEl.insertAdjacentHTML("beforeend", html);
      if (stick) scrollBottom();
      HC.markSeen(homeId, lastIso);
      // Okundu bilgisi sunucuya da yazılır: diğer üyeler kendi mesajında ✓✓ görür.
      if (HC.markRead) HC.markRead(homeId, lastIso).catch(function () {});
    }

    function loadHistory() {
      shown = {}; lastIso = ""; msgById = {}; setReply(null); hideAllActions();
      listEl.innerHTML = '<p class="mt-10 text-center text-sm text-slate-400">Mesajlar yükleniyor…</p>';
      return HC.listMessages(homeId, { limit: 50 }).then(function (rows) {
        setBanner("");
        setComposerEnabled(true);
        listEl.innerHTML = "";
        if (!rows.length) {
          listEl.innerHTML = '<p data-empty class="mt-10 text-center text-sm text-slate-400">Henüz mesaj yok. İlk mesajı sen yaz.</p>';
          HC.markSeen(homeId, new Date().toISOString());
          return;
        }
        appendMessages(rows);
        scrollBottom();
      }, function (e) {
        // Çevrimdışı / sunucu hatası: eski mesajlar önbelleğe alınmaz, uydurulmaz.
        listEl.innerHTML = '<p class="mt-10 text-center text-sm text-slate-400">Mesajlar yüklenemedi.</p>';
        setBanner(e.message + " Gönderme şu an kapalı.");
        setComposerEnabled(false);
      });
    }

    function removeMessage(id) {
      window.nexusDialog({
        icon: "warning", title: "Mesajı Sil", message: "Bu mesaj tüm üyeler için silinir.",
        primary: { label: "Sil", onClick: function () {
          HC.deleteMessage(id).then(function () { dropMessage(id); }, function (e) { setBanner(e.message); });
        } },
        secondary: { label: "Vazgeç" }
      });
    }
    function dropMessage(id) {
      var node = listEl.querySelector('[data-id="' + id + '"]');
      if (node && node.parentNode) node.parentNode.removeChild(node);
      delete shown[id];
      delete msgById[id];
    }

    // ---- mesaj eylemleri: yanıtla / tepki / sil + balon dokunuşu ----------------------
    function hideAllActions() {
      listEl.querySelectorAll(".msg-actions").forEach(function (el) { el.classList.add("hidden"); });
    }
    function setReply(m) {
      replyTo = m ? m.id : "";
      var bar = document.getElementById("reply-bar");
      if (!m) { bar.classList.add("hidden"); bar.classList.remove("flex"); return; }
      document.getElementById("reply-name").textContent = m.sender_id === me ? "Sen" : (senderOf(m).name);
      document.getElementById("reply-quote").textContent = String(m.body || "");
      bar.classList.remove("hidden");
      bar.classList.add("flex");
      input.focus();
    }
    function redrawMessage(m) {
      var node = listEl.querySelector('[data-id="' + m.id + '"]');
      if (!node) return;
      node.outerHTML = messageHtml(m);
      msgById[m.id] = m;
    }
    listEl.addEventListener("click", function (ev) {
      var t = ev.target.closest("button");
      if (!t) { return; }
      // Yanıt baloncuğuna dokunma: kaynak mesaja kaydır
      if (t.hasAttribute("data-jump")) {
        var src = listEl.querySelector('[data-id="' + t.getAttribute("data-jump") + '"]');
        if (src) { src.scrollIntoView({ block: "center", behavior: "smooth" }); src.classList.add("ring-2", "ring-[#4C7DFF]"); setTimeout(function () { src.classList.remove("ring-2", "ring-[#4C7DFF]"); }, 1200); }
        return;
      }
      if (t.hasAttribute("data-react")) {
        var rxId = t.getAttribute("data-react") ? t.getAttribute("data-id") : "";
        if (rxId && HC.reactMessage) HC.reactMessage(rxId, t.getAttribute("data-react")).then(function (cur) {
          var m = msgById[rxId];
          if (m) { m.reactions = cur; redrawMessage(m); }
        }, function (e) { setBanner(e.message); });
        return;
      }
      var act = t.getAttribute("data-act");
      if (!act) { if (!t.hasAttribute("data-bubble")) hideAllActions(); return; }
      var id = t.getAttribute("data-id");
      var m = msgById[id];
      if (act === "reply" && m) { hideAllActions(); setReply(m); return; }
      if (act === "react" && m) {
        HC.reactMessage(id, t.getAttribute("data-emoji")).then(function (cur) {
          m.reactions = cur; redrawMessage(m);
        }, function (e) { setBanner(e.message); });
        return;
      }
      if (act === "del" && m) { hideAllActions(); removeMessage(id); return; }
      if (t.hasAttribute("data-bubble")) {
        // Baloncuğa dokunma: eylem sırası aç/kapa (başka açık varsa kapat)
        var row = t.closest("[data-id]");
        var box = row && row.querySelector(".msg-actions");
        var wasHidden = box && box.classList.contains("hidden");
        hideAllActions();
        if (box && wasHidden) box.classList.remove("hidden");
      }
    });
    document.getElementById("reply-cancel").addEventListener("click", function () { setReply(null); });

    // Okundu işaretlerini tazeler: üye satırları Realtime'dan güncellenince çağrılır.
    function refreshReadMarks() {
      activeHome = (HC.homes() || []).filter(function (h) { return h.id === homeId; })[0] || activeHome;
      if (!activeHome || !HC.readersOf) return;
      listEl.querySelectorAll("[data-read]").forEach(function (el) {
        var m = msgById[el.getAttribute("data-read")];
        if (m) el.outerHTML = readMarkHtml(m);
      });
    }

    // ---- Haftalık Özet: son 7 günün gerçek etkinlik kayıtlarından hesaplanır ---------
    var ACT_LABEL = { member_joined: "eve katıldı", member_left: "evden ayrıldı", member_removed: "evden çıkarıldı", scene_run: "senaryo çalıştırdı", alert: "uyarı paylaştı" };
    function closeSummary() {
      var el = document.getElementById("summary-overlay");
      el.classList.add("hidden"); el.classList.remove("flex");
    }
    function openSummary() {
      if (!homeId) return;
      var body = document.getElementById("summary-body");
      var sub = document.getElementById("summary-sub");
      document.getElementById("summary-overlay").classList.remove("hidden");
      document.getElementById("summary-overlay").classList.add("flex");
      sub.textContent = document.getElementById("chat-title").textContent + " · son 7 gün";
      body.innerHTML = '<p class="py-6 text-center text-sm text-slate-400">Etkinlikler yükleniyor…</p>';
      HC.listActivity(homeId, 200).then(function (rows) {
        var since = Date.now() - 7 * 86400000;
        var week = rows.filter(function (r) { var t = Date.parse(r.created_at); return !isNaN(t) && t >= since; });
        if (!week.length) {
          body.innerHTML = '<p class="py-6 text-center text-sm text-slate-400">Bu hafta kayda değer bir etkinlik yok. Senaryo çalıştırmaları ve uyarılar burada toplanır.</p>';
          return;
        }
        var runs = week.filter(function (r) { return r.kind === "scene_run"; });
        var alerts = week.filter(function (r) { return r.kind === "alert"; });
        var byMember = {};
        runs.forEach(function (r) { var k = r.actor_name || "Bir üye"; byMember[k] = (byMember[k] || 0) + 1; });
        var top = Object.keys(byMember).sort(function (a, b) { return byMember[b] - byMember[a]; }).slice(0, 5);
        var html = "";
        html += statCard(" Senaryo", String(runs.length));
        html += statCard(" Uyarı", String(alerts.length));
        if (top.length) {
          html += '<div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">' + top.map(function (n) {
            return '<div class="flex items-center justify-between py-1"><span class="text-sm font-bold text-slate-700 dark:text-slate-200">' + esc(n) + '</span><span class="text-sm font-semibold text-[#4C7DFF]">' + byMember[n] + '</span></div>';
          }).join("") + "</div>";
        }
        html += '<div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">' + week.slice(0, 6).map(function (r) {
          var what = ACT_LABEL[r.kind] ? "<b>" + esc(r.actor_name || "Bir üye") + "</b> " + esc(ACT_LABEL[r.kind]) + (r.kind === "scene_run" || r.kind === "alert" ? ": " + esc(r.title) : "")
            : esc(r.title || r.kind);
          return '<p class="py-0.5 text-xs text-slate-500 dark:text-slate-300">' + what + '</p>';
        }).join("") + "</div>";
        body.innerHTML = html;
        lucide.createIcons();
      }, function (e) {
        body.innerHTML = '<p class="py-6 text-center text-sm text-amber-700 dark:text-amber-300">' + esc(e.message) + '</p>';
      });
    }
    function statCard(label, value) {
      return '<div class="flex items-center justify-between rounded-2xl bg-[#4C7DFF]/10 px-4 py-3"><span class="text-sm font-bold text-slate-600 dark:text-slate-200">' + esc(label) + '</span><span class="text-lg font-extrabold text-[#4C7DFF]">' + esc(value) + '</span></div>';
    }
    document.getElementById("summary-btn").addEventListener("click", openSummary);

    // Gönder: yalnızca düz metin; sınır ve hız sınırı istemcide de uygulanır, asıl sınır sunucudadır.
    composer.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var text = input.value;
      if (!text.trim() || sendBtn.disabled) return;
      sendBtn.disabled = true;
      var rep = replyTo; setReply(null);
      HC.sendMessage(homeId, text, rep).then(function (row) {
        input.value = "";
        autosize();
        if (row) { appendMessages([row]); scrollBottom(); }
        setBanner("");
      }, function (e) {
        setBanner(e.message);
      }).then(function () { sendBtn.disabled = input.disabled; input.focus(); });
    });
    input.addEventListener("keydown", function (e) {
      // Enter gönderir, Shift+Enter satır ekler (IME bileşimi sırasında gönderme)
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); composer.requestSubmit(); }
    });
    function autosize() {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
      var left = HC.MAX_BODY - input.value.length;
      var c = document.getElementById("composer-count");
      c.textContent = left;
      c.classList.toggle("hidden", left > 150);
    }
    input.addEventListener("input", autosize);

    // Canlı akış: Realtime (cloud-sync.js) → household-cloud.js → bu olaylar.
    window.addEventListener("nexusHouseholdMessage", function (ev) {
      var m = ev && ev.detail && ev.detail.message;
      if (m && m.household_id === homeId) appendMessages([m]);
    });
    // Tepkiler RPC ile değişti: baloncuğu yerinde güncelle (yeniden çekme yok).
    window.addEventListener("nexusHouseholdMessageUpdated", function (ev) {
      var m = ev && ev.detail && ev.detail.message;
      if (!m || m.household_id !== homeId) return;
      var cur = msgById[m.id];
      if (cur) { cur.reactions = m.reactions; redrawMessage(cur); }
    });
    window.addEventListener("nexusHouseholdMessageDeleted", function (ev) {
      if (ev && ev.detail && ev.detail.id) dropMessage(ev.detail.id);
    });
    // Üye satırları güncellendi (okundu/presence): ✓✓ işaretlerini tazele.
    // Avatar/ad/presence değişince üye önbelleği yeniden okunur ve görünen avatarlar yerinde tazelenir.
    window.addEventListener("nexusHouseholdChanged", function () {
      var fresh = HC.homes().filter(function (h) { return h.id === homeId; })[0];
      if (fresh) {
        activeHome = fresh;
        Array.prototype.forEach.call(listEl.querySelectorAll("[data-avatar-of]"), function (el) {
          var uid = el.getAttribute("data-avatar-of");
          if (!uid) return;
          var mem = fresh.members.filter(function (x) { return x.userId === uid; })[0];
          if (!mem) return;
          var tmp = document.createElement("div");
          tmp.innerHTML = chatAvatar(mem, uid === me ? "Sen" : mem.name, uid === me);
          if (tmp.firstChild && tmp.firstChild.innerHTML !== el.innerHTML) el.innerHTML = tmp.firstChild.innerHTML;
        });
        if (fresh.members.length >= 2 && baseBanner.indexOf("henüz başka üye yok") !== -1) setBanner("", true);
      }
      refreshReadMarks();
    });
    // Sohbet açıkken üye listesi (avatar, çevrimiçi) dakikada bir sunucudan tazelenir.
    setInterval(function () { if (!document.hidden && homeId) HC.refresh().catch(function () {}); }, 60000);
    // Realtime yoksa 8 sn'lik yoklama (sunucu gerçeğine yetişmek için; uydurma yok)
    function startPolling() {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = setInterval(function () {
        if (document.hidden || !homeId) return;
        if (window.nexusCloud && window.nexusCloud.realtimeActive && window.nexusCloud.realtimeActive()) return;
        HC.listMessages(homeId, { limit: 30 }).then(function (rows) { appendMessages(rows); setBanner(""); }, function () {});
      }, 8000);
    }
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && homeId) { HC.setActiveChat(homeId); HC.listMessages(homeId, { limit: 30 }).then(appendMessages, function () {}); }
      else HC.setActiveChat("");
    });
    window.addEventListener("pagehide", function () { HC.setActiveChat(""); });

    function openHome(home) {
      homeId = home.id;
      activeHome = home;
      document.getElementById("chat-title").textContent = home.name;
      // Alt başlıkta kaç üye ve kaçı çevrimiçi görünür: "kimler burada" bir bakışta anlaşılır.
      var online = 0;
      if (HC && HC.presenceOf) home.members.forEach(function (m) { if (HC.presenceOf(m).online) online++; });
      document.getElementById("chat-sub").textContent = home.members.length + " üye" + (online > 1 ? " · " + online + " çevrimiçi" : "");
      HC.setActiveChat(homeId);
      composer.classList.remove("hidden");
      composer.classList.add("flex");
      loadHistory();
    }

    function init() {
      if (!HC) { emptyState("Aile sohbeti kullanılamıyor", "Bu sürümde bulut modülü yok."); return; }
      HC.status().then(function (st) {
        if (!st.ok) {
          if (st.reason === "cloud-off") emptyState("Bulut bağlantısı kapalı", "Aile sohbeti mesajları sunucuda saklar; bu sürümde bulut kapalı olduğu için kullanılamıyor.");
          else emptyState("Oturum açık değil", "Aile sohbeti için oturum açmalısın.", '<button class="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#4C7DFF] px-5 py-3 font-bold text-white" onclick="location.href=\'nexus-login.html\'"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/></svg>Oturum Aç</button>');
          return;
        }
        me = st.userId;
        return HC.refresh().then(function (res) {
          var homes = HC.homes();
          if (!res.ok && !homes.length) {
            emptyState("Sunucuya ulaşılamadı", "Aile verisi alınamadı; çevrimdışı olabilirsin. İnternet bağlantını kontrol edip tekrar dene.", '<button class="mt-5 rounded-xl bg-[#4C7DFF] px-5 py-3 font-bold text-white" onclick="location.reload()">Tekrar Dene</button>');
            return;
          }
          if (!homes.length) {
            emptyState("Henüz bir evin yok", "Aile sohbeti için bir ev oluştur ya da sana gönderilen davetle bir eve katıl.", '<button class="mt-5 rounded-xl bg-[#4C7DFF] px-5 py-3 font-bold text-white" onclick="location.href=\'nexus-household.html\'">Ev Yönetimi</button>');
            return;
          }
          var wanted = qs("home");
          var home = homes.filter(function (h) { return h.id === wanted; })[0] || homes[0];
          if (homes.length > 1) {
            select.innerHTML = homes.map(function (h) { return '<option value="' + esc(h.id) + '"' + (h.id === home.id ? " selected" : "") + ">" + esc(h.name) + "</option>"; }).join("");
            select.classList.remove("hidden");
            select.addEventListener("change", function () {
              var next = HC.homes().filter(function (h) { return h.id === select.value; })[0];
              if (next) openHome(next);
            });
          }
          if (home.members.length < 2) setBanner("Bu evde henüz başka üye yok. Üye davet ettiğinde onlarla yazışabilirsin.", true);
          openHome(home);
          if (!res.ok) setBanner("Sunucuya tam ulaşılamadı; üye listesi eski olabilir.", true);
          startPolling();
        });
      });
    }
    init();
  
