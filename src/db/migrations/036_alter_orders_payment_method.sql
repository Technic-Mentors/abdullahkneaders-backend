ALTER TABLE orders
  MODIFY COLUMN payment_method ENUM('cod','bank_transfer') NOT NULL DEFAULT 'cod';
