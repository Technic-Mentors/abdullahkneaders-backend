import { sendEmail } from '../config/mailer.js';
import { env } from '../config/env.js';
import { BRAND_NAME } from '../config/brand.js';
import {
  renderLayout,
  renderButton,
  renderItemsTable,
  renderTotalsBlock,
  renderAddressBlock,
  sectionTitle,
  paymentMethodLabel,
  formatDate,
  money,
} from './layout.js';

const STATUS_MESSAGES = {
  placed: "We've received your order and will call you shortly to confirm it.",
  confirmed: 'Your order has been confirmed and is being prepared.',
  packed: 'Your order has been packed and will ship soon.',
  delivered: 'Your order has been delivered. Thank you for shopping with us!',
  shipped: 'Your order is on its way! It will be delivered to you soon.',
  cancelled: 'Your order has been cancelled.',
  returned: 'Your return has been recorded.',
};

function adminOrderUrl(orderId) {
  return `${env.urls.customerApp}${env.urls.adminPath}/orders/${orderId}`;
}

export async function sendOrderPlacedEmail({ customer, order, items, couponCode }) {
  await sendEmail({
    to: customer.email,
    subject: `Order ${order.order_number} received — ${BRAND_NAME}`,
    html: renderLayout({
      heading: 'Order confirmation',
      bodyHtml: `
        <p>Hi ${customer.name},</p>
        <p>Thank you for your order! Here are your order details:</p>

        <p style="margin: 0; font-size: 13px; color: #57534e;">
          <strong>Order Number:</strong> ${order.order_number}<br/>
          <strong>Order Date:</strong> ${formatDate(order.created_at)}
        </p>

        ${sectionTitle('Shipping Address')}
        ${renderAddressBlock(order)}

        ${sectionTitle('Order Items')}
        ${renderItemsTable(items)}
        ${renderTotalsBlock({
          subtotal: order.subtotal,
          discountAmount: order.discount_amount,
          couponCode,
          shippingCharge: order.shipping_charge,
          total: order.total,
        })}

        ${sectionTitle('Payment')}
        <p style="margin: 0; font-size: 13px;">
          <strong>Method:</strong> ${paymentMethodLabel(order)}<br/>
          <strong>Status:</strong> ${order.payment_status === 'collected' ? 'Paid' : 'Pending'}
        </p>

        <p style="margin-top: 20px;">${STATUS_MESSAGES.placed}</p>
      `,
    }),
  });
}

export async function sendOrderStatusEmail(customer, order) {
  const reasonHtml =
    order.status === 'cancelled' && order.cancelled_reason
      ? `<p><strong>Reason:</strong> ${order.cancelled_reason}</p>`
      : '';

  const reviewCtaHtml =
    order.status === 'delivered'
      ? renderButton(`${env.urls.customerApp}/account/orders/${order.id}`, 'Add a Review')
      : '';

  await sendEmail({
    to: customer.email,
    subject: `Order ${order.order_number} update — ${BRAND_NAME}`,
    html: renderLayout({
      heading: 'Order status update',
      bodyHtml: `
        <p>Hi ${customer.name},</p>
        <p><strong>Order Number:</strong> ${order.order_number}</p>
        <p>${STATUS_MESSAGES[order.status] || 'Your order status has been updated.'}</p>
        ${reasonHtml}
        ${reviewCtaHtml}
      `,
    }),
  });
}

export async function sendAdminNewOrderAlert({ customer, order, items, couponCode }) {
  if (!env.mail.adminAlertEmail) return;

  await sendEmail({
    to: env.mail.adminAlertEmail,
    subject: `New order ${order.order_number} — ${money(order.total)}`,
    html: renderLayout({
      heading: 'New order received',
      bodyHtml: `
        <p>A new order has been placed on ${BRAND_NAME}.</p>

        <p style="margin: 0; font-size: 13px; color: #57534e;">
          <strong>Order Number:</strong> ${order.order_number}<br/>
          <strong>Order Date:</strong> ${formatDate(order.created_at)}<br/>
          <strong>Status:</strong> ${order.status}
        </p>

        ${sectionTitle('Customer')}
        <p style="margin: 0; font-size: 13px;">
          <strong>Name:</strong> ${customer.name}<br/>
          <strong>Email:</strong> ${customer.email}<br/>
          <strong>Phone:</strong> ${customer.phone || order.shipping_phone}
        </p>

        ${sectionTitle('Shipping Address')}
        ${renderAddressBlock(order)}

        ${sectionTitle('Order Items')}
        ${renderItemsTable(items)}
        ${renderTotalsBlock({
          subtotal: order.subtotal,
          discountAmount: order.discount_amount,
          couponCode,
          shippingCharge: order.shipping_charge,
          total: order.total,
        })}

        ${sectionTitle('Payment')}
        <p style="margin: 0; font-size: 13px;">
          <strong>Method:</strong> ${paymentMethodLabel(order)}<br/>
          <strong>Status:</strong> ${order.payment_status === 'collected' ? 'Paid' : 'Pending'}
        </p>

        ${renderButton(adminOrderUrl(order.id), 'View / Process Order')}
      `,
    }),
  });
}
