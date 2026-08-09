import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseClient } from "@/lib/supabase";

// Stripeダッシュボード（またはStripe CLI）から呼ばれる。ログイン不要（署名で検証する）。
export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripeが未設定です" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "signature missing" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const admin = getSupabaseClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabaseが未設定です" }, { status: 500 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const restaurantId = session.client_reference_id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;

      if (restaurantId) {
        const { error } = await admin
          .from("restaurants")
          .update({
            subscription_status: "active",
            stripe_subscription_id: subscriptionId ?? null,
            stripe_customer_id: customerId ?? null,
          })
          .eq("id", restaurantId);
        if (error) throw error;
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const restaurantId = subscription.metadata?.restaurant_id;
      const status = mapStripeStatus(subscription.status, event.type);
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const query = admin.from("restaurants").update({ subscription_status: status });
      const { error } = restaurantId
        ? await query.eq("id", restaurantId)
        : await query.eq("stripe_customer_id", customerId);
      if (error) throw error;
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status,
  eventType: string
): "active" | "past_due" | "canceled" {
  if (eventType === "customer.subscription.deleted") return "canceled";
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "active";
  }
}
