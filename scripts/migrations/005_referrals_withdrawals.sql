CREATE TABLE IF NOT EXISTS referral_wallets (
  shop_id BIGINT UNSIGNED PRIMARY KEY,
  locked DECIMAL(10,2) NOT NULL DEFAULT 0,
  available DECIMAL(10,2) NOT NULL DEFAULT 0,
  reserved DECIMAL(10,2) NOT NULL DEFAULT 0,
  withdrawn DECIMAL(10,2) NOT NULL DEFAULT 0,
  cancelled DECIMAL(10,2) NOT NULL DEFAULT 0,
  reversed DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_referral_wallets_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS referral_earnings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  referrer_shop_id BIGINT UNSIGNED NOT NULL,
  referred_shop_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending','available','paid','reversed') NOT NULL DEFAULT 'pending',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_referral_earnings_referrer FOREIGN KEY (referrer_shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  CONSTRAINT fk_referral_earnings_referred FOREIGN KEY (referred_shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Super admins manage the platform (shops, withdrawals, email templates) — separate auth realm from shops.
CREATE TABLE IF NOT EXISTS super_admins (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS withdrawals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shop_id BIGINT UNSIGNED NOT NULL,
  source ENUM('order_collection','referral') NOT NULL,
  gross_amount DECIMAL(10,2) NOT NULL,
  commission_pct DECIMAL(5,2) NOT NULL DEFAULT 2.5,
  commission_amount DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  payout_method ENUM('upi','bank') NOT NULL DEFAULT 'upi',
  payout_destination VARCHAR(255) NOT NULL,
  status ENUM('pending','approved','rejected','paid') NOT NULL DEFAULT 'pending',
  admin_note VARCHAR(500) NULL,
  processed_by BIGINT UNSIGNED NULL,
  requested_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  processed_at DATETIME(3) NULL,
  CONSTRAINT fk_withdrawals_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  CONSTRAINT fk_withdrawals_admin FOREIGN KEY (processed_by) REFERENCES super_admins(id) ON DELETE SET NULL,
  INDEX idx_withdrawals_status (status)
) ENGINE=InnoDB;
