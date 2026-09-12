-- ============================================================
-- Felt & Form — Migration: personal (per-customer) coupons
-- ============================================================
-- Run once against your existing database. Fresh/dev databases can skip
-- this and just re-run `npm run seed` instead.
-- ============================================================

USE felt_and_form;

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED NULL AFTER code;

SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_coupons_user'
);
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE coupons ADD CONSTRAINT fk_coupons_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
