import { asyncHandler } from '../../utils/asyncHandler.js';
import * as orderService from '../../services/order.service.js';

export const checkout = asyncHandler(async (req, res) => {
  const order = await orderService.placeOrder(req.customer.id, req.body);
  res.status(201).json({ success: true, data: order, message: 'Order placed successfully.' });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.listOrdersForCustomer(req.customer.id);
  res.json({ success: true, data: orders });
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderForCustomer(Number(req.params.id), req.customer.id);
  res.json({ success: true, data: order });
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrderByCustomer(
    Number(req.params.id),
    req.customer.id,
    req.body.reason,
  );
  res.json({ success: true, data: order, message: 'Order cancelled.' });
});

export const trackOrder = asyncHandler(async (req, res) => {
  const order = await orderService.trackOrder(req.body.orderNumber, req.body.phone);
  res.json({ success: true, data: order });
});
