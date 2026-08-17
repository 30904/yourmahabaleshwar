import { Router } from 'express';
import * as listing from '../controllers/listingController.js';
import * as domain from '../controllers/domainController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
router.get('/', listing.getDrivers);
router.get('/mine', protect, authorize(ROLES.DRIVER, ROLES.SUPER_ADMIN), domain.listMyDrivers);
router.post('/', protect, authorize(ROLES.DRIVER, ROLES.SUPER_ADMIN), domain.createDriver);
router.put('/:id', protect, authorize(ROLES.DRIVER, ROLES.SUPER_ADMIN), domain.updateDriver);
router.delete('/:id', protect, authorize(ROLES.DRIVER, ROLES.SUPER_ADMIN), domain.deleteDriver);
router.get('/:slug', listing.getDriverBySlug);
export default router;
