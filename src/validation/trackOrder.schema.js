import { z } from 'zod';

export const trackOrderSchema = z.object({
  body: z.object({
    orderNumber: z.string().trim().min(1, 'Order number is required').max(20),
    phone: z
      .string()
      .trim()
      .regex(/^\d{11}$/, 'Enter an 11-digit phone number'),
  }),
});
