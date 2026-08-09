import { getIngredients } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import MenuEditForm from "@/components/MenuEditForm";
import BackLink from "@/components/BackLink";
import { requireTenant } from "@/lib/tenant";

export default async function NewMenuPage() {
  const tenant = await requireTenant();
  const ingredients = await getIngredients(tenant.restaurantId);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 md:px-8 pt-6 pb-1">
        <BackLink href="/menu" />
      </div>
      <PageHeader title="メニューを追加" />
      <div className="px-4 md:px-8">
        <MenuEditForm menu={null} allIngredients={ingredients} />
      </div>
    </div>
  );
}
