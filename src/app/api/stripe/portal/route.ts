import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { requireTenantForApi } from "@/lib/tenant";

export async function POST() {
  const tenant = await requireTenantForApi();
  if (!tenant.ok) return tenant.response;

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "決済機能が未設定です" }, { status: 500 });
  }
  if (!tenant.ctx.stripeCustomerId) {
    return NextResponse.json({ error: "契約情報が見つかりません" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.ctx.stripeCustomerId,
    return_url: `${appUrl}/billing`,
  });

  return NextResponse.json({ url: session.url });
}
