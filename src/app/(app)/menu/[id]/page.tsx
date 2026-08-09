import { notFound } from "next/navigation";
import { getIngredients, getMenuItem } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import MenuEditForm from "@/components/MenuEditForm";
import BackLink from "@/components/BackLink";
import { requireTenant } from "@/lib/tenant";

export default async function MenuDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await requireTenant();
  const { id } = await params;
  const [menu, ingredients] = await Promise.all([
    getMenuItem(tenant.restaurantId, id),
    getIngredients(tenant.restaurantId),
  ]);
  if (!menu) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 md:px-8 pt-6 pb-1">
        <BackLink href="/menu" />
      </div>
      <PageHeader title={menu.name} />
      <div className="px-4 md:px-8">
        <MenuEditForm menu={menu} allIngredients={ingredients} />
      </div>
    </div>
  );
}
