-- Match the real order queue lifecycle: pending_payment -> pending -> processing -> printing -> done,
-- with rejected/print_failed/cancelled as terminal exceptions.
ALTER TABLE orders
  MODIFY COLUMN status ENUM(
    'awaiting_payment','paid','approved','printing','completed','cancelled','failed',
    'pending_payment','pending','processing','print_failed','rejected','done'
  ) NOT NULL DEFAULT 'pending_payment';

UPDATE orders SET status = 'pending_payment' WHERE status = 'awaiting_payment';
UPDATE orders SET status = 'pending' WHERE status = 'paid';
UPDATE orders SET status = 'processing' WHERE status = 'approved';
UPDATE orders SET status = 'done' WHERE status = 'completed';
UPDATE orders SET status = 'print_failed' WHERE status = 'failed';

ALTER TABLE orders
  MODIFY COLUMN status ENUM(
    'pending_payment','pending','processing','printing','print_failed','rejected','done','cancelled'
  ) NOT NULL DEFAULT 'pending_payment';

ALTER TABLE orders
  ADD COLUMN credit_consumed TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
  ADD COLUMN origin ENUM('web','whatsapp') NOT NULL DEFAULT 'web' AFTER credit_consumed;
