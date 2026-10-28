-- Whop şirket anahtarı vault'ta durur (bu dosyada yok).
-- Yalnızca service_role okuyabilir; site tarayıcısı bu fonksiyonu çağıramaz.

create or replace function public.nexus_whop_api_key()
returns text
language sql
stable
security definer
set search_path = vault, public
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'whop_api_key'
  limit 1;
$$;

revoke all on function public.nexus_whop_api_key() from public;
revoke all on function public.nexus_whop_api_key() from anon;
revoke all on function public.nexus_whop_api_key() from authenticated;
grant execute on function public.nexus_whop_api_key() to service_role;
