import Link from "next/link";
import { requireTenant } from "@/lib/tenant";
import { Badge } from "@/components/ui";
import { SubscribeButton, ManageBillingButton } from "@/components/BillingActions";
import { MONTHLY_PRICE_JPY } from "@/lib/stripe";
import { formatYen } from "@/lib/format";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const tenant = await requireTenant();
  const { checkout } = await searchParams;

  return (
    <div>
      <h1 className="text-[18px] font-medium text-[var(--text-primary)] mb-1 text-center">
        ご契約状況
      </h1>
      <p className="text-[13px] text-[var(--text-secondary)] mb-6 text-center">
        {tenant.restaurantName}
      </p>

      {checkout === "success" && (
        <p className="text-[13px] text-[var(--success)] bg-[var(--success-bg)] rounded-[8px] px-3 py-2 mb-4">
          お手続きありがとうございます。反映まで数秒かかることがあります。反映されない場合はページを再読み込みしてください。
        </p>
      )}

      <div className="rounded-[8px] bg-[var(--surface-1)] p-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[13px] text-[var(--text-secondary)]">プラン</p>
          <p className="text-[14px] text-[var(--text-primary)]">
            {formatYen(MONTHLY_PRICE_JPY)} / 月
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-[var(--text-secondary)]">状態</p>
          <StatusBadge
            status={tenant.subscriptionStatus}
            isEntitled={tenant.isEntitled}
            trialDaysLeft={tenant.trialDaysLeft}
          />
        </div>
      </div>

      {tenant.subscriptionStatus === "active" || tenant.subscriptionStatus === "past_due" ? (
        <ManageBillingButton />
      ) : (
        <SubscribeButton />
      )}

      <p className="text-[12px] text-[var(--text-muted)] text-center mt-4">
        <Link href="/" className="underline underline-offset-2">
          ホームに戻る
        </Link>
      </p>
    </div>
  );
}

function StatusBadge({
  status,
  isEntitled,
  trialDaysLeft,
}: {
  status: string;
  isEntitled: boolean;
  trialDaysLeft: number | null;
}) {
  if (status === "active") return <Badge tone="success">契約中</Badge>;
  if (status === "past_due") return <Badge tone="danger">お支払いに問題があります</Badge>;
  if (status === "canceled") return <Badge tone="neutral">解約済み</Badge>;
  if (status === "trialing" && isEntitled) {
    return <Badge tone="accent">トライアル中（残り{trialDaysLeft ?? 0}日）</Badge>;
  }
  return <Badge tone="danger">トライアル終了</Badge>;
}
