import { sendEmail } from '../config/mailer.js';
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

export async function sendVerificationEmail(to, link) {
  await sendEmail({
    to,
    subject: `Verify your email — ${BRAND_NAME}`,
    html: layout(`
      <p>Thanks for creating an account. Please verify your email address to activate all account features.</p>
      <p><a href="${link}" style="background:#c2410c;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Verify Email</a></p>
      <p>This link expires in 24 hours.</p>
    `),
  });
}

export async function sendPasswordResetEmail(to, link) {
  await sendEmail({
    to,
    subject: `Reset your password — ${BRAND_NAME}`,
    html: layout(`
      <p>We received a request to reset your password. Click below to choose a new one.</p>
      <p><a href="${link}" style="background:#c2410c;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Reset Password</a></p>
      <p>If you didn't request this, you can safely ignore this email. This link expires in 1 hour.</p>
    `),
  });
}
