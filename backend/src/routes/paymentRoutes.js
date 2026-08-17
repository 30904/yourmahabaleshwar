import { Router } from 'express';
import * as payment from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
router.use(protect);
router.post('/create-order', payment.createPaymentOrder);
router.post('/verify', payment.verifyPayment);
router.post('/refund', payment.requestRefund);
router.get('/refund-preview/:bookingId', payment.getRefundPreview);
export default router;
