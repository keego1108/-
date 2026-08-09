import Stripe from "stripe";

// STRIPE_SECRET_KEY が未設定の間は null（決済機能は使えないが、他の画面は動く）。
let cached: Stripe | null | undefined;

export function getStripeClient(): Stripe | null {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  cached = key ? new Stripe(key) : null;
  return cached;
}

export const MONTHLY_PRICE_JPY = 2980;
export const TRIAL_DAYS = 14;
