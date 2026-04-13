# 🎓 Howl Learning Platform — プロジェクト仕様書

**プロジェクト名**: howl-webschool-loom  
**バージョン**: 0.1.0  
**最終更新**: 2026-02-27

---

## 1. プロジェクト概要

**Howl Learning Platform** は、特定コミュニティ向けのクローズド型オンライン学習プラットフォームです。管理者が Loom で録画した講義動画を、承認済みメンバー限定で公開します。受講者はブラウザからいつでも動画を視聴し、確認テストに取り組み、管理者へメッセージを送ることができます。

### 主な特徴

- **招待制・承認制**: 新規ユーザーは管理者が承認するまでコンテンツにアクセスできない
- **Loom 動画プレーヤー内蔵**: oEmbed API でサムネイルを自動取得し、埋め込み再生
- **進捗管理**: 動画ごとに「完了」マークを付けられ、コース単位で進捗率を表示
- **確認テスト（クイズ）**: 全動画完了後にテストを解放。合格スコアを設定可能
- **タグ絞り込み**: 「講座タイプ」と「テーマ」の2軸でタグ付けし、AND/OR で絞り込める
- **リアルタイムチャット**: Supabase Realtime を使った受講者 ↔ 管理者の 1on1 チャット
- **ホワイトラベル対応**: ロゴ・カラー・スクール名を環境変数とアセット差し替えで変更可能

---

## 2. 技術スタック

| レイヤー | 採用技術 |
|---------|---------|
| フロントエンド | Next.js 16（App Router）/ React 19 |
| 言語 | TypeScript 5 |
| スタイリング | Tailwind CSS v4 |
| バリデーション | Zod v4 |
| バックエンド / BaaS | Supabase（PostgreSQL + Auth + Realtime + Storage） |
| 認証 | Supabase Auth（Google OAuth / メール OTP） |
| 動画プレーヤー | Loom Embed（iframe + oEmbed API） |
| デプロイ | Vercel（推奨） |
| 開発ランタイム | Node.js 20以上 |

---

## 3. システム構成図

```
ブラウザ（ユーザー / 管理者）
        ↕ HTTPS
[Vercel] Next.js App
  ├─ /src/app          ← Next.js App Router ページ群
  ├─ /src/components   ← 共通コンポーネント
  ├─ /src/lib          ← Supabase クライアント / API ユーティリティ
  └─ /src/types        ← TypeScript 型定義
        ↕ REST / Realtime WebSocket
[Supabase]
  ├─ PostgreSQL        ← データベース（プロファイル・講座・動画・クイズなど）
  ├─ Auth              ← 認証（Google OAuth / Email OTP）
  └─ Realtime          ← チャットのリアルタイム配信

[Loom]
  └─ oEmbed API        ← サムネイル取得（/api/loom/thumbnail 経由でプロキシ）
```

---

## 4. 画面・ページ一覧

| パス | 画面名 | 説明 | 認証 | 承認 |
|-----|--------|------|------|------|
| `/login` | ログイン | Google OAuth / メール OTP でログイン | 不要 | 不要 |
| `/onboarding` | 初回プロフィール登録 | 3ステップで名前・AIツール・意気込みを登録 | 必要 | 不要 |
| `/approval-pending` | 承認待ち | 管理者承認待ちの画面 | 必要 | 不要 |
| `/dashboard` | ダッシュボード | 動画一覧 + タグフィルタ | 必要 | 必要 |
| `/courses/[id]` | 講座詳細 | 動画一覧・プレーヤー・進捗・クイズへのリンク | 必要 | 必要 |
| `/courses/[id]/quiz/[quizId]` | クイズ | 確認テスト画面 | 必要 | 必要 |
| `/chat` | チャット | 管理者との 1on1 チャット | 必要 | 必要 |
| `/profile` | プロフィール | 自分のプロフィール閲覧 | 必要 | 必要 |
| `/auth/callback` | 認証コールバック | OAuth / OTP 認証完了後のリダイレクト処理 | — | — |
| `/demo` | デモ | 動画プレーヤーのデモページ | 不要 | 不要 |

---

## 5. データベーススキーマ

マイグレーションファイルは `supabase/migrations/001〜008` 番順に適用。

### 5-1. `profiles` テーブル

