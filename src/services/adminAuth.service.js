import bcrypt from 'bcrypt';
import { AppError } from '../utils/AppError.js';
import { signJwt } from '../utils/jwt.js';
import { generateOpaqueToken, hashToken } from '../utils/tokenHash.js';
import { COOKIE_NAMES, setAccessCookie, setRefreshCookie, clearAuthCookies } from '../utils/cookies.js';
import { env } from '../config/env.js';
import { deleteUploadedFile } from '../config/upload.js';
import {
  findAdminByEmail,
  findAdminById,
  findAdminAuthById,
  updateAdminPassword,
  updateAdminProfile,
  updateAdminAvatar,
} from '../db/queries/admins.queries.js';
import {
  createRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  revokeRefreshTokenByHash,
} from '../db/queries/refreshTokens.queries.js';
import {
  createPasswordResetToken,
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
} from '../db/queries/passwordResetTokens.queries.js';
import { sendPasswordResetEmail } from '../emails/authEmails.js';

const USER_TYPE = 'admin';
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function issueSession(res, adminId) {
  const accessToken = signJwt({ sub: adminId }, env.jwt.adminSecret, env.jwt.accessTokenTtl);
  setAccessCookie(res, COOKIE_NAMES.adminAccess, accessToken);

  const refreshToken = generateOpaqueToken();
  await createRefreshToken({
    userType: USER_TYPE,
    userId: adminId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  setRefreshCookie(res, COOKIE_NAMES.adminRefresh, refreshToken);
}

export async function login({ email, password }, res) {
  const admin = await findAdminByEmail(email);
  if (!admin) throw new AppError('Invalid email or password.', 401);

  const matches = await bcrypt.compare(password, admin.password_hash);
  if (!matches) throw new AppError('Invalid email or password.', 401);

  await issueSession(res, admin.id);
  return findAdminById(admin.id);
}

export async function refresh(req, res) {
  const token = req.cookies?.[COOKIE_NAMES.adminRefresh];
  if (!token) throw new AppError('Please log in again.', 401);

  const tokenHash = hashToken(token);
  const record = await findValidRefreshToken(USER_TYPE, tokenHash);
  if (!record) throw new AppError('Please log in again.', 401);

  await revokeRefreshToken(record.id);
  await issueSession(res, record.user_id);
}

export async function logout(req, res) {
  const token = req.cookies?.[COOKIE_NAMES.adminRefresh];
  if (token) await revokeRefreshTokenByHash(USER_TYPE, hashToken(token));
  clearAuthCookies(res, COOKIE_NAMES.adminAccess, COOKIE_NAMES.adminRefresh);
}

export async function forgotPassword(email) {
  const admin = await findAdminByEmail(email);
  if (!admin) return; // don't reveal whether the account exists

  const token = generateOpaqueToken();
  await createPasswordResetToken({
    userType: USER_TYPE,
    userId: admin.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  const link = `${env.urls.customerApp}${env.urls.adminPath}/reset-password/${token}`;
  await sendPasswordResetEmail(email, link);
}

export async function resetPassword(token, newPassword) {
  const record = await findValidPasswordResetToken(USER_TYPE, hashToken(token));
  if (!record) throw new AppError('This reset link is invalid or has expired.', 400);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await updateAdminPassword(record.user_id, passwordHash);
  await markPasswordResetTokenUsed(record.id);
}

export async function changePassword(adminId, currentPassword, newPassword) {
  const admin = await findAdminAuthById(adminId);
  if (!admin) throw new AppError('Admin not found.', 404);

  const matches = await bcrypt.compare(currentPassword, admin.password_hash);
  if (!matches) throw new AppError('Current password is incorrect.', 401);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await updateAdminPassword(adminId, passwordHash);
}

export async function updateProfile(adminId, { name, email }) {
  const admin = await findAdminAuthById(adminId);
  if (!admin) throw new AppError('Admin not found.', 404);

  if (email !== admin.email) {
    const existing = await findAdminByEmail(email);
    if (existing && existing.id !== adminId) {
      throw new AppError('Another admin account already uses this email.', 409);
    }
  }

  await updateAdminProfile(adminId, { name, email });
  return findAdminById(adminId);
}

export async function updateAvatar(adminId, avatarPath) {
  const existing = await findAdminById(adminId);
  await updateAdminAvatar(adminId, avatarPath);
  deleteUploadedFile(existing.avatar);
  return findAdminById(adminId);
}
