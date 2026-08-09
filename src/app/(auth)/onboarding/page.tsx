import { redirect } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const result = await resolveTenant();
  if (result.status === "unauthenticated") redirect("/login");
  if (result.status === "ok") redirect("/");

  return (
    <div>
      <h1 className="text-[18px] font-medium text-[var(--text-primary)] mb-2 text-center">
        店舗を登録しましょう
      </h1>
      <p className="text-[13px] text-[var(--text-secondary)] mb-6 text-center">
        あとから名前は変更できます。
      </p>
      <OnboardingForm />
    </div>
  );
}
