# 🔄 Howl Learning Platform — 移行改良プラン

**対象プロジェクト**: howl-webschool-loom  
**作成日**: 2026-02-27  
**目的**: Supabase（無料プランの休眠問題）を解消するため、認証・DBをGoogle Sheets + NextAuth.jsに移行する

---

## 1. 移行の背景と目的

Supabase無料プランでは**7日間アクティビティがないとプロジェクトが自動休眠**し、受講者が突然アクセスできなくなる問題がある。有料化（$25/月）以外の回避策はグレーゾーンであるため、根本解決としてSupabaseを廃止する。

移行後の構成はコスト0・休眠なし・Google Sheetsで直接データ管理できる運用しやすい設計を目指す。

---

## 2. 移行前後の技術スタック比較

| レイヤー | 移行前（現在） | 移行後 |
|---------|--------------|--------|
| データベース | Supabase（PostgreSQL） | Google Sheets API |
| 認証 | Supabase Auth | NextAuth.js（Auth.js v5） |
| メールOTP | Supabase Auth内蔵 | Resend + NextAuth.js Email Provider |
| Google OAuth | Supabase Auth経由 | NextAuth.js Google Provider（任意） |
| リアルタイム | Supabase Realtime | ポーリング（数秒おきにAPIコール） |
| アクセス制御 | Row Level Security（RLS） | Next.js Route Handlerでサーバーサイド制御 |
| フロントエンド | Next.js 16 / React 19 | 変更なし |
| スタイリング | Tailwind CSS v4 | 変更なし |
| バリデーション | Zod v4 | 変更なし |
| デプロイ | Vercel | 変更なし |

---

## 3. Google Sheetsのシート構成

1つのスプレッドシートに以下のシートを作成する。**シート名・列名は変更禁止**（アプリが名前で参照するため）。

| シート名 | 対応テーブル | 主要列 |
|---------|------------|--------|
| `profiles` | ユーザー情報 | id, email, name, avatar_url, has_met, ai_tools, motivation, is_admin, is_approved, created_at, updated_at |
| `courses` | 講座一覧 | id, title, description, date, duration_minutes, sort_order |
| `videos` | 動画一覧 | id, course_id, title, video_url, video_id, type, sort_order |
| `tags` | タグ | id, name, category, color_code, display_order |
| `video_tags` | 動画↔タグ中間 | video_id, tag_id |
| `quizzes` | クイズ | id, course_id, video_id, questions, passing_score |
| `quiz_results` | クイズ結果 | id, user_id, quiz_id, score, passed, answers, completed_at |
| `video_progress` | 視聴進捗 | user_id, video_id, is_completed, completed_at |
| `chats` | チャット履歴 | id, user_id, message, sender_type, created_at |

### 運用上の注意（重要）

- 列の順番・シート名をSpreadsheetsのGUI上で変更しないこと
- データの追加・編集はSheets上で直接行ってよいが、列の挿入・削除・並び替えはNG
- スプレッドシートへのアクセス権はサービスアカウントのみに絞る（一般公開しない）

---

## 4. 認証設計

### 4-1. NextAuth.js（Auth.js v5）の採用

- セッション管理：JWT方式
- Email Provider：6桁OTPをメールで送信
- メール送信：Resend（無料枠：月3,000通）
- Google OAuth：任意で追加可能（NextAuth.js Google Providerで対応）

### 4-2. 認証フロー（移行後）

```
[未ログイン] → /login
  ├─ メールアドレス入力 → Resend経由で6桁OTP送信
  └─ OTPコード入力 → NextAuth.jsがセッション発行
           ↓
[/auth/callback 相当の処理をNextAuth.js内で実施]
  ├─ profilesシートにレコードなし → /onboarding
  ├─ is_approved = false → /approval-pending
  └─ is_approved = true  → /dashboard
```

### 4-3. ミドルウェア

`middleware.ts`はNextAuth.jsのセッション確認に書き換える。ロジック（承認チェック・リダイレクト）は現行と同様。

---

## 5. アクセス制御設計

Supabase RLSの廃止に伴い、すべてのアクセス制御をNext.jsサーバーサイドで実装する。

### 原則

- フロントエンドからGoogle Sheets APIを直接叩かない
- すべてのデータ操作は`/api/...` Route Handler経由
- Route Handler内でNextAuth.jsのセッションを検証し、未認証・未承認の場合は401/403を返す

