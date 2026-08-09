"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconTag,
  IconBook2,
  IconChartBar,
  IconUsers,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import LogoutButton from "@/components/LogoutButton";

const NAV_ITEMS = [
  { href: "/", label: "ホーム", icon: IconHome },
  { href: "/ingredients", label: "単価表", icon: IconTag },
  { href: "/menu", label: "メニュー", icon: IconBook2 },
  { href: "/analysis", label: "分析", icon: IconChartBar },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({
  children,
  restaurantName,
  trialDaysLeft,
  isOwner,
}: {
  children: ReactNode;
  restaurantName: string;
  trialDaysLeft: number | null;
  isOwner: boolean;
}) {
  const pathname = usePathname();

  const trialBanner =
    trialDaysLeft !== null ? (
      <Link
        href="/billing"
        className="block text-center text-[12px] py-1.5 bg-[var(--accent-bg)] text-[var(--accent)]"
      >
        無料トライアル残り{trialDaysLeft}日 — ご契約はこちら
      </Link>
    ) : null;

  return (
    <div className="flex min-h-screen">
      {/* デスクトップ用サイドナビ */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:shrink-0 border-[var(--border)] px-3 py-6 gap-1">
        <div className="px-3 pb-6">
          <p className="text-[15px] font-medium text-[var(--text-primary)]">
            食材・原価管理
          </p>
        </div>
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[14px] transition-colors ${
                active
                  ? "bg-[var(--brand)] text-[var(--on-brand)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
              }`}
            >
              <Icon size={20} stroke={1.75} aria-hidden />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-auto pt-4 border-t border-[var(--border)] px-3">
          <p className="text-[13px] text-[var(--text-primary)] mb-2 truncate">
            {restaurantName}
          </p>
          {isOwner && (
            <Link
              href="/staff"
              className={`flex items-center gap-2 text-[13px] mb-2 ${
                isActive(pathname, "/staff")
                  ? "text-[var(--brand)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <IconUsers size={16} stroke={1.75} aria-hidden />
              スタッフ管理
            </Link>
          )}
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {trialBanner}

        {/* モバイル用の店舗名バー */}
        <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
          <p className="text-[13px] text-[var(--text-secondary)] truncate">
            {restaurantName}
          </p>
          <div className="flex items-center gap-3 shrink-0">
            {isOwner && (
              <Link
                href="/staff"
                aria-label="スタッフ管理"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <IconUsers size={18} stroke={1.75} aria-hidden />
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>

        <main className="flex-1 pb-20 md:pb-8">{children}</main>

        {/* モバイル用下部タブバー */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-[var(--border)] bg-[var(--surface-2)] flex z-20">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${
                  active ? "text-[var(--brand)]" : "text-[var(--text-muted)]"
                }`}
              >
                <Icon size={21} stroke={1.75} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
