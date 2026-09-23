import { sendEmail } from '../config/mailer.js';
import { BRAND_NAME } from '../config/brand.js';
import { renderLayout, renderButton } from './layout.js';

export async function sendVerificationEmail(to, link) {
  await sendEmail({
    to,
    subject: `Verify your email — ${BRAND_NAME}`,
    html: renderLayout({
      heading: 'Verify your email',
      bodyHtml: `
        <p>Thanks for creating an account. Please verify your email address to activate all account features.</p>
        ${renderButton(link, 'Verify Email')}
        <p>This link expires in 24 hours.</p>
      `,
    }),
  });
}

export async function sendPasswordResetEmail(to, link) {
  await sendEmail({
    to,
    subject: `Reset your password — ${BRAND_NAME}`,
    html: renderLayout({
      heading: 'Reset your password',
      bodyHtml: `
        <p>We received a request to reset your password. Click below to choose a new one.</p>
        ${renderButton(link, 'Reset Password')}
        <p>If you didn't request this, you can safely ignore this email. This link expires in 1 hour.</p>
      `,
    }),
  });
}
