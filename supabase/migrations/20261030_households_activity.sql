-- NEXUS — Aile: sahiplik devri, ortak etkinlik akışı, kritik uyarı paylaşımı
-- (20261029_households.sql'den SONRA uygulanır.)
--
-- • transfer_household_ownership: sahiplik devri (eski sahip üyeye düşer, tek-sahip kuralı bozulmaz)
-- • household_activity: yalnızca GERÇEKTEN olmuş olaylar. Katılma/ayrılma/çıkarma tetikleyiciyle
--   sunucuda yazılır; senaryo çalıştırma ve uyarıyı istemci RPC ile bildirir (üyelik ve tür
--   doğrulanır, hız sınırlı). İstemci tabloya doğrudan yazamaz; yalnız o evin üyesi okur (RLS).
-- • households.share_alerts: ev sahibi açarsa güvenlik/acil olayların BAŞLIK ve KISA METNİ diğer
--   üyelerin uygulamasında olay olur. Cihaz kimlik bilgisi / yerel anahtar paylaşılmaz; alıcı kendi
--   bildirim ayarlarına tabidir.

alter table public.households add column if not exists share_alerts boolean not null default false;

create table if not exists public.household_activity (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  actor_name text not null default '',
  kind text not null check (kind in ('member_joined', 'member_left', 'member_removed', 'scene_run', 'alert')),
  title text not null default '' check (char_length(title) <= 120),
  detail text not null default '' check (char_length(detail) <= 160),
  created_at timestamptz not null default now()
);
create index if not exists household_activity_house_time on public.household_activity (household_id, created_at desc);

alter table public.household_activity enable row level security;
revoke all on public.household_activity from anon, authenticated;
grant select on public.household_activity to authenticated;
drop policy if exists household_activity_select on public.household_activity;
create policy household_activity_select on public.household_activity for select
  using (public.is_household_member(household_id));
-- insert/update/delete politikası YOK: yalnız aşağıdaki tetikleyici ve RPC'ler yazar.

-- Katılma / ayrılma / çıkarma: gerçek üyelik değişikliğinden doğar
create or replace function public.household_members_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    -- Evi kuran kişi "katılmış" sayılmaz
    if new.user_id = (select h.created_by from public.households h where h.id = new.household_id) then
      return new;
    end if;
    insert into public.household_activity (household_id, actor_id, actor_name, kind, title)
      values (new.household_id, new.user_id, new.display_name, 'member_joined', 'Eve katıldı');
  elsif tg_op = 'DELETE' then
    -- Ev silinirken (cascade) üst kayıt yoktur: etkinlik yazılmaz
    if exists (select 1 from public.households h where h.id = old.household_id) then
      insert into public.household_activity (household_id, actor_id, actor_name, kind, title)
        values (old.household_id, old.user_id, old.display_name,
                case when auth.uid() is not null and auth.uid() <> old.user_id then 'member_removed' else 'member_left' end,
                case when auth.uid() is not null and auth.uid() <> old.user_id then 'Evden çıkarıldı' else 'Evden ayrıldı' end);
    end if;
    return old;
  end if;
  return new;
end;
$$;
drop trigger if exists household_members_activity on public.household_members;
create trigger household_members_activity after insert or delete on public.household_members
  for each row execute function public.household_members_activity();

-- İstemci bildirimi: senaryo çalıştırıldı / kritik uyarı. Üyelik, tür, uzunluk ve hız doğrulanır.
create or replace function public.log_household_activity(p_household uuid, p_kind text, p_title text, p_detail text default '')
returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  nm text;
  limit_n int;
begin
  if uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  if p_kind not in ('scene_run', 'alert') then raise exception 'bad_kind' using errcode = 'P0001'; end if;
  if not public.is_household_member(p_household) then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if char_length(btrim(coalesce(p_title, ''))) = 0 then raise exception 'empty_message' using errcode = 'P0001'; end if;
  if p_kind = 'alert' and not (select share_alerts from public.households where id = p_household) then
    raise exception 'alerts_not_shared' using errcode = 'P0001';
  end if;
  limit_n := case p_kind when 'alert' then 6 else 20 end;
  if (select count(*) from public.household_activity a
        where a.household_id = p_household and a.actor_id = uid and a.kind = p_kind
          and a.created_at > now() - interval '10 minutes') >= limit_n then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  select nullif(btrim(m.display_name), '') into nm from public.household_members m
    where m.household_id = p_household and m.user_id = uid;
  insert into public.household_activity (household_id, actor_id, actor_name, kind, title, detail)
    values (p_household, uid, coalesce(nm, ''), p_kind, left(btrim(p_title), 120), left(btrim(coalesce(p_detail, '')), 160));
end;
$$;

-- Sahiplik devri: hedef sahip olur, çağıran üyeye düşer (izinleri korunur ama sahiplik kalkar).
create or replace function public.transfer_household_ownership(p_household uuid, p_to uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if not public.is_household_owner(p_household) then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if p_to = uid then raise exception 'bad_target' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.household_members where household_id = p_household and user_id = p_to) then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  update public.household_members
    set role = 'owner', perms = '{"control": true, "invite": true, "settings": true}'::jsonb
    where household_id = p_household and user_id = p_to;
  update public.household_members
    set role = 'member', perms = '{"control": true, "invite": true, "settings": true}'::jsonb
    where household_id = p_household and user_id = uid;
end;
$$;

create or replace function public.set_household_share_alerts(p_household uuid, p_on boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_household_owner(p_household) then raise exception 'forbidden' using errcode = 'P0001'; end if;
  update public.households set share_alerts = coalesce(p_on, false) where id = p_household;
end;
$$;

revoke all on function public.log_household_activity(uuid, text, text, text) from public, anon;
revoke all on function public.transfer_household_ownership(uuid, uuid) from public, anon;
revoke all on function public.set_household_share_alerts(uuid, boolean) from public, anon;
grant execute on function public.log_household_activity(uuid, text, text, text) to authenticated;
grant execute on function public.transfer_household_ownership(uuid, uuid) to authenticated;
grant execute on function public.set_household_share_alerts(uuid, boolean) to authenticated;

do $$
begin
  if not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'household_activity'
     )
  then
    alter publication supabase_realtime add table public.household_activity;
  end if;
end
$$;
