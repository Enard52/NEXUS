-- NEXUS — cihaz push token kaydı (FCM)
-- --------------------------------------
-- push-send Edge Function'ın alıcıları: her oturum açmış cihaz, FCM token'ını
-- buraya yazar (push.js). Satır SADECE sahibi tarafından yazılabilir/okunabilir
-- (RLS auth.uid()); Edge Function service role ile okur.
-- Aynı token ikinci cihazda/hesapta görünmez: token birincil anahtarın parçası;
-- kullanıcı değişirse eski satır sahibi siler (push.js logout'ta siler).

create table if not exists nexus_push_tokens (
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null,
  platform text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

alter table nexus_push_tokens enable row level security;

drop policy if exists "push_tokens_select_own" on nexus_push_tokens;
create policy "push_tokens_select_own"
  on nexus_push_tokens for select
  using (auth.uid() = user_id);

drop policy if exists "push_tokens_insert_own" on nexus_push_tokens;
create policy "push_tokens_insert_own"
  on nexus_push_tokens for insert
  with check (auth.uid() = user_id);

drop policy if exists "push_tokens_update_own" on nexus_push_tokens;
create policy "push_tokens_update_own"
  on nexus_push_tokens for update
  using (auth.uid() = user_id);

drop policy if exists "push_tokens_delete_own" on nexus_push_tokens;
create policy "push_tokens_delete_own"
  on nexus_push_tokens for delete
  using (auth.uid() = user_id);
