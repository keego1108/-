import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";
import { calcCostRatio, calcMenuCost, getIngredients, getMenuItems } from "@/lib/data";
import { formatPercent, formatYen } from "@/lib/format";
import { Badge, PageHeader } from "@/components/ui";
import { requireTenant } from "@/lib/tenant";

function ratioTone(ratio: number): "success" | "warning" | "danger" {
  if (ratio <= 30) return "success";
  if (ratio <= 40) return "warning";
  return "danger";
}

export default async function MenuPage() {
  const tenant = await requireTenant();
  const [menus, ingredients] = await Promise.all([
    getMenuItems(tenant.restaurantId),
    getIngredients(tenant.restaurantId),
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="メニュー"
        action={
          <Link
            href="/menu/new"
            aria-label="メニューを追加"
            className="w-9 h-9 rounded-full bg-[var(--accent-bg)] text-[var(--accent)] flex items-center justify-center"
          >
            <IconPlus size={18} stroke={1.75} aria-hidden />
          </Link>
        }
      />

      <div className="px-4 md:px-8 flex flex-col gap-2">
        {menus.length === 0 ? (
          <p className="text-[13px] text-[var(--text-muted)] py-6 text-center">
            メニューがまだ登録されていません。
          </p>
        ) : (
          menus.map((menu) => {
            const cost = calcMenuCost(menu, ingredients);
            const ratio = calcCostRatio(menu, ingredients);
            return (
              <Link
                key={menu.id}
                href={`/menu/${menu.id}`}
                className="p-3 border border-[var(--border)] rounded-[8px] hover:bg-[var(--surface-1)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[15px] text-[var(--text-primary)]">
                    {menu.name}
                  </p>
                  <Badge tone={ratioTone(ratio)}>
                    原価率 {formatPercent(ratio, 0)}
                  </Badge>
                </div>
                <p className="text-[12px] text-[var(--text-muted)] mt-1.5">
                  売価 {formatYen(menu.sellPrice)} ／ 原価 {formatYen(cost)}
                </p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
