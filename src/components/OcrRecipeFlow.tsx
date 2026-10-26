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
import { convertQuantity } from "@/lib/units";
import { Badge, PrimaryButton, SecondaryButton } from "@/components/ui";
import MenuEditForm from "@/components/MenuEditForm";

const inputClass =
  "h-9 px-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)]";

type Mode = "choose" | "manual" | "loading" | "result";

// 読み取り結果に、「レシピに書かれていた元の分量・単位」を持たせた編集用の行。
// 食材を選び直すたびに、元の値から単価表の単位へ換算し直す。
// needsPrice: 単価が読み取れないまま新規登録した食材（単価0円で入っているため、後で入力が必要）。
type DraftItem = RecipeOcrItem & {
  origQuantity: number;
  origUnit: string;
  needsPrice?: boolean;
};

function normalizeName(name: string): string {
  return name.normalize("NFKC").replace(/\s/g, "").toLowerCase();
}

// レシピ写真から読み取った食材を、単価表に新規登録する。
// 単価は写真に書かれた値（無ければ0円）で、レシピの単位をそのまま単価表の単位にする。
async function createIngredientFromItem(item: DraftItem): Promise<Ingredient> {
  const unit = item.origUnit.trim() || "個";
  const res = await fetch("/api/ingredients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: item.rawName.trim(),
      category: "その他",
      unitPrice: item.unitPrice ?? 0,
      unitQuantity: 1,
      unitLabel: unit,
      supplier: "",
      currentStock: 0,
      parLevel: 0,
      stockUnit: unit,
    }),
  });
  if (!res.ok) throw new Error("failed");
  return res.json();
}

// 食材を割り当てて、使用量を単価表の単位（例: kg→g）に換算した行を返す。
function assignIngredient(
  item: DraftItem,
  ingredient: Ingredient | undefined
): DraftItem {
  if (!ingredient) {
    return {
      ...item,
      matchedIngredientId: null,
      quantity: item.origQuantity,
      unitLabel: item.origUnit,
    };
  }
  const converted = convertQuantity(
    item.origQuantity,
    item.origUnit,
    ingredient.unitLabel
  );
  return {
    ...item,
    matchedIngredientId: ingredient.id,
    quantity: converted ?? item.origQuantity,
    unitLabel: ingredient.unitLabel,
  };
}

