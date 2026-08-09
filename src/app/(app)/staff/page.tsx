import { requireEntitledTenant } from "@/lib/tenant";
import { listStaffMembers } from "@/lib/staff";
import { PageHeader } from "@/components/ui";
import StaffList from "@/components/StaffList";

export default async function StaffPage() {
  const tenant = await requireEntitledTenant();
  const members = await listStaffMembers(tenant.restaurantId);

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="スタッフ管理" />
      <div className="px-4 md:px-8">
        <StaffList initialMembers={members} canManage={tenant.role === "owner"} />
      </div>
    </div>
  );
}
