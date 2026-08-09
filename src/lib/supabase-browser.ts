import { createBrowserClient } from "@supabase/ssr";

// ブラウザ側（クライアントコンポーネント）でのログイン/サインアップ/ログアウト専用。
// anon keyを使う（RLSはauthenticatedロールを前提に設定してある）。
// データの読み書きはこのクライアントを使わず、必ずサーバー側API経由で行う。
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
