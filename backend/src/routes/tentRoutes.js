import { Router } from 'express';
import * as listing from '../controllers/listingController.js';
import * as domain from '../controllers/domainController.js';
import * as pricing from '../controllers/vendorPricingController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES, STAFF_ROLES } from '../constants/roles.js';

const tentWriters = [ROLES.TENT_OPERATOR, ROLES.SUPER_ADMIN, ...STAFF_ROLES];

const router = Router();
router.get('/', listing.getTents);
router.get('/mine', protect, authorize(...tentWriters), domain.listMyTents);
router.get('/mine/:id', protect, authorize(...tentWriters), domain.getMyTent);
router.post('/', protect, authorize(...tentWriters), domain.createTent);
router.put('/:id', protect, authorize(...tentWriters), domain.updateTent);
router.patch('/:id/prices', protect, authorize(...tentWriters), pricing.patchTentPrices);
router.delete('/:id', protect, authorize(...tentWriters), domain.deleteTent);
router.get('/:slug', listing.getTentBySlug);
export default router;