### チェック項目

| チェック内容 | 実装箇所 |
|------------|---------|
| ログイン済みか | 全Route Handler（NextAuth.js `getServerSession`） |
| 承認済みか（is_approved） | コンテンツ系Route Handler |
| 管理者か（is_admin） | 管理系操作のRoute Handler |
| 自分のデータのみ返す | video_progress / quiz_results / chats の取得API |

---

## 6. チャット機能の変更

Supabase Realtimeを廃止し、ポーリング方式に変更する。

- クライアントが`/api/chat/messages`を**5秒おき**にGETでポーリング
- 新着メッセージがあれば差分を表示
- 送信は従来通りPOSTで即時書き込み
- 20人規模ではAPIレートリミット（300req/分）への影響なし

---

## 7. 削除・不要になるもの

以下はすべて削除してよい。

- `@supabase/supabase-js`
- `@supabase/ssr`
- `supabase/migrations/` ディレクトリ（001〜008すべて）
- `src/lib/supabase.ts`（Supabaseクライアント）
- Supabase関連の環境変数（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`）

---

## 8. 追加・変更が必要な環境変数

| 変数名 | 説明 |
|--------|------|
| `NEXTAUTH_SECRET` | NextAuth.jsのJWT署名シークレット（ランダム文字列） |
| `NEXTAUTH_URL` | サイトの公開URL（例: https://your-domain.vercel.app） |
| `RESEND_API_KEY` | Resendのメール送信APIキー |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | 対象スプレッドシートのID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | サービスアカウントのメールアドレス |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | サービスアカウントの秘密鍵 |
| `GOOGLE_CLIENT_ID` | Google OAuth用（OAuth使う場合のみ） |
| `GOOGLE_CLIENT_SECRET` | Google OAuth用（OAuth使う場合のみ） |
| `NEXT_PUBLIC_SITE_URL` | 変更なし |

---

## 9. 実装フェーズ

### フェーズ1：認証の置き換え

1. NextAuth.js（Auth.js v5）インストール
2. Resendアカウント作成・APIキー取得
3. `src/app/api/auth/[...nextauth]/route.ts` 作成
4. `src/lib/auth.ts`（NextAuth.js設定）作成
5. `middleware.ts` をNextAuth.jsベースに書き換え
6. `/login` ページをNextAuth.js対応に書き換え
7. `/auth/callback` をNextAuth.jsのコールバックに置き換え

### フェーズ2：データアクセス層の置き換え

1. Google Cloudでサービスアカウント作成・Sheets API有効化
2. スプレッドシート作成・サービスアカウントに編集権限付与
3. `src/lib/sheets.ts`（Sheets APIクライアント）作成
4. `src/lib/api.ts` をSheets API呼び出しに全面書き換え
5. `/api/...` Route Handlerを新しいapi.tsに対応させる

### フェーズ3：各ページ・コンポーネントの修正

1. Supabaseクライアントへの直接参照をすべて除去
2. チャットページのRealtimeロジックをポーリングに書き換え
3. 動作確認（認証フロー・動画視聴・クイズ・チャット・タグフィルタ）

### フェーズ4：クリーンアップ

1. Supabase関連パッケージ削除
2. 不要な環境変数削除
3. `supabase/` ディレクトリ削除

---

## 10. 注意事項・リスク

| リスク | 対策 |
|-------|------|
| Sheets列構造の手動変更による破損 | 運用ルールとして周知・Sheets側は読み取り専用ビューを使う |
| 同時書き込み競合（video_progress等） | 20人規模では現実的に発生しにくい。将来的に問題が出たらVercel KV等を追加検討 |
| サービスアカウント秘密鍵の漏洩 | Vercel環境変数に設定し、.envファイルをgitignoreに含める |
| NextAuth.jsのセッション管理 | JWTシークレットを十分なランダム文字列にする（openssl rand -base64 32 推奨） |

---

## 11. 変更しないもの

以下は今回の移行で一切変更不要。

- ページ構成・URL設計（`/dashboard`、`/courses/[id]` 等）
- UIコンポーネント（`src/components/`）
- Loom動画プレーヤー・oEmbed API連携（`/api/loom/thumbnail`）
- タグフィルタのUI・ロジック
- クイズのUI・ロジック
- オンボーディングのウィザードUI
- Vercelデプロイ構成
- ホワイトラベル設定（ロゴ・カラー）
