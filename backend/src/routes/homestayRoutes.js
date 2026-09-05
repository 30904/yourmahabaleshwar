import { Router } from 'express';
import * as listing from '../controllers/listingController.js';
import * as domain from '../controllers/domainController.js';
import * as pricing from '../controllers/vendorPricingController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES, STAFF_ROLES } from '../constants/roles.js';

const homestayWriters = [ROLES.HOMESTAY_VENDOR, ROLES.SUPER_ADMIN, ...STAFF_ROLES];

const router = Router();
router.get('/', listing.getHomestays);
router.get('/mine', protect, authorize(...homestayWriters), domain.listMyHomestays);
router.get('/mine/:id', protect, authorize(...homestayWriters), domain.getMyHomestay);
router.post('/', protect, authorize(...homestayWriters), domain.createHomestay);
router.put('/:id', protect, authorize(...homestayWriters), domain.updateHomestay);
router.patch('/:id/prices', protect, authorize(...homestayWriters), pricing.patchHomestayPrices);
router.delete('/:id', protect, authorize(...homestayWriters), domain.deleteHomestay);
router.get('/:slug', listing.getHomestayBySlug);
export default router;
