import { env } from '../config/env.js';

export const notFound = (req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  // express-oauth2-jwt-bearer errors carry status 401/403 already
  if (err.name === 'UnauthorizedError' || err.name === 'InvalidTokenError') status = 401;
  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id';
  }
  if (err.name === 'ValidationError') status = 400;
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  }

  if (status >= 500) console.error(`[${req.method} ${req.originalUrl}]`, err.details || '', err.stack);

  res.status(status).json({
    error: status >= 500 && env.isProd && status !== 502 && status !== 501 ? 'Internal server error' : message,
    ...(err.details && !env.isProd && { details: err.details }),
  });
}
