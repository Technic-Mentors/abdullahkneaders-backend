import { env } from '../config/env.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export const COOKIE_NAMES = {
  customerAccess: 'customer_token',
  customerRefresh: 'customer_refresh',
  adminAccess: 'admin_token',
  adminRefresh: 'admin_refresh',
};

function baseOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/',
  };
}

export function setAccessCookie(res, name, token) {
  res.cookie(name, token, { ...baseOptions(), maxAge: 15 * 60 * 1000 });
}

export function setRefreshCookie(res, name, token) {
  res.cookie(name, token, { ...baseOptions(), maxAge: 30 * DAY_MS });
}

export function clearAuthCookies(res, accessName, refreshName) {
  res.clearCookie(accessName, baseOptions());
  res.clearCookie(refreshName, baseOptions());
}