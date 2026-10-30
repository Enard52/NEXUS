// NEXUS — Electron için chacha20-poly1305 polyfill (hap-nodejs / HomeKit köprüsü).
//
// Sorun: Electron, Node'un OpenSSL katmanını BoringSSL ile bağlar; bu derlemede
// 'chacha20-poly1305' AEAD şifresi crypto.getCiphers() listesinde YOK ve
// createCipheriv('chacha20-poly1305') ERR_CRYPTO_UNKNOWN_CIPHER verir. hap-nodejs
// ise açılışta bu şifrenin varlığını assert eder ve HAP oturum şifrelemesinde
// (Pair Verify sonrası güvenlik katmanı) kullanır — köprü bu yüzden Electron'da
// hiç yüklenemiyordu ("kullanılamıyor" durumuna düşüyordu).
//
// Çözüm: saf-JS @noble/ciphers (denetimli, yerel bağımlılık yok) üzerinden gerçek
// ChaCha20-Poly1305; crypto.createCipheriv/createDecipheriv bu algoritma için
// shim'lenir. Diğer algoritmalar (AES vb.) BoringSSL'de zaten çalışır — yalnızca
// eksik olan bu şifre yamalanır. Gerçek Node.js çalışma zamanında liste zaten
// tamdır ve bu modül hiçbir şey yapmaz.
//
// Doğrulama: RFC 8439 §2.8.2 resmî AEAD vektörleri yüklenirken bir kez koşulur;
// geçemezse modül yüklenmeyi reddeder (sessiz bozuk köprü olmasın).
"use strict";

const crypto = require("node:crypto");

if (crypto.getCiphers().includes("chacha20-poly1305") &&
    typeof crypto.createCipheriv("chacha20-poly1305", Buffer.alloc(32, 7), Buffer.alloc(12, 1), { authTagLength: 16 }) === "object") {
  // Gerçek OpenSSL: yamaya gerek yok.
  module.exports = function installChaChaPolyfill() { /* zaten var */ };
  return;
}

const { chacha20poly1305 } = require("@noble/ciphers/chacha");

const TAG_LEN = 16;

// --- RFC 8439 §2.8.2 vektörleri (Poly1305 anahtarı türetimi dahil uçtan uca) ---
const V_KEY = Buffer.from("808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f", "hex");
const V_NONCE = Buffer.from("070000004041424344454647", "hex");
const V_AAD = Buffer.from("50515253c0c1c2c3c4c5c6c7", "hex");
const V_PT = Buffer.from("4c616469657320616e642047656e746c656d656e206f662074686520636c617373206f66202739393a204966204920636f756c64206f6666657220796f75206f6e6c79206f6e652074697020666f7220746865206675747572652c2073756e73637265656e20776f756c642062652069742e", "hex");
const V_CT = Buffer.from("d31a8d34648e60db7b86afbc53ef7ec2a4aded51296e08fea9e2b5a736ee62d63dbea45e8ca9671282fafb69da92728b1a71de0a9e060b2905d6a5b67ecd3b3692ddbd7f2d778b8c9803aee328091b58fab324e4fad675945585808b4831d7bc3ff4def08e4b7a9de576d26586cec64b6116", "hex");
const V_TAG = Buffer.from("1ae10b594f09e26a7e902ecbd0600691", "hex");

(function selfCheck() {
  const sealed = Buffer.from(chacha20poly1305(V_KEY, V_NONCE, V_AAD).encrypt(V_PT));
  const ct = sealed.subarray(0, sealed.length - TAG_LEN);
  const tag = sealed.subarray(sealed.length - TAG_LEN);
  if (!ct.equals(V_CT) || !tag.equals(V_TAG)) {
    throw new Error("chacha-polyfill: RFC 8439 vektörü geçilemedi — köprü başlatılmayacak");
  }
  const back = Buffer.from(chacha20poly1305(V_KEY, V_NONCE, V_AAD).decrypt(sealed));
  if (!back.equals(V_PT)) {
    throw new Error("chacha-polyfill: gidiş-dönüş vektörü geçilemedi");
  }
})();

// OpenSSL arayüzü: hap yalnızca şu çağrı dizisini kullanır (hapCrypto.js):
//   cipher:  setAAD? → update(pt) → final() → getAuthTag()
//   decipher: setAAD? → setAuthTag(tag) → update(ct) → final() (bütünlük hatasında throw)
function cipherShim(key, nonce, aad, forDecrypt, presetTag) {
  let data = null;
  let tag = presetTag || null;
  let out = null;
  const aead = () => chacha20poly1305(key, nonce, aad || undefined);
  return {
    setAAD(buf) { aad = Buffer.from(buf); return this; },
    setAuthTag(buf) { tag = Buffer.from(buf); return this; },
    update(buf) {
      if (data !== null) throw new Error("chacha-polyfill: tek parça update bekleniyor (hap kullanımı)");
      data = Buffer.from(buf);
      if (forDecrypt) {
        if (!tag) throw new Error("chacha-polyfill: setAuthTag çağrılmadan decrypt");
        const pt = Buffer.from(aead().decrypt(Buffer.concat([data, tag]))); // bütünlük burada doğrulanır
        out = Buffer.alloc(0);
        return pt; // hap, update dönüşünü kullanır (OpenSSL davranışı)
      }
      const sealed = Buffer.from(aead().encrypt(data));
      tag = sealed.subarray(sealed.length - TAG_LEN);
      out = Buffer.alloc(0);
      return sealed.subarray(0, sealed.length - TAG_LEN);
    },
    final() { return out || Buffer.alloc(0); },
    getAuthTag() { if (!tag) throw new Error("chacha-polyfill: getAuthTag erken"); return Buffer.from(tag); },
  };
}

function installChaChaPolyfill() {
  if (crypto.__nexusChaChaPatched) return;
  crypto.__nexusChaChaPatched = true;
  const origGetCiphers = crypto.getCiphers.bind(crypto);
  crypto.getCiphers = function () { return origGetCiphers().concat(["chacha20-poly1305"]); };
  const origCreateCipheriv = crypto.createCipheriv.bind(crypto);
  crypto.createCipheriv = function (alg, key, iv, opts) {
    if (alg === "chacha20-poly1305") return cipherShim(key, iv, null, false, null);
    return origCreateCipheriv(alg, key, iv, opts);
  };
  const origCreateDecipheriv = crypto.createDecipheriv.bind(crypto);
  crypto.createDecipheriv = function (alg, key, iv, opts) {
    if (alg === "chacha20-poly1305") return cipherShim(key, iv, null, true, null);
    return origCreateDecipheriv(alg, key, iv, opts);
  };
}

module.exports = installChaChaPolyfill;
