import { Router } from 'express';
import * as svc from '../controllers/serviceMonetizationController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES, VENDOR_ROLES } from '../constants/roles.js';
import { isServiceTenantRole, serviceTenantForRole } from '../constants/serviceMonetization.js';

const router = Router();
const serviceVendors = VENDOR_ROLES.filter((role) =>
  ['GUIDE', 'TAXI_OPERATOR', 'DRIVER', 'TENT_OPERATOR', 'HORSE_OPERATOR'].includes(role)
);

router.use(protect);

router.get('/me', authorize(...serviceVendors, ROLES.SUPER_ADMIN), svc.getMyServiceMonetization);
router.post('/points/order', authorize(...serviceVendors), svc.orderPointsRecharge);
router.post('/points/confirm', authorize(...serviceVendors), svc.confirmPointsRechargePayment);
router.post('/unlimited/order', authorize(...serviceVendors), svc.orderUnlimitedMonthly);
router.post('/unlimited/confirm', authorize(...serviceVendors), svc.confirmUnlimitedMonthlyPayment);

export default router;
