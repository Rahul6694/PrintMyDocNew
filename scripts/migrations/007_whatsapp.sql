-- Official Meta WhatsApp Cloud API only. No unofficial session/QR pairing.
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  shop_id BIGINT UNSIGNED PRIMARY KEY,
  phone_number_id VARCHAR(64) NULL,
  waba_id VARCHAR(64) NULL,
  display_phone_number VARCHAR(20) NULL,
  access_token_encrypted TEXT NULL,
  status ENUM('disconnected','connected') NOT NULL DEFAULT 'disconnected',
  connected_at DATETIME(3) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_whatsapp_accounts_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shop_id BIGINT UNSIGNED NOT NULL,
  wa_message_id VARCHAR(128) NOT NULL,
  direction ENUM('inbound','outbound') NOT NULL,
  from_number VARCHAR(20) NULL,
  to_number VARCHAR(20) NULL,
  message_type VARCHAR(30) NOT NULL DEFAULT 'text',
  media_id VARCHAR(128) NULL,
  order_id BIGINT UNSIGNED NULL,
  raw_payload JSON NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_whatsapp_messages_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  CONSTRAINT fk_whatsapp_messages_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  UNIQUE KEY uq_whatsapp_message (wa_message_id)
) ENGINE=InnoDB;
