import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { publicPathFor, renameUploadedFile } from '../../config/upload.js';
import * as blogService from '../../services/blog.service.js';

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await blogService.listCategories();
  res.json({ success: true, data: categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await blogService.createCategory(req.body.name);
  res.status(201).json({ success: true, data: category, message: 'Category created.' });
});

export const list = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const { rows, meta } = await blogService.listAdminPosts({ page: Number(page), pageSize: Number(pageSize) });
  res.json({ success: true, data: rows, meta });
});

export const getOne = asyncHandler(async (req, res) => {
  const post = await blogService.getAdminPost(Number(req.params.id));
  res.json({ success: true, data: post });
});

export const create = asyncHandler(async (req, res) => {
  const post = await blogService.createPost(req.body);
  res.status(201).json({ success: true, data: post, message: 'Post created.' });
});

export const update = asyncHandler(async (req, res) => {
  const post = await blogService.updatePost(Number(req.params.id), req.body);
  res.json({ success: true, data: post, message: 'Post updated.' });
});

export const remove = asyncHandler(async (req, res) => {
  await blogService.deletePost(Number(req.params.id));
  res.json({ success: true, message: 'Post deleted.' });
});

export const uploadFeaturedImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No image file was uploaded.', 400);
  const postId = Number(req.params.id);
  const filename = renameUploadedFile('blog', req.file);
  const imagePath = publicPathFor('blog', filename);
  const post = await blogService.setFeaturedImage(postId, imagePath);
  res.json({ success: true, data: post, message: 'Featured image uploaded.' });
});
