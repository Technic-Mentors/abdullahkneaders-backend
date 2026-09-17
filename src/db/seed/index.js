import bcrypt from 'bcrypt';
import { pool } from '../../config/db.js';
import { BRAND_NAME } from '../../config/brand.js';

async function seedAdmin() {
  const email = 'admin@mauniversal.com';
  const [existing] = await pool.query('SELECT id FROM admins WHERE email = ?', [email]);
  if (existing.length > 0) {
    console.log('Admin already exists, skipping.');
    return;
  }

  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
  await pool.query('INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)', [
    'Store Admin',
    email,
    passwordHash,
  ]);
  console.log(`Admin created: ${email} / ChangeMe123! (change this after first login)`);
}

async function seedCategories() {
  const categories = [
    { name: 'Championship Belts', slug: 'championship-belts', sortOrder: 1 },
    { name: 'Weight Lifting Belts', slug: 'weight-lifting-belts', sortOrder: 2 },
    { name: 'Equestrian Gear', slug: 'equestrian-gear', sortOrder: 3 },
    { name: 'Buckles & Swivels', slug: 'buckles-swivels', sortOrder: 4 },
  ];

  for (const category of categories) {
    const [existing] = await pool.query('SELECT id FROM categories WHERE slug = ?', [category.slug]);
    if (existing.length > 0) continue;
    await pool.query(
      'INSERT INTO categories (parent_id, name, slug, sort_order, is_active) VALUES (NULL, ?, ?, ?, 1)',
      [category.name, category.slug, category.sortOrder],
    );
    console.log(`Category created: ${category.name}`);
  }
}

async function seedSampleProducts() {
  const [categories] = await pool.query('SELECT id, slug FROM categories WHERE parent_id IS NULL');
  const categoryIdBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  const products = [
    {
      categorySlug: 'championship-belts',
      name: 'Elite Championship Belt',
      slug: 'elite-championship-belt',
      description: 'A premium leather championship belt with a die-struck center plate, built for title bouts and display.',
      fabric: 'Genuine Leather',
      basePrice: 150,
      compareAtPrice: 170,
      isFeatured: 1,
      variants: [
        { size: '32in', color: 'Black', sku: 'CHB-32-BLK', stockQuantity: 8 },
        { size: '34in', color: 'Black', sku: 'CHB-34-BLK', stockQuantity: 10 },
        { size: '36in', color: 'Brown', sku: 'CHB-36-BRN', stockQuantity: 6 },
      ],
    },
    {
      categorySlug: 'weight-lifting-belts',
      name: 'Powerlifting Training Belt',
      slug: 'powerlifting-training-belt',
      description: 'A rigid, single-prong leather belt for squat/deadlift bracing, built to keep its shape under load.',
      fabric: 'Suede Leather',
      basePrice: 65,
      compareAtPrice: null,
      isFeatured: 1,
      variants: [
        { size: 'S', color: 'Black', sku: 'WLB-S-BLK', stockQuantity: 15 },
        { size: 'M', color: 'Black', sku: 'WLB-M-BLK', stockQuantity: 22 },
        { size: 'L', color: 'Black', sku: 'WLB-L-BLK', stockQuantity: 18 },
      ],
    },
    {
      categorySlug: 'equestrian-gear',
      name: 'All-Purpose Saddle Pad',
      slug: 'all-purpose-saddle-pad',
      description: 'A cushioned, breathable saddle pad for everyday riding and schooling sessions.',
      fabric: 'Cotton/Fleece',
      basePrice: 55,
      compareAtPrice: null,
      isFeatured: 1,
      variants: [
        { size: 'Standard', color: 'Navy', sku: 'EQG-STD-NVY', stockQuantity: 14 },
        { size: 'Standard', color: 'Black', sku: 'EQG-STD-BLK', stockQuantity: 11 },
      ],
    },
    {
      categorySlug: 'buckles-swivels',
      name: 'Solid Brass Belt Buckle',
      slug: 'solid-brass-belt-buckle',
      description: 'A heavyweight solid brass buckle, interchangeable with any standard belt strap.',
      fabric: 'Solid Brass',
      basePrice: 25,
      compareAtPrice: null,
      isFeatured: 0,
      variants: [
        { size: 'One Size', color: 'Gold', sku: 'BKL-OS-GLD', stockQuantity: 25 },
        { size: 'One Size', color: 'Nickel', sku: 'BKL-OS-NKL', stockQuantity: 20 },
      ],
    },
  ];

  for (const product of products) {
    const categoryId = categoryIdBySlug[product.categorySlug];
    if (!categoryId) continue;

    const [existing] = await pool.query('SELECT id FROM products WHERE slug = ?', [product.slug]);
    if (existing.length > 0) continue;

    const [result] = await pool.query(
      `INSERT INTO products (category_id, name, slug, description, fabric, base_price, compare_at_price, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [categoryId, product.name, product.slug, product.description, product.fabric, product.basePrice, product.compareAtPrice, product.isFeatured],
    );
    const productId = result.insertId;

    for (const variant of product.variants) {
      await pool.query(
        `INSERT INTO product_variants (product_id, size, color, sku, stock_quantity) VALUES (?, ?, ?, ?, ?)`,
        [productId, variant.size, variant.color, variant.sku, variant.stockQuantity],
      );
    }
    console.log(`Product created: ${product.name}`);
  }
}

async function seedSettings() {
  const defaults = {
    store_name: BRAND_NAME,
    // TODO: replace with MA Universal's real contact info once available.
    store_email: 'info@mauniversal.com',
    store_phone: '+00 000 0000000',
    store_address: 'Address TBD',
    default_shipping_rate: '8',
    free_shipping_threshold: '75',
    return_window_days: '7',
    return_policy_text: 'Items can be returned within 7 days of delivery if unused and in original packaging. Contact us to arrange a return.',
  };

  for (const [key, value] of Object.entries(defaults)) {
    await pool.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_key = setting_key',
      [key, value],
    );
  }
  console.log('Default settings ensured.');
}

async function run() {
  try {
    await seedAdmin();
    await seedCategories();
    await seedSampleProducts();
    await seedSettings();
    console.log('Seed complete.');
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
