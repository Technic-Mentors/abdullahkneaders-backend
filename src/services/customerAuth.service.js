import bcrypt from 'bcrypt';
import { AppError } from '../utils/AppError.js';
import { signJwt } from '../utils/jwt.js';
import { generateOpaqueToken, hashToken } from '../utils/tokenHash.js';
import { COOKIE_NAMES, setAccessCookie, setRefreshCookie, clearAuthCookies } from '../utils/cookies.js';
import { env } from '../config/env.js';
import {
  findCustomerByEmail,
  findCustomerById,
  createCustomer,
  updateCustomerProfile,
  updateCustomerPassword,
  markCustomerEmailVerified,
} from '../db/queries/customers.queries.js';
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
import {
  createEmailVerificationToken,
  findEmailVerificationTokenByHash,
  markEmailVerificationTokenUsed,
} from '../db/queries/emailVerificationTokens.queries.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../emails/authEmails.js';

const USER_TYPE = 'customer';
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function issueSession(res, customerId) {
  const accessToken = signJwt({ sub: customerId }, env.jwt.customerSecret, env.jwt.accessTokenTtl);
  setAccessCookie(res, COOKIE_NAMES.customerAccess, accessToken);

  const refreshToken = generateOpaqueToken();
  await createRefreshToken({
    userType: USER_TYPE,
    userId: customerId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  setRefreshCookie(res, COOKIE_NAMES.customerRefresh, refreshToken);
}

async function sendVerificationLink(customerId, email) {
  const token = generateOpaqueToken();
  await createEmailVerificationToken({
    customerId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  const link = `${env.urls.customerApp}/verify-email/${token}`;
  await sendVerificationEmail(email, link);
}

export async function register({ name, email, phone, password }, res) {
  const existing = await findCustomerByEmail(email);
  if (existing) throw new AppError('An account with this email already exists.', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const customerId = await createCustomer({ name, email, phone, passwordHash });

  await issueSession(res, customerId);
  await sendVerificationLink(customerId, email);

  return findCustomerById(customerId);
}

export async function updateProfile(customerId, { name, phone }) {
  await updateCustomerProfile(customerId, { name, phone });
  return findCustomerById(customerId);
}

export async function login({ email, password }, res) {
  const customer = await findCustomerByEmail(email);
  if (!customer) throw new AppError('Invalid email or password.', 401);

  const matches = await bcrypt.compare(password, customer.password_hash);
  if (!matches) throw new AppError('Invalid email or password.', 401);

  if (customer.is_blocked) {
    throw new AppError('Your account has been suspended. Please contact support.', 403);
  }

  await issueSession(res, customer.id);
  return findCustomerById(customer.id);
}

export async function refresh(req, res) {
  const token = req.cookies?.[COOKIE_NAMES.customerRefresh];
  if (!token) throw new AppError('Please log in again.', 401);

  const tokenHash = hashToken(token);
  const record = await findValidRefreshToken(USER_TYPE, tokenHash);
  if (!record) throw new AppError('Please log in again.', 401);

  await revokeRefreshToken(record.id);
  await issueSession(res, record.user_id);
}

export async function logout(req, res) {
  const token = req.cookies?.[COOKIE_NAMES.customerRefresh];
  if (token) await revokeRefreshTokenByHash(USER_TYPE, hashToken(token));
  clearAuthCookies(res, COOKIE_NAMES.customerAccess, COOKIE_NAMES.customerRefresh);
}

export async function forgotPassword(email) {
  const customer = await findCustomerByEmail(email);
  if (!customer) return; // don't reveal whether the account exists

  const token = generateOpaqueToken();
  await createPasswordResetToken({
    userType: USER_TYPE,
    userId: customer.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  const link = `${env.urls.customerApp}/reset-password/${token}`;
  await sendPasswordResetEmail(email, link);
}

export async function resetPassword(token, newPassword) {
  const record = await findValidPasswordResetToken(USER_TYPE, hashToken(token));
  if (!record) throw new AppError('This reset link is invalid or has expired.', 400);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await updateCustomerPassword(record.user_id, passwordHash);
  await markPasswordResetTokenUsed(record.id);
}

export async function verifyEmail(token) {
  const record = await findEmailVerificationTokenByHash(hashToken(token));
  if (!record) throw new AppError('This verification link is invalid or has expired.', 400);

  // Idempotent: a duplicate hit on the same still-valid link (double form submits, email
  // security scanners pre-fetching the link, etc.) should succeed quietly, not error out.
  if (record.verified_at) return;

  await markCustomerEmailVerified(record.customer_id);
  await markEmailVerificationTokenUsed(record.id);
}

export async function resendVerification(customerId) {
  const customer = await findCustomerById(customerId);
  if (!customer) throw new AppError('Account not found.', 404);
  if (customer.email_verified_at) throw new AppError('Your email is already verified.', 400);
  await sendVerificationLink(customerId, customer.email);
}
