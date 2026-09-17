import { sendEmail } from '../config/mailer.js';
import { env } from '../config/env.js';
import { BRAND_NAME } from '../config/brand.js';

// TODO: replace with MA Universal's real address/phone once available.
const BRAND_CONTACT_LINE = `${BRAND_NAME} · address TBD · phone TBD`;

function layout(bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1c1917;">
      <h2 style="color: #c2410c;">${BRAND_NAME}</h2>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #78716c;">
        ${BRAND_CONTACT_LINE}
      </p>
    </div>
  `;
}

const STATUS_MESSAGES = {
  placed: 'We\'ve received your order and will call you shortly to confirm it.',
  confirmed: 'Your order has been confirmed and is being prepared.',
  packed: 'Your order has been packed and will ship soon.',
  shipped: 'Your order is on its way!',
  delivered: 'Your order has been delivered. Thank you for shopping with us!',
  cancelled: 'Your order has been cancelled.',
  returned: 'Your return has been recorded.',
};

export async function sendOrderPlacedEmail(to, order) {
  await sendEmail({
    to,
    subject: `Order ${order.order_number} received — ${BRAND_NAME}`,
    html: layout(`
      <p>Thank you for your order! Here are the details:</p>
      <p><strong>Order Number:</strong> ${order.order_number}<br/>
         <strong>Total:</strong> $${order.total}<br/>
         <strong>Payment:</strong> Cash on Delivery</p>
      <p>${STATUS_MESSAGES.placed}</p>
    `),
  });
}

export async function sendOrderStatusEmail(to, order) {
  const reasonHtml =
    order.status === 'cancelled' && order.cancelled_reason
      ? `<p><strong>Reason:</strong> ${order.cancelled_reason}</p>`
      : '';

  const reviewCtaHtml =
    order.status === 'delivered'
      ? `<p style="margin-top: 24px; text-align: center;">
           <a href="${env.urls.customerApp}/account/orders/${order.id}"
              style="display:inline-block;background:#c2410c;color:#fff;padding:12px 28px;text-decoration:none;border-radius:4px;font-weight:bold;">
             Add a Review
           </a>
         </p>`
      : '';

  await sendEmail({
    to,
    subject: `Order ${order.order_number} update — ${BRAND_NAME}`,
    html: layout(`
      <p><strong>Order Number:</strong> ${order.order_number}</p>
      <p>${STATUS_MESSAGES[order.status] || 'Your order status has been updated.'}</p>
      ${reasonHtml}
      ${reviewCtaHtml}
    `),
  });
}

export async function sendAdminNewOrderAlert(order) {
  if (!env.mail.adminAlertEmail) return;
  await sendEmail({
    to: env.mail.adminAlertEmail,
    subject: `New order ${order.order_number} — $${order.total}`,
    html: layout(`
      <p>A new order has been placed.</p>
      <p><strong>Order Number:</strong> ${order.order_number}<br/>
         <strong>Total:</strong> $${order.total}<br/>
         <strong>City:</strong> ${order.shipping_city}</p>
    `),
  });
}
