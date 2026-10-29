-- NEXUS — Çok kullanıcılı Aile modeli + Aile sohbeti
--
-- Eskiden evler/davetler yalnızca davet edenin cihazında (yerel depo) duruyordu; davetli
-- kodu başka cihazda giremiyor, izinler hiçbir yerde uygulanmıyordu. Bu migrasyon:
--   • households / household_members / household_invites / household_messages tabloları
--   • RLS: yalnızca o evin üyesi evi, üyeleri ve mesajları görür
--   • Davet kodu SUNUCUDA üretilir, yalnızca özeti (sha256) ayrı bir tabloda saklanır
--     (istemci politikası YOK) — tek kullanımlık, süreli, iptal edilebilir, deneme sınırlı
--   • İzinler (control / invite / settings) sunucuda RPC ve RLS ile uygulanır
--   • Mesajlar sunucuda DÜZ METİN saklanır (uçtan uca şifreli DEĞİL); uzunluk ve hız sınırı sunucuda
-- Cihaz kimlik bilgileri (yerel anahtar, parola) bu tablolara HİÇ yazılmaz: LAN cihazları her
-- üyenin kendi cihazında eşleşir.
--
-- Uygulama (bir seferlik): supabase db push   veya   SQL Editor > yapıştır > Run
-- Repoda secret yoktur; yalnızca şema.

-- ---------------------------------------------------------------------------
-- Tablolar
-- ---------------------------------------------------------------------------

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  location text not null default '' check (char_length(location) <= 120),
  rooms jsonb not null default '[]'::jsonb check (jsonb_typeof(rooms) = 'array' and jsonb_array_length(rooms) <= 40),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'member', 'guest')),
  perms jsonb not null default '{"control": true, "invite": false, "settings": false}'::jsonb,
  display_name text not null default '' check (char_length(display_name) <= 80),
  email text not null default '' check (char_length(email) <= 254),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index if not exists household_members_user on public.household_members (user_id);

create table if not exists public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254),
  name text not null default '' check (char_length(name) <= 80),
  role text not null default 'member' check (role in ('owner', 'member', 'guest')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled')),
  invited_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz
);
create index if not exists household_invites_house on public.household_invites (household_id, status);
create index if not exists household_invites_email on public.household_invites (lower(email), status);

-- Kod özeti AYRI tabloda: istemciye ve Realtime'a hiç açılmaz (politika yok).
create table if not exists public.household_invite_secrets (
  invite_id uuid primary key references public.household_invites (id) on delete cascade,
  code_hash text not null unique
);

-- Yanlış kod denemeleri (kaba kuvveti sınırlamak için)
create table if not exists public.household_join_attempts (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now()
);
create index if not exists household_join_attempts_user on public.household_join_attempts (user_id, at desc);

create table if not exists public.household_messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sender_name text not null default '',
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists household_messages_house_time on public.household_messages (household_id, created_at desc);

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.household_invite_secrets enable row level security;
alter table public.household_join_attempts enable row level security;
alter table public.household_messages enable row level security;

-- ---------------------------------------------------------------------------
-- Yardımcılar (SECURITY DEFINER: politikalarda özyineleme olmasın)
-- ---------------------------------------------------------------------------

create or replace function public.is_household_member(hid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = hid and m.user_id = (select auth.uid())
  );
$$;

