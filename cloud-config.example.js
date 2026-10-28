// NEXUS bulut yapilandirmasi ORNEGI.
// Kopyala -> cloud-config.js ve kendi Supabase degerlerini yaz.
// cloud-config.js gitignore'dadir; anahtarlar repoya girmez.
// Bu dosya yoksa uygulama tamamen yerel (cihaz ici) calismaya devam eder.
window.NEXUS_CLOUD = {
  // Supabase proje URL'i, ornek: https://abcdefghijklm.supabase.co
  url: "",
  // public/anon key (yalnizca RLS ile korunan tablolar icin gecerli olmali)
  anonKey: "",
};
