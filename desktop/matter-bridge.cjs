// NEXUS Matter köprüsü — matter.js (Apache-2.0) ile yerel ağdan Matter cihazı eşleştirir, okur ve komut gönderir.
// Yalnızca masaüstü uygulamasında çalışır (UDP/mDNS gerekir). Bulut ve hesap yoktur: eşleştirme cihazın kendi kodu iledir.
// Denetleyici ilk kullanımda başlar; yapı (fabric) ve eşleşmiş düğümler `storageDir` altında saklanır (matter.js'in kendi deposu,
// işletim sistemi anahtarlığıyla şifrelenmez). UYARI: Gerçek donanımla DOĞRULANMADI; yalnızca matter.js'in sanal cihazıyla denendi.
"use strict";

// Cihaz türü kimliği → NEXUS türü (Matter Device Library: Aydınlatma 0x0100/0x0101/0x010C/0x010D, Prizler 0x010A/0x010B)
const LIGHT_TYPES = new Set([0x0100, 0x0101, 0x010c, 0x010d]);
const PLUG_TYPES = new Set([0x010a, 0x010b]);

function normalizePairingCode(input) {
  const text = String(input || "").trim();
  if (/^MT:[A-Z0-9.\-]{6,}$/i.test(text)) return text.toUpperCase();
  const digits = text.replace(/[\s-]/g, "");
  return /^\d{11}$|^\d{21}$/.test(digits) ? digits : null;
}

function kindOf(deviceTypes, hasLevel) {
  if (deviceTypes.some((t) => LIGHT_TYPES.has(t))) return "light";
  if (deviceTypes.some((t) => PLUG_TYPES.has(t))) return "plug";
  return hasLevel ? "light" : "switch";
}

// Matter yetenek bilgisini NEXUS yeteneklerine çevirir (saf işlev: test edilir).
function capsOf(supported, colorFeatures) {
  const caps = ["switch"];
  if (supported.levelControl) caps.push("brightness");
  if (supported.colorControl && colorFeatures && colorFeatures.hueSaturation) caps.push("color");
  if (supported.colorControl && colorFeatures && colorFeatures.colorTemperature) caps.push("colorTemp");
  return caps;
}

