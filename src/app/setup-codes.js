// NEXUS — kurulum kodu / QR içeriği çözümleme (QR tarama ve kurulum kodu ekranları ortak kullanır).
// Gerçek olmayan bir cihaz asla eklenmez: yalnızca yerel ağda doğrulanabilen adresler eşleştirme
// ekranına aktarılır; Matter/HomeKit kodları için dürüst bir açıklama döner.
(function () {
  "use strict";

  function privateIp(host) {
    var m = String(host || "").match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!m) return false;
    var a = +m[1], b = +m[2];
    return a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || a === 127;
  }

  // Dönen tür: "lan" (host ile), "matter", "homekit", "wifi", "unknown"
  window.nexusParseSetupCode = function (raw) {
    var value = String(raw || "").trim();
    if (!value) return { type: "unknown" };
    if (/^MT:/i.test(value)) return { type: "matter" };
    if (/^X-HM:\/\//i.test(value)) return { type: "homekit" };
    if (/^WIFI:/i.test(value)) return { type: "wifi" };
    var url = value.match(/^https?:\/\/([^/:?#]+)(?::(\d{1,5}))?/i);
    if (url && (privateIp(url[1]) || /\.local$/i.test(url[1]))) {
      return { type: "lan", host: url[1] + (url[2] ? ":" + url[2] : "") };
    }
    var ip = value.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::(\d{1,5}))?$/);
    if (ip && privateIp(ip[1])) return { type: "lan", host: ip[1] + (ip[2] ? ":" + ip[2] : "") };
    var digits = value.replace(/[\s-]/g, "");
    if (/^\d{8}$/.test(digits)) return { type: "homekit" };
    if (/^\d{11}$|^\d{21}$/.test(digits)) return { type: "matter" };
    return { type: "unknown" };
  };

  window.nexusSetupCodeMessage = function (type) {
    switch (type) {
      case "matter":
        return { title: "Matter kurulum kodu", text: "Matter cihazlarını eklemek için bir Matter denetleyicisi gerekir; NEXUS bu desteği henüz sunmuyor. Cihaz Wi-Fi ile bağlanıyorsa yerel ağdan IP adresiyle ekleyebilirsin." };
      case "homekit":
        return { title: "HomeKit kurulum kodu", text: "Bu 8 haneli kod Apple HomeKit eşleştirmesi içindir ve yalnızca Apple Ev uygulamasıyla kullanılır. Cihaz Shelly, WLED, Tasmota gibi yerel API destekliyorsa yerel ağdan ekleyebilirsin." };
      case "wifi":
        return { title: "Wi-Fi ağ bilgisi", text: "Bu QR kodu bir Wi-Fi ağına aittir, cihaz değildir. Cihazı aynı ağa bağladıktan sonra yerel ağdan ekleyebilirsin." };
      default:
        return { title: "Kod tanınmadı", text: "Bu kod desteklenen bir cihaz kodu değil. Cihazın IP adresini biliyorsan yerel ağdan ekleyebilirsin." };
    }
  };

  window.nexusOpenLanPairing = function (host) {
    location.href = "nexus-pair.html" + (host ? "?host=" + encodeURIComponent(host) : "") + "#lan-scan-section";
  };
})();
