-- razorpay_order_id's UNIQUE index already permits multiple NULLs in MySQL, so
-- making it nullable is enough to allow manual (non-Razorpay) payment rows.
ALTER TABLE payments
  ADD COLUMN payment_method ENUM('razorpay','manual') NOT NULL DEFAULT 'razorpay' AFTER order_id,
  MODIFY COLUMN razorpay_order_id VARCHAR(64) NULL;
