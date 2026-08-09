import type {
  Ingredient,
  IngredientCategory,
  MenuItem,
  PriceHistoryEntry,
} from "@/types";
import { getSupabaseClient } from "@/lib/supabase";

// ---- モックデータ ----
// Supabaseを接続したら、この配列を返す関数の中身をDBフェッチに差し替える。
// 呼び出し側（コンポーネント）は getIngredients() / getMenuItems() の形を変えなければ影響を受けない。

function history(entries: [string, number][]): PriceHistoryEntry[] {
  return entries.map(([date, unitPrice]) => ({ date, unitPrice }));
}

const ingredients: Ingredient[] = [
  {
    id: "ing-pork-belly",
    name: "豚バラ肉",
    category: "肉",
    unitPrice: 157,
    unitQuantity: 100,
    unitLabel: "g",
    supplier: "山田精肉店",
    currentStock: 1.2,
    parLevel: 5,
    stockUnit: "kg",
    priceHistory: history([
      ["2026-03-01", 140],
      ["2026-04-01", 142],
      ["2026-05-01", 145],
      ["2026-06-01", 148],
      ["2026-07-01", 153],
      ["2026-08-01", 157],
    ]),
  },
  {
    id: "ing-onion",
    name: "玉ねぎ",
    category: "野菜",
    unitPrice: 28,
    unitQuantity: 1,
    unitLabel: "個",
    supplier: "JA直送センター",
    currentStock: 3,
    parLevel: 10,
    stockUnit: "kg",
    priceHistory: history([
      ["2026-03-01", 26],
      ["2026-04-01", 27],
      ["2026-05-01", 27],
      ["2026-06-01", 28],
      ["2026-07-01", 28],
      ["2026-08-01", 28],
    ]),
  },
  {
    id: "ing-cabbage",
    name: "キャベツ",
    category: "野菜",
    unitPrice: 40,
    unitQuantity: 100,
    unitLabel: "g",
    supplier: "JA直送センター",
    currentStock: 6,
    parLevel: 8,
    stockUnit: "玉",
    priceHistory: history([
      ["2026-03-01", 42],
      ["2026-04-01", 43],
      ["2026-05-01", 41],
      ["2026-06-01", 40],
      ["2026-07-01", 39],
      ["2026-08-01", 40],
    ]),
  },
  {
    id: "ing-soy-sauce",
    name: "濃口しょうゆ",
    category: "調味料",
    unitPrice: 420,
    unitQuantity: 1,
    unitLabel: "L",
    supplier: "田中食品卸",
    currentStock: 4,
    parLevel: 3,
    stockUnit: "L",
    priceHistory: history([
      ["2026-03-01", 410],
      ["2026-04-01", 410],
      ["2026-05-01", 415],
      ["2026-06-01", 415],
      ["2026-07-01", 420],
      ["2026-08-01", 420],
    ]),
  },
  {
    id: "ing-rice",
    name: "白米",
    category: "米・穀物",
    unitPrice: 33,
    unitQuantity: 100,
    unitLabel: "g",
    supplier: "田中食品卸",
    currentStock: 18,
    parLevel: 15,
    stockUnit: "kg",
    priceHistory: history([
      ["2026-03-01", 30],
      ["2026-04-01", 30],
      ["2026-05-01", 31],
      ["2026-06-01", 32],
      ["2026-07-01", 32],
      ["2026-08-01", 33],
    ]),
  },
  {
    id: "ing-oil",
    name: "食用油",
    category: "調味料",
    unitPrice: 486,
    unitQuantity: 1,
    unitLabel: "L",
    supplier: "田中食品卸",
    currentStock: 5,
    parLevel: 4,
    stockUnit: "L",
    priceHistory: history([
      ["2026-03-01", 450],
      ["2026-04-01", 455],
      ["2026-05-01", 460],
      ["2026-06-01", 470],
      ["2026-07-01", 480],
      ["2026-08-01", 486],
    ]),
  },
  {
    id: "ing-chicken-thigh",
    name: "鶏もも肉",
    category: "肉",
    unitPrice: 118,
    unitQuantity: 100,
    unitLabel: "g",
    supplier: "山田精肉店",
    currentStock: 4.5,
    parLevel: 4,
    stockUnit: "kg",
    priceHistory: history([
      ["2026-03-01", 110],
      ["2026-04-01", 112],
      ["2026-05-01", 113],
      ["2026-06-01", 115],
      ["2026-07-01", 116],
      ["2026-08-01", 118],
    ]),
  },
  {
    id: "ing-beef-short-rib",
    name: "牛カルビ",
    category: "肉",
    unitPrice: 210,
    unitQuantity: 100,
    unitLabel: "g",
    supplier: "山田精肉店",
    currentStock: 3.2,
    parLevel: 3,
    stockUnit: "kg",
    priceHistory: history([
      ["2026-03-01", 195],
      ["2026-04-01", 198],
      ["2026-05-01", 200],
      ["2026-06-01", 203],
      ["2026-07-01", 206],
      ["2026-08-01", 210],
    ]),
  },
];

