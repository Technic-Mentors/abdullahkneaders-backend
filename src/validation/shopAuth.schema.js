import { z } from 'zod';

const password = z.string().min(8, 'Password must be at least 8 characters');
const phone = z
  .string()
  .trim()
  .regex(/^\d{11}$/, 'Enter an 11-digit phone number');
const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const name = z
  .string()
  .trim()
  .min(2, 'Name is too short')
  .max(25, 'Name must be 25 characters or fewer')
  .regex(/^[A-Za-z ]+$/, 'Name can only contain letters and spaces');

export const registerSchema = z.object({
  body: z.object({
    name,
    email,
    phone,
    password,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password,
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name,
    phone,
  }),
});

export const verifyEmailSchema = z.object({
  params: z.object({ token: z.string().min(1) }),
});
