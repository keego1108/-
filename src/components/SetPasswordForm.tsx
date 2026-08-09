"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { PrimaryButton } from "@/components/ui";

const inputClass =
  "h-11 px-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)] w-full";
const labelClass = "text-[12px] text-[var(--text-secondary)] mb-1 block";

export default function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="text-[13px] text-[var(--danger)] bg-[var(--danger-bg)] rounded-[8px] px-3 py-2">
          {error}
        </p>
      )}
      <div>
        <label className={labelClass}>新しいパスワード</label>
        <input
          type="password"
          required
          minLength={6}
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6文字以上"
          autoComplete="new-password"
        />
      </div>
      <PrimaryButton type="submit" disabled={loading}>
        {loading ? "設定中…" : "パスワードを設定してはじめる"}
      </PrimaryButton>
    </form>
  );
}