const menuItems: MenuItem[] = [
  {
    id: "menu-shogayaki",
    name: "生姜焼き定食",
    sellPrice: 950,
    ingredients: [
      { ingredientId: "ing-pork-belly", quantity: 120 },
      { ingredientId: "ing-cabbage", quantity: 80 },
      { ingredientId: "ing-rice", quantity: 200 },
    ],
  },
  {
    id: "menu-beef-bowl",
    name: "牛カルビ丼",
    sellPrice: 1100,
    ingredients: [
      { ingredientId: "ing-beef-short-rib", quantity: 150 },
      { ingredientId: "ing-onion", quantity: 0.5 },
      { ingredientId: "ing-rice", quantity: 220 },
      { ingredientId: "ing-soy-sauce", quantity: 0.03 },
    ],
  },
  {
    id: "menu-karaage",
    name: "鶏の唐揚げ定食",
    sellPrice: 900,
    ingredients: [
      { ingredientId: "ing-chicken-thigh", quantity: 150 },
      { ingredientId: "ing-oil", quantity: 0.05 },
      { ingredientId: "ing-cabbage", quantity: 60 },
      { ingredientId: "ing-rice", quantity: 200 },
    ],
  },
];

// ---- Supabase行 ⇔ アプリ型 変換 ----
// テーブル定義は supabase/schema.sql を参照。

interface IngredientRow {
  id: string;
  name: string;
  category: string;
  unit_price: number;
  unit_quantity: number;
  unit_label: string;
  supplier: string;
  current_stock: number;
  par_level: number;
  stock_unit: string;
}

interface PriceHistoryRow {
  ingredient_id: string;
  date: string;
  unit_price: number;
  created_at: string;
}

interface MenuItemRow {
  id: string;
  name: string;
  sell_price: number;
}

interface MenuIngredientRow {
  menu_item_id: string;
  ingredient_id: string;
  quantity: number;
}

function rowToIngredient(
  row: IngredientRow,
  historyRows: PriceHistoryRow[]
): Ingredient {
  return {
    id: row.id,
    name: row.name,
    category: row.category as IngredientCategory,
    unitPrice: Number(row.unit_price),
    unitQuantity: Number(row.unit_quantity),
    unitLabel: row.unit_label,
    supplier: row.supplier,
    currentStock: Number(row.current_stock),
    parLevel: Number(row.par_level),
    stockUnit: row.stock_unit,
    priceHistory: historyRows
      .filter((h) => h.ingredient_id === row.id)
      // 同じ日に複数回更新された場合も、登録順(created_at)を保った並びにする。
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.created_at.localeCompare(b.created_at)
      )
      .map((h) => ({ date: h.date, unitPrice: Number(h.unit_price) })),
  };
}

function rowToMenuItem(
  row: MenuItemRow,
  usageRows: MenuIngredientRow[]
): MenuItem {
  return {
    id: row.id,
    name: row.name,
    sellPrice: Number(row.sell_price),
    ingredients: usageRows
      .filter((u) => u.menu_item_id === row.id)
      .map((u) => ({
        ingredientId: u.ingredient_id,
        quantity: Number(u.quantity),
      })),
  };
}

// ---- データ取得 ----
// Supabaseの接続情報（NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY）が設定されていれば
// restaurantId で絞り込んだDBデータを、未設定ならメモリ上のモックデータ（単一テナント）を返す。
// restaurantId は各APIルート/ページで lib/tenant.ts の requireTenant() から取得したものを渡す。

