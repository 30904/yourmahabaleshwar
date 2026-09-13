import { Router } from 'express';
import * as booking from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES, VENDOR_ROLES, STAFF_ROLES } from '../constants/roles.js';

const staffAndAdmin = [ROLES.SUPER_ADMIN, ...STAFF_ROLES];

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
router.get('/vendor/open', authorize(...VENDOR_ROLES), booking.getOpenServiceBookings);
router.get('/all', authorize(...staffAndAdmin), booking.getAllBookings);
router.patch('/:id/assign', authorize(ROLES.SUPER_ADMIN), booking.assignVendorToBooking);
router.patch('/:id/accept', authorize(...VENDOR_ROLES), booking.acceptOpenServiceBooking);
router.patch('/:id/vendor-arrived', authorize(...VENDOR_ROLES), booking.vendorMarkArrived);
router.patch('/:id/confirm-arrival', booking.confirmServiceArrival);
router.patch('/:id/propose-end', authorize(...VENDOR_ROLES), booking.vendorProposeEnd);
router.patch('/:id/confirm-end', booking.confirmServiceEnd);
/** @deprecated aliases */
router.patch('/:id/guide-reached', booking.confirmServiceArrival);
router.patch('/:id/end-guide', booking.confirmServiceEnd);
router.get('/vendor/monetization-gate', authorize(...VENDOR_ROLES), booking.getVendorMonetizationGate);
router.get('/:id/invoice', booking.downloadInvoice);
router.patch('/:id/status', authorize(ROLES.SUPER_ADMIN, ...VENDOR_ROLES), booking.updateBookingStatus);

export default router;
