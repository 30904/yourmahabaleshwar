import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES, VENDOR_ROLES } from '../constants/roles.js';
import * as ctrl from '../controllers/subscriptionInvoiceController.js';

const router = Router();

router.use(protect);
router.get('/', authorize(...VENDOR_ROLES, ROLES.SUPER_ADMIN), ctrl.listMySubscriptionInvoices);
router.get('/:id/download', authorize(...VENDOR_ROLES, ROLES.SUPER_ADMIN), ctrl.downloadSubscriptionInvoice);

export default router;
