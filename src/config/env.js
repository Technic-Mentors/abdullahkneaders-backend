import 'dotenv/config';
import { DEFAULT_PORT, DEFAULT_EMAIL_FROM } from './brand.js';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || DEFAULT_PORT),

  db: {
    host: required('DB_HOST', '127.0.0.1'),
    port: Number(process.env.DB_PORT || 3306),
    user: required('DB_USER', 'root'),
    password: process.env.DB_PASSWORD || '',
    database: required('DB_NAME', 'abdulah_kneaders'),
  },

  jwt: {
    customerSecret: required('JWT_CUSTOMER_SECRET'),
    adminSecret: required('JWT_ADMIN_SECRET'),
    accessTokenTtl: process.env.JWT_ACCESS_TOKEN_TTL || '15m',
    refreshTokenTtl: process.env.JWT_REFRESH_TOKEN_TTL || '30d',
  },

  cookieDomain: process.env.COOKIE_DOMAIN || 'localhost',

  mail: {
    user: process.env.GMAIL_USER || '',
    pass: process.env.GMAIL_PASS || '',
    emailFrom: process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM,
    adminAlertEmail: process.env.ADMIN_ALERT_EMAIL || '',
  },

  urls: {
    // Both apps are served from the same origin (admin lives under a path,
    // proxied to a separate app in dev, path-served from one origin in prod).
    customerApp: process.env.CUSTOMER_APP_URL || 'http://localhost:5174',
    adminPath: process.env.ADMIN_APP_PATH || '/admin',
  },

  upload: {
    maxFileSizeMb: Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 5),
  },

  isProduction: (process.env.NODE_ENV || 'development') === 'production',
};
