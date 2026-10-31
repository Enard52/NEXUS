/* NEXUS — MQTT 3.1.1 paket kodlayıcı/çözücü + Zigbee2MQTT / Tasmota konu eşlemesi (issue #50, ilk dilim).
 *
 * DÜRÜSTLÜK NOTU (CLAUDE.md kural 1-2): Bu dosya SAF veri katmanıdır; ağa hiç dokunmaz. Taşıma
 * lan-connectors.js `mqtt` bağlayıcısındadır (yalnızca masaüstü: desktop/main.cjs lan:mqtt-* akış köprüsü)
 * ve bu dosyayı ihtiyaç anında yükler; bugün Zigbee2MQTT lamba/priz (aç/kapat, parlaklık) kullanılır,
 * Tasmota MQTT eşlemesi hazır ama bağlı değil (Tasmota HTTP bağlayıcısı kullanılıyor). Paket biçimleri MQTT 3.1.1
 * (OASIS) belirtiminden, konu/yük biçimleri Zigbee2MQTT ve Tasmota belgelerinden yazıldı; GERÇEK bir broker
 * (Mosquitto, Zigbee2MQTT, Tasmota) ile DOĞRULANMADI. Yalnızca birim testleri var (lan-mqtt.test.ts).
 *
 * Kaynaklar:
 *   MQTT 3.1.1  https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html
 *   Zigbee2MQTT https://www.zigbee2mqtt.io/guide/usage/mqtt_topics_and_messages.html
 *               https://www.zigbee2mqtt.io/guide/usage/exposes.html
 *               https://www.zigbee2mqtt.io/guide/configuration/device-availability.html
 *   Tasmota     https://tasmota.github.io/docs/MQTT/  ve  https://tasmota.github.io/docs/Commands/
 * Dışa açılan nesne: window.nexusMqtt = { packets, z2m, tasmota }.
 */
