-- ============================================================
-- Felt & Form — Migration: personal coupon emails
-- ============================================================
-- Run once against your existing database. Fresh/dev databases can skip
-- this and just re-run `npm run seed` instead.
-- ============================================================

USE felt_and_form;

ALTER TABLE email_logs MODIFY COLUMN email_type
  ENUM(
    'welcome','verify_email','password_reset',
    'order_confirmation','order_status_update',
    'admin_new_order','admin_low_stock','admin_new_user','admin_contact',
    'personal_coupon'
  ) NOT NULL;
