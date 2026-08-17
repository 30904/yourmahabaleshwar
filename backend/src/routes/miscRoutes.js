import { Router } from 'express';
import * as listing from '../controllers/listingController.js';
import * as review from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES, VENDOR_ROLES } from '../constants/roles.js';

const router = Router();

router.get('/availability/:type/:id', listing.getListingAvailability);
router.patch(
  '/availability/:type/:id',
  protect,
  authorize(ROLES.SUPER_ADMIN, ...VENDOR_ROLES),
  listing.updateBlockedDates
);

router.get('/reviews', review.listReviews);
router.post('/reviews', protect, review.createReview);
router.get('/reviews/pending', protect, authorize(ROLES.SUPER_ADMIN), review.listPendingReviews);
router.patch('/reviews/:id/moderate', protect, authorize(ROLES.SUPER_ADMIN), review.moderateReview);

export default router;
