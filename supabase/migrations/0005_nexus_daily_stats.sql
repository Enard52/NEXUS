-- Günlük istatistik: nexus_stats() + gönderim kaydı + pg_cron (06:00 UTC). Supabase'e uygulandı.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create table if not exists public.nexus_stats_log (id bigserial primary key, sent_at timestamptz not null default now());
alter table public.nexus_stats_log enable row level security;
-- nexus_stats(): auth.users, nexus_user_state, nexus_devices, nexus_entitlements üzerinden sayımlar (yalnızca service_role çalıştırır).
-- cron: select net.http_post(url := '<project>/functions/v1/daily-stats', headers := '{"Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb)
-- Sonradan: nexus_stats_log.kind sütunu (daily/health) ve saatlik 'nexus-health' cron'u (7 * * * *, body {"mode":"health"}) eklendi.
