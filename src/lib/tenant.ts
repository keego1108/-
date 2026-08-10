import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseClient } from "@/lib/supabase";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export interface TenantContext {
  userId: string;
  email: string | null;
  restaurantId: string;
  restaurantName: string;
  role: string;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string;
  stripeCustomerId: string | null;
  isEntitled: boolean;
  // トライアル中の残り日数（0以上）。トライアル対象外(active/canceledなど)ならnull。
  // ここでDate.now()を評価し、コンポーネント側では再計算しない
  // （Reactのpurityルール上、レンダー中にDate.now()を呼びたくないため）。
  trialDaysLeft: number | null;
}

function computeIsEntitled(status: string, trialEndsAt: string): boolean {
  if (status === "active") return true;
  if (status === "trialing") return new Date(trialEndsAt).getTime() > Date.now();
  return false;
}

function computeTrialDaysLeft(status: string, trialEndsAt: string): number | null {
  if (status !== "trialing") return null;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

type TenantResolution =
  | { status: "unauthenticated" }
  | { status: "no-restaurant"; userId: string; email: string | null }
  | { status: "ok"; ctx: TenantContext };

// ログイン中のユーザーと、そのユーザーが所属する店舗を解決する。
// 実際のDB操作は（RLSを迂回する）管理者クライアントで行うが、
// 「どのユーザーか」はCookieのセッションから安全に取得する。
// React cache() で同一リクエスト内（layout + page など）の呼び出しを1回にまとめる。
export const resolveTenant = cache(async function resolveTenant(): Promise<TenantResolution> {
  // Supabase未設定（環境変数なし）の間は、認証クライアントを作ろうとせずに
  // 「未ログイン」として扱う（デモモード）。createSupabaseServerClient()は
  // 環境変数の存在を前提にしているため、先にここでガードする。
  const admin = getSupabaseClient();
  if (!admin) return { status: "unauthenticated" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "unauthenticated" };

  const { data: memberships, error: memberError } = await admin
    .from("restaurant_members")
    .select("restaurant_id, role")
    .eq("user_id", user.id)
    .limit(1);
  if (memberError) throw memberError;

  const membership = memberships?.[0];
  if (!membership) {
    return { status: "no-restaurant", userId: user.id, email: user.email ?? null };
  }

  const { data: restaurant, error: restaurantError } = await admin
    .from("restaurants")
    .select("id, name, subscription_status, trial_ends_at, stripe_customer_id")
    .eq("id", membership.restaurant_id)
    .maybeSingle();
  if (restaurantError) throw restaurantError;
  if (!restaurant) {
    return { status: "no-restaurant", userId: user.id, email: user.email ?? null };
  }

  return {
    status: "ok",
    ctx: {
      userId: user.id,
      email: user.email ?? null,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      role: membership.role,
      subscriptionStatus: restaurant.subscription_status,
      trialEndsAt: restaurant.trial_ends_at,
      stripeCustomerId: restaurant.stripe_customer_id,
      isEntitled: computeIsEntitled(restaurant.subscription_status, restaurant.trial_ends_at),
      trialDaysLeft: computeTrialDaysLeft(restaurant.subscription_status, restaurant.trial_ends_at),
    },
  };
});

// Server Component（ページ）用: 未ログインなら/loginへ、店舗未作成なら/onboardingへリダイレクトする。
export async function requireTenant(): Promise<TenantContext> {
  const result = await resolveTenant();
  if (result.status === "unauthenticated") redirect("/login");
  if (result.status === "no-restaurant") redirect("/onboarding");
  return result.ctx;
}

// メイン機能（(app)配下）用: 上記に加えて、トライアル終了かつ未契約なら/billingへリダイレクトする。
export async function requireEntitledTenant(): Promise<TenantContext> {
  const ctx = await requireTenant();
  if (!ctx.isEntitled) redirect("/billing");
  return ctx;
}

// Route Handler（API）用: リダイレクトの代わりにJSONエラーを返す。
export async function requireTenantForApi(): Promise<
  { ok: true; ctx: TenantContext } | { ok: false; response: NextResponse }
> {
  const result = await resolveTenant();
  if (result.status === "unauthenticated") {
    return {
      ok: false,
      response: NextResponse.json({ error: "ログインが必要です" }, { status: 401 }),
    };
  }
  if (result.status === "no-restaurant") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "店舗情報が見つかりません。先に店舗を作成してください。" },
        { status: 403 }
      ),
    };
  }
  return { ok: true, ctx: result.ctx };
}

// データを書き換えるAPIルート用: 認証・店舗チェックに加えて利用資格（トライアル中 or 契約中）も確認する。
export async function requireEntitledTenantForApi(): Promise<
  { ok: true; ctx: TenantContext } | { ok: false; response: NextResponse }
> {
  const result = await requireTenantForApi();
  if (!result.ok) return result;
  if (!result.ctx.isEntitled) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "無料トライアルが終了しています。ご契約をお願いします。" },
        { status: 402 }
      ),
    };
  }
  return result;
}

// オンボーディング画面から呼ばれる。店舗を作成し、作成者をownerとして登録する。
export async function createRestaurantForUser(
  userId: string,
  name: string
): Promise<{ id: string; name: string }> {
  const admin = getSupabaseClient();
  if (!admin) throw new Error("Supabaseが未設定です");

  const { data: restaurant, error: restaurantError } = await admin
    .from("restaurants")
    .insert({ name })
    .select("id, name")
    .single();
  if (restaurantError) throw restaurantError;

  const { error: memberError } = await admin.from("restaurant_members").insert({
    restaurant_id: restaurant.id,
    user_id: userId,
    role: "owner",
  });
  if (memberError) throw memberError;

  return restaurant;
}
