import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記｜食材・原価管理",
};

const ROWS: { label: string; value: React.ReactNode }[] = [
  { label: "販売業者", value: "平松佳吾" },
  { label: "運営責任者", value: "平松佳吾" },
  {
    label: "所在地",
    value: "ご請求をいただいた場合、遅滞なく開示いたします。",
  },
  {
    label: "電話番号",
    value: "ご請求をいただいた場合、遅滞なく開示いたします。",
  },
  { label: "メールアドレス", value: "hk.soccer1108@gmail.com" },
  { label: "運営サイトURL", value: "https://omega-gold-81.vercel.app" },
  { label: "販売価格", value: "月額 2,980円（税込）" },
  {
    label: "商品代金以外の必要料金",
    value: "インターネット接続料金・通信料金等はお客様のご負担となります。",
  },
  { label: "お支払い方法", value: "クレジットカード決済（Stripe社の決済システムを利用）" },
  {
    label: "お支払い時期",
    value:
      "ご契約手続き完了時に決済が実行されます。以降は毎月同日に自動更新され、その都度課金されます。なお、初回登録から14日間はクレジットカード登録不要の無料トライアル期間です。トライアル期間中にご契約いただいた場合は、その時点で課金が開始されます。",
  },
  {
    label: "サービス提供時期",
    value: "お申し込み手続き完了後、直ちにご利用いただけます。",
  },
  {
    label: "返品・キャンセルについて",
    value:
      "デジタルサービスの性質上、お支払い済み料金の返金には原則対応しておりません。解約はマイページからいつでも可能で、解約後は次回更新日以降の請求が発生しません（日割り返金はありません）。",
  },
  {
    label: "動作環境",
    value: "インターネット接続環境、最新版のWebブラウザ（Chrome, Safari等）",
  },
];

export default function TokushohoPage() {
  return (
    <div>
      <h1 className="text-[18px] font-medium text-[var(--text-primary)] mb-6">
        特定商取引法に基づく表記
      </h1>
      <dl className="divide-y divide-[var(--border)]">
        {ROWS.map((row) => (
          <div key={row.label} className="py-4 grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-1 sm:gap-4">
            <dt className="text-[13px] text-[var(--text-muted)]">{row.label}</dt>
            <dd className="text-[14px] text-[var(--text-primary)] leading-relaxed">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
