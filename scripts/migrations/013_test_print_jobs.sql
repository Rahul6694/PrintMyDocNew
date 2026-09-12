-- Allow a print_job to exist without a real order, so "Test All Printers"
-- can send a real test page through the agent without needing a fake order.
ALTER TABLE print_jobs
  MODIFY COLUMN order_id BIGINT UNSIGNED NULL,
  ADD COLUMN is_test TINYINT(1) NOT NULL DEFAULT 0 AFTER printer_id;
