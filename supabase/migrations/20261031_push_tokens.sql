-- NEXUS — Sunucu bildirimi (FCM) cihaz kayıtları
-- Kapalı uygulamaya aile mesajı / paylaşılan kritik uyarı bildirimi için cihaz token'ları.
-- Token bir SIR sayılır: yalnızca sahibi okur/yazar/siler (RLS); gönderimi push-notify Edge Function
-- (service role) yapar. Bildirim ayarlarının kopyası (prefs) burada durur — kapalı uygulamada
-- istemci kodu çalışmadığı için ana anahtar / kategori / sessiz saat sunucuda uygulanır.
-- Kapsam: yalnız Android (FCM). iOS (APNs) ve masaüstü/web yok.
--
-- Uygulama: supabase db push   veya   SQL Editor (20261030'dan sonra).

create table if not exists public.push_tokens (
  token text primary key check (char_length(token) between 20 and 4096),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  platform text not null default 'android' check (platform in ('android')),
  prefs jsonb not null default '{}'::jsonb check (jsonb_typeof(prefs) = 'object' and pg_column_size(prefs) < 2048),
  updated_at timestamptz not null default now()
);
create index if not exists push_tokens_user on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from anon, authenticated;
grant select, insert, update, delete on public.push_tokens to authenticated;

drop policy if exists push_tokens_select_own on public.push_tokens;
drop policy if exists push_tokens_insert_own on public.push_tokens;
drop policy if exists push_tokens_update_own on public.push_tokens;
drop policy if exists push_tokens_delete_own on public.push_tokens;
create policy push_tokens_select_own on public.push_tokens for select using ((select auth.uid()) = user_id);
create policy push_tokens_insert_own on public.push_tokens for insert with check ((select auth.uid()) = user_id);
create policy push_tokens_update_own on public.push_tokens for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy push_tokens_delete_own on public.push_tokens for delete using ((select auth.uid()) = user_id);

-- Aynı cihazda başka hesapla oturum açılınca token yeni hesaba geçer (eski sahip bildirim almaz).
-- RLS tek başına bunu engellerdi (başkasının satırı); bu yüzden SECURITY DEFINER.
create or replace function public.register_push_token(p_token text, p_platform text default 'android', p_prefs jsonb default '{}'::jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  insert into public.push_tokens (token, user_id, platform, prefs, updated_at)
    values (p_token, auth.uid(), coalesce(p_platform, 'android'), coalesce(p_prefs, '{}'::jsonb), now())
    on conflict (token) do update
      set user_id = auth.uid(), platform = excluded.platform, prefs = excluded.prefs, updated_at = now();
end;
$$;
revoke all on function public.register_push_token(text, text, jsonb) from public, anon;
grant execute on function public.register_push_token(text, text, jsonb) to authenticated;