export async function getIngredients(restaurantId: string): Promise<Ingredient[]> {
  const client = getSupabaseClient();
  if (!client) return ingredients;

  const { data: rows, error: rowsError } = await client
    .from("ingredients")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name");
  if (rowsError) throw rowsError;
  if (!rows || rows.length === 0) return [];

  const ingredientIds = rows.map((r) => r.id);
  const { data: historyRows, error: historyError } = await client
    .from("ingredient_price_history")
    .select("*")
    .in("ingredient_id", ingredientIds)
    .order("date")
    .order("created_at");
  if (historyError) throw historyError;

  return rows.map((row) => rowToIngredient(row, historyRows ?? []));
}

export async function getIngredient(
  restaurantId: string,
  id: string
): Promise<Ingredient | undefined> {
  const client = getSupabaseClient();
  if (!client) return ingredients.find((i) => i.id === id);

  const { data: row, error: rowError } = await client
    .from("ingredients")
    .select("*")
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (rowError) throw rowError;
  if (!row) return undefined;

  const { data: historyRows, error: historyError } = await client
    .from("ingredient_price_history")
    .select("*")
    .eq("ingredient_id", id)
    .order("date")
    .order("created_at");
  if (historyError) throw historyError;

  return rowToIngredient(row, historyRows ?? []);
}

export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
  const client = getSupabaseClient();
  if (!client) return menuItems;

  const { data: rows, error: rowsError } = await client
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name");
  if (rowsError) throw rowsError;
  if (!rows || rows.length === 0) return [];

  const menuIds = rows.map((r) => r.id);
  const { data: usageRows, error: usageError } = await client
    .from("menu_ingredients")
    .select("*")
    .in("menu_item_id", menuIds);
  if (usageError) throw usageError;

  return rows.map((row) => rowToMenuItem(row, usageRows ?? []));
}

export async function getMenuItem(
  restaurantId: string,
  id: string
): Promise<MenuItem | undefined> {
  const client = getSupabaseClient();
  if (!client) return menuItems.find((m) => m.id === id);

  const { data: row, error: rowError } = await client
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (rowError) throw rowError;
  if (!row) return undefined;

  const { data: usageRows, error: usageError } = await client
    .from("menu_ingredients")
    .select("*")
    .eq("menu_item_id", id);
  if (usageError) throw usageError;

  return rowToMenuItem(row, usageRows ?? []);
}

// ---- データ更新 ----
// Supabase未接続の間はメモリ上の配列を直接書き換える（サーバープロセスが生きている間だけ保持、
// テナント分離もしない単一テナットのデモ動作）。

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
}

export async function createIngredient(
  restaurantId: string,
  input: Omit<Ingredient, "id" | "priceHistory"> & { priceHistory?: PriceHistoryEntry[] }
): Promise<Ingredient> {
  const client = getSupabaseClient();

  if (!client) {
    const today = new Date().toISOString().slice(0, 10);
    const newIngredient: Ingredient = {
      ...input,
      id: makeId("ing"),
      priceHistory: input.priceHistory ?? [{ date: today, unitPrice: input.unitPrice }],
    };
    ingredients.push(newIngredient);
    return newIngredient;
  }

  // unit_price を挿入すると、DB側のトリガー(supabase/schema.sql)が
  // ingredient_price_history に初回の価格履歴を自動で追加する。
  const { data: row, error } = await client
    .from("ingredients")
    .insert({
      restaurant_id: restaurantId,
      name: input.name,
      category: input.category,
      unit_price: input.unitPrice,
      unit_quantity: input.unitQuantity,
      unit_label: input.unitLabel,
      supplier: input.supplier,
      current_stock: input.currentStock,
      par_level: input.parLevel,
      stock_unit: input.stockUnit,
    })
    .select("*")
    .single();
  if (error) throw error;

  const created = await getIngredient(restaurantId, row.id);
  if (!created) throw new Error("食材の作成に失敗しました");
  return created;
}

