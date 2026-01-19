Howl 北さん個人用実験版 - 要件定義書 v2
改訂履歴
バージョン日付変更内容v1-初版v22025-01-19users テーブル削除、RLS ポリシー明記、別リポジトリ構成、admin 判定方法追加、YouTube API 検証タスク追加、テスト形式拡張、進捗率計算式定義、工数見直し、エラーハンドリング追記

1. プロジェクト概要

プロジェクト名：Howl（北さん個人用実験版）
目的：月1回の講座 + NotebookLM 動画による学習プラットフォーム
対象ユーザー：北さんの学習コミュニティ（初期：10人）
期間：実験版（フィードバック取得フェーズ）


2. リポジトリ構成
別リポジトリ方式を採用
howl/           # ユーザー向けアプリ → Vercel にデプロイ
howl-admin/     # 管理画面 → ローカル専用、デプロイしない
2.1 howl（ユーザー向け）

デプロイ先：Vercel
公開範囲：招待ユーザー（10人）
機能：認証、学習、チャット

2.2 howl-admin（管理画面）

デプロイ：しない（ローカル npm run dev のみ）
アクセス：北さんのローカル環境のみ
機能：会員管理、講座管理、テスト管理、データ確認
Supabase 接続：service_role キーを使用（RLS バイパス）

2.3 セキュリティ上の注意
bash# howl-admin/.gitignore に必ず含める
.env.local
.env*.local
```

**`SUPABASE_SERVICE_ROLE_KEY` は絶対にリポジトリにコミットしない。**

---

## 3. 機能要件

### 3.1 認証機能

#### Google 認証
- **方式**：Supabase Auth の Google OAuth
- **フロー**
  1. ログイン画面で「Google でログイン」ボタンをクリック
  2. Google アカウント認証
  3. **初回ログイン時**：プロフィール作成フォームへ自動遷移
  4. 2回目以降：ダッシュボードへ

#### エラーハンドリング

| エラー | 表示・処理 |
|--------|------------|
| Google 認証キャンセル | 「ログインがキャンセルされました」→ ログイン画面に戻る |
| ネットワークエラー | 「接続エラーが発生しました。再度お試しください」→ リトライボタン表示 |
| Supabase 側エラー | 「サーバーエラーが発生しました」→ サポート連絡先表示 |

#### フォールバック（将来対応）
- メール + パスワード認証
- 実装は Phase 3 以降（Google 認証で問題が出た場合のみ）

---

### 3.2 初回ログイン時のプロフィール作成

#### フロー
```
Google 認証成功
  ↓
profiles テーブルにレコードが存在するか確認
  ↓
存在しない → プロフィール作成フォーム画面へ
存在する → ダッシュボードへ
```

#### 入力項目

| 項目 | 形式 | 必須 | 備考 |
|------|------|------|------|
| **名前** | テキスト入力 | ✅ | Google から取得した名前をプリフィル |
| **面識あるか** | ラジオボタン（はい/いいえ） | ✅ | コミュニティ内の関係性を把握 |
| **使っている AI** | チェックボックス複数選択 | ✅ | ChatGPT, Claude, Gemini, その他, 使ってない |
| **意気込み** | テキストエリア（自由記述） | ✅ | 200字以内 |

#### バリデーション

| 項目 | ルール | エラーメッセージ |
|------|--------|------------------|
| 名前 | 1〜50文字 | 「名前は1〜50文字で入力してください」 |
| 使っている AI | 1つ以上選択 | 「1つ以上選択してください」 |
| 意気込み | 1〜200文字 | 「意気込みは200文字以内で入力してください」 |

#### エラーハンドリング

| エラー | 処理 |
|--------|------|
| DB 保存失敗 | 「保存に失敗しました。再度お試しください」→ リトライ |
| セッション切れ | ログイン画面にリダイレクト |

---

### 3.3 ダッシュボード

#### 表示内容

**上部：ユーザー情報**
- ユーザー名
- プロフィール画像（Google アカウントのアバター）
- 全体進捗率

**メイン：学習進捗**
```
【講座1】「AI時代のXXX」
├ 月1講座：2024年1月 (1時間)
│  └ テスト完了 ✅
├ NotebookLM動画1「細かい使い方1」
│  └ 視聴完了 ✅
├ NotebookLM動画2「細かい使い方2」
│  └ 未視聴 ❌
└ 総合テスト
   └ 未実施 ❌

