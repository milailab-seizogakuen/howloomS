-- =====================================================
-- Howl Learning Platform - RLS Policies
-- =====================================================

-- =====================================================
-- 1. profiles RLS
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- 2. courses RLS
-- =====================================================
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが参照可能（認証済み）
CREATE POLICY "Authenticated users can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 3. videos RLS
-- =====================================================
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが参照可能（認証済み）
CREATE POLICY "Authenticated users can view videos"
  ON videos FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 4. quizzes RLS
-- =====================================================
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが参照可能（認証済み）
CREATE POLICY "Authenticated users can view quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 5. quiz_results RLS
-- =====================================================
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- 自分の結果のみ参照可能
CREATE POLICY "Users can view own quiz results"
  ON quiz_results FOR SELECT
  USING (auth.uid() = user_id);

-- 自分の結果のみ作成可能
CREATE POLICY "Users can insert own quiz results"
  ON quiz_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 6. video_progress RLS
-- =====================================================
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- 7. chats RLS
-- =====================================================
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- 自分が関与するチャットのみ参照可能
CREATE POLICY "Users can view own chats"
  ON chats FOR SELECT
  USING (auth.uid() = user_id);

-- 自分のチャットのみ作成可能（sender_type = 'user' のみ）
CREATE POLICY "Users can insert own chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = user_id AND sender_type = 'user');
