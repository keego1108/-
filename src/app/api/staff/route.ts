import { NextRequest, NextResponse } from "next/server";
import { inviteStaffMember, listStaffMembers } from "@/lib/staff";
import { requireTenantForApi } from "@/lib/tenant";

export async function GET() {
  const tenant = await requireTenantForApi();
  if (!tenant.ok) return tenant.response;

  const members = await listStaffMembers(tenant.ctx.restaurantId);
  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  const tenant = await requireTenantForApi();
  if (!tenant.ok) return tenant.response;

  if (tenant.ctx.role !== "owner") {
    return NextResponse.json(
      { error: "スタッフの招待はオーナーのみ行えます" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
  }

  try {
    const result = await inviteStaffMember(tenant.ctx.restaurantId, email);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "招待に失敗しました" },
      { status: 400 }
    );
  }
}
