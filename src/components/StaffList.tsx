"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconTrash } from "@tabler/icons-react";
import type { StaffMember } from "@/lib/staff";
import { Badge, PrimaryButton } from "@/components/ui";

const inputClass =
  "h-11 px-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)] w-full";

export default function StaffList({
  initialMembers,
  canManage,
}: {
  initialMembers: StaffMember[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setInviting(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "招待に失敗しました");
      setMessage(
        data.status === "added_existing"
          ? "既存アカウントをスタッフとして追加しました。"
          : "招待メールを送信しました。"
      );
      setEmail("");
      router.refresh();
      const list = await (await fetch("/api/staff")).json();
      setMembers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(membershipId: string) {
    setError(null);
    try {
      const res = await fetch(`/api/staff/${membershipId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "削除に失敗しました");
      setMembers((prev) => prev.filter((m) => m.membershipId !== membershipId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <form onSubmit={handleInvite} className="flex flex-col gap-2">
          {error && (
            <p className="text-[13px] text-[var(--danger)] bg-[var(--danger-bg)] rounded-[8px] px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="text-[13px] text-[var(--success)] bg-[var(--success-bg)] rounded-[8px] px-3 py-2">
              {message}
            </p>
          )}
          <label className="text-[12px] text-[var(--text-secondary)]">
            スタッフのメールアドレス
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@example.com"
            />
            <PrimaryButton type="submit" disabled={inviting} className="shrink-0 px-4">
              {inviting ? "送信中…" : "招待"}
            </PrimaryButton>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <div
            key={m.membershipId}
            className="flex items-center justify-between p-3 border border-[var(--border)] rounded-[8px]"
          >
            <div>
              <p className="text-[14px] text-[var(--text-primary)]">{m.email ?? "(不明)"}</p>
              <Badge tone={m.role === "owner" ? "accent" : "neutral"}>
                {m.role === "owner" ? "オーナー" : "スタッフ"}
              </Badge>
            </div>
            {canManage && m.role !== "owner" && (
              <button
                onClick={() => handleRemove(m.membershipId)}
                aria-label="このスタッフを削除"
                className="w-9 h-9 flex items-center justify-center rounded-[8px] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--danger)]"
              >
                <IconTrash size={16} aria-hidden />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
