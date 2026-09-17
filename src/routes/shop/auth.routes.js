import { Router } from 'express';
import * as authController from '../../controllers/shop/auth.controller.js';
import { requireCustomer } from '../../middleware/auth.customer.js';
import { validate } from '../../middleware/validate.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../../validation/shopAuth.schema.js';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', authRateLimiter, validate(loginSchema), authController.login);
authRouter.post('/logout', authController.logout);
authRouter.post('/refresh', authController.refresh);
authRouter.get('/me', requireCustomer, authController.me);
authRouter.patch('/me', requireCustomer, validate(updateProfileSchema), authController.updateProfile);
authRouter.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
authRouter.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);
authRouter.get('/verify-email/:token', validate(verifyEmailSchema), authController.verifyEmail);
authRouter.post('/resend-verification', requireCustomer, authController.resendVerification);
