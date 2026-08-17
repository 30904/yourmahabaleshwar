import { Router } from 'express';
import * as hotel from '../controllers/hotelController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.get('/', hotel.getHotels);
router.get('/:slug', hotel.getHotelBySlug);
router.post('/', protect, authorize(ROLES.HOTEL_VENDOR, ROLES.SUPER_ADMIN), hotel.createHotel);
router.put('/:id', protect, authorize(ROLES.HOTEL_VENDOR, ROLES.SUPER_ADMIN), hotel.updateHotel);
router.delete('/:id', protect, authorize(ROLES.SUPER_ADMIN), hotel.deleteHotel);

export default router;
