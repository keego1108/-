# 食材・原価管理

飲食店向けの食材単価・原価・在庫管理SaaS。スマホ・PC対応。

## 主な機能

- 食材の単価・仕入先管理（価格変更は自動で履歴に記録）
- メニューごとの原価・原価率をリアルタイム自動計算
- 在庫の基準値アラート
- 納品書の写真をAIで読み取り、単価表へ自動反映（OCR）
- 原価率の推移・値上がり食材の分析
- 店舗ごとのアカウント分離（マルチテナント）・スタッフ招待
- Stripeによる月額課金（無料トライアル付き）

## 開発

```bash
npm install
npm run dev
```

`.env.local.example` を `.env.local` にコピーし、必要な値を設定してください。未設定でもモックデータ・デモOCRで動作します。設定手順は [SETUP.md](./SETUP.md) を参照してください。

## 技術スタック

Next.js (App Router) / TypeScript / Tailwind CSS / Supabase (Auth・DB) / Anthropic API (OCR) / Stripe (決済)

## DBスキーマ

`supabase/schema.sql`（新規プロジェクト用）、`supabase/migration_00N_*.sql`（既存プロジェクトへの追加分）をSupabaseのSQL Editorで実行してください。
