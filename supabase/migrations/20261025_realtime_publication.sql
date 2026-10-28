-- NEXUS — Realtime yayın üyeliği (üç platformun ANLIK senkronu için)
--
-- Supabase'de postgres_changes olayları yalnızca supabase_realtime YAYININA üye
-- tablolar için üretilir. Yayın üyeliği hiçbir migrasyonla kurulmadığı için
-- istemci abone oluyor ama hiçbir değişiklik eline geçmiyordu — cloud-sync.js'teki
-- startRealtime() sessizce boşa çalışırdı. Bu dosya üyeliği idempotent kurar.
--
-- Nasıl uygulanır (bir seferlik, Supabase erişimi gerektirir):
--   supabase db push         (CLI ile)    veya
--   SQL Editor > New query > yapıştır > Run
--
-- Uygulama tarafı: cloud-sync.js — Realtime yoksa 45 sn'lik yoklama aynen sürer.

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end
$$;

-- Yalnızca varsa ve üye değilse ekle: tablo henüz olmayan ortamlarda hatasız geçer.
do $$
declare
  t text;
begin
  foreach t in array array['nexus_user_state', 'nexus_devices', 'nexus_entitlements'] loop
    if exists (
         select 1 from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relname = t and c.relkind = 'r'
       )
       and not exists (
         select 1 from pg_publication_tables
         where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
       )
    then
      execute 'alter publication supabase_realtime add table public.' || quote_ident(t);
    end if;
  end loop;
end
$$;

-- DELETE olayında silinen kaydın (old_record) taşınması için tam kimlik gerekir.
do $$
declare
  t text;
begin
  foreach t in array array['nexus_user_state', 'nexus_devices', 'nexus_entitlements'] loop
    if exists (
         select 1 from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relname = t and c.relkind = 'r'
       )
    then
      execute 'alter table public.' || quote_ident(t) || ' replica identity full';
    end if;
  end loop;
end
$$;
