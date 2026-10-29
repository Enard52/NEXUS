// NEXUS — HomeKit (HAP) köprüsü: masaüstü uygulamasında yerel aksesuar sunucu.
//
// Ne yapar: NEXUS'taki switch/brightness yetenekli LAN cihazlarını gerçek bir
// HomeKit Köprüsü (hap-nodejs, MIT) olarak yerel ağda yayınlar. Apple Ev (iPhone/
// iPad/Mac) uygulaması eşleşme koduyla köprüye bağlanır; anahtar/brightness
// karakteristikleri cihaza NEXUS'un KENDİ komut yolundan (renderer → setField)
// gönderilir. Köprü Apple'ın "partnership" izni gerektirmez (accessory server
// tarafı ücretsiz; Homebridge'in kullandığı protokol).
//
// Kapsam (v1, dürüst): a) sadece "switch" yeteneği olan cihazlar,
// b) ışık + parllaklık varsa Brightness, c) cover/lock/vacuum gibi zor tip
// Apple eşlemesi köprü girişinde BİLİNÇLİ OLARAK DIŞARIDA (rehber: HA yolu).
// d) Eşleşme kalıcı (userData altında saklanır); Apple Ev son eşleşmeyi unutmaz.
//
// Sözleşme:
//   kitBridge.startKn(opts) — opts: { persistPath, name?, port?,
//     devices: [{ id, name, kind, category:"light"|"outlet", brightness?, state:{switch, brightness} }],
//     onCommand: async (device, patch) => ({ ok, state? })) }
//   kitBridge.onStatePatch(id, patch) — renderer'dan durum bildirimi
//   kitBridge.stop() / kitBridge.status()
//   onStatus: (st) => void — durum değişince ana süreç UI'a yansıtır.
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const hap = require("hap-nodejs");
const { Accessory, Bridge, Categories, Characteristic, Service, uuid, HAPStorage } = hap;

let state = {
  running: false,
  starting: false,
  bridge: null,
  accessories: new Map(), // id -> { acc, onChar, briChar, device }
  pincode: null,
  username: null,
  port: null,
  lastError: null,
  onStatus: null,
};

function emitStatus(patch) {
  const st = Object.assign(status(), patch || {});
  if (typeof state.onStatus === "function") {
    try {
      state.onStatus(st);
    } catch (e) {
      /* UI bildirimi akışı bozmasın */
    }
  }
}

function safeStorage(persistPath) {
  try {
    fs.mkdirSync(persistPath, { recursive: true });
    if (
      HAPStorage &&
      HAPStorage.INSTANCE &&
      typeof HAPStorage.INSTANCE.setCustomStoragePath === "function"
    ) {
      HAPStorage.INSTANCE.setCustomStoragePath(persistPath);
      return true;
    }
  } catch (e) {
    /* depolama yoksa eşleşme oturumlar arası kalıcı olmaz — aksı yeterli değil */
  }
  return false;
}

function readIdentity(persistPath) {
  const p = path.join(persistPath, "kit-identity.json");
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    if (j && /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(j.username)) return j;
  } catch (e) {}
  let username = "";
  const hex = () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .toUpperCase()
      .padStart(2, "0");
  for (let i = 0; i < 6; i++) username += (i ? ":" : "") + hex();
  const j = { username, createdAt: new Date().toISOString() };
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  return j;
}

function accessoryFor(device) {
  const isLight = device.category === "light";
  const accId = uuid.generate("nexus-device:" + device.id);
  const acc = new Accessory(device.name, accId);
  const svc = acc.addService(isLight ? Service.Lightbulb : Service.Outlet, device.name);
  const onChar = svc.getCharacteristic(Characteristic.On);
  if (device.brightness && isLight) {
    svc.addCharacteristic(Characteristic.Brightness);
  }
  return { acc, svc, onChar };
}

