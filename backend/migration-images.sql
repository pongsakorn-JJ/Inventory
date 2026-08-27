-- Moves product images to GitHub-hosted files and adds store/badge metadata.
-- Safe to re-run: migrate.js skips ER_DUP_FIELDNAME (column already added)
-- and ER_BAD_FIELD_ERROR (column already renamed) instead of failing.
ALTER TABLE products CHANGE COLUMN image image_url TEXT NOT NULL;
ALTER TABLE products ADD COLUMN description TEXT NULL;
ALTER TABLE products ADD COLUMN badge_status VARCHAR(20) NOT NULL DEFAULT 'Available';
ALTER TABLE products ADD COLUMN location_count INT NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN location_text VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN product_status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE products ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
