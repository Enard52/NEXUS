// Android artık "test" değil: site metinlerinden test ifadelerini kaldırır. Idempotent. Usage: node site-android.cjs <siteDir>
const fs = require("fs");
const path = require("path");
const root = process.argv[2];
const R = [
  [
    "Windows and Linux apps you can download today, plus an Android test build. iOS is coming soon.",
    "Windows, Linux and Android apps you can download today. iOS is coming soon.",
  ],
  ["Windows and Linux apps, Android test build", "Windows, Linux and Android apps"],
  ["Test APK · Android 7+", "Android APK · Android 7+"],
  ["Download test APK", "Download Android APK"],
  [
    "Allow installs from this source in Android settings. Test build; the Google Play version comes later.",
    "Allow installs from this source in Android settings. The Google Play version comes later.",
  ],
  ["Android (test) & iOS (soon)", "Android & iOS (soon)"],
  ["Android (test) &amp; iOS (soon)", "Android &amp; iOS (soon)"],
  [
    "Windows ve Linux uygulamaları bugün indirilebilir, ayrıca Android test sürümü var. iOS yakında.",
    "Windows, Linux ve Android uygulamaları bugün indirilebilir. iOS yakında.",
  ],
  ["Windows ve Linux uygulamaları, Android test sürümü", "Windows, Linux ve Android uygulamaları"],
  ["Test APK indir", "Android APK indir"],
  [
    "Ayarlardan bu kaynaktan kurulum iznini verin. Test surumu; Google Play surumu ilerleyen asamada.",
    "Ayarlardan bu kaynaktan kurulum iznini verin. Google Play sürümü ilerleyen aşamada.",
  ],
  ["Android (test) ve iOS (yakında)", "Android ve iOS (yakında)"],
];
let n = 0;
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== ".git" && f !== "node_modules") walk(p);
      continue;
    }
    if (!f.endsWith(".html")) continue;
    let h = fs.readFileSync(p, "utf8");
    const o = h;
    for (const [a, b] of R) h = h.split(a).join(b);
    if (h !== o) {
      fs.writeFileSync(p, h);
      n++;
    }
  }
})(root);
console.log("site-android updated", n, "files");
