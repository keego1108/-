import { NextRequest, NextResponse } from "next/server";
import { removeStaffMember } from "@/lib/staff";
import { requireTenantForApi } from "@/lib/tenant";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const tenant = await requireTenantForApi();
  if (!tenant.ok) return tenant.response;

  if (tenant.ctx.role !== "owner") {
    return NextResponse.json(
      { error: "スタッフの削除はオーナーのみ行えます" },
      { status: 403 }
    );
  }

  const { memberId } = await params;
  try {
    await removeStaffMember(tenant.ctx.restaurantId, memberId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "削除に失敗しました" },
      { status: 400 }
    );
  }
}
