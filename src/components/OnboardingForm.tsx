"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui";

const inputClass =
  "h-11 px-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)] w-full";
const labelClass = "text-[12px] text-[var(--text-secondary)] mb-1 block";

export default function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "店舗の作成に失敗しました");
      }
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
        <label className={labelClass}>店舗名</label>
        <input
          required
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="やまだ食堂"
        />
      </div>
      <PrimaryButton type="submit" disabled={loading}>
        {loading ? "作成中…" : "店舗を作成してはじめる"}
      </PrimaryButton>
    </form>
  );
}
