-- ============================================================
-- Felt & Form — Migration: Rush Hour flash discounts
-- ============================================================
-- Run once against your existing database. Fresh/dev databases can skip
-- this and just re-run `npm run seed` instead (zones/products etc. get
-- recreated anyway; rush hours start empty either way — create one from
-- Admin > Rush Hour).
-- ============================================================

USE felt_and_form;

CREATE TABLE IF NOT EXISTS rush_hours (
  id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name              VARCHAR(100)  NOT NULL,
  discount_percent  DECIMAL(5,2)  NOT NULL,
  schedule_type     ENUM('recurring_daily','one_off') NOT NULL,
  start_time        TIME              NULL,
  end_time          TIME              NULL,
  start_at          DATETIME          NULL,
  end_at            DATETIME          NULL,
  is_active         TINYINT(1)    NOT NULL DEFAULT 0,
  created_at        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT chk_rush_hour_discount CHECK (discount_percent BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS rush_hour_products (
  rush_hour_id INT UNSIGNED NOT NULL,
  product_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (rush_hour_id, product_id),
  CONSTRAINT fk_rhp_rush_hour FOREIGN KEY (rush_hour_id) REFERENCES rush_hours (id) ON DELETE CASCADE,
  CONSTRAINT fk_rhp_product   FOREIGN KEY (product_id)   REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
