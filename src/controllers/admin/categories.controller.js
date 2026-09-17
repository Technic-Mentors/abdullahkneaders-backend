import { asyncHandler } from '../../utils/asyncHandler.js';
import * as categoryService from '../../services/category.service.js';
import { publicPathFor, renameUploadedFile } from '../../config/upload.js';
import { AppError } from '../../utils/AppError.js';

export const list = asyncHandler(async (req, res) => {
  const categories = await categoryService.listAdminCategories();
  res.json({ success: true, data: categories });
});

export const getOne = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategory(Number(req.params.id));
  res.json({ success: true, data: category });
});

export const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json({ success: true, data: category, message: 'Category created.' });
});

export const update = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(Number(req.params.id), req.body);
  res.json({ success: true, data: category, message: 'Category updated.' });
});

export const remove = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(Number(req.params.id));
  res.json({ success: true, message: 'Category deleted.' });
});

export const uploadBanner = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No image file was uploaded.', 400);
  const categoryId = Number(req.params.id);
  const filename = renameUploadedFile('categories', req.file);
  const imagePath = publicPathFor('categories', filename);
  const category = await categoryService.setCategoryBanner(categoryId, imagePath);
  res.json({ success: true, data: category, message: 'Banner uploaded.' });
});
