import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";
import { getIngredients } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import IngredientList from "@/components/IngredientList";
import { requireTenant } from "@/lib/tenant";

export default async function IngredientsPage() {
  const tenant = await requireTenant();
  const ingredients = await getIngredients(tenant.restaurantId);

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="単価表"
        action={
          <Link
            href="/ingredients/new"
            aria-label="食材を追加"
            className="w-9 h-9 rounded-full bg-[var(--accent-bg)] text-[var(--accent)] flex items-center justify-center"
          >
            <IconPlus size={18} stroke={1.75} aria-hidden />
          </Link>
        }
      />
      <IngredientList ingredients={ingredients} />
    </div>
  );
}
