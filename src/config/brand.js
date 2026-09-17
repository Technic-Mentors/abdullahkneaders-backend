// Single source of truth for brand-derived defaults — env.js, utils/orderNumber.js,
// emails/*.js and server.js all read from this file instead of hardcoding brand strings.

export const BRAND_NAME = 'MA Universal';
export const ORDER_NUMBER_PREFIX = 'MAU';
export const DEFAULT_PORT = 3005;
export const DEFAULT_EMAIL_FROM = 'MA Universal <orders@mauniversal.com>';
