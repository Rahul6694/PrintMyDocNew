-- Track shop logins so the super admin panel can show who is actively using the app.
ALTER TABLE shops
  ADD COLUMN last_login_at DATETIME(3) NULL,
  ADD COLUMN login_count INT UNSIGNED NOT NULL DEFAULT 0;
