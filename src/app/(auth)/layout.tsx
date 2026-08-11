import Link from "next/link";

// onboarding・set-passwordはログイン状態を見るため、ビルド時に静的生成しようとしない。
export const dynamic = "force-dynamic";

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="text-[18px] font-medium text-[var(--text-primary)] text-center mb-8">
          食材・原価管理
        </p>
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] p-6">
          {children}
        </div>
        <nav className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[12px] text-[var(--text-muted)]">
          <Link href="/legal/tokushoho" className="hover:text-[var(--text-primary)]">
            特定商取引法に基づく表記
          </Link>
          <Link href="/legal/terms" className="hover:text-[var(--text-primary)]">
            利用規約
          </Link>
          <Link href="/legal/privacy" className="hover:text-[var(--text-primary)]">
            プライバシーポリシー
          </Link>
        </nav>
      </div>
    </div>
  );
}
