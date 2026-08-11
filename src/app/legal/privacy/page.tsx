import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー｜食材・原価管理",
};

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. はじめに",
    body: (
      <p>
        平松佳吾（以下「運営者」）は、運営者が提供する「食材・原価管理」（以下「本サービス」）における利用者の情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
      </p>
    ),
  },
  {
    title: "2. 取得する情報",
    body: (
      <p>
        本サービスは、以下の情報を取得します。（1）アカウント情報（メールアドレス、パスワード（暗号化済み）等）（2）店舗・スタッフ情報（店舗名、招待したスタッフのメールアドレス等）（3）食材・メニュー・在庫等の業務データ（4）納品書・値札等、利用者がアップロードした画像データ（5）決済に必要な情報（クレジットカード情報自体は運営者のサーバーには保存されず、Stripe社が直接取り扱います）（6）アクセスログ等の技術情報。
      </p>
    ),
  },
  {
    title: "3. 利用目的",
    body: (
      <p>
        取得した情報は、本サービスの提供・維持・改善、本人確認、お問い合わせへの対応、利用料金の請求・決済処理、重要なお知らせの送付、不正利用の防止のために利用します。
      </p>
    ),
  },
  {
    title: "4. 第三者提供",
    body: (
      <p>
        運営者は、法令に基づく場合を除き、利用者の同意なく個人情報を第三者に提供しません。ただし、次条に定める業務委託先への提供はこの限りではありません。
      </p>
    ),
  },
  {
    title: "5. 業務委託先（外部サービスの利用）",
    body: (
      <>
        <p>本サービスは、機能提供のために以下の外部サービスを利用しており、その範囲で必要な情報を委託しています。</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Supabase（データベース・認証基盤の提供）</li>
          <li>Stripe（決済処理。クレジットカード情報の取り扱いを含む）</li>
          <li>Anthropic（納品書・値札の画像から食材情報を読み取るAI機能の提供。アップロードされた画像を解析目的で送信します）</li>
          <li>Vercel（本サービスのホスティング基盤）</li>
        </ul>
        <p className="mt-2">
          これらの委託先は、それぞれのプライバシーポリシーおよびセキュリティ基準に基づき情報を取り扱います。
        </p>
      </>
    ),
  },
  {
    title: "6. Cookie等の利用",
    body: (
      <p>
        本サービスは、ログイン状態の維持等のためにCookieを利用します。Cookieには個人を特定する情報は含まれませんが、ブラウザの設定によりCookieを無効化した場合、本サービスの一部機能がご利用いただけないことがあります。
      </p>
    ),
  },
  {
    title: "7. 安全管理措置",
    body: (
      <p>
        運営者は、取得した情報への不正アクセス・漏えい・滅失・毀損を防止するため、適切な安全管理措置を講じます。
      </p>
    ),
  },
  {
    title: "8. 開示・訂正・削除等の請求",
    body: (
      <p>
        利用者は、運営者が保有する自己の個人情報について、開示・訂正・利用停止・削除を請求することができます。ご希望の場合は、下記お問い合わせ窓口までご連絡ください。アカウント退会（データ削除）についても同窓口で承ります。
      </p>
    ),
  },
  {
    title: "9. お問い合わせ窓口",
    body: <p>メールアドレス：hk.soccer1108@gmail.com</p>,
  },
  {
    title: "10. 本ポリシーの改定",
    body: (
      <p>
        運営者は、必要に応じて本ポリシーを改定することがあります。重要な変更を行う場合は、本サービス上での掲示等、適切な方法により利用者にお知らせします。
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div>
      <h1 className="text-[18px] font-medium text-[var(--text-primary)] mb-2">
        プライバシーポリシー
      </h1>
      <p className="text-[13px] text-[var(--text-muted)] mb-6">制定日：2026年8月12日</p>
      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-[14px] font-medium text-[var(--text-primary)] mb-2">
              {section.title}
            </h2>
            <div className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
