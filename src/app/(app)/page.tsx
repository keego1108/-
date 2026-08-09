import Link from "next/link";
import { IconCamera, IconChevronRight } from "@tabler/icons-react";
import {
  calcAverageCostRatio,
  getIngredients,
  stockStatus,
} from "@/lib/data";
import { formatPercent } from "@/lib/format";
import { Badge, Card, PrimaryButton, StatTile } from "@/components/ui";
import { requireTenant } from "@/lib/tenant";

export default async function HomePage() {
  const tenant = await requireTenant();
  const [ingredients, avgCostRatio] = await Promise.all([
    getIngredients(tenant.restaurantId),
    calcAverageCostRatio(tenant.restaurantId),
  ]);

  const lowStock = ingredients
    .map((ingredient) => ({ ingredient, status: stockStatus(ingredient) }))
    .filter((entry) => entry.status !== "ok")
    .sort(
      (a, b) =>
        a.ingredient.currentStock / a.ingredient.parLevel -
        b.ingredient.currentStock / b.ingredient.parLevel
    );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 md:px-8 pt-6 pb-3">
        <p className="text-[13px] text-[var(--text-muted)]">おはようございます</p>
        <h1 className="text-[20px] font-medium text-[var(--text-primary)] mt-0.5">
          食材・原価管理
        </h1>
      </div>

      <div className="px-4 md:px-8 grid grid-cols-2 gap-3 mb-4">
        <StatTile label="平均原価率" value={formatPercent(avgCostRatio)} />
        <StatTile
          label="在庫少アラート"
          value={`${lowStock.length}件`}
          tone={lowStock.length > 0 ? "warning" : "neutral"}
        />
      </div>

      <div className="px-4 md:px-8 mb-6">
        <Link href="/ingredients/new">
          <PrimaryButton className="w-full">
            <IconCamera size={20} stroke={1.75} aria-hidden />
            納品書を撮って読み込む
          </PrimaryButton>
        </Link>
      </div>

      <div className="px-4 md:px-8">
        <p className="text-[13px] text-[var(--text-secondary)] mb-2">
          在庫が少ない食材
        </p>
        {lowStock.length === 0 ? (
          <Card>
            <p className="text-[14px] text-[var(--text-secondary)]">
              基準在庫を下回っている食材はありません。
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {lowStock.map(({ ingredient, status }) => (
              <Link
                key={ingredient.id}
                href="/ingredients"
                className="flex items-center justify-between px-3 py-2.5 border border-[var(--border)] rounded-[8px] hover:bg-[var(--surface-1)]"
              >
                <div>
                  <p className="text-[14px] text-[var(--text-primary)]">
                    {ingredient.name}
                  </p>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                    基準 {ingredient.parLevel}
                    {ingredient.stockUnit} / 現在 {ingredient.currentStock}
                    {ingredient.stockUnit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={status === "critical" ? "danger" : "warning"}>
                    {status === "critical" ? "在庫切れ間近" : "残りわずか"}
                  </Badge>
                  <IconChevronRight
                    size={16}
                    className="text-[var(--text-muted)]"
                    aria-hidden
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
