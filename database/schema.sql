-- ============================================================
-- Felt & Form — MySQL 8.0+ Database Schema
-- ============================================================
-- Requires: MySQL 8.0 or higher
-- Default auth plugin: caching_sha2_password (MySQL 8 default)
-- Charset: utf8mb4 — supports Arabic, emoji, full Unicode
-- Collation: utf8mb4_0900_ai_ci — MySQL 8 default, accent-insensitive
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS felt_and_form
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE felt_and_form;

-- Create application user (MySQL 8 caching_sha2_password)
-- Run this block as root once:
--
--   CREATE USER 'felt_user'@'localhost'
--     IDENTIFIED WITH caching_sha2_password BY 'felt_password_123';
--   GRANT ALL PRIVILEGES ON felt_and_form.* TO 'felt_user'@'localhost';
--   FLUSH PRIVILEGES;
--

-- ── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  first_name    VARCHAR(50)       NOT NULL,
  last_name     VARCHAR(50)       NOT NULL,
  email         VARCHAR(150)      NOT NULL,
  password      VARCHAR(255)      NOT NULL,
  phone         VARCHAR(20)           NULL,
  role          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  profile_image VARCHAR(255)          NULL,
  is_blocked    TINYINT(1)        NOT NULL DEFAULT 0,
  addresses     JSON                  NULL,          -- MySQL 8 native JSON
  created_at    DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                          ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  -- MySQL 8 functional index on lower-cased email (case-insensitive lookup)
  INDEX idx_users_email_lower ((LOWER(email)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)  NOT NULL,
  slug        VARCHAR(120)  NOT NULL,
  image       VARCHAR(255)      NULL,
  description TEXT              NULL,
  created_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                     ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── PRODUCTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          INT UNSIGNED          NOT NULL AUTO_INCREMENT,
  name        VARCHAR(150)          NOT NULL,
  slug        VARCHAR(180)          NOT NULL,
  description TEXT                      NULL,
  price       DECIMAL(10,2)         NOT NULL,
  discount    DECIMAL(5,2)          NOT NULL DEFAULT 0.00,
  stock       INT                   NOT NULL DEFAULT 0,
  category_id INT UNSIGNED              NULL,
  material    VARCHAR(100)              NULL,
  brand       VARCHAR(100)              NULL DEFAULT 'Felt & Form',
  gender      ENUM('men','women','unisex') NOT NULL DEFAULT 'unisex',
  tags        JSON                      NULL,       -- MySQL 8 native JSON
  is_active   TINYINT(1)            NOT NULL DEFAULT 1,
  created_at  DATETIME(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                             ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  INDEX idx_products_category (category_id),
  INDEX idx_products_price    (price),
  -- MySQL 8 FULLTEXT index for fast full-text search on name + description
  FULLTEXT INDEX ft_products_search (name, description),

  -- MySQL 8 CHECK constraints (enforced, not advisory)
  CONSTRAINT chk_price     CHECK (price    >= 0),
  CONSTRAINT chk_discount  CHECK (discount BETWEEN 0 AND 100),
  CONSTRAINT chk_stock     CHECK (stock    >= 0),

  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── PRODUCT IMAGES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  image_url  VARCHAR(255) NOT NULL,
  is_primary TINYINT(1)   NOT NULL DEFAULT 0,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                   ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX idx_product_images_product (product_id),
  CONSTRAINT fk_product_images_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── SIZES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sizes (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(20)  NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sizes_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── COLORS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS colors (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name     VARCHAR(30)  NOT NULL,
  hex_code CHAR(7)          NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_colors_name (name),
  -- MySQL 8 CHECK: hex codes must start with # and be exactly 7 chars
  CONSTRAINT chk_hex_code CHECK (hex_code IS NULL OR (hex_code LIKE '#%' AND CHAR_LENGTH(hex_code) = 7))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── PRODUCT_SIZES (junction) ────────────────────────────────
CREATE TABLE IF NOT EXISTS product_sizes (
  product_id INT UNSIGNED NOT NULL,
  size_id    INT UNSIGNED NOT NULL,
  stock      INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, size_id),
  CONSTRAINT chk_size_stock CHECK (stock >= 0),
  CONSTRAINT fk_ps_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_size    FOREIGN KEY (size_id)    REFERENCES sizes    (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── PRODUCT_COLORS (junction) ───────────────────────────────
CREATE TABLE IF NOT EXISTS product_colors (
  product_id INT UNSIGNED NOT NULL,
  color_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (product_id, color_id),
  CONSTRAINT fk_pc_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_pc_color   FOREIGN KEY (color_id)   REFERENCES colors   (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── ORDERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  order_number        VARCHAR(20)   NOT NULL,
  user_id             INT UNSIGNED  NOT NULL,
  subtotal            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  coupon_code         VARCHAR(50)       NULL,
  tax                 DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping_cost       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount        DECIMAL(10,2) NOT NULL,
  status              ENUM('pending','processing','shipped','delivered','cancelled')
                                    NOT NULL DEFAULT 'pending',
  payment_method      ENUM('cash_on_delivery','credit_card','vodafone_cash','instapay')
                                    NOT NULL,
  payment_status      ENUM('pending','paid','failed','refunded')
                                    NOT NULL DEFAULT 'pending',
  shipping_full_name  VARCHAR(100)  NOT NULL,
  shipping_phone      VARCHAR(20)   NOT NULL,
  shipping_email      VARCHAR(150)  NOT NULL,
  shipping_country    VARCHAR(100)  NOT NULL,
  shipping_city       VARCHAR(100)  NOT NULL,
  shipping_address    VARCHAR(255)  NOT NULL,
  created_at          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                             ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_number (order_number),
  INDEX idx_orders_user   (user_id),
  INDEX idx_orders_status (status),
  CONSTRAINT chk_total CHECK (total_amount >= 0),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── ORDER ITEMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  order_id     INT UNSIGNED  NOT NULL,
  product_id   INT UNSIGNED  NOT NULL,
  product_name VARCHAR(150)  NOT NULL,
  size         VARCHAR(20)       NULL,
  color        VARCHAR(30)       NULL,
  quantity     INT           NOT NULL DEFAULT 1,
  price        DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_quantity CHECK (quantity > 0),
  CONSTRAINT chk_item_price CHECK (price >= 0),
  CONSTRAINT fk_oi_order   FOREIGN KEY (order_id)   REFERENCES orders   (id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── WISHLIST ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_wishlist (user_id, product_id),
  CONSTRAINT fk_wl_user    FOREIGN KEY (user_id)    REFERENCES users    (id) ON DELETE CASCADE,
  CONSTRAINT fk_wl_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── CART ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED NOT NULL,
  product_id      INT UNSIGNED NOT NULL,
  size            VARCHAR(20)      NULL,
  color           VARCHAR(30)      NULL,
  quantity        INT          NOT NULL DEFAULT 1,
  saved_for_later TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_item (user_id, product_id, size, color),
  CONSTRAINT chk_cart_qty CHECK (quantity > 0),
  CONSTRAINT fk_cart_user    FOREIGN KEY (user_id)    REFERENCES users    (id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── COUPONS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  code        VARCHAR(50)   NOT NULL,
  discount    DECIMAL(5,2)  NOT NULL,
  start_date  DATE          NOT NULL,
  expiry_date DATE          NOT NULL,
  usage_limit INT           NOT NULL DEFAULT 100,
  times_used  INT           NOT NULL DEFAULT 0,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_coupon_code (code),
  CONSTRAINT chk_coupon_discount CHECK (discount BETWEEN 0 AND 100),
  CONSTRAINT chk_coupon_dates    CHECK (expiry_date >= start_date),
  CONSTRAINT chk_coupon_limit    CHECK (usage_limit > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── REVIEWS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  rating     TINYINT      NOT NULL,
  comment    TEXT             NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_review (user_id, product_id),
  -- MySQL 8 enforced CHECK (not advisory like MySQL 5.7)
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_rev_user    FOREIGN KEY (user_id)    REFERENCES users    (id) ON DELETE CASCADE,
  CONSTRAINT fk_rev_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── NEWSLETTER ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(150) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_newsletter_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── Useful MySQL 8 views (optional, for reporting) ──────────
-- Final sale price view using MySQL 8 computed expression
CREATE OR REPLACE VIEW v_product_prices AS
SELECT
  p.id,
  p.name,
  p.price                                               AS original_price,
  p.discount,
  ROUND(p.price * (1 - p.discount / 100), 2)           AS final_price,
  c.name                                                AS category,
  p.gender,
  p.stock,
  p.is_active
FROM products p
LEFT JOIN categories c ON c.id = p.category_id;

-- Revenue summary view
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
  DATE_FORMAT(created_at, '%Y-%m')          AS month,
  COUNT(*)                                  AS order_count,
  SUM(total_amount)                         AS revenue
FROM orders
WHERE status != 'cancelled'
GROUP BY month
ORDER BY month DESC;

-- ── EMAIL VERIFICATION TOKENS ──────────────────────────────
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id         INT          NOT NULL AUTO_INCREMENT,
  user_id    INT          NOT NULL,
  token      VARCHAR(128) NOT NULL,
  expires_at DATETIME     NOT NULL,
  used_at    DATETIME         NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_ev_token (token),
  INDEX idx_ev_user (user_id),
  CONSTRAINT fk_ev_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── PASSWORD RESET TOKENS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INT          NOT NULL AUTO_INCREMENT,
  user_id    INT          NOT NULL,
  token      VARCHAR(128) NOT NULL,
  expires_at DATETIME     NOT NULL,
  used_at    DATETIME         NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pr_token (token),
  INDEX idx_pr_user (user_id),
  CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── NOTIFICATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         INT          NOT NULL AUTO_INCREMENT,
  user_id    INT          NOT NULL,
  title      VARCHAR(150) NOT NULL,
  message    TEXT         NOT NULL,
  type       ENUM(
    'order_confirmed','order_processing','order_shipped',
    'order_delivered','order_cancelled',
    'promo','coupon',
    'admin_new_order','admin_low_stock','admin_new_user','admin_contact'
  )                       NOT NULL DEFAULT 'promo',
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  meta       JSON             NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX idx_notif_user    (user_id),
  INDEX idx_notif_is_read (is_read),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── EMAIL LOGS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_logs (
  id            INT          NOT NULL AUTO_INCREMENT,
  user_id       INT              NULL,
  email_type    ENUM(
    'welcome','verify_email','password_reset',
    'order_confirmation','order_status_update',
    'admin_new_order','admin_low_stock','admin_new_user','admin_contact'
  )                         NOT NULL,
  recipient     VARCHAR(150) NOT NULL,
  subject       VARCHAR(255) NOT NULL,
  status        ENUM('sent','failed') NOT NULL DEFAULT 'sent',
  error_message TEXT             NULL,
  sent_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX idx_elog_user   (user_id),
  INDEX idx_elog_type   (email_type),
  INDEX idx_elog_status (status),
  CONSTRAINT fk_elog_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Also add is_email_verified column to users if running schema manually
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  is_email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER is_blocked;

-- ── RETURN REQUESTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS return_requests (
  id               INT          NOT NULL AUTO_INCREMENT,
  request_number   VARCHAR(25)  NOT NULL,
  order_id         INT          NOT NULL,
  user_id          INT          NOT NULL,
  type             ENUM('cancellation','return','exchange') NOT NULL,
  reason           ENUM(
    'changed_mind','found_better_price','duplicate_order','wrong_item_ordered','delivery_too_slow',
    'item_damaged','item_defective','wrong_item_received','wrong_size','wrong_color',
    'item_not_as_described','quality_not_acceptable','missing_parts','other'
  ) NOT NULL,
  description      TEXT             NULL,
  items            JSON         NOT NULL,
  images           JSON             NULL,
  status           ENUM('pending','reviewing','approved','rejected','refunded','exchanged','closed')
                                NOT NULL DEFAULT 'pending',
  admin_notes      TEXT             NULL,
  rejection_reason TEXT             NULL,
  refund_amount    DECIMAL(10,2)    NULL,
  refund_method    ENUM('original_payment','store_credit','bank_transfer') NULL,
  refund_reference VARCHAR(100)     NULL,
  reviewed_by      INT              NULL,
  reviewed_at      DATETIME         NULL,
  resolved_at      DATETIME         NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_rr_number (request_number),
  INDEX idx_rr_order  (order_id),
  INDEX idx_rr_user   (user_id),
  INDEX idx_rr_status (status),
  CONSTRAINT chk_rr_refund CHECK (refund_amount IS NULL OR refund_amount >= 0),
  CONSTRAINT fk_rr_order FOREIGN KEY (order_id)     REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_rr_user  FOREIGN KEY (user_id)      REFERENCES users  (id) ON DELETE CASCADE,
  CONSTRAINT fk_rr_admin FOREIGN KEY (reviewed_by)  REFERENCES users  (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Add minimum_order_amount to coupons if it doesn't exist
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS
  minimum_order_amount DECIMAL(10,2) NULL DEFAULT NULL
  COMMENT 'Minimum cart subtotal required before coupon applies'
  AFTER usage_limit;
