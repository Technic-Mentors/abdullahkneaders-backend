ALTER TABLE products
  ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER is_featured;
