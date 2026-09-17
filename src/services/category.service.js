import { AppError } from '../utils/AppError.js';
import { slugify } from '../utils/slugify.js';
import { pool } from '../config/db.js';
import { deleteUploadedFile } from '../config/upload.js';
import * as categoriesDb from '../db/queries/categories.queries.js';

async function ensureUniqueSlug(name, excludeId = null) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;

  // Small tables (category counts are always low), so a loop-until-free check is fine here.
  while (true) {
    const [rows] = await pool.query(
      `SELECT id FROM categories WHERE slug = ? ${excludeId ? 'AND id != ?' : ''} LIMIT 1`,
      excludeId ? [candidate, excludeId] : [candidate],
    );
    if (rows.length === 0) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

export async function listPublicCategories() {
  return categoriesDb.listCategories({ activeOnly: true });
}

export async function listAdminCategories() {
  return categoriesDb.listCategories({ activeOnly: false });
}

export async function getCategory(id) {
  const category = await categoriesDb.findCategoryById(id);
  if (!category) throw new AppError('Category not found.', 404);
  return category;
}

export async function createCategory(data) {
  const slug = await ensureUniqueSlug(data.name);
  const id = await categoriesDb.createCategory({ ...data, slug });
  return categoriesDb.findCategoryById(id);
}

export async function updateCategory(id, data) {
  await getCategory(id);
  const slug = await ensureUniqueSlug(data.name, id);
  await categoriesDb.updateCategory(id, { ...data, slug });
  return categoriesDb.findCategoryById(id);
}

export async function setCategoryBanner(id, bannerImage) {
  const existing = await getCategory(id);
  await categoriesDb.updateCategoryBanner(id, bannerImage);
  deleteUploadedFile(existing.banner_image);
  return categoriesDb.findCategoryById(id);
}

export async function deleteCategory(id) {
  const category = await getCategory(id);

  const [productCount, subcategoryCount] = await Promise.all([
    categoriesDb.countProductsInCategory(id),
    categoriesDb.countSubcategories(id),
  ]);

  if (productCount > 0) {
    throw new AppError(`Cannot delete: ${productCount} product(s) are assigned to this category.`, 409);
  }
  if (subcategoryCount > 0) {
    throw new AppError(`Cannot delete: ${subcategoryCount} subcategory(ies) exist under this category.`, 409);
  }

  await categoriesDb.deleteCategory(id);
  deleteUploadedFile(category.banner_image);
}
