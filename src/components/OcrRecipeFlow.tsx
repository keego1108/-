"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconAlertTriangle,
  IconCamera,
  IconFileText,
  IconPlus,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import type { Ingredient, RecipeOcrItem } from "@/types";
import { ingredientCostForUsage } from "@/lib/data";
import { formatPercent, formatYen } from "@/lib/format";
import { Badge, PrimaryButton, SecondaryButton } from "@/components/ui";
import MenuEditForm from "@/components/MenuEditForm";

const inputClass =
  "h-9 px-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)]";

type Mode = "choose" | "manual" | "loading" | "result";

export default function OcrRecipeFlow({
  allIngredients,
}: {
  allIngredients: Ingredient[];
}) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("choose");
  const [menuName, setMenuName] = useState("");
  const [sellPrice, setSellPrice] = useState(0);
  const [items, setItems] = useState<RecipeOcrItem[]>([]);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cost = useMemo(() => {
    return items.reduce((sum, item) => {
      const ingredient = allIngredients.find(
        (i) => i.id === item.matchedIngredientId
      );
      if (!ingredient) return sum;
      return sum + ingredientCostForUsage(ingredient, item.quantity);
    }, 0);
  }, [items, allIngredients]);

  const ratio = sellPrice > 0 ? (cost / sellPrice) * 100 : 0;
  const unresolvedCount = items.filter((i) => !i.matchedIngredientId).length;

  async function handleFile(file: File | null) {
    if (!file) return;
    setMode("loading");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/ocr/recipe", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "読み取りに失敗しました");
      setMenuName(data.menuName ?? "");
      setSellPrice(data.sellPrice ?? 0);
      setItems(data.items ?? []);
      setDemo(Boolean(data.demo));
      setMode("result");
    } catch {
      setError("読み取りに失敗しました。もう一度お試しください。");
      setMode("choose");
    }
  }

  function updateItem(index: number, patch: Partial<RecipeOcrItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function addItem() {
    if (allIngredients.length === 0) return;
    setItems((prev) => [
      ...prev,
      {
        rawName: "",
        matchedIngredientId: null,
        quantity: 0,
        unitLabel: allIngredients[0].unitLabel,
        confidence: "high",
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (unresolvedCount > 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: menuName,
          sellPrice,
          ingredients: items.map((item) => ({
            ingredientId: item.matchedIngredientId,
            quantity: item.quantity,
          })),
        }),
      });
      if (!res.ok) throw new Error("failed");
      router.push("/menu");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (mode === "manual") {
    return <MenuEditForm menu={null} allIngredients={allIngredients} />;
  }

  if (mode === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <IconFileText size={28} className="text-[var(--text-muted)]" aria-hidden />
        <p className="text-[13px] text-[var(--text-secondary)]">読み取っています…</p>
      </div>
    );
  }

  if (mode === "result") {
    return (
      <div className="flex flex-col gap-4">
        {demo && (
          <p className="text-[12px] text-[var(--text-muted)] px-3 py-2 rounded-[8px] bg-[var(--surface-1)]">
            ANTHROPIC_API_KEY が未設定のため、サンプルデータを表示しています。
          </p>
        )}
        {allIngredients.length === 0 && (
          <p className="text-[12px] text-[var(--warning)] px-3 py-2 rounded-[8px] bg-[var(--warning-bg)]">
            単価表に食材が登録されていないため、食材の自動照合ができません。先に単価表へ食材を登録しておくと、次からは自動で紐付きます。
          </p>
        )}

        <div>
          <label className="text-[12px] text-[var(--text-secondary)] mb-1 block">
            メニュー名
          </label>
          <input
            className={`${inputClass} w-full h-11`}
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-[12px] text-[var(--text-secondary)] mb-1 block">
            売価（円）
          </label>
          <input
            type="number"
            className={`${inputClass} w-full h-11`}
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

        <p className="text-[13px] text-[var(--text-secondary)]">
          {items.length}件の食材を検出しました。
          {unresolvedCount > 0 &&
            `　うち${unresolvedCount}件は単価表と自動で紐付けできませんでした。手動で選んでください。`}
        </p>

        <div className="flex flex-col gap-2">
          {items.map((item, index) => {
            const unresolved = !item.matchedIngredientId;
            const ingredient = allIngredients.find(
              (i) => i.id === item.matchedIngredientId
            );
            const lineCost = ingredient
              ? ingredientCostForUsage(ingredient, item.quantity)
              : 0;
            return (
              <div
                key={index}
                className={`p-3 rounded-[8px] border ${
                  unresolved || item.confidence === "low"
                    ? "border-[var(--warning)] bg-[var(--warning-bg)]"
                    : "border-[var(--border)]"
                }`}
              >
                {item.rawName && (
                  <p className="text-[11px] text-[var(--text-muted)] mb-1.5">
                    レシピの記載: 「{item.rawName}」
                  </p>
                )}
                <div className="flex gap-2">
                  <select
                    className={`${inputClass} flex-1`}
                    value={item.matchedIngredientId ?? ""}
                    onChange={(e) =>
                      updateItem(index, {
                        matchedIngredientId: e.target.value || null,
                      })
                    }
                  >
                    <option value="" disabled>
                      -- 食材を選択 --
                    </option>
                    {allIngredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeItem(index)}
                    aria-label="この食材を削除"
                    className="w-9 h-9 shrink-0 flex items-center justify-center rounded-[8px] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--danger)]"
                  >
                    <IconTrash size={16} aria-hidden />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    className={`${inputClass} flex-1`}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, { quantity: Number(e.target.value) })
                    }
                  />
                  <span className="text-[13px] text-[var(--text-muted)] shrink-0">
                    {ingredient?.unitLabel ?? item.unitLabel}
                  </span>
                  <span className="text-[13px] text-[var(--text-secondary)] shrink-0 ml-auto">
                    {formatYen(lineCost)}
                  </span>
                </div>
                {unresolved && (
                  <p className="text-[11px] text-[var(--warning)] mt-1.5 flex items-center gap-1">
                    <IconAlertTriangle size={13} aria-hidden />
                    該当する食材を選んでください。
                  </p>
                )}
              </div>
            );
          })}

          <button
            onClick={addItem}
            disabled={allIngredients.length === 0}
            className="h-10 rounded-[8px] border border-dashed border-[var(--border-strong)] text-[var(--text-secondary)] text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <IconPlus size={16} aria-hidden />
            食材を追加
          </button>
        </div>

        <PrimaryButton
          onClick={handleSave}
          disabled={saving || items.length === 0 || unresolvedCount > 0}
        >
          {saving
            ? "保存中…"
            : unresolvedCount > 0
              ? "未選択の食材があります"
              : "メニューとして保存"}
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-[13px] text-[var(--danger)]">{error}</p>}

      <div className="h-48 rounded-[8px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-1)] flex flex-col items-center justify-center gap-2">
        <IconFileText size={30} className="text-[var(--text-muted)]" aria-hidden />
        <p className="text-[13px] text-[var(--text-muted)] px-6 text-center">
          レシピ（手書き・印刷どちらも可）を枠内に収めてください
        </p>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      <PrimaryButton onClick={() => cameraInputRef.current?.click()}>
        <IconCamera size={18} stroke={1.75} aria-hidden />
        カメラで撮影
      </PrimaryButton>
      <SecondaryButton onClick={() => fileInputRef.current?.click()}>
        <IconUpload size={18} stroke={1.75} aria-hidden />
        写真を選択
      </SecondaryButton>

      <button
        onClick={() => setMode("manual")}
        className="text-[13px] text-[var(--text-secondary)] underline underline-offset-2 mx-auto"
      >
        手動で入力する
      </button>
    </div>
  );
}
