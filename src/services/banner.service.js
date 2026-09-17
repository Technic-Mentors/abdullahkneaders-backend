import { AppError } from '../utils/AppError.js';
import { buildPaginationMeta } from '../utils/pagination.js';
import { deleteUploadedFile } from '../config/upload.js';
import * as bannersDb from '../db/queries/banners.queries.js';

export async function listActiveByPlacement(placement) {
  return bannersDb.listActiveBanners(placement);
}

export async function listAll({ page, pageSize } = {}) {
  if (!page || !pageSize) {
    const { rows } = await bannersDb.listAllBanners();
    return { rows, meta: null };
  }
  const offset = (page - 1) * pageSize;
  const { rows, total } = await bannersDb.listAllBanners({ limit: pageSize, offset });
  return { rows, meta: buildPaginationMeta({ page, pageSize, total }) };
}

export async function createBanner(data) {
  const id = await bannersDb.createBanner(data);
  return bannersDb.findBannerById(id);
}

export async function updateBanner(id, data) {
  const banner = await bannersDb.findBannerById(id);
  if (!banner) throw new AppError('Banner not found.', 404);
  await bannersDb.updateBanner(id, data);
  return bannersDb.findBannerById(id);
}

export async function deleteBanner(id) {
  const banner = await bannersDb.findBannerById(id);
  if (!banner) throw new AppError('Banner not found.', 404);
  await bannersDb.deleteBanner(id);
  deleteUploadedFile(banner.image_path);
}
