-- NEXUS+ yetkileri: Whop kullanıcı kimliği köprüsü (28 Ekim 2026).
-- Webhook artık whop_user_id yazar; whop-account, Whop tarafında e-posta
-- değiştirilmiş olsa bile üyeliği bu kimlikle eşleyebilir. Eklemeli değişiklik,
-- veri silmez; geri alınması gerekirse: alter table ... drop column whop_user_id;
alter table public.nexus_entitlements add column if not exists whop_user_id text;
