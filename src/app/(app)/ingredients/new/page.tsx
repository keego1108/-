import { PageHeader } from "@/components/ui";
import BackLink from "@/components/BackLink";
import OcrIngredientFlow from "@/components/OcrIngredientFlow";

export default function NewIngredientPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 md:px-8 pt-6 pb-1">
        <BackLink href="/ingredients" />
      </div>
      <PageHeader title="食材を追加" />
      <div className="px-4 md:px-8">
        <OcrIngredientFlow />
      </div>
    </div>
  );
}
