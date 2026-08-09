import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";
import {
  ANALYSIS_MONTHS,
  calcMonthlyCostRatioTrend,
  getIngredients,
  getMenuItems,
  priceChangePercent,
} from "@/lib/data";
import { formatSignedPercent } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";
import { requireTenant } from "@/lib/tenant";

export default async function AnalysisPage() {
  const tenant = await requireTenant();
  const [ingredients, menus] = await Promise.all([
    getIngredients(tenant.restaurantId),
    getMenuItems(tenant.restaurantId),
  ]);

  const trend = calcMonthlyCostRatioTrend(menus, ingredients, ANALYSIS_MONTHS);
  const maxRatio = Math.max(...trend.map((t) => t.avgCostRatio), 1);

  const priceMovers = ingredients
    .map((ingredient) => ({
      ingredient,
      change: priceChangePercent(ingredient),
    }))
    .filter(
      (entry): entry is { ingredient: typeof entry.ingredient; change: number } =>
        entry.change !== null && Math.round(entry.change) !== 0
    )
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 6);

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="分析" />

      <div className="px-4 md:px-8 mb-6">
        <p className="text-[13px] text-[var(--text-secondary)] mb-2">
          原価率の推移（直近{trend.length}か月）
        </p>
        <Card>
          <div className="flex items-end gap-2 h-24">
            {trend.map((t, i) => (
              <div
                key={t.date}
                className="flex-1 rounded-t-[4px] bg-[var(--surface-1)] relative"
                style={{
                  height: `${Math.max((t.avgCostRatio / maxRatio) * 100, 4)}%`,
                  background:
                    i === trend.length - 1 ? "var(--brand)" : undefined,
                }}
                title={`${t.label}: ${t.avgCostRatio.toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="flex gap-2 mt-1.5">
            {trend.map((t) => (
              <span
                key={t.date}
                className="flex-1 text-center text-[11px] text-[var(--text-muted)]"
              >
                {t.label}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="px-4 md:px-8">
        <p className="text-[13px] text-[var(--text-secondary)] mb-2">
          価格が変動している食材
        </p>
        {priceMovers.length === 0 ? (
          <Card>
            <p className="text-[14px] text-[var(--text-secondary)]">
              直近で大きな価格変動はありません。
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {priceMovers.map(({ ingredient, change }) => (
              <div
                key={ingredient.id}
                className="flex items-center justify-between px-3 py-2.5 border border-[var(--border)] rounded-[8px]"
              >
                <p className="text-[14px] text-[var(--text-primary)]">
                  {ingredient.name}
                </p>
                <span
                  className={`text-[13px] flex items-center gap-1 ${
                    change > 0
                      ? "text-[var(--danger)]"
                      : "text-[var(--success)]"
                  }`}
                >
                  {change > 0 ? (
                    <IconArrowUp size={14} aria-hidden />
                  ) : (
                    <IconArrowDown size={14} aria-hidden />
                  )}
                  {formatSignedPercent(change)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