(function (global) {
  "use strict";

  // §2.2.1 — kontrol paketi türleri (sabit başlığın üst 4 biti)
  var T = {
    CONNECT: 1,
    CONNACK: 2,
    PUBLISH: 3,
    PUBACK: 4,
    SUBSCRIBE: 8,
    SUBACK: 9,
    UNSUBSCRIBE: 10,
    UNSUBACK: 11,
    PINGREQ: 12,
    PINGRESP: 13,
    DISCONNECT: 14,
  };
  var MAX_REMAINING = 268435455; // §2.2.3 — 4 baytlık değişken uzunluk üst sınırı
  var CONNACK_TEXT = {
    // §3.2.2.3
    1: "Broker bu MQTT sürümünü (3.1.1) kabul etmiyor.",
    2: "Broker istemci kimliğini reddetti.",
    3: "MQTT servisi şu an kullanılamıyor.",
    4: "Kullanıcı adı ya da parola hatalı.",
    5: "Broker bu istemciye izin vermedi (yetkisiz).",
  };

  function err(code, message) {
    var e = new Error(message);
    e.code = code;
    return e;
  }

  var enc = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
  function utf8Bytes(s) {
    return enc.encode(s);
  }
  function utf8Text(bytes) {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  }
  function toU8(x) {
    return x instanceof Uint8Array ? x : Uint8Array.from(x);
  }
  function cat() {
    var n = 0,
      i,
      parts = arguments;
    for (i = 0; i < parts.length; i++) n += parts[i].length;
    var out = new Uint8Array(n),
      o = 0;
    for (i = 0; i < parts.length; i++) {
      out.set(parts[i], o);
      o += parts[i].length;
    }
    return out;
  }
  function u16(n) {
    return Uint8Array.of((n >> 8) & 255, n & 255);
  }

  // §1.5.3 — UTF-8 dizgisi: 2 bayt büyük-uçlu uzunluk + veri; U+0000 yasak; en çok 65535 bayt.
  function mqttString(s, what) {
    if (typeof s !== "string") throw err("bad-arg", what + " bir metin olmalı.");
    if (s.indexOf("\u0000") !== -1) throw err("bad-arg", what + " U+0000 içeremez.");
    var b = utf8Bytes(s);
    if (b.length > 65535) throw err("bad-arg", what + " 65535 baytı aşamaz.");
    return cat(u16(b.length), b);
  }

  // §2.2.3 — kalan uzunluk: 7 bit/bayt, bit 7 = devam
  function encodeRemainingLength(n) {
    if (!(n >= 0 && n <= MAX_REMAINING) || Math.floor(n) !== n)
      throw err("too-long", "MQTT paketi çok uzun.");
    var out = [];
    do {
      var d = n % 128;
      n = Math.floor(n / 128);
      if (n > 0) d |= 128;
      out.push(d);
    } while (n > 0);
    return Uint8Array.from(out);
  }
  function frame(type, flags, body) {
    return cat(Uint8Array.of((type << 4) | flags), encodeRemainingLength(body.length), body);
  }

  function checkPacketId(id) {
    if (!(id >= 1 && id <= 65535) || Math.floor(id) !== id)
      throw err("bad-arg", "Paket kimliği 1..65535 olmalı (§2.3.1).");
    return id;
  }

  // §4.7.1 — konu süzgeci: '#' yalnızca son ve tek başına; '+' bir seviyenin tamamı.
  function checkTopicFilter(f) {
    if (typeof f !== "string" || f.length === 0) throw err("bad-topic", "Konu süzgeci boş olamaz.");
    var levels = f.split("/");
    for (var i = 0; i < levels.length; i++) {
      var l = levels[i];
      if (l.indexOf("#") !== -1 && (l !== "#" || i !== levels.length - 1))
        throw err("bad-topic", "'#' yalnızca son seviye olabilir.");
      if (l.indexOf("+") !== -1 && l !== "+")
        throw err("bad-topic", "'+' bir seviyenin tamamı olmalı.");
    }
    return f;
  }
  // §3.3.2.1 — yayın konu adı: boş değil, joker yok
  function checkTopicName(t) {
    if (typeof t !== "string" || t.length === 0) throw err("bad-topic", "Konu adı boş olamaz.");
    if (/[#+]/.test(t)) throw err("bad-topic", "Yayın konu adı joker içeremez.");
    return t;
  }

  // §4.7 — süzgeç/konu eşleşmesi; §4.7.2: '$' ile başlayan konular baştaki joker ile eşleşmez
  function topicMatches(filter, topic) {
    checkTopicFilter(filter);
    var f = filter.split("/"),
      t = topic.split("/");
    if (topic.charAt(0) === "$" && (f[0] === "#" || f[0] === "+")) return false;
    for (var i = 0; i < f.length; i++) {
      if (f[i] === "#") return true;
      if (i >= t.length) return false;
      if (f[i] !== "+" && f[i] !== t[i]) return false;
    }
    return f.length === t.length;
  }

  // ------------------------------------------------------------------ kodlayıcılar (istemci → broker)
  // §3.1 CONNECT. Bayraklar §3.1.2: bit7 kullanıcı, bit6 parola, bit1 temiz oturum. "Will" desteklenmez.
  function encodeConnect(o) {
    o = o || {};
    var clientId = o.clientId == null ? "" : o.clientId;
    var keepAlive = o.keepAlive == null ? 60 : o.keepAlive;
    var clean = o.cleanSession !== false;
    if (!(keepAlive >= 0 && keepAlive <= 65535) || Math.floor(keepAlive) !== keepAlive)
      throw err("bad-arg", "keepAlive 0..65535 saniye olmalı.");
    if (!clean && clientId === "")
      throw err(
        "bad-arg",
        "Boş istemci kimliği yalnızca temiz oturumla kullanılabilir (§3.1.3.1).",
      );
    var hasUser = o.username != null,
      hasPass = o.password != null;
    if (hasPass && !hasUser)
      throw err("bad-arg", "Parola için kullanıcı adı da gerekir (§3.1.2.9).");
    var flags = (hasUser ? 128 : 0) | (hasPass ? 64 : 0) | (clean ? 2 : 0);
    var parts = [
      Uint8Array.of(0, 4, 0x4d, 0x51, 0x54, 0x54, 4, flags), // "MQTT", seviye 4
      u16(keepAlive),
      mqttString(clientId, "İstemci kimliği"),
    ];
    if (hasUser) parts.push(mqttString(o.username, "Kullanıcı adı"));
    if (hasPass) {
      var pw = typeof o.password === "string" ? utf8Bytes(o.password) : toU8(o.password); // §3.1.3.5: ikili veri
      if (pw.length > 65535) throw err("bad-arg", "Parola 65535 baytı aşamaz.");
      parts.push(u16(pw.length), pw);
    }
    return frame(T.CONNECT, 0, cat.apply(null, parts));
  }

  // §3.3 PUBLISH. Bayraklar: bit3 DUP, bit2-1 QoS, bit0 RETAIN. Yalnızca QoS 0/1.
  function encodePublish(o) {
    var qos = o.qos == null ? 0 : o.qos;
    if (qos !== 0 && qos !== 1) throw err("bad-arg", "Yalnızca QoS 0 ve 1 desteklenir.");
    if (o.dup && qos === 0) throw err("bad-arg", "QoS 0 paketinde DUP olamaz (§3.3.1.2).");
    var payload =
      o.payload == null
        ? new Uint8Array(0)
        : typeof o.payload === "string"
          ? utf8Bytes(o.payload)
          : toU8(o.payload);
    var parts = [mqttString(checkTopicName(o.topic), "Konu")];
    if (qos === 1) parts.push(u16(checkPacketId(o.packetId)));
    parts.push(payload);
    return frame(
      T.PUBLISH,
      (o.dup ? 8 : 0) | (qos << 1) | (o.retain ? 1 : 0),
      cat.apply(null, parts),
    );
  }

  function encodePuback(packetId) {
    return frame(T.PUBACK, 0, u16(checkPacketId(packetId)));
  } // §3.4

  // §3.8 SUBSCRIBE: bayraklar sabit 0b0010; yük = (süzgeç, istenen QoS) çiftleri, en az bir tane.
  function encodeSubscribe(o) {
    if (!o.topics || !o.topics.length) throw err("bad-arg", "En az bir konu gerekir (§3.8.3).");
    var parts = [u16(checkPacketId(o.packetId))];
    o.topics.forEach(function (t) {
      var filter = typeof t === "string" ? t : t.filter,
        qos = typeof t === "string" || t.qos == null ? 0 : t.qos;
      if (qos !== 0 && qos !== 1) throw err("bad-arg", "Yalnızca QoS 0 ve 1 desteklenir.");
      parts.push(mqttString(checkTopicFilter(filter), "Konu süzgeci"), Uint8Array.of(qos));
    });
    return frame(T.SUBSCRIBE, 2, cat.apply(null, parts));
  }

  // §3.10 UNSUBSCRIBE: bayraklar sabit 0b0010
  function encodeUnsubscribe(o) {
    if (!o.topics || !o.topics.length) throw err("bad-arg", "En az bir konu gerekir (§3.10.3).");
    var parts = [u16(checkPacketId(o.packetId))];
    o.topics.forEach(function (f) {
      parts.push(mqttString(checkTopicFilter(f), "Konu süzgeci"));
    });
    return frame(T.UNSUBSCRIBE, 2, cat.apply(null, parts));
  }

  function encodePingreq() {
    return frame(T.PINGREQ, 0, new Uint8Array(0));
  } // §3.12
  function encodeDisconnect() {
    return frame(T.DISCONNECT, 0, new Uint8Array(0));
  } // §3.14

  // ------------------------------------------------------------------ çözücü (broker → istemci)
  function malformed(msg) {
    return err("malformed", "Bozuk MQTT paketi: " + msg);
  }

  // buf içinden tek paket okur. Eksikse null; tamamsa { packet, length }. Bozuksa fırlatır.
  function decodeOne(buf) {
    buf = toU8(buf);
    if (buf.length < 2) return null;
    var mult = 1,
      rem = 0,
      i = 1,
      b;
    do {
      if (i > 4) throw malformed("kalan uzunluk 4 bayttan uzun (§2.2.3)");
      if (i >= buf.length) return null;
      b = buf[i++];
      rem += (b & 127) * mult;
      mult *= 128;
    } while (b & 128);
    if (buf.length < i + rem) return null;
    var type = buf[0] >> 4,
      flags = buf[0] & 15,
      body = buf.subarray(i, i + rem);
    return { packet: decodeBody(type, flags, body), length: i + rem };
  }

  function expectFlags(name, flags, want) {
    if (flags !== want) throw malformed(name + " sabit başlık bayrakları geçersiz (§2.2.2)");
  }
  function readU16(b, o) {
    return (b[o] << 8) | b[o + 1];
  }

  function decodeBody(type, flags, body) {
    var id, rc, i;
    switch (type) {
      case T.CONNACK: // §3.2
        expectFlags("CONNACK", flags, 0);
        if (body.length !== 2) throw malformed("CONNACK 2 bayt olmalı");
        if (body[0] & 0xfe) throw malformed("CONNACK ayrılmış bitler sıfır olmalı (§3.2.2.1)");
        rc = body[1];
        if (rc > 5) throw malformed("CONNACK dönüş kodu bilinmiyor");
        return {
          type: "connack",
          sessionPresent: (body[0] & 1) === 1,
          returnCode: rc,
          ok: rc === 0,
          message: rc ? CONNACK_TEXT[rc] : "",
        };
      case T.PUBLISH: {
        // §3.3
        var qos = (flags >> 1) & 3;
        if (qos === 3) throw malformed("PUBLISH QoS 3 geçersiz (§3.3.1.2)");
        if (body.length < 2) throw malformed("PUBLISH konu uzunluğu eksik");
        var tl = readU16(body, 0),
          o = 2 + tl;
        if (body.length < o) throw malformed("PUBLISH konu eksik");
        var topic;
        try {
          topic = utf8Text(body.subarray(2, o));
        } catch (e) {
          throw malformed("PUBLISH konu UTF-8 değil");
        }
        if (topic.length === 0 || /[#+\u0000]/.test(topic))
          throw malformed("PUBLISH konu adı geçersiz");
        var pid = null;
        if (qos > 0) {
          if (body.length < o + 2) throw malformed("PUBLISH paket kimliği eksik");
          pid = readU16(body, o);
          o += 2;
          if (pid === 0) throw malformed("paket kimliği 0 olamaz");
        }
        return {
          type: "publish",
          dup: (flags & 8) !== 0,
          qos: qos,
          retain: (flags & 1) !== 0,
          topic: topic,
          packetId: pid,
          payload: body.slice(o),
        };
      }
      case T.PUBACK:
      case T.UNSUBACK: // §3.4, §3.11
        expectFlags(type === T.PUBACK ? "PUBACK" : "UNSUBACK", flags, 0);
        if (body.length !== 2) throw malformed("onay paketi 2 bayt olmalı");
        return { type: type === T.PUBACK ? "puback" : "unsuback", packetId: readU16(body, 0) };
      case T.SUBACK: // §3.9
        expectFlags("SUBACK", flags, 0);
        if (body.length < 3) throw malformed("SUBACK en az bir dönüş kodu taşımalı");
        var codes = [];
        for (i = 2; i < body.length; i++) {
          if ([0, 1, 2, 0x80].indexOf(body[i]) === -1)
            throw malformed("SUBACK dönüş kodu geçersiz (§3.9.3)");
          codes.push(body[i]);
        }
        return {
          type: "suback",
          packetId: readU16(body, 0),
          returnCodes: codes,
          granted: codes.map(function (c) {
            return c !== 0x80;
          }),
        };
      case T.PINGRESP: // §3.13
        expectFlags("PINGRESP", flags, 0);
        if (body.length) throw malformed("PINGRESP gövdesiz olmalı");
        return { type: "pingresp" };
      default:
        throw err("unsupported-packet", "Beklenmeyen MQTT paket türü: " + type);
    }
  }

  // TCP akışı için: parçalı/yapışık baytları besle, tam paketleri al.
  function createParser() {
    var buf = new Uint8Array(0);
    return {
      feed: function (chunk) {
        buf = cat(buf, toU8(chunk));
        var out = [],
          r;
        while ((r = decodeOne(buf)) !== null) {
          out.push(r.packet);
          buf = buf.subarray(r.length);
        }
        buf = buf.slice(); // ilerleyen subarray'in eski belleği tutmasını önle
        return out;
      },
      pending: function () {
        return buf.length;
      },
    };
  }

  // §2.3.1 — oturum başına kullanılan paket kimlikleri: 1..65535, sarmalı, 0 asla
  function packetIds() {
    var n = 0;
    return function () {
      n = (n % 65535) + 1;
      return n;
    };
  }

  var packets = {
    TYPES: T,
    encodeConnect: encodeConnect,
    encodePublish: encodePublish,
    encodePuback: encodePuback,
    encodeSubscribe: encodeSubscribe,
    encodeUnsubscribe: encodeUnsubscribe,
    encodePingreq: encodePingreq,
    encodeDisconnect: encodeDisconnect,
    decodeOne: decodeOne,
    createParser: createParser,
    packetIds: packetIds,
    topicMatches: topicMatches,
    text: utf8Text,
  };

  // ================================================================== Zigbee2MQTT
  // Durum: zigbee2mqtt/<ad> (JSON). Komut: zigbee2mqtt/<ad>/set (yalnızca JSON). Okuma isteği:
  // zigbee2mqtt/<ad>/get ile {"state":""}. Kullanılabilirlik: zigbee2mqtt/<ad>/availability →
  // {"state":"online"|"offline"}. Cihaz listesi: zigbee2mqtt/bridge/devices (retained JSON dizisi).
  // Parlaklık ham değeri `brightness` özelliğinin value_min..value_max aralığındadır (belgedeki örnek 0..254).
  var Z2M_DEFAULT_BRIGHTNESS_MAX = 254;

  function parseJson(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return undefined;
    }
  }
  function isObj(x) {
    return x !== null && typeof x === "object" && !Array.isArray(x);
  }
  function clampPct(v) {
    var n = Math.round(Number(v));
    if (!isFinite(n)) throw err("bad-arg", "Parlaklık sayı olmalı.");
    return Math.max(0, Math.min(100, n));
  }
  function unsupported(proto, cap) {
    return err("unsupported", proto + ": '" + cap + "' desteklenmiyor.");
  }

  function z2mCheckName(name) {
    if (
      typeof name !== "string" ||
      !name ||
      /[#+]/.test(name) ||
      name.charAt(0) === "/" ||
      name.charAt(name.length - 1) === "/"
    )
      throw err("bad-arg", "Zigbee2MQTT cihaz adı geçersiz.");
    return name;
  }
  function z2mTopics(name, base) {
    var p = (base || "zigbee2mqtt") + "/" + z2mCheckName(name);
    return { state: p, set: p + "/set", get: p + "/get", availability: p + "/availability" };
  }

  // bridge/devices → denetlenebilir cihazlar. Koordinatör ve desteklenmeyenler atlanır; yetenekler `exposes`'tan okunur.
  function z2mParseDevices(text) {
    var arr = parseJson(text);
    if (!Array.isArray(arr)) return { devices: [], skipped: 0 };
    var devices = [],
      skipped = 0;
    arr.forEach(function (d) {
      if (
        !isObj(d) ||
        d.type === "Coordinator" ||
        d.supported === false ||
        !isObj(d.definition) ||
        typeof d.friendly_name !== "string"
      ) {
        skipped++;
        return;
      }
      var caps = [],
        kind = null,
        max = Z2M_DEFAULT_BRIGHTNESS_MAX;
      (Array.isArray(d.definition.exposes) ? d.definition.exposes : []).forEach(function (ex) {
        if (
          !isObj(ex) ||
          (ex.type !== "light" && ex.type !== "switch") ||
          !Array.isArray(ex.features)
        )
          return;
        ex.features.forEach(function (f) {
          if (!isObj(f)) return;
          if (f.name === "state" && caps.indexOf("switch") === -1) caps.push("switch");
          if (f.name === "brightness" && caps.indexOf("brightness") === -1) {
            caps.push("brightness");
            if (typeof f.value_max === "number" && f.value_max > 0) max = f.value_max;
          }
        });
        kind = ex.type === "light" ? "light" : kind || "plug";
      });
      if (!caps.length) {
        skipped++;
        return;
      }
      devices.push({
        id: d.ieee_address || d.friendly_name,
        name: d.friendly_name,
        model: d.definition.model || null,
        vendor: d.definition.vendor || null,
        kind: kind,
        caps: caps,
        brightnessMax: max,
      });
    });
    return { devices: devices, skipped: skipped };
  }

  function z2mParseState(text, opts) {
    var s = parseJson(text),
      max = (opts && opts.brightnessMax) || Z2M_DEFAULT_BRIGHTNESS_MAX;
    if (!isObj(s)) return null;
    return {
      switch: s.state === "ON" ? true : s.state === "OFF" ? false : null,
      brightness: typeof s.brightness === "number" ? clampPct((s.brightness / max) * 100) : null,
    };
  }
  function z2mParseAvailability(text) {
    var s = parseJson(text);
    if (!isObj(s)) return null;
    return s.state === "online" ? true : s.state === "offline" ? false : null;
  }
  function z2mCommand(name, capability, value, opts, base) {
    var t = z2mTopics(name, base),
      max = (opts && opts.brightnessMax) || Z2M_DEFAULT_BRIGHTNESS_MAX;
    if (capability === "switch")
      return { topic: t.set, payload: JSON.stringify({ state: value ? "ON" : "OFF" }) };
    if (capability === "brightness")
      return {
        topic: t.set,
        payload: JSON.stringify({ brightness: Math.round((clampPct(value) / 100) * max) }),
      };
    throw unsupported("zigbee2mqtt", capability);
  }
  function z2mQuery(name, base) {
    return { topic: z2mTopics(name, base).get, payload: JSON.stringify({ state: "" }) };
  }

  var z2m = {
    bridgeDevicesTopic: function (base) {
      return (base || "zigbee2mqtt") + "/bridge/devices";
    },
    topics: z2mTopics,
    parseDevices: z2mParseDevices,
    parseState: z2mParseState,
    parseAvailability: z2mParseAvailability,
    command: z2mCommand,
    query: z2mQuery,
  };

  // ================================================================== Tasmota
  // Yalnızca varsayılan FullTopic (%prefix%/%topic%/) desteklenir. Komut: cmnd/<konu>/POWER[n] (yük on/off),
  // cmnd/<konu>/Dimmer (0..100). Yanıt: stat/<konu>/RESULT → {"POWER":"ON"}; stat/<konu>/POWER → ON.
  // Boş yük mevcut durumu sorgular (belge: "An empty payload asks for the current status"). Kullanılabilirlik:
  // tele/<konu>/LWT = Online|Offline. NOT: `Dimmer` anahtarının RESULT/tele STATE içindeki biçimi ve
  // tele/<konu>/STATE getirilen belge sayfalarında örneklenmiyor; RESULT ile aynı çözülür — cihazda doğrulanmalı.
  function tasCheckTopic(topic) {
    if (typeof topic !== "string" || !topic || /[#+/]/.test(topic))
      throw err("bad-arg", "Tasmota konusu geçersiz.");
    return topic;
  }
  function tasRelay(relay) {
    if (relay == null) return "";
    if (!(relay >= 1 && relay <= 8) || Math.floor(relay) !== relay)
      throw err("bad-arg", "Röle numarası 1..8 olmalı.");
    return String(relay);
  }
  function tasTopics(topic, relay) {
    var t = tasCheckTopic(topic),
      r = tasRelay(relay);
    return {
      cmndPower: "cmnd/" + t + "/POWER" + r,
      cmndDimmer: "cmnd/" + t + "/Dimmer",
      statResult: "stat/" + t + "/RESULT",
      statPower: "stat/" + t + "/POWER" + r,
      teleState: "tele/" + t + "/STATE",
      lwt: "tele/" + t + "/LWT",
    };
  }
  function tasCommand(topic, capability, value, relay) {
    var t = tasTopics(topic, relay);
    if (capability === "switch") return { topic: t.cmndPower, payload: value ? "on" : "off" };
    if (capability === "brightness")
      return { topic: t.cmndDimmer, payload: String(clampPct(value)) };
    throw unsupported("tasmota", capability);
  }
  function tasQuery(topic, relay) {
    return { topic: tasTopics(topic, relay).cmndPower, payload: "" };
  }

  function tasOnOff(v) {
    if (typeof v !== "string") return null;
    v = v.trim().toUpperCase();
    return v === "ON" ? true : v === "OFF" ? false : null;
  }
  // Gelen yayını çözer: { switch?, brightness?, available? } ya da ilgisizse null.
  function tasParse(deviceTopic, relay, msgTopic, text) {
    var t = tasTopics(deviceTopic, relay),
      out = {},
      key = "POWER" + tasRelay(relay),
      j,
      sw;
    if (msgTopic === t.lwt) {
      var v = String(text).trim().toLowerCase();
      return v === "online" ? { available: true } : v === "offline" ? { available: false } : null;
    }
    if (msgTopic === t.statPower) {
      sw = tasOnOff(text);
      return sw === null ? null : { switch: sw };
    }
    if (msgTopic === t.statResult || msgTopic === t.teleState) {
      j = parseJson(text);
      if (!isObj(j)) return null;
      // tek röleli cihazlarda anahtar "POWER", rölesi seçilmişse "POWER<n>"; röle 1 için ikisi de olabilir
      sw = tasOnOff(j[key]);
      if (sw === null && relay === 1) sw = tasOnOff(j.POWER);
      if (sw !== null) out.switch = sw;
      if (typeof j.Dimmer === "number" && j.Dimmer >= 0 && j.Dimmer <= 100)
        out.brightness = Math.round(j.Dimmer);
      return Object.keys(out).length ? out : null;
    }
    return null;
  }

  var tasmota = { topics: tasTopics, command: tasCommand, query: tasQuery, parse: tasParse };

  global.nexusMqtt = { packets: packets, z2m: z2m, tasmota: tasmota };
})(typeof window !== "undefined" ? window : this);
