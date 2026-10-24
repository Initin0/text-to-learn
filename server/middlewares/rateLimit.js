import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env.js';

// AI calls cost money and quota. Limit per user (falls back to IP before auth runs).
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.isTest ? 1000 : 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.sub || ipKeyGenerator(req.ip),
  message: { error: 'Too many generation requests. Please wait a bit and try again.' },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.isTest ? 10000 : 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
