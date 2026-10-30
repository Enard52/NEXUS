    lucide.createIcons();

    // Aile modeli: oturum açıkken evler, üyeler, davetler ve izinler SUNUCUDA durur
    // (household-cloud.js → Supabase). Her cihaz aynı üye listesini ve rolleri görür.
    // Bulut kapalı ya da oturum yoksa evler yalnızca bu cihazda tutulur (home.cloud yok)
    // ve davet / sohbet kullanılamaz — ekran bunu açıkça söyler.
    var HOUSE_KEY = "nexusHousehold";
    var detailId = "";
    var sheetMode = "";
    var memberRef = null; // { userId } (bulut) ya da { index } (yerel)
    var HC = window.nexusHouseholdCloud;
    // Bulut durumu sorgulanana kadar "pending": sorgu bitmeden "bulut kapalı" uyarısı çakıp sönmesin.
    var cloudState = HC ? { ok: false, reason: "pending" } : { ok: false, reason: "cloud-off" };
    var refreshInfo = { ok: true, reason: "" };

    function showHouseholdToast(msg, type) { window.nexusToast(msg, { type: type === 'error' ? 'error' : 'success' }); }
    function fail(error) {
      showHouseholdToast(error && error.message ? error.message : "İşlem tamamlanamadı.", "error");
    }

    function ownerName() { return nexusGetItem("nexusUserName") || "Misafir"; }
    function ownerEmail() { return nexusGetItem("nexusUserEmail") || ""; }
    function ownerAvatar() { return nexusGetItem("nexusAvatar") || ""; }
    function esc(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
    function randomId(prefix) {
      return prefix + "-" + Math.random().toString(36).slice(2, 10);
    }
    function defaultPerms(role) {
      var owner = role === "Ev Sahibi";
      return { control: true, invite: owner, settings: owner };
    }
    function defaultHome(name) {
      return {
        id: randomId("home"),
        name: name || "Evim",
        location: nexusGetItem("nexusHomeLocation") || "",
        rooms: [],
        members: [{ name: ownerName(), email: ownerEmail(), avatar: ownerAvatar(), role: "Ev Sahibi", perms: defaultPerms("Ev Sahibi") }]
      };
    }
    function ensureHome(home) {
      if (!home.id) home.id = randomId("home");
      if (typeof home.location === "undefined") home.location = nexusGetItem("nexusHomeLocation") || "";
      if (!Array.isArray(home.rooms)) home.rooms = [];
      if (!Array.isArray(home.members)) home.members = [];
      home.members.forEach(function (member) {
        if (member.role === "Sahip") member.role = "Ev Sahibi";
        if (typeof member.email === "undefined") member.email = "";
        if (typeof member.avatar === "undefined") member.avatar = "";
        if (typeof member.perms === "undefined") member.perms = defaultPerms(member.role);
      });
      return home;
    }
    function loadHomes() {
      var homes;
      try { homes = JSON.parse(nexusGetItem(HOUSE_KEY) || "null"); } catch (e) {}
      if (!Array.isArray(homes)) homes = [];
      if (!homes.length) {
        // Oturumlu kullanıcıya uydurma bir "Evim" gösterilmez: sunucu cevap verene kadar boş durum.
        if (cloudState.ok || (window.nexusCloud && window.nexusCloud.enabled())) return [];
        homes = [defaultHome("Evim")];
        saveHomes(homes);
        return homes;
      }
      homes.forEach(function (home) { if (!home.cloud) ensureHome(home); });
      return homes;
    }
    function saveHomes(homes) {
      nexusSetItem(HOUSE_KEY, JSON.stringify(homes));
    }
    // Yerel ev değişikliği: bulut evlerini bozmadan yalnızca yerel kaydı günceller.
    function mutateLocal(id, fn) {
      var homes = loadHomes();
      var home = homes.filter(function (h) { return h.id === id && !h.cloud; })[0];
      if (!home) return false;
      fn(home);
      saveHomes(homes);
      return true;
    }
    function currentHome() {
      return detailId ? loadHomes().filter(function (h) { return h.id === detailId; })[0] || null : null;
    }
    function isCloudHome(home) { return !!(home && home.cloud); }
    function allow(home, perm) { return HC ? HC.can(home, perm) : true; }
    function isOwner(home) { return !home.cloud || home.myRole === "owner"; }

    // Üye görseli: varsa fotoğraf (yıkılırsa baş harfe döner) + çevrimiçi durumu noktası.
    // Konum/boyut/renk satır içi: derlenmiş Tailwind'de -bottom-0.5 ve bg-amber-400 yok, nokta köşeden kayıyordu.
    var PRESENCE_DOT = {
      online: ' style="background:#10b981"',
      recent: ' style="background:#fbbf24"',
      offline: ' style="background:#94a3b8"',
    };
    var PRESENCE_POS = "position:absolute;right:-2px;bottom:-2px;width:14px;height:14px;box-sizing:border-box;";
    function memberAvatar(member) {
      var inner = member.avatar
        ? '<img src="' + esc(member.avatar) + '" alt="" class="h-11 w-11 rounded-full object-cover" onerror="this.outerHTML=\'<div class=&quot;flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#4C7DFF] to-[#22D3EE] font-bold text-white&quot;>' + esc((member.name || "?").charAt(0).toUpperCase()) + '</div>\'"/>'
        : '<div class="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#4C7DFF] to-[#22D3EE] font-bold text-white">' + esc((member.name || "?").charAt(0).toUpperCase()) + "</div>";
      // Yalnız bulut üyelerinin kalp atışı vardır; yerel üyede nokta gösterilmez.
      var p = member && member.lastSeenAt && HC && HC.presenceOf ? HC.presenceOf(member) : null;
      var dot = p ? '<span class="nx-presence-dot rounded-full border-2 border-white dark:border-slate-900"' + (PRESENCE_DOT[p.key] || PRESENCE_DOT.offline).replace('style="', 'style="' + PRESENCE_POS) + ' title="' + esc(p.label) + '"></span>' : "";
      return '<span class="relative inline-flex shrink-0">' + inner + dot + "</span>";
    }
    function memberPresenceLabel(member) {
      if (!member || !HC || !HC.presenceOf) return "";
      var p = HC.presenceOf(member);
      return '<span class="block truncate text-xs ' + (p.key === "online" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400") + '">' + esc(p.label) + "</span>";
    }

    // ---- bulut durumu / dürüst boş durumlar ----------------------------------------
    function renderBanner() {
      var el = document.getElementById("cloud-banner");
      var text = "", action = "";
      if (cloudState.reason === "pending") {
        // henüz sorgulanıyor: uyarı gösterme
      } else if (!cloudState.ok && cloudState.reason === "cloud-off") {
        text = "Bulut bağlantısı bu sürümde kapalı. Evler yalnızca bu cihazda tutulur; üye daveti ve aile sohbeti kullanılamaz.";
      } else if (!cloudState.ok) {
        text = "Oturum açık değil. Evler yalnızca bu cihazda tutulur. Üye davet etmek, bir eve katılmak ve aile sohbeti için oturum aç.";
        action = '<button class="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#4C7DFF] px-4 py-2 text-sm font-bold text-white" onclick="location.href=\'nexus-login.html\'"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/></svg>Oturum Aç</button>';
      } else if (!refreshInfo.ok) {
        text = refreshInfo.reason === "offline"
          ? "Sunucuya ulaşılamıyor (çevrimdışı olabilirsin). Son bilinen veriler gösteriliyor; değişiklikler şu an yapılamaz."
          : "Aile verisi sunucudan alınamadı: " + refreshInfo.message;
        action = '<button class="mt-3 rounded-xl border border-amber-300 px-4 py-2 text-sm font-bold text-amber-800 dark:border-amber-700 dark:text-amber-200" onclick="reloadCloud()">Tekrar Dene</button>';
      }
      if (!text) { el.classList.add("hidden"); el.innerHTML = ""; return; }
      el.classList.remove("hidden");
      el.innerHTML = '<div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">' + esc(text) + action + '</div>';
    }
    function reloadCloud() {
      if (!HC) return Promise.resolve();
      return HC.status().then(function (st) {
        cloudState = st;
        if (!st.ok) { renderBanner(); renderHomes(); renderInbox([]); return; }
        return HC.refresh().then(function (res) {
          refreshInfo = res.ok ? { ok: true } : { ok: false, reason: res.reason, message: res.error || "" };
          // Oturum açıksa yalnız-bu-cihaz evleri kullanıcıdan istemeden hesaba bağlanır:
          // aile özellikleri (davet, sohbet, izin) doğrudan açık olur, "taşı" düğmesi kalmadı.
          return autoConnectLocalHomes().then(function () {
            renderBanner();
            renderHomes();
            if (currentHome()) renderHomeDetail(); else if (detailId) closeHomeDetail();
            return HC.myInvites().then(renderInbox, function () { renderInbox([]); });
          });
        });
      });
    }
    var autoConnecting = false;
    function autoConnectLocalHomes() {
      if (!HC || !HC.migrateAllLocalHomes || autoConnecting) return Promise.resolve();
      var locals = loadHomes().filter(function (h) { return h && !h.cloud; });
      if (!locals.length) return Promise.resolve();
      autoConnecting = true;
      return HC.migrateAllLocalHomes().then(function (done) {
        autoConnecting = false;
        if (!done) return;
        showHouseholdToast(done + ' ev hesabına bağlandı — aile özellikleri açık.');
        return HC.refresh().catch(function () {});
      }, function () { autoConnecting = false; });
    }

    // ---- bana gelen davetler (kodsuz kabul: e-postam eşleşiyor) ----------------------
    function renderInbox(invites) {
      var el = document.getElementById("invites-inbox");
      if (!invites || !invites.length) { el.classList.add("hidden"); el.innerHTML = ""; return; }
      el.classList.remove("hidden");
      el.innerHTML = '<p class="px-1 text-sm font-medium text-slate-500">Sana gelen davetler</p>' + invites.map(function (inv) {
        return '<div class="surface card-shadow rounded-3xl border border-transparent bg-white p-5 dark:bg-slate-900">' +
          '<p class="font-bold">' + esc(inv.household_name) + '</p>' +
          '<p class="mt-1 text-sm text-slate-500">' + esc(inv.invited_by_name || "Bir ev üyesi") + ' seni <b>' + esc(HC.roleLabel(inv.role)) + '</b> olarak davet etti.</p>' +
          '<div class="mt-4 flex gap-3">' +
          '<button class="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200" onclick="declineInvite(\'' + esc(inv.invite_id) + '\')">Reddet</button>' +
          '<button class="flex-1 rounded-xl bg-[#4C7DFF] py-3 font-bold text-white" onclick="acceptInvite(\'' + esc(inv.invite_id) + '\')">Katıl</button></div></div>';
      }).join("");
    }
    function acceptInvite(id) {
      HC.accept({ inviteId: id }).then(function () { showHouseholdToast("Eve katıldın."); reloadCloud(); }, fail);
    }
    function declineInvite(id) {
      HC.decline(id).then(function () { reloadCloud(); }, fail);
    }

    // ---- ev listesi -----------------------------------------------------------------
    function renderHomes() {
      var homes = loadHomes();
      var list = document.getElementById("homes-list");
      if (!homes.length) {
        list.innerHTML = '<div class="surface card-shadow rounded-3xl border border-transparent bg-white p-6 text-center dark:bg-slate-900"><p class="font-bold">Henüz bir evin yok</p><p class="mt-1 text-sm text-slate-500">Yeni bir ev oluştur ya da sana gönderilen davet koduyla bir eve katıl.</p></div>';
        return;
      }
      list.innerHTML = homes.map(function (home) {
        var badge = home.cloud
          ? esc(HC.roleLabel(home.myRole))
          : "Yalnızca bu cihazda";
        return '<article class="surface card-shadow overflow-hidden rounded-3xl border border-transparent bg-white dark:bg-slate-900">' +
          '<button class="flex w-full items-center justify-between p-5 text-left active:bg-slate-50 dark:active:bg-slate-800/60" onclick="openHomeDetail(\'' + esc(home.id) + '\')">' +
          '<div class="flex items-center gap-4">' +
          '<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4C7DFF] to-[#22D3EE] text-white"><i class="w-6 h-6" data-lucide="home"></i></div>' +
          '<div><h2 class="text-lg font-bold leading-tight">' + esc(home.name) + '</h2>' +
          '<p class="text-sm font-medium text-slate-400">' + home.rooms.length + ' oda · ' + home.members.length + ' üye · ' + badge +
          '<span class="unread-badge ml-1 hidden rounded-full bg-[#4C7DFF] px-2 py-0.5 text-xs font-bold text-white" data-home="' + esc(home.id) + '"></span></p></div>' +
          '</div><i class="w-5 h-5 text-slate-300" data-lucide="chevron-right"></i></button></article>';
      }).join("");
      lucide.createIcons();
      if (cloudState.ok && HC) homes.forEach(function (home) {
        if (!home.cloud) return;
        HC.unreadCount(home.id).then(function (n) {
          if (!n) return;
          Array.prototype.forEach.call(document.querySelectorAll('.unread-badge'), function (b) {
            if (b.getAttribute('data-home') === home.id) { b.textContent = n + " yeni mesaj"; b.classList.remove("hidden"); }
          });
        });
      });
    }

    function settingRow(label, value, action, enabled) {
      var trailing = value == null
        ? (enabled ? '<i class="w-5 h-5 text-slate-300" data-lucide="chevron-right"></i>' : '<i class="w-5 h-5 text-slate-300" data-lucide="lock"></i>')
        : '<span class="max-w-[11rem] truncate text-right font-medium text-slate-400">' + esc(value) + '</span><i class="w-5 h-5 shrink-0 text-slate-300" data-lucide="' + (enabled ? 'chevron-right' : 'lock') + '"></i>';
      return '<button class="flex w-full items-center justify-between px-5 py-4 ' + (enabled ? 'active:bg-slate-50 dark:active:bg-slate-800/60' : 'opacity-70') + '" onclick="' + (enabled ? action : "deniedPerm()") + '">' +
        '<span class="text-base font-bold">' + esc(label) + '</span><span class="flex items-center gap-2">' + trailing + '</span></button>';
    }
    function deniedPerm() {
      showHouseholdToast("Bunun için iznin yok. Ev sahibi izin verebilir.", "error");
    }

    // Bekleyen davetler sunucudan gelir (kod burada GÖSTERİLMEZ; yalnızca e-postayla iletilir)
    function renderInvitePanel(home) {
      return '<p class="mb-2 px-1 text-sm font-medium text-slate-500">Davet ve Katılım</p>' +
        '<section class="surface card-shadow mb-6 rounded-3xl border border-transparent bg-white p-5 dark:bg-slate-900">' +
        '<div class="mb-4 rounded-2xl border border-[#E9E4FF] bg-[#F5F3FF] px-4 py-4 dark:border-[#3b2b76] dark:bg-[#1f173f]">' +
        '<p class="text-sm font-medium text-slate-600 dark:text-slate-300">Davet kodu tek kullanımlıktır, 7 gün geçerlidir ve yalnızca davet edilen e-posta adresiyle kabul edilir. Kod burada gösterilmez; e-postayla iletilir.</p></div>' +
        '<div id="pending-invites"><p class="py-4 text-center text-sm text-slate-400">Davetler yükleniyor…</p></div></section>';
    }
    function loadPendingInvites(home) {
      var box = document.getElementById("pending-invites");
      if (!box || !home.cloud) return;
      HC.listInvites(home.id).then(function (rows) {
        if (!document.getElementById("pending-invites")) return;
        box.innerHTML = rows.length ? rows.map(function (invite) {
          var days = Math.max(1, Math.ceil((new Date(invite.expires_at).getTime() - Date.now()) / 86400000));
          var status = invite.expired
            ? '<span class="text-red-500">Süresi doldu</span>'
            : days + ' gün geçerli';
          return '<div class="mb-2 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800">' +
            '<div class="flex items-start justify-between gap-3">' +
            '<div class="min-w-0"><p class="truncate font-semibold text-slate-800 dark:text-slate-100">' + esc(invite.name || invite.email) + '</p>' +
            '<p class="truncate text-sm text-slate-400">' + esc(invite.email) + '</p>' +
            '<p class="mt-1 text-xs font-semibold text-[#4C7DFF]">' + esc(HC.roleLabel(invite.role)) + ' · ' + status + '</p></div>' +
            '<div class="flex shrink-0 flex-col gap-2">' +
            '<button class="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200" onclick="resendInvite(\'' + esc(invite.id) + '\')">Yeniden Gönder</button>' +
            '<button class="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 dark:border-red-900" onclick="cancelInvite(\'' + esc(invite.id) + '\')">İptal Et</button></div>' +
            '</div></div>';
        }).join("") : '<p class="py-4 text-center text-sm text-slate-400">Şu an bekleyen davet yok.</p>';
      }, function (e) {
        if (box) box.innerHTML = '<p class="py-4 text-center text-sm text-amber-700 dark:text-amber-300">' + esc(e.message) + '</p>';
      });
    }
    var inviteCache = {};
    function cancelInvite(id) {
      HC.cancelInvite(id).then(function () { loadPendingInvites(currentHome()); }, fail);
    }
    // Kod yalnızca oluşturulurken bilinir; yeniden gönderme yeni bir davet (yeni kod) açar, eskisi iptal olur.
    function resendInvite(id) {
      var home = currentHome();
      if (!home) return;
      HC.listInvites(home.id).then(function (rows) {
        var inv = rows.filter(function (r) { return r.id === id; })[0];
        if (!inv) return;
        sendInvite(home, inv.name, inv.email, inv.role);
      }, fail);
    }

    function renderHomeDetail() {
      var home = currentHome();
      if (!home) { closeHomeDetail(); return; }
      var divider = '<div class="mx-5 border-t border-slate-100 dark:border-slate-800"></div>';
      var canSettings = allow(home, "settings");
      var canInvite = home.cloud && allow(home, "invite");
      var chatBlock = "";
      if (home.cloud) {
        chatBlock = '<section class="surface card-shadow mb-6 overflow-hidden rounded-3xl border border-transparent bg-white dark:bg-slate-900">' +
          '<button class="flex w-full items-center justify-between px-5 py-4 active:bg-slate-50 dark:active:bg-slate-800/60" onclick="location.href=\'nexus-family-chat.html?home=' + esc(home.id) + '\'">' +
          '<span class="flex items-center gap-3 text-base font-bold"><i class="w-5 h-5 text-[#4C7DFF]" data-lucide="message-circle"></i>Aile Sohbeti</span><i class="w-5 h-5 text-slate-300" data-lucide="chevron-right"></i></button>' +
          '<div class="mx-5 border-t border-slate-100 dark:border-slate-800"></div>' +
          '<button class="flex w-full items-center justify-between px-5 py-4 active:bg-slate-50 dark:active:bg-slate-800/60" onclick="location.href=\'nexus-board.html\'">' +
          '<span class="flex items-center gap-3 text-base font-bold"><i class="w-5 h-5 text-[#4C7DFF]" data-lucide="clipboard-list"></i>Ev Panosu</span><i class="w-5 h-5 text-slate-300" data-lucide="chevron-right"></i></button></section>';
      } else {
        chatBlock = '<section class="surface mb-6 rounded-3xl border border-transparent bg-white p-5 text-sm text-slate-500 dark:bg-slate-900"><p class="font-bold text-slate-700 dark:text-slate-200">Bu ev yalnızca bu cihazda.</p>' +
          '<p class="mt-1">' + (cloudState.ok ? 'Ev hesabına bağlanıyor — bir kez bağlanan evde aile sohbeti, davet ve izinler doğrudan açık olur.' : 'Üye davet etmek ve aile sohbeti için önce oturum aç; ev hesabına otomatik bağlanır.') + '</p></section>';
      }
      var settings = '<section class="surface card-shadow mb-6 overflow-hidden rounded-3xl border border-transparent bg-white dark:bg-slate-900">' +
        settingRow("Ev İsmi", home.name, "openEditName()", canSettings) + divider +
        settingRow("Oda yönetimi", home.rooms.length + " Oda", "openRooms()", canSettings) + divider +
        settingRow("Ev Konumu", looksLikeCoords(home.location) ? "Seçilen Konum" : (home.location || "Otomatik algılanmadı"), "openEditLocation()", canSettings) +
        (home.cloud && isOwner(home) ? divider + settingRow("İzinleri Yönet", null, "openPermissions()", true) : "") +
        (home.cloud && isOwner(home) ? divider + settingRow("Kritik uyarıları üyelere bildir", home.shareAlerts ? "Açık" : "Kapalı", "toggleShareAlerts()", true) : "") + '</section>';
      var membersRows = home.members.map(function (member, index) {
        var ref = home.cloud ? "'" + esc(member.userId) + "'" : index;
        var me = home.cloud && member.userId === home.myUserId;
        return '<button class="flex w-full items-center gap-3 px-5 py-4 text-left active:bg-slate-50 dark:active:bg-slate-800/60" onclick="openMember(' + ref + ')">' +
          memberAvatar(member) +
          '<div class="min-w-0 flex-1"><p class="truncate font-bold leading-tight">' + esc(member.name) + (me ? ' <span class="text-xs font-semibold text-slate-400">(sen)</span>' : '') + '</p><p class="truncate text-sm text-slate-400">' + esc(member.email || "E-posta eklenmedi") + '</p>' + (home.cloud ? memberPresenceLabel(member) : "") + '</div>' +
          '<span class="shrink-0 text-sm font-medium text-slate-400">' + esc(member.role) + '</span><i class="w-5 h-5 shrink-0 text-slate-300" data-lucide="chevron-right"></i></button>';
      }).join(divider);
      var inviteBtn = home.cloud
        ? (canInvite
            ? '<button class="flex w-full items-center gap-2 px-5 py-4 font-semibold text-[#4C7DFF] active:bg-slate-50 dark:active:bg-slate-800/60" onclick="openAddMember()"><i class="w-5 h-5" data-lucide="mail-plus"></i>Üye davet et</button>'
            : '<p class="px-5 py-4 text-sm text-slate-400">Üye davet etme iznin yok.</p>')
        : '<button class="flex w-full items-center gap-2 px-5 py-4 font-semibold text-[#4C7DFF] active:bg-slate-50 dark:active:bg-slate-800/60" onclick="openAddMember()"><i class="w-5 h-5" data-lucide="mail-plus"></i>Üye davet et</button>';
      var members = '<p class="mb-2 px-1 text-sm font-medium text-slate-500">Ev Üyeleri</p>' +
        '<section class="surface card-shadow mb-6 overflow-hidden rounded-3xl border border-transparent bg-white dark:bg-slate-900">' +
        membersRows + divider + inviteBtn + '</section>';
      var destroy = "";
      if (!home.cloud) destroy = '<button class="surface card-shadow w-full rounded-3xl border border-transparent bg-white py-4 font-bold text-red-500 active:scale-[0.98] transition-transform dark:bg-slate-900" onclick="openDeleteConfirm()">Evi Sil</button>';
      else if (home.myRole === "owner") destroy = (home.members.filter(function (m) { return m.roleKey === "owner"; }).length > 1
        ? '<button class="surface card-shadow mb-3 w-full rounded-3xl border border-transparent bg-white py-4 font-bold text-red-500 dark:bg-slate-900" onclick="leaveHome()">Evden Ayrıl</button>' : '') + '<button class="surface card-shadow w-full rounded-3xl border border-transparent bg-white py-4 font-bold text-red-500 active:scale-[0.98] transition-transform dark:bg-slate-900" onclick="openDeleteConfirm()">Evi Sil</button>';
      else destroy = '<button class="surface card-shadow w-full rounded-3xl border border-transparent bg-white py-4 font-bold text-red-500 active:scale-[0.98] transition-transform dark:bg-slate-900" onclick="leaveHome()">Evden Ayrıl</button>';
      document.getElementById("home-detail-body").innerHTML = chatBlock + settings + (canInvite ? renderInvitePanel(home) : "") + members +
        (home.cloud ? '<p class="mb-2 px-1 text-sm font-medium text-slate-500">Son Etkinlikler</p><section id="activity-panel" class="surface card-shadow mb-6 rounded-3xl border border-transparent bg-white p-5 dark:bg-slate-900"><p class="py-2 text-center text-sm text-slate-400">Yükleniyor…</p></section>' : "") + destroy;
      if (canInvite) loadPendingInvites(home);
      if (home.cloud) loadActivity(home);
      maybeResolveStoredLocation(home);
      lucide.createIcons();
    }
    function openHomeDetail(id) {
      detailId = id;
      renderHomeDetail();
      document.getElementById("home-detail").classList.remove("hidden");
      document.getElementById("home-detail").classList.add("flex");
    }
    function closeHomeDetail() {
      document.getElementById("home-detail").classList.add("hidden");
      document.getElementById("home-detail").classList.remove("flex");
      detailId = "";
    }

    // Ortak etkinlik akışı: yalnız sunucuya yazılmış gerçek olaylar; boşsa boş durum gösterilir.
    var ACT_LABEL = { member_joined: "eve katıldı", member_left: "evden ayrıldı", member_removed: "evden çıkarıldı", scene_run: "senaryo çalıştırdı", alert: "uyarı paylaştı" };
    function loadActivity(home) {
      HC.listActivity(home.id, 15).then(function (rows) {
        var box = document.getElementById("activity-panel");
        if (!box) return;
        box.innerHTML = rows.length ? rows.map(function (a) {
          var what = a.kind === "scene_run" || a.kind === "alert" ? ACT_LABEL[a.kind] + ": " + a.title : (ACT_LABEL[a.kind] || a.title);
          return '<div class="flex items-start justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-800"><p class="min-w-0 text-sm"><b>' + esc(a.actor_name || "Bir üye") + '</b> ' + esc(what) + (a.detail ? '<span class="block truncate text-xs text-slate-400">' + esc(a.detail) + '</span>' : '') + '</p>' +
            '<span class="shrink-0 text-xs text-slate-400">' + esc(new Date(a.created_at).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })) + '</span></div>';
        }).join("") : '<p class="py-2 text-center text-sm text-slate-400">Henüz etkinlik yok.</p>';
      }, function (e) {
        var box = document.getElementById("activity-panel");
        if (box) box.innerHTML = '<p class="py-2 text-center text-sm text-amber-700 dark:text-amber-300">' + esc(e.message) + '</p>';
      });
    }
    function toggleShareAlerts() {
      var home = currentHome();
      if (!home || !home.cloud || !isOwner(home)) return;
      var next = !home.shareAlerts;
      var go = function () { HC.setShareAlerts(home.id, next).then(function () { afterChange(); showHouseholdToast(next ? "Kritik uyarılar üyelere bildirilecek." : "Uyarı paylaşımı kapatıldı."); }, fail); };
      if (!next) { go(); return; }
      window.nexusDialog({
        icon: "warning", title: "Kritik uyarıları paylaş",
        message: "Bu cihazdaki güvenlik/acil olayların başlığı ve kısa metni evdeki diğer üyelerin uygulamasında görünür. Cihaz bilgileri ve anahtarlar paylaşılmaz; her üye kendi bildirim ayarlarına tabidir.",
        primary: { label: "Aç", onClick: go }, secondary: { label: "Vazgeç" }
      });
    }
    function transferOwnership() {
      var home = currentHome();
      if (!home || !home.cloud || memberRef === null) return;
      var member = findMember(home, memberRef);
      if (!member) return;
      window.nexusDialog({
        icon: "warning", title: "Sahipliği Devret",
        message: member.name + " evin sahibi olur; sen üye olursun ve evi silme, izin verme yetkini kaybedersin. Emin misin?",
        primary: { label: "Devret", onClick: function () {
          HC.transferOwnership(home.id, member.userId).then(function () { closeMemberSheet(); afterChange(); showHouseholdToast("Sahiplik devredildi."); }, fail);
        } },
        secondary: { label: "Vazgeç" }
      });
    }

    function migrateHome() {
      // Manuel taşıma kalktı (oturum açıksa arka planda bağlanır); bırakılan
      // eski çağrılar sessizce aynı otomatik akışa yönlenir.
      autoConnectLocalHomes().then(function () { afterChange(); });
    }
    function leaveHome() {
      var home = currentHome();
      if (!home || !home.cloud) return;
      window.nexusDialog({
        icon: "warning", title: "Evden Ayrıl", message: '"' + home.name + '" evinden ayrılırsan üye listesinden çıkarılırsın ve sohbeti göremezsin.',
        primary: { label: "Ayrıl", onClick: function () {
          HC.removeMember(home.id, home.myUserId).then(function () { closeHomeDetail(); reloadCloud(); }, fail);
        } },
        secondary: { label: "Vazgeç" }
      });
    }

    function openInputSheet(mode) {
      // Yeni ev: oturumluysa bulutta, değilse yalnızca bu cihazda oluşur. Katılım her zaman sunucu ister.
      if (mode === "join" && !cloudState.ok) {
        showHouseholdToast(cloudState.reason === "cloud-off" ? "Bulut kapalı: bir eve katılmak için bulut gerekir." : "Bir eve katılmak için önce oturum aç.", "error");
        return;
      }
      sheetMode = mode;
      var cur = currentHome();
      var cfg = {
        create: { title: "Yeni Ev Oluştur", desc: cloudState.ok ? "Evine bir isim ver. Ev hesabına bağlı oluşur; üyeler her cihazda aynı listeyi görür." : "Evine bir isim ver. Oturum açık olmadığı için yalnızca bu cihazda tutulur.", placeholder: "Örn. Yazlık", value: "" },
        join: { title: "Bir Eve Katıl", desc: "Davet e-postasındaki kodu gir. Kod tek kullanımlıktır ve yalnızca davet edilen e-posta adresiyle çalışır.", placeholder: "Örn. NX-1A2B-3C4D-5E6F", value: "" },
        name: { title: "Ev İsmi", desc: "Evinin adını düzenle.", placeholder: "Örn. Evim", value: cur ? cur.name : "" },
        location: { title: "Ev Konumu", desc: "Sistem konumunu algılat veya elle düzenle.", placeholder: "Örn. Kadıköy", value: (cur && !looksLikeCoords(cur.location)) ? cur.location : "" }
      }[mode];
      document.getElementById("sheet-title").textContent = cfg.title;
      document.getElementById("sheet-desc").textContent = cfg.desc;
      var input = document.getElementById("sheet-input");
      input.placeholder = cfg.placeholder;
      input.value = cfg.value || "";
      input.maxLength = mode === "join" ? 24 : 60;
      document.getElementById("sheet-auto-location").classList.toggle("hidden", mode !== "location");
      document.getElementById("input-sheet").classList.remove("hidden");
      document.getElementById("input-sheet").classList.add("flex");
      setTimeout(function () { input.focus(); }, 50);
    }
    function closeInputSheet() {
      document.getElementById("input-sheet").classList.add("hidden");
      document.getElementById("input-sheet").classList.remove("flex");
    }
    function looksLikeCoords(value) {
      return /^-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+/.test(String(value || ""));
    }
    function placeFromCoords(lat, lon) {
      var url = "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" + encodeURIComponent(lat) + "&longitude=" + encodeURIComponent(lon) + "&localityLanguage=tr";
      return fetch(url, { headers: { Accept: "application/json" } }).then(function (r) {
        if (!r.ok) throw new Error("geo");
        return r.json();
      }).then(function (data) {
        var local = String((data && (data.locality || data.city)) || "").trim();
        var region = String((data && data.principalSubdivision) || "").trim();
        if (local && region && local.toLowerCase() !== region.toLowerCase()) return local + ", " + region;
        return local || region || "";
      });
    }
    var geoTried = {};
    // Yalnızca yerel evlerin koordinat konumu yerinde çözülür (bulut evinde yazma izni gerekir).
    function maybeResolveStoredLocation(home) {
      if (!home || !home.id || home.cloud || geoTried[home.id] || !looksLikeCoords(home.location)) return;
      var match = String(home.location).match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
      if (!match) return;
      geoTried[home.id] = true;
      placeFromCoords(match[1], match[2]).then(function (place) {
        if (!place) return;
        mutateLocal(home.id, function (h) { if (looksLikeCoords(h.location)) h.location = place; });
        if (!document.getElementById("home-detail").classList.contains("hidden")) renderHomeDetail();
      }).catch(function () { geoTried[home.id] = false; });
    }
    function detectHomeLocation() {
      if (!navigator.geolocation) {
        showHouseholdToast("Bu cihazda otomatik konum desteği yok.", "error");
        return;
      }
      var button = document.getElementById("sheet-auto-location");
      button.textContent = "Konum alınıyor...";
      navigator.geolocation.getCurrentPosition(function (position) {
        placeFromCoords(position.coords.latitude, position.coords.longitude).then(function (place) {
          button.textContent = "Konumu Otomatik Algıla";
          if (!place) {
            showHouseholdToast("Yer adı alınamadı. Konumu elle yazabilirsin.", "error");
            return;
          }
          document.getElementById("sheet-input").value = place;
        }).catch(function () {
          button.textContent = "Konumu Otomatik Algıla";
          showHouseholdToast("Yer adı alınamadı. Konumu elle yazabilirsin.", "error");
        });
      }, function () {
        button.textContent = "Konumu Otomatik Algıla";
        showHouseholdToast("Konum izni verilmedi.", "error");
      }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
    }
    function afterChange() {
      renderHomes();
      if (detailId) renderHomeDetail();
    }
    function confirmInputSheet() {
      var value = document.getElementById("sheet-input").value.trim();
      if (!value) return;
      var home = currentHome();
      if (sheetMode === "create") {
        if (cloudState.ok) {
          HC.createHome(value, nexusGetItem("nexusHomeLocation") || "").then(function () { closeInputSheet(); afterChange(); }, fail);
          return;
        }
        var homes = loadHomes();
        homes.push(defaultHome(value));
        saveHomes(homes);
      } else if (sheetMode === "join") {
        var code = value.toUpperCase();
        HC.accept({ code: code }).then(function (id) {
          closeInputSheet();
          showHouseholdToast("Eve katıldın.");
          afterChange();
          reloadCloud();
        }, fail);
        return;
      } else if ((sheetMode === "name" || sheetMode === "location") && home) {
        if (home.cloud) {
          if (!allow(home, "settings")) { deniedPerm(); return; }
          var patch = sheetMode === "name" ? { name: value } : { location: value };
          HC.updateHome(home.id, patch).then(function () {
            if (sheetMode === "location") nexusSetItem("nexusHomeLocation", value);
            closeInputSheet(); afterChange();
          }, fail);
          return;
        }
        mutateLocal(home.id, function (h) {
          if (sheetMode === "name") h.name = value;
          else { h.location = value; nexusSetItem("nexusHomeLocation", value); }
        });
      }
      closeInputSheet();
      afterChange();
    }
    function openEditName() { openInputSheet("name"); }
    function openEditLocation() { openInputSheet("location"); }

    // ---- üye daveti / düzenleme ------------------------------------------------------
    function setMemberSheet(editing, cloudEdit) {
      document.getElementById("member-sheet-title").textContent = editing ? "Üyeyi Düzenle" : "Üye Davet Et";
      document.getElementById("member-sheet-desc").textContent = editing
        ? (cloudEdit ? "Rol ve izinleri yalnızca ev sahibi değiştirebilir." : "Üye bilgilerini düzenle.")
        : "Davet edilecek kişinin e-postasına tek kullanımlık bir kod gönderilir.";
      document.getElementById("member-confirm-btn").textContent = editing ? "Kaydet" : "Daveti Gönder";
      document.getElementById("member-name").disabled = !!cloudEdit;
      document.getElementById("member-email").disabled = !!cloudEdit;
    }
    function showMemberSheet() {
      document.getElementById("member-sheet").classList.remove("hidden");
      document.getElementById("member-sheet").classList.add("flex");
    }
    function openAddMember() {
      var home = currentHome();
      if (!home) return;
      if (!home.cloud) {
        // Yerel eve davet üretilemez (kod başka cihazda çalışmaz). Oturum açıksa ev
        // arka planda hesaba bağlanır ve davet kapısı doğrudan açılır; kapalıysa dürüst uyarı.
        if (!cloudState.ok) {
          window.nexusDialog({
            icon: "info", title: "Oturum gerekli",
            message: "Üye davet etmek için önce oturum aç; evin hesabına otomatik bağlanır.",
            primary: { label: "Oturum Aç", onClick: function () { location.href = "nexus-login.html"; } },
            secondary: { label: "Tamam" }
          });
          return;
        }
        reloadCloud().then(function () {
          var refreshed = currentHome();
          if (refreshed && refreshed.cloud) openAddMember();
          else showHouseholdToast("Ev hesabına bağlanamadı; bağlantıyı kontrol edip yeniden dene.", "error");
        });
        return;
      }
      if (!allow(home, "invite")) { deniedPerm(); return; }
      memberRef = null;
      setMemberSheet(false, false);
      document.getElementById("member-name").value = "";
      document.getElementById("member-email").value = "";
      document.getElementById("member-role").value = "Üye";
      document.getElementById("member-role").disabled = false;
      document.getElementById("member-remove-btn").classList.add("hidden");
      document.getElementById("member-transfer-btn").classList.add("hidden");
      showMemberSheet();
      setTimeout(function () { document.getElementById("member-name").focus(); }, 50);
    }
    function findMember(home, ref) {
      return home.cloud
        ? home.members.filter(function (m) { return m.userId === ref; })[0]
        : home.members[ref];
    }
    function openMember(ref) {
      var home = currentHome();
      if (!home) return;
      var member = findMember(home, ref);
      if (!member) return;
      memberRef = ref;
      setMemberSheet(true, home.cloud);
      document.getElementById("member-name").value = member.name || "";
      document.getElementById("member-email").value = member.email || "";
      document.getElementById("member-role").value = member.role || "Üye";
      var owners = home.members.filter(function (item) { return item.role === "Ev Sahibi"; }).length;
      var removable;
      if (home.cloud) {
        // Sahip başkasını çıkarır; kendini "Evden Ayrıl" ile çıkarır. Tek sahip çıkarılamaz.
        removable = isOwner(home) && member.userId !== home.myUserId && !(member.role === "Ev Sahibi" && owners <= 1);
        document.getElementById("member-role").disabled = !isOwner(home);
      } else {
        removable = !(member.role === "Ev Sahibi" && owners <= 1);
        document.getElementById("member-role").disabled = false;
      }
      document.getElementById("member-remove-btn").classList.toggle("hidden", !removable);
      document.getElementById("member-transfer-btn").classList.toggle("hidden", !(home.cloud && isOwner(home) && member.userId !== home.myUserId));
      showMemberSheet();
    }
    function closeMemberSheet() {
      document.getElementById("member-sheet").classList.add("hidden");
      document.getElementById("member-sheet").classList.remove("flex");
    }
    function sendInvite(home, name, email, roleLabel) {
      var roleKey = typeof roleLabel === "string" && ROLE_FROM[roleLabel] ? ROLE_FROM[roleLabel] : (roleLabel || "member");
      showHouseholdToast("Davet hazırlanıyor…");
      HC.invite(home.id, email, name, roleKey).then(function (res) {
        if (res.mail === "sent") showHouseholdToast("Davet e-postası gönderildi: " + email);
        else if (res.mail === "existing-account") showHouseholdToast("Bu e-postanın hesabı var; uygulamayı açınca Aile ekranında davet kartı görecek.");
        else mailFallback(home, name, email, res.code);
        if (document.getElementById("pending-invites")) loadPendingInvites(currentHome());
      }, fail);
    }
    var ROLE_FROM = { "Ev Sahibi": "owner", "Üye": "member", "Misafir": "guest" };
    // E-posta sunucudan gitmediyse (dağıtım yok / ağ hatası) kullanıcının kendi posta uygulamasıyla
    // gönderme önerilir — ancak ASLA sessizce: onay penceresi sorar.
    function mailFallback(home, name, email, code) {
      window.nexusDialog({
        icon: "warning", title: "E-posta sunucudan gönderilemedi",
        message: "Davet oluşturuldu ama otomatik e-posta gönderilemedi. Kendi posta uygulamanla davet metnini hazırlayalım mı?",
        primary: { label: "Posta Uygulamasını Aç", onClick: function () {
          var subject = encodeURIComponent(home.name + " için NEXUS daveti");
          var body = encodeURIComponent("Merhaba " + (name || "") + ",\n\n" + home.name + " evine katılman için davet kodun: " + code + "\nNEXUS içinde \"Bir Eve Katıl\" alanına bu kodu gir (7 gün geçerli, yalnızca bu e-postayla çalışır).\n");
          // Adres formdan geliyor: yalnızca geçerli bir e-posta biçimi ve kodlanmış hâliyle mailto'ya girer
          if (!/^[^\s@<>"'`]+@[^\s@<>"'`]+\.[^\s@<>"'`]+$/.test(email)) return;
          window.location.href = "mailto:" + encodeURIComponent(email) + "?subject=" + subject + "&body=" + body;
        } },
        secondary: { label: "Vazgeç" }
      });
    }
    function confirmMember() {
      var home = currentHome();
      if (!home) return;
      var name = document.getElementById("member-name").value.trim();
      var email = document.getElementById("member-email").value.trim();
      var role = document.getElementById("member-role").value;
      if (memberRef === null) {
        if (!name || !email) { showHouseholdToast("Ad ve e-posta gerekli.", "error"); return; }
        closeMemberSheet();
        sendInvite(home, name, email, role);
        return;
      }
      if (home.cloud) {
        var member = findMember(home, memberRef);
        if (!member) return;
        if (!isOwner(home) || member.role === role) { closeMemberSheet(); return; }
        var key = ROLE_FROM[role];
        HC.setMemberAccess(home.id, member.userId, key, { control: key !== "guest", invite: false, settings: false })
          .then(function () { closeMemberSheet(); afterChange(); }, fail);
        return;
      }
      if (!name) return;
      mutateLocal(home.id, function (h) {
        var m = h.members[memberRef];
        if (!m) return;
        m.name = name; m.email = email;
        if (m.role !== role) { m.role = role; m.perms = defaultPerms(role); }
      });
      closeMemberSheet();
      afterChange();
    }
    function removeMember() {
      var home = currentHome();
      if (!home || memberRef === null) return;
      if (home.cloud) {
        var member = findMember(home, memberRef);
        if (!member) return;
        HC.removeMember(home.id, member.userId).then(function () { closeMemberSheet(); afterChange(); }, fail);
        return;
      }
      mutateLocal(home.id, function (h) { h.members.splice(memberRef, 1); });
      closeMemberSheet();
      afterChange();
    }

    // ---- odalar -------------------------------------------------------------------------
    function openRooms() {
      renderRoomsModal();
      document.getElementById("room-input").value = "";
      document.getElementById("rooms-modal").classList.remove("hidden");
      document.getElementById("rooms-modal").classList.add("flex");
    }
    function closeRooms() {
      document.getElementById("rooms-modal").classList.add("hidden");
      document.getElementById("rooms-modal").classList.remove("flex");
    }
    function renderRoomsModal() {
      var home = currentHome();
      if (!home) return;
      document.getElementById("rooms-list").innerHTML = home.rooms.length
        ? home.rooms.map(function (room, index) {
            return '<div class="flex items-center justify-between border-b border-slate-100 py-3 last:border-0 dark:border-slate-800">' +
              '<div class="flex min-w-0 items-center gap-3"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800"><i class="w-5 h-5" data-lucide="door-open"></i></div>' +
              '<span class="truncate font-semibold">' + esc(room) + '</span></div>' +
              '<button class="p-2 text-red-400 active:text-red-600" aria-label="Odayı kaldır" onclick="removeRoom(' + index + ')"><i class="w-5 h-5" data-lucide="trash-2"></i></button></div>';
          }).join("")
        : '<p class="py-6 text-center font-medium text-slate-400">Henüz oda eklenmedi</p>';
      lucide.createIcons();
    }
    function saveRooms(home, rooms) {
      if (home.cloud) {
        if (!allow(home, "settings")) { deniedPerm(); return; }
        HC.updateHome(home.id, { rooms: rooms }).then(function () { renderRoomsModal(); afterChange(); }, fail);
        return;
      }
      mutateLocal(home.id, function (h) { h.rooms = rooms; });
      renderRoomsModal();
      afterChange();
    }
    function addRoom() {
      var value = document.getElementById("room-input").value.trim();
      var home = currentHome();
      if (!value || !home) return;
      document.getElementById("room-input").value = "";
      saveRooms(home, home.rooms.concat([value]));
    }
    function removeRoom(index) {
      var home = currentHome();
      if (!home || !home.rooms[index]) return;
      saveRooms(home, home.rooms.filter(function (_, i) { return i !== index; }));
    }

    // ---- izinler (yalnız bulut evlerinde ve yalnız ev sahibi; sunucu ayrıca doğrular) ---------
    var PERM_DEFS = [
      { key: "control", label: "Cihazları kontrol et" },
      { key: "invite", label: "Üye davet et" },
      { key: "settings", label: "Ev ayarlarını değiştir" }
    ];
    function permSwitch(ref, key, enabled, disabled) {
      var trackBg = enabled ? 'bg-[#4C7DFF]' : 'bg-slate-300 dark:bg-slate-600';
      var cursorCls = disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer active:scale-95';
      var transformStyle = enabled ? 'transform:translateX(20px);' : 'transform:translateX(0);';
      var hint = disabled ? 'Ev sahibi yetkileri kapatılamaz' : (enabled ? 'Yetkiyi kapat' : 'Yetkiyi aç');
      return '<button type="button" role="switch" aria-checked="' + (enabled ? 'true' : 'false') + '" title="' + hint + '"' +
        ' class="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ' + trackBg + ' ' + cursorCls + '"' +
        (disabled ? ' disabled' : ' onclick="togglePerm(\'' + esc(ref) + '\',\'' + key + '\')"') + '>' +
        '<span class="pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 absolute top-1 left-1" style="' + transformStyle + '"></span></button>';
    }
    function openPermissions() {
      var home = currentHome();
      if (!home || !home.cloud || !isOwner(home)) { deniedPerm(); return; }
      renderPerms();
      document.getElementById("perm-modal").classList.remove("hidden");
      document.getElementById("perm-modal").classList.add("flex");
    }
    function closePerms() {
      document.getElementById("perm-modal").classList.add("hidden");
      document.getElementById("perm-modal").classList.remove("flex");
    }
    function renderPerms() {
      var home = currentHome();
      if (!home) return;
      document.getElementById("perm-list").innerHTML = home.members.map(function (member) {
        var locked = member.role === "Ev Sahibi";
        var toggles = PERM_DEFS.map(function (perm) {
          var enabled = locked ? true : !!(member.perms && member.perms[perm.key]);
          return '<div class="flex items-center justify-between gap-3 py-2.5"><span class="min-w-0 flex-1 text-sm font-medium text-slate-600 dark:text-slate-300">' + esc(perm.label) + '</span>' + permSwitch(member.userId, perm.key, enabled, locked) + '</div>';
        }).join("");
        // Oda erişimi: null = tüm odalar; dizi = yalnız seçili odalar (cihaz listeleri filtrelenir).
        var roomChips = "";
        if (!locked && Array.isArray(home.rooms) && home.rooms.length) {
          var restricted = member.perms && Array.isArray(member.perms.rooms) ? member.perms.rooms : null;
          roomChips = '<div class="mt-1 border-t border-slate-200 dark:border-slate-700" style="padding-top:0.625rem">' +
            '<p class="mb-2 text-xs font-bold text-slate-400">Oda Erişimi</p><div class="flex flex-wrap gap-1.5">' +
            '<button type="button" onclick="setMemberRoomsAll(\'' + esc(member.userId) + '\')" class="rounded-full px-3 py-1 text-xs font-bold transition-colors ' +
              (restricted === null ? "bg-[#4C7DFF] text-white" : "bg-white text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700") + '">Tüm odalar</button>' +
            home.rooms.map(function (room, roomIndex) {
              var on = restricted !== null && restricted.indexOf(room) !== -1;
              return '<button type="button" onclick="toggleMemberRoom(\'' + esc(member.userId) + '\',' + roomIndex + ')" class="rounded-full px-3 py-1 text-xs font-bold transition-colors ' +
                (on ? "bg-[#4C7DFF] text-white" : "bg-white text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700") + '">' + esc(room) + '</button>';
            }).join("") + "</div>" +
            '<p class="mt-1.5 text-[11px] text-slate-400">' + (restricted === null ? "Tüm odalardaki cihazları görür." : "Yalnızca seçili odalardaki cihazları görür.") + '</p></div>';
        }
        return '<div class="mb-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><div class="mb-2 flex items-center gap-3">' +
          memberAvatar(member) + '<div class="min-w-0"><p class="truncate font-bold leading-tight">' + esc(member.name) + '</p><p class="text-xs text-slate-400">' + esc(member.role) + (locked ? ' · tüm yetkiler' : "") + '</p></div></div>' + toggles + roomChips + "</div>";
      }).join("");
      lucide.createIcons();
    }
    function togglePerm(userId, key) {
      var home = currentHome();
      if (!home || !home.cloud) return;
      var member = findMember(home, userId);
      if (!member || member.role === "Ev Sahibi") return;
      var perms = Object.assign({}, member.perms);
      perms[key] = !perms[key];
      HC.setMemberAccess(home.id, userId, member.roleKey, perms).then(renderPerms, fail);
    }
    function toggleMemberRoom(userId, roomIndex) {
      var home = currentHome();
      if (!home || !home.cloud) return;
      var member = findMember(home, userId);
      if (!member || member.role === "Ev Sahibi") return;
      var room = home.rooms[roomIndex];
      if (!room) return;
      var cur = member.perms && Array.isArray(member.perms.rooms) ? member.perms.rooms.slice() : home.rooms.slice();
      var idx = cur.indexOf(room);
      if (idx === -1) cur.push(room); else cur.splice(idx, 1);
      // Boş seçim "tüm odalar"a döner; sunucu alt küme dışını reddeder (dürüst hata akışı fail()).
      HC.setMemberRooms(home.id, userId, cur.length ? cur : null).then(renderPerms, fail);
    }
    function setMemberRoomsAll(userId) {
      var home = currentHome();
      if (!home || !home.cloud) return;
      HC.setMemberRooms(home.id, userId, null).then(renderPerms, fail);
    }

    // ---- ev silme -----------------------------------------------------------------------
    function openDeleteConfirm() {
      var home = currentHome();
      var homes = loadHomes();
      var local = home && !home.cloud;
      document.getElementById("confirm-desc").textContent = local && homes.length <= 1
        ? 'Bu tek evin. Silersen boş bir "Evim" yeniden oluşturulur. Devam edilsin mi?'
        : '"' + (home ? home.name : "Bu ev") + '" ' + (local ? 've tüm ayarları kalıcı olarak silinecek.' : 'tüm üyeler için silinir; üyeler, davetler ve aile sohbeti mesajları sunucudan kalıcı olarak kaldırılır.') + ' Emin misin?';
      document.getElementById("confirm-modal").classList.remove("hidden");
      document.getElementById("confirm-modal").classList.add("flex");
    }
    function closeConfirm() {
      document.getElementById("confirm-modal").classList.add("hidden");
      document.getElementById("confirm-modal").classList.remove("flex");
    }
    function confirmDeleteHome() {
      var home = currentHome();
      if (!home) { closeConfirm(); return; }
      if (home.cloud) {
        HC.deleteHome(home.id).then(function () { closeConfirm(); closeHomeDetail(); reloadCloud(); }, function (e) { closeConfirm(); fail(e); });
        return;
      }
      var homes = loadHomes().filter(function (h) { return h.id !== home.id; });
      saveHomes(homes);
      closeConfirm();
      closeHomeDetail();
      renderHomes();
    }

    // ---- başlangıç ---------------------------------------------------------------------
    renderBanner();
    renderHomes();
    window.addEventListener("nexusHouseholdChanged", function () {
      // Sunucudan gelen değişiklik (üye eklendi, izin değişti…) ekranı yerinde yeniler.
      renderHomes();
      if (detailId) { if (currentHome()) renderHomeDetail(); else closeHomeDetail(); }
    });
    window.addEventListener("nexusHouseholdActivity", function () {
      var home = currentHome();
      if (home && home.cloud) loadActivity(home);
    });
    window.addEventListener("online", reloadCloud);
    if (HC) reloadCloud();
  