export default function OcrRecipeFlow({
  allIngredients: initialIngredients,
}: {
  allIngredients: Ingredient[];
}) {
  const router = useRouter();
  // 画面上で新規登録した食材もすぐ選べるよう、単価表のコピーを手元で持つ。
  const [allIngredients, setAllIngredients] = useState(initialIngredients);
  const [registering, setRegistering] = useState(false);
  const [droppedCount, setDroppedCount] = useState(0);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("choose");
  const [menuName, setMenuName] = useState("");
  const [sellPrice, setSellPrice] = useState(0);
  const [items, setItems] = useState<DraftItem[]>([]);
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
      // 分量が空欄の行は「そのメニューでは使わない食材」として除く（元の表の空欄行に相当）。
      const all: RecipeOcrItem[] = data.items ?? [];
      const loaded = all.filter((item) => item.quantity > 0);
      setDroppedCount(all.length - loaded.length);
      setItems(
        loaded.map((item) =>
          assignIngredient(
            { ...item, origQuantity: item.quantity, origUnit: item.unitLabel },
            allIngredients.find((i) => i.id === item.matchedIngredientId)
          )
        )
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

  function selectIngredient(index: number, ingredientId: string | null) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? assignIngredient(
              item,
              allIngredients.find((ing) => ing.id === ingredientId)
            )
          : item
      )
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
        unitPrice: null,
        confidence: "high",
        origQuantity: 0,
        origUnit: allIngredients[0].unitLabel,
      },
    ]);
  }

  async function registerOne(index: number) {
    const item = items[index];
    if (!item.rawName.trim()) return;
    setRegistering(true);
    setError(null);
    try {
      const created = await createIngredientFromItem(item);
      setAllIngredients((prev) => [...prev, created]);
      setItems((prev) =>
        prev.map((it, i) =>
          i === index
            ? {
                ...assignIngredient(it, created),
                needsPrice: !(it.unitPrice && it.unitPrice > 0),
              }
            : it
        )
      );
    } catch {
      setError("食材の登録に失敗しました。もう一度お試しください。");
    } finally {
      setRegistering(false);
    }
  }

  // 紐付いていない食材をまとめて新規登録する。同じ名前の食材は1つにまとめ、
  // 単価表にすでに同名の食材があればそれを使う（重複登録しない）。
  async function registerAll() {
    setRegistering(true);
    setError(null);
    const known = new Map(allIngredients.map((i) => [normalizeName(i.name), i]));
    const newlyCreated: Ingredient[] = [];
    const nextItems = [...items];
    try {
      for (let i = 0; i < nextItems.length; i++) {
        const item = nextItems[i];
        if (item.matchedIngredientId || !item.rawName.trim()) continue;
        const key = normalizeName(item.rawName);
        let ingredient = known.get(key);
        let isNew = false;
        if (!ingredient) {
          ingredient = await createIngredientFromItem(item);
          known.set(key, ingredient);
          newlyCreated.push(ingredient);
          isNew = true;
        }
        nextItems[i] = {
          ...assignIngredient(item, ingredient),
          needsPrice: isNew && !(item.unitPrice && item.unitPrice > 0),
        };
      }
    } catch {
      setError(
        "一部の食材の登録に失敗しました。登録できたものは反映済みです。もう一度お試しください。"
      );
    } finally {
      if (newlyCreated.length > 0) {
        setAllIngredients((prev) => [...prev, ...newlyCreated]);
      }
      setItems(nextItems);
      setRegistering(false);
    }
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
            単価表に食材が登録されていないため、自動の紐付けはできません。下の「単価表に新規登録」で、このレシピの食材をまとめて登録できます。
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
            `　うち${unresolvedCount}件は単価表と自動で紐付けできませんでした。`}
          {droppedCount > 0 &&
            `　分量が空欄の${droppedCount}行は、使わない食材として除きました。`}
        </p>

        {error && <p className="text-[13px] text-[var(--danger)]">{error}</p>}

        {unresolvedCount > 0 && (
          <div className="p-3 rounded-[8px] bg-[var(--surface-1)] flex flex-col gap-2">
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
              単価表にない食材は、各行の食材名・単位・写真に書かれた単価で新規登録できます。
              登録する単価は仮の値です。納品書を読み込むと、正しい単価に更新されます。
              すでに単価表にある食材の単価は、レシピ写真では書き換わりません。
            </p>
            <SecondaryButton onClick={registerAll} disabled={registering}>
              {registering
                ? "登録中…"
                : `未登録の食材をまとめて単価表に登録（${unresolvedCount}件）`}
            </SecondaryButton>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {items.map((item, index) => {
            const unresolved = !item.matchedIngredientId;
            const ingredient = allIngredients.find(
              (i) => i.id === item.matchedIngredientId
            );
            const lineCost = ingredient
              ? ingredientCostForUsage(ingredient, item.quantity)
              : 0;
            // 単位が換算できず、分量も手直しされていない行は、原価が不正確になるため警告する。
            const unitMismatch =
              ingredient !== undefined &&
              item.origQuantity > 0 &&
              item.quantity === item.origQuantity &&
              convertQuantity(
                item.origQuantity,
                item.origUnit,
                ingredient.unitLabel
              ) === null;
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
                      selectIngredient(index, e.target.value || null)
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
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      // 未紐付けの行は、登録時にこの分量を使うので元の分量も揃えておく。
                      updateItem(
                        index,
                        unresolved
                          ? { quantity: value, origQuantity: value }
                          : { quantity: value }
                      );
                    }}
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
                    {item.origQuantity > 0 &&
                      `（レシピの分量: ${item.origQuantity}${item.origUnit}）`}
                  </p>
                )}
                {unresolved && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      className={`${inputClass} w-24`}
                      placeholder="単価"
                      value={item.unitPrice ?? ""}
                      onChange={(e) =>
                        updateItem(index, {
                          unitPrice:
                            e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                    <span className="text-[11px] text-[var(--text-muted)] shrink-0">
                      円/{item.origUnit || "個"}
                    </span>
                    <button
                      onClick={() => registerOne(index)}
                      disabled={registering || !item.rawName.trim()}
                      className="ml-auto h-9 px-3 rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface-2)] text-[12px] text-[var(--text-primary)] disabled:opacity-50"
                    >
                      単価表に新規登録して使う
                    </button>
                  </div>
                )}
                {item.needsPrice && (
                  <p className="text-[11px] text-[var(--warning)] mt-1.5 flex items-center gap-1">
                    <IconAlertTriangle size={13} aria-hidden />
                    単価が読み取れなかったため0円で登録しました。単価表で入力するか、納品書を読み込んでください。
                  </p>
                )}
                {unitMismatch && (
                  <p className="text-[11px] text-[var(--warning)] mt-1.5 flex items-center gap-1">
                    <IconAlertTriangle size={13} aria-hidden />
                    レシピの単位（{item.origUnit}）を単価表の単位（
                    {ingredient?.unitLabel}）に換算できません。分量を確認してください。
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
