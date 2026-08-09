# セットアップメモ

## 今すぐ動かす

```bash
npm run dev
```

`ANTHROPIC_API_KEY` や Supabase の設定がなくても、モックデータ・デモOCRで全画面を確認できます。

## 本番運用に向けて（あとで）

1. **Anthropic APIキー**（納品書OCR用）
   - [console.anthropic.com](https://console.anthropic.com) でキーを発行
   - `.env.local` に `ANTHROPIC_API_KEY=...` を設定するとOCRが実データで動く

2. **Supabase**（データの永続化・スマホ⇔PC同期用）
   - [supabase.com](https://supabase.com) で無料プロジェクトを作成
   - SQL Editorで `supabase/schema.sql` の内容を実行
   - Project Settings > API から URL と anon key を取得し、`.env.local` に設定
   - ここまでやったら教えてください。`src/lib/data.ts` の実装をSupabase呼び出しに差し替えます（今はメモリ上のモックデータで動いています）

3. **簡易ログイン**
   - Supabase接続後に、メール+パスワードでの簡易ログイン画面を追加します
