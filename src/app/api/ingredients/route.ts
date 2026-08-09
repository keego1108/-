import { NextRequest, NextResponse } from "next/server";
import { createIngredient, getIngredients } from "@/lib/data";
import { requireEntitledTenantForApi } from "@/lib/tenant";

export async function GET() {
  const tenant = await requireEntitledTenantForApi();
  if (!tenant.ok) return tenant.response;

  const ingredients = await getIngredients(tenant.ctx.restaurantId);
  return NextResponse.json(ingredients);
}

export async function POST(request: NextRequest) {
  const tenant = await requireEntitledTenantForApi();
  if (!tenant.ok) return tenant.response;

  const body = await request.json();
  const created = await createIngredient(tenant.ctx.restaurantId, body);
  return NextResponse.json(created, { status: 201 });
}
