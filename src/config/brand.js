// Single source of truth for brand-derived defaults — env.js, utils/orderNumber.js,
// emails/*.js and server.js all read from this file instead of hardcoding brand strings.

export const BRAND_NAME = 'Abdullah Kneaders';
export const ORDER_NUMBER_PREFIX = 'AK';
export const DEFAULT_PORT = 3006;
export const DEFAULT_EMAIL_FROM = 'Abdullah Kneaders <abdullahkneadersofficial@gmail.com>';
