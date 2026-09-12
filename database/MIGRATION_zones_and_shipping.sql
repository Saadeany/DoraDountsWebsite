-- ============================================================
-- Felt & Form — Migration: Zones, extended shipping address,
-- transfer-pending payments, return notification type
-- ============================================================
-- Run this ONCE against your existing database before deploying the
-- updated backend. If you're on a fresh/dev database instead, it's
-- simpler to just re-run `npm run seed` (drops & recreates everything) —
-- skip this file in that case.
--
-- Safe to re-run: the CREATE TABLE / ADD COLUMN statements use
-- IF NOT EXISTS (MySQL 8.0.29+). The two ENUM MODIFY statements are
-- idempotent by nature (re-applying the same ENUM definition is a no-op).
-- ============================================================

USE felt_and_form;

-- ── ZONES (delivery areas) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS zones (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name           VARCHAR(100)  NOT NULL,
  shipping_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_deliverable TINYINT(1)    NOT NULL DEFAULT 1,
  sort_order     INT           NOT NULL DEFAULT 0,
  created_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_zones_name (name),
  CONSTRAINT chk_zone_price CHECK (shipping_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Seed a starter set of Cairo areas — edit freely from Admin > Zones after.
INSERT IGNORE INTO zones (name, shipping_price, is_deliverable, sort_order) VALUES
  ('Nasr City',      60.00, 1, 1),
  ('Masr El Gedida', 60.00, 1, 2),
  ('Zahraa El Maadi', 70.00, 1, 3),
  ('Maadi',          70.00, 1, 4),
  ('Downtown Cairo', 60.00, 1, 5),
  ('6th of October', 90.00, 1, 6),
  ('New Cairo',      80.00, 1, 7);

-- ── ORDERS — new zone/address columns ───────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zone_id INT UNSIGNED NULL AFTER shipping_address;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_area VARCHAR(100) NULL AFTER zone_id;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_building VARCHAR(50) NULL AFTER shipping_area;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_floor VARCHAR(20) NULL AFTER shipping_building;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_apartment VARCHAR(20) NULL AFTER shipping_floor;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_lat DECIMAL(10,7) NULL AFTER shipping_apartment;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_lng DECIMAL(10,7) NULL AFTER shipping_lat;

-- Add the FK only if it doesn't already exist (MySQL has no "ADD CONSTRAINT
-- IF NOT EXISTS", so this uses a small procedure guard).
SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_orders_zone'
);
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE orders ADD CONSTRAINT fk_orders_zone FOREIGN KEY (zone_id) REFERENCES zones (id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Payment method: drop "credit_card" (the store no longer accepts it).
-- ⚠️ If you have existing orders with payment_method = 'credit_card', either
-- leave 'credit_card' in this ENUM permanently, or update those rows first,
-- e.g.: UPDATE orders SET payment_method='cash_on_delivery' WHERE payment_method='credit_card';
ALTER TABLE orders MODIFY COLUMN payment_method
  ENUM('cash_on_delivery','vodafone_cash','instapay') NOT NULL;

-- Payment status: add "awaiting_transfer" for Vodafone Cash / InstaPay
-- orders on hold until an admin confirms the transfer.
ALTER TABLE orders MODIFY COLUMN payment_status
  ENUM('pending','awaiting_transfer','paid','failed','refunded')
  NOT NULL DEFAULT 'pending';

-- ── NOTIFICATIONS — dedicated type for return/cancellation alerts ─────────
-- Drives the red dot on the admin "Returns" sidebar tab, separate from
-- ordinary new-order alerts.
ALTER TABLE notifications MODIFY COLUMN type
  ENUM(
    'order_confirmed','order_processing','order_shipped',
    'order_delivered','order_cancelled',
    'promo','coupon',
    'admin_new_order','admin_low_stock','admin_new_user','admin_contact',
    'admin_new_return'
  ) NOT NULL DEFAULT 'promo';

-- Optional: re-point any old return/cancellation alerts (which were
-- previously logged as 'admin_new_order') to the new type so they show
-- up correctly if they're still unread. Safe no-op if there are none.
UPDATE notifications
SET type = 'admin_new_return'
WHERE type = 'admin_new_order'
  AND JSON_CONTAINS_PATH(meta, 'one', '$.return_request_id');
