"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconAlertTriangle,
  IconCamera,
  IconFileText,
  IconUpload,
} from "@tabler/icons-react";
import type { Ingredient, OcrExtractedItem } from "@/types";
import { convertUnitPrice, splitAmountUnit } from "@/lib/units";
import { formatYen } from "@/lib/format";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import IngredientEditForm from "@/components/IngredientEditForm";

const inputClass =
  "h-9 px-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)]";

type Mode = "choose" | "manual" | "loading" | "result";

// 読み取った1行を、既存の食材の単価更新に使うか（targetId）、新規登録にするか（空文字）。
type DraftItem = OcrExtractedItem & { targetId: string };

export default function OcrIngredientFlow({
  allIngredients,
}: {
  allIngredients: Ingredient[];
}) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("choose");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) return;
    setMode("loading");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "読み取りに失敗しました");
      setItems(
        (data.items as OcrExtractedItem[]).map((item) => ({
          ...item,
          targetId: item.matchedIngredientId ?? "",
        }))
      );
      setDemo(Boolean(data.demo));
      setMode("result");
    } catch {
      setError("読み取りに失敗しました。もう一度お試しください。");
      setMode("choose");
    }
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  // 既存の食材に反映する行の、単価表の基準（例: 100gあたり）に直した新しい単価。
  // 単位が違って換算できない場合はnull。
  function convertedPrice(item: DraftItem): number | null {
    const target = allIngredients.find((i) => i.id === item.targetId);
    if (!target) return null;
    return convertUnitPrice(item.unitPrice, item.unitLabel, target);
  }

  function unitBasis(ingredientId: string): string {
    const target = allIngredients.find((i) => i.id === ingredientId);
    return target ? `${target.unitQuantity}${target.unitLabel}` : "";
  }

  const hasUnconvertible = items.some(
    (item) => item.targetId && convertedPrice(item) === null
  );

  async function handleSaveAll() {
    if (hasUnconvertible) return;
    setSaving(true);
    try {
      // 納品書の単価が一番正確なので、既存の食材は新規追加せず単価を上書き更新する
      // （価格履歴はDB側で自動的に残る）。単価表にない食材だけ新規登録する。
      await Promise.all(
        items.map((item) => {
          if (item.targetId) {
            return fetch(`/api/ingredients/${item.targetId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ unitPrice: convertedPrice(item) }),
            });
          }
          const { amount, unit } = splitAmountUnit(item.unitLabel);
          return fetch("/api/ingredients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: item.name,
              category: "その他",
              unitPrice: item.unitPrice,
              unitQuantity: amount,
              unitLabel: unit,
              supplier: "",
              currentStock: 0,
              parLevel: 0,
              stockUnit: unit,
            }),
          });
        })
      );
      router.push("/ingredients");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (mode === "manual") {
    return <IngredientEditForm ingredient={null} />;
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
        <p className="text-[13px] text-[var(--text-secondary)]">
          {items.length}件の食材を検出しました。内容を確認して保存してください。
        </p>
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div
              key={index}
              className={`p-3 rounded-[8px] border ${
                item.confidence === "low"
                  ? "border-[var(--warning)] bg-[var(--warning-bg)]"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  className={`${inputClass} flex-1`}
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                />
                {item.confidence === "low" && (
                  <IconAlertTriangle
                    size={16}
                    className="text-[var(--warning)] shrink-0"
                    aria-hidden
                  />
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  className={`${inputClass} flex-1`}
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(index, { unitPrice: Number(e.target.value) })
                  }
                />
                <input
                  className={`${inputClass} w-24`}
                  value={item.unitLabel}
                  onChange={(e) =>
                    updateItem(index, { unitLabel: e.target.value })
                  }
                />
              </div>
              {item.confidence === "low" && (
                <p className="text-[11px] text-[var(--warning)] mt-1.5">
                  読み取り精度が低い可能性があります。内容を確認してください。
                </p>
              )}
              <div className="mt-2">
                <label className="text-[11px] text-[var(--text-muted)] block mb-1">
                  反映先
                </label>
                <select
                  className={`${inputClass} w-full`}
                  value={item.targetId}
                  onChange={(e) => updateItem(index, { targetId: e.target.value })}
                >
                  <option value="">新しい食材として登録</option>
                  {allIngredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      既存の「{i.name}」の単価を更新
                    </option>
                  ))}
                </select>
                {item.targetId && convertedPrice(item) !== null && (
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1.5">
                    単価表では{unitBasis(item.targetId)}あたり
                    {formatYen(convertedPrice(item) ?? 0)}に更新されます
                    （現在{" "}
                    {formatYen(
                      allIngredients.find((i) => i.id === item.targetId)?.unitPrice ?? 0
                    )}
                    ）
                  </p>
                )}
                {item.targetId && convertedPrice(item) === null && (
                  <p className="text-[11px] text-[var(--warning)] mt-1.5">
                    単位が違うため単価を換算できません。「新しい食材として登録」に切り替えてください。
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <PrimaryButton
          onClick={handleSaveAll}
          disabled={saving || items.length === 0 || hasUnconvertible}
        >
          {saving
            ? "保存中…"
            : hasUnconvertible
              ? "換算できない行があります"
              : `単価表に保存（${items.length}件）`}
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
          納品書・値札を枠内に収めてください
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
