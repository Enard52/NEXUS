-- NEXUS+ planları iki para biriminde satılır: Türkiye için TRY, yurt dışı için USD (Whop'ta ayrı planlar).
alter table public.nexus_entitlements
  add column if not exists currency text not null default 'TRY' check (currency in ('TRY', 'USD'));
