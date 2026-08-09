"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { PrimaryButton } from "@/components/ui";

const inputClass =
  "h-11 px-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)] w-full";
const labelClass = "text-[12px] text-[var(--text-secondary)] mb-1 block";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          // メール確認が必要な設定の場合はここに来る。
          setConfirmSent(true);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? translateAuthError(err.message) : "エラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  }

  if (confirmSent) {
    return (
      <div className="text-center py-8">
        <p className="text-[15px] text-[var(--text-primary)] mb-2">
          確認メールを送信しました
        </p>
        <p className="text-[13px] text-[var(--text-secondary)] mb-6">
          {email} 宛のメールに記載されたリンクをクリックしてから、ログインしてください。
        </p>
        <Link
          href="/login"
          className="text-[13px] text-[var(--brand)] underline underline-offset-2"
        >
          ログイン画面へ
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="text-[13px] text-[var(--danger)] bg-[var(--danger-bg)] rounded-[8px] px-3 py-2">
          {error}
        </p>
      )}

      <div>
        <label className={labelClass}>メールアドレス</label>
        <input
          type="email"
          required
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label className={labelClass}>パスワード</label>
        <input
          type="password"
          required
          minLength={6}
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6文字以上"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </div>

      <PrimaryButton type="submit" disabled={loading}>
        {loading ? "処理中…" : mode === "signup" ? "アカウントを作成" : "ログイン"}
      </PrimaryButton>

      {mode === "signup" ? (
        <p className="text-[13px] text-[var(--text-secondary)] text-center">
          すでにアカウントをお持ちですか？{" "}
          <Link href="/login" className="text-[var(--brand)] underline underline-offset-2">
            ログイン
          </Link>
        </p>
      ) : (
        <p className="text-[13px] text-[var(--text-secondary)] text-center">
          初めてご利用ですか？{" "}
          <Link href="/signup" className="text-[var(--brand)] underline underline-offset-2">
            アカウントを作成
          </Link>
        </p>
      )}
    </form>
  );
}

function translateAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }
  if (message.includes("User already registered")) {
    return "このメールアドレスはすでに登録されています。ログインしてください。";
  }
  if (message.includes("Password should be at least")) {
    return "パスワードは6文字以上で入力してください。";
  }
  return message;
}
