import { Router } from 'express';
import * as listing from '../controllers/listingController.js';
import * as domain from '../controllers/domainController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
router.get('/', listing.getGuides);
router.get('/mine', protect, authorize(ROLES.GUIDE, ROLES.SUPER_ADMIN), domain.listMyGuides);
router.post('/', protect, authorize(ROLES.GUIDE, ROLES.SUPER_ADMIN), domain.createGuide);
router.put('/:id', protect, authorize(ROLES.GUIDE, ROLES.SUPER_ADMIN), domain.updateGuide);
router.delete('/:id', protect, authorize(ROLES.SUPER_ADMIN), domain.deleteGuide);
router.get('/:slug', listing.getGuideBySlug);
export default router;
