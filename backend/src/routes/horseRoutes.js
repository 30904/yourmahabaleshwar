import { Router } from 'express';
import * as listing from '../controllers/listingController.js';
import * as domain from '../controllers/domainController.js';
import * as pricing from '../controllers/vendorPricingController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES, STAFF_ROLES } from '../constants/roles.js';

const horseWriters = [ROLES.HORSE_OPERATOR, ROLES.SUPER_ADMIN, ...STAFF_ROLES];

const router = Router();
router.get('/', listing.getHorses);
router.get('/mine', protect, authorize(...horseWriters), domain.listMyHorses);
router.get('/mine/:id', protect, authorize(...horseWriters), domain.getMyHorse);
router.post('/', protect, authorize(...horseWriters), domain.createHorse);
router.put('/:id', protect, authorize(...horseWriters), domain.updateHorse);
router.patch('/:id/prices', protect, authorize(...horseWriters), pricing.patchHorsePrices);
router.delete('/:id', protect, authorize(...horseWriters), domain.deleteHorse);
router.get('/:slug', listing.getHorseBySlug);
export default router;
