-- NEXUS migration paketi (25 Ekim 2026) — issue'lar #9, #11, #15, #26
-- Uygulama (MANUEL): Supabase Dashboard → SQL Editor → bu dosya → Run.
-- İçerik:
--   A) nexus_ai_usage + atomik kredi RPC (#9 — sunucu tarafı AI kotası)
--   B) nexus_client_errors (#15 — anonim istemci hataları)
--   C) Eski proje tabloları + vector uzantısının kaldırılması (#26)

-- ============================================================
-- A) Yapay zekâ kredi sayacı (sunucu tarafı) — issue #9
-- ============================================================
create table if not exists public.nexus_ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null,            -- 'YYYY-MM-DD' (günlük) / 'YYYY-MM' (aylık)
  used int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, period)
);
alter table public.nexus_ai_usage enable row level security;
-- İstemci OKUYAMAZ da YAZAMAZ da (yalnız service_role / RPC)

-- Atomik kredi artırımı: limit aşılmıyorsa 1 artır ve true döner.
-- limit_daily ücretsiz plan (30), limit_monthly NEXUS+ (2000).
create or replace function public.nexus_ai_consume(p_plan text, p_monthly boolean default false)
returns boolean
language plpgsql
security definer
as $$
declare
  v_user uuid := auth.uid();
  v_period text;
  v_limit int;
  v_used int;
begin
  if v_user is null then return false; end if;
  v_period := case when p_monthly then to_char(now(), 'YYYY-MM') else to_char(now(), 'YYYY-MM-DD') end;
  v_limit := case when p_monthly then 2000 else 30 end;

  insert into public.nexus_ai_usage (user_id, period, used)
  values (v_user, v_period, 1)
  on conflict (user_id, period)
  do update set used = public.nexus_ai_usage.used + 1, updated_at = now()
  where public.nexus_ai_usage.used < v_limit;

  if not found then return false; end if;
  select used into v_used from public.nexus_ai_usage where user_id = v_user and period = v_period;
  return v_used <= v_limit;
end;
$$;
revoke all on function public.nexus_ai_consume(text, boolean) from anon, authenticated;
grant execute on function public.nexus_ai_consume(text, boolean) to authenticated;

-- ============================================================
-- B) Anonim istemci hataları — issue #15
-- ============================================================
create table if not exists public.nexus_client_errors (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  page text, version text, platform text, message text
);
alter table public.nexus_client_errors enable row level security;
-- RLS açık + politika yok → yalnız service_role (Edge Function) yazar.

-- ============================================================
-- D) DB boyutu RPC (issue #12 — günlük özete ücretsiz plan takibi)
-- ============================================================
create or replace function public.nexus_db_size()
returns text
language sql
security definer
as $$
  select (pg_database_size(current_database()) / 1048576.0)::numeric(10,1)::text;
$$;
revoke all on function public.nexus_db_size() from anon, authenticated;
-- yalnız service_role (Edge Function) çağırır

-- Eski proje artıkları — issue #26 (öNCE şema yedeği alın!)
-- Doğrulama yapıldı: kodda ve Edge Function'larda bu tablolara
-- hiçbir atıf yok (grep: api_keys, conversations, handoffs,
-- integrations, knowledge_base, messages, presets, usage_logs,
-- webhooks, widgets — yalnızca bu migration'da geçiyor).
-- ============================================================
drop table if exists public.api_keys cascade;
drop table if exists public.conversations cascade;
drop table if exists public.handoffs cascade;
drop table if exists public.integrations cascade;
drop table if exists public.knowledge_base cascade;
drop table if exists public.messages cascade;
drop table if exists public.presets cascade;
drop table if exists public.usage_logs cascade;
drop table if exists public.webhooks cascade;
drop table if exists public.widgets cascade;
drop extension if exists vector cascade;
