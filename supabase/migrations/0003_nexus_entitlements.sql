-- NEXUS+ abonelik durumu. Whop ödeme webhook'u (edge function "whop-webhook") yazar;
-- kullanıcı yalnızca kendi e-postasına ait satırı okuyabilir. İstemci hiçbir koşulda yazamaz
-- (insert/update/delete politikası yok; service role RLS'i aşar).
-- Satır e-postaya bağlıdır: Supabase e-posta doğrulaması açıkken e-posta sahipliği kanıtlanmıştır.

create table if not exists public.nexus_entitlements (
  email text primary key check (email = lower(email)),
  plan text not null default 'none' check (plan in ('none', 'Aylık', 'Yıllık')),
  status text not null default 'inactive' check (status in ('active', 'inactive')),
  cancel_at_period_end boolean not null default false,
  whop_membership_id text,
  whop_plan_id text,
  period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.nexus_entitlements enable row level security;

drop policy if exists "nexus_entitlements_select_own" on public.nexus_entitlements;
create policy "nexus_entitlements_select_own"
  on public.nexus_entitlements for select
  using (email = lower((select auth.jwt() ->> 'email')));
