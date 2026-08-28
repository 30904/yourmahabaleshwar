import { Router } from 'express';
import authRoutes from './authRoutes.js';
import hotelRoutes from './hotelRoutes.js';
import resortRoutes from './resortRoutes.js';
import tentRoutes from './tentRoutes.js';
import guideRoutes from './guideRoutes.js';
import driverRoutes from './driverRoutes.js';
import homestayRoutes from './homestayRoutes.js';
import horseRoutes from './horseRoutes.js';
import productRoutes from './productRoutes.js';
import comboRoutes from './comboRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import enquiryRoutes from './enquiryRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import adminRoutes from './adminRoutes.js';
import userRoutes from './userRoutes.js';
import searchRoutes from './searchRoutes.js';
import miscRoutes from './miscRoutes.js';
import staySubscriptionRoutes from './staySubscriptionRoutes.js';

const router = Router();

router.get('/health', (req, res) =>
  res.json({ success: true, message: 'YOURMAHABALESHWAR API is running' })
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/hotels', hotelRoutes);
router.use('/resorts', resortRoutes);
router.use('/tents', tentRoutes);
router.use('/guides', guideRoutes);
router.use('/drivers', driverRoutes);
router.use('/homestays', homestayRoutes);
router.use('/horses', horseRoutes);
router.use('/products', productRoutes);
router.use('/combos', comboRoutes);
router.use('/bookings', bookingRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/search', searchRoutes);
router.use('/stay-subscriptions', staySubscriptionRoutes);
router.use('/', miscRoutes);

export default router;