function createMatterBridge(options) {
  const storageDir = options.storageDir;
  let ctlPromise = null;
  let ctl = null;
  let commissioning = false;

  function controller() {
    if (!ctlPromise) {
      ctlPromise = (async () => {
        const { Environment, ServerNode } = await import("@matter/main");
        Environment.default.vars.set("storage.path", storageDir);
        const node = await ServerNode.create({ id: "nexus-controller" });
        await node.start();
        ctl = node;
        return node;
      })().catch((e) => {
        ctlPromise = null;
        throw e;
      });
    }
    return ctlPromise;
  }

  // Düğümün parçalarını (uç noktalarını) derinlemesine dolaşır; kök uç nokta dahil değildir.
  function flatten(endpoint, out) {
    for (const part of endpoint.parts) {
      out.push(part);
      flatten(part, out);
    }
    return out;
  }
  function supportsBehavior(ep, id) {
    try {
      return ep.stateOf(id) !== undefined;
    } catch {
      return false;
    }
  }
  function describeEndpoint(ep) {
    const supported = {
      onOff: supportsBehavior(ep, "onOff"),
      levelControl: supportsBehavior(ep, "levelControl"),
      colorControl: supportsBehavior(ep, "colorControl"),
    };
    if (!supported.onOff) return null;
    let types = [];
    try {
      types = (ep.stateOf("descriptor").deviceTypeList || []).map((d) => Number(d.deviceType));
    } catch {
      /* tanımlayıcı yok */
    }
    let colorFeatures = null;
    if (supported.colorControl) {
      try {
        colorFeatures = ep.stateOf("colorControl").featureMap || null;
      } catch {
        /* özellik haritası okunamadı */
      }
    }
    return { endpoint: Number(ep.number), kind: kindOf(types, supported.levelControl), caps: capsOf(supported, colorFeatures) };
  }
  function describePeer(peer) {
    let name = "";
    try {
      const b = peer.stateOf("basicInformation");
      name = b.nodeLabel || b.productName || "";
    } catch {
      /* temel bilgi yok */
    }
    let model = "";
    try {
      model = peer.stateOf("basicInformation").productName || "";
    } catch {
      /* temel bilgi yok */
    }
    return {
      peerId: String(peer.id),
      name: name || "Matter cihazı",
      model: model || "Matter",
      endpoints: flatten(peer, []).map(describeEndpoint).filter(Boolean),
    };
  }

  async function findEndpoint(peerId, endpointNumber) {
    const node = await controller();
    const peer = [...node.peers].find((p) => String(p.id) === String(peerId));
    if (!peer) throw new Error("Bu Matter cihazı bu bilgisayarda kayıtlı değil. Cihazı yeniden ekle.");
    const ep = flatten(peer, []).find((e) => Number(e.number) === Number(endpointNumber));
    if (!ep) throw new Error("Matter cihazının bu bölümü bulunamadı.");
    return ep;
  }

  function withTimeout(promise, ms, message) {
    let timer;
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]).finally(() => clearTimeout(timer));
  }

  return {
    normalizePairingCode,
    // Eşleştirme: cihazın kendi kodu (11/21 haneli ya da MT:… QR içeriği). Aynı anda tek eşleştirme.
    async commission(opts) {
      const code = normalizePairingCode(opts && opts.pairingCode);
      if (!code) throw new Error("Eşleştirme kodu geçersiz. 11 haneli kodu ya da MT: ile başlayan QR içeriğini gir.");
      if (commissioning) throw new Error("Başka bir Matter eşleştirmesi sürüyor.");
      commissioning = true;
      try {
        const node = await controller();
        const { Seconds } = await import("@matter/main");
        const known = new Set([...node.peers].map((p) => String(p.id)));
        // matter.js hata iletileri İngilizcedir; kullanıcıya anlaşılır Türkçe bir ileti verilir.
        const notFound = "Cihaz bulunamadı. Aynı ağda, açık ve eşleştirme modunda olduğundan emin ol. Bilgisayarın güvenlik duvarı yerel ağdaki cihazların yanıtını engelliyor olabilir.";
        const peer = await withTimeout(
          node.peers.commission({ pairingCode: code, timeout: Seconds(60) }).catch((e) => {
            const text = String((e && e.message) || "");
            throw new Error(/discover|timeout|timed out/i.test(text) ? notFound : "Cihaz eşleştirilemedi. Eşleştirme kodunu ve cihazın eşleştirme modunda olduğunu kontrol et.");
          }),
          90000,
          notFound,
        );
        const info = describePeer(peer);
        if (known.has(info.peerId)) throw new Error("Bu cihaz zaten ekli.");
        if (!info.endpoints.length) {
          await peer.decommission().catch(() => {});
          throw new Error("Cihaz eşleşti ama NEXUS'un kontrol edebileceği bir işlevi yok.");
        }
        return info;
      } finally {
        commissioning = false;
      }
    },
    async list() {
      const node = await controller();
      return [...node.peers].map(describePeer);
    },
    // Ham Matter durumu (abonelikle güncel tutulur); çevirme bağlayıcıda yapılır.
    async read(opts) {
      const ep = await findEndpoint(opts.peerId, opts.endpoint);
      const out = { onOff: ep.stateOf("onOff").onOff };
      if (supportsBehavior(ep, "levelControl")) out.currentLevel = ep.stateOf("levelControl").currentLevel;
      if (supportsBehavior(ep, "colorControl")) {
        const c = ep.stateOf("colorControl");
        out.colorMode = c.colorMode;
        out.colorTemperatureMireds = c.colorTemperatureMireds;
        out.currentHue = c.currentHue;
        out.currentSaturation = c.currentSaturation;
      }
      return out;
    },
    // action: on | off | level{level 1–254} | hueSat{hue,saturation 0–254} | colorTemp{mireds}
    async write(opts) {
      const ep = await findEndpoint(opts.peerId, opts.endpoint);
      const none = { optionsMask: {}, optionsOverride: {} };
      const run = async () => {
        switch (opts.action) {
          case "on":
            return ep.commandsOf("onOff").on();
          case "off":
            return ep.commandsOf("onOff").off();
          case "level":
            return ep.commandsOf("levelControl").moveToLevelWithOnOff({ level: Number(opts.level), transitionTime: null, ...none });
          case "hueSat":
            await ep.commandsOf("onOff").on();
            return ep.commandsOf("colorControl").moveToHueAndSaturation({ hue: Number(opts.hue), saturation: Number(opts.saturation), transitionTime: 0, ...none });
          case "colorTemp":
            await ep.commandsOf("onOff").on();
            return ep.commandsOf("colorControl").moveToColorTemperature({ colorTemperatureMireds: Number(opts.mireds), transitionTime: 0, ...none });
          default:
            throw new Error("Desteklenmeyen Matter komutu.");
        }
      };
      await withTimeout(run(), 15000, "Cihaz yanıt vermedi. Açık ve aynı ağda olduğundan emin ol.");
      return { ok: true };
    },
    async remove(opts) {
      const node = await controller();
      const peer = [...node.peers].find((p) => String(p.id) === String(opts.peerId));
      if (!peer) return { ok: true };
      try {
        await withTimeout(peer.decommission(), 20000, "zaman aşımı");
      } catch {
        /* cihaz çevrimdışıysa yalnızca bu bilgisayardan kaldırılır */
      }
      await peer.delete().catch(() => {});
      return { ok: true };
    },
    async close() {
      if (ctl) {
        const node = ctl;
        ctl = null;
        ctlPromise = null;
        await node.close().catch(() => {});
      }
    },
  };
}

module.exports = { createMatterBridge, normalizePairingCode, kindOf, capsOf };
