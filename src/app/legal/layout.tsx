import Link from "next/link";

// 法的ページ（特商法・利用規約・プライバシーポリシー）用の共通レイアウト。
// ログイン不要で誰でも閲覧できる（Stripe審査・App Store審査・利用者の事前確認のため）。
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← トップに戻る
        </Link>
        <div className="mt-6 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] p-6 sm:p-8">
          {children}
        </div>
        <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-[var(--text-muted)]">
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
