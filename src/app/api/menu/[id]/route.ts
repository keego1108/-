import { NextRequest, NextResponse } from "next/server";
import { deleteMenuItem, getMenuItem, updateMenuItem } from "@/lib/data";
import { requireEntitledTenantForApi } from "@/lib/tenant";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenant = await requireEntitledTenantForApi();
  if (!tenant.ok) return tenant.response;

  const { id } = await params;
  const menu = await getMenuItem(tenant.ctx.restaurantId, id);
  if (!menu) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(menu);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenant = await requireEntitledTenantForApi();
  if (!tenant.ok) return tenant.response;

  const { id } = await params;
  const body = await request.json();
  const updated = await updateMenuItem(tenant.ctx.restaurantId, id, body);
  if (!updated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenant = await requireEntitledTenantForApi();
  if (!tenant.ok) return tenant.response;

  const { id } = await params;
  await deleteMenuItem(tenant.ctx.restaurantId, id);
  return NextResponse.json({ ok: true });
}
