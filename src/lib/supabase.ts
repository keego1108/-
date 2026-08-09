import { createClient } from "@supabase/supabase-js";

// NEXT_PUBLIC_SUPABASE_URL が未設定の間は null（モックデータで動作する）。
//
// このクライアントはサーバー側（Server Components / API Routes）からのみ呼ばれる
// 前提のため、SUPABASE_SECRET_KEY（RLSを迂回する特権キー・NEXT_PUBLIC_なし＝ブラウザに
// 送られない）を優先して使う。まだログイン機能がなく、authenticated ロールでの
// RLSを満たせないため、現状はこの構成にしている。
// 将来ログインを追加したら、ユーザーのセッションに紐づくクライアントに差し替える。
export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = secretKey ?? anonKey;
  if (!url || !key) return null;
  return createClient(url, key);
}
