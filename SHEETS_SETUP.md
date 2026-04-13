# Google Sheets セットアップガイド

## 概要

スプレッドシートは **2つ** に分けて管理します。

| | スプレッドシート | 目的 |
|---|---|---|
| **A** | ユーザー管理シート | 認証情報・プロフィール（機密情報） |
| **B** | 講座データシート | 講座・動画・クイズ・進捗・チャット |

---

## スプレッドシート A — ユーザー管理

### `profiles` シート（1枚のみ）

| 列名 | 型 | 説明 | 例 |
|------|-----|------|-----|
| `id` | UUID | プロフィールID（ユニーク） | `550e8400-e29b-41d4-a716-446655440000` |
| `email` | テキスト | メールアドレス（ユニーク・ログインキー） | `user@example.com` |
| `hashed_password` | テキスト | bcrypt ハッシュ済みパスワード | `$2a$10$...` |
| `name` | テキスト | 表示名 | `山田 太郎` |
| `avatar_url` | テキスト | アバター画像URL（任意） | `https://...` |
| `has_met` | 真偽値 | HOWL メンバーと対面済みか | `true` / `false` |
| `ai_tools` | JSON配列 | 使用AIツール | `["chatgpt","claude"]` |
| `motivation` | テキスト | 受講動機（任意） | `スキルアップのため` |
| `is_admin` | 真偽値 | 管理者権限 | `true` / `false` |
| `is_approved` | 真偽値 | 受講承認済みか | `true` / `false` |
| `created_at` | ISO日時 | 作成日時 | `2026-01-01T00:00:00.000Z` |
| `updated_at` | ISO日時 | 更新日時 | `2026-01-01T00:00:00.000Z` |

> **⚠️ セキュリティ注意**: このスプレッドシートはサービスアカウントのみがアクセス可能にしてください（一般公開しないこと）

#### パスワードハッシュの生成方法
```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('パスワード', 10))"
```

---

## スプレッドシート B — 講座データ

### `courses` シート

| 列名 | 型 | 説明 | 例 |
|------|-----|------|-----|
| `id` | UUID | 講座ID | `course-001` |
| `title` | テキスト | 講座タイトル | `ChatGPT 基礎講座` |
| `description` | テキスト | 講座説明（任意） | `プロンプト設計の基礎を学びます` |
| `date` | テキスト | 開催日（任意） | `2026-01-15` |
| `duration_minutes` | 数値 | 総時間（分・任意） | `90` |
| `sort_order` | 数値 | 表示順（昇順） | `1` |
| `created_at` | ISO日時 | 作成日時 | `2026-01-01T00:00:00.000Z` |
| `updated_at` | ISO日時 | 更新日時 | `2026-01-01T00:00:00.000Z` |

---

### `videos` シート

| 列名 | 型 | 説明 | 例 |
|------|-----|------|-----|
| `id` | UUID | 動画ID | `video-001` |
| `course_id` | UUID | 所属する講座ID | `course-001` |
| `title` | テキスト | 動画タイトル | `第1章: プロンプトの基本` |
| `video_url` | テキスト | Loom / YouTube URL | `https://www.loom.com/share/...` |
| `video_id` | テキスト | Loom動画ID（サムネ取得用） | `abc123def456` |
| `type` | テキスト | `main`（本講座）/ `supplementary`（補足） | `main` |
| `sort_order` | 数値 | 講座内の表示順 | `1` |
| `created_at` | ISO日時 | 作成日時 | `2026-01-01T00:00:00.000Z` |

---

### `tags` シート

| 列名 | 型 | 説明 | 例 |
|------|-----|------|-----|
| `id` | UUID | タグID | `tag-001` |
| `name` | テキスト | タグ名 | `ChatGPT` |
| `category` | テキスト | `type`（種別）/ `theme`（テーマ） | `theme` |
| `color_code` | テキスト | 16進カラーコード | `#8B7BB8` |
| `display_order` | 数値 | フィルタUI表示順 | `1` |

---

### `video_tags` シート（動画とタグの紐づけ）

| 列名 | 型 | 説明 | 例 |
|------|-----|------|-----|
| `video_id` | UUID | 動画ID | `video-001` |
| `tag_id` | UUID | タグID | `tag-001` |

---

### `quizzes` シート

