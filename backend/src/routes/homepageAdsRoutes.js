import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';
import * as ctrl from '../controllers/homepageAdsController.js';
import { trackAdEvent } from '../controllers/phase1bController.js';

const router = Router();

const adVendors = [ROLES.HOTEL_VENDOR, ROLES.HOMESTAY_VENDOR, ROLES.TENT_OPERATOR, ROLES.SUPER_ADMIN];

router.get('/homepage-hero', ctrl.getPublicHomepageHeroAds);
router.post('/:id/track', trackAdEvent);

router.use(protect);
router.get('/packages', authorize(...adVendors), ctrl.getVendorAdCatalog);
router.get('/mine', authorize(...adVendors), ctrl.getMyHomepageAds);
router.post('/order', authorize(...adVendors), ctrl.orderHomepageAd);
router.post('/confirm', authorize(...adVendors), ctrl.confirmHomepageAd);

export default router;
