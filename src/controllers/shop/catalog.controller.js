import { asyncHandler } from '../../utils/asyncHandler.js';
import * as categoryService from '../../services/category.service.js';
import * as productService from '../../services/product.service.js';

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listPublicCategories();
  res.json({ success: true, data: categories });
});

export const listProducts = asyncHandler(async (req, res) => {
  const { category, search, minPrice, maxPrice, sort, page = 1, pageSize = 20 } = req.query;
  const { rows, meta } = await productService.listPublicProducts({
    categorySlug: category,
    search,
    minPrice,
    maxPrice,
    sort,
    page,
    pageSize,
  });
  res.json({ success: true, data: rows, meta });
});

export const listFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const products = await productService.listFeaturedProducts(limit);
  res.json({ success: true, data: products });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getPublicProductBySlug(req.params.slug);
  res.json({ success: true, data: product });
});
