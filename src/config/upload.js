import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import fs from 'node:fs';
import multer from 'multer';
import { env } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Creates a multer instance that stores files under uploads/<subfolder>/
 * with a random filename (avoids collisions and path traversal from user input).
 */
export function createUploader(subfolder) {
  const storage = multer.diskStorage({
    destination: path.join(uploadsRoot, subfolder),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: env.upload.maxFileSizeMb * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
      }
      cb(null, true);
    },
  });
}

export function publicPathFor(subfolder, filename) {
  return `/uploads/${subfolder}/${filename}`;
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

function datePrefix() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Renames a just-uploaded file (multer stores it under a random temp name first) to
 * `<date>-<original filename>`, e.g. `15-09-2026-championship-belt.jpg`. If that exact
 * name already exists (e.g. two uploads of a same-named file on the same day), a
 * `-2`, `-3`, ... suffix is added so nothing already on disk is ever overwritten.
 * Returns the new filename for use with publicPathFor().
 */
export function renameUploadedFile(subfolder, file) {
  const ext = path.extname(file.filename);
  const originalBase = path.basename(file.originalname, path.extname(file.originalname));
  const baseName = `${datePrefix()}-${slugify(originalBase)}`;

  let finalName = `${baseName}${ext}`;
  let counter = 2;
  while (fs.existsSync(path.join(uploadsRoot, subfolder, finalName))) {
    finalName = `${baseName}-${counter}${ext}`;
    counter += 1;
  }

  fs.renameSync(file.path, path.join(uploadsRoot, subfolder, finalName));
  return finalName;
}

/**
 * Deletes a previously-uploaded file given its public path (as returned by
 * publicPathFor(), e.g. `/uploads/products/15-09-2026-belt.jpg`). Call this whenever a
 * record's image is replaced or the record itself is deleted, so old files don't pile
 * up on disk. Safe to call with a null/undefined path (no-op) or a path whose file is
 * already gone (logged, not thrown) — cleanup failures should never block the request.
 */
export function deleteUploadedFile(imagePath) {
  if (!imagePath) return;
  const relative = imagePath.replace(/^\/uploads\//, '');
  const filePath = path.join(uploadsRoot, relative);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error(`Failed to delete uploaded file "${filePath}":`, err.message);
    }
  });
}
