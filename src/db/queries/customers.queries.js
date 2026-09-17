import { pool } from '../../config/db.js';

export async function findCustomerByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM customers WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
}

export async function findCustomerById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, email_verified_at, is_blocked, created_at FROM customers WHERE id = ? LIMIT 1',
    [id],
  );
  return rows[0] || null;
}

export async function createCustomer({ name, email, phone, passwordHash }) {
  const [result] = await pool.query(
    'INSERT INTO customers (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
    [name, email, phone, passwordHash],
  );
  return result.insertId;
}

export async function updateCustomerProfile(id, { name, phone }) {
  await pool.query('UPDATE customers SET name = ?, phone = ? WHERE id = ?', [name, phone, id]);
}

export async function updateCustomerPassword(id, passwordHash) {
  await pool.query('UPDATE customers SET password_hash = ? WHERE id = ?', [passwordHash, id]);
}

export async function markCustomerEmailVerified(id) {
  await pool.query('UPDATE customers SET email_verified_at = NOW() WHERE id = ?', [id]);
}

export async function listCustomersAdmin({ search, limit, offset }) {
  const conditions = [];
  const params = [];
  if (search) {
    conditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.email, c.phone, c.email_verified_at, c.is_blocked, c.created_at,
       (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS order_count,
       (SELECT COALESCE(SUM(total), 0) FROM orders o WHERE o.customer_id = c.id AND o.status != 'cancelled') AS lifetime_value
     FROM customers c
     ${whereClause}
     ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM customers c ${whereClause}`, params);
  return { rows, total: countRows[0].total };
}

export async function setCustomerBlocked(id, isBlocked) {
  await pool.query('UPDATE customers SET is_blocked = ? WHERE id = ?', [isBlocked ? 1 : 0, id]);
}
