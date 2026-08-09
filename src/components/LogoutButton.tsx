"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLogout } from "@tabler/icons-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      aria-label="ログアウト"
      className={`flex items-center gap-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] ${className}`}
    >
      <IconLogout size={16} stroke={1.75} aria-hidden />
      ログアウト
    </button>
  );
}