export async function updateIngredient(
  restaurantId: string,
  id: string,
  patch: Partial<Omit<Ingredient, "id" | "priceHistory">>
): Promise<Ingredient | undefined> {
  const client = getSupabaseClient();

  if (!client) {
    const ingredient = ingredients.find((i) => i.id === id);
    if (!ingredient) return undefined;

    // 単価が変わった場合は履歴に追記して、分析タブの推移に反映されるようにする。
    if (
      typeof patch.unitPrice === "number" &&
      patch.unitPrice !== ingredient.unitPrice
    ) {
      const today = new Date().toISOString().slice(0, 10);
      const last = ingredient.priceHistory[ingredient.priceHistory.length - 1];
      if (last && last.date === today) {
        last.unitPrice = patch.unitPrice;
      } else {
        ingredient.priceHistory.push({ date: today, unitPrice: patch.unitPrice });
      }
    }

    Object.assign(ingredient, patch);
    return ingredient;
  }

  // 他店舗のIDを渡されても更新できないように、先に所有権を確認する。
  const { data: existing, error: existingError } = await client
    .from("ingredients")
    .select("id")
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing) return undefined;

  // unit_price を更新すると、DB側のトリガーが価格履歴に自動で追記する。
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.category !== undefined) dbPatch.category = patch.category;
  if (patch.unitPrice !== undefined) dbPatch.unit_price = patch.unitPrice;
  if (patch.unitQuantity !== undefined) dbPatch.unit_quantity = patch.unitQuantity;
  if (patch.unitLabel !== undefined) dbPatch.unit_label = patch.unitLabel;
  if (patch.supplier !== undefined) dbPatch.supplier = patch.supplier;
  if (patch.currentStock !== undefined) dbPatch.current_stock = patch.currentStock;
  if (patch.parLevel !== undefined) dbPatch.par_level = patch.parLevel;
  if (patch.stockUnit !== undefined) dbPatch.stock_unit = patch.stockUnit;

  if (Object.keys(dbPatch).length > 0) {
    const { error } = await client.from("ingredients").update(dbPatch).eq("id", id);
    if (error) throw error;
  }

  return getIngredient(restaurantId, id);
}

export async function deleteIngredient(restaurantId: string, id: string): Promise<void> {
  const client = getSupabaseClient();

  if (!client) {
    const idx = ingredients.findIndex((i) => i.id === id);
    if (idx >= 0) ingredients.splice(idx, 1);
    return;
  }

  const { error } = await client
    .from("ingredients")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);
  if (error) throw error;
}

export async function createMenuItem(
  restaurantId: string,
  input: Omit<MenuItem, "id">
): Promise<MenuItem> {
  const client = getSupabaseClient();

  if (!client) {
    const newMenu: MenuItem = { ...input, id: makeId("menu") };
    menuItems.push(newMenu);
    return newMenu;
  }

  const { data: row, error } = await client
    .from("menu_items")
    .insert({
      restaurant_id: restaurantId,
      name: input.name,
      sell_price: input.sellPrice,
    })
    .select("*")
    .single();
  if (error) throw error;

  if (input.ingredients.length > 0) {
    const { error: usageError } = await client.from("menu_ingredients").insert(
      input.ingredients.map((usage) => ({
        menu_item_id: row.id,
        ingredient_id: usage.ingredientId,
        quantity: usage.quantity,
      }))
    );
    if (usageError) throw usageError;
  }

  const created = await getMenuItem(restaurantId, row.id);
  if (!created) throw new Error("メニューの作成に失敗しました");
  return created;
}

export async function updateMenuItem(
  restaurantId: string,
  id: string,
  patch: Partial<Omit<MenuItem, "id">>
): Promise<MenuItem | undefined> {
  const client = getSupabaseClient();

  if (!client) {
    const menu = menuItems.find((m) => m.id === id);
    if (!menu) return undefined;
    Object.assign(menu, patch);
    return menu;
  }

  // 他店舗のIDを渡されても更新できないように、先に所有権を確認する。
  const { data: existing, error: existingError } = await client
    .from("menu_items")
    .select("id")
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing) return undefined;

  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.sellPrice !== undefined) dbPatch.sell_price = patch.sellPrice;

  if (Object.keys(dbPatch).length > 0) {
    const { error } = await client.from("menu_items").update(dbPatch).eq("id", id);
    if (error) throw error;
  }

  // 使用食材は「全削除してから入れ直す」方式で置き換える。
  if (patch.ingredients !== undefined) {
    const { error: deleteError } = await client
      .from("menu_ingredients")
      .delete()
      .eq("menu_item_id", id);
    if (deleteError) throw deleteError;

    if (patch.ingredients.length > 0) {
      const { error: insertError } = await client.from("menu_ingredients").insert(
        patch.ingredients.map((usage) => ({
          menu_item_id: id,
          ingredient_id: usage.ingredientId,
          quantity: usage.quantity,
        }))
      );
      if (insertError) throw insertError;
    }
  }

  return getMenuItem(restaurantId, id);
}