進捗率：50% ████░░░░
```

#### 進捗率計算式
```
講座進捗率 = (視聴完了動画数 / 全動画数) × 0.5
           + (合格テスト数 / 全テスト数) × 0.5
```

- **視聴完了**：`video_progress.is_completed = true`
- **テスト合格**：`quiz_results.passed = true`
- 小数点以下は切り捨て、0〜100% で表示

#### コンポーネント
- **カード型レイアウト**：各講座が 1 枚のカード
- **プログレスバー**：講座全体の進捗率を視覚化
- **ステータスアイコン**：✅ 完了、❌ 未完了、🔒 ロック中
- **クリック可能**：カードをクリックで講座詳細ページへ遷移

---

### 3.4 講座詳細ページ

#### 構成
```
【講座1：AI時代のXXX】
├ 月1講座（本講座）
│  ├ YouTube 埋め込み動画
│  ├ 動画タイトル・説明
│  ├ 視聴ステータス表示
│  └ 動画テストボタン
│
├ NotebookLM 動画シリーズ
│  ├ 動画1「細かい使い方1」
│  │  └ YouTube 埋め込み + 視聴ステータス
│  ├ 動画2「細かい使い方2」
│  │  └ YouTube 埋め込み + 視聴ステータス
│  └ ...
│
└ 総合テスト
   └ テストボタン（条件を満たすと有効化）
```

#### YouTube 動画埋め込み機能

**対応 URL 形式**
```
https://www.youtube.com/watch?v=xxxxx
https://youtu.be/xxxxx
https://www.youtube.com/embed/xxxxx
URL → 動画 ID 抽出ロジック
javascriptfunction extractVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
埋め込みコンポーネント
html<iframe
  src="https://www.youtube.com/embed/{videoId}"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
/>
視聴完了の判定

ユーザーが「視聴完了」ボタンを手動でクリック
クリック時に video_progress テーブルを更新


注意：YouTube iframe API による自動判定は Phase 2 以降で検討。初期実装は手動ボタン方式とする（実装リスク回避）。

テスト機能
テスト有効化条件

動画個別テスト：該当動画の視聴完了後
総合テスト：全動画の視聴完了後

テスト画面

問題表示（1問ずつまたは全問一括、設定可能）
選択肢ボタン（複数選択対応）
「回答を確定」ボタン

採点・結果表示

スコア表示：「8 / 10 問正解（80点）」
合否判定：合格スコア以上で「合格 🎉」、未満で「不合格」
解説表示：各問題の正解・不正解と解説文
不合格時：「再挑戦」ボタン表示


3.5 チャット機能
機能

形式：1 対 1 チャット（会員 ⇔ 北さん）
リアルタイム更新：Supabase Realtime
メッセージ履歴：スクロールで過去メッセージ表示
未読管理：簡易バッジ（Phase 2）

UI

LINE 風デザイン
ユーザーメッセージ：右寄せ、カラー背景
北さんメッセージ：左寄せ、グレー背景
タイムスタンプ：メッセージ下に小さく表示
入力フィールド + 送信ボタン

エラーハンドリング
エラー処理送信失敗メッセージ横に「!」マーク、タップで再送信Realtime 接続断「接続が切れました。再接続中...」表示、自動リトライ

3.6 プロフィール画面
表示内容

プロフィール画像（Google アバター）
名前
面識の有無
使っている AI
意気込み
登録日時

機能

各項目を編集可能（名前、面識、AI、意気込み）
「保存」ボタンで Supabase に反映
「ログアウト」ボタン


3.7 管理機能（howl-admin リポジトリ）
アクセス方法
bashcd howl-admin
npm run dev
# http://localhost:3000 でアクセス
管理者判定

profiles.is_admin = true のユーザーが管理者
初期セットアップで北さんのメールアドレスに対応するレコードを is_admin = true に設定

