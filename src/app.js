import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env.js';
import { uploadsRoot } from './config/upload.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { shopRouter } from './routes/shop/index.js';
import { adminRouter } from './routes/admin/index.js';

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    // Browser-facing origins — the admin app lives under a path on the customer app (see env.urls.adminPath).
    // localhost:5173 is allowed so the frontend can be run locally against this backend during development.
    origin: [env.urls.customerApp, 'http://localhost:5173'],
    credentials: true,
  }),
);
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(morgan(env.isProduction ? 'combined' : 'dev'));
app.use('/uploads', express.static(uploadsRoot));

app.get('/health', (req, res) => res.json({ success: true, message: 'ok' }));

app.use('/api/v1/shop', shopRouter);
app.use('/api/v1/admin', adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);
