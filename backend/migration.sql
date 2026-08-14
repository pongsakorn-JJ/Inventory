-- Adds storage location and stock quantity tracking to products.
ALTER TABLE products ADD COLUMN location VARCHAR(255) NULL AFTER category;
ALTER TABLE products ADD COLUMN stock_quantity INT NOT NULL DEFAULT 0 AFTER location;

-- Widens users.role from the original ENUM('admin','user') so 'customer' accounts fit.
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'customer';
