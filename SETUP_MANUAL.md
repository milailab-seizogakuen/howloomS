# 🎓 Howl Learning Platform - セットアップマニュアル

このマニュアルでは、Howl Learning Platformを使って新しいオンラインスクールを立ち上げる手順を説明します。

---

## 📋 目次

1. [前提条件](#前提条件)
2. [プロジェクトのクローン](#プロジェクトのクローン)
3. [Supabaseプロジェクトのセットアップ](#supabaseプロジェクトのセットアップ)
4. [Google OAuth認証の設定](#google-oauth認証の設定)
5. [メール認証（Email OTP）の設定](#メール認証email-otpの設定)
6. [環境変数の設定](#環境変数の設定)
7. [ブランディングのカスタマイズ](#ブランディングのカスタマイズ)
8. [開発サーバーの起動](#開発サーバーの起動)
9. [デプロイ](#デプロイ)
10. [ユーザー管理（管理者向け）](#ユーザー管理管理者向け)
11. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

以下のアカウントとツールが必要です：

- ✅ Node.js 20以上がインストールされていること
- ✅ Googleアカウント
- ✅ Supabaseアカウント（無料プランでOK）
- ✅ Google Cloud Platformアカウント（無料）
- ✅ Gitがインストールされていること

---

## プロジェクトのクローン

```bash
# プロジェクトをクローン
git clone <repository-url>
cd howl-webschool-loom

# 依存関係をインストール
npm install
```

---

## Supabaseプロジェクトのセットアップ

### 1. 新規プロジェクトの作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. **New Project** をクリック
3. 以下を入力：
   - **Name**: `your-school-name`（例: `my-online-school`）
   - **Database Password**: 強力なパスワードを設定（メモしておく）
   - **Region**: `Northeast Asia (Tokyo)` を推奨
4. **Create new project** をクリック（数分かかります）

### 2. データベーステーブルの作成

プロジェクトが作成されたら、データベーステーブルを作成します：

1. 左メニューから **SQL Editor** をクリック
2. 以下のマイグレーションファイルを**順番に**実行：

#### ステップ1: `supabase/migrations/001_create_tables.sql` を実行

```sql
-- ファイルの内容をコピー&ペーストして実行
```

#### ステップ2: `supabase/migrations/002_rls_policies.sql` を実行

```sql
-- ファイルの内容をコピー&ペーストして実行
```

#### ステップ3: `supabase/migrations/003_add_approval_status.sql` を実行

```sql
-- ファイルの内容をコピー&ペーストして実行
```

#### ステップ4: `supabase/migrations/004_create_tags_tables.sql` を実行

```sql
-- ファイルの内容をコピー&ペーストして実行
```

#### ステップ5: `supabase/migrations/005_fix_videos_schema.sql` を実行

```sql
-- ファイルの内容をコピー&ペーストして実行
```

#### ステップ6: `supabase/migrations/006_fix_tags_table.sql` を実行

```sql
-- ファイルの内容をコピー&ペーストして実行
```

> ⚠️ **重要**: このマイグレーションは既存の `tags` と `video_tags` テーブルを削除して再作成します。
> 既にデータが入っている場合は、事前にバックアップを取ることを推奨します。

### 3. Supabase認証情報の取得

1. 左メニューから **⚙️ Project Settings** をクリック
2. **API** セクションをクリック
3. 以下をメモ：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. 管理者アカウントの事前設定 (重要)

特定のメールアドレスを持つユーザーを、登録時に自動的に「管理者」として扱うための設定です。これを最初に行うことで、自分自身を管理者としてスムーズに登録できます。

1. 左メニューから **SQL Editor** をクリック
2. **+ New query** をクリック
3. `supabase/migrations/008_admin_setup.sql` ファイルの内容をコピーして貼り付け
4. SQL内の `'your-email@example.com'` を自分のメールアドレスに書き換えて **Run** をクリック

---

## Google OAuth認証の設定

### 1. Google Cloud Consoleでプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 画面上部の **Select a project / プロジェクトを選択** → **NEW PROJECT / 新しいプロジェクト** をクリック
3. **Project name / プロジェクト名** を入力（例: `my-online-school`）
4. **CREATE / 作成** をクリック

### 2. OAuth同意画面の設定

1. 左メニューから **APIs & Services / APIとサービス** → **OAuth consent screen / OAuth同意画面** をクリック
2. **User Type / ユーザータイプ**: **External / 外部** を選択 → **CREATE / 作成**
3. 以下を入力：
   - **App name / アプリ名**: あなたのスクール名（例: `My Online School`）
   - **User support email / ユーザーサポートメール**: あなたのメールアドレス
   - **Developer contact information / デベロッパーの連絡先情報**: あなたのメールアドレス
4. **SAVE AND CONTINUE / 保存して次へ** をクリック
5. **Scopes / スコープ** → **SAVE AND CONTINUE / 保存して次へ**（デフォルトのまま）
6. **Test users / テストユーザー** → **SAVE AND CONTINUE / 保存して次へ**（スキップ可）
7. **Summary / 概要** → **BACK TO DASHBOARD / ダッシュボードに戻る**

### 3. OAuth 2.0 クライアントIDの作成

1. 左メニューから **APIs & Services / APIとサービス** → **Credentials / 認証情報** をクリック
2. **+ CREATE CREDENTIALS / + 認証情報を作成** → **OAuth client ID / OAuth クライアント ID** をクリック
3. 以下を入力：
   - **Application type / アプリケーションの種類**: **Web application / ウェブ アプリケーション**
   - **Name / 名前**: あなたのスクール名（例: `My Online School`）
   - **Authorized redirect URIs / 承認済みのリダイレクト URI** → **+ ADD URI / + URI を追加**:
     ```
     https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
     ```
     ⚠️ `YOUR-PROJECT-ID` を実際のSupabase Project URLに置き換えてください
     
     例: `https://iszwzqxxjohvvognnfbv.supabase.co/auth/v1/callback`
4. **CREATE / 作成** をクリック
5. **Client ID / クライアントID** と **Client secret / クライアントシークレット** をコピーしてメモ

> 💡 **ヒント**: クライアントIDとシークレットは後から確認できます。
> **Credentials / 認証情報** ページで作成したOAuthクライアントをクリックすれば再表示されます。

### 4. SupabaseにGoogle認証情報を設定

1. Supabase Dashboard → **Authentication** → **Providers** をクリック
2. **Google** を探してクリック
3. 以下を入力：
   - **Enable Sign in with Google**: ONにする
   - **Client ID (for OAuth)**: Google Cloud ConsoleでコピーしたクライアントID
   - **Client Secret (for OAuth)**: Google Cloud Consoleでコピーしたクライアントシークレット
4. **Save** をクリック

---

## メール認証（Email OTP）の設定

メールアドレスと6桁の認証コードでログインできるようにします。

### 1. Supabaseでメール認証を有効化

1. Supabase Dashboard → **Authentication** → **Providers** をクリック
2. **Email** を探してクリック
3. 以下を設定：
   - **Enable Email provider**: ONにする（デフォルトでON）
   - **Confirm email**: OFFにする（OTPを使用する場合は不要）
   - **Secure email change**: ONのまま（推奨）

### 2. Email Templatesの設定（オプション）

認証メールのテンプレートをカスタマイズできます：

1. Supabase Dashboard → **Authentication** → **Email Templates** をクリック
2. **Magic Link** テンプレートを選択
3. 件名やメール本文を編集（日本語に変更可能）

**デフォルトのテンプレート例**:
```
件名: Your Magic Link
本文: Click this link to log in: {{ .ConfirmationURL }}
```

**日本語カスタマイズ例**:
```
件名: ログイン認証コード
本文: 
こんにちは、

以下の6桁のコードを入力してログインしてください：

{{ .Token }}

このコードは10分間有効です。

---
{{ .SiteURL }}
```

### 3. SMTP設定（本番環境推奨）

デフォルトではSupabaseの内蔵SMTPが使用されますが、本番環境では独自のSMTPサーバーを設定することを推奨します。

1. Supabase Dashboard → **Project Settings** → **Auth** をクリック
2. **SMTP Settings** セクションまでスクロール
3. 以下を入力：
   - **Enable Custom SMTP**: ONにする
   - **Sender email**: 送信元メールアドレス（例: `noreply@yourdomain.com`）
   - **Sender name**: 送信者名（例: `My Online School`）
   - **Host**: SMTPサーバーのホスト（例: `smtp.gmail.com`）
   - **Port**: ポート番号（例: `587`）
   - **Username**: SMTPユーザー名
   - **Password**: SMTPパスワード
4. **Save** をクリック

> 💡 **Gmail SMTPを使用する場合**:
> - Host: `smtp.gmail.com`
> - Port: `587`
> - Username: あなたのGmailアドレス
> - Password: [アプリパスワード](https://support.google.com/accounts/answer/185833)を作成して使用

### 4. 動作確認

1. ログインページでメールアドレスを入力
2. 「認証コードを送信」をクリック
3. メールボックスを確認（迷惑メールフォルダも確認）
4. 6桁のコードを入力してログイン

---

## 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成します：

```bash
# .env.local.example をコピー
cp .env.local.example .env.local
```

`.env.local` ファイルを開いて、以下を入力：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# サイトのURL（ローカル開発時は http://localhost:3000）
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

⚠️ 実際の値に置き換えてください！

---

## ブランディングのカスタマイズ

### 1. ロゴの変更

#### ログイン画面のロゴ
1. あなたのロゴ画像を `public/logo.png` に配置
2. 推奨サイズ: 幅800px × 高さ200px（透過PNG推奨）

#### ダッシュボードのロゴ
1. ダッシュボード用のロゴを `public/logo-member.png` に配置
2. 推奨サイズ: 幅200px × 高さ40px（透過PNG推奨）

### 2. サイト名とメタデータの変更

`src/app/layout.tsx` を編集：

```typescript
export const metadata: Metadata = {
  title: "あなたのスクール名",
  description: "あなたのスクールの説明文",
};
```

### 3. カラーテーマの変更（オプション）

`src/app/globals.css` でカラーを変更できます：

```css
/* メインカラー */
.bg-howl-header {
  background: linear-gradient(135deg, #YOUR-COLOR-1 0%, #YOUR-COLOR-2 100%);
}
```

### 4. チャット機能の管理者名変更

`src/app/chat/page.tsx` の162行目を編集：

```typescript
<p className="text-xs opacity-60">あなたの名前とのメッセージ</p>
```

---

## 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセスして動作確認！

---

## 初回ログインとユーザー承認

### 1. 初回ログイン

1. http://localhost:3000 にアクセス
2. **Googleでログイン** をクリック
3. Googleアカウントで認証
4. 「承認待ち」画面が表示されます

### 2. ユーザーを承認する

新規ユーザーはデフォルトで承認待ち状態になります。管理者として承認する手順：

1. Supabase Dashboard → **Table Editor** → **profiles** テーブルを開く
2. ユーザーの行を見つける
3. `is_approved` カラムを `false` → `true` に変更
4. （オプション）`is_admin` を `true` にすると管理者権限を付与

詳細は `SUPABASE_MANUAL.md` を参照してください。

---

## ユーザー管理（管理者向け）

管理者は、SupabaseのSQL Editorを使用してユーザーの承認状態や管理者権限を管理できます。

### 一括承認

全ての未承認ユーザーを一度に承認する場合：

1. Supabase Dashboard → **SQL Editor**
2. 以下のSQLを実行：

```sql
UPDATE profiles 
SET is_approved = true, updated_at = NOW()
WHERE is_approved = false;
```

### 個別承認

特定のユーザーを承認する場合：

```sql
-- メールアドレスで承認
UPDATE profiles p
SET is_approved = true, updated_at = NOW()
FROM auth.users u
WHERE p.user_id = u.id 
AND u.email = 'user@example.com';
```

### その他のSQLクエリ

`supabase/migrations/007_bulk_approval_queries.sql` に以下のクエリが含まれています：
- 未承認ユーザーの一覧表示
- 承認済みユーザーの一覧表示
- 個別ユーザーの承認/承認取消
- 管理者権限の付与/削除
- ユーザー統計情報の表示
- メールアドレスでの検索

---

## コンテンツの追加

### 講座の追加

1. Supabase Dashboard → **Table Editor** → **courses** テーブル
2. **Insert** → **Insert row** をクリック
3. 以下を入力：
   - `title`: 講座名
   - `description`: 講座の説明
   - `date`: 公開日（YYYY-MM-DD形式）
   - `sort_order`: 表示順序（数字が小さいほど上に表示）
4. **Save** をクリック

### 動画の追加

1. Loom動画を録画してURLを取得
2. Supabase Dashboard → **Table Editor** → **videos** テーブル
3. **Insert** → **Insert row** をクリック
4. 以下を入力：
   - `course_id`: 講座のID（coursesテーブルから取得）
   - `title`: 動画のタイトル
   - `video_url`: Loom動画のURL（例: `https://www.loom.com/share/xxxxx`）
   - `video_id`: Loom動画ID（URLの最後の部分）
   - `type`: `main`（メイン講義）または `supplementary`（補足資料）
   - `sort_order`: 表示順序
5. **Save** をクリック

### タグの追加（オプション）

1. Supabase Dashboard → **Table Editor** → **tags** テーブル
2. **Insert** → **Insert row** をクリック
3. 以下を入力：
   - `name`: タグ名（例: `初心者向け`）
   - `category`: `type`（講座タイプ）または `theme`（テーマ）
   - `color_code`: カラーコード（例: `#4A7C6F`）
   - `display_order`: 表示順序
4. **Save** をクリック

---

## デプロイ

### 1. Vercelへのデプロイ（推奨）

1. [Vercel](https://vercel.com) にアクセス
2. **Add New** → **Project** をクリック
3. GitHubリポジトリを連携
4. **Environment Variables** に以下を追加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`（本番URLを設定）
5. **Deploy** をクリック

### 2. Supabase認証設定の更新（重要）

デプロイ後、認証のリダイレクト先を `localhost` から実際のドメインに変更する必要があります。これを忘れると、ログイン後に `localhost:3000` に飛ばされてエラーになります。

1. [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **URL Configuration** をクリック
2. **Site URL** を実際のデプロイ先URLに変更：
   - 例: `https://your-school-name.vercel.app`
3. **Redirect URLs** にも同じURLを追加（推奨）：
   - **Add URL** をクリックして `https://your-school-name.vercel.app/**` を追加
4. **Save** をクリック

### 3. Google Cloud Consoleの設定更新

デプロイ後、Google Cloud Consoleで承認済みリダイレクトURIを追加：

1. Google Cloud Console → **APIs & Services / APIとサービス** → **Credentials / 認証情報**
2. 作成したOAuthクライアントIDをクリック
3. **Authorized redirect URIs / 承認済みのリダイレクト URI** セクションで **+ ADD URI / + URI を追加** をクリック
4. 以下を追加：
   ```
   https://your-domain.vercel.app/auth/callback
   ```
   ⚠️ `your-domain` を実際のVercelドメインに置き換えてください
5. **SAVE / 保存** をクリック

> 💡 **ヒント**: 本番環境とステージング環境で異なるドメインを使う場合は、両方のリダイレクトURIを追加してください。

### 4. （オプション）管理画面を別プロジェクトで運用する場合

管理画面を別のリポジトリやプロジェクトとして運用し、同じSupabaseプロジェクトを共有する場合の設定手順です。

1. [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **URL Configuration** をクリック
2. **Redirect URLs** に管理画面のURLを追加：
   - 例: `https://your-admin-panel.netlify.app/**`
   - ⚠️ 末尾に `/**` を付けることで、認証後のリダイレクトが正しく動作します。
3. 管理画面側のプロジェクトの環境変数（`.env`）に、本プロジェクトと同じ `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定します。
4. Google OAuthを使用している場合、Google Cloud Consoleの「承認済みのリダイレクトURI」に管理画面側のURLを追加する必要はありません（SupabaseのURL経由で処理されるため）。ただし、Supabase側の `Redirect URLs` への登録は必須です。

---

## トラブルシューティング

### ログイン時に「Unsupported provider」エラー

→ Supabase DashboardでGoogle認証が有効になっているか確認

### 「承認待ち」画面から進めない

→ Supabase Dashboard → **Table Editor** → **profiles** で `is_approved` を `true` に変更

### 動画が再生されない

→ `video_id` が正しいか確認（Loom URLの最後の部分）

### 環境変数が反映されない

→ 開発サーバーを再起動（`Ctrl+C` → `npm run dev`）

---

## サポート

問題が発生した場合は、以下を確認してください：

- `SUPABASE_MANUAL.md` - ユーザー承認の詳細手順
- `README.md` - プロジェクトの基本情報
- Supabase Dashboard → **Logs** - エラーログの確認

---

## 🎉 完了！

これで、あなた専用のオンラインスクールが完成しました！

次のステップ：
1. コンテンツ（講座・動画）を追加
2. ユーザーを招待
3. フィードバックを収集して改善

Happy Teaching! 🚀
