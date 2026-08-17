import { Router } from 'express';
import * as listing from '../controllers/listingController.js';
import * as domain from '../controllers/domainController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
router.get('/', listing.getHorses);
router.get('/mine', protect, authorize(ROLES.HORSE_OPERATOR, ROLES.SUPER_ADMIN), domain.listMyHorses);
router.post('/', protect, authorize(ROLES.HORSE_OPERATOR, ROLES.SUPER_ADMIN), domain.createHorse);
router.put('/:id', protect, authorize(ROLES.HORSE_OPERATOR, ROLES.SUPER_ADMIN), domain.updateHorse);
router.delete('/:id', protect, authorize(ROLES.HORSE_OPERATOR, ROLES.SUPER_ADMIN), domain.deleteHorse);
router.get('/:slug', listing.getHorseBySlug);
export default router;