| カラム | 型 | 説明 |
|-------|----|------|
| `id` | uuid PK | プロフィール ID |
| `user_id` | uuid FK → auth.users | 認証ユーザー ID |
| `name` | text | 表示名 |
| `avatar_url` | text nullable | アバター画像 URL |
| `has_met` | boolean | 管理者との面識フラグ |
| `ai_tools` | text[] | 使用 AI ツールの配列 |
| `motivation` | text nullable | 学習意気込み（200字以内） |
| `is_admin` | boolean | 管理者フラグ |
| `is_approved` | boolean | 承認済みフラグ（デフォルト false） |
| `created_at` / `updated_at` | timestamptz | タイムスタンプ |

### 5-2. `courses` テーブル

| カラム | 型 | 説明 |
|-------|----|------|
| `id` | uuid PK | 講座 ID |
| `title` | text | 講座タイトル |
| `description` | text nullable | 講座説明 |
| `date` | date nullable | 公開日 |
| `duration_minutes` | integer nullable | 総再生時間（分） |
| `sort_order` | integer | 表示順（昇順） |

### 5-3. `videos` テーブル

| カラム | 型 | 説明 |
|-------|----|------|
| `id` | uuid PK | 動画 ID |
| `course_id` | uuid FK → courses | 紐付く講座 |
| `title` | text | 動画タイトル |
| `video_url` | text | Loom 動画 URL |
| `video_id` | text | Loom 動画 ID（URL末尾） |
| `type` | `'main'` / `'supplementary'` | 本講座 / 補足資料 |
| `sort_order` | integer | 表示順 |

### 5-4. `quizzes` / `quiz_results` テーブル

| テーブル | 主要カラム |
|---------|-----------|
| `quizzes` | `course_id`, `video_id nullable`, `questions (JSON)`, `passing_score` |
| `quiz_results` | `user_id`, `quiz_id`, `score`, `passed`, `answers`, `completed_at` |

`questions` は `QuizQuestion[]` の JSON 配列（`type: 'single'|'multiple'`、選択肢・正解・解説を含む）。

### 5-5. `video_progress` テーブル

| カラム | 型 | 説明 |
|-------|----|------|
| `user_id` | uuid | ユーザー |
| `video_id` | uuid | 動画 |
| `is_completed` | boolean | 完了フラグ |
| `completed_at` | timestamptz nullable | 完了日時 |

ユニーク制約: `(user_id, video_id)`

### 5-6. `tags` / `video_tags` テーブル

| テーブル | 主要カラム |
|---------|-----------|
| `tags` | `name`, `category ('type'|'theme')`, `color_code`, `display_order` |
| `video_tags` | `video_id`, `tag_id`（多対多中間テーブル） |

### 5-7. `chats` テーブル

| カラム | 型 | 説明 |
|-------|----|------|
| `user_id` | uuid | チャット相手のユーザー ID |
| `message` | text | メッセージ本文 |
| `sender_type` | `'user'` / `'admin'` | 送信者種別 |
| `created_at` | timestamptz | 送信日時 |

---

## 6. 認証フロー

```
[未ログイン] → /login
  ├─ Email OTP: メール入力 → 6桁コード送信 → コード入力 → /auth/callback
  └─ Google OAuth: Google 認証 → /auth/callback
           ↓
[/auth/callback]
  ├─ profiles テーブルにレコードなし → /onboarding
  ├─ is_approved = false → /approval-pending
  └─ is_approved = true  → /dashboard
```

- ミドルウェア (`middleware.ts`) が全ルートで Supabase セッションを更新
- 静的アセット（画像・SVG など）はミドルウェア対象外

---

## 7. ユーザーロールと権限

| ロール | `is_admin` | `is_approved` | アクセス可能範囲 |
|-------|-----------|--------------|----------------|
| 未承認ユーザー | false | false | `/approval-pending` のみ |
| 一般受講者 | false | true | ダッシュボード・講座・クイズ・チャット |
| 管理者 | true | true | 上記すべて ＋ 管理機能（Supabase Dashboard 経由） |

> ユーザー承認・管理者昇格は現在 Supabase Dashboard の `profiles` テーブルを直接操作、または SQL で実施します。

---

## 8. 主要機能の詳細

### 8-1. ダッシュボード（`/dashboard`）

