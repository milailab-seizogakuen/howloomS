# Supabase Manual - ユーザー承認手順

このドキュメントでは、Supabase Dashboardを使用してユーザーを承認する方法を説明します。

---

## 1. マイグレーションの適用

まず、データベースに `is_approved` カラムを追加する必要があります。

### 方法A: Supabase Dashboard (SQL Editor)

1. [Supabase Dashboard](https://supabase.com/dashboard) にログインします。
2. 対象のプロジェクトを選択します。
3. 左メニューから **SQL Editor** をクリックします。
4. 以下のSQLを貼り付けて実行します:

```sql
-- profilesテーブルに is_approved カラムを追加
ALTER TABLE profiles ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT false;
```

5. **Run** ボタンをクリックして実行します。

### 方法B: supabase CLI (ローカル)

ターミナルで以下のコマンドを実行します:

```bash
npx supabase db push
```

---

## 2. ユーザーの承認方法

### ステップ 1: Table Editor を開く

1. [Supabase Dashboard](https://supabase.com/dashboard) にログインします。
2. 対象のプロジェクトを選択します。
3. 左メニューから **Table Editor** をクリックします。

### ステップ 2: profiles テーブルを選択

1. テーブル一覧から **profiles** をクリックします。
2. ユーザーの一覧が表示されます。

### ステップ 3: ユーザーを承認

1. 承認したいユーザーの行を見つけます（`name` カラムで確認できます）。
2. その行の **is_approved** カラムをクリックします。
3. `false` から `true` に変更します。
4. 変更は自動的に保存されます。

---

## 3. 複数ユーザーを一括承認

SQL Editorで以下のコマンドを実行すると、全ユーザーを一括承認できます:

```sql
-- 全ユーザーを承認
UPDATE profiles SET is_approved = true;
```

特定のユーザーのみ承認する場合:

```sql
-- 特定のユーザーを承認（名前で指定）
UPDATE profiles SET is_approved = true WHERE name = 'ユーザー名';

-- 特定のユーザーを承認（IDで指定）
UPDATE profiles SET is_approved = true WHERE id = 'ユーザーのUUID';
```

---

## 4. 承認状態の確認

SQL Editorで以下のクエリを実行すると、ユーザーの承認状態を確認できます:

```sql
-- 未承認ユーザーの一覧
SELECT name, is_approved, created_at FROM profiles WHERE is_approved = false;

-- 承認済みユーザーの一覧
SELECT name, is_approved, created_at FROM profiles WHERE is_approved = true;
```

---

## 5. トラブルシューティング

### Q: カラムが存在しないエラーが出る

A: マイグレーションが適用されていません。「1. マイグレーションの適用」の手順を実行してください。

### Q: ユーザーが承認後もアクセスできない

A: 以下を確認してください:
- ブラウザのキャッシュをクリアする
- ユーザーに一度ログアウト→再ログインしてもらう
- `is_approved` が正しく `true` になっているか確認する

### Q: 既存ユーザーを全員承認したい

A: SQL Editorで以下を実行:
```sql
UPDATE profiles SET is_approved = true;
```

---

## 注意事項

- 新規登録ユーザーは自動的に `is_approved = false` になります。
- 承認されていないユーザーは「承認待ち」画面が表示され、コンテンツにアクセスできません。
- 管理者（`is_admin = true`）も承認が必要です。
