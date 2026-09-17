import { asyncHandler } from '../../utils/asyncHandler.js';
import { findCustomerById } from '../../db/queries/customers.queries.js';
import * as authService from '../../services/customerAuth.service.js';

export const register = asyncHandler(async (req, res) => {
  const customer = await authService.register(req.body, res);
  res.status(201).json({ success: true, data: customer, message: 'Account created successfully.' });
});

export const login = asyncHandler(async (req, res) => {
  const customer = await authService.login(req.body, res);
  res.json({ success: true, data: customer, message: 'Logged in successfully.' });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req, res);
  res.json({ success: true, message: 'Logged out successfully.' });
});

export const refresh = asyncHandler(async (req, res) => {
  await authService.refresh(req, res);
  res.json({ success: true, message: 'Session refreshed.' });
});

export const me = asyncHandler(async (req, res) => {
  const customer = await findCustomerById(req.customer.id);
  res.json({ success: true, data: customer });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const customer = await authService.updateProfile(req.customer.id, req.body);
  res.json({ success: true, data: customer, message: 'Profile updated.' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.params.token);
  res.json({ success: true, message: 'Email verified successfully.' });
});

export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.customer.id);
  res.json({ success: true, message: 'Verification email sent.' });
});
