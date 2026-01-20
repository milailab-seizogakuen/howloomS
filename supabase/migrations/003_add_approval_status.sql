-- =====================================================
-- Howl Learning Platform - Add Approval Status
-- =====================================================

-- profilesテーブルに is_approved カラムを追加
ALTER TABLE profiles ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT false;

-- 既存のユーザーを未承認のままにする（管理者が手動で承認）
-- 全員を承認済みにしたい場合は、以下のコマンドを実行:
-- UPDATE profiles SET is_approved = true;
