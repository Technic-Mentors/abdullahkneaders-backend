import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { findAdminById } from '../../db/queries/admins.queries.js';
import { publicPathFor, renameUploadedFile } from '../../config/upload.js';
import * as authService from '../../services/adminAuth.service.js';

export const login = asyncHandler(async (req, res) => {
  const admin = await authService.login(req.body, res);
  res.json({ success: true, data: admin, message: 'Logged in successfully.' });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req, res);
  res.json({ success: true, message: 'Logged out successfully.' });
});

export const refresh = asyncHandler(async (req, res) => {
  await authService.refresh(req, res);
  res.json({ success: true, message: 'Session refreshed.' });
});

export const me = asyncHandler(async (req, res) => {
  const admin = await findAdminById(req.admin.id);
  res.json({ success: true, data: admin });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.admin.id, req.body.currentPassword, req.body.newPassword);
  res.json({ success: true, message: 'Password updated successfully.' });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const admin = await authService.updateProfile(req.admin.id, req.body);
  res.json({ success: true, data: admin, message: 'Profile updated successfully.' });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No image file was uploaded.', 400);
  const filename = renameUploadedFile('avatars', req.file);
  const avatarPath = publicPathFor('avatars', filename);
  const admin = await authService.updateAvatar(req.admin.id, avatarPath);
  res.json({ success: true, data: admin, message: 'Avatar updated.' });
});
