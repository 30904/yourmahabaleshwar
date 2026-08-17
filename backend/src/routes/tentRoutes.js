import { Router } from 'express';
import * as listing from '../controllers/listingController.js';
import * as domain from '../controllers/domainController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
router.get('/', listing.getTents);
router.get('/mine', protect, authorize(ROLES.TENT_OPERATOR, ROLES.SUPER_ADMIN), domain.listMyTents);
router.post('/', protect, authorize(ROLES.TENT_OPERATOR, ROLES.SUPER_ADMIN), domain.createTent);
router.put('/:id', protect, authorize(ROLES.TENT_OPERATOR, ROLES.SUPER_ADMIN), domain.updateTent);
router.delete('/:id', protect, authorize(ROLES.TENT_OPERATOR, ROLES.SUPER_ADMIN), domain.deleteTent);
router.get('/:slug', listing.getTentBySlug);
export default router;
