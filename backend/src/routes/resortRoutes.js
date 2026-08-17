import { Router } from 'express';
import * as hotel from '../controllers/hotelController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
const stayManagers = [ROLES.HOTEL_VENDOR, ROLES.SUPER_ADMIN];

router.get('/mine', protect, authorize(...stayManagers), hotel.listMyResorts);
router.post('/', protect, authorize(...stayManagers), hotel.createResort);
router.put('/:id', protect, authorize(...stayManagers), hotel.updateResort);
router.delete('/:id', protect, authorize(...stayManagers), hotel.deleteResort);

export default router;
