-- マルチテナント化マイグレーション
-- Supabaseの SQL Editor で、schema.sql を実行済みのプロジェクトに対して実行してください。
-- 既存のingredients/menu_itemsにデータが入っている場合は、先に空にしてから実行することを推奨します
-- （restaurant_idがNOT NULLになるため、既存行があると失敗します）。

-- ---- 店舗（テナント）----

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 1ユーザーが複数店舗に所属できる（将来的な複数店舗運営・招待を見込む）
create table if not exists restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner', -- 'owner' | 'staff'
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);
create index if not exists idx_restaurant_members_user on restaurant_members(user_id);

alter table restaurants enable row level security;
alter table restaurant_members enable row level security;

-- 自分が所属する店舗だけ見える
create policy "members can read own restaurant" on restaurants
  for select using (
    id in (select restaurant_id from restaurant_members where user_id = auth.uid())
  );

create policy "members can read own memberships" on restaurant_members
  for select using (user_id = auth.uid());

-- ---- 既存テーブルに restaurant_id を追加 ----

alter table ingredients add column if not exists restaurant_id uuid references restaurants(id) on delete cascade;
alter table menu_items add column if not exists restaurant_id uuid references restaurants(id) on delete cascade;

-- 既存データがなければNOT NULL制約を付ける（データが残っている場合はこの2行はスキップしてください）
alter table ingredients alter column restaurant_id set not null;
alter table menu_items alter column restaurant_id set not null;

create index if not exists idx_ingredients_restaurant on ingredients(restaurant_id);
create index if not exists idx_menu_items_restaurant on menu_items(restaurant_id);

-- ---- RLSを「自分の店舗のデータのみ」に更新 ----
-- サーバーは特権キー(SUPABASE_SECRET_KEY)を使うためRLSを迂回するが、
-- 将来クライアントから直接Supabaseを叩くようになった場合の保険として設定しておく。

drop policy if exists "authenticated read/write ingredients" on ingredients;
create policy "members read/write own ingredients" on ingredients
  for all
  using (restaurant_id in (select restaurant_id from restaurant_members where user_id = auth.uid()))
  with check (restaurant_id in (select restaurant_id from restaurant_members where user_id = auth.uid()));

drop policy if exists "authenticated read/write price history" on ingredient_price_history;
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

drop policy if exists "authenticated read/write menu items" on menu_items;
create policy "members read/write own menu items" on menu_items
  for all
  using (restaurant_id in (select restaurant_id from restaurant_members where user_id = auth.uid()))
  with check (restaurant_id in (select restaurant_id from restaurant_members where user_id = auth.uid()));

drop policy if exists "authenticated read/write menu ingredients" on menu_ingredients;
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
