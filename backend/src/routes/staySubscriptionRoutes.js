import { Router } from 'express';
import * as staySub from '../controllers/stayListingSubscriptionController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

const stayVendors = [ROLES.HOTEL_VENDOR, ROLES.HOMESTAY_VENDOR, ROLES.SUPER_ADMIN];

router.use(protect);

router.get('/mine', authorize(...stayVendors), staySub.getMyStaySubscriptions);
router.post('/:listingType/:listingId/renew/order', authorize(...stayVendors), staySub.orderStaySubscriptionRenewal);
router.post('/:listingType/:listingId/renew/confirm', authorize(...stayVendors), staySub.confirmStaySubscriptionRenewal);

export default router;
