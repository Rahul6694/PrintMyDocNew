CREATE TABLE IF NOT EXISTS employees (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shop_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('staff','manager') NOT NULL DEFAULT 'staff',
  assigned_printer_id BIGINT UNSIGNED NULL,
  dedicated_qr_slug VARCHAR(150) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_employees_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  CONSTRAINT fk_employees_printer FOREIGN KEY (assigned_printer_id) REFERENCES printers(id) ON DELETE SET NULL,
  UNIQUE KEY uq_employee_email (shop_id, email),
  UNIQUE KEY uq_employee_qr_slug (dedicated_qr_slug)
) ENGINE=InnoDB;
