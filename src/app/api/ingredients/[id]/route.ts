import { NextRequest, NextResponse } from "next/server";
import { deleteIngredient, getIngredient, updateIngredient } from "@/lib/data";
import { requireEntitledTenantForApi } from "@/lib/tenant";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenant = await requireEntitledTenantForApi();
  if (!tenant.ok) return tenant.response;

  const { id } = await params;
  const ingredient = await getIngredient(tenant.ctx.restaurantId, id);
  if (!ingredient) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(ingredient);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenant = await requireEntitledTenantForApi();
  if (!tenant.ok) return tenant.response;

  const { id } = await params;
  const body = await request.json();
  const updated = await updateIngredient(tenant.ctx.restaurantId, id, body);
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
  await deleteIngredient(tenant.ctx.restaurantId, id);
  return NextResponse.json({ ok: true });
}
