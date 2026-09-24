import { pool } from '../../config/db.js';

export async function listVariantsForProduct(productId) {
  const [rows] = await pool.query(
    'SELECT * FROM product_variants WHERE product_id = ? ORDER BY size ASC, color ASC',
    [productId],
  );
  return rows;
}

export async function findVariantById(id) {
  const [rows] = await pool.query('SELECT * FROM product_variants WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

/** Locks the variant row for update — must be called with a transaction connection. */
export async function findVariantByIdForUpdate(connection, id) {
  const [rows] = await connection.query('SELECT * FROM product_variants WHERE id = ? FOR UPDATE', [id]);
  return rows[0] || null;
}

export async function createVariant({ productId, size, color, sku, priceOverride, stockQuantity, lowStockThreshold }) {
  const [result] = await pool.query(
    `INSERT INTO product_variants (product_id, size, color, sku, price_override, stock_quantity, low_stock_threshold)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [productId, size, color, sku, priceOverride || null, stockQuantity ?? 0, lowStockThreshold ?? 5],
  );
  return result.insertId;
}

export async function updateVariant(id, { size, color, sku, priceOverride, stockQuantity, lowStockThreshold }) {
  await pool.query(
    `UPDATE product_variants SET
       size = ?, color = ?, sku = ?, price_override = ?, stock_quantity = ?, low_stock_threshold = ?
     WHERE id = ?`,
    [size, color, sku, priceOverride || null, stockQuantity ?? 0, lowStockThreshold ?? 5, id],
  );
}

export async function deleteVariant(id) {
  await pool.query('DELETE FROM product_variants WHERE id = ?', [id]);
}

export async function decrementStock(connection, variantId, quantity) {
  await connection.query(
    'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?',
    [quantity, variantId],
  );
}

export async function incrementStock(connection, variantId, quantity) {
  await connection.query(
    'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?',
    [quantity, variantId],
  );
}

export async function findVariantWithProduct(id) {
  const [rows] = await pool.query(
    `SELECT pv.*, p.name AS product_name, p.slug AS product_slug
     FROM product_variants pv JOIN products p ON p.id = pv.product_id
     WHERE pv.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

export async function listLowStockVariants(threshold = null) {
  const [rows] = await pool.query(
    `SELECT pv.*, p.name AS product_name, p.slug AS product_slug
     FROM product_variants pv JOIN products p ON p.id = pv.product_id
     WHERE pv.stock_quantity <= ${threshold != null ? '?' : 'pv.low_stock_threshold'}
     ORDER BY pv.stock_quantity ASC`,
    threshold != null ? [threshold] : [],
  );
  return rows;
}
