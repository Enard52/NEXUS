-- NEXUS hesap durumu senkronu: profil, ayarlar, sahneler, aile, favoriler vb.
-- Her anahtar (örn. nexusUserName, nexusDarkMode) hesabın altında tek satırdır; değer
-- uygulamanın yerel depodaki metin halidir. Cihazlar ayrı tabloda (nexus_devices) durur.
-- Güvenlik: RLS açık; kullanıcı yalnızca kendi satırlarını görür/yazar. Gizli bilgiler
-- (oturum belirteçleri, şifre özetleri) istemci tarafında hiç gönderilmez.

create table if not exists public.nexus_user_state (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key text not null check (char_length(key) between 1 and 120),
  value text not null check (char_length(value) <= 600000),
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.nexus_user_state enable row level security;

drop policy if exists "nexus_user_state_select_own" on public.nexus_user_state;
drop policy if exists "nexus_user_state_insert_own" on public.nexus_user_state;
drop policy if exists "nexus_user_state_update_own" on public.nexus_user_state;
drop policy if exists "nexus_user_state_delete_own" on public.nexus_user_state;

create policy "nexus_user_state_select_own"
  on public.nexus_user_state for select
  using ((select auth.uid()) = user_id);

create policy "nexus_user_state_insert_own"
  on public.nexus_user_state for insert
  with check ((select auth.uid()) = user_id);

create policy "nexus_user_state_update_own"
  on public.nexus_user_state for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "nexus_user_state_delete_own"
  on public.nexus_user_state for delete
  using ((select auth.uid()) = user_id);

create index if not exists nexus_user_state_user_updated
  on public.nexus_user_state (user_id, updated_at desc);
