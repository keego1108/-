import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Components / Route Handler から、今ログインしているユーザーの
// セッション（Cookie）を読むための専用クライアント。
// データの読み書きには使わない（それは lib/supabase.ts の管理者クライアントが担当）。
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Componentからの呼び出しでは書き込めないため無視する。
            // セッションのリフレッシュは proxy.ts 側が担当する。
          }
        },
      },
    }
  );
}