管理画面機能
1. 会員管理 (/members)

会員一覧表示（名前、メール、登録日、進捗率）
会員詳細表示（プロフィール、学習進捗、チャット履歴）
会員削除（確認ダイアログ付き）

2. 講座・動画管理 (/courses)

講座の新規作成・編集・削除
動画の追加・編集・削除・並び順変更
YouTube URL 入力 → 自動で動画 ID 抽出・プレビュー表示

3. テスト管理 (/quizzes)

テスト問題の作成・編集・削除
問題形式：単一選択 / 複数選択
正解・解説の設定
合格スコアの設定

4. データ確認 (/analytics)

会員別テスト結果一覧
講座別完了率
チャットログ閲覧


4. データベーススキーマ
4.1 profiles テーブル
sqlCREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  has_met BOOLEAN NOT NULL DEFAULT false,
  ai_tools JSONB NOT NULL DEFAULT '[]',
  motivation VARCHAR(200),
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
4.2 courses テーブル
sqlCREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  date DATE,
  duration_minutes INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
4.3 videos テーブル
sqlCREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(100) NOT NULL,
  youtube_url TEXT NOT NULL,
  video_id VARCHAR(20) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('main', 'supplementary')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
4.4 quizzes テーブル
sqlCREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  title VARCHAR(100) NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  passing_score INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
questions の JSON 形式
json[
  {
    "id": 1,
    "text": "次のうち正しいものを選んでください",
    "type": "single",
    "options": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
    "correct_answers": [0],
    "explanation": "Aが正解です。理由は..."
  },
  {
    "id": 2,
    "text": "次のうち正しいものをすべて選んでください",
    "type": "multiple",
    "options": ["選択肢A", "選択肢B", "選択肢C"],
    "correct_answers": [0, 2],
    "explanation": "AとCが正解です。"
  }
]
4.5 quiz_results テーブル
sqlCREATE TABLE quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
4.6 video_progress テーブル
sqlCREATE TABLE video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, video_id)
);
4.7 chats テーブル
sqlCREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

5. RLS ポリシー
5.1 profiles
sqlALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールのみ参照可能
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- 自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 自分のプロフィールのみ作成可能
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
5.2 courses
sqlALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが参照可能（認証済み）
CREATE POLICY "Authenticated users can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);
5.3 videos
sqlALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが参照可能（認証済み）
CREATE POLICY "Authenticated users can view videos"
  ON videos FOR SELECT
  TO authenticated
  USING (true);
5.4 quizzes
sqlALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが参照可能（認証済み）
CREATE POLICY "Authenticated users can view quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (true);
5.5 quiz_results
sqlALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- 自分の結果のみ参照可能
CREATE POLICY "Users can view own quiz results"
  ON quiz_results FOR SELECT
  USING (auth.uid() = user_id);

-- 自分の結果のみ作成可能
CREATE POLICY "Users can insert own quiz results"
  ON quiz_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);
5.6 video_progress
sqlALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;

-- 自分の進捗のみ参照可能
CREATE POLICY "Users can view own video progress"
  ON video_progress FOR SELECT
  USING (auth.uid() = user_id);

-- 自分の進捗のみ作成可能
CREATE POLICY "Users can insert own video progress"
  ON video_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分の進捗のみ更新可能
CREATE POLICY "Users can update own video progress"
  ON video_progress FOR UPDATE
  USING (auth.uid() = user_id);
5.7 chats
sqlALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- 自分が関与するチャットのみ参照可能
CREATE POLICY "Users can view own chats"
  ON chats FOR SELECT
  USING (auth.uid() = user_id);

-- 自分のチャットのみ作成可能（sender_type = 'user' のみ）
CREATE POLICY "Users can insert own chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = user_id AND sender_type = 'user');