| 列名 | 型 | 説明 | 例 |
|------|-----|------|-----|
| `id` | UUID | クイズID | `quiz-001` |
| `course_id` | UUID | 所属する講座ID | `course-001` |
| `video_id` | UUID | 関連動画ID（任意） | `video-001` |
| `title` | テキスト | クイズタイトル | `第1章 確認テスト` |
| `questions` | JSON | 問題データ（下記参照） | `[{"id":"q1","text":"..."}]` |
| `passing_score` | 数値 | 合格スコア（%） | `80` |
| `created_at` | ISO日時 | 作成日時 | `2026-01-01T00:00:00.000Z` |

#### `questions` JSON形式
```json
[
  {
    "id": "q1",
    "text": "プロンプトの目的は何ですか？",
    "type": "single",
    "options": ["指示を明確にする", "AIを遅くする", "データを削除する"],
    "correct_answers": [0],
    "explanation": "プロンプトはAIへの指示を明確にするためのものです"
  }
]
```
- `type`: `single`（単一選択）/ `multiple`（複数選択）
- `correct_answers`: 正解の選択肢インデックス（0始まり）の配列

---

### `quiz_results` シート（自動記録・手編集不要）

| 列名 | 型 | 説明 |
|------|-----|------|
| `id` | UUID | レコードID |
| `user_id` | UUID | ユーザーのプロフィールID |
| `quiz_id` | UUID | クイズID |
| `score` | 数値 | スコア（%） |
| `passed` | 真偽値 | 合格したか |
| `answers` | JSON | 回答データ |
| `completed_at` | ISO日時 | 回答日時 |

---

### `video_progress` シート（自動記録・手編集不要）

| 列名 | 型 | 説明 |
|------|-----|------|
| `user_id` | UUID | ユーザーのプロフィールID |
| `video_id` | UUID | 動画ID |
| `is_completed` | 真偽値 | 視聴完了か |
| `completed_at` | ISO日時 | 完了日時 |

---

### `chats` シート（自動記録・手編集不要 / 管理者返信は手動）

| 列名 | 型 | 説明 | 例 |
|------|-----|------|-----|
| `id` | UUID | メッセージID | |
| `user_id` | UUID | ユーザーのプロフィールID | |
| `message` | テキスト | メッセージ内容 | `質問があります` |
| `sender_type` | テキスト | `user` / `admin` | `user` |
| `created_at` | ISO日時 | 送信日時 | |

> **管理者からの返信**: `sender_type` を `admin`、`user_id` を返信先ユーザーのIDにして行を追加してください。

---

## 環境変数の設定（`.env.local`）

```bash
# スプレッドシートA: ユーザー管理
GOOGLE_SHEETS_USERS_SPREADSHEET_ID=1aBcDeFgHiJkLmNoPqRsTuVwXyZ...（URLの /d/ と /edit の間の文字列）

# スプレッドシートB: 講座データ
GOOGLE_SHEETS_COURSES_SPREADSHEET_ID=1ZyXwVuTsRqPoNmLkJiHgFeDcBa...

# サービスアカウント認証情報
GOOGLE_SERVICE_ACCOUNT_EMAIL=howl-sheets@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n"
```

---

## Google Cloud のセットアップ手順

1. **Google Cloud Console** で新しいプロジェクトを作成
2. **Google Sheets API** と **Google Drive API** を有効化
3. **サービスアカウント** を作成し、**JSON キー** をダウンロード
4. JSON キーから `client_email` と `private_key` を `.env.local` にコピー
5. **スプレッドシートAとB** をそれぞれ作成し、サービスアカウントのメールアドレスを **編集者** として共有
6. スプレッドシートのURLからIDをコピーして `.env.local` に設定

---

## 各シートの1行目（ヘッダー行）のコピペ用

### profiles シート（スプレッドシートA）
```
id	email	hashed_password	name	avatar_url	has_met	ai_tools	motivation	is_admin	is_approved	created_at	updated_at
```

### courses シート
```
id	title	description	date	duration_minutes	sort_order	created_at	updated_at
```

### videos シート
```
id	course_id	title	video_url	video_id	type	sort_order	created_at
```

### tags シート
```
id	name	category	color_code	display_order
```

### video_tags シート
```
video_id	tag_id
```

### quizzes シート
```
id	course_id	video_id	title	questions	passing_score	created_at
```

### quiz_results シート
```
id	user_id	quiz_id	score	passed	answers	completed_at
```

### video_progress シート
```
user_id	video_id	is_completed	completed_at
```

### chats シート
```
id	user_id	message	sender_type	created_at
```
