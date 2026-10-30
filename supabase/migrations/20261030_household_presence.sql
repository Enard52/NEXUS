-- NEXUS — Aile seti: üye profilleri, oda izinleri, sohbet zenginleştirme, okundu, Ev Panosu
--
-- Tek seferlik kurulum (30 Eki 2026). 20261029_households.sql ÜSTÜNE çalıştırılır:
--   • household_members.avatar_url — küçük veri-URL fotoğrafı (yalnız kendin)
--   • household_members.last_seen_at — kalp atışı (3 dk = çevrimiçi)
--   • household_members.chat_last_read — sohbette son okunan an (✓✓ okundu bilgisi)
--   • household_members.perms.rooms — oda bazlı erişim (null = tüm odalar; misafire "sadece Salon")
--   • household_messages.reply_to — yanıtlanan mesaj + gerçek-time güncelleme akışı
--   • household_messages.reactions — emoji tepkileri {"👍":[uuid,...]}
--   • household_board_items — Ev Panosu: ortak liste/not; herkes işaretler, kendi notunu siler
--   • RPC: touch_household_presence, set_household_avatar, set_household_member_rooms,
--          react_household_message, mark_household_read
--   • mesaj guard'ı: reply_to aynı evden olmalı; insert yetkisi reply_to sütununu kapsar
--   • Realtime: household_board_items yayın listesine eklenir
--
-- Uygulama: Supabase Dashboard → SQL Editor → yapıştır → Run  (veya: supabase db push)

-- ---------------------------------------------------------------------------
-- household_members: profil + presence + okundu
-- ---------------------------------------------------------------------------
alter table public.household_members
  add column if not exists avatar_url text not null default '' check (char_length(avatar_url) <= 200000),
  add column if not exists last_seen_at timestamptz not null default now() - interval '30 days',
  add column if not exists chat_last_read timestamptz;

-- ---------------------------------------------------------------------------
-- household_messages: yanıt + tepki
-- ---------------------------------------------------------------------------
alter table public.household_messages
  add column if not exists reply_to uuid references public.household_messages (id) on delete set null,
  add column if not exists reactions jsonb not null default '{}'::jsonb
    check (jsonb_typeof(reactions) = 'object');

create index if not exists household_messages_reply on public.household_messages (reply_to);

-- ---------------------------------------------------------------------------
-- Ev Panosu: ortak liste maddeleri ve notlar
-- ---------------------------------------------------------------------------
create table if not exists public.household_board_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null default '',
  kind text not null default 'item' check (kind in ('item', 'note')),
  body text not null check (char_length(body) between 1 and 500),
  done boolean not null default false,
  done_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists household_board_items_house on public.household_board_items (household_id, created_at desc);

alter table public.household_board_items enable row level security;

drop policy if exists household_board_select on public.household_board_items;
drop policy if exists household_board_insert on public.household_board_items;
drop policy if exists household_board_update on public.household_board_items;
drop policy if exists household_board_delete on public.household_board_items;
create policy household_board_select on public.household_board_items for select
  using (public.is_household_member(household_id));
create policy household_board_insert on public.household_board_items for insert
  with check ((select auth.uid()) is not null and public.is_household_member(household_id));
create policy household_board_update on public.household_board_items for update
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy household_board_delete on public.household_board_items for delete
  using (created_by = (select auth.uid()) or public.is_household_owner(household_id));

-- ---------------------------------------------------------------------------
-- Güncellenen mesaj guard'ı: reply_to aynı evden olmalı; tepki/yanıt akışı için
-- güncelleme anında updated kırpması yapılmaz (reactions istemci RPC ile değişir).
-- ---------------------------------------------------------------------------
create or replace function public.household_messages_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  recent int;
  nm text;
  parent public.household_messages;
