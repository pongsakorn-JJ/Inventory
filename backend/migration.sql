-- Adds storage location and stock quantity tracking to products.
ALTER TABLE products ADD COLUMN location VARCHAR(255) NULL AFTER category;
ALTER TABLE products ADD COLUMN stock_quantity INT NOT NULL DEFAULT 0 AFTER location;

-- Widens users.role from the original ENUM('admin','user') so 'customer' accounts fit.
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'customer';

-- Adds product description, lifecycle status, and an updated_at timestamp.
ALTER TABLE products ADD COLUMN description TEXT NULL AFTER category;
ALTER TABLE products ADD COLUMN product_status VARCHAR(20) NOT NULL DEFAULT 'active' AFTER stock_quantity;
ALTER TABLE products ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Renames image/stock_quantity to match the image_url/total_stock naming convention.
-- NOTE: unlike the ADD COLUMN statements above, these two only succeed once — if
-- migrate.js is re-run after they've already applied, it will fail here with
-- "Unknown column 'image'"/"'stock_quantity'", which just means it's already done.
ALTER TABLE products CHANGE COLUMN image image_url TEXT NOT NULL;
ALTER TABLE products CHANGE COLUMN stock_quantity total_stock INT NOT NULL DEFAULT 0;
