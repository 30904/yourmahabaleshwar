import { Router } from 'express';
import * as listing from '../controllers/listingController.js';
import * as domain from '../controllers/domainController.js';
import * as pricing from '../controllers/vendorPricingController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
router.get('/', listing.getGuides);
router.get('/mine', protect, authorize(ROLES.GUIDE, ROLES.SUPER_ADMIN), domain.listMyGuides);
router.get('/mine/:id', protect, authorize(ROLES.GUIDE, ROLES.SUPER_ADMIN), domain.getMyGuide);
router.post('/', protect, authorize(ROLES.GUIDE, ROLES.SUPER_ADMIN), domain.createGuide);
router.put('/:id', protect, authorize(ROLES.GUIDE, ROLES.SUPER_ADMIN), domain.updateGuide);
router.patch('/:id/prices', protect, authorize(ROLES.GUIDE, ROLES.SUPER_ADMIN), pricing.patchGuidePrices);
router.delete('/:id', protect, authorize(ROLES.GUIDE, ROLES.SUPER_ADMIN), domain.deleteGuide);
router.get('/:slug', listing.getGuideBySlug);
export default router;
