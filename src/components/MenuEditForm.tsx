"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { Ingredient, MenuIngredientUsage, MenuItem } from "@/types";
import { ingredientCostForUsage } from "@/lib/data";
import { formatPercent, formatYen } from "@/lib/format";
import { Badge, PrimaryButton, SecondaryButton } from "@/components/ui";

const inputClass =
  "h-11 px-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)] w-full";
const labelClass = "text-[12px] text-[var(--text-secondary)] mb-1 block";

export default function MenuEditForm({
  menu,
  allIngredients,
}: {
  menu: MenuItem | null;
  allIngredients: Ingredient[];
}) {
  const router = useRouter();
  const [name, setName] = useState(menu?.name ?? "");
  const [sellPrice, setSellPrice] = useState(menu?.sellPrice ?? 0);
  const [usages, setUsages] = useState<MenuIngredientUsage[]>(
    menu?.ingredients ?? []
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cost = useMemo(() => {
    return usages.reduce((sum, usage) => {
      const ingredient = allIngredients.find((i) => i.id === usage.ingredientId);
      if (!ingredient) return sum;
      return sum + ingredientCostForUsage(ingredient, usage.quantity);
    }, 0);
  }, [usages, allIngredients]);

  const ratio = sellPrice > 0 ? (cost / sellPrice) * 100 : 0;

  function updateUsage(index: number, patch: Partial<MenuIngredientUsage>) {
    setUsages((prev) =>
      prev.map((u, i) => (i === index ? { ...u, ...patch } : u))
    );
  }

  function addUsage() {
    if (allIngredients.length === 0) return;
    setUsages((prev) => [
      ...prev,
      { ingredientId: allIngredients[0].id, quantity: 0 },
    ]);
  }

  function removeUsage(index: number) {
    setUsages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    const payload = { name, sellPrice, ingredients: usages };
    try {
      const res = await fetch(
        menu ? `/api/menu/${menu.id}` : "/api/menu",
        {
          method: menu ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("failed");
      router.push("/menu");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!menu) return;
    setDeleting(true);
    try {
      await fetch(`/api/menu/${menu.id}`, { method: "DELETE" });
      router.push("/menu");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>メニュー名</label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="生姜焼き定食"
        />
      </div>

      <div>
        <label className={labelClass}>売価（円）</label>
        <input
          type="number"
          className={inputClass}
          value={sellPrice}
          onChange={(e) => setSellPrice(Number(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 p-3 rounded-[8px] bg-[var(--surface-1)]">
        <div>
          <p className="text-[12px] text-[var(--text-secondary)] mb-0.5">原価</p>
          <p className="text-[18px] font-medium text-[var(--text-primary)]">
            {formatYen(cost)}
          </p>
        </div>
        <div>
          <p className="text-[12px] text-[var(--text-secondary)] mb-0.5">原価率</p>
          <Badge tone={ratio <= 30 ? "success" : ratio <= 40 ? "warning" : "danger"}>
            {formatPercent(ratio, 1)}
          </Badge>
        </div>
      </div>

      <div>
        <p className={labelClass}>使用食材</p>
        <div className="flex flex-col gap-2">
          {usages.map((usage, index) => {
            const ingredient = allIngredients.find(
              (i) => i.id === usage.ingredientId
            );
            const lineCost = ingredient
              ? ingredientCostForUsage(ingredient, usage.quantity)
              : 0;
            return (
              <div
                key={index}
                className="p-3 border border-[var(--border)] rounded-[8px]"
              >
                <div className="flex gap-2">
                  <select
                    className={inputClass}
                    value={usage.ingredientId}
                    onChange={(e) =>
                      updateUsage(index, { ingredientId: e.target.value })
                    }
                  >
                    {allIngredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeUsage(index)}
                    aria-label="この食材を削除"
                    className="w-11 h-11 shrink-0 flex items-center justify-center rounded-[8px] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--danger)]"
                  >
                    <IconTrash size={16} aria-hidden />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    className={inputClass}
                    value={usage.quantity}
                    onChange={(e) =>
                      updateUsage(index, { quantity: Number(e.target.value) })
                    }
                  />
                  <span className="text-[13px] text-[var(--text-muted)] shrink-0">
                    {ingredient?.unitLabel}
                  </span>
                  <span className="text-[13px] text-[var(--text-secondary)] shrink-0 ml-auto">
                    {formatYen(lineCost)}
                  </span>
                </div>
              </div>
            );
          })}

          <button
            onClick={addUsage}
            className="h-10 rounded-[8px] border border-dashed border-[var(--border-strong)] text-[var(--text-secondary)] text-[13px] flex items-center justify-center gap-1.5"
          >
            <IconPlus size={16} aria-hidden />
            食材を追加
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <PrimaryButton className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? "保存中…" : "保存"}
        </PrimaryButton>
        {menu && (
          <SecondaryButton onClick={handleDelete} disabled={deleting}>
            削除
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}
