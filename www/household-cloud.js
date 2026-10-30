// NEXUS — çok kullanıcılı Aile (ev, üyeler, davet, izin) ve Aile sohbeti istemcisi.
//
// Sunucu gerçeği Supabase'dedir (supabase/migrations/20261029_households.sql): evler,
// üyeler, davetler ve mesajlar RLS ile korunur; rol/izin/davet kabulü RPC'lerle sunucuda
// doğrulanır. Bu dosya yalnızca onlarla konuşur — cloud-sync.js'in oturumlu `rest`
// yardımcısı üzerinden, ek SDK yok.
//
// DÜRÜSTLÜK İLKELERİ (CLAUDE.md §1):
//   • Hiçbir ev, üye ya da mesaj uydurulmaz. Bulut kapalı / oturum yok / çevrimdışıyken
//     bu modül açıkça "kullanılamıyor" der; çağıran ekran bunu olduğu gibi gösterir.
//   • Mesajlar sunucuda düz metin saklanır; UÇTAN UCA ŞİFRELİ DEĞİLDİR (ekran bunu söyler).
//   • Cihaz kimlik bilgileri (yerel anahtar, parola) bu modülden ASLA geçmez: LAN cihazları
//     her üyenin kendi cihazında eşleşir; yalnızca ev adı, odalar, üyeler ve izinler paylaşılır.
//   • Gelen mesajın GÖVDESİ nexusEvents'e / dış bildirim kanallarına (ntfy, webhook,
//     Telegram) yazılmaz; yalnızca "X yeni mesaj gönderdi" bilgisi gider. Aile yazışması
//     üçüncü taraf bir sunucuya sızmasın.
(function () {
  "use strict";

  if (window.nexusHouseholdCloud) return;

  var HOUSE_KEY = "nexusHousehold";
  var SEEN_KEY = "nexusHouseholdChatSeen";
  var EVENTS_KEY = "nexusEvents";
  var MAX_BODY = 1000;
  var ROLE_TR = { owner: "Ev Sahibi", member: "Üye", guest: "Misafir" };
  var ROLE_KEY = { "Ev Sahibi": "owner", "Üye": "member", "Misafir": "guest" };

  var ERRORS = {
    forbidden: "Bu işlem için iznin yok.",
    rate_limited: "Çok hızlı mesaj gönderiyorsun; birkaç saniye bekle.",
    empty_message: "Boş mesaj gönderilemez.",
    invite_invalid: "Bu davet kodu geçersiz, süresi dolmuş ya da iptal edilmiş.",
    email_mismatch: "Bu davet başka bir e-posta adresine gönderilmiş. O adresle oturum açmalısın.",
    email_unverified: "E-posta adresin doğrulanmamış; önce doğrula.",
    too_many_attempts: "Çok fazla hatalı deneme. 15 dakika sonra tekrar dene.",
    last_owner: "Evin tek sahibi çıkarılamaz ya da düşürülemez. Önce başka bir sahip ata ya da evi sil.",
    already_member: "Bu kişi zaten evin üyesi.",
    bad_email: "Geçerli bir e-posta adresi gir.",
    too_many_invites: "Bekleyen davet sayısı sınırda (20). Birkaçını iptal et.",
    name_required: "Ev adı boş olamaz.",
    too_many_homes: "En fazla 10 eve sahip olabilirsin.",
    not_found: "Kayıt bulunamadı (başka biri silmiş olabilir).",
    bad_role: "Geçersiz rol.",
    alerts_not_shared: "Bu evde uyarı paylaşımı kapalı.",
    bad_target: "Sahipliği kendine devredemezsin.",
    bad_kind: "Geçersiz etkinlik türü.",
    not_authenticated: "Önce oturum aç.",
    "oturum yok": "Önce oturum aç.",
    "bulut yapılandırması yok": "Bulut bağlantısı kapalı.",
  };

  function cloud() {
    return window.nexusCloud || null;
  }

  function get(key, fallback) {
    try {
      var raw = window.nexusGetItem ? window.nexusGetItem(key) : localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function put(key, value) {
    try {
      var s = JSON.stringify(value);
      if (window.nexusSetItem) window.nexusSetItem(key, s);
      else localStorage.setItem(key, s);
    } catch (e) { /* kota dolu / özel mod */ }
  }

  // Sunucu iletisi → Türkçe açıklama. Ağ hatası ile sunucu reddi ayrılır.
  function describe(error) {
    var msg = String((error && error.message) || error || "");
    if (ERRORS[msg]) return ERRORS[msg];
    if (error && (error.status === 401 || error.status === 403)) return "Oturumun süresi dolmuş olabilir; yeniden oturum aç.";
    if (error && error.status === 404) return "Aile sunucu tarafı henüz kurulmamış (migrasyon uygulanmamış).";
    if (error && error.status) return "Sunucu isteği reddetti (" + error.status + ").";
    return "Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.";
  }

  function toError(error) {
    var out = new Error(describe(error));
    out.code = String((error && error.message) || "");
    out.network = !(error && error.status) && !ERRORS[out.code];
    return out;
  }

  // --- durum ---------------------------------------------------------------------

  // { ok:true } ya da { ok:false, reason:'cloud-off'|'no-session' } — ekranın dürüst boş durumu.
  function status() {
    var c = cloud();
    if (!c || !c.enabled()) return Promise.resolve({ ok: false, reason: "cloud-off" });
    return c.session().then(function (s) {
      return s ? { ok: true, userId: s.userId, email: s.email } : { ok: false, reason: "no-session" };
    }, function () { return { ok: false, reason: "no-session" }; });
  }

  function rest(path, options) {
    return cloud().rest(path, options).catch(function (e) { throw toError(e); });
  }

  function rpc(name, args) {
    return rest("/rest/v1/rpc/" + name, { method: "POST", body: JSON.stringify(args || {}) });
  }

  // --- ev listesi (önbellek) ------------------------------------------------------

  function permsOf(member) {
    var p = (member && member.perms) || {};
    var owner = member && member.role === "owner";
    return {
      control: owner || p.control === true,
      invite: owner || p.invite === true,
      settings: owner || p.settings === true,
      // Oda erişimi: null = tüm odalar; dizi = yalnız bu odalar (sahipte hiç kısıt yok).
      rooms: owner ? null : (Array.isArray(p.rooms) ? p.rooms.slice() : null),
    };
  }

  function homeFromRow(row, myId) {
    var members = (row.household_members || []).map(function (m) {
      return {
        userId: m.user_id,
        name: m.display_name || (m.email ? String(m.email).split("@")[0] : "Üye"),
        email: m.email || "",
        avatar: m.avatar_url || "",
        lastSeenAt: m.last_seen_at || "",
        chatLastRead: m.chat_last_read || "",
        roleKey: m.role,
        role: ROLE_TR[m.role] || "Üye",
        perms: permsOf(m),
      };
    });
    members.sort(function (a, b) { return (a.roleKey === "owner" ? 0 : 1) - (b.roleKey === "owner" ? 0 : 1); });
    var me = members.filter(function (m) { return m.userId === myId; })[0] || null;
    return {
      id: row.id,
      cloud: true,
      name: row.name || "Evim",
      location: row.location || "",
      rooms: Array.isArray(row.rooms) ? row.rooms : [],
      members: members,
      myUserId: myId,
      myRole: me ? me.roleKey : "guest",
      myPerms: me ? me.perms : { control: false, invite: false, settings: false },
      createdAt: row.created_at || "",
      shareAlerts: row.share_alerts === true,
    };
  }

  // nexusHousehold = bulut evleri + yalnız-bu-cihaz evleri. Diğer ekranlar (ev adı,
  // oda listeleri) bu anahtarı okumaya devam eder; bulut evleri başa gelir.
  function localOnlyHomes() {
    var list = get(HOUSE_KEY, []);
    return Array.isArray(list) ? list.filter(function (h) { return h && !h.cloud; }) : [];
  }

  var lastRefresh = { ok: false, at: 0, error: "" };

  function refresh() {
    return status().then(function (st) {
      if (!st.ok) { lastRefresh = { ok: false, at: Date.now(), error: st.reason }; return { ok: false, reason: st.reason, homes: cachedHomes() }; }
      return rest("/rest/v1/households?select=*,household_members(user_id,role,perms,display_name,email,avatar_url,last_seen_at,chat_last_read)&order=created_at.asc")
        .then(function (rows) {
          var homes = (rows || []).map(function (r) { return homeFromRow(r, st.userId); });
          put(HOUSE_KEY, homes.concat(localOnlyHomes()));
          lastRefresh = { ok: true, at: Date.now(), error: "" };
          syncMyName(homes, st.userId);
          syncMyAvatar(homes, st.userId);
          startPresenceHeartbeat();
          changed({ kind: "homes" });
          return { ok: true, homes: homes };
        }, function (e) {
          lastRefresh = { ok: false, at: Date.now(), error: e.message };
          return { ok: false, reason: e.network ? "offline" : "error", error: e.message, homes: cachedHomes() };
        });
    });
  }

  function cachedHomes() {
    var list = get(HOUSE_KEY, []);
    return (Array.isArray(list) ? list : []).filter(function (h) { return h && h.cloud; });
  }

  // Profil adı değiştiyse sunucudaki görünen ad güncellenir (mesaj gönderen adı buradan gelir).
  function syncMyName(homes, myId) {
    var mine = String((window.nexusGetItem && window.nexusGetItem("nexusUserName")) || "").trim();
    if (!mine) return;
    homes.forEach(function (h) {
      var me = h.members.filter(function (m) { return m.userId === myId; })[0];
      if (me && me.name !== mine && !me.nameFromEmail) {
        rest("/rest/v1/household_members?household_id=eq." + h.id + "&user_id=eq." + myId, {
          method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ display_name: mine.slice(0, 80) }),
        }).catch(function () { /* en iyi çaba */ });
      }
    });
  }

  // Profil avatarı değiştiyse (nexusAvatarChanged) üye satırına küçük veri-URL olarak yazılır:
  // aile listelerinde ve sohbette gerçek fotoğraf görünür. Yalnız kendi satırım.
  // Sunucuya yazıldıktan sonra önbellek yerinde yamanır (yeniden fetch yok: gereksiz
  // istek ve test koşusu sırasında istek kuyruğunu tüketme riski olmasın).
  var lastAvatarSync = "";
  function syncMyAvatar(homes, myId) {
    var url = String((window.nexusGetItem && window.nexusGetItem("nexusAvatar")) || "");
    if (!url || url.length > 200000 || url === lastAvatarSync) return;
    var me = homes.length && homes[0].members.filter(function (m) { return m.userId === myId; })[0];
    if (me && me.avatar === url) { lastAvatarSync = url; return; }
    lastAvatarSync = url;
    rpc("set_household_avatar", { p_avatar: url }).then(function () {
      var all = get(HOUSE_KEY, []);
      (Array.isArray(all) ? all : []).forEach(function (h) {
        if (h && h.cloud && Array.isArray(h.members)) {
          h.members.forEach(function (m) { if (m.userId === myId) m.avatar = url; });
        }
      });
      put(HOUSE_KEY, all);
      changed({ kind: "avatar" });
    }, function () { /* en iyi çaba: sunucu reddederse ilk avatarla devam */ });
  }

  // --- çevrimiçi durumu (presence) ---------------------------------------------------
  // Kalp atışı: uygulama açıkken 60 sn'de bir (ve görünürlük değişince) dokunulur.
  // İlk vuruş 30 sn sonra: sayfa açılışındaki istek sırasına karışmaz (test koşuları
  // ve hızlı ziyaretler ek istek görmez), üretimde ilk dakika içinde durum oturur.
  // 3 dk = çevrimiçi, 15 dk = yakın zamanda, sonrası çevrimdışı (presenceOf hesaplar).
  var presenceBooted = false;
  function touchPresence() {
    rpc("touch_household_presence", {}).catch(function () { /* sessiz: kalp atışı kritik değil */ });
  }
  function startPresenceHeartbeat() {
    if (presenceBooted) return;
    presenceBooted = true;
    setTimeout(touchPresence, 30000);
    setInterval(function () { if (!document.hidden) touchPresence(); }, 60000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) touchPresence(); });
  }
  function presenceOf(member) {
    var t = member && member.lastSeenAt ? Date.parse(member.lastSeenAt) : 0;
    if (!t || isNaN(t)) return { key: "offline", label: "Çevrimdışı", online: false };
    var mins = (Date.now() - t) / 60000;
    if (mins <= 3) return { key: "online", label: "Çevrimiçi", online: true };
    if (mins <= 15) return { key: "recent", label: "Son 15 dk içinde", online: false };
    return { key: "offline", label: "Çevrimdışı", online: false };
  }

  // --- Ev Panosu: ortak liste + notlar ------------------------------------------------
  // kind 'item' = işaretlenebilir madde (alışveriş vb.); 'note' = düz not.
  // Herkes işaretleyebilir; silme yalnız kendi kaleminde (sahip herkesinkini silebilir).
  function listBoard(homeId) {
    return rest("/rest/v1/household_board_items?select=id,created_by,author_name,kind,body,done,done_by,created_at,updated_at" +
      "&household_id=eq." + encodeURIComponent(homeId) + "&order=created_at.asc").then(function (rows) {
      return rows || [];
    });
  }
  function addBoardItem(homeId, body, kind) {
    var text = cleanBody(String(body || "")).slice(0, 500);
    if (!text) return Promise.reject(toError({ message: "empty_message" }));
    return rest("/rest/v1/household_board_items", {
      method: "POST", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ household_id: homeId, body: text, kind: kind === "note" ? "note" : "item", author_name: myName() }),
    }).then(function (rows) { return Array.isArray(rows) ? rows[0] : rows; });
  }
  function setBoardDone(homeId, itemId, done) {
    return patchOne("/rest/v1/household_board_items?id=eq." + encodeURIComponent(itemId) + "&household_id=eq." + encodeURIComponent(homeId),
      { done: !!done, done_by: myUserId() || null });
  }
  function deleteBoardItem(homeId, itemId) {
    return rest("/rest/v1/household_board_items?id=eq." + encodeURIComponent(itemId) + "&household_id=eq." + encodeURIComponent(homeId),
      { method: "DELETE", headers: { Prefer: "return=representation" } })
      .then(function (rows) {
        if (!Array.isArray(rows) || !rows.length) throw toError({ message: "forbidden" });
      });
  }

  // Kendi üye kimliğim (ilk bulut evinden); pano done_by için.
  function myUserId() {
    var homes = cachedHomes();
    for (var i = 0; i < homes.length; i++) {
      if (homes[i] && homes[i].myUserId) return homes[i].myUserId;
    }
    return "";
  }

  // Oda geçidi: aktif kullanıcının ev izinlerinde rooms dizisi varsa uygulama oda
  // listelerini/cihazları bu odalarla sınırlar. null = kısıt yok (sahip/normal üye).
  // Birden çok ev olabilir; oturum açan kullanıcının ilk bulut evi esas alınır.
  function roomGate() {
    var homes = cachedHomes();
    for (var i = 0; i < homes.length; i++) {
      var h = homes[i];
      if (h && h.cloud && h.myPerms) {
        return Array.isArray(h.myPerms.rooms) ? h.myPerms.rooms.slice() : null;
      }
    }
    return null;
  }

  function setAvatar(url) {
    return rpc("set_household_avatar", { p_avatar: String(url || "") }).then(function () { return refresh(); });
  }

  // Oturum açıksa yalnız-bu-cihaz evleri arka planda hesaba bağlanır (sahibin kararı:
  // kullanıcı "taşı" düğmesine basmamalı; aile özellikleri doğrudan açık olur).
  function migrateAllLocalHomes() {
    var locals = localOnlyHomes();
    if (!locals.length) return Promise.resolve(0);
    var chain = Promise.resolve();
    var done = 0;
    locals.forEach(function (h) {
      chain = chain.then(function () {
        return migrateLocalHome(h).then(function () { done++; }, function () { /* tek ev hatası diğerini engellemesin */ });
      });
    });
    return chain.then(function () { return done; });
  }

  // Sohbet/akışta gönderen kimliği: üye listesinden ad + avatar (sender_name boş/eksikse de doğru kimlik).
  function memberById(homeId, userId) {
    var home = cachedHomes().filter(function (h) { return h.id === homeId; })[0];
    if (!home || !home.members) return null;
    return home.members.filter(function (m) { return m.userId === userId; })[0] || null;
  }

  function changed(detail) {
    try { window.dispatchEvent(new CustomEvent("nexusHouseholdChanged", { detail: detail || {} })); } catch (e) {}
  }

  // --- ev işlemleri ---------------------------------------------------------------

  function myName() {
    return String((window.nexusGetItem && window.nexusGetItem("nexusUserName")) || "").trim().slice(0, 80);
  }

  function createHome(name, location) {
    return rpc("create_household", { p_name: String(name || "").trim(), p_location: String(location || ""), p_display_name: myName() })
      .then(function (row) { return refresh().then(function () { return row; }); });
  }

  // Yerel (yalnız-bu-cihaz) evi buluta taşır: ad, konum, odalar. Davetler/üyeler taşınmaz.
  function migrateLocalHome(local) {
    return createHome(local.name, local.location).then(function (row) {
      var rooms = Array.isArray(local.rooms) ? local.rooms.slice(0, 40) : [];
      var chain = rooms.length ? updateHome(row.id, { rooms: rooms }) : Promise.resolve();
      return chain.then(function () {
        put(HOUSE_KEY, get(HOUSE_KEY, []).filter(function (h) { return !(h && !h.cloud && h.id === local.id); }));
        return refresh().then(function () { return row; });
      });
    });
  }

  function patchOne(path, body) {
    return rest(path, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(body) })
      .then(function (rows) {
        // RLS reddedince PostgREST hata vermez, 0 satır döner: sessizce "başarılı" görünmesin.
        if (!Array.isArray(rows) || !rows.length) throw toError({ message: "forbidden" });
        return rows[0];
      });
  }

  function updateHome(id, patch) {
    var body = {};
    if (typeof patch.name === "string") body.name = patch.name.trim().slice(0, 60);
    if (typeof patch.location === "string") body.location = patch.location.slice(0, 120);
    if (Array.isArray(patch.rooms)) body.rooms = patch.rooms.map(function (r) { return String(r).slice(0, 40); }).slice(0, 40);
    return patchOne("/rest/v1/households?id=eq." + encodeURIComponent(id), body).then(function (row) {
      return refresh().then(function () { return row; });
    });
  }

  function deleteHome(id) {
    return rest("/rest/v1/households?id=eq." + encodeURIComponent(id), { method: "DELETE", headers: { Prefer: "return=representation" } })
      .then(function (rows) {
        if (!Array.isArray(rows) || !rows.length) throw toError({ message: "forbidden" });
        return refresh();
      });
  }

  function setMemberAccess(homeId, userId, roleKey, perms) {
    return rpc("set_household_member_access", { p_household: homeId, p_user: userId, p_role: roleKey, p_perms: perms || {} })
      .then(function () { return refresh(); });
  }

  // Oda erişimi: rooms = null (tüm odalar) | dizi (yalnız bu odalar). Yalnız sahip değiştirebilir.
  function setMemberRooms(homeId, userId, rooms) {
    var clean = rooms == null ? null : (Array.isArray(rooms) ? rooms.map(function (r) { return String(r).slice(0, 40); }) : null);
    return rpc("set_household_member_rooms", { p_household: homeId, p_user: userId, p_rooms: clean })
      .then(function () { return refresh(); });
  }

  function removeMember(homeId, userId) {
    return rpc("remove_household_member", { p_household: homeId, p_user: userId }).then(function () { return refresh(); });
  }

  // --- davet ----------------------------------------------------------------------

  // Davet sunucuda oluşturulur (kod orada üretilir, yalnızca bu cevapta düz metin döner);
  // ardından Edge Function e-postayı gönderir. Dönüş: { inviteId, mail: 'sent'|'existing-account'|'failed' }
  function invite(homeId, email, name, roleKey) {
    return rpc("create_household_invite", { p_household: homeId, p_email: String(email || "").trim(), p_name: String(name || "").trim(), p_role: roleKey || "member" })
      .then(function (rows) {
        var row = Array.isArray(rows) ? rows[0] : rows;
        if (!row || !row.invite_id) throw toError({ message: "invite_invalid" });
        return cloud().sendHouseholdInvite({ inviteId: row.invite_id, email: String(email).trim().toLowerCase(), code: row.code }).then(function (res) {
          var mail = res && res.sent ? "sent" : (res && res.alreadyAccount ? "existing-account" : "failed");
          return { inviteId: row.invite_id, code: row.code, mail: mail, expiresAt: row.expires_at };
        });
      });
  }

  // Mail gönderimi başarısızsa kullanıcıya yeniden gönder: kod yalnızca oluşturulurken bilindiği
  // için yeni bir davet (yeni kod) açılır, eskisi iptal olur (RPC aynı adres için tek geçerli davet tutar).
  function listInvites(homeId) {
    // Süresi dolanlar da gelir (expired:true): ekran "süresi doldu" der ve yeniden göndermeyi sunar.
    return rest("/rest/v1/household_invites?select=id,email,name,role,status,created_at,expires_at&status=eq.pending" +
      "&household_id=eq." + encodeURIComponent(homeId) + "&order=created_at.desc").then(function (rows) {
      return (rows || []).map(function (r) {
        r.expired = new Date(r.expires_at).getTime() <= Date.now();
        return r;
      });
    });
  }

  // Sahiplik devri (yalnız sahip; sunucu eski sahibi üyeye düşürür, tek-sahip kuralı korunur)
  function transferOwnership(homeId, userId) {
    return rpc("transfer_household_ownership", { p_household: homeId, p_to: userId }).then(function () { return refresh(); });
  }

  // Ev sahibi: kritik olayları üyelere bildir (aç/kapat)
  function setShareAlerts(homeId, on) {
    return rpc("set_household_share_alerts", { p_household: homeId, p_on: !!on }).then(function () { return refresh(); });
  }

  // Ortak etkinlik akışı: yalnız sunucuya GERÇEKTEN yazılmış olaylar
  function listActivity(homeId, limit) {
    return rest("/rest/v1/household_activity?select=id,actor_id,actor_name,kind,title,detail,created_at&household_id=eq." +
      encodeURIComponent(homeId) + "&order=created_at.desc&limit=" + Math.min(50, limit || 20));
  }

  // Bu cihazda gerçekten çalışan senaryo, üyesi olunan bulut evlerine bildirilir (yalnız senaryo adı).
  function reportScene(title) {
    var homes = cachedHomes();
    if (!homes.length || !title) return Promise.resolve(0);
    return status().then(function (st) {
      if (!st.ok) return 0;
      return Promise.all(homes.map(function (h) {
        return rpc("log_household_activity", { p_household: h.id, p_kind: "scene_run", p_title: String(title).slice(0, 120), p_detail: "" }).catch(function () { return null; });
      })).then(function () { return homes.length; });
    });
  }

  // Kritik (security / emergency) olaylar: ev sahibi paylaşımı açtıysa başlık + kısa metin üyelere
  // gider. Kimlik bilgisi / cihaz sırrı gönderilmez; yalnız olayın başlığı ve metni. İlk çalıştırmada
  // geçmiş olaylar sahiplenilir (gönderilmez); aile kaynaklı olaylar (halert-/hmsg-) tekrar yayılmaz.
  var FWD_KEY = "nexusHouseholdAlertsFwd";
  function forwardAlerts(markOnly) {
    var fwd = get(FWD_KEY, null);
    var first = !Array.isArray(fwd);
    if (first) fwd = [];
    var list = get(EVENTS_KEY, []);
    if (!Array.isArray(list)) return Promise.resolve(0);
    var fresh = list.filter(function (e) {
      return e && e.id && (e.type === "security" || e.type === "emergency") && !/^(halert|hmsg)-/.test(String(e.id)) && fwd.indexOf(e.id) === -1;
    });
    if (!fresh.length) { if (first) put(FWD_KEY, fwd); return Promise.resolve(0); }
    fresh.forEach(function (e) { fwd.push(e.id); });
    put(FWD_KEY, fwd.slice(-200));
    if (first || markOnly) return Promise.resolve(0);
    var homes = cachedHomes().filter(function (h) { return h.shareAlerts; });
    if (!homes.length) return Promise.resolve(0);
    return Promise.all(fresh.slice(-3).map(function (e) {
      return Promise.all(homes.map(function (h) {
        return rpc("log_household_activity", { p_household: h.id, p_kind: "alert", p_title: String(e.title || "Uyarı").slice(0, 120), p_detail: String(e.detail || "").slice(0, 160) }).catch(function () { return null; });
      }));
    })).then(function () { return fresh.length; });
  }

  function cancelInvite(inviteId) {
    return rpc("cancel_household_invite", { p_invite: inviteId });
  }

  function myInvites() {
    return rpc("my_household_invites", {});
  }

  function accept(opts) {
    return rpc("accept_household_invite", { p_code: opts.code || null, p_invite_id: opts.inviteId || null, p_display_name: myName() })
      .then(function (res) {
        if (!res || res.ok !== true) throw toError({ message: (res && res.error) || "invite_invalid" });
        return refresh().then(function () { return res.household_id; });
      });
  }

  function decline(inviteId) {
    return rpc("decline_household_invite", { p_invite: inviteId });
  }

  // --- sohbet ---------------------------------------------------------------------

  var sendTimes = [];

  // Yalnızca metin: kontrol karakterleri (satır sonu hariç) ve sıfır genişlikli kodlar atılır.
  function cleanBody(text) {
    return String(text == null ? "" : text)
      .replace(/\r\n?/g, "\n")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠﻿]/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function listMessages(homeId, opts) {
    var o = opts || {};
    // parent:reply_to(...) — PostgREST kendi-tablo birleştirmesi: yanıtlanan mesajın
    // kim ve ne yazdığı tek istekte gelir (yanıt baloncuğu için).
    var q = "/rest/v1/household_messages?select=id,sender_id,sender_name,body,created_at,reply_to,reactions," +
      "parent:reply_to(id,sender_name,body)&household_id=eq." + encodeURIComponent(homeId) +
      "&order=created_at.desc&limit=" + Math.min(100, o.limit || 50) +
      (o.before ? "&created_at=lt." + encodeURIComponent(o.before) : "");
    return rest(q).then(function (rows) { return (rows || []).slice().reverse(); });
  }

  function sendMessage(homeId, text, replyTo) {
    var body = cleanBody(text);
    if (!body) return Promise.reject(toError({ message: "empty_message" }));
    if (body.length > MAX_BODY) return Promise.reject(new Error("Mesaj en fazla " + MAX_BODY + " karakter olabilir."));
    var now = Date.now();
    sendTimes = sendTimes.filter(function (t) { return now - t < 10000; });
    if (sendTimes.length >= 5 || (sendTimes.length && now - sendTimes[sendTimes.length - 1] < 600)) {
      return Promise.reject(toError({ message: "rate_limited" }));
    }
    sendTimes.push(now);
    var payload = { household_id: homeId, body: body };
    if (replyTo) payload.reply_to = String(replyTo);
    return rest("/rest/v1/household_messages", {
      method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload),
    }).then(function (rows) { return Array.isArray(rows) ? rows[0] : rows; });
  }

  // Tepki: sunucu toggle yapar ve güncel tepki haritasını döner; Realtime UPDATE'i
  // tüm üyelere taşır (dönüş değeri yalnız çağıranın ekranını anında boyar).
  var REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];
  function reactMessage(messageId, emoji) {
    return rpc("react_household_message", { p_message: String(messageId || ""), p_emoji: String(emoji || "") })
      .then(function (cur) { return cur || {}; });
  }

  // Okundu: "buraya kadar okudum" sunucuya yazılır; diğer üyelerin ✓✓'i Realtime ile gelir.
  function markRead(homeId, iso) {
    return rpc("mark_household_read", { p_household: homeId, p_iso: iso || new Date().toISOString() });
  }

  // Bir mesajı okuyan üyeler (gönderen hariç): chatLastRead >= mesaj anı.
  function readersOf(message, home) {
    if (!message || !home || !Array.isArray(home.members)) return [];
    var t = Date.parse(message.created_at);
    if (isNaN(t)) return [];
    return home.members.filter(function (m) {
      if (!m.chatLastRead || m.userId === message.sender_id) return false;
      var r = Date.parse(m.chatLastRead);
      return !isNaN(r) && r >= t;
    });
  }

  function deleteMessage(id) {
    return rest("/rest/v1/household_messages?id=eq." + encodeURIComponent(id), { method: "DELETE", headers: { Prefer: "return=representation" } })
      .then(function (rows) {
        if (!Array.isArray(rows) || !rows.length) throw toError({ message: "forbidden" });
      });
  }

  // --- okundu bilgisi + bildirim hattı ---------------------------------------------

  var activeChat = ""; // şu an görünür olan sohbetin ev kimliği

  function seenMap() { return get(SEEN_KEY, {}) || {}; }
  function markSeen(homeId, iso) {
    var m = seenMap();
    if (!m[homeId] || String(iso) > String(m[homeId])) { m[homeId] = iso; put(SEEN_KEY, m); }
  }
  function setActiveChat(homeId) { activeChat = homeId || ""; }

  function homeName(homeId) {
    var h = cachedHomes().filter(function (x) { return x.id === homeId; })[0];
    return h ? h.name : "Aile";
  }

  // nexusEvents → notify.js (kategori anahtarı + sessiz saat orada uygulanır).
  // Gövde YAZILMAZ (üstteki dürüstlük notu); kimlik = mesaj kimliği, aynı mesaj iki kez bildirilmez.
  function pushEvent(msg, homeId, extraCount, viaCatchUp) {
    var list = get(EVENTS_KEY, []);
    if (!Array.isArray(list)) list = [];
    var id = "hmsg-" + msg.id;
    if (list.some(function (e) { return e && e.id === id; })) return;
    var who = String(msg.sender_name || "Bir aile üyesi");
    var preview = String(msg.body || "").replace(/\s+/g, " ").trim();
    if (preview.length > 80) preview = preview.slice(0, 79) + "…";
    list.push({
      id: id,
      type: "family",
      // private: ntfy/webhook/Telegram'a gitmez; yalnız bu cihazın sistem bildirimi (notify.js)
      private: true,
      title: homeName(homeId) + " · " + who,
      detail: extraCount > 1 ? (extraCount + " yeni mesaj" + (preview ? " · son: " + preview : "")) : (preview || "Yeni mesaj"),
      ts: Date.now(),
      // Uygulama kapalı/arkaplandayken sunucu bildirimi zaten gösterildiyse sistem bildirimi tekrarlanmaz
      pushed: viaCatchUp === true && pushRegistered(),
      page: "nexus-family-chat.html?home=" + encodeURIComponent(homeId),
    });
    if (list.length > 300) list = list.slice(-300);
    put(EVENTS_KEY, list);
  }

  function visible() {
    return typeof document === "undefined" || !document.hidden;
  }

  function onIncoming(row) {
    status().then(function (st) {
      if (!st.ok || !row || row.sender_id === st.userId) return;
      var watching = activeChat === row.household_id && visible();
      try { window.dispatchEvent(new CustomEvent("nexusHouseholdMessage", { detail: { message: row } })); } catch (e) {}
      if (watching) { markSeen(row.household_id, row.created_at); return; }
      pushEvent(row, row.household_id, 1);
    });
  }

  // Çevrimdışıyken / sekme kapalıyken gelenler: açılışta ve yoklamada yakalanır.
  // İlk kez görülen evde geçmiş mesajlar bildirim yapılmaz (yalnızca işaret konur).
  var catching = false;
  function catchUp() {
    if (catching) return Promise.resolve();
    catching = true;
    return status().then(function (st) {
      if (!st.ok) return;
      var homes = cachedHomes();
      return homes.reduce(function (chain, h) {
        return chain.then(function () {
          var seen = seenMap()[h.id];
          if (!seen) {
            return listMessages(h.id, { limit: 1 }).then(function (rows) {
              markSeen(h.id, rows.length ? rows[rows.length - 1].created_at : new Date().toISOString());
            });
          }
          return rest("/rest/v1/household_messages?select=id,sender_id,sender_name,body,created_at&household_id=eq." + h.id +
            "&created_at=gt." + encodeURIComponent(seen) + "&order=created_at.asc&limit=20").then(function (rows) {
            var others = (rows || []).filter(function (r) { return r.sender_id !== st.userId; });
            if (activeChat === h.id && visible()) { if (rows.length) markSeen(h.id, rows[rows.length - 1].created_at); return; }
            if (others.length) {
              pushEvent(others[others.length - 1], h.id, others.length, true);
              markSeen(h.id, rows[rows.length - 1].created_at);
            } else if (rows.length) markSeen(h.id, rows[rows.length - 1].created_at);
          });
        });
      }, Promise.resolve());
    }).catch(function () { /* çevrimdışı: sonraki turda */ }).then(function () { catching = false; });
  }

  function unreadCount(homeId) {
    return status().then(function (st) {
      var seen = seenMap()[homeId];
      if (!st.ok || !seen) return 0;
      return rest("/rest/v1/household_messages?select=id&household_id=eq." + encodeURIComponent(homeId) +
        "&sender_id=neq." + st.userId + "&created_at=gt." + encodeURIComponent(seen) + "&limit=100").then(function (rows) { return rows.length; }, function () { return 0; });
    });
  }

  // Başkasının paylaştığı kritik uyarı: bu hesabın kendi bildirim ayarlarına tabi bir olay olur.
  function onActivity(row) {
    status().then(function (st) {
      if (!st.ok || !row || row.actor_id === st.userId) return;
      try { window.dispatchEvent(new CustomEvent("nexusHouseholdActivity", { detail: { activity: row } })); } catch (e) {}
      if (row.kind !== "alert") return;
      var list = get(EVENTS_KEY, []);
      if (!Array.isArray(list)) list = [];
      var id = "halert-" + row.id;
      if (list.some(function (e) { return e && e.id === id; })) return;
      list.push({
        id: id, type: "security", private: true,
        title: homeName(row.household_id) + " · " + (row.actor_name || "Üye") + ": " + (row.title || "Uyarı"),
        detail: row.detail || "Aile üyesinin cihazından paylaşılan uyarı",
        ts: Date.now(),
      });
      if (list.length > 300) list = list.slice(-300);
      put(EVENTS_KEY, list);
    });
  }

  // --- okunmamış rozeti (kenar menü Aile bağlantısı, alt gezinmede Profil, Aile bağlantıları) ---
  function paintBadge(total) {
    if (typeof document === "undefined" || !document.querySelectorAll) return;
    var targets = document.querySelectorAll('a.nx-side-link[href="nexus-household.html"], nav a[href="nexus-profile.html"]');
    Array.prototype.forEach.call(targets, function (a) {
      var b = a.querySelector(".nx-fam-badge");
      if (!total) { if (b) b.remove(); return; }
      if (!b) {
        b = document.createElement("span");
        b.className = "nx-fam-badge";
        b.setAttribute("aria-label", "Okunmamış aile mesajı");
        b.style.cssText = "margin-left:6px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--nx-accent,#4C7DFF);color:#fff;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;line-height:1";
        if (a.matches('nav a[href="nexus-profile.html"]')) b.style.cssText += ";position:absolute;margin:0;transform:translate(14px,-14px)";
        if (getComputedStyle(a).position === "static") a.style.position = "relative";
        a.appendChild(b);
      }
      b.textContent = total > 99 ? "99+" : String(total);
    });
  }
  function updateBadge() {
    if (!cachedHomes().length) { paintBadge(0); return Promise.resolve(0); }
    return Promise.all(cachedHomes().map(function (h) { return unreadCount(h.id); })).then(function (counts) {
      var total = counts.reduce(function (a, b) { return a + b; }, 0);
      paintBadge(total);
      return total;
    }, function () { return 0; });
  }

  // --- izin uygulaması --------------------------------------------------------------

  function can(home, perm) {
    if (!home) return false;
    if (!home.cloud) return true; // yalnız-bu-cihaz ev: tek kullanıcı, kısıt yok
    return !!(home.myPerms && home.myPerms[perm]) || home.myRole === "owner";
  }

  // Cihaz kontrol izni: yalnızca TÜM bulut evlerinde üye olup hiçbirinde kontrol izni
  // olmayan hesap kısıtlanır (ör. Misafir). Kendi evi olan ya da hiç bulut evi olmayan
  // kullanıcı etkilenmez. Önbellekten okur, ağ gerektirmez; sunucu cihaz komutlarına hükmetmez
  // (cihazlar her üyenin kendi cihazındadır) — bu, bu uygulama içinde komut yolunu kapatır.
  function canControl() {
    var homes = cachedHomes();
    if (!homes.length) return true;
    return homes.some(function (h) { return can(h, "control"); });
  }

  // --- sunucu bildirimi (FCM): kapalı uygulamaya aile mesajı / paylaşılan uyarı -----------------
  //
  // Yalnız Android. Cihaz token'ı push_tokens'a (RLS: yalnız sahibi) yazılır; gönderimi sunucudaki
  // push-notify fonksiyonu yapar. Ekran yalnızca token GERÇEKTEN kaydedildiğinde "açık" der:
  // google-services.json yoksa Firebase başlamaz, kayıt hatası gelir ve durum "yapılandırılmadı" olur.
  // iOS (APNs, Apple hesabı) ve masaüstü/web kapsam dışıdır. Kapalı uygulamada istemci kodu
  // çalışmadığı için bildirim ayarlarının KOPYASI (ana anahtar/kategori/sessiz saat) sunucuya yazılır;
  // uygulama her açıldığında ve ayar değiştiğinde tazelenir (arada eski kalabilir).
  var PUSH_FLAG = "nexusPushEnabled";
  var PUSH_STATE = "nexusPushState";
  var PUSH_TOKEN = "nexusPushToken";
  var PAGE_PREFIX = "nexusInstantNotif:";
  var pushListening = false;
  var pushWaiters = [];

  function nativePlatform() {
    try { return (window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform()) || "web"; } catch (e) { return "web"; }
  }
  function pushPlugin() {
    try { return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications) || null; } catch (e) { return null; }
  }
  function raw(key) {
    try { return window.nexusGetItem ? window.nexusGetItem(key) : localStorage.getItem(key); } catch (e) { return null; }
  }
  function flag(key, dflt) {
    var v = raw(PAGE_PREFIX + key);
    return v === null || v === "" ? dflt : v !== "false";
  }
  // notify.js'in okuduğu ayarların kopyası (sunucu aynı kuralları uygular: logic.ts shouldDeliver)
  function pushPrefs() {
    var dnd = parseInt(raw("nexusDndEndTime") || "0", 10) || 0;
    return {
      master: flag("master", true),
      family: flag("notif-family", true),
      security: flag("notif-security", true),
      quietEnabled: flag("quietEnabled", false),
      quietStart: raw(PAGE_PREFIX + "quietStart") || "23:00",
      quietEnd: raw(PAGE_PREFIX + "quietEnd") || "07:30",
      tzOffsetMin: -new Date().getTimezoneOffset(),
      dndUntil: dnd,
      dndActive: raw("nexusDndActive") === "true",
    };
  }
  function setPushState(state) {
    try { if (window.nexusSetItem) window.nexusSetItem(PUSH_STATE, state); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent("nexusPushState", { detail: { state: state } })); } catch (e) {}
  }
  function pushRegistered() {
    return raw(PUSH_FLAG) === "true" && raw(PUSH_STATE) === "registered" && !!raw(PUSH_TOKEN);
  }

  // { state, text }: state ∈ unsupported | ios | cloud-off | no-session | no-plugin | not-configured |
  //                          denied | off | registered
  function pushStatus() {
    var plat = nativePlatform();
    var text = {
      unsupported: "Sunucu bildirimi yalnızca Android uygulamasında var.",
      ios: "iOS'ta sunucu bildirimi henüz yok (Apple geliştirici hesabı gerektirir).",
      "cloud-off": "Bulut bağlantısı kapalı; sunucu bildirimi kullanılamıyor.",
      "no-session": "Sunucu bildirimi için oturum açmalısın.",
      "no-plugin": "Sunucu bildirimi bu sürümde yapılandırılmadı.",
      "not-configured": "Sunucu bildirimi bu sürümde yapılandırılmadı.",
      denied: "Bildirim izni verilmedi. Android ayarlarından izin verebilirsin.",
      off: "Kapalı. Açarsan uygulama kapalıyken de aile mesajı ve paylaşılan uyarılar gelir.",
      registered: "Açık: bu cihaz kapalıyken de aile bildirimi alır.",
    };
    var done = function (state) { return { state: state, text: text[state] }; };
    if (plat === "ios") return Promise.resolve(done("ios"));
    if (plat !== "android") return Promise.resolve(done("unsupported"));
    return status().then(function (st) {
      if (!st.ok) return done(st.reason === "cloud-off" ? "cloud-off" : "no-session");
      if (!pushPlugin()) return done("no-plugin");
      var saved = raw(PUSH_STATE);
      if (raw(PUSH_FLAG) === "true" && saved === "registered" && raw(PUSH_TOKEN)) return done("registered");
      if (saved === "not-configured") return done("not-configured");
      if (saved === "denied") return done("denied");
      return done("off");
    });
  }

  function savePushToken(token) {
    return rpc("register_push_token", { p_token: token, p_platform: "android", p_prefs: pushPrefs() }).then(function () {
      try { window.nexusSetItem(PUSH_TOKEN, token); } catch (e) {}
      setPushState("registered");
    });
  }

  function listenPush(plugin) {
    if (pushListening) return;
    pushListening = true;
    plugin.addListener("registration", function (t) {
      var token = t && t.value;
      if (!token) return;
      savePushToken(token).then(function () { pushWaiters.splice(0).forEach(function (w) { w("registered"); }); },
        function () { pushWaiters.splice(0).forEach(function (w) { w("error"); }); });
    });
    plugin.addListener("registrationError", function () {
      // Firebase başlamadı (google-services.json yok) ya da Play hizmetleri yok: sahte "açık" yok.
      setPushState("not-configured");
      pushWaiters.splice(0).forEach(function (w) { w("not-configured"); });
    });
    // Dokununca ilgili sohbete git (yalnız bilinen sayfa kalıbı)
    plugin.addListener("pushNotificationActionPerformed", function (a) {
      var page = a && a.notification && a.notification.data && a.notification.data.page;
      if (/^nexus-family-chat\.html\?home=[0-9a-f-]{36}$/i.test(String(page || ""))) window.location.href = page;
    });
  }

  function enablePush() {
    return pushStatus().then(function (cur) {
      if (cur.state !== "off" && cur.state !== "denied" && cur.state !== "not-configured") return cur;
      var plugin = pushPlugin();
      listenPush(plugin);
      return Promise.resolve(plugin.requestPermissions ? plugin.requestPermissions() : { receive: "granted" }).then(function (perm) {
        if (!perm || perm.receive !== "granted") { setPushState("denied"); return pushStatus(); }
        try { window.nexusSetItem(PUSH_FLAG, "true"); } catch (e) {}
        var chan = plugin.createChannel ? Promise.resolve(plugin.createChannel({ id: "nexus-family", name: "Aile", description: "Aile mesajları ve paylaşılan uyarılar", importance: 4 })).catch(function () {}) : Promise.resolve();
        return chan.then(function () {
          return new Promise(function (resolve) {
            var timer = setTimeout(function () { resolve("timeout"); }, 15000);
            pushWaiters.push(function (s) { clearTimeout(timer); resolve(s); });
            plugin.register();
          });
        }).then(function (result) {
          if (result === "timeout" || result === "error") { setPushState("not-configured"); try { window.nexusSetItem(PUSH_FLAG, "false"); } catch (e) {} }
          else if (result === "not-configured") { try { window.nexusSetItem(PUSH_FLAG, "false"); } catch (e) {} }
          return pushStatus();
        });
      }, function () { setPushState("not-configured"); return pushStatus(); });
    });
  }

  function disablePush() {
    var token = raw(PUSH_TOKEN);
    try { window.nexusSetItem(PUSH_FLAG, "false"); window.nexusSetItem(PUSH_TOKEN, ""); } catch (e) {}
    setPushState("off");
    var plugin = pushPlugin();
    try { if (plugin && plugin.unregister) plugin.unregister(); } catch (e) {}
    if (!token) return pushStatus();
    return rest("/rest/v1/push_tokens?token=eq." + encodeURIComponent(token), { method: "DELETE", headers: { Prefer: "return=minimal" } })
      .catch(function () { /* çevrimdışı: sunucu eski token'ı FCM geçersiz sayınca temizler */ })
      .then(pushStatus);
  }

  // Ayar değişti / uygulama açıldı: sunucudaki tercih kopyasını tazele (yalnız kayıtlıysa)
  function syncPushPrefs() {
    if (!pushRegistered()) return Promise.resolve(false);
    return savePushToken(raw(PUSH_TOKEN)).then(function () { return true; }, function () { return false; });
  }

  // Çıkış: oturum silinmeden ÖNCE (cloud-sync.js signOut çağırır) token'ı sunucudan sil ve yerelde kapat.
  function onSignOut(current) {
    var token = raw(PUSH_TOKEN);
    try { window.nexusSetItem(PUSH_FLAG, "false"); window.nexusSetItem(PUSH_TOKEN, ""); window.nexusSetItem(PUSH_STATE, "off"); } catch (e) {}
    var c = window.NEXUS_CLOUD;
    if (!token || !current || !current.accessToken || !c || !c.url) return;
    try {
      fetch(String(c.url).replace(/\/+$/, "") + "/rest/v1/push_tokens?token=eq." + encodeURIComponent(token), {
        method: "DELETE",
        headers: { apikey: c.anonKey, Authorization: "Bearer " + current.accessToken },
      }).catch(function () {});
    } catch (e) { /* çevrimdışı */ }
  }

  // --- canlı akış ---------------------------------------------------------------------

  var refreshTimer = null;
  function scheduleRefresh() {
    if (refreshTimer) return;
    refreshTimer = setTimeout(function () { refreshTimer = null; refresh(); }, 400);
  }

  function start() {
    window.addEventListener("nexusHouseholdRealtime", function (ev) {
      var d = (ev && ev.detail) || {};
      if (d.table === "household_messages") {
        if (d.type === "INSERT" && d.record) onIncoming(d.record);
        else if (d.type === "UPDATE" && d.record) {
          // Tepkiler RPC ile değişir: ekranlar baloncuğu yerinde günceller (yeniden çekmez).
          try { window.dispatchEvent(new CustomEvent("nexusHouseholdMessageUpdated", { detail: { message: d.record } })); } catch (e) {}
        }
        else if (d.type === "DELETE" && d.old) {
          try { window.dispatchEvent(new CustomEvent("nexusHouseholdMessageDeleted", { detail: { id: d.old.id } })); } catch (e) {}
        }
        setTimeout(updateBadge, 600);
        return;
      }
      if (d.table === "household_board_items") {
        // Pano canlı akar: sayfalar kendi önbelleklerini bu olayla tazeler.
        try { window.dispatchEvent(new CustomEvent("nexusBoardChanged", { detail: { type: d.type || "", record: d.record || null, old: d.old || null } })); } catch (e) {}
        return;
      }
      if (d.table === "household_activity") {
        if (d.type === "INSERT" && d.record) onActivity(d.record);
        return;
      }
      scheduleRefresh();
    });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) catchUp().then(updateBadge); });
    window.addEventListener("storage", function (e) {
      if (e && e.key && /nexusEvents$/.test(e.key)) forwardAlerts();
      if (e && e.key && /nexusInstantNotif:|nexusDnd/.test(e.key)) syncPushPrefs();
    });
    setTimeout(function () {
      status().then(function (st) {
        if (!st.ok) return;
        refresh().then(function () { forwardAlerts(true); return catchUp(); }).then(updateBadge);
        // Sunucu bildirimi açıksa token tazelenir (token döner) ve ayar kopyası güncellenir
        if (raw(PUSH_FLAG) === "true" && pushPlugin()) { setPushState("off"); enablePush(); }
      });
    }, 2500);
    // Realtime yoksa 45 sn'lik yoklama (cloud-sync.js ile aynı ilke); uyarı iletimi her turda kontrol edilir
    setInterval(function () {
      status().then(function (st) {
        if (!st.ok) return;
        forwardAlerts();
        var c = cloud();
        if (c && c.realtimeActive && c.realtimeActive()) return;
        catchUp().then(updateBadge);
      });
    }, 45000);
  }

  window.nexusHouseholdCloud = {
    status: status,
    refresh: refresh,
    homes: cachedHomes,
    lastRefresh: function () { return lastRefresh; },
    describe: describe,
    createHome: createHome,
    migrateLocalHome: migrateLocalHome,
    updateHome: updateHome,
    deleteHome: deleteHome,
    setMemberAccess: setMemberAccess,
    removeMember: removeMember,
    invite: invite,
    listInvites: listInvites,
    pushStatus: pushStatus,
    enablePush: enablePush,
    disablePush: disablePush,
    syncPushPrefs: syncPushPrefs,
    onSignOut: onSignOut,
    transferOwnership: transferOwnership,
    setShareAlerts: setShareAlerts,
    listActivity: listActivity,
    reportScene: reportScene,
    forwardAlerts: forwardAlerts,
    updateBadge: updateBadge,
    cancelInvite: cancelInvite,
    myInvites: myInvites,
    accept: accept,
    decline: decline,
    listMessages: listMessages,
    sendMessage: sendMessage,
    deleteMessage: deleteMessage,
    markSeen: markSeen,
    setActiveChat: setActiveChat,
    unreadCount: unreadCount,
    catchUp: catchUp,
    can: can,
    canControl: canControl,
    presenceOf: presenceOf,
    memberById: memberById,
    setAvatar: setAvatar,
    setMemberRooms: setMemberRooms,
    roomGate: roomGate,
    reactMessage: reactMessage,
    REACTION_EMOJIS: REACTION_EMOJIS,
    markRead: markRead,
    readersOf: readersOf,
    listBoard: listBoard,
    addBoardItem: addBoardItem,
    setBoardDone: setBoardDone,
    deleteBoardItem: deleteBoardItem,
    migrateAllLocalHomes: migrateAllLocalHomes,
    roleLabel: function (k) { return ROLE_TR[k] || "Üye"; },
    roleKey: function (label) { return ROLE_KEY[label] || "member"; },
    MAX_BODY: MAX_BODY,
    _internal: { onActivity: onActivity, cleanBody: cleanBody, homeFromRow: homeFromRow, permsOf: permsOf, pushEvent: pushEvent },
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
