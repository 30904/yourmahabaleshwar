import { Router } from 'express';
import * as hotel from '../controllers/hotelController.js';
import * as pricing from '../controllers/vendorPricingController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
const stayManagers = [ROLES.HOTEL_VENDOR, ROLES.SUPER_ADMIN];

router.get('/mine', protect, authorize(...stayManagers), hotel.listMyResorts);
router.get('/mine/:id', protect, authorize(...stayManagers), hotel.getMyResort);
router.post('/', protect, authorize(...stayManagers), hotel.createResort);
router.put('/:id', protect, authorize(...stayManagers), hotel.updateResort);
router.patch('/:id/prices', protect, authorize(...stayManagers), pricing.patchResortPrices);
router.delete('/:id', protect, authorize(...stayManagers), hotel.deleteResort);

export default router;
