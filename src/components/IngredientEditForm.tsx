"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Ingredient, IngredientCategory } from "@/types";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { formatYen } from "@/lib/format";

const CATEGORIES: IngredientCategory[] = [
  "肉",
  "魚",
  "野菜",
  "調味料",
  "米・穀物",
  "その他",
];

const inputClass =
  "h-11 px-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)] w-full";
const labelClass = "text-[12px] text-[var(--text-secondary)] mb-1 block";

type IngredientFormValues = {
  name: string;
  category: IngredientCategory;
  unitPrice: number;
  unitQuantity: number;
  unitLabel: string;
  supplier: string;
  currentStock: number;
  parLevel: number;
  stockUnit: string;
};

const EMPTY_FORM: IngredientFormValues = {
  name: "",
  category: "その他",
  unitPrice: 0,
  unitQuantity: 100,
  unitLabel: "g",
  supplier: "",
  currentStock: 0,
  parLevel: 0,
  stockUnit: "",
};

export default function IngredientEditForm({
  ingredient,
  initial,
  onSaved,
}: {
  ingredient: Ingredient | null;
  initial?: Partial<IngredientFormValues>;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<IngredientFormValues>(
    ingredient
      ? {
          name: ingredient.name,
          category: ingredient.category,
          unitPrice: ingredient.unitPrice,
          unitQuantity: ingredient.unitQuantity,
          unitLabel: ingredient.unitLabel,
          supplier: ingredient.supplier,
          currentStock: ingredient.currentStock,
          parLevel: ingredient.parLevel,
          stockUnit: ingredient.stockUnit,
        }
      : { ...EMPTY_FORM, ...initial }
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(
        ingredient ? `/api/ingredients/${ingredient.id}` : "/api/ingredients",
        {
          method: ingredient ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) throw new Error("failed");
      if (onSaved) {
        onSaved();
      } else {
        router.push("/ingredients");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!ingredient) return;
    setDeleting(true);
    try {
      await fetch(`/api/ingredients/${ingredient.id}`, { method: "DELETE" });
      router.push("/ingredients");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>食材名</label>
        <input
          className={inputClass}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div>
        <label className={labelClass}>カテゴリ</label>
        <select
          className={inputClass}
          value={form.category}
          onChange={(e) =>
            setForm({
              ...form,
              category: e.target.value as IngredientCategory,
            })
          }
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>単価（円）</label>
          <input
            type="number"
            className={inputClass}
            value={form.unitPrice}
            onChange={(e) =>
              setForm({ ...form, unitPrice: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <label className={labelClass}>基準量</label>
          <input
            type="number"
            className={inputClass}
            value={form.unitQuantity}
            onChange={(e) =>
              setForm({ ...form, unitQuantity: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <label className={labelClass}>単位</label>
          <input
            className={inputClass}
            value={form.unitLabel}
            onChange={(e) => setForm({ ...form, unitLabel: e.target.value })}
            placeholder="g / 個 / L"
          />
        </div>
      </div>
      <p className="text-[12px] text-[var(--text-muted)] -mt-2">
        表示価格の目安: {formatYen(form.unitPrice)} / {form.unitQuantity}
        {form.unitLabel}
      </p>

      <div>
        <label className={labelClass}>仕入先</label>
        <input
          className={inputClass}
          value={form.supplier}
          onChange={(e) => setForm({ ...form, supplier: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>現在庫</label>
          <input
            type="number"
            className={inputClass}
            value={form.currentStock}
            onChange={(e) =>
              setForm({ ...form, currentStock: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <label className={labelClass}>基準在庫</label>
          <input
            type="number"
            className={inputClass}
            value={form.parLevel}
            onChange={(e) =>
              setForm({ ...form, parLevel: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <label className={labelClass}>在庫単位</label>
          <input
            className={inputClass}
            value={form.stockUnit}
            onChange={(e) => setForm({ ...form, stockUnit: e.target.value })}
          />
        </div>
      </div>

      {ingredient && ingredient.priceHistory.length > 0 && (
        <div>
          <p className={labelClass}>価格の履歴</p>
          <div className="flex flex-col gap-1 border border-[var(--border)] rounded-[8px] p-3">
            {ingredient.priceHistory
              .slice()
              .reverse()
              .map((h) => (
                <div
                  key={h.date}
                  className="flex justify-between text-[13px]"
                >
                  <span className="text-[var(--text-secondary)]">
                    {h.date}
                  </span>
                  <span className="text-[var(--text-primary)]">
                    {formatYen(h.unitPrice)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <PrimaryButton className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? "保存中…" : "保存"}
        </PrimaryButton>
        {ingredient && (
          <SecondaryButton onClick={handleDelete} disabled={deleting}>
            削除
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}
