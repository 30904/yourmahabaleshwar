import { Router } from 'express';
import * as booking from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES, VENDOR_ROLES } from '../constants/roles.js';

const router = Router();

router.use(protect);

router.post('/hotel', booking.createHotelBooking);
router.post('/tent', booking.createTentBooking);
router.post('/guide', booking.createGuideBooking);
router.post('/taxi', booking.createTaxiBooking);
router.post('/homestay', booking.createHomestayBooking);
router.post('/horse', booking.createHorseBooking);
router.post('/product', async (req, res) => {
  const { createProductOrder } = await import('../controllers/phase4Controller.js');
  return createProductOrder(req, res);
});
router.post('/combo', async (req, res) => {
  const { createComboBooking } = await import('../controllers/phase4Controller.js');
  return createComboBooking(req, res);
});
router.get('/my', booking.getMyBookings);
router.get('/vendor', authorize(...VENDOR_ROLES), booking.getVendorBookings);
router.get('/all', authorize(ROLES.SUPER_ADMIN, ROLES.OFFICE_STAFF_HOTEL), booking.getAllBookings);
router.get('/:id/invoice', booking.downloadInvoice);
router.patch('/:id/status', authorize(ROLES.SUPER_ADMIN, ...VENDOR_ROLES), booking.updateBookingStatus);

export default router;
