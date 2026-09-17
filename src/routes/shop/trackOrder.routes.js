import { Router } from 'express';
import * as ordersController from '../../controllers/shop/orders.controller.js';
import { validate } from '../../middleware/validate.js';
import { trackOrderRateLimiter } from '../../middleware/rateLimiter.js';
import { trackOrderSchema } from '../../validation/trackOrder.schema.js';

export const trackOrderRouter = Router();

trackOrderRouter.post('/', trackOrderRateLimiter, validate(trackOrderSchema), ordersController.trackOrder);
