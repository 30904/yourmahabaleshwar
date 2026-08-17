import { Router } from 'express';
import * as auth from '../controllers/authController.js';
import * as domain from '../controllers/domainController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  registerValidation,
  loginValidation,
  forgotValidation,
  resetValidation,
  sendOtpValidation,
  verifyOtpValidation,
} from '../validations/authValidation.js';

const router = Router();

router.post('/register', registerValidation, validate, auth.register);
router.post('/register-vendor', domain.registerVendor);
router.post('/login', loginValidation, validate, auth.login);
router.post('/otp/send', sendOtpValidation, validate, auth.sendOtp);
router.post('/otp/verify', verifyOtpValidation, validate, auth.verifyOtp);
router.post('/refresh', auth.refresh);
router.post('/forgot-password', forgotValidation, validate, auth.forgotPassword);
router.post('/reset-password', resetValidation, validate, auth.resetPassword);
router.get('/me', protect, auth.me);
router.post('/logout', protect, auth.logout);

export default router;