export async function deleteMenuItem(restaurantId: string, id: string): Promise<void> {
  const client = getSupabaseClient();

  if (!client) {
    const idx = menuItems.findIndex((m) => m.id === id);
    if (idx >= 0) menuItems.splice(idx, 1);
    return;
  }

  const { error } = await client
    .from("menu_items")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);
  if (error) throw error;
}

// ---- 計算ロジック ----
// 単価表の価格が更新されると、これらの関数を通じてメニューの原価・原価率が
// 常に最新の値として再計算される（原価を固定値として保存しない）。

export function pricePerBaseUnit(ingredient: Ingredient): number {
  return ingredient.unitPrice / ingredient.unitQuantity;
}

export function ingredientCostForUsage(ingredient: Ingredient, quantity: number): number {
  return pricePerBaseUnit(ingredient) * quantity;
}

export function calcMenuCost(menu: MenuItem, allIngredients: Ingredient[]): number {
  return menu.ingredients.reduce((sum, usage) => {
    const ingredient = allIngredients.find((i) => i.id === usage.ingredientId);
    if (!ingredient) return sum;
    return sum + ingredientCostForUsage(ingredient, usage.quantity);
  }, 0);
}

export function calcCostRatio(menu: MenuItem, allIngredients: Ingredient[]): number {
  const cost = calcMenuCost(menu, allIngredients);
  if (menu.sellPrice === 0) return 0;
  return (cost / menu.sellPrice) * 100;
}

export function priceChangePercent(ingredient: Ingredient): number | null {
  const h = ingredient.priceHistory;
  if (h.length < 2) return null;
  const latest = h[h.length - 1].unitPrice;
  const previous = h[h.length - 2].unitPrice;
  if (previous === 0) return null;
  return ((latest - previous) / previous) * 100;
}

export type StockStatus = "ok" | "low" | "critical";

export function stockStatus(ingredient: Ingredient): StockStatus {
  if (ingredient.parLevel <= 0) return "ok";
  const ratio = ingredient.currentStock / ingredient.parLevel;
  if (ratio < 0.3) return "critical";
  if (ratio < 1) return "low";
  return "ok";
}

// 指定した日付時点でその食材が実際にいくらだったかを、価格履歴から復元する。
// 分析タブの月次原価率推移で使う。
export function getPriceAt(ingredient: Ingredient, date: string): number {
  const applicable = ingredient.priceHistory.filter((h) => h.date <= date);
  if (applicable.length === 0) return ingredient.priceHistory[0]?.unitPrice ?? ingredient.unitPrice;
  return applicable[applicable.length - 1].unitPrice;
}

export function calcMenuCostAt(menu: MenuItem, allIngredients: Ingredient[], date: string): number {
  return menu.ingredients.reduce((sum, usage) => {
    const ingredient = allIngredients.find((i) => i.id === usage.ingredientId);
    if (!ingredient) return sum;
    const priceAtDate = getPriceAt(ingredient, date);
    const perBaseUnit = priceAtDate / ingredient.unitQuantity;
    return sum + perBaseUnit * usage.quantity;
  }, 0);
}

export interface MonthlyCostRatio {
  label: string; // 例: "3月"
  date: string;
  avgCostRatio: number;
}

export function calcMonthlyCostRatioTrend(
  menus: MenuItem[],
  allIngredients: Ingredient[],
  months: string[] // ISO date, 各月の代表日 (例: "2026-03-01")
): MonthlyCostRatio[] {
  return months.map((date) => {
    const ratios = menus
      .filter((m) => m.sellPrice > 0)
      .map((m) => (calcMenuCostAt(m, allIngredients, date) / m.sellPrice) * 100);
    const avg = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0;
    const month = Number(date.slice(5, 7));
    return { label: `${month}月`, date, avgCostRatio: avg };
  });
}

export async function calcAverageCostRatio(restaurantId: string): Promise<number> {
  const menus = await getMenuItems(restaurantId);
  const ing = await getIngredients(restaurantId);
  if (menus.length === 0) return 0;
  const ratios = menus.map((m) => calcCostRatio(m, ing));
  return ratios.reduce((a, b) => a + b, 0) / ratios.length;
}

export const ANALYSIS_MONTHS = [
  "2026-03-01",
  "2026-04-01",
  "2026-05-01",
  "2026-06-01",
  "2026-07-01",
  "2026-08-01",
];
