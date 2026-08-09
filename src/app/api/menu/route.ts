import { NextRequest, NextResponse } from "next/server";
import { createMenuItem, getMenuItems } from "@/lib/data";
import { requireEntitledTenantForApi } from "@/lib/tenant";

export async function GET() {
  const tenant = await requireEntitledTenantForApi();
  if (!tenant.ok) return tenant.response;

  const menus = await getMenuItems(tenant.ctx.restaurantId);
  return NextResponse.json(menus);
}

export async function POST(request: NextRequest) {
  const tenant = await requireEntitledTenantForApi();
  if (!tenant.ok) return tenant.response;

  const body = await request.json();
  const created = await createMenuItem(tenant.ctx.restaurantId, body);
  return NextResponse.json(created, { status: 201 });
}
