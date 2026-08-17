import User from '../models/User.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { error } from '../utils/apiResponse.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return error(res, 'Not authorized', 401);

    const decoded = verifyAccessToken(token);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) return error(res, 'User not found or inactive', 401);
    next();
  } catch {
    return error(res, 'Not authorized, token invalid', 401);
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return error(res, `Role ${req.user.role} not authorized`, 403);
  }
  next();
};
