-- NEXUS cihaz senkronu — Supabase şeması.
-- Çalıştırma: Supabase SQL editor veya `supabase db push`.
-- Güvenlik: RLS açık; bir kullanıcı yalnızca kendi cihaz satırlarını görür/yazar.

create table if not exists public.nexus_devices (
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  name text not null default '',
  room text not null default '',
  protocol text not null default 'unknown',
  caps jsonb not null default '[]'::jsonb,
  img text not null default '',
  host text not null default '',
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, device_id)
);

alter table public.nexus_devices enable row level security;

-- Mevcut politikalar tekrar tekrar çalıştırılınca hata vermesin: önce düşür.
drop policy if exists "nexus_devices_select_own" on public.nexus_devices;
drop policy if exists "nexus_devices_insert_own" on public.nexus_devices;
drop policy if exists "nexus_devices_update_own" on public.nexus_devices;
drop policy if exists "nexus_devices_delete_own" on public.nexus_devices;

create policy "nexus_devices_select_own"
  on public.nexus_devices for select
  using (auth.uid() = user_id);

create policy "nexus_devices_insert_own"
  on public.nexus_devices for insert
  with check (auth.uid() = user_id);

create policy "nexus_devices_update_own"
  on public.nexus_devices for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "nexus_devices_delete_own"
  on public.nexus_devices for delete
  using (auth.uid() = user_id);

create index if not exists nexus_devices_user_updated
  on public.nexus_devices (user_id, updated_at desc);
