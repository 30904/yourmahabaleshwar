import { body } from 'express-validator';

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

export const forgotValidation = [body('email').isEmail().normalizeEmail()];

export const resetValidation = [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 }),
];

export const sendOtpValidation = [
  body('identifier').trim().notEmpty().withMessage('identifier required'),
  body('channel').isIn(['PHONE', 'EMAIL']),
  body('purpose').optional().isIn(['LOGIN', 'SIGNUP', 'VERIFY']),
];

export const verifyOtpValidation = [
  body('identifier').trim().notEmpty(),
  body('code').trim().isLength({ min: 4, max: 8 }),
  body('purpose').optional().isIn(['LOGIN', 'SIGNUP', 'VERIFY']),
];
