import { Router } from 'express';
import * as hotel from '../controllers/hotelController.js';
import * as pricing from '../controllers/vendorPricingController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.get('/', hotel.getHotels);
router.get('/mine', protect, authorize(ROLES.HOTEL_VENDOR, ROLES.SUPER_ADMIN), hotel.listMyHotels);
router.get('/mine/:id', protect, authorize(ROLES.HOTEL_VENDOR, ROLES.SUPER_ADMIN), hotel.getMyHotel);
router.get('/:slug', hotel.getHotelBySlug);
router.post('/', protect, authorize(ROLES.HOTEL_VENDOR, ROLES.SUPER_ADMIN), hotel.createHotel);
router.put('/:id', protect, authorize(ROLES.HOTEL_VENDOR, ROLES.SUPER_ADMIN), hotel.updateHotel);
router.patch('/:id/prices', protect, authorize(ROLES.HOTEL_VENDOR, ROLES.SUPER_ADMIN), pricing.patchHotelPrices);
router.delete('/:id', protect, authorize(ROLES.HOTEL_VENDOR, ROLES.SUPER_ADMIN), hotel.deleteHotel);

export default router;
