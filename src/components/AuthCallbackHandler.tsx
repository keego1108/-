"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

// 招待・パスワードリセットのメールリンクは、トークンをURLの#以降（フラグメント）に載せて
// このページへ遷移してくる。フラグメントはサーバーに送られないため、
// ここ（クライアント側）で読み取ってセッションを確立する必要がある。
export default function AuthCallbackHandler() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const hashError = params.get("error_description");

      if (hashError) {
        setError(decodeURIComponent(hashError.replace(/\+/g, " ")));
        return;
      }

      if (!accessToken || !refreshToken) {
        setError("リンクが無効か、有効期限が切れています。");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (setSessionError) {
        setError(setSessionError.message);
        return;
      }

      router.push("/set-password");
      router.refresh();
    }
    run();
  }, [router]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[14px] text-[var(--danger)] mb-4">{error}</p>
        <a href="/login" className="text-[13px] text-[var(--brand)] underline underline-offset-2">
          ログイン画面へ
        </a>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <p className="text-[13px] text-[var(--text-secondary)]">確認しています…</p>
    </div>
  );
}
