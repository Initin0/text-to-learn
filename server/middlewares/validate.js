import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

// validate({ body: zodSchema, query: zodSchema }) -> parsed values on req.valid
export const validate = (schemas) => (req, _res, next) => {
  req.valid = {};
  for (const [where, schema] of Object.entries(schemas)) {
    const result = schema.safeParse(req[where] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      return next(AppError.badRequest(details[0]?.message || 'Invalid input', details));
    }
    req.valid[where] = result.data;
  }
  next();
};

export const validObjectId = (param = 'id') => (req, _res, next) => {
  if (!mongoose.isValidObjectId(req.params[param])) return next(AppError.badRequest(`Invalid ${param}`));
  next();
};
