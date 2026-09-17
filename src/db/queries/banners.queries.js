import { pool } from '../../config/db.js';

export async function listActiveBanners(placement) {
  const [rows] = await pool.query(
    `SELECT * FROM banners
     WHERE placement = ? AND is_active = 1
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (ends_at IS NULL OR ends_at >= NOW())
     ORDER BY sort_order ASC`,
    [placement],
  );
  return rows;
}

export async function listAllBanners({ limit, offset } = {}) {
  if (limit == null) {
    const [rows] = await pool.query('SELECT * FROM banners ORDER BY placement ASC, sort_order ASC');
    return { rows, total: rows.length };
  }
  const [rows] = await pool.query(
    'SELECT * FROM banners ORDER BY placement ASC, sort_order ASC LIMIT ? OFFSET ?',
    [limit, offset],
  );
  const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM banners');
  return { rows, total: countRows[0].total };
}

export async function findBannerById(id) {
  const [rows] = await pool.query('SELECT * FROM banners WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function createBanner(data) {
  const [result] = await pool.query(
    `INSERT INTO banners (title, image_path, link_url, placement, sort_order, is_active, starts_at, ends_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title || '',
      data.imagePath,
      data.linkUrl || null,
      data.placement || 'hero',
      data.sortOrder ?? 0,
      data.isActive ?? true ? 1 : 0,
      data.startsAt || null,
      data.endsAt || null,
    ],
  );
  return result.insertId;
}

export async function updateBanner(id, data) {
  await pool.query(
    `UPDATE banners SET
       title = ?, link_url = ?, placement = ?, sort_order = ?, is_active = ?, starts_at = ?, ends_at = ?
     WHERE id = ?`,
    [
      data.title || '',
      data.linkUrl || null,
      data.placement || 'hero',
      data.sortOrder ?? 0,
      data.isActive ? 1 : 0,
      data.startsAt || null,
      data.endsAt || null,
      id,
    ],
  );
}

export async function deleteBanner(id) {
  await pool.query('DELETE FROM banners WHERE id = ?', [id]);
}
