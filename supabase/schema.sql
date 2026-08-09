-- 食材・原価管理アプリ用のSupabaseスキーマ（マルチテナント版）
-- 新規Supabaseプロジェクトで使う場合は、このファイルをSQL Editorで実行してください。
-- 既存プロジェクト（schema.sqlの旧版=単一テナント版を実行済み）を
-- マルチテナント化する場合は、代わりに supabase/migration_002_multitenant.sql を実行してください。
-- さらに課金機能を追加する場合は supabase/migration_003_billing.sql も実行してください。
--
-- 実行後、.env.local に NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SECRET_KEY
-- を設定すると、src/lib/supabase.ts 経由でこのDBを使うようになります。

-- ---- 店舗（テナント）----

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'trialing', -- 'trialing' | 'active' | 'past_due' | 'canceled'
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);
create index if not exists idx_restaurants_stripe_customer on restaurants(stripe_customer_id);

-- 1ユーザーが複数店舗に所属できる（将来的な複数店舗運営・スタッフ招待を見込む）
create table if not exists restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner', -- 'owner' | 'staff'
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);
create index if not exists idx_restaurant_members_user on restaurant_members(user_id);

-- ---- 食材・メニュー ----

create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  category text not null,
  unit_price numeric not null,
  unit_quantity numeric not null default 1,
  unit_label text not null,
  supplier text not null default '',
  current_stock numeric not null default 0,
  par_level numeric not null default 0,
  stock_unit text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ingredients_restaurant on ingredients(restaurant_id);

create table if not exists ingredient_price_history (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  date date not null,
  unit_price numeric not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_price_history_ingredient on ingredient_price_history(ingredient_id, date);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  sell_price numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_menu_items_restaurant on menu_items(restaurant_id);

create table if not exists menu_ingredients (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete restrict,
  quantity numeric not null
);
create index if not exists idx_menu_ingredients_menu on menu_ingredients(menu_item_id);

-- ---- トリガー ----

-- updated_at の自動更新（NEWを書き換えるのでBEFOREトリガーにする）
create or replace function touch_ingredient_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_ingredient_updated_at on ingredients;
create trigger trg_touch_ingredient_updated_at
  before insert or update on ingredients
  for each row execute function touch_ingredient_updated_at();

-- 単価が更新されたら履歴に自動で追記する（分析タブの原価率推移用）。
-- ingredient_price_history.ingredient_id はingredientsへの外部キーなので、
-- 行がまだ確定していないBEFOREトリガーでは挿入できない。AFTERトリガーにする。
create or replace function record_price_history() returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.unit_price is distinct from old.unit_price) then
    insert into ingredient_price_history (ingredient_id, date, unit_price)
    values (new.id, current_date, new.unit_price);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_record_price_history on ingredients;
create trigger trg_record_price_history
  after insert or update on ingredients
  for each row execute function record_price_history();

-- ---- RLS（自分が所属する店舗のデータのみ読み書き可）----
-- サーバーは特権キー(SUPABASE_SECRET_KEY)を使うためRLSを迂回して店舗IDを自前でチェックするが、
-- 将来クライアントから直接Supabaseを叩く場合の保険として設定しておく。

alter table restaurants enable row level security;
alter table restaurant_members enable row level security;
alter table ingredients enable row level security;
alter table ingredient_price_history enable row level security;
alter table menu_items enable row level security;
alter table menu_ingredients enable row level security;

create policy "members can read own restaurant" on restaurants
  for select using (
    id in (select restaurant_id from restaurant_members where user_id = auth.uid())
  );

create policy "members can read own memberships" on restaurant_members
  for select using (user_id = auth.uid());

create policy "members read/write own ingredients" on ingredients
  for all
  using (restaurant_id in (select restaurant_id from restaurant_members where user_id = auth.uid()))
  with check (restaurant_id in (select restaurant_id from restaurant_members where user_id = auth.uid()));

create policy "members read/write own price history" on ingredient_price_history
  for all
  using (
    ingredient_id in (
      select id from ingredients where restaurant_id in (
        select restaurant_id from restaurant_members where user_id = auth.uid()
      )
    )
  )
  with check (
    ingredient_id in (
      select id from ingredients where restaurant_id in (
        select restaurant_id from restaurant_members where user_id = auth.uid()
      )
    )
  );

create policy "members read/write own menu items" on menu_items
  for all
  using (restaurant_id in (select restaurant_id from restaurant_members where user_id = auth.uid()))
  with check (restaurant_id in (select restaurant_id from restaurant_members where user_id = auth.uid()));

create policy "members read/write own menu ingredients" on menu_ingredients
  for all
  using (
    menu_item_id in (
      select id from menu_items where restaurant_id in (
        select restaurant_id from restaurant_members where user_id = auth.uid()
      )
    )
  )
  with check (
    menu_item_id in (
      select id from menu_items where restaurant_id in (
        select restaurant_id from restaurant_members where user_id = auth.uid()
      )
    )
  );
