import { sendEmail } from '../config/mailer.js';
import { env } from '../config/env.js';
import { BRAND_NAME } from '../config/brand.js';
import { renderLayout, renderButton } from './layout.js';

export async function sendBackInStockEmail(to, variant) {
  const variantLabel = [variant.size, variant.color].filter(Boolean).join(' / ');

  await sendEmail({
    to,
    subject: `Back in stock: ${variant.product_name} — ${BRAND_NAME}`,
    html: renderLayout({
      heading: "Good news — it's back in stock",
      bodyHtml: `
        <p>The item you asked to be notified about is available again:</p>
        <p style="margin: 12px 0; font-size: 16px; font-weight: bold;">
          ${variant.product_name}${variantLabel ? ` <span style="font-weight: normal; color: #57534e;">(${variantLabel})</span>` : ''}
        </p>
        <p>Grab it before it sells out again.</p>
        ${renderButton(`${env.urls.customerApp}/product/${variant.product_slug}`, 'Shop Now')}
      `,
    }),
  });
}
