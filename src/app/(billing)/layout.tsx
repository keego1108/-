import LogoutButton from "@/components/LogoutButton";

// ログイン状態・契約状況によって内容が変わる画面なので、ビルド時に静的生成しようとしない。
export const dynamic = "force-dynamic";

export default function BillingGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-8">
          <p className="text-[18px] font-medium text-[var(--text-primary)]">
            食材・原価管理
          </p>
          <LogoutButton />
        </div>
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
