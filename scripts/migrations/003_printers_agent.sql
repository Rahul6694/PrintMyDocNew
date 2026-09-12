CREATE TABLE IF NOT EXISTS print_agents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shop_id BIGINT UNSIGNED NOT NULL,
  agent_secret_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL DEFAULT 'Print Catalyst Agent',
  status ENUM('online','offline') NOT NULL DEFAULT 'offline',
  agent_version VARCHAR(20) NULL,
  last_ping_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_print_agents_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS printers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shop_id BIGINT UNSIGNED NOT NULL,
  agent_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  paper_tray VARCHAR(50) NOT NULL DEFAULT 'auto',
  status ENUM('online','offline') NOT NULL DEFAULT 'offline',
  last_seen_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_printers_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  CONSTRAINT fk_printers_agent FOREIGN KEY (agent_id) REFERENCES print_agents(id) ON DELETE CASCADE,
  UNIQUE KEY uq_printer_per_agent (agent_id, name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS print_jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  shop_id BIGINT UNSIGNED NOT NULL,
  printer_id BIGINT UNSIGNED NULL,
  status ENUM('queued','sent','printing','completed','failed') NOT NULL DEFAULT 'queued',
  error_message VARCHAR(500) NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_print_jobs_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_print_jobs_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  CONSTRAINT fk_print_jobs_printer FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE SET NULL,
  INDEX idx_print_jobs_shop_status (shop_id, status)
) ENGINE=InnoDB;
