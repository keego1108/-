import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

// 毎日1回、Vercel Cron（vercel.json）から呼ばれる。
// Supabase無料プランは一定期間アクセスが無いとプロジェクトが自動停止するため、
// 軽いクエリを実行して「使用中」の状態を保つ。
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // CRON_SECRET を設定している場合は、Vercel Cronからの呼び出しだけを受け付ける。
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const client = getSupabaseClient();
  if (!client) {
    return NextResponse.json({ ok: false, reason: "supabase not configured" });
  }

  const { error } = await client.from("restaurants").select("id").limit(1);
  if (error) {
    console.error("keepalive query failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
