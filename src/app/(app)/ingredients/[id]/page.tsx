import { notFound } from "next/navigation";
import { getIngredient } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import IngredientEditForm from "@/components/IngredientEditForm";
import BackLink from "@/components/BackLink";
import { requireTenant } from "@/lib/tenant";

export default async function IngredientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await requireTenant();
  const { id } = await params;
  const ingredient = await getIngredient(tenant.restaurantId, id);
  if (!ingredient) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 md:px-8 pt-6 pb-1">
        <BackLink href="/ingredients" />
      </div>
      <PageHeader title={ingredient.name} />
      <div className="px-4 md:px-8">
        <IngredientEditForm ingredient={ingredient} />
      </div>
    </div>
  );
}
