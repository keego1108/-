import AppShell from "@/components/AppShell";
import { requireEntitledTenant } from "@/lib/tenant";

// ログイン状態・店舗ごとに内容が変わる画面なので、ビルド時に静的生成しようとしない。
export const dynamic = "force-dynamic";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await requireEntitledTenant();

  return (
    <AppShell
      restaurantName={tenant.restaurantName}
      trialDaysLeft={tenant.trialDaysLeft}
      isOwner={tenant.role === "owner"}
    >
      {children}
    </AppShell>
  );
}
