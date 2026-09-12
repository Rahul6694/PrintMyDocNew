-- Widen "sided" to distinguish auto vs manual duplex, then drop the old "double" value.
ALTER TABLE pricing_rules
  MODIFY COLUMN sided ENUM('single','double','back_to_back_auto','back_to_back_manual') NOT NULL DEFAULT 'single';
UPDATE pricing_rules SET sided = 'back_to_back_manual' WHERE sided = 'double';
ALTER TABLE pricing_rules
  MODIFY COLUMN sided ENUM('single','back_to_back_auto','back_to_back_manual') NOT NULL DEFAULT 'single';

ALTER TABLE orders
  MODIFY COLUMN sided ENUM('single','double','back_to_back_auto','back_to_back_manual') NOT NULL DEFAULT 'single';
UPDATE orders SET sided = 'back_to_back_manual' WHERE sided = 'double';
ALTER TABLE orders
  MODIFY COLUMN sided ENUM('single','back_to_back_auto','back_to_back_manual') NOT NULL DEFAULT 'single';

CREATE TABLE IF NOT EXISTS bulk_pricing_settings (
  shop_id BIGINT UNSIGNED PRIMARY KEY,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  threshold_amount DECIMAL(10,2) NOT NULL DEFAULT 100,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_bulk_pricing_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bulk_pricing_rates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shop_id BIGINT UNSIGNED NOT NULL,
  paper_size ENUM('A4','A3','Letter','Legal') NOT NULL DEFAULT 'A4',
  color_mode ENUM('bw','color') NOT NULL,
  sided ENUM('single','back_to_back_auto','back_to_back_manual') NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  discounted_price DECIMAL(10,2) NULL,
  CONSTRAINT fk_bulk_pricing_rates_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE KEY uq_bulk_rate (shop_id, paper_size, color_mode, sided)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS additional_copy_discount_settings (
  shop_id BIGINT UNSIGNED PRIMARY KEY,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_copy_discount_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS additional_copy_discount_rates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shop_id BIGINT UNSIGNED NOT NULL,
  paper_size ENUM('A4','A3','Letter','Legal') NOT NULL DEFAULT 'A4',
  color_mode ENUM('bw','color') NOT NULL,
  sided ENUM('single','back_to_back_auto','back_to_back_manual') NOT NULL,
  discounted_price DECIMAL(10,2) NULL,
  CONSTRAINT fk_copy_discount_rates_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE KEY uq_copy_discount_rate (shop_id, paper_size, color_mode, sided)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS special_pricing (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shop_id BIGINT UNSIGNED NOT NULL,
  kind ENUM('collage','merge') NOT NULL,
  color_mode ENUM('bw','color') NOT NULL,
  sided ENUM('single','back_to_back_auto','back_to_back_manual') NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  price_per_output_page DECIMAL(10,2) NULL,
  CONSTRAINT fk_special_pricing_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE KEY uq_special_pricing (shop_id, kind, color_mode, sided)
) ENGINE=InnoDB;
