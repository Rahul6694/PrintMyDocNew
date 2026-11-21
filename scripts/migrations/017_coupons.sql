-- Admin-managed coupon codes that discount subscription plan payments
-- (at signup and on the Billing page).
CREATE TABLE IF NOT EXISTS coupons (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL,
  description VARCHAR(255) NULL,
  discount_type ENUM('percent','flat') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  -- NULL = applies to every plan; otherwise a JSON array of plan ids.
  applicable_plans JSON NULL,
  max_uses INT UNSIGNED NULL,
  used_count INT UNSIGNED NOT NULL DEFAULT 0,
  once_per_shop TINYINT(1) NOT NULL DEFAULT 1,
  starts_at DATETIME(3) NULL,
  expires_at DATETIME(3) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_coupons_code (code),
  CONSTRAINT fk_coupons_admin FOREIGN KEY (created_by) REFERENCES super_admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- A row is written as 'pending' when a payment is started with a coupon, and
-- flipped to 'redeemed' when the subscription activates. Only redeemed rows
-- count toward max_uses / once_per_shop.
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  coupon_id BIGINT UNSIGNED NOT NULL,
  razorpay_order_id VARCHAR(64) NOT NULL,
  shop_id BIGINT UNSIGNED NULL,
  email VARCHAR(190) NOT NULL,
  plan ENUM('basic','standard','premium') NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL,
  status ENUM('pending','redeemed') NOT NULL DEFAULT 'pending',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  redeemed_at DATETIME(3) NULL,
  UNIQUE KEY uq_coupon_redemptions_order (razorpay_order_id),
  INDEX idx_coupon_redemptions_coupon (coupon_id, status),
  CONSTRAINT fk_coupon_redemptions_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  CONSTRAINT fk_coupon_redemptions_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL
) ENGINE=InnoDB;
