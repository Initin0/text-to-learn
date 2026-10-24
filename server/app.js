import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { apiLimiter } from './middlewares/rateLimit.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // Render sits behind a proxy
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // allow non-browser clients (curl, health checks) and configured origins; "*.vercel.app" style wildcards supported
        if (!origin) return cb(null, true);
        const ok = env.corsOrigins.some((o) => o === '*' || o === origin || (o.startsWith('*.') && origin.endsWith(o.slice(1))));
        cb(ok ? null : new Error(`Origin ${origin} not allowed by CORS`), ok);
      },
      exposedHeaders: ['Content-Disposition'],
    })
  );
  app.use(express.json({ limit: '100kb' }));
  if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

  app.get('/', (_req, res) => res.json({ name: 'Text-to-Learn API', docs: '/api/health' }));
  app.use('/api', apiLimiter, apiRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
