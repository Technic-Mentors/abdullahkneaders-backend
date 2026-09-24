import { AppError } from '../utils/AppError.js';
import * as notifyMeDb from '../db/queries/notifyMeRequests.queries.js';
import * as variantsDb from '../db/queries/productVariants.queries.js';
import { sendBackInStockEmail } from '../emails/notifyMeEmails.js';

export async function requestNotification({ customerId, variantId, email }) {
  const variant = await variantsDb.findVariantById(variantId);
  if (!variant) throw new AppError('Product variant not found.', 404);
  if (variant.stock_quantity > 0) throw new AppError('This item is currently in stock.', 400);

  await notifyMeDb.createNotifyMeRequest({ customerId, variantId, email });
}

/** Called when a variant's stock goes from 0 to positive — emails everyone waiting on it. */
export async function notifyBackInStock(variantId) {
  const requests = await notifyMeDb.listUnnotifiedForVariant(variantId);
  if (requests.length === 0) return;

  const variant = await variantsDb.findVariantWithProduct(variantId);
  if (!variant) return;

  for (const request of requests) {
    await sendBackInStockEmail(request.email, variant);
    await notifyMeDb.markNotified(request.id);
  }
}
