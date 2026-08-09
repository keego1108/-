import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseClient } from "@/lib/supabase";
import { requireTenantForApi } from "@/lib/tenant";

export async function POST() {
  const tenant = await requireTenantForApi();
  if (!tenant.ok) return tenant.response;

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "決済機能が未設定です" }, { status: 500 });
  }
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "料金プランが未設定です" }, { status: 500 });
  }

  let customerId = tenant.ctx.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: tenant.ctx.email ?? undefined,
      name: tenant.ctx.restaurantName,
      metadata: { restaurant_id: tenant.ctx.restaurantId },
    });
    customerId = customer.id;

    const admin = getSupabaseClient();
    if (admin) {
      await admin
        .from("restaurants")
        .update({ stripe_customer_id: customerId })
        .eq("id", tenant.ctx.restaurantId);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?checkout=success`,
    cancel_url: `${appUrl}/billing?checkout=cancel`,
    client_reference_id: tenant.ctx.restaurantId,
    subscription_data: {
      metadata: { restaurant_id: tenant.ctx.restaurantId },
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "決済ページの作成に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
