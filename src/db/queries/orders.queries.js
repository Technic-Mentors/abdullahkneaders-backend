import { pool } from '../../config/db.js';

export async function insertOrderShell(connection, data) {
  const [result] = await connection.query(
    `INSERT INTO orders
       (order_number, customer_id, status, payment_method, subtotal, discount_amount, shipping_charge, total, coupon_id,
        shipping_full_name, shipping_phone, shipping_address_line1, shipping_address_line2, shipping_city)
     VALUES ('PENDING', ?, 'placed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.customerId,
      data.paymentMethod || 'cod',
      data.subtotal,
      data.discountAmount,
      data.shippingCharge,
      data.total,
      data.couponId || null,
      data.shippingFullName,
      data.shippingPhone,
      data.shippingAddressLine1,
      data.shippingAddressLine2 || null,
      data.shippingCity,
    ],
  );
  return result.insertId;
}

export async function setOrderNumber(connection, orderId, orderNumber) {
  await connection.query('UPDATE orders SET order_number = ? WHERE id = ?', [orderNumber, orderId]);
}

export async function findOrderById(id) {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function findOrderByIdForCustomer(id, customerId) {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ? AND customer_id = ? LIMIT 1', [
    id,
    customerId,
  ]);
  return rows[0] || null;
}

export async function findOrderByNumberAndPhone(orderNumber, phone) {
  const [rows] = await pool.query(
    'SELECT * FROM orders WHERE order_number = ? AND shipping_phone = ? LIMIT 1',
    [orderNumber, phone],
  );
  return rows[0] || null;
}

export async function listOrdersForCustomer(customerId) {
  const [rows] = await pool.query(
    'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
    [customerId],
  );
  return rows;
}

export async function listOrdersAdmin({ status, search, dateFrom, dateTo, limit, offset }) {
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('o.status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(o.order_number LIKE ? OR o.shipping_full_name LIKE ? OR o.shipping_phone LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (dateFrom) {
    conditions.push('o.created_at >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    // dateTo is a plain date (e.g. "2026-09-04"); make it inclusive of the whole day
    // rather than comparing against midnight, which would exclude same-day orders.
    conditions.push('o.created_at < DATE_ADD(?, INTERVAL 1 DAY)');
    params.push(dateTo);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT o.*, c.name AS customer_name, c.email AS customer_email
     FROM orders o JOIN customers c ON c.id = o.customer_id
     ${whereClause}
     ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM orders o ${whereClause}`,
    params,
  );

  return { rows, total: countRows[0].total };
}

export async function updateOrderStatus(connection, orderId, status) {
  await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
}

export async function markOrderCancelled(connection, orderId, { cancelledBy, reason }) {
  await connection.query(
    "UPDATE orders SET status = 'cancelled', cancelled_by = ?, cancelled_reason = ? WHERE id = ?",
    [cancelledBy, reason || null, orderId],
  );
}

export async function markPaymentCollected(orderId) {
  await pool.query("UPDATE orders SET payment_status = 'collected' WHERE id = ?", [orderId]);
}