6. 画面一覧
ユーザー向け（howl）
パス画面名概要/loginログイン画面Google ログインボタン/onboardingプロフィール作成画面初回ログイン時のみ/dashboardダッシュボード講座一覧、進捗表示/courses/[id]講座詳細ページ動画一覧、テストへのリンク/courses/[id]/quiz/[quizId]テスト画面問題回答、結果表示/chatチャット画面北さんとのメッセージ/profileプロフィール編集画面編集、ログアウト
管理用（howl-admin）
パス画面名概要/ダッシュボード簡易統計/members会員管理一覧、詳細、削除/courses講座・動画管理CRUD/quizzesテスト管理CRUD/analyticsデータ確認結果、ログ閲覧

7. 技術スタック
項目技術フロントエンドNext.js 14+ (App Router)スタイリングTailwind CSSバックエンド・DBSupabase (PostgreSQL)認証Supabase Auth (Google OAuth)リアルタイムSupabase Realtime動画YouTube 限定公開（iframe 埋め込み）ホスティングVercel（ユーザー向けのみ）管理画面ローカル実行のみ

8. 検証タスク（実装前に確認）
8.1 YouTube 限定公開動画の埋め込み確認
確認手順

YouTube で限定公開動画を作成
ローカル環境で iframe 埋め込みを実装
以下を確認：

埋め込みが正常に表示されるか
再生が可能か
エラーメッセージが出ないか



NG の場合の代替案

動画を「非公開」ではなく「限定公開」に設定し直す
埋め込み許可設定を確認（YouTube Studio → 動画 → 埋め込みを許可）

8.2 Supabase Realtime の動作確認
確認手順

chats テーブルに Realtime を有効化
2つのブラウザタブでチャット画面を開く
片方から送信、もう片方にリアルタイム表示されるか確認

NG の場合の代替案

ポーリング方式（5秒間隔で fetch）にフォールバック


9. 実装の優先度（Phase 分け）
Phase 1（MVP）

✅ Google 認証
✅ プロフィール作成・編集
✅ ダッシュボード
✅ 講座詳細ページ
✅ YouTube 動画埋め込み（手動完了ボタン）
✅ テスト機能（単一選択）

Phase 2（フィードバック後）

❓ チャット機能
❓ テスト機能拡張（複数選択）
❓ 管理画面（howl-admin）
❓ YouTube 視聴完了の自動判定

Phase 3（スケール時）

❓ メール + パスワード認証
❓ 未読バッジ
❓ 詳細分析ダッシュボード


10. デザイン基準
カラーパレット
用途カラープライマリ#10B981（緑）セカンダリ#6B7280（灰）アクセント#DC2626（赤）背景#F9FAFBテキスト#111827
フォント

日本語：Noto Sans JP
英数字：Inter

レスポンシブ対応

モバイルファースト
ブレークポイント：640px / 768px / 1024px


11. セキュリティ対策
認証・認可

Supabase Auth で JWT トークン管理
RLS で行レベルセキュリティ（全テーブル設定済み）
管理画面は別リポジトリ、ローカル実行のみ

API キー管理

SUPABASE_ANON_KEY：クライアント側で使用（公開可）
SUPABASE_SERVICE_ROLE_KEY：管理画面のみで使用（絶対非公開）

入力バリデーション

フロントエンド：zod でスキーマ検証
バックエンド：Supabase の CHECK 制約


12. 初期データ投入
管理者設定
sql-- 北さんのユーザーが作成された後に実行
UPDATE profiles
SET is_admin = true
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = '北さんのメールアドレス'
);
サンプル講座
sqlINSERT INTO courses (title, description, date, duration_minutes, sort_order)
VALUES ('AI時代のXXX入門', '第1回講座の説明文', '2025-02-01', 60, 1);

13. テスト計画
単体テスト

URL → 動画 ID 抽出ロジック
進捗率計算ロジック
テスト採点ロジック

統合テスト

認証 → プロフィール作成 → ダッシュボード表示
動画視聴完了 → テスト有効化 → 回答 → 結果保存
チャット送信 → Realtime 受信

手動テスト

スマホ（iOS Safari, Android Chrome）での表示確認
YouTube 限定公開動画の埋め込み確認
10人同時アクセス時の挙動確認


14. 今後の拡張検討事項

メール + パスワード認証
プロフィール画像アップロード
バッジ・称号システム
学習期間の分析ダッシュボード
管理画面の Vercel デプロイ（認証付き）