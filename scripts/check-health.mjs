// Basit sağlık denetimi: site, yapay zekâ çalışanı, Supabase ve son sürüm dosyaları cevap veriyor mu?
// Kullanım: node scripts/check-health.mjs   (herhangi biri başarısızsa çıkış kodu 1)
const CHECKS = [
  ["Site", "https://nexus-smarthome.pages.dev/"],
  ["AI çalışanı", "https://nexus-ai.nexus-smarthome.workers.dev", [200, 204], "OPTIONS"],
  ["Supabase", "https://flbctyolowzcizwwzbke.supabase.co/auth/v1/health", [200, 401]],
  ["Sürüm: NEXUS-Setup.exe", "https://github.com/Enard52/nexus-releases/releases/latest/download/NEXUS-Setup.exe"],
  ["Sürüm: NEXUS-linux.AppImage", "https://github.com/Enard52/nexus-releases/releases/latest/download/NEXUS-linux.AppImage"],
  ["Sürüm: NEXUS-linux.deb", "https://github.com/Enard52/nexus-releases/releases/latest/download/NEXUS-linux.deb"],
  ["Sürüm: latest.yml", "https://github.com/Enard52/nexus-releases/releases/latest/download/latest.yml"],
];

let failed = 0;
for (const [name, url, okCodes, method = "HEAD"] of CHECKS) {
  try {
    const res = await fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(15000) });
    const ok = okCodes ? okCodes.includes(res.status) : res.status < 400;
    if (!ok) failed++;
    console.log((ok ? "OK    " : "HATA  ") + name + " (" + res.status + ")");
  } catch (e) {
    failed++;
    console.log("HATA  " + name + " (" + (e && e.message ? e.message : e) + ")");
  }
}
process.exit(failed ? 1 : 0);