begin
  new.body := btrim(new.body);
  if char_length(new.body) = 0 then
    raise exception 'empty_message' using errcode = 'P0001';
  end if;
  select count(*) into recent from public.household_messages
    where sender_id = new.sender_id and created_at > now() - interval '10 seconds';
  if recent >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if new.reply_to is not null then
    select * into parent from public.household_messages
      where id = new.reply_to and household_id = new.household_id;
    if parent.id is null then new.reply_to := null; end if;
  end if;
  select nullif(btrim(m.display_name), '') into nm from public.household_members m
    where m.household_id = new.household_id and m.user_id = new.sender_id;
  new.sender_name := coalesce(nm, '');
  new.created_at := now();
  return new;
end;
$$;
drop trigger if exists household_messages_guard on public.household_messages;
create trigger household_messages_guard before insert on public.household_messages
  for each row execute function public.household_messages_guard();

-- Yanıt sütunu yazılabilir olsun (gerisi 20261029'daki gibi kısıtlı)
grant insert (household_id, body, reply_to) on public.household_messages to authenticated;

-- ---------------------------------------------------------------------------
-- RPC'ler
-- ---------------------------------------------------------------------------

-- Kalp atışı: tüm evlerdeki üye satırlarında son görülmeyi tazeler.
create or replace function public.touch_household_presence()
returns void
language sql security definer set search_path = public
as $$
  update public.household_members
     set last_seen_at = now()
   where user_id = (select auth.uid());
$$;

-- Avatar: yalnız kendi satırlarına, yalnız küçük veri-URL görseli.
create or replace function public.set_household_avatar(p_avatar text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_avatar is null then p_avatar := ''; end if;
  if char_length(p_avatar) > 200000 then raise exception 'avatar_too_large' using errcode = 'P0001'; end if;
  if p_avatar <> '' and left(p_avatar, 11) <> 'data:image/' then raise exception 'avatar_bad_type' using errcode = 'P0001'; end if;
  update public.household_members
     set avatar_url = p_avatar
   where user_id = (select auth.uid());
end;
$$;

-- Oda erişimi: yalnız sahip; hedef sahip olamaz; liste evin odalarının alt kümesi olmalı.
-- rooms = null → tüm odalar; rooms = [] gibi boş dizi → hiçbir oda (sadece ortak ekranlar).
create or replace function public.set_household_member_rooms(p_household uuid, p_user uuid, p_rooms jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  target public.household_members;
  home public.households;
  clean jsonb := '[]'::jsonb;
  r text;
  ok boolean;
begin
  if not public.is_household_owner(p_household) then raise exception 'forbidden' using errcode = 'P0001'; end if;
  select * into target from public.household_members
    where household_id = p_household and user_id = p_user;
  if target.user_id is null then raise exception 'not_found' using errcode = 'P0001'; end if;
  if target.role = 'owner' then raise exception 'owner_rooms' using errcode = 'P0001'; end if;
  if p_rooms is null then
    clean := null;
  elsif jsonb_typeof(p_rooms) = 'array' then
    select * into home from public.households where id = p_household;
    for r in select jsonb_array_elements_text(p_rooms) loop
      ok := exists (select 1 from jsonb_array_elements_text(home.rooms) h where h = r);
      if not ok then raise exception 'unknown_room' using errcode = 'P0001'; end if;
      clean := clean || to_jsonb(r);
    end loop;
    clean := case when jsonb_array_length(clean) = 0 then null else clean end;
  else
    raise exception 'bad_rooms' using errcode = 'P0001';
  end if;
  update public.household_members
     set perms = case
       when clean is null then (perms - 'rooms')
       else jsonb_set(perms, '{rooms}', clean)
     end
   where household_id = p_household and user_id = p_user;
end;
$$;

-- Genel izin değiştirme (20261029 sürümünün güncel hâli): perms.rooms ANAHTARI AYNEN
-- korunur — kontrol/davet/ayarlar anahtarları kapatılıp açıldığında sahip, üyenin
-- oda kısıtını kaybetmez. rooms yalnız set_household_member_rooms ile değişir.
create or replace function public.set_household_member_access(p_household uuid, p_user uuid, p_role text, p_perms jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  target public.household_members;
  clean jsonb;
begin
  if not public.is_household_owner(p_household) then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if p_role not in ('owner', 'member', 'guest') then raise exception 'bad_role' using errcode = 'P0001'; end if;
  select * into target from public.household_members where household_id = p_household and user_id = p_user;
  if target.user_id is null then raise exception 'not_found' using errcode = 'P0001'; end if;
  if target.role = 'owner' and p_role <> 'owner'
     and (select count(*) from public.household_members where household_id = p_household and role = 'owner') <= 1 then
    raise exception 'last_owner' using errcode = 'P0001';
  end if;
  clean := jsonb_build_object(
    'control', p_role = 'owner' or coalesce((p_perms ->> 'control')::boolean, false),
    'invite', p_role = 'owner' or coalesce((p_perms ->> 'invite')::boolean, false),
    'settings', p_role = 'owner' or coalesce((p_perms ->> 'settings')::boolean, false)
  );
  if target.perms ? 'rooms' and p_role <> 'owner' then
    clean := jsonb_set(clean, '{rooms}', target.perms -> 'rooms');
  end if;
  update public.household_members set role = p_role, perms = clean
    where household_id = p_household and user_id = p_user;
end;
$$;

-- Tepki: beyaz listeli emoji; aynı emojiye ikinci basış geri alır (toggle).
create or replace function public.react_household_message(p_message uuid, p_emoji text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  msg public.household_messages;
  uid uuid := auth.uid();
  cur jsonb;
  mine jsonb;
begin
  if uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  if p_emoji is null or p_emoji not in ('👍','❤️','😂','😮','😢','🎉') then
    raise exception 'bad_emoji' using errcode = 'P0001';
  end if;
  select * into msg from public.household_messages where id = p_message;
  if msg.id is null or not public.is_household_member(msg.household_id) then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  cur := coalesce(msg.reactions, '{}'::jsonb);
  mine := coalesce(cur -> p_emoji, '[]'::jsonb);
  if mine @> to_jsonb(uid::text) then
    mine := (select jsonb_agg(x) from jsonb_array_elements(mine) x where x <> to_jsonb(uid::text));
    if jsonb_array_length(mine) = 0 then cur := cur - p_emoji; else cur := jsonb_set(cur, array[p_emoji], mine); end if;
  else
    cur := jsonb_set(cur, array[p_emoji], mine || to_jsonb(uid::text));
  end if;
  update public.household_messages set reactions = cur where id = p_message;
  return cur;
end;
$$;

-- Okundu: kendi üye satırıma "buraya kadar okudum" yazar (✓✓ hesabı istemcide).
create or replace function public.mark_household_read(p_household uuid, p_iso timestamptz)
returns void
language sql security definer set search_path = public
as $$
  update public.household_members
     set chat_last_read = least(coalesce(p_iso, now()), now())
   where household_id = p_household and user_id = (select auth.uid());
$$;

revoke all on function public.touch_household_presence() from public, anon;
revoke all on function public.set_household_avatar(text) from public, anon;
revoke all on function public.set_household_member_rooms(uuid, uuid, jsonb) from public, anon;
revoke all on function public.react_household_message(uuid, text) from public, anon;
revoke all on function public.mark_household_read(uuid, timestamptz) from public, anon;
grant execute on function public.touch_household_presence() to authenticated;
grant execute on function public.set_household_avatar(text) to authenticated;
grant execute on function public.set_household_member_rooms(uuid, uuid, jsonb) to authenticated;
grant execute on function public.react_household_message(uuid, text) to authenticated;
grant execute on function public.mark_household_read(uuid, timestamptz) to authenticated;

-- Pano yetkileri
grant select, insert, update, delete on public.household_board_items to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: panoyu yayın listesine ekle (ev/üye/mesaj/etkinlik zaten yayında)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['household_board_items'] loop
    if not exists (
         select 1 from pg_publication_tables
         where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
       )
    then
      execute 'alter publication supabase_realtime add table public.' || quote_ident(t);
    end if;
  end loop;
end
$$;
