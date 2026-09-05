import { Router } from 'express';
import * as listing from '../controllers/listingController.js';
import * as domain from '../controllers/domainController.js';
import * as pricing from '../controllers/vendorPricingController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES, STAFF_ROLES } from '../constants/roles.js';

const guideWriters = [ROLES.GUIDE, ROLES.SUPER_ADMIN, ...STAFF_ROLES];

const router = Router();
router.get('/', listing.getGuides);
router.get('/mine', protect, authorize(...guideWriters), domain.listMyGuides);
router.get('/mine/:id', protect, authorize(...guideWriters), domain.getMyGuide);
router.post('/', protect, authorize(...guideWriters), domain.createGuide);
router.put('/:id', protect, authorize(...guideWriters), domain.updateGuide);
router.patch('/:id/prices', protect, authorize(...guideWriters), pricing.patchGuidePrices);
router.delete('/:id', protect, authorize(...guideWriters), domain.deleteGuide);
router.get('/:slug', listing.getGuideBySlug);
export default router;
