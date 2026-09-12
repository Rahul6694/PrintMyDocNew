CREATE TABLE IF NOT EXISTS bot_settings (
  shop_id BIGINT UNSIGNED PRIMARY KEY,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  bot_display_name VARCHAR(150) NULL,
  auto_greeting_message VARCHAR(500) NOT NULL DEFAULT 'Welcome to {shop}. Upload your document here: {link} Link expires in 30 minutes.',
  document_received_message VARCHAR(500) NOT NULL DEFAULT 'We received {file}. Set your print options here: {link} Link expires in 30 minutes.',
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_bot_settings_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bot_qa_pairs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shop_id BIGINT UNSIGNED NOT NULL,
  question VARCHAR(255) NOT NULL,
  answer VARCHAR(500) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_bot_qa_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;
