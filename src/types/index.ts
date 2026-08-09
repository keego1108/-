// ドメインの型定義。
// Supabase接続後もこの型を維持したまま lib/data.ts の実装だけ差し替えられるようにしている。

export type IngredientCategory = "肉" | "魚" | "野菜" | "調味料" | "米・穀物" | "その他";

export interface PriceHistoryEntry {
  date: string; // ISO date (YYYY-MM-DD)
  unitPrice: number;
}

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  unitPrice: number; // 現在の単価
  unitQuantity: number; // 単価の基準量 (例: 100)
  unitLabel: string; // 単位 (例: "g", "個", "L", "kg")
  supplier: string;
  currentStock: number;
  parLevel: number; // 基準在庫数（これを下回ったらアラート）
  stockUnit: string; // 在庫の単位 (例: "kg", "個")
  priceHistory: PriceHistoryEntry[]; // 古い順
}

export interface MenuIngredientUsage {
  ingredientId: string;
  quantity: number; // ingredient.unitLabel と同じ単位での使用量
}

export interface MenuItem {
  id: string;
  name: string;
  sellPrice: number;
  ingredients: MenuIngredientUsage[];
}

export interface OcrExtractedItem {
  name: string;
  unitPrice: number;
  unitLabel: string;
  confidence: "high" | "low";
}
