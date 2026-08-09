import AppShell from "@/components/AppShell";
import { requireEntitledTenant } from "@/lib/tenant";

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