- `getAllVideos()` で全動画をタグ付き取得
- `/api/loom/thumbnail` 経由でサムネイル一括取得（Loom oEmbed API プロキシ）
- **タグフィルタ（`TagFilter` コンポーネント）**
  - 「講座タイプ」（単一選択）と「テーマ」（複数選択）の 2 軸
  - AND / OR モード切り替え
  - フィルタ状態は URL クエリパラメータに同期（ブックマーク可能）

### 8-2. 講座詳細（`/courses/[id]`）

- メイン動画（`type='main'`）を最初の Loom プレーヤーで表示
- 全動画リストに「完了にする」ボタン → `video_progress` テーブルに upsert
- サイドバーにコース進捗バー（完了数 / 全動画数 × 100%）
- 全動画完了後に確認テストボタンを有効化

### 8-3. クイズ（`/courses/[id]/quiz/[quizId]`）

- 単一選択 / 複数選択の混在に対応
- 合格スコア（`passing_score`）と実際のスコアを比較して合否判定
- 結果は `quiz_results` テーブルに保存

### 8-4. チャット（`/chat`）

- Supabase Realtime（`postgres_changes` イベント）でメッセージをリアルタイム受信
- `sender_type` で受講者 / 管理者を判別し、吹き出しの方向を切り替え
- Enter で送信、Shift+Enter で改行
- エラー時に「再試行」トースト表示

### 8-5. 初回オンボーディング（`/onboarding`）

3 ステップのウィザード形式：
1. **Step 1**: 表示名・管理者との面識確認
2. **Step 2**: 使用 AI ツール選択（複数選択）
3. **Step 3**: 学習意気込み入力（必須・200 字以内）

入力値は Zod スキーマでバリデーション後、`profiles` テーブルに INSERT。

---

## 9. API エンドポイント

| パス | メソッド | 説明 |
|-----|---------|------|
| `/api/loom/thumbnail` | GET | Loom oEmbed API へのサーバーサイドプロキシ。クエリ: `url` または `id` |
| `/auth/callback` | GET | Supabase OAuth / OTP コールバック処理 |

---

## 10. 環境変数

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名公開キー |
| `NEXT_PUBLIC_SITE_URL` | サイトの公開 URL（認証リダイレクトに使用） |

---

## 11. カスタマイズポイント（ホワイトラベル）

| 対象 | 変更箇所 |
|-----|---------|
| ログイン画面ロゴ | `public/logo.png`（推奨: 800 × 200px 透過 PNG） |
| ダッシュボードロゴ | `public/logo-member.png`（推奨: 200 × 40px 透過 PNG） |
| サイト名・メタデータ | `src/app/layout.tsx` の `metadata` |
| カラーテーマ | `src/app/globals.css`（`.bg-howl-header` など） |
| チャットの管理者名表示 | `src/app/chat/page.tsx`（162 行目） |

---

## 12. デプロイ構成

### 推奨: Vercel + Supabase

```
GitHub リポジトリ
   ↓ push / PR
[Vercel] ─── 環境変数 ──→ .env.local 相当
   ↓ ビルド・デプロイ
howl-webschool.vercel.app
   ↕
[Supabase]
  ├─ Auth URL Configuration → Site URL を本番 URL に変更
  └─ Redirect URLs に本番 URL を追加
```

### 本番デプロイ後の必須設定

1. Supabase Dashboard → Authentication → URL Configuration
   - **Site URL**: `https://your-domain.vercel.app`
   - **Redirect URLs**: `https://your-domain.vercel.app/**`
2. Google Cloud Console → OAuth クライアント → 承認済みリダイレクト URI に追加:  
   `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`

---

## 13. マイグレーション一覧

| ファイル | 内容 |
|---------|------|
| `001_create_tables.sql` | 基本テーブル作成 |
| `002_rls_policies.sql` | Row Level Security ポリシー設定 |
| `003_add_approval_status.sql` | `profiles` へ承認フラグ追加 |
| `004_create_tags_tables.sql` | `tags` / `video_tags` テーブル作成 |
| `005_fix_videos_schema.sql` | `youtube_url` → `video_url` リネーム |
| `006_fix_tags_table.sql` | `tags` / `video_tags` 再作成（color_code 追加等） |
| `007_bulk_approval_queries.sql` | ユーザー管理用 SQL クエリ集 |
| `008_admin_setup.sql` | 管理者メールアドレスの事前設定 |

> ⚠️ マイグレーションは **001 → 008 の順番** で適用してください。006 は既存の tags / video_tags を削除して再作成するため、既存データがある場合は事前バックアップが必要です。
