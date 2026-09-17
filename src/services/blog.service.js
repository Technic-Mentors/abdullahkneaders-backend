import { AppError } from '../utils/AppError.js';
import { slugify } from '../utils/slugify.js';
import { pool } from '../config/db.js';
import { buildPaginationMeta } from '../utils/pagination.js';
import { deleteUploadedFile } from '../config/upload.js';
import * as blogDb from '../db/queries/blog.queries.js';

async function ensureUniqueSlug(title, excludeId = null) {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const [rows] = await pool.query(
      `SELECT id FROM blog_posts WHERE slug = ? ${excludeId ? 'AND id != ?' : ''} LIMIT 1`,
      excludeId ? [candidate, excludeId] : [candidate],
    );
    if (rows.length === 0) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

async function resolveTagIds(tagNames = []) {
  if (tagNames.length === 0) return [];
  const existing = await blogDb.findTagsByNames(tagNames);
  const existingNames = new Set(existing.map((tag) => tag.name));
  const ids = existing.map((tag) => tag.id);

  for (const name of tagNames) {
    if (!existingNames.has(name)) {
      const id = await blogDb.createTag(name, slugify(name));
      ids.push(id);
    }
  }
  return ids;
}

async function attachTags(post) {
  const tags = await blogDb.listTagsForPost(post.id);
  return { ...post, tags };
}

export async function listCategories() {
  return blogDb.listCategories();
}

export async function createCategory(name) {
  const id = await blogDb.createCategory(name, slugify(name));
  return { id, name };
}

export async function listPublishedPosts({ page, pageSize }) {
  const offset = (page - 1) * pageSize;
  const { rows, total } = await blogDb.listPublishedPosts({ limit: pageSize, offset });
  return { rows, meta: buildPaginationMeta({ page, pageSize, total }) };
}

export async function getPublishedPostBySlug(slug) {
  const post = await blogDb.findPublishedPostBySlug(slug);
  if (!post) throw new AppError('Post not found.', 404);
  return attachTags(post);
}

export async function listAdminPosts({ page, pageSize }) {
  const offset = (page - 1) * pageSize;
  const { rows, total } = await blogDb.listAdminPosts({ limit: pageSize, offset });
  return { rows, meta: buildPaginationMeta({ page, pageSize, total }) };
}

export async function getAdminPost(id) {
  const post = await blogDb.findPostById(id);
  if (!post) throw new AppError('Post not found.', 404);
  return attachTags(post);
}

export async function createPost({ tags, ...data }) {
  const slug = await ensureUniqueSlug(data.title);
  const id = await blogDb.createPost({ ...data, slug });
  const tagIds = await resolveTagIds(tags);
  if (tagIds.length) await blogDb.setPostTags(id, tagIds);
  return getAdminPost(id);
}

export async function updatePost(id, { tags, ...data }) {
  const existing = await blogDb.findPostById(id);
  if (!existing) throw new AppError('Post not found.', 404);

  const slug = await ensureUniqueSlug(data.title, id);
  await blogDb.updatePost(id, { ...data, slug }, existing.status === 'published');

  if (tags) {
    const tagIds = await resolveTagIds(tags);
    await blogDb.setPostTags(id, tagIds);
  }
  return getAdminPost(id);
}

export async function deletePost(id) {
  const existing = await blogDb.findPostById(id);
  if (!existing) throw new AppError('Post not found.', 404);
  await blogDb.deletePost(id);
  deleteUploadedFile(existing.featured_image);
}

export async function setFeaturedImage(id, imagePath) {
  const existing = await blogDb.findPostById(id);
  if (!existing) throw new AppError('Post not found.', 404);
  await blogDb.updateFeaturedImage(id, imagePath);
  deleteUploadedFile(existing.featured_image);
  return getAdminPost(id);
}
