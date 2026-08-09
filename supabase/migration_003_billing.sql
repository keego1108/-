-- 課金（Stripe連携）マイグレーション
-- Supabaseの SQL Editor で、migration_002_multitenant.sql を実行済みのプロジェクトに対して実行してください。

alter table restaurants add column if not exists stripe_customer_id text;
alter table restaurants add column if not exists stripe_subscription_id text;
alter table restaurants add column if not exists subscription_status text not null default 'trialing';
-- 'trialing' | 'active' | 'past_due' | 'canceled'
alter table restaurants add column if not exists trial_ends_at timestamptz not null default (now() + interval '14 days');

create index if not exists idx_restaurants_stripe_customer on restaurants(stripe_customer_id);
