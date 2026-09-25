import { z } from 'zod';

const inlineShipping = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Name is too short')
    .max(25, 'Name must be 25 characters or fewer')
    .regex(/^[A-Za-z ]+$/, 'Name can only contain letters and spaces'),
  phone: z
    .string()
    .trim()
    .regex(/^\d{11}$/, 'Enter an 11-digit phone number'),
  addressLine1: z.string().trim().min(3).max(100),
  addressLine2: z.string().trim().max(100).optional().nullable(),
  city: z.string().trim().min(2).max(100),
});

export const checkoutSchema = z.object({
  body: z
    .object({
      addressId: z.coerce.number().int().positive().optional(),
      shipping: inlineShipping.optional(),
      couponCode: z.string().trim().min(1).optional(),
      paymentMethod: z.enum(['cod', 'bank_transfer']).optional().default('cod'),
    })
    .refine((data) => data.addressId || data.shipping, {
      message: 'Please add your shipping address.',
    }),
});

export const orderIdParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

export const cancelOrderSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({ reason: z.string().trim().max(255).optional() }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    status: z.enum(['confirmed', 'packed', 'shipped', 'delivered', 'cancelled']),
    note: z.string().trim().max(255).optional(),
  }),
});

export const listOrdersAdminQuerySchema = z.object({
  query: z.object({
    status: z.enum(['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned']).optional(),
    search: z.string().trim().optional(),
    dateFrom: z.string().trim().optional(),
    dateTo: z.string().trim().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().optional(),
  }),
});
