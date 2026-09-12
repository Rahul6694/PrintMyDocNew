-- Extend shop identity fields + per-shop service capabilities.
ALTER TABLE shops
  ADD COLUMN owner_name VARCHAR(150) NULL AFTER name,
  ADD COLUMN city VARCHAR(100) NULL AFTER address,
  ADD COLUMN state VARCHAR(100) NULL AFTER city,
  ADD COLUMN pincode VARCHAR(10) NULL AFTER state,
  ADD COLUMN gstin VARCHAR(20) NULL AFTER pincode,
  ADD COLUMN referral_code VARCHAR(20) NULL AFTER gstin,
  ADD COLUMN referred_by_shop_id BIGINT UNSIGNED NULL AFTER referral_code,
  ADD UNIQUE KEY uq_shops_referral_code (referral_code),
  ADD CONSTRAINT fk_shops_referred_by FOREIGN KEY (referred_by_shop_id) REFERENCES shops(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS shop_capabilities (
  shop_id BIGINT UNSIGNED PRIMARY KEY,
  capabilities JSON NOT NULL,
  advanced_services_enabled TINYINT(1) NOT NULL DEFAULT 0,
  physical_services_enabled TINYINT(1) NOT NULL DEFAULT 0,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_shop_capabilities_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shop_settings (
  shop_id BIGINT UNSIGNED PRIMARY KEY,
  push_notifications TINYINT(1) NOT NULL DEFAULT 1,
  whatsapp_ack TINYINT(1) NOT NULL DEFAULT 1,
  print_receipt TINYINT(1) NOT NULL DEFAULT 1,
  auto_print_mode ENUM('auto_all','after_payment','off') NOT NULL DEFAULT 'off',
  order_separator ENUM('none','bw_invoice','blank_page') NOT NULL DEFAULT 'none',
  accept_online_payments TINYINT(1) NOT NULL DEFAULT 0,
  use_own_razorpay TINYINT(1) NOT NULL DEFAULT 0,
  razorpay_key_id VARCHAR(100) NULL,
  razorpay_key_secret VARCHAR(255) NULL,
  allow_manual_payment TINYINT(1) NOT NULL DEFAULT 1,
  checkout_display_name VARCHAR(150) NULL,
  payment_logo_url VARCHAR(500) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  upi_id VARCHAR(100) NULL,
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 1,
  max_file_size_mb INT UNSIGNED NOT NULL DEFAULT 25,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_shop_settings_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customer_portal_settings (
  shop_id BIGINT UNSIGNED PRIMARY KEY,
  show_customer_details_page TINYINT(1) NOT NULL DEFAULT 1,
  require_name TINYINT(1) NOT NULL DEFAULT 1,
  require_mobile TINYINT(1) NOT NULL DEFAULT 1,
  allow_stapling TINYINT(1) NOT NULL DEFAULT 0,
  pages_per_sheet_enabled TINYINT(1) NOT NULL DEFAULT 0,
  service_toggles JSON NOT NULL,
  paper_format_visibility JSON NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_customer_portal_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;
