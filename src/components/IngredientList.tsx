"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IconArrowDown, IconArrowUp, IconSearch } from "@tabler/icons-react";
import type { Ingredient, IngredientCategory } from "@/types";
import { priceChangePercent } from "@/lib/data";
import { formatSignedPercent, formatYen } from "@/lib/format";

const CATEGORIES: IngredientCategory[] = [
  "肉",
  "魚",
  "野菜",
  "調味料",
  "米・穀物",
  "その他",
];

export default function IngredientList({
  ingredients,
}: {
  ingredients: Ingredient[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IngredientCategory | "すべて">(
    "すべて"
  );

  const filtered = useMemo(() => {
    return ingredients.filter((ingredient) => {
      const matchesCategory =
        category === "すべて" || ingredient.category === category;
      const matchesQuery = ingredient.name
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [ingredients, query, category]);

  return (
    <div>
      <div className="px-4 md:px-8 mb-3">
        <div className="flex items-center gap-2 h-9 px-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface-1)]">
          <IconSearch size={16} className="text-[var(--text-muted)]" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="食材名で検索"
            className="flex-1 bg-transparent text-[13px] outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      <div className="px-4 md:px-8 mb-3 flex gap-2 overflow-x-auto">
        {(["すべて", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`text-[12px] px-3 py-1.5 rounded-[8px] whitespace-nowrap ${
              category === c
                ? "bg-[var(--brand)] text-[var(--on-brand)]"
                : "border border-[var(--border)] text-[var(--text-secondary)]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="px-4 md:px-8 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="text-[13px] text-[var(--text-muted)] py-6 text-center">
            該当する食材がありません。
          </p>
        ) : (
          filtered.map((ingredient) => {
            const change = priceChangePercent(ingredient);
            return (
              <Link
                key={ingredient.id}
                href={`/ingredients/${ingredient.id}`}
                className="p-3 border border-[var(--border)] rounded-[8px] hover:bg-[var(--surface-1)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[15px] text-[var(--text-primary)]">
                    {ingredient.name}
                  </p>
                  <p className="text-[15px] font-medium text-[var(--text-primary)]">
                    {formatYen(ingredient.unitPrice)}
                    <span className="text-[11px] text-[var(--text-muted)] font-normal">
                      {" "}
                      /{ingredient.unitQuantity === 1
                        ? ""
                        : ingredient.unitQuantity}
                      {ingredient.unitLabel}
                    </span>
                  </p>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[12px] text-[var(--text-muted)]">
                    仕入先: {ingredient.supplier}
                  </p>
                  {change !== null && Math.round(change) !== 0 && (
                    <span
                      className={`text-[11px] flex items-center gap-0.5 ${
                        change > 0
                          ? "text-[var(--danger)]"
                          : "text-[var(--success)]"
                      }`}
                    >
                      {change > 0 ? (
                        <IconArrowUp size={12} aria-hidden />
                      ) : (
                        <IconArrowDown size={12} aria-hidden />
                      )}
                      {formatSignedPercent(change)}
                    </span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
