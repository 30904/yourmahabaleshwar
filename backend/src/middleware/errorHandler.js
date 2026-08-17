import { error } from '../utils/apiResponse.js';

export const notFound = (req, res) => error(res, `Not found - ${req.originalUrl}`, 404);

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
