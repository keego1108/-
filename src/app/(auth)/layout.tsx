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
      </div>
    </div>
  );
}