-- Sahip her izne sahiptir; diğerleri perms içindeki anahtara bakılır.
create or replace function public.household_perm(hid uuid, perm text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((
    select m.role = 'owner' or coalesce((m.perms ->> perm)::boolean, false)
    from public.household_members m
    where m.household_id = hid and m.user_id = (select auth.uid())
  ), false);
$$;

create or replace function public.is_household_owner(hid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = hid and m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;

create or replace function public.sha256_hex(txt text)
returns text
language sql immutable
as $$ select encode(sha256(convert_to(txt, 'UTF8')), 'hex'); $$;

-- ---------------------------------------------------------------------------
-- İstemci yetkileri: yazma yalnızca RPC üzerinden (aşağıda), doğrudan yazma dar
-- ---------------------------------------------------------------------------

revoke all on public.households, public.household_members, public.household_invites,
  public.household_invite_secrets, public.household_join_attempts, public.household_messages
  from anon, authenticated;
revoke all on sequence public.household_join_attempts_id_seq from anon, authenticated;

grant select on public.households, public.household_members, public.household_invites,
  public.household_messages to authenticated;
-- Ev ayarı: yalnız ad / konum / odalar (RLS ayrıca 'settings' iznini ister)
grant update (name, location, rooms) on public.households to authenticated;
grant delete on public.households to authenticated;
-- Üye kendi görünen adını güncelleyebilir; rol/izin YALNIZ RPC ile değişir
grant update (display_name) on public.household_members to authenticated;
-- Mesaj: yalnız gövde ve ev; gönderen ve ad sunucuda atanır
grant insert (household_id, body) on public.household_messages to authenticated;
grant delete on public.household_messages to authenticated;

-- ---------------------------------------------------------------------------
-- RLS politikaları
-- ---------------------------------------------------------------------------

drop policy if exists households_select on public.households;
drop policy if exists households_update on public.households;
drop policy if exists households_delete on public.households;
create policy households_select on public.households for select
  using (public.is_household_member(id));
create policy households_update on public.households for update
  using (public.household_perm(id, 'settings'))
  with check (public.household_perm(id, 'settings'));
create policy households_delete on public.households for delete
  using (public.is_household_owner(id));

drop policy if exists household_members_select on public.household_members;
drop policy if exists household_members_update_self on public.household_members;
create policy household_members_select on public.household_members for select
  using (public.is_household_member(household_id));
create policy household_members_update_self on public.household_members for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Davetleri yalnız davet izni olanlar görür (kod özeti zaten ayrı tabloda)
drop policy if exists household_invites_select on public.household_invites;
create policy household_invites_select on public.household_invites for select
  using (public.household_perm(household_id, 'invite'));

-- secrets ve join_attempts için politika YOK: istemci hiçbir şekilde okuyamaz/yazamaz.

drop policy if exists household_messages_select on public.household_messages;
drop policy if exists household_messages_insert on public.household_messages;
drop policy if exists household_messages_delete on public.household_messages;
create policy household_messages_select on public.household_messages for select
  using (public.is_household_member(household_id));
create policy household_messages_insert on public.household_messages for insert
  with check (sender_id = (select auth.uid()) and public.is_household_member(household_id));
create policy household_messages_delete on public.household_messages for delete
  using (sender_id = (select auth.uid()) and public.is_household_member(household_id));

-- ---------------------------------------------------------------------------
-- Tetikleyiciler
-- ---------------------------------------------------------------------------

create or replace function public.households_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists households_touch on public.households;
create trigger households_touch before update on public.households
  for each row execute function public.households_touch();

-- Mesaj: gönderen adı sunucuda üyelikten alınır (taklit edilemez), gövde kırpılır,
-- hız sınırı: 10 sn içinde en çok 5 mesaj.
create or replace function public.household_messages_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  recent int;
  nm text;
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

-- ---------------------------------------------------------------------------
-- RPC'ler (yazma yolları). Hata iletileri makine okunur kodlardır; arayüz çevirir.
-- ---------------------------------------------------------------------------

-- Ev oluştur: oluşturan otomatik sahip olur.
create or replace function public.create_household(p_name text, p_location text default '', p_display_name text default '')
returns public.households
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  h public.households;
  mail text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  if char_length(btrim(coalesce(p_name, ''))) = 0 then raise exception 'name_required' using errcode = 'P0001'; end if;
  if (select count(*) from public.household_members where user_id = uid and role = 'owner') >= 10 then
    raise exception 'too_many_homes' using errcode = 'P0001';
  end if;
  insert into public.households (name, location, created_by)
    values (left(btrim(p_name), 60), left(coalesce(p_location, ''), 120), uid)
    returning * into h;
  insert into public.household_members (household_id, user_id, role, perms, display_name, email)
    values (h.id, uid, 'owner', '{"control": true, "invite": true, "settings": true}'::jsonb,
            left(btrim(coalesce(p_display_name, '')), 80), mail);
  return h;
end;
$$;

-- Davet oluştur: kod burada üretilir ve YALNIZ bu çağrının cevabında düz metin döner.
create or replace function public.create_household_invite(p_household uuid, p_email text, p_name text default '', p_role text default 'member')
returns table (invite_id uuid, code text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  raw text;
  mail text := lower(btrim(coalesce(p_email, '')));
  inv public.household_invites;
begin
  if uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  if not public.household_perm(p_household, 'invite') then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if p_role not in ('owner', 'member', 'guest') then raise exception 'bad_role' using errcode = 'P0001'; end if;
  if p_role = 'owner' and not public.is_household_owner(p_household) then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'bad_email' using errcode = 'P0001'; end if;
  if exists (select 1 from public.household_members m where m.household_id = p_household and lower(m.email) = mail) then
    raise exception 'already_member' using errcode = 'P0001';
  end if;
  if (select count(*) from public.household_invites i where i.household_id = p_household and i.status = 'pending' and i.expires_at > now()) >= 20 then
    raise exception 'too_many_invites' using errcode = 'P0001';
  end if;
  -- Aynı adrese bekleyen eski davet varsa iptal edilir (tek geçerli davet)
  update public.household_invites set status = 'cancelled'
    where household_id = p_household and lower(email) = mail and status = 'pending';
  raw := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  raw := 'NX-' || substr(raw, 1, 4) || '-' || substr(raw, 5, 4) || '-' || substr(raw, 9, 4);
  insert into public.household_invites (household_id, email, name, role, invited_by)
    values (p_household, mail, left(btrim(coalesce(p_name, '')), 80), p_role, uid)
    returning * into inv;
  insert into public.household_invite_secrets (invite_id, code_hash) values (inv.id, public.sha256_hex(raw));
  invite_id := inv.id; code := raw; expires_at := inv.expires_at;
  return next;
end;
$$;

create or replace function public.cancel_household_invite(p_invite uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  select household_id into hid from public.household_invites where id = p_invite and status = 'pending';
  if hid is null then raise exception 'invite_invalid' using errcode = 'P0001'; end if;
  if not public.household_perm(hid, 'invite') then raise exception 'forbidden' using errcode = 'P0001'; end if;
  update public.household_invites set status = 'cancelled' where id = p_invite;
end;
$$;

-- Davetlinin oturum e-postası doğrulanmış mı? (kod yolu ve e-posta yolu için ortak)
create or replace function public.household_caller_email()
returns text
language sql stable security definer set search_path = public, auth
as $$
  select lower(u.email) from auth.users u
  where u.id = auth.uid() and u.email_confirmed_at is not null;
$$;

-- Bu hesabın e-postasına gelmiş bekleyen davetler (kodsuz kabul için)
create or replace function public.my_household_invites()
returns table (invite_id uuid, household_name text, role text, invited_by_name text, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select i.id, h.name, i.role,
         coalesce(nullif(btrim(m.display_name), ''), nullif(btrim(m.email), ''), ''),
         i.expires_at
  from public.household_invites i
  join public.households h on h.id = i.household_id
  left join public.household_members m on m.household_id = i.household_id and m.user_id = i.invited_by
  where i.status = 'pending' and i.expires_at > now()
    and lower(i.email) = public.household_caller_email();
$$;

-- Daveti kabul et: ya kodla ya da (e-posta eşleşiyorsa) davet kimliğiyle.
-- Hata ATILMAZ, jsonb döner: başarısız deneme kaydı (kaba kuvvet sınırı) geri alınmasın diye.
create or replace function public.accept_household_invite(p_code text default null, p_invite_id uuid default null, p_display_name text default '')
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  mail text := public.household_caller_email();
  inv public.household_invites;
  norm text := upper(btrim(coalesce(p_code, '')));
  fails int;
  perms jsonb;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'not_authenticated'); end if;
  if mail is null then return jsonb_build_object('ok', false, 'error', 'email_unverified'); end if;

  select count(*) into fails from public.household_join_attempts
    where user_id = uid and at > now() - interval '15 minutes';
  if fails >= 10 then return jsonb_build_object('ok', false, 'error', 'too_many_attempts'); end if;

  if p_invite_id is not null then
    select * into inv from public.household_invites where id = p_invite_id for update;
  elsif norm <> '' then
    select i.* into inv from public.household_invites i
      join public.household_invite_secrets s on s.invite_id = i.id
      where s.code_hash = public.sha256_hex(norm) for update of i;
  end if;

  if inv.id is null or inv.status <> 'pending' or inv.expires_at <= now() then
    insert into public.household_join_attempts (user_id) values (uid);
    return jsonb_build_object('ok', false, 'error', 'invite_invalid');
  end if;
  -- Davet bir e-postaya bağlıdır: başka hesapla (kod sızsa bile) kabul edilemez.
  if lower(inv.email) <> mail then
    insert into public.household_join_attempts (user_id) values (uid);
    return jsonb_build_object('ok', false, 'error', 'email_mismatch');
  end if;

  perms := case inv.role
    when 'owner' then '{"control": true, "invite": true, "settings": true}'::jsonb
    when 'member' then '{"control": true, "invite": false, "settings": false}'::jsonb
    else '{"control": false, "invite": false, "settings": false}'::jsonb
  end;
  insert into public.household_members (household_id, user_id, role, perms, display_name, email)
    values (inv.household_id, uid, inv.role, perms,
            left(btrim(coalesce(nullif(p_display_name, ''), inv.name, '')), 80), mail)
    on conflict (household_id, user_id) do nothing;
  update public.household_invites set status = 'accepted', accepted_by = uid, accepted_at = now() where id = inv.id;
  return jsonb_build_object('ok', true, 'household_id', inv.household_id);
end;
$$;
create or replace function public.decline_household_invite(p_invite uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.household_invites set status = 'cancelled'
    where id = p_invite and status = 'pending' and lower(email) = public.household_caller_email();
end;
$$;

-- Rol/izin değiştir: yalnız sahip. Sahibin izinleri kapatılamaz; son sahip düşürülemez.
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
  update public.household_members set role = p_role, perms = clean
    where household_id = p_household and user_id = p_user;
end;
$$;

-- Üyeyi çıkar (sahip) ya da evden ayrıl (kendisi). Son sahip ayrılamaz (evi silmeli).
create or replace function public.remove_household_member(p_household uuid, p_user uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  target public.household_members;
begin
  if uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  if p_user <> uid and not public.is_household_owner(p_household) then raise exception 'forbidden' using errcode = 'P0001'; end if;
  select * into target from public.household_members where household_id = p_household and user_id = p_user;
  if target.user_id is null then raise exception 'not_found' using errcode = 'P0001'; end if;
  if target.role = 'owner'
     and (select count(*) from public.household_members where household_id = p_household and role = 'owner') <= 1 then
    raise exception 'last_owner' using errcode = 'P0001';
  end if;
  delete from public.household_members where household_id = p_household and user_id = p_user;
end;
$$;

-- Edge Function (service role) için: kod, o davetin özetiyle eşleşiyor mu?
create or replace function public.household_invite_code_matches(p_invite uuid, p_code text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_invite_secrets s
    where s.invite_id = p_invite and s.code_hash = public.sha256_hex(upper(btrim(coalesce(p_code, ''))))
  );
$$;

-- RPC yetkileri: yalnızca oturum açmış kullanıcı (ve service role)
revoke all on function public.create_household(text, text, text) from public, anon;
revoke all on function public.create_household_invite(uuid, text, text, text) from public, anon;
revoke all on function public.cancel_household_invite(uuid) from public, anon;
revoke all on function public.my_household_invites() from public, anon;
revoke all on function public.accept_household_invite(text, uuid, text) from public, anon;
revoke all on function public.decline_household_invite(uuid) from public, anon;
revoke all on function public.set_household_member_access(uuid, uuid, text, jsonb) from public, anon;
revoke all on function public.remove_household_member(uuid, uuid) from public, anon;
revoke all on function public.household_caller_email() from public, anon;
revoke all on function public.household_invite_code_matches(uuid, text) from public, anon, authenticated;
grant execute on function public.create_household(text, text, text) to authenticated;
grant execute on function public.create_household_invite(uuid, text, text, text) to authenticated;
grant execute on function public.cancel_household_invite(uuid) to authenticated;
grant execute on function public.my_household_invites() to authenticated;
grant execute on function public.accept_household_invite(text, uuid, text) to authenticated;
grant execute on function public.decline_household_invite(uuid) to authenticated;
grant execute on function public.set_household_member_access(uuid, uuid, text, jsonb) to authenticated;
grant execute on function public.remove_household_member(uuid, uuid) to authenticated;
grant execute on function public.household_invite_code_matches(uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- Realtime: ev, üyeler ve mesajlar canlı akar (davetler DEĞİL — kod özeti sızmasın).
-- Not: DELETE olaylarında yalnız birincil anahtar gelir; istemci yeniden çeker.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['households', 'household_members', 'household_messages'] loop
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
