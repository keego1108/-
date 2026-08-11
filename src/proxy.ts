import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ログインなしでアクセスできるページ。
const PUBLIC_PATHS = ["/login", "/signup", "/auth/callback", "/legal"];
// ログイン済みの場合に "/" へ追い返すページ（PUBLIC_PATHSのうち、招待リンクなどセッション確立の
// 途中経過であるものは除く）。
const REDIRECT_IF_LOGGED_IN_PATHS = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // APIルートはそれぞれの中で認証チェックをしている（未ログイン時はJSONで401/403を返す）。
  // ここでリダイレクトすると、Stripeのwebhookのようにセッションを持たない
  // 外部からのPOSTまで/loginへ転送されてしまうため、/api配下は素通りさせる。
  if (request.nextUrl.pathname.startsWith("/api/")) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase未設定（デモモード）の間は認証チェックをスキップする。
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isRedirectIfLoggedInPath = REDIRECT_IF_LOGGED_IN_PATHS.some((p) =>
    pathname.startsWith(p)
  );

  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && isRedirectIfLoggedInPath) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
