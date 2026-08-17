import { Router } from 'express';
import * as listing from '../controllers/listingController.js';
import * as domain from '../controllers/domainController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
router.get('/', listing.getHomestays);
router.get('/mine', protect, authorize(ROLES.HOMESTAY_VENDOR, ROLES.SUPER_ADMIN), domain.listMyHomestays);
router.post('/', protect, authorize(ROLES.HOMESTAY_VENDOR, ROLES.SUPER_ADMIN), domain.createHomestay);
router.put('/:id', protect, authorize(ROLES.HOMESTAY_VENDOR, ROLES.SUPER_ADMIN), domain.updateHomestay);
router.delete('/:id', protect, authorize(ROLES.SUPER_ADMIN), domain.deleteHomestay);
router.get('/:slug', listing.getHomestayBySlug);
export default router;