function startKn(opts) {
  return new Promise((resolve, reject) => {
    if (state.running) return resolve(status());
    if (state.starting) return reject(new Error("köprü başlatma sürüyor"));
    state.starting = true;
    state.lastError = null;
    try {
      safeStorage(opts.persistPath);
      const ident = readIdentity(opts.persistPath);
      const pincode = /^(\d{3})-(\d{2})-(\d{3})$/.test(opts.pincode || "")
        ? opts.pincode
        : "154-87-269";

      const bridge = new Bridge(opts.name || "NEXUS", uuid.generate("nexus-kit:bridge"));
      bridge.on("listening", (port) => {
        if (state.bridge !== bridge) return; /* stop() çağrıldıysa ses verme */
        state.running = true;
        state.starting = false;
        state.port = port;
        state.username = ident.username;
        state.pincode = pincode;
        emitStatus({ running: true });
        resolve(status());
      });

      bridge.on("identify", () => {
        /* Apple Ev "konfigüre et" dokunuşu: aksiyon gerekmiyor */
      });

      for (const device of opts.devices || []) {
        if (!device || !device.id || !device.name) continue;
        const { acc, svc, onChar } = accessoryFor(device);
        state.accessories.set(device.id, { acc, onChar, device, briChar: null });
        if (device.brightness && device.category === "light") {
          const briChar = svc.getCharacteristic(Characteristic.Brightness);
          state.accessories.get(device.id).briChar = briChar;
          briChar.on("set", (value, cb) => {
            const entry = state.accessories.get(device.id);
            if (!entry) return cb(new Error("köprü durdurulmuş"));
            const d = entry.device;
            Promise.resolve(
              opts.onCommand(d, { brightness: Math.max(0, Math.min(100, Number(value) | 0)) }),
            )
              .then((r) => {
                if (r && r.state && typeof r.state.brightness === "number") {
                  try {
                    briChar.updateValue(r.state.brightness);
                  } catch (e2) {}
                }
                cb(null);
              })
              .catch((e) => cb(e));
          });
          /* Başlangıç değeri "set" dinlerini TETİKLEMESİN: updateValue yalnız bildirir.
             (setValue başlangıçta yanlışlıkla cihazlara setState komutları gönderebilir.) */
          briChar.updateValue(
            device.state && typeof device.state.brightness === "number"
              ? Math.max(0, Math.min(100, device.state.brightness))
              : 100,
          );
        }
        onChar.on("set", (value, cb) => {
          const entry = state.accessories.get(device.id);
          if (!entry) return cb(new Error("köprü durdurulmuş"));
          const d = entry.device;
          Promise.resolve(opts.onCommand(d, { switch: !!value }))
            .then((r) => {
              if (r && r.state && typeof r.state.switch === "boolean") {
                try {
                  onChar.updateValue(r.state.switch);
                } catch (e2) {}
              }
              cb(null);
            })
            .catch((e) => cb(e));
        });
        /* switch için de aynı: başlangıç değeri sessizce yazılır (komut YOLLANMAZ) */
        onChar.updateValue(
          device.state && typeof device.state.switch === "boolean" ? device.state.switch : false,
        );
        bridge.addBridgedAccessory(acc);
      }

      state.bridge = bridge;

      // Port çakışması: 51826 meşgulse sıradakini dene.
      const tryPublish = (port, attempts) => {
        try {
          if (state.bridge !== bridge) return reject(new Error("köprü başlangıçta durduruldu"));
          bridge.publish(
            {
              username: ident.username,
              pincode: pincode,
              category: Categories.BRIDGE,
              port: port,
            },
            true,
          );
        } catch (e) {
          const msg = String(e && e.message);
          if (attempts > 0 && /EADDR|in use|occupied/i.test(msg)) {
            return tryPublish(port + 1, attempts - 1);
          }
          state.starting = false;
          state.lastError = msg.slice(0, 200);
          emitStatus({});
          return reject(new Error(state.lastError));
        }
      };
      tryPublish(opts.port || 51826, 8);
    } catch (e) {
      state.starting = false;
      state.lastError = String(e && e.message).slice(0, 300);
      emitStatus({});
      reject(e);
    }
  });
}

function stop() {
  const b = state.bridge;
  state.bridge = null;
  state.running = false;
  state.accessories = new Map();
  emitStatus({ running: false });
  if (b) {
    try {
      b.unpublish();
    } catch (e) {}
  }
  return { stopped: true, running: false };
}

function status() {
  const list = [];
  state.accessories.forEach((entry, id) => {
    list.push({ id: id, name: entry.device.name, category: entry.device.category });
  });
  return {
    running: state.running,
    starting: state.starting,
    pincode: state.pincode,
    username: state.username,
    port: state.port,
    lastError: state.lastError,
    accessoryCount: list.length,
    accessories: list,
  };
}

function onStatePatch(id, patch) {
  const e = state.accessories.get(id);
  if (!e) return false;
  if (patch && typeof patch.switch === "boolean") {
    try {
      e.onChar.updateValue(patch.switch);
    } catch (err) {}
  }
  if (patch && typeof patch.brightness === "number" && e.briChar) {
    try {
      e.briChar.updateValue(Math.max(0, Math.min(100, patch.brightness)));
    } catch (err) {}
  }
  return true;
}

module.exports = { startKn, stop, status, onStatePatch };